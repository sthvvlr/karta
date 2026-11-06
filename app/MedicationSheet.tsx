"use client";

import { useCallback, useState } from "react";
import { ArrowUpLeft, Pencil, Pill, Plus } from "lucide-react";
import { addMedication } from "@/app/actions";
import { useKartaLanguage } from "@/app/LanguageRuntime";
import { MedicationPicker } from "@/app/MedicationPicker";
import type { MedicationCatalogEntry } from "@/app/MedicationPicker";
import { MedicationSchedulePicker } from "@/app/MedicationSchedulePicker";

export type MedicationDraft = {
  id: string;
  name: string;
  drugCode: string | null;
  dosage: string | null;
  frequency: string | null;
  timeSlots: string | null;
  mealRelation: string | null;
  endDate: string | null;
  notes: string | null;
};

const input: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  padding: "12px 14px",
  border: "1px solid rgba(186,200,255,.42)",
  borderRadius: 13,
  background: "rgba(244,246,255,.82)",
  color: "#1A2050",
  fontSize: 16,
};

export function MedicationSheet({ med, primary = false, initialOpen = false }: { med?: MedicationDraft; primary?: boolean; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [mealRelation, setMealRelation] = useState(med?.mealRelation || "any");
  const [isIndefinite, setIsIndefinite] = useState(!med?.endDate);
  const [nameError, setNameError] = useState(false);
  const [medicationSuggestions, setMedicationSuggestions] = useState<MedicationCatalogEntry[]>([]);
  const [selectMedicationSuggestion, setSelectMedicationSuggestion] = useState<((item: MedicationCatalogEntry) => void) | null>(null);
  const en = useKartaLanguage() === "en";
  const receiveMedicationSuggestions = useCallback((items: MedicationCatalogEntry[], select: (item: MedicationCatalogEntry) => void) => {
    setMedicationSuggestions(items);
    setSelectMedicationSuggestion(() => select);
  }, []);
  function close() { setOpen(false); setNameError(false); setMedicationSuggestions([]); }
  const mealOptions = [
    { value: "any", ru: "Неважно", en: "Any time" },
    { value: "before", ru: "До еды", en: "Before meal" },
    { value: "after", ru: "После еды", en: "After meal" },
    { value: "during", ru: "Во время еды", en: "With meal" },
  ];

  return <>
    <button type="button" onClick={() => { setNameError(false); setOpen(true); }} aria-label={en ? (med ? `Edit ${med.name}` : "Add medication") : (med ? `Изменить ${med.name}` : "Добавить лекарство")} style={primary ? { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 42, padding: "0 16px", border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, boxShadow: "0 4px 10px rgba(92,124,250,.24)" } : med ? { display: "grid", placeItems: "center", width: 30, height: 30, padding: 0, border: 0, borderRadius: 9, background: "transparent", color: "rgba(26,32,80,.48)" } : { display: "grid", placeItems: "center", width: 36, height: 36, padding: 0, border: 0, borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", boxShadow: "0 4px 10px rgba(92,124,250,.24)" }}>
      {primary ? <><Plus size={18} />{en ? "Add medication" : "Добавить лекарство"}</> : med ? <Pencil size={14} /> : <Plus size={18} />}
    </button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby="medication-sheet-title" style={{ width: "min(100%, 430px)", height: "min(94dvh, 780px)", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,.8)", borderBottom: 0, borderRadius: "16px 16px 0 0", background: "#F4F6FF", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: "#1A2050" }}>
        <header style={{ height: 44, flex: "0 0 44px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 16px", borderBottom: "1px solid rgba(26,32,80,.08)", background: "rgba(250,251,255,.98)" }}>
          <button type="button" onClick={close} style={{ justifySelf: "start", padding: "6px 0", border: 0, background: "transparent", color: "#5C7CFA", fontSize: 15 }}>{en ? "Cancel" : "Отмена"}</button>
          <h2 id="medication-sheet-title" style={{ margin: 0, fontSize: 16, fontWeight: 650, textAlign: "center", whiteSpace: "nowrap" }}>{med ? (en ? "Edit medication" : "Редактировать") : (en ? "Add medication" : "Добавить лекарство")}</h2>
          <button type="submit" form="medication-form" style={{ justifySelf: "end", padding: "6px 0", border: 0, background: "transparent", color: "#5C7CFA", fontSize: 15, fontWeight: 650 }}>{en ? "Save" : "Сохранить"}</button>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 16px calc(20px + env(safe-area-inset-bottom))" }}>
        <form id="medication-form" action={addMedication} onSubmit={(event) => { const name = String(new FormData(event.currentTarget).get("name") || "").trim(); if (!name) { event.preventDefault(); setNameError(true); return; } setNameError(false); setMedicationSuggestions([]); setOpen(false); }} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, minWidth: 0, textAlign: "left" }}>
          {med && <input type="hidden" name="id" value={med.id} />}
          <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 0, minWidth: 0, padding: 0, borderRadius: 14, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)", overflow: "hidden" }}>
            <div style={{ minWidth: 0, paddingTop: 12 }}>
              <div style={{ padding: "0 16px 4px", color: "rgba(26,32,80,.48)", fontSize: 11, fontWeight: 500 }}>{en ? "Name" : "Название"}<span style={{ color: "#E03131" }}> *</span></div>
              <MedicationPicker label={en ? "Name" : "Название"} initialName={med?.name || ""} initialCode={med?.drugCode || ""} nameError={nameError} onNameChange={() => setNameError(false)} onSuggestionsChange={receiveMedicationSuggestions} renderSuggestions={false} />
              {nameError && <div role="alert" style={{ padding: "0 16px 8px", color: "#E03131", fontSize: 11 }}>{en ? "Enter a medication name" : "Введите название лекарства"}</div>}
            </div>
            <div style={{ height: 1, background: "rgba(26,32,80,.08)", margin: "0 16px" }} />
            <label style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", minWidth: 0, gap: 4, padding: "10px 16px 12px", color: "rgba(26,32,80,.48)", fontSize: 11, fontWeight: 500 }}>{en ? "Dosage" : "Дозировка"}<input name="dosage" defaultValue={med?.dosage || ""} placeholder={en ? "e.g. 400 mg, 1 tablet" : "Например, 400 мг, 1 таблетка"} style={{ ...input, minHeight: 28, padding: "0", border: 0, background: "transparent", color: "#1A2050", fontSize: 15 }} /></label>
          </section>
          {medicationSuggestions.length > 0 && <section style={{ marginTop: -12, padding: 12, borderRadius: 14, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
            {medicationSuggestions.map((item, index) => <button type="button" key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectMedicationSuggestion?.(item)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 4px", border: 0, borderBottom: index < medicationSuggestions.length - 1 ? "1px solid rgba(26,32,80,.08)" : 0, background: "white", color: "#1A2050", textAlign: "left" }}>
              <Pill size={14} color="rgba(92,124,250,.55)" />
              <span style={{ flex: 1, fontSize: 14 }}>{en ? item.en : item.ru}</span>
              <ArrowUpLeft size={12} color="rgba(26,32,80,.35)" />
            </button>)}
          </section>}
          <MedicationSchedulePicker initialFrequency={med?.frequency || "daily"} initialSchedule={med?.timeSlots || ""} />
          <section>
            <div style={{ margin: "0 4px 7px", color: "rgba(26,32,80,.48)", fontSize: 10, fontWeight: 750, letterSpacing: ".06em" }}>{en ? "RELATIVE TO MEALS" : "ОТНОСИТЕЛЬНО ЕДЫ"}</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 12px", borderRadius: 14, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <input type="hidden" name="mealRelation" value={mealRelation} />
              {mealOptions.map((item) => <button type="button" key={item.value} aria-pressed={mealRelation === item.value} onClick={() => setMealRelation(item.value)} style={{ flexShrink: 0, padding: "8px 14px", border: 0, borderRadius: 99, background: mealRelation === item.value ? "#5C7CFA" : "rgba(92,124,250,.08)", color: mealRelation === item.value ? "white" : "#5C7CFA", fontSize: 13, fontWeight: 550 }}>{en ? item.en : item.ru}</button>)}
            </div>
          </section>
          <section>
            <div style={{ margin: "0 4px 7px", color: "rgba(26,32,80,.48)", fontSize: 10, fontWeight: 750, letterSpacing: ".06em" }}>{en ? "DURATION" : "ДЛИТЕЛЬНОСТЬ"}</div>
            <div style={{ overflow: "hidden", borderRadius: 14, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", color: "#1A2050", fontSize: 14 }}>{en ? "Indefinite" : "Бессрочно"}<span style={{ flex: 1 }} /><button type="button" role="switch" aria-checked={isIndefinite} aria-label={en ? "Indefinite duration" : "Бессрочный приём"} onClick={() => setIsIndefinite((current) => !current)} style={{ width: 42, height: 26, padding: 3, border: 0, borderRadius: 99, background: isIndefinite ? "#5C7CFA" : "rgba(26,32,80,.18)", flexShrink: 0 }}><span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.18)", transform: isIndefinite ? "translateX(16px)" : "translateX(0)", transition: "transform .18s" }} /></button></div>
              {!isIndefinite && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: "1px solid rgba(26,32,80,.08)", color: "#1A2050", fontSize: 14 }}><span style={{ flex: 1 }}>{en ? "Take until" : "Принимать до"}</span><input name="endDate" defaultValue={med?.endDate || ""} type="date" min={localToday()} required style={{ width: 145, padding: "7px 8px", border: "1px solid rgba(186,200,255,.4)", borderRadius: 8, background: "rgba(244,246,255,.8)", fontSize: 16, color: "#1A2050" }} /></div>}
            </div>
          </section>
          <section>
            <div style={{ margin: "0 4px 7px", color: "rgba(26,32,80,.48)", fontSize: 10, fontWeight: 750, letterSpacing: ".06em" }}>{en ? "NOTES (OPTIONAL)" : "ЗАМЕТКИ (НЕОБЯЗАТЕЛЬНО)"}</div>
            <div style={{ borderRadius: 14, background: "white", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}><textarea name="notes" defaultValue={med?.notes || ""} placeholder={en ? "e.g. take with a full glass of water" : "Например, запить стаканом воды"} rows={2} style={{ ...input, minHeight: 58, border: 0, borderRadius: 14, background: "transparent", resize: "vertical" }} /></div>
          </section>
        </form>
        </div>
      </section>
    </div>}
  </>;
}

function localToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
