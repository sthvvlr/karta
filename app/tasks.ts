export type MedicationForTasks = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  timeSlots: string | null;
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
  time: string;
  scheduledAt: string;
  taken: boolean;
};

type TimeSlot = { time: string; label: string; daysOfWeek?: number[] };

function validTime(value: unknown): string | null {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
}

export function medicationTimeSlots(raw: string | null): TimeSlot[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown[];
    const slots = parsed.flatMap((item): TimeSlot[] => {
      if (typeof item === "string") {
        const time = validTime(item);
        return time ? [{ time, label: "" }] : [];
      }
      if (!item || typeof item !== "object") return [];
      const candidate = item as { time?: unknown; customTime?: unknown; label?: unknown; daysOfWeek?: unknown };
      const time = validTime(candidate.time) || validTime(candidate.customTime);
      if (!time) return [];
      const daysOfWeek = Array.isArray(candidate.daysOfWeek) ? candidate.daysOfWeek.filter((day): day is number => typeof day === "number") : undefined;
      return [{ time, label: typeof candidate.label === "string" ? candidate.label : "", daysOfWeek }];
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
  const day = date.getDay();
  const key = dateKey(date);
  const logMap = new Map(logs.map((log) => [`${log.medicationId}:${log.scheduledAt}`, log.status === "taken"]));
  return medications.flatMap((medication) => {
    if (!medication.id || medication.frequency === "as_needed") return [];
    const start = dateOnly(medication.startDate);
    const end = dateOnly(medication.endDate);
    const current = dateOnly(key);
    if (start && current && current < start) return [];
    if (end && current && current > end) return [];
    return medicationTimeSlots(medication.timeSlots).filter((slot) => {
      if (medication.frequency !== "weekly") return true;
      return slot.daysOfWeek?.includes(day) ?? true;
    }).map((slot) => {
      const scheduledAt = `${key}T${slot.time}:00`;
      return { key: `${medication.id}:${scheduledAt}`, medicationId: medication.id, name: medication.name, dosage: medication.dosage, time: slot.time, scheduledAt, taken: logMap.get(`${medication.id}:${scheduledAt}`) === true };
    });
  }).sort((a, b) => a.time.localeCompare(b.time));
}

export type VaccineForTasks = {
  id: string;
  nameRu: string;
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
  noteRu?: string | null;
  disclaimerRu?: string | null;
  scheduleRu?: string | null;
  whoRu?: string | null;
  regions?: Record<string, { scheduleRu?: string | null; noteRu?: string | null; disclaimerRu?: string | null; audience?: string | null; whoRu?: string | null }>;
};

export type VaccinationForTasks = {
  id: string;
  vaccineId: string;
  dateGiven: string | null;
  doseNumber: number;
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

export function upcomingVaccineTasks(records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date()): UpcomingVaccineTask[] {
  const todayKey = dateKey(today);
  const result: UpcomingVaccineTask[] = [];
  for (const vaccine of catalog) {
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
    const recurring = vaccine.frequencyType === "annual" || vaccine.frequencyType === "recurring";
    if (!recurring) continue;
    const last = completed[completed.length - 1];
    const lastDate = dateOnly(last.dateGiven);
    const interval = vaccine.frequencyType === "annual" ? 1 : vaccine.intervalYears;
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
  const birth = dateOnly(birthDate);
  if (!birth) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function catalogRegion(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return regionCountries[code] || (euCountries.has(code) ? "EU" : null);
}

type TbeRisk = "high" | "moderate" | "low" | "none";

function tbeRisk(countryCode: string | null | undefined, adminArea: string | null | undefined): TbeRisk {
  const code = (countryCode || "").toUpperCase();
  const area = `${adminArea || ""}`.toLowerCase();
  if (["US", "CA", "AU", "NZ", "GB", "IE", "FR", "ES", "PT", "NL", "BE", "LU", "DK", "MT", "CY", "IT", "GR", "ZA", "NG", "KE", "MA", "EG", "BR", "AR", "MX", "IN", "VN", "TH", "ID", "MY", "PH", "SG", "KH", "MM", "LA", "BN", "KR"].includes(code)) return "none";
  if (["EE", "LV", "LT", "AT", "CZ", "SI", "SK"].includes(code)) return "high";
  if (["DE", "CH", "SE", "FI", "PL", "HU", "HR", "BY", "UA", "CN", "MN", "KZ"].includes(code)) return "moderate";
  if (["NO", "BG", "RO"].includes(code)) return "low";
  if (code === "JP") return /hokkaido|хоккайдо/.test(area) ? "moderate" : "none";
  if (code === "RU") {
    if (/свердлов|тюмен|курган|челябин|пермск|новосибир|томск|кемеров|иркутск|краснояр|алтай|бурят|тыва|хакас|забайкал|читин|примор|хабаров|сахалин|амур|еврейск|удмурт|марий|башкорт|оренбург|самар|архангел/.test(area)) return "high";
    if (/киров|вологод|костром|ярослав|твер|псков|новгород|ленинград|санкт-петербург|карел|коми|нижегород|владимир|калининград|московская область/.test(area)) return "moderate";
    if (/москва|краснодар|ставропол|ростов|волгоград|астрахан|дагестан|чечен|ингушет/.test(area)) return "low";
    return "moderate";
  }
  return "none";
}

export function recommendedVaccines(profile: ProfileForRecommendations | null | undefined, records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date()): VaccineForTasks[] {
  const age = ageFromBirthDate(profile?.birthDate, today);
  const region = catalogRegion(profile?.countryCode);
  return catalog.filter((vaccine) => {
    const completed = records.some((record) => record.vaccineId === vaccine.id && record.dateGiven);
    if (completed) return false;
    if (vaccine.ageMin && age !== null && age < vaccine.ageMin) return false;
    if (vaccine.audience === "female" && profile?.gender === "male") return false;
    if (vaccine.audience === "60plus" && age !== null && age < 60) return false;
    if (vaccine.requiresEndemicCheck && tbeRisk(profile?.countryCode, profile?.regionCurrent || profile?.cityCurrent) === "none") return false;
    if (region && vaccine.regions && !vaccine.regions[region]) return false;
    return true;
  });
}

export function nextDoseDate(vaccine: VaccineForTasks, doseNumber: number, dateGiven: string): string | null {
  const date = dateOnly(dateGiven);
  if (!date) return null;
  const offset = vaccine.doseScheduleDays?.[doseNumber - 1];
  if (vaccine.totalDoses > doseNumber && offset != null) return isoDate(addDays(date, offset));
  if ((vaccine.frequencyType === "annual" || vaccine.frequencyType === "recurring") && vaccine.intervalYears) return isoDate(addYears(date, vaccine.intervalYears));
  return null;
}

export function vaccinationScore(profile: ProfileForRecommendations | null | undefined, records: VaccinationForTasks[], catalog: VaccineForTasks[], today = new Date()): number {
  const applicable = recommendedVaccines(profile, records, catalog, today).length;
  const total = applicable + new Set(records.filter((record) => record.dateGiven).map((record) => record.vaccineId)).size;
  if (total === 0) return 0;
  return Math.round((total - applicable) / total * 100);
}

export type MonitoringRule = {
  id: string;
  drug_codes: string[];
  title_ru: string;
  reason_ru: string;
  tests_ru: string[];
  schedule_ru: string;
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
