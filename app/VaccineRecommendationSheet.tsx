"use client";

import { useEffect, useMemo, useState } from "react";
import { Baby, CalendarDays, ChevronRight, Info, Lightbulb, MapPin, Plane, Syringe, UserRound, X } from "lucide-react";
import { addVaccination } from "@/app/actions";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import { useKartaLanguage } from "@/app/LanguageRuntime";
import type { VaccineForTasks } from "@/app/tasks";

const ink = "#1A2050";
const muted = "rgba(26,32,80,.55)";
const blue = "#5C7CFA";
const border = "rgba(186,200,255,.36)";
const field: React.CSSProperties = {
  width: "100%", minHeight: 46, boxSizing: "border-box", padding: "12px 14px",
  border: `1px solid ${border}`, borderRadius: 13, background: "rgba(244,246,255,.82)",
  color: ink, fontSize: 16,
};

const tagText: Record<string, [string, string]> = {
  pregnancy: ["Беременность", "Pregnancy"],
  infant_contact: ["Контакт с младенцами", "Infant contact"],
  travel: ["Путешествия", "Travel"],
  "60plus": ["60+", "60+"],
};

const endemicRows = [
  { flag: "🇪🇪🇱🇻🇱🇹🇦🇹🇨🇿🇸🇮🇸🇰", title: ["Высокий риск", "High risk"], regions: ["Эстония, Латвия, Литва, Австрия, Чехия, Словения, Словакия", "Estonia, Latvia, Lithuania, Austria, Czechia, Slovenia, Slovakia"], color: "#EF4444" },
  { flag: "🇩🇪🇨🇭🇸🇪🇫🇮🇵🇱🇭🇺🇭🇷", title: ["Умеренный риск", "Moderate risk"], regions: ["Германия, Швейцария, Швеция, Финляндия, Польша, Венгрия, Хорватия, Беларусь, Украина", "Germany, Switzerland, Sweden, Finland, Poland, Hungary, Croatia, Belarus, Ukraine"], color: "#D97706" },
  { flag: "🇷🇺", title: ["Россия (высокий/умеренный риск)", "Russia (high/moderate risk)"], regions: ["Урал, Сибирь, Дальний Восток, Поволжье, Северо-Западный регион", "Urals, Siberia, Far East, Volga region, North-West Russia"], color: "#EF4444" },
  { flag: "🇨🇳🇲🇳🇰🇿", title: ["Умеренный риск", "Moderate risk"], regions: ["Северо-восточный Китай, Монголия, Казахстан", "Northeastern China, Mongolia, Kazakhstan"], color: "#D97706" },
  { flag: "🇯🇵", title: ["Низкий риск", "Low risk"], regions: ["Япония: только Хоккайдо", "Japan: Hokkaido only"], color: "#6B7280" },
];

