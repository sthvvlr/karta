"use client";

import { useState } from "react";
import { ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { deleteVaccination, updateVaccination } from "@/app/actions";
import { readVaccinationMetadata } from "@/app/vaccination-record";
import { useKartaLanguage } from "@/app/LanguageRuntime";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";

type Record = { id: string; vaccineId: string; dateGiven: string | null; doseNumber: number; brand: string | null; clinic: string | null; notes: string | null };
type Vaccine = { id: string; nameRu: string; nameEn?: string | null; totalDoses?: number | null; doseScheduleDays?: number[] | null; frequencyType?: string | null; intervalYears?: number | null };
const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.76)", border: "rgba(255,255,255,.92)", primary: "#5C7CFA" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: C.text };

export function VaccinationHistory({ records, vaccines, brands }: { records: Record[]; vaccines: Vaccine[]; brands: string[] }) {
  const en = useKartaLanguage() === "en";
  const [selected, setSelected] = useState<Record | null>(null);
  const [editing, setEditing] = useState(false);
  const catalog = new Map(vaccines.map((vaccine) => [vaccine.id, vaccine]));
  const sorted = records.slice().sort((a, b) => (b.dateGiven || "").localeCompare(a.dateGiven || ""));

  if (!sorted.length) return <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>{en ? "No records yet. Add your first vaccination below." : "Пока нет записей. Добавьте первую прививку ниже."}</div>;
  return <>
    <div style={{ display: "grid", gap: 6 }}>{sorted.map((record) => {
      const metadata = readVaccinationMetadata(record.notes);
      const vaccine = catalog.get(record.vaccineId);
      const title = metadata.name || (en ? vaccine?.nameEn : vaccine?.nameRu) || record.vaccineId;
      const date = metadata.dateString || record.dateGiven || (en ? "Date not specified" : "Дата не указана");
      const totalDoses = metadata.totalDoses || vaccine?.totalDoses || 0;
      const progressColor = totalDoses && record.doseNumber < totalDoses ? C.primary : "#0CA678";
      return <button type="button" key={record.id} onClick={() => { setSelected(record); setEditing(false); }} aria-label={`${title}, ${date}`} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, color: C.text, textAlign: "left", marginBottom: 5 }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, flex: "0 0 7px", borderRadius: "50%", background: "#20C997", boxShadow: "0 0 7px rgba(32,201,151,.4)" }} />
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 650 }}>{title}</span><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10 }}>{date}{totalDoses > 0 ? ` · ${record.doseNumber}/${totalDoses}` : ""}{record.brand ? ` · ${record.brand}` : ""}</span></span>
        {totalDoses > 0 ? <span style={{ padding: "3px 8px", borderRadius: 99, border: `1px solid ${progressColor}33`, background: `${progressColor}1A`, color: progressColor, fontSize: 10, fontWeight: 650, whiteSpace: "nowrap" }}>{record.doseNumber}/{totalDoses}</span> : <span style={{ color: "#20C997", fontSize: 15 }}>✓</span>}
        <ChevronRight size={13} color="rgba(26,32,80,.3)" />
      </button>;
    })}</div>
    {selected && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setEditing(false); } }} style={overlay}>
      <section role="dialog" aria-modal="true" aria-label={en ? "Vaccination details" : "Данные о прививке"} style={sheet}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}><button type="button" onClick={() => { setSelected(null); setEditing(false); }} aria-label={en ? "Close" : "Закрыть"} style={iconButton}><X size={18} /></button><h2 style={{ flex: 1, margin: 0, textAlign: "center", fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{readVaccinationMetadata(selected.notes).name || (en ? catalog.get(selected.vaccineId)?.nameEn : catalog.get(selected.vaccineId)?.nameRu) || selected.vaccineId}</h2><button type="button" onClick={() => setEditing((value) => !value)} aria-label={en ? "Edit vaccination" : "Изменить прививку"} style={{ ...iconButton, color: C.primary }}><Pencil size={16} /></button></header>
        {editing ? <EditVaccinationForm record={selected} vaccine={catalog.get(selected.vaccineId)} vaccines={vaccines} brands={brands} en={en} onSaved={() => { setEditing(false); setSelected(null); }} /> : <VaccinationDetails record={selected} vaccine={catalog.get(selected.vaccineId)} en={en} onDeleted={() => setSelected(null)} />}
      </section>
    </div>}
  </>;
}

