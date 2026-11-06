const NOTES_PREFIX = "karta-vaccination:v1:";

export type VaccinationMetadata = {
  name?: string;
  isUpcoming?: boolean;
  totalDoses?: number;
  nextDue?: string | null;
  dateString?: string;
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

export function isCustomVaccineId(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith("custom:"));
}
