import { birthDateParts } from "@/app/profile-dates";
import { readVaccinationMetadata } from "@/app/vaccination-record";

export type MedicationForTasks = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  timeSlots: string | null;
  mealRelation?: string | null;
  startDate: string | null;
  endDate: string | null;
  drugCode: string | null;
  createdAt: string;
};

export type MedicationLogForTasks = {
  medicationId: string;
  scheduledAt: string;
  status: string;
};

export type MedicationTask = {
  key: string;
  medicationId: string;
  name: string;
  dosage: string | null;
  mealRelation: string | null;
  endDate: string | null;
  frequency: string | null;
  daysOfWeek: number[];
  timeSlots: MedicationTimeSlot[];
  time: string;
  timeOfDay: string;
  scheduledAt: string;
  taken: boolean;
};

export type MedicationTimeSlot = { time: string; label: string; daysOfWeek?: number[] };
type TimeSlot = MedicationTimeSlot;
const defaultMedicationTimes: Record<string, string> = { morning: "08:00", afternoon: "13:00", evening: "20:00" };

function validTime(value: unknown): string | null {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

export function medicationTimeSlots(raw: string | null): TimeSlot[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown[];
    const slots = parsed.flatMap((item): TimeSlot[] => {
      if (typeof item === "string") {
        const time = validTime(item);
        return time ? [{ time, label: "morning" }] : [];
      }
      if (!item || typeof item !== "object") return [];
      const candidate = item as { time?: unknown; customTime?: unknown; label?: unknown; hasCustomTime?: unknown; daysOfWeek?: unknown };
      const label = typeof candidate.label === "string" ? candidate.label : "morning";
      const time = validTime(candidate.time) || validTime(candidate.customTime) || (candidate.hasCustomTime === false || candidate.customTime == null ? defaultMedicationTimes[label] : null);
      if (!time) return [];
      const daysOfWeek = Array.isArray(candidate.daysOfWeek) ? candidate.daysOfWeek.filter((day): day is number => typeof day === "number") : undefined;
      return [{ time, label, daysOfWeek }];
    });
    return slots.length ? slots : [{ time: "12:00", label: "" }];
  } catch {
    return [{ time: "12:00", label: "" }];
  }
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function medicationTasksForDate(medications: MedicationForTasks[], logs: MedicationLogForTasks[], date = new Date()): MedicationTask[] {
  const key = dateKey(date);
  const takenMedications = new Set(logs.filter((log) => log.status === "taken").map((log) => log.medicationId));
  return medications.flatMap((medication) => {
    if (!medication.id) return [];
    const timeSlots = medicationTimeSlots(medication.timeSlots);
    const firstSlot = timeSlots[0];
    const daysOfWeek = timeSlots.find((slot) => slot.daysOfWeek)?.daysOfWeek || [];
    // iOS stores one taken flag per medication and day. All time-of-day rows
    // for the same medication share that flag.
    return [{
      key: medication.id,
      medicationId: medication.id,
      name: medication.name,
      dosage: medication.dosage,
      mealRelation: medication.mealRelation || null,
      endDate: medication.endDate,
      frequency: medication.frequency,
      daysOfWeek,
      timeSlots,
      time: firstSlot.time,
      timeOfDay: firstSlot.label,
      scheduledAt: `${key}T00:00:00`,
      taken: takenMedications.has(medication.id),
    }];
  }).sort((a, b) => a.time.localeCompare(b.time));
}

export type VaccineForTasks = {
  id: string;
  nameRu: string;
  nameEn?: string;
  totalDoses: number;
  intervalYears: number | null;
  frequencyType?: string;
  doseScheduleDays?: number[];
  audience?: string;
  ageMin?: number;
  requiresEndemicCheck?: boolean;
  pregnancyRelevant?: boolean;
  pregnancyNoteRu?: string | null;
  infantContactNoteRu?: string | null;
  tags?: string[];
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  noteRu?: string | null;
  noteEn?: string | null;
  disclaimerRu?: string | null;
  disclaimerEn?: string | null;
  scheduleRu?: string | null;
  scheduleEn?: string | null;
  whoRu?: string | null;
  whoEn?: string | null;
  pregnancyNoteRu?: string | null;
  pregnancyNoteEn?: string | null;
  infantContactNoteRu?: string | null;
  infantContactNoteEn?: string | null;
  pregnancyRelevant?: boolean;
  requiresEndemicCheck?: boolean;
  regions?: Record<string, { scheduleRu?: string | null; scheduleEn?: string | null; noteRu?: string | null; noteEn?: string | null; disclaimerRu?: string | null; disclaimerEn?: string | null; audience?: string | null; whoRu?: string | null; whoEn?: string | null; frequencyType?: string | null; intervalYears?: number | null }>;
};

export type VaccinationForTasks = {
  id: string;
  vaccineId: string;
  dateGiven: string | null;
  doseNumber: number;
  notes?: string | null;
};

export type UpcomingVaccineTask = {
  key: string;
  vaccineId: string;
  nameRu: string;
  doseNumber: number;
  totalDoses: number;
  dueDate: string;
  overdue: boolean;
};

function isoDate(date: Date): string {
  return dateKey(date);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function upcomingVaccineTasks(records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date(), region?: string | null): UpcomingVaccineTask[] {
  const todayKey = dateKey(today);
  const result: UpcomingVaccineTask[] = [];
  for (const vaccine of catalog) {
    const regional = region ? vaccine.regions?.[region] : undefined;
    const frequencyType = regional?.frequencyType || vaccine.frequencyType;
    const intervalYears = regional?.intervalYears ?? vaccine.intervalYears;
    const completed = records.filter((record) => record.vaccineId === vaccine.id && record.dateGiven).sort((a, b) => (a.dateGiven || "").localeCompare(b.dateGiven || ""));
    if (!completed.length) continue;
    const schedule = vaccine.doseScheduleDays || [];
    if (vaccine.totalDoses > 1) {
      const maxDose = Math.max(...completed.map((record) => record.doseNumber || 1));
      const firstDate = dateOnly(completed[0].dateGiven);
      if (!firstDate || maxDose >= vaccine.totalDoses) continue;
      for (let dose = maxDose + 1; dose <= vaccine.totalDoses; dose += 1) {
        const offset = schedule[dose - 2];
        if (offset == null) continue;
        const dueDate = addDays(firstDate, offset);
        result.push({ key: `${vaccine.id}:${dose}`, vaccineId: vaccine.id, nameRu: vaccine.nameRu, doseNumber: dose, totalDoses: vaccine.totalDoses, dueDate: isoDate(dueDate), overdue: isoDate(dueDate) < todayKey });
      }
      continue;
    }
    const recurring = frequencyType === "annual" || frequencyType === "recurring";
    if (!recurring) continue;
    const last = completed[completed.length - 1];
    const lastDate = dateOnly(last.dateGiven);
    const interval = frequencyType === "annual" ? 1 : intervalYears;
    if (!lastDate || !interval) continue;
    const dueDate = addYears(lastDate, interval);
    result.push({ key: `${vaccine.id}:recurring`, vaccineId: vaccine.id, nameRu: vaccine.nameRu, doseNumber: 1, totalDoses: 1, dueDate: isoDate(dueDate), overdue: isoDate(dueDate) < todayKey });
  }
  return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type ProfileForRecommendations = {
  birthDate?: string | null;
  gender?: string | null;
  countryCode?: string | null;
  regionCurrent?: string | null;
  cityCurrent?: string | null;
};

const regionCountries: Record<string, string> = {
  RU: "RU", US: "US", AU: "AU", NZ: "AU", VN: "SEA", TH: "SEA", ID: "SEA", MY: "SEA", PH: "SEA", SG: "SEA", KH: "SEA", MM: "SEA", LA: "SEA", BN: "SEA",
  JP: "EAST_ASIA", KR: "EAST_ASIA", CN: "EAST_ASIA", TW: "EAST_ASIA", HK: "EAST_ASIA", MO: "EAST_ASIA",
};
const euCountries = new Set(["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PL", "SE", "DK", "FI", "NO", "CH", "GB", "IE", "PT", "CZ", "SK", "HU", "RO", "BG", "HR", "SI", "EE", "LV", "LT", "LU", "MT", "CY", "GR"]);

function ageFromBirthDate(birthDate: string | null | undefined, today = new Date()): number | null {
  const birth = birthDateParts(birthDate);
  if (!birth) return null;
  let age = today.getFullYear() - birth.year;
  const beforeBirthday = today.getMonth() < birth.month || (today.getMonth() === birth.month && today.getDate() < birth.day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function catalogRegion(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return regionCountries[code] || (euCountries.has(code) ? "EU" : null);
}

export type TbeRisk = "high" | "moderate" | "low" | "none";

export function tbeRisk(countryCode: string | null | undefined, adminArea: string | null | undefined): TbeRisk {
  const code = (countryCode || "").toUpperCase();
  const area = `${adminArea || ""}`.toLowerCase();
  if (["US", "CA", "AU", "NZ", "GB", "IE", "FR", "ES", "PT", "NL", "BE", "LU", "DK", "MT", "CY", "IT", "GR", "ZA", "NG", "KE", "MA", "EG", "BR", "AR", "MX", "IN", "VN", "TH", "ID", "MY", "PH", "SG", "KH", "MM", "LA", "BN", "KR"].includes(code)) return "none";
  if (["EE", "LV", "LT", "AT", "CZ", "SI", "SK"].includes(code)) return "high";
  if (["DE", "CH", "SE", "FI", "PL", "HU", "HR", "BY", "UA", "CN", "MN", "KZ"].includes(code)) return "moderate";
  if (["NO", "BG", "RO"].includes(code)) return "low";
  if (code === "JP") return /hokkaido|хоккайдо/.test(area) ? "moderate" : "none";
  if (code === "RU") {
    if (/свердловск|sverdlovsk|тюмен|tyumen|курган|kurgan|челябинск|chelyabinsk|пермск|\bperm\b|новосибирск|novosibirsk|томск|tomsk|кемерово|kemerovo|иркутск|irkutsk|красноярск|krasnoyarsk|алтай|altai|бурятия|buryatia|тыва|tuva|хакасия|khakassia|забайкал|zabaykalsky|zabaikalsky|читинск|\bchita\b|приморск|primorsky|хабаровск|khabarovsk|сахалин|sakhalin|амурск|amurskaya|еврейская|jewish autonomous|удмуртия|udmurtia|марий эл|mari el|башкорт|bashkortostan|оренбург|orenburg|самарск|\bsamara\b|архангельск|arkhangelsk/.test(area)) return "high";
    if (/кировск|kirovskaya|киров oblast|вологодск|vologda|костромск|kostroma|ярославск|yaroslavl|тверск|\btver\b|псковск|pskov|новгородск|novgorod|ленинградск|leningrad|санкт-петербург|saint petersburg|st\.? petersburg|карел|karelia|коми|\bkomi\b|нижегород|nizhny novgorod|владимирск|vladimirskaya|калининград|kaliningrad|московская область|moscow oblast|moskovskaya oblast/.test(area)) return "moderate";
    if (/москва|moscow city|краснодарск|krasnodar|ставрополь|stavropol|ростовск|rostov|волгоградск|volgograd|астраханск|astrakhan|дагестан|dagestan|чечен|chechen|ингушет|ingushetia/.test(area)) return "low";
    return "moderate";
  }
  return "none";
}

export function recommendedVaccines(profile: ProfileForRecommendations | null | undefined, records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date()): VaccineForTasks[] {
  const doneIds = completedCatalogIds(records);
  return applicableVaccines(profile, catalog, today).filter((vaccine) => !doneIds.has(vaccine.id));
}

function applicableVaccines(profile: ProfileForRecommendations | null | undefined, catalog: VaccineForTasks[], today: Date): VaccineForTasks[] {
  const age = ageFromBirthDate(profile?.birthDate, today);
  return catalog.filter((vaccine) => {
    if (vaccine.requiresEndemicCheck && tbeRisk(profile?.countryCode, profile?.regionCurrent) === "none") return false;
    if (vaccine.ageMin && age !== null && age < vaccine.ageMin) return false;
    return true;
  });
}

function completedCatalogIds(records: VaccinationForTasks[]): Set<string> {
  return new Set(records.filter((record) => !readVaccinationMetadata(record.notes).isUpcoming).map((record) => record.vaccineId));
}

const monthNames: Record<string, number> = {
  jan: 0, january: 0, янв: 0, январ: 0, feb: 1, february: 1, фев: 1, феврал: 1,
  mar: 2, march: 2, март: 2, apr: 3, april: 3, апр: 3, апрел: 3, may: 4, май: 4,
  jun: 5, june: 5, июн: 5, jul: 6, july: 6, июл: 6, aug: 7, august: 7, авг: 7, август: 7,
  sep: 8, sept: 8, september: 8, сен: 8, сентябр: 8, oct: 9, october: 9, окт: 9, октябр: 9,
  nov: 10, november: 10, ноя: 10, ноябр: 10, dec: 11, december: 11, дек: 11, декабр: 11,
};

function plannedDate(metadata: ReturnType<typeof readVaccinationMetadata>): Date | null {
  const monthOnly = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(metadata.dateMonthISO || "");
  if (monthOnly) return new Date(Number(monthOnly[1]), Number(monthOnly[2]) - 1, 1);
  const iso = metadata.dateDoneISO || metadata.nextDue;
  if (iso) {
    const parsed = dateOnly(iso);
    if (parsed) return parsed;
  }
  const raw = (metadata.dateString || "").trim().replace(/,/g, "");
  const dayMonth = /^(\d{1,2})\s+([\p{L}.]+)\s+(\d{4})$/u.exec(raw);
  const monthDay = /^([\p{L}.]+)\s+(\d{1,2})\s+(\d{4})$/u.exec(raw);
  const monthYear = /^([\p{L}.]+)\s+(\d{4})$/u.exec(raw);
  const match = dayMonth || monthDay || monthYear;
  if (!match) return null;
  const monthText = (dayMonth ? dayMonth[2] : match[1]).toLocaleLowerCase().replace(/\.$/, "");
  const month = monthNames[monthText] ?? monthNames[monthText.slice(0, 3)];
  if (month == null) return null;
  const day = dayMonth ? Number(dayMonth[1]) : monthDay ? Number(monthDay[2]) : 1;
  const year = Number(match[3] || match[2]);
  const result = new Date(year, month, day);
  return result.getFullYear() === year && result.getMonth() === month && result.getDate() === day ? result : null;
}

export function plannedVaccinationDateKey(metadata: ReturnType<typeof readVaccinationMetadata>): string {
  const parsed = plannedDate(metadata);
  return parsed ? dateKey(parsed) : metadata.nextDue || metadata.dateDoneISO || "";
}

export function overduePlannedVaccinations(records: VaccinationForTasks[], today = new Date()): VaccinationForTasks[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return records.filter((record) => {
    const metadata = readVaccinationMetadata(record.notes);
    if (!metadata.isUpcoming) return false;
    const due = plannedDate(metadata);
    return Boolean(due && due < startOfToday);
  });
}

export function nextDoseDate(vaccine: VaccineForTasks, doseNumber: number, dateGiven: string, firstDoseDate = dateGiven): string | null {
  const date = dateOnly(dateGiven);
  if (!date) return null;
  const offset = vaccine.doseScheduleDays?.[doseNumber - 1];
  if (vaccine.totalDoses > doseNumber && offset != null) {
    const base = dateOnly(doseNumber === 1 ? dateGiven : firstDoseDate);
    return base ? isoDate(addDays(base, offset)) : null;
  }
  if (vaccine.frequencyType === "annual") return isoDate(addYears(date, 1));
  if (vaccine.frequencyType === "recurring" && vaccine.intervalYears) return isoDate(addYears(date, vaccine.intervalYears));
  return null;
}

export function vaccinationScore(profile: ProfileForRecommendations | null | undefined, records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date()): number {
  const applicable = applicableVaccines(profile, catalog, today);
  if (applicable.length === 0) return 100;
  const doneIds = completedCatalogIds(records);
  const doneApplicable = applicable.filter((vaccine) => doneIds.has(vaccine.id)).length;
  const overdueCount = overduePlannedVaccinations(records, today).length;
  return Math.round(100 * doneApplicable / (applicable.length + overdueCount));
}

export type MonitoringRule = {
  id: string;
  drug_codes: string[];
  title_ru: string;
  reason_ru: string;
  tests_ru: string[];
  schedule_ru: string;
  title_en?: string;
  reason_en?: string;
  tests_en?: string[];
  schedule_en?: string;
  first_check_days: number;
  repeat_days: number;
};

export type MonitoringCompletion = { ruleId: string; medicationId: string; nextDue: string };

export type MonitoringTask = MonitoringRule & { medicationId: string; medicationName: string; dueDate: string; overdue: boolean };

export function monitoringTasksForDate(medications: MedicationForTasks[], completions: MonitoringCompletion[], rules: MonitoringRule[], today = new Date()): MonitoringTask[] {
  const completionMap = new Map(completions.map((completion) => [`${completion.ruleId}:${completion.medicationId}`, completion.nextDue]));
  const seen = new Set<string>();
  return medications.flatMap((medication) => rules.flatMap((rule) => {
    if (!medication.drugCode || !rule.drug_codes.includes(medication.drugCode)) return [];
    const key = `${rule.id}:${medication.id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const created = dateOnly(medication.createdAt) || today;
    const defaultDue = addDays(created, rule.first_check_days);
    const dueDate = completionMap.get(key) || isoDate(defaultDue);
    const yearsAhead = (dateOnly(dueDate)?.getTime() || 0) - today.getTime() > 3650 * 86400000;
    if (yearsAhead) return [];
    return [{ ...rule, medicationId: medication.id, medicationName: medication.name, dueDate, overdue: dueDate < dateKey(today) }];
  })).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
