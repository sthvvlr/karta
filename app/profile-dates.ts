function validISODate(year: number, month: number, day: number): boolean {
  const value = new Date(Date.UTC(year, month - 1, day));
  return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
}

export function birthDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso && validISODate(Number(iso[1]), Number(iso[2]), Number(iso[3]))) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    if (validISODate(year, month, day)) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

export function birthDateDisplayValue(value: string | null | undefined): string {
  const iso = birthDateInputValue(value);
  if (!iso) return value || "";
  const [, year, month, day] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)!;
  return `${day}.${month}.${year}`;
}

export function birthDateParts(value: string | null | undefined): { year: number; month: number; day: number } | null {
  const iso = birthDateInputValue(value);
  if (!iso) return null;
  const [, year, month, day] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)!;
  return { year: Number(year), month: Number(month) - 1, day: Number(day) };
}
