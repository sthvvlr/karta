"use client";

import { useState } from "react";
import { Baby, CalendarDays, ChevronRight, Info, Lightbulb, Pencil, Syringe, Trash2, UserRound, X } from "lucide-react";
import { addVaccination, deleteVaccination, updateVaccination } from "@/app/actions";
import { readVaccinationMetadata } from "@/app/vaccination-record";
import { useKartaLanguage } from "@/app/LanguageRuntime";
import { VaccinationRecordDateField } from "@/app/VaccinationRecordDateField";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import type { VaccineForTasks } from "@/app/tasks";

type Record = { id: string; vaccineId: string; dateGiven: string | null; doseNumber: number; brand: string | null; clinic: string | null; notes: string | null };
type Vaccine = { id: string; nameRu: string; nameEn?: string | null; totalDoses?: number | null; doseScheduleDays?: number[] | null; frequencyType?: string | null; intervalYears?: number | null };
const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.76)", border: "rgba(255,255,255,.92)", primary: "#5C7CFA" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: C.text };

export function VaccinationHistory({ records, vaccines, catalogDetails, region, brands }: { records: Record[]; vaccines: Vaccine[]; catalogDetails: VaccineForTasks[]; region?: string; brands: string[] }) {
  const en = useKartaLanguage() === "en";
  const [selected, setSelected] = useState<Record | null>(null);
  const [editing, setEditing] = useState(false);
  const catalog = new Map(vaccines.map((vaccine) => [vaccine.id, vaccine]));
  const detailsCatalog = new Map(catalogDetails.map((vaccine) => [vaccine.id, vaccine]));
  const sorted = records.slice().sort((a, b) => (b.dateGiven || "").localeCompare(a.dateGiven || ""));

  if (!sorted.length) return <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>{en ? "No records yet. Add your first vaccination below." : "Пока нет записей. Добавьте первую прививку ниже."}</div>;
  return <>
    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>{sorted.map((record) => {
      const metadata = readVaccinationMetadata(record.notes);
      const vaccine = catalog.get(record.vaccineId);
      const title = metadata.name || (en ? vaccine?.nameEn : vaccine?.nameRu) || record.vaccineId;
      const date = metadata.dateString || record.dateGiven || (en ? "Date not specified" : "Дата не указана");
      const totalDoses = metadata.totalDoses || vaccine?.totalDoses || 0;
      const progressColor = totalDoses && record.doseNumber < totalDoses ? C.primary : "#0CA678";
      return <button type="button" key={record.id} onClick={() => { setSelected(record); setEditing(false); }} aria-label={`${title}, ${date}`} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, color: C.text, textAlign: "left" }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, flex: "0 0 7px", borderRadius: "50%", background: "#20C997", boxShadow: "0 0 7px rgba(32,201,151,.4)" }} />
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 650 }}>{title}</span><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10 }}>{date}{totalDoses > 0 ? ` · ${record.doseNumber}/${totalDoses}` : ""}{record.brand ? ` · ${record.brand}` : ""}</span></span>
        {totalDoses > 0 ? <span style={{ padding: "3px 8px", borderRadius: 99, border: `1px solid ${progressColor}33`, background: `${progressColor}1A`, color: progressColor, fontSize: 10, fontWeight: 650, whiteSpace: "nowrap" }}>{record.doseNumber}/{totalDoses}</span> : <span style={{ color: "#20C997", fontSize: 15 }}>✓</span>}
        <ChevronRight size={13} color="rgba(26,32,80,.3)" />
      </button>;
    })}</div>
    {selected && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setEditing(false); } }} style={overlay}>
      <section role="dialog" aria-modal="true" aria-label={en ? "Vaccination details" : "Данные о прививке"} style={{ ...sheet, padding: detailsCatalog.has(selected.vaccineId) && !editing ? "0 0 calc(24px + env(safe-area-inset-bottom))" : sheet.padding }}>
        {detailsCatalog.has(selected.vaccineId) && !editing ? <>
          <div style={{ height: 4, width: 38, margin: "10px auto 14px", borderRadius: 99, background: "rgba(26,32,80,.18)" }} />
          <VaccineDetailHeader vaccine={detailsCatalog.get(selected.vaccineId)!} region={region} title={readVaccinationMetadata(selected.notes).name || (en ? catalog.get(selected.vaccineId)?.nameEn : catalog.get(selected.vaccineId)?.nameRu) || selected.vaccineId} en={en} onClose={() => { setSelected(null); setEditing(false); }} onEdit={() => setEditing(true)} />
        </> : <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}><button type="button" onClick={() => { setSelected(null); setEditing(false); }} aria-label={en ? "Close" : "Закрыть"} style={iconButton}><X size={18} /></button><h2 style={{ flex: 1, margin: 0, textAlign: "center", fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{readVaccinationMetadata(selected.notes).name || (en ? catalog.get(selected.vaccineId)?.nameEn : catalog.get(selected.vaccineId)?.nameRu) || selected.vaccineId}</h2>{!editing && <button type="button" onClick={() => setEditing(true)} aria-label={en ? "Edit vaccination" : "Изменить прививку"} style={{ ...iconButton, color: C.primary }}><Pencil size={16} /></button>}</header>}
        {editing ? <EditVaccinationForm record={selected} vaccine={catalog.get(selected.vaccineId)} vaccines={vaccines} brands={brands} en={en} onSaved={() => { setEditing(false); setSelected(null); }} /> : <div style={detailsCatalog.has(selected.vaccineId) ? { padding: 20 } : undefined}><VaccinationDetails record={selected} vaccine={catalog.get(selected.vaccineId)} catalogVaccine={detailsCatalog.get(selected.vaccineId)} region={region} doneDoses={records.filter((item) => item.vaccineId === selected.vaccineId).length} firstDoseDate={records.filter((item) => item.vaccineId === selected.vaccineId && item.doseNumber === 1).sort((a, b) => (a.dateGiven || "").localeCompare(b.dateGiven || ""))[0]?.dateGiven || ""} brands={brands} en={en} onClose={() => setSelected(null)} /></div>}
      </section>
    </div>}
  </>;
}

