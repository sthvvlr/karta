const NOTES_PREFIX = "karta-vaccination:v1:";

export type VaccinationMetadata = {
  name?: string;
  isUpcoming?: boolean;
  totalDoses?: number;
  nextDue?: string | null;
  dateString?: string;
  dateMonthISO?: string | null;
  dateDoneISO?: string | null;
  userNotes?: string | null;
};

export function readVaccinationMetadata(notes: string | null | undefined): VaccinationMetadata {
  if (!notes?.startsWith(NOTES_PREFIX)) return { userNotes: notes || null };
  try {
    return JSON.parse(notes.slice(NOTES_PREFIX.length)) as VaccinationMetadata;
  } catch {
    return { userNotes: notes };
  }
}

export function writeVaccinationMetadata(metadata: VaccinationMetadata): string {
  return `${NOTES_PREFIX}${JSON.stringify(metadata)}`;
}

export function displayVaccinationDate(metadata: VaccinationMetadata, dateGiven: string | null, lang: "ru" | "en"): string {
  const exactDate = metadata.dateDoneISO || (dateGiven && /^\d{4}-\d{2}-\d{2}$/.test(dateGiven) ? dateGiven : null);
  if (exactDate && /^\d{4}-\d{2}-\d{2}$/.test(exactDate)) {
    const date = new Date(`${exactDate}T00:00:00Z`);
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  }

  const monthYear = metadata.dateMonthISO || (dateGiven && /^\d{4}-\d{2}$/.test(dateGiven) ? dateGiven : null);
  if (monthYear && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)) {
    const [year, month] = monthYear.split("-").map(Number);
    const label = new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
    const localizedMonth = lang === "ru" ? label[0].toLocaleUpperCase("ru-RU") + label.slice(1) : label;
    return `${localizedMonth} ${year}`;
  }

  return metadata.dateString || dateGiven || (lang === "ru" ? "Дата не указана" : "Date not specified");
}

export function isCustomVaccineId(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("custom:"));
}