function VaccinationDetails({ record, vaccine, en, onDeleted }: { record: Record; vaccine?: Vaccine; en: boolean; onDeleted: () => void }) {
  const metadata = readVaccinationMetadata(record.notes);
  const details = [[en ? "Date" : "Дата", metadata.dateString || record.dateGiven || (en ? "Not specified" : "Не указана")], [en ? "Dose" : "Доза", `${record.doseNumber}${metadata.totalDoses && metadata.totalDoses > 1 ? ` / ${metadata.totalDoses}` : vaccine?.totalDoses && vaccine.totalDoses > 1 ? ` / ${vaccine.totalDoses}` : ""}`], [en ? "Product / brand" : "Препарат / бренд", record.brand], [en ? "Clinic" : "Клиника", record.clinic], [en ? "Next dose" : "Следующая доза", metadata.nextDue], [en ? "Notes" : "Заметки", metadata.userNotes]] as const;
  return <><div style={{ overflow: "hidden", borderRadius: 14, background: "white", border: "1px solid rgba(26,32,80,.04)" }}>{details.filter(([, value]) => Boolean(value)).map(([label, value], index) => <div key={label} style={{ padding: "12px 13px", borderBottom: index < details.filter(([, value]) => Boolean(value)).length - 1 ? "1px solid rgba(26,32,80,.07)" : 0 }}><div style={{ color: C.muted, fontSize: 10 }}>{label}</div><div style={{ marginTop: 3, fontSize: 14 }}>{value}</div></div>)}</div><form action={async (formData) => { if (window.confirm(en ? "Delete this vaccination record?" : "Удалить эту запись о прививке?")) { await deleteVaccination(formData); onDeleted(); } }} style={{ marginTop: 16 }}><input type="hidden" name="id" value={record.id} /><button type="submit" style={{ width: "100%", padding: 12, border: 0, borderRadius: 12, background: "rgba(224,49,49,.08)", color: "#E03131", fontSize: 14, fontWeight: 600 }}><Trash2 size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />{en ? "Delete record" : "Удалить запись"}</button></form></>;
}

function EditVaccinationForm({ record, vaccine, vaccines, brands, en, onSaved }: { record: Record; vaccine?: Vaccine; vaccines: Vaccine[]; brands: string[]; en: boolean; onSaved: () => void }) {
  const metadata = readVaccinationMetadata(record.notes);
  return <form action={async (formData) => { await updateVaccination(formData); onSaved(); }} style={{ display: "grid", gap: 8 }}>
    <input type="hidden" name="id" value={record.id} />
    <select name="vaccineId" defaultValue={record.vaccineId.startsWith("custom:") ? "" : record.vaccineId} style={input}><option value="">{en ? "Custom vaccination" : "Своя прививка"}</option>{vaccines.map((item) => <option value={item.id} key={item.id}>{en ? item.nameEn || item.nameRu : item.nameRu}</option>)}</select>
    <input name="customName" defaultValue={record.vaccineId.startsWith("custom:") ? metadata.name || "" : ""} placeholder={en ? "Custom vaccination name" : "Название своей прививки"} style={input} />
    <label style={labelStyle}>{en ? "Date vaccinated" : "Дата прививки"}<input name="dateGiven" type="date" defaultValue={metadata.dateDoneISO || record.dateGiven || ""} style={input} /></label>
    <label style={labelStyle}>{en ? "Next dose" : "Следующая доза"}<input name="nextDue" type="date" defaultValue={metadata.nextDue || ""} style={input} /></label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><label style={labelStyle}>{en ? "Dose" : "Доза №"}<input name="doseNumber" type="number" min="1" max="10" defaultValue={record.doseNumber} style={input} /></label><label style={labelStyle}>{en ? "Total doses" : "Всего доз"}<input name="totalDoses" type="number" min="1" max="10" defaultValue={metadata.totalDoses || vaccine?.totalDoses || 1} style={input} /></label></div>
    <input name="brand" list="edit-vaccine-brands" defaultValue={record.brand || ""} placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><datalist id="edit-vaccine-brands">{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>
    <input name="clinic" defaultValue={record.clinic || ""} placeholder={en ? "Clinic" : "Клиника"} style={input} /><textarea name="notes" defaultValue={metadata.userNotes || ""} placeholder={en ? "Notes" : "Заметки"} rows={2} style={{ ...input, resize: "vertical" }} />
    <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: C.primary, color: "white", fontSize: 14, fontWeight: 700 }}>{en ? "Save changes" : "Сохранить изменения"}</button>
  </form>;
}

const overlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" };
const sheet: React.CSSProperties = { width: "min(100%, 430px)", maxHeight: "92dvh", overflow: "auto", padding: "10px 18px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: C.text };
const iconButton: React.CSSProperties = { width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: C.text };
const labelStyle: React.CSSProperties = { display: "grid", gap: 5, color: C.text, fontSize: 12, fontWeight: 600 };
