"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { addMedication } from "@/app/actions";
import { useKartaLanguage } from "@/app/LanguageRuntime";
import { MedicationPicker } from "@/app/MedicationPicker";
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
  const en = useKartaLanguage() === "en";

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={en ? (med ? `Edit ${med.name}` : "Add medication") : (med ? `Изменить ${med.name}` : "Добавить лекарство")} style={primary ? { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 42, padding: "0 16px", border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, boxShadow: "0 4px 10px rgba(92,124,250,.24)" } : med ? { display: "grid", placeItems: "center", width: 30, height: 30, padding: 0, border: 0, borderRadius: 9, background: "transparent", color: "rgba(26,32,80,.48)" } : { display: "grid", placeItems: "center", width: 36, height: 36, padding: 0, border: 0, borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", boxShadow: "0 4px 10px rgba(92,124,250,.24)" }}>
      {primary ? <><Plus size={18} />{en ? "Add medication" : "Добавить лекарство"}</> : med ? <Pencil size={14} /> : <Plus size={18} />}
    </button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby="medication-sheet-title" style={{ width: "min(100%, 430px)", maxHeight: "90dvh", overflow: "auto", padding: "10px 20px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: "#1A2050" }}>
        <div style={{ width: 38, height: 4, margin: "0 auto 14px", borderRadius: 99, background: "rgba(26,32,80,.18)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><h2 id="medication-sheet-title" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{med ? (en ? "Edit medication" : "Изменить лекарство") : (en ? "Add medication" : "Добавить лекарство")}</h2><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: "#1A2050" }}><X size={18} /></button></div>
        <form action={addMedication} onSubmit={() => setOpen(false)} style={{ display: "grid", gap: 12 }}>
          {med && <input type="hidden" name="id" value={med.id} />}
          <section style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(186,200,255,.26)", borderRadius: 16, background: "rgba(255,255,255,.75)" }}><label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Medication name" : "Название лекарства"}<MedicationPicker initialName={med?.name || ""} initialCode={med?.drugCode || ""} /></label><label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Dosage" : "Дозировка"}<input name="dosage" defaultValue={med?.dosage || ""} placeholder={en ? "e.g. 400 mg, 1 tablet" : "Например, 400 мг, 1 таблетка"} style={input} /></label></section>
          <section style={{ display: "grid", gap: 9, padding: 12, border: "1px solid rgba(186,200,255,.26)", borderRadius: 16, background: "rgba(255,255,255,.75)" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{en ? "Schedule" : "Расписание приёма"}</div><MedicationSchedulePicker initialFrequency={med?.frequency || "daily"} initialSchedule={med?.timeSlots || ""} /></section>
          <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Relation to meals" : "Относительно еды"}<select name="mealRelation" defaultValue={med?.mealRelation || "any"} style={input}><option value="any">{en ? "Any time" : "Неважно"}</option><option value="before">{en ? "Before meal" : "До еды"}</option><option value="during">{en ? "With meal" : "Во время еды"}</option><option value="after">{en ? "After meal" : "После еды"}</option></select></label>
          <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Take until (optional)" : "Принимать до (необязательно)"}<input name="endDate" defaultValue={med?.endDate || ""} type="date" style={input} /></label>
          <textarea name="notes" defaultValue={med?.notes || ""} placeholder={en ? "Notes (optional)" : "Заметки (необязательно)"} rows={2} style={{ ...input, resize: "vertical" }} />
          <button type="submit" style={{ minHeight: 48, marginTop: 2, border: 0, borderRadius: 14, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 14, fontWeight: 700, boxShadow: "0 5px 14px rgba(92,124,250,.22)" }}>{med ? (en ? "Save changes" : "Сохранить изменения") : (en ? "Save medication" : "Сохранить лекарство")}</button>
        </form>
      </section>
    </div>}
  </>;
}