export function VaccineRecommendationSheet({
  vaccine,
  region,
  today,
  brands,
  travelAdvisory = false,
}: {
  vaccine: VaccineForTasks;
  region?: string;
  today: string;
  brands: string[];
  travelAdvisory?: boolean;
}) {
  const en = useKartaLanguage() === "en";
  const [open, setOpen] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const [brand, setBrand] = useState("");
  useEffect(() => {
    if (!open && !markOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, markOpen]);
  const local = region ? vaccine.regions?.[region] : undefined;
  const name = en ? vaccine.nameEn || vaccine.nameRu : vaccine.nameRu;
  const description = (en ? vaccine.descriptionEn || vaccine.descriptionRu : vaccine.descriptionRu) || "";
  const who = (en ? local?.whoEn || vaccine.whoEn || local?.whoRu || vaccine.whoRu : local?.whoRu || vaccine.whoRu) || (en ? "Adults, as advised by a clinician" : "Взрослым по показаниям");
  const schedule = (en ? local?.scheduleEn || vaccine.scheduleEn || local?.scheduleRu || vaccine.scheduleRu : local?.scheduleRu || vaccine.scheduleRu) || (en ? "As advised by a clinician" : "По назначению врача");
  const note = en ? local?.noteEn || vaccine.noteEn || local?.noteRu || vaccine.noteRu : local?.noteRu || vaccine.noteRu;
  const disclaimer = en ? local?.disclaimerEn || vaccine.disclaimerEn || local?.disclaimerRu || vaccine.disclaimerRu : local?.disclaimerRu || vaccine.disclaimerRu;
  const pregnancyNote = vaccine.pregnancyRelevant ? (en ? vaccine.pregnancyNoteEn || vaccine.pregnancyNoteRu : vaccine.pregnancyNoteRu) : null;
  const infantNote = en ? vaccine.infantContactNoteEn || vaccine.infantContactNoteRu : vaccine.infantContactNoteRu;
  const suggestions = useMemo(() => brands.filter((item) => !brand || item.toLocaleLowerCase().includes(brand.toLocaleLowerCase())), [brand, brands]);
  const frequency = vaccine.frequencyType === "recurring"
    ? (vaccine.intervalYears ? (en ? `Every ${vaccine.intervalYears} years` : `Каждые ${vaccine.intervalYears} лет`) : en ? "Repeat" : "Повторно")
    : vaccine.frequencyType === "annual" ? (en ? "Annual" : "Ежегодно")
      : vaccine.frequencyType === "once_plus_pregnancy" ? (en ? "Once + pregnancy" : "Однократно + беременность")
        : en ? "Once" : "Однократно";

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={en ? `About ${name}` : `О вакцине «${name}»`} style={{ width: "100%", padding: 11, textAlign: "left", border: `1px solid rgba(255,255,255,.92)`, borderRadius: 15, background: "rgba(244,246,255,.72)", color: ink, boxShadow: "0 1px 7px rgba(26,32,80,.035)" }}>
      <span style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ width: 38, height: 38, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: 11, color: travelAdvisory ? "#06B6D4" : blue, background: travelAdvisory ? "rgba(6,182,212,.1)" : "rgba(92,124,250,.1)" }}>{travelAdvisory ? <Plane size={17} /> : <Syringe size={18} />}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>{name}</span>
          <span style={{ marginTop: 3, color: muted, fontSize: 11, lineHeight: 1.4, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{description}</span>
        </span>
        <ChevronRight size={15} color="rgba(26,32,80,.35)" />
      </span>
      <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
        <span style={{ padding: "4px 8px", borderRadius: 99, background: "rgba(92,124,250,.09)", color: blue, fontSize: 10, fontWeight: 700 }}>{frequency}</span>
        {(vaccine.tags || []).slice(0, 2).map((tag) => <span key={tag} style={{ padding: "4px 8px", borderRadius: 99, color: tag === "pregnancy" ? "#EC4899" : tag === "infant_contact" ? "#D97706" : tag === "travel" ? "#0891B2" : "#8B5CF6", background: tag === "pregnancy" ? "rgba(236,72,153,.1)" : tag === "infant_contact" ? "rgba(245,158,11,.1)" : tag === "travel" ? "rgba(6,182,212,.1)" : "rgba(139,92,246,.1)", fontSize: 10, fontWeight: 600 }}>{tagText[tag]?.[en ? 1 : 0] || tag}</span>)}
      </span>
      {travelAdvisory && <span style={{ display: "flex", alignItems: "center", gap: 5, width: "fit-content", marginTop: 8, padding: "5px 8px", borderRadius: 8, color: "#0B7285", background: "rgba(6,182,212,.08)", fontSize: 10 }}>{en ? "Recommended when traveling to endemic regions" : "Рекомендуется при поездке в эндемичные регионы"}</span>}
    </button>

    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.4)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`vaccine-title-${vaccine.id}`} style={{ width: "min(100%,430px)", maxHeight: "90dvh", overflow: "auto", paddingBottom: "calc(22px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.78)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "#F4F6FF", color: ink, boxShadow: "0 -12px 42px rgba(26,32,80,.2)" }}>
        <div style={{ height: 4, width: 38, margin: "10px auto 14px", borderRadius: 99, background: "rgba(26,32,80,.18)" }} />
        <header style={{ padding: "6px 20px 18px", background: "linear-gradient(135deg,rgba(92,124,250,.14),rgba(116,207,250,.08))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}><span style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 14, color: blue, background: "rgba(92,124,250,.12)" }}><Syringe size={23} /></span><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: "50%", background: "rgba(255,255,255,.72)", color: muted }}><X size={16} /></button></div>
          <h2 id={`vaccine-title-${vaccine.id}`} style={{ margin: "0 0 9px", fontSize: 22, lineHeight: 1.2, fontWeight: 750 }}>{name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><span style={{ padding: "4px 8px", borderRadius: 99, color: blue, background: "rgba(92,124,250,.09)", fontSize: 10, fontWeight: 700 }}>{frequency}</span>{(vaccine.tags || []).slice(0, 3).map((tag) => <span key={tag} style={{ padding: "4px 8px", borderRadius: 99, color: "#7257C9", background: "rgba(114,87,201,.09)", fontSize: 10, fontWeight: 600 }}>{tagText[tag]?.[en ? 1 : 0] || tag}</span>)}</div>
        </header>

        <div style={{ display: "grid", gap: 15, padding: 20 }}>
          <InfoSection icon={<Info size={15} />} title={en ? "About" : "О вакцине"} body={description} />
          <InfoSection icon={<UserRound size={15} />} title={en ? "Who should vaccinate" : "Кому делать"} body={who} />
          <InfoSection icon={<CalendarDays size={15} />} title={en ? "Vaccination schedule" : "Схема вакцинации"} body={schedule} />
          {note && <InfoSection icon={<Lightbulb size={15} />} title={en ? "Important" : "Важно знать"} body={note} />}
          {disclaimer && <div style={{ padding: 13, borderRadius: 13, background: "rgba(255,247,230,.85)", border: "1px solid rgba(217,119,6,.18)", color: "#805A10", fontSize: 12, lineHeight: 1.5 }}><b>{en ? "Please note" : "Обратите внимание"}</b><div style={{ marginTop: 4 }}>{disclaimer}</div></div>}
          {pregnancyNote && <InfoSection icon={<span>♡</span>} title={en ? "Pregnancy" : "Беременность"} body={pregnancyNote} accent="#EC4899" />}
          {infantNote && (vaccine.tags || []).includes("infant_contact") && <InfoSection icon={<Baby size={15} />} title={en ? "Infant contact" : "Если рядом младенец"} body={infantNote} accent="#D97706" />}
          {vaccine.requiresEndemicCheck && <details style={{ border: `1px solid ${border}`, borderRadius: 14, background: "rgba(255,255,255,.75)" }}><summary style={{ display: "flex", alignItems: "center", gap: 8, padding: 13, cursor: "pointer", listStyle: "none", color: muted, fontSize: 11, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase" }}><MapPin size={14} color="#06B6D4" />{en ? "Endemic regions" : "Эндемичные регионы"}<ChevronRight size={14} style={{ marginLeft: "auto" }} /></summary><div style={{ display: "grid", gap: 10, padding: "0 13px 14px" }}>{endemicRows.map((row) => <div key={row.flag} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, lineHeight: 1.4 }}><span style={{ width: 29, flexShrink: 0 }}>{row.flag}</span><span><b style={{ display: "block", marginBottom: 2, color: row.color }}>{row.title[en ? 1 : 0]}</b>{row.regions[en ? 1 : 0]}</span></div>)}</div></details>}
          <button type="button" onClick={() => setMarkOpen(true)} style={{ width: "100%", minHeight: 50, marginTop: 2, padding: "12px 14px", border: 0, borderRadius: 14, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 14, fontWeight: 700, boxShadow: "0 5px 14px rgba(92,124,250,.22)" }}>{en ? "Mark as done" : "Отметить как сделанную"}</button>
        </div>
      </section>
    </div>}

    {markOpen && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMarkOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.5)", backdropFilter: "blur(8px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby={`mark-vaccine-title-${vaccine.id}`} style={{ width: "min(100%,430px)", maxHeight: "92dvh", overflow: "auto", padding: "10px 20px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.8)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "#F4F6FF", color: ink, boxShadow: "0 -12px 42px rgba(26,32,80,.2)" }}>
        <div style={{ width: 38, height: 4, margin: "0 auto 14px", borderRadius: 99, background: "rgba(26,32,80,.18)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h2 id={`mark-vaccine-title-${vaccine.id}`} style={{ margin: 0, fontSize: 18 }}>{en ? "Mark vaccination" : "Отметить прививку"}</h2><button type="button" onClick={() => setMarkOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: "50%", background: "rgba(26,32,80,.06)", color: muted }}><X size={16} /></button></div>
        {(vaccine.totalDoses || 1) > 1 && <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 14 }}>{Array.from({ length: vaccine.totalDoses }, (_, index) => <span key={index} style={{ width: 9, height: 9, borderRadius: "50%", background: index === 0 ? blue : "rgba(26,32,80,.18)" }} />)}</div>}
        <div style={{ marginBottom: 16, textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 750 }}>{name}</div><div style={{ marginTop: 4, fontSize: 12, color: muted }}>{(vaccine.totalDoses || 1) > 1 ? (en ? "When did you get dose 1?" : "Когда сделали 1-ю дозу?") : (en ? "When did you get vaccinated?" : "Когда сделали прививку?")}</div></div>
        <form action={addVaccination} onSubmit={() => { setMarkOpen(false); setOpen(false); }} style={{ display: "grid", gap: 12 }}>
          <input type="hidden" name="vaccineId" value={vaccine.id} /><input type="hidden" name="doseNumber" value="1" /><input type="hidden" name="totalDoses" value={vaccine.totalDoses} />
          <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 650 }}>{en ? "Vaccine brand (optional)" : "Название препарата (необязательно)"}<input name="brand" list={`vaccine-brands-${vaccine.id}`} value={brand} onChange={(event) => setBrand(event.target.value)} placeholder={en ? "E.g. Gardasil 9" : "Например, Гардасил 9"} style={field} /><datalist id={`vaccine-brands-${vaccine.id}`}>{brands.map((name) => <option value={name} key={name} />)}</datalist></label>
          {suggestions.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: -6 }}>{suggestions.slice(0, 8).map((item) => <button key={item} type="button" onClick={() => setBrand(item)} style={{ padding: "6px 10px", border: 0, borderRadius: 99, background: brand === item ? blue : "rgba(92,124,250,.1)", color: brand === item ? "white" : blue, fontSize: 11 }}>{item}</button>)}</div>}
          <VaccinationDateInput initialDate={today} maxDate={today} doseNumber={1} totalDoses={vaccine.totalDoses} doseScheduleDays={vaccine.doseScheduleDays} frequencyType={vaccine.frequencyType} intervalYears={vaccine.intervalYears} style={field} />
          <button type="submit" style={{ minHeight: 49, border: 0, borderRadius: 14, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 14, fontWeight: 700 }}>{en ? "Save" : "Сохранить"}</button>
        </form>
      </section>
    </div>}
  </>;
}

function InfoSection({ icon, title, body, accent = blue }: { icon: React.ReactNode; title: string; body: string; accent?: string }) {
  return <section style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr)", gap: 9, fontSize: 12, lineHeight: 1.5 }}><span style={{ display: "grid", placeItems: "start center", paddingTop: 2, color: accent }}>{icon}</span><div><div style={{ marginBottom: 4, color: muted, fontSize: 10, fontWeight: 750, letterSpacing: ".07em", textTransform: "uppercase" }}>{title}</div><div style={{ color: ink }}>{body}</div></div></section>;
}
