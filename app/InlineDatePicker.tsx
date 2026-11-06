"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useKartaLanguage } from "@/app/LanguageRuntime";

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function InlineDatePicker({ value, onChange, maxDate, label }: { value: string; onChange: (value: string) => void; maxDate: string; label: string }) {
  const en = useKartaLanguage() === "en";
  const selected = parseDate(value);
  const max = parseDate(maxDate);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const month = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const firstDay = (month.getDay() + (en ? 0 : 6)) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { month: "long", year: "numeric" }).format(month);
  const weekDays = useMemo(() => {
    const start = en ? 0 : 1;
    return Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { weekday: "short" }).format(new Date(2024, 0, 7 + ((start + index) % 7))));
  }, [en]);
  const futureMonth = month.getFullYear() > max.getFullYear() || (month.getFullYear() === max.getFullYear() && month.getMonth() >= max.getMonth());
  const selectedLabel = new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(selected);

  return <section aria-label={label} style={{ display: "grid", gap: 8 }}>
    <input type="hidden" name="dateGiven" value={value} />
    <div style={{ color: "#1A2050", fontSize: 13, fontWeight: 650 }}>{label}</div>
    <div style={{ padding: 12, border: "1px solid rgba(255,255,255,.9)", borderRadius: 14, background: "rgba(255,255,255,.72)", boxShadow: "0 1px 7px rgba(26,32,80,.035)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <button type="button" aria-label={en ? "Previous month" : "Предыдущий месяц"} onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={navStyle}><ChevronLeft size={18} /></button>
      <div aria-live="polite" style={{ color: "#1A2050", fontSize: 14, fontWeight: 650, textTransform: "capitalize" }}>{monthLabel}</div>
      <button type="button" aria-label={en ? "Next month" : "Следующий месяц"} disabled={futureMonth} onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={{ ...navStyle, opacity: futureMonth ? .3 : 1 }}><ChevronRight size={18} /></button>
    </div>
    <div role="grid" aria-label={monthLabel} style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 3 }}>
      {weekDays.map((day, index) => <div role="columnheader" key={`${day}-${index}`} style={{ display: "grid", placeItems: "center", height: 28, color: "rgba(26,32,80,.48)", fontSize: 10, fontWeight: 600 }}>{day}</div>)}
      {Array.from({ length: firstDay }, (_, index) => <div role="gridcell" aria-hidden="true" key={`blank-${index}`} />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const key = dateKey(date);
        const isSelected = key === value;
        const disabled = key > maxDate;
        return <button key={key} type="button" role="gridcell" aria-label={new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { dateStyle: "full" }).format(date)} aria-pressed={isSelected} disabled={disabled} onClick={() => onChange(key)} style={{ width: "100%", aspectRatio: "1", minHeight: 34, border: 0, borderRadius: 999, background: isSelected ? "linear-gradient(135deg,#748FFC,#5C7CFA)" : "transparent", color: isSelected ? "white" : disabled ? "rgba(26,32,80,.22)" : "#1A2050", fontSize: 13, fontWeight: isSelected ? 700 : 500 }}>{day}</button>;
      })}
    </div>
    <div style={{ marginTop: 8, paddingTop: 9, borderTop: "1px solid rgba(26,32,80,.08)", color: "rgba(26,32,80,.55)", fontSize: 12 }}>{label}: <b style={{ color: "#1A2050", fontWeight: 600 }}>{selectedLabel}</b></div>
    </div>
  </section>;
}

const navStyle: React.CSSProperties = { width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(92,124,250,.08)", color: "#5C7CFA" };
