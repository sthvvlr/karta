"use client";

import { useKartaLanguage } from "@/app/LanguageRuntime";

const ink = "#1A2050";

export function VaccinationRecordDateField({
  initialDate = "",
  initialMonth = "",
  initialLabel = "",
  style,
}: {
  initialDate?: string;
  initialMonth?: string;
  initialLabel?: string;
  style: React.CSSProperties;
}) {
  const en = useKartaLanguage() === "en";
  const initialValue = initialLabel || initialMonth || initialDate;
  const inputValue = /^\d{4}-\d{2}-\d{2}$/.test(initialValue)
    ? new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${initialValue}T00:00:00Z`))
    : initialValue;

  return <label style={{ display: "grid", gap: 6, color: ink, fontSize: 13, fontWeight: 600 }}>
    {en ? "Date vaccinated" : "Дата прививки"}
    <input
      aria-label={en ? "Date vaccinated" : "Дата прививки"}
      name="dateGiven"
      type="text"
      defaultValue={inputValue}
      placeholder={en ? "e.g. Apr 2024" : "Мес ГГГГ, напр. Апр 2024"}
      autoComplete="off"
      autoCorrect="off"
      style={style}
    />
  </label>;
}