function VaccineDetailHeader({ vaccine, region, title, en, onClose, onEdit }: { vaccine: VaccineForTasks; region?: string; title: string; en: boolean; onClose: () => void; onEdit: () => void }) {
  const local = region ? vaccine.regions?.[region] : undefined;
  const frequencyType = local?.frequencyType || vaccine.frequencyType;
  const intervalYears = local?.intervalYears ?? vaccine.intervalYears;
  const frequency = frequencyType === "recurring"
    ? intervalYears ? (en ? `every ${intervalYears} years` : `каждые ${intervalYears} лет`) : (en ? "repeat" : "повторно")
    : frequencyType === "annual" ? (en ? "annual" : "ежегодно")
      : frequencyType === "once_plus_pregnancy" ? (en ? "once + pregnancy" : "однократно + беременность")
        : en ? "once" : "однократно";
  const tags: Record<string, { label: [string, string]; color: string }> = {
    pregnancy: { label: ["беременность", "pregnancy"], color: "#EC4899" },
    infant_contact: { label: ["младенцы", "infants"], color: "#F59E0B" },
    travel: { label: ["путешествия", "travel"], color: "#06B6D4" },
    "60plus": { label: ["60+", "60+"], color: "#8B5CF6" },
  };
  return <header style={{ minHeight: 160, boxSizing: "border-box", padding: 20, background: "linear-gradient(135deg,rgba(92,124,250,.15),rgba(116,207,250,.08))" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 14, color: C.primary, background: "rgba(92,124,250,.12)" }}><Syringe size={22} /></span><span style={{ flex: 1 }} /><button type="button" onClick={onEdit} aria-label={en ? "Edit vaccination" : "Изменить прививку"} style={{ ...iconButton, color: C.primary }}><Pencil size={16} /></button><button type="button" onClick={onClose} aria-label={en ? "Close" : "Закрыть"} style={iconButton}><X size={16} /></button></div>
    <h2 style={{ margin: "12px 0 9px", color: C.text, fontSize: 22, lineHeight: 1.2, fontWeight: 750 }}>{title}</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><span style={{ padding: "4px 8px", borderRadius: 99, color: C.primary, background: "rgba(92,124,250,.09)", fontSize: 10, fontWeight: 700 }}>{frequency}</span>{(vaccine.tags || []).slice(0, 3).map((tag) => { const style = tags[tag]; return <span key={tag} style={{ padding: "4px 8px", borderRadius: 99, color: style?.color || C.muted, background: style ? `${style.color}1A` : "rgba(26,32,80,.08)", fontSize: 10, fontWeight: 600 }}>{style?.label[en ? 1 : 0] || tag}</span>; })}</div>
  </header>;
}

