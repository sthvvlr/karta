"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { addVaccination } from "@/app/actions";

type VaccineOption = { id: string; nameRu: string };

const field: React.CSSProperties = {
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

export function AddVaccinationSheet({ vaccines, brands }: { vaccines: VaccineOption[]; brands: string[] }) {
  const [open, setOpen] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const en = language === "en";

  useEffect(() => {
    if (document.cookie.split(";").some((value) => value.trim() === "karta_lang=en")) setLanguage("en");
  }, []);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={en ? "Add vaccination" : "Добавить прививку"} style={{ width: 36, height: 36, border: 0, borderRadius: 10, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 24, lineHeight: 1, boxShadow: "0 4px 12px rgba(92,124,250,.25)" }}>+</button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-vaccination-title" style={{ width: "min(100%, 430px)", maxHeight: "90dvh", overflow: "auto", padding: "10px 20px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: "#1A2050" }}>
        <div style={{ width: 38, height: 4, margin: "0 auto 14px", borderRadius: 99, background: "rgba(26,32,80,.18)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><h2 id="add-vaccination-title" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{en ? "Add vaccination" : "Добавить прививку"}</h2><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: "#1A2050" }}><X size={18} /></button></div>
        <form action={addVaccination} onSubmit={() => setOpen(false)} style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Vaccine name" : "Название прививки"}<input name="customName" placeholder={en ? "Measles, flu, COVID-19…" : "Корь, грипп, COVID-19…"} style={field} /></label>
          <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Or choose from the catalog" : "Или выберите из справочника"}<select name="vaccineId" defaultValue="" style={field}><option value="">{en ? "Select a vaccine" : "Выбрать вакцину"}</option>{vaccines.map((vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.nameRu}</option>)}</select></label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 46, padding: "0 12px", border: "1px solid rgba(186,200,255,.42)", borderRadius: 13, background: "rgba(244,246,255,.62)", fontSize: 13 }}><input type="checkbox" value="true" checked={planned} onChange={(event) => setPlanned(event.target.checked)} name="isUpcoming" style={{ width: 18, height: 18, accentColor: "#5C7CFA" }} />{en ? "Scheduled (not done yet)" : "Запланирована (ещё не сделана)"}</label>
          {!planned && <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Date vaccinated" : "Дата прививки"}<input required name="dateGiven" type="date" style={field} /></label>}
          {planned && <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Planned date (optional)" : "Плановая дата (необязательно)"}<input name="nextDue" type="date" style={field} /></label>}
          {!planned && <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Next booster due (optional)" : "Следующая ревакцинация (необязательно)"}<input name="nextDue" type="date" style={field} /></label>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Dose number" : "Номер дозы"}<input name="doseNumber" type="number" min="1" max="10" defaultValue="1" style={field} /></label><label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>{en ? "Total doses" : "Всего доз"}<input name="totalDoses" type="number" min="1" max="10" defaultValue="1" style={field} /></label></div>
          <input name="brand" list="sheet-vaccine-brands" placeholder={en ? "Vaccine / brand" : "Препарат / бренд"} style={field} />
          <datalist id="sheet-vaccine-brands">{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>
          <input name="clinic" placeholder={en ? "Clinic" : "Клиника"} style={field} />
          <textarea name="notes" placeholder={en ? "Notes" : "Заметки"} rows={2} style={{ ...field, resize: "vertical" }} />
          <button type="submit" style={{ minHeight: 48, marginTop: 3, border: 0, borderRadius: 14, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 14, fontWeight: 700, boxShadow: "0 5px 14px rgba(92,124,250,.22)" }}>{en ? "Save" : "Сохранить"}</button>
        </form>
      </section>
    </div>}
  </>;
}
