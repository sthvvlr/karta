"use client";

import { useState } from "react";
import { useKartaLanguage } from "@/app/LanguageRuntime";

const ink = "#1A2050";
const muted = "rgba(26,32,80,.52)";

export function VaccinationRecordDateField({
  initialDate = "",
  initialMonth = "",
  style,
}: {
  initialDate?: string;
  initialMonth?: string;
  style: React.CSSProperties;
}) {
  const en = useKartaLanguage() === "en";
  const [precision, setPrecision] = useState<"day" | "month">(initialMonth ? "month" : "day");
  const [dayValue, setDayValue] = useState(initialDate);
  const [monthValue, setMonthValue] = useState(initialMonth);

  return <div style={{ display: "grid", gap: 6 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: ink, fontSize: 12, fontWeight: 650 }}>{en ? "Date vaccinated" : "Дата прививки"}</span>
      <div role="group" aria-label={en ? "Date precision" : "Точность даты"} style={{ display: "flex", padding: 2, borderRadius: 9, background: "rgba(26,32,80,.06)" }}>
        <button type="button" onClick={() => setPrecision("day")} aria-pressed={precision === "day"} style={{ padding: "5px 8px", border: 0, borderRadius: 7, background: precision === "day" ? "white" : "transparent", color: precision === "day" ? ink : muted, fontSize: 10, fontWeight: 650, boxShadow: precision === "day" ? "0 1px 3px rgba(26,32,80,.1)" : "none" }}>{en ? "Exact date" : "Точный день"}</button>
        <button type="button" onClick={() => setPrecision("month")} aria-pressed={precision === "month"} style={{ padding: "5px 8px", border: 0, borderRadius: 7, background: precision === "month" ? "white" : "transparent", color: precision === "month" ? ink : muted, fontSize: 10, fontWeight: 650, boxShadow: precision === "month" ? "0 1px 3px rgba(26,32,80,.1)" : "none" }}>{en ? "Month & year" : "Месяц и год"}</button>
      </div>
    </div>
    <input
      aria-label={en ? "Date vaccinated" : "Дата прививки"}
      name="dateGiven"
      type={precision === "month" ? "month" : "date"}
      value={precision === "month" ? monthValue : dayValue}
      onChange={(event) => precision === "month" ? setMonthValue(event.target.value) : setDayValue(event.target.value)}
      style={style}
    />
  </div>;
}