function VaccinationDetails({ record, vaccine, catalogVaccine, region, doneDoses, firstDoseDate, brands, en, onClose }: { record: Record; vaccine?: Vaccine; catalogVaccine?: VaccineForTasks; region?: string; doneDoses: number; firstDoseDate: string; brands: string[]; en: boolean; onClose: () => void }) {
  const [markingNextDose, setMarkingNextDose] = useState(false);
  const metadata = readVaccinationMetadata(record.notes);
  const details = [[en ? "Date" : "Дата", metadata.dateString || record.dateGiven || (en ? "Not specified" : "Не указана")], [en ? "Dose" : "Доза", `${record.doseNumber}${metadata.totalDoses && metadata.totalDoses > 1 ? ` / ${metadata.totalDoses}` : vaccine?.totalDoses && vaccine.totalDoses > 1 ? ` / ${vaccine.totalDoses}` : ""}`], [en ? "Product / brand" : "Препарат / бренд", record.brand], [en ? "Clinic" : "Клиника", record.clinic], [en ? "Next dose" : "Следующая доза", metadata.nextDue], [en ? "Notes" : "Заметки", metadata.userNotes]] as const;
  const totalDoses = metadata.totalDoses || vaccine?.totalDoses || 1;
  const nextDoseNumber = doneDoses + 1;
  const canMarkNextDose = Boolean(vaccine && totalDoses > 1 && doneDoses < totalDoses);
  const firstDoseISO = /^\d{4}-\d{2}-\d{2}$/.test(firstDoseDate) ? firstDoseDate : "";
  const regional = region ? catalogVaccine?.regions?.[region] : undefined;
  const info = [
    [en ? "About" : "О вакцине", en ? catalogVaccine?.descriptionEn || catalogVaccine?.descriptionRu : catalogVaccine?.descriptionRu],
    [en ? "Who should vaccinate" : "Кому делать", en ? regional?.whoEn || catalogVaccine?.whoEn || regional?.whoRu || catalogVaccine?.whoRu : regional?.whoRu || catalogVaccine?.whoRu],
    [en ? "Vaccination schedule" : "Схема вакцинации", en ? regional?.scheduleEn || catalogVaccine?.scheduleEn || regional?.scheduleRu || catalogVaccine?.scheduleRu : regional?.scheduleRu || catalogVaccine?.scheduleRu],
    [en ? "Important" : "Важно знать", en ? regional?.noteEn || catalogVaccine?.noteEn || regional?.noteRu || catalogVaccine?.noteRu : regional?.noteRu || catalogVaccine?.noteRu],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const disclaimer = en ? regional?.disclaimerEn || catalogVaccine?.disclaimerEn || regional?.disclaimerRu || catalogVaccine?.disclaimerRu : regional?.disclaimerRu || catalogVaccine?.disclaimerRu;
  const pregnancyNote = catalogVaccine?.pregnancyRelevant ? (en ? catalogVaccine.pregnancyNoteEn || catalogVaccine.pregnancyNoteRu : catalogVaccine.pregnancyNoteRu) : null;
  const infantNote = (catalogVaccine?.tags || []).includes("infant_contact") ? (en ? catalogVaccine?.infantContactNoteEn || catalogVaccine?.infantContactNoteRu : catalogVaccine?.infantContactNoteRu) : null;
  const visibleDetails = details.filter(([, value]) => Boolean(value));
  return <>
    {catalogVaccine && <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
      {info.map(([title, body], index) => { const Icon = [Info, UserRound, CalendarDays, Lightbulb][index]; return <section key={title} style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 9, fontSize: 12, lineHeight: 1.5 }}><span style={{ display: "grid", placeItems: "start center", paddingTop: 2, color: C.primary }}><Icon size={15} /></span><div><div style={{ marginBottom: 4, color: C.muted, fontSize: 10, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase" }}>{title}</div><div style={{ color: C.text }}>{body}</div></div></section>; })}
      {disclaimer && <div style={{ padding: 13, borderRadius: 13, border: "1px solid rgba(217,119,6,.16)", background: "rgba(245,158,11,.08)", color: "#805A10", fontSize: 12, lineHeight: 1.5 }}><b>{en ? "Please note" : "Обратите внимание"}</b><div style={{ marginTop: 4 }}>{disclaimer}</div></div>}
      {pregnancyNote && <section style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 9, fontSize: 12, lineHeight: 1.5 }}><span style={{ color: "#EC4899", textAlign: "center" }}>♡</span><div><div style={{ marginBottom: 4, color: C.muted, fontSize: 10, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase" }}>{en ? "Pregnancy" : "Беременность"}</div><div>{pregnancyNote}</div></div></section>}
      {infantNote && <section style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 9, fontSize: 12, lineHeight: 1.5 }}><span style={{ color: "#D97706", textAlign: "center" }}><Baby size={15} /></span><div><div style={{ marginBottom: 4, color: C.muted, fontSize: 10, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase" }}>{en ? "Infant contact" : "Если рядом младенец"}</div><div>{infantNote}</div></div></section>}
      {catalogVaccine.requiresEndemicCheck && <details style={{ border: "1px solid rgba(186,200,255,.36)", borderRadius: 14, background: "rgba(255,255,255,.75)" }}><summary style={{ display: "flex", alignItems: "center", gap: 8, padding: 13, cursor: "pointer", listStyle: "none", color: C.muted, fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase" }}>{en ? "Endemic regions" : "Эндемичные регионы"}<span style={{ marginLeft: "auto" }}>⌄</span></summary><div style={{ display: "grid", gap: 10, padding: "0 13px 14px", fontSize: 12, lineHeight: 1.4 }}><div><b>{en ? "High risk" : "Высокий риск"}</b><div>{en ? "Estonia, Latvia, Lithuania, Austria, Czechia, Slovenia, Slovakia" : "Эстония, Латвия, Литва, Австрия, Чехия, Словения, Словакия"}</div></div><div><b>{en ? "Moderate risk" : "Умеренный риск"}</b><div>{en ? "Germany, Switzerland, Sweden, Finland, Poland, Hungary, Croatia, Belarus, Ukraine" : "Германия, Швейцария, Швеция, Финляндия, Польша, Венгрия, Хорватия, Беларусь, Украина"}</div></div><div><b>{en ? "Russia (high/moderate)" : "Россия (высокий/умеренный риск)"}</b><div>{en ? "Urals, Siberia, Far East, Volga region, North-West Russia" : "Урал, Сибирь, Дальний Восток, Поволжье, Северо-Западный регион"}</div></div><div><b>{en ? "Moderate risk" : "Умеренный риск"}</b><div>{en ? "Northeastern China, Mongolia, Kazakhstan" : "Северо-восточный Китай, Монголия, Казахстан"}</div></div><div><b>{en ? "Low risk" : "Низкий риск"}</b><div>{en ? "Japan: Hokkaido only" : "Япония: только Хоккайдо"}</div></div></div></details>}
    </div>}
    {catalogVaccine && <div style={{ marginBottom: 10, color: C.muted, fontSize: 10, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase" }}>{en ? "Vaccination record" : "Запись о прививке"}</div>}
    <div style={{ overflow: "hidden", borderRadius: 14, background: "white", border: "1px solid rgba(26,32,80,.04)" }}>{visibleDetails.map(([label, value], index) => <div key={label} style={{ padding: "12px 13px", borderBottom: index < visibleDetails.length - 1 ? "1px solid rgba(26,32,80,.07)" : 0 }}><div style={{ color: C.muted, fontSize: 10 }}>{label}</div><div style={{ marginTop: 3, fontSize: 14 }}>{value}</div></div>)}</div>
    {catalogVaccine && doneDoses >= totalDoses && <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "rgba(32,201,151,.08)", color: C.text, fontSize: 13, fontWeight: 650 }}>✓ {en ? "Course complete — added to passport" : "Курс завершён — добавлено в паспорт"}</div>}
    {canMarkNextDose && vaccine && <section style={{ marginTop: 14, padding: 13, borderRadius: 14, background: "rgba(92,124,250,.06)", border: "1px solid rgba(92,124,250,.12)" }}>
      {totalDoses > 1 && <><div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}><span>{en ? "Course progress" : "Прогресс курса"}</span><span>{en ? `${doneDoses} of ${totalDoses} doses` : `${doneDoses} из ${totalDoses} доз`}</span></div><div style={{ display: "flex", gap: 4, marginBottom: 12 }}>{Array.from({ length: totalDoses }, (_, index) => <span key={index} style={{ height: 6, flex: 1, borderRadius: 4, background: index < doneDoses ? "linear-gradient(135deg,#748FFC,#5C7CFA)" : "rgba(26,32,80,.14)" }} />)}</div></>}
      {!markingNextDose ? <button type="button" onClick={() => setMarkingNextDose(true)} style={{ width: "100%", minHeight: 44, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 13, fontWeight: 700 }}>{en ? `Mark dose ${nextDoseNumber} as done` : `Отметить ${nextDoseNumber}-ю дозу как сделанную`}</button> : <form action={async (formData) => { await addVaccination(formData); onClose(); }} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, minWidth: 0 }}>
        <input type="hidden" name="vaccineId" value={vaccine.id} /><input type="hidden" name="doseNumber" value={nextDoseNumber} /><input type="hidden" name="totalDoses" value={totalDoses} />
        <VaccinationDateInput initialDate={localToday()} maxDate={localToday()} doseNumber={nextDoseNumber} totalDoses={totalDoses} doseScheduleDays={vaccine.doseScheduleDays || []} firstDoseDate={firstDoseISO} frequencyType={vaccine.frequencyType || ""} intervalYears={vaccine.intervalYears} style={input} />
        <input name="brand" list={`next-dose-brands-${vaccine.id}`} placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><datalist id={`next-dose-brands-${vaccine.id}`}>{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>
        <input name="clinic" placeholder={en ? "Clinic" : "Клиника"} style={input} />
        <button type="submit" style={{ padding: 11, border: 0, borderRadius: 11, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 13, fontWeight: 700 }}>{en ? "Save completed dose" : "Сохранить выполненную дозу"}</button>
        <button type="button" onClick={() => setMarkingNextDose(false)} style={{ padding: 9, border: 0, background: "transparent", color: C.muted, fontSize: 12 }}>{en ? "Cancel" : "Отмена"}</button>
      </form>}
    </section>}
    <form action={async (formData) => { if (window.confirm(en ? "Delete this vaccination record?" : "Удалить эту запись о прививке?")) { await deleteVaccination(formData); onClose(); } }} style={{ marginTop: 16 }}><input type="hidden" name="id" value={record.id} /><button type="submit" style={{ width: "100%", padding: 12, border: 0, borderRadius: 12, background: "rgba(224,49,49,.08)", color: "#E03131", fontSize: 14, fontWeight: 600 }}><Trash2 size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />{en ? "Delete record" : "Удалить запись"}</button></form></>;
}

function EditVaccinationForm({ record, vaccine, vaccines, brands, en, onSaved }: { record: Record; vaccine?: Vaccine; vaccines: Vaccine[]; brands: string[]; en: boolean; onSaved: () => void }) {
  const metadata = readVaccinationMetadata(record.notes);
  return <form action={async (formData) => { await updateVaccination(formData); onSaved(); }} style={{ display: "grid", gap: 8 }}>
    <input type="hidden" name="id" value={record.id} />
    <select name="vaccineId" defaultValue={record.vaccineId.startsWith("custom:") ? "" : record.vaccineId} style={input}><option value="">{en ? "Custom vaccination" : "Своя прививка"}</option>{vaccines.map((item) => <option value={item.id} key={item.id}>{en ? item.nameEn || item.nameRu : item.nameRu}</option>)}</select>
    <input name="customName" defaultValue={record.vaccineId.startsWith("custom:") ? metadata.name || "" : ""} placeholder={en ? "Custom vaccination name" : "Название своей прививки"} style={input} />
    <VaccinationRecordDateField initialDate={metadata.dateDoneISO || (record.dateGiven?.length === 10 ? record.dateGiven : "")} initialMonth={metadata.dateMonthISO || (record.dateGiven?.length === 7 ? record.dateGiven : "")} initialLabel={metadata.dateString || ""} style={input} />
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
function localToday() { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`; }
