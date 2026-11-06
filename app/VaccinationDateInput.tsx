"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialDate: string;
  maxDate?: string;
  doseNumber: number;
  totalDoses: number;
  doseScheduleDays?: number[];
  firstDoseDate?: string;
  frequencyType?: string;
  intervalYears?: number | null;
  style: React.CSSProperties;
};

function toDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function VaccinationDateInput({ initialDate, maxDate, doseNumber, totalDoses, doseScheduleDays = [], firstDoseDate = "", frequencyType = "", intervalYears, style }: Props) {
  const [date, setDate] = useState(initialDate);
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  useEffect(() => {
    if (document.cookie.split(";").some((value) => value.trim() === "karta_lang=en")) setLanguage("en");
  }, []);
  const nextDate = useMemo(() => {
    const base = toDate(doseNumber === 1 ? date : firstDoseDate) || (doseNumber >= totalDoses ? toDate(date) : null);
    if (doseNumber < totalDoses) {
      const offset = doseScheduleDays[doseNumber - 1];
      if (!base || offset == null) return null;
      base.setDate(base.getDate() + offset);
      return toKey(base);
    }
    const years = frequencyType === "annual" ? 1 : frequencyType === "recurring" ? intervalYears : null;
    if (!years || !toDate(date)) return null;
    const due = toDate(date)!;
    due.setFullYear(due.getFullYear() + years);
    return toKey(due);
  }, [date, doseNumber, doseScheduleDays, firstDoseDate, frequencyType, intervalYears, totalDoses]);
  const formattedNextDate = nextDate ? new Intl.DateTimeFormat(language === "en" ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(toDate(nextDate)!) : "";
  return <>
    <label style={{ fontSize: 11, color: "rgba(26,32,80,.55)" }}>Дата прививки<input name="dateGiven" type="date" required value={date} max={maxDate} onChange={(event) => setDate(event.target.value)} style={{ ...style, marginTop: 4 }} /></label>
    {formattedNextDate && <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(92,124,250,.08)", color: "rgba(26,32,80,.55)", fontSize: 11 }}>{doseNumber < totalDoses ? "Следующая доза:" : "Следующая ревакцинация:"} {formattedNextDate}</div>}
  </>;
}
