import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureCatalog, ensureProfile } from "@/app/data";
import { getMobileUser } from "@/app/mobile-auth";
import { isCustomVaccineId, readVaccinationMetadata, writeVaccinationMetadata } from "@/app/vaccination-record";
import { labResults, medicationLogs, medications, monitoringCompletions, vaccinations, vaccines } from "@/db/schema";

function parseJson(value: string | null, fallback: unknown) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function dateOnly(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

function medicationTimeSlots(value: string | null, defaultDays: number[] = []) {
  const parsed = parseJson(value, []);
  if (!Array.isArray(parsed)) return [];
  const defaults: Record<string, string> = { morning: "08:00", afternoon: "13:00", evening: "20:00" };
  return parsed.flatMap((item) => {
    if (typeof item === "string") return [{ label: "morning", customTime: item, hasCustomTime: true, daysOfWeek: defaultDays }];
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const label = typeof source.label === "string" ? source.label : "morning";
    const time = typeof source.time === "string" ? source.time : typeof source.customTime === "string" ? source.customTime : defaults[label] || "12:00";
    const hasCustomTime = source.hasCustomTime === true || time !== (defaults[label] || "12:00");
    const daysOfWeek = Array.isArray(source.daysOfWeek) ? source.daysOfWeek.filter((day): day is number => typeof day === "number") : defaultDays;
    return [{ label, ...(hasCustomTime ? { customTime: time } : {}), hasCustomTime, daysOfWeek }];
  });
}

function medicationDaysOfWeek(value: string | null): number[] {
  const parsed = parseJson(value, []);
  if (!Array.isArray(parsed)) return [];
  const slot = parsed.find((item) => item && typeof item === "object" && Array.isArray((item as Record<string, unknown>).daysOfWeek));
  return slot ? ((slot as Record<string, unknown>).daysOfWeek as number[]).filter((day) => typeof day === "number") : [];
}

async function loadRecords(userId: string) {
  await ensureCatalog();
  await ensureProfile({ userId, email: "", displayName: "" });
  const db = getDb();
  const [vaccinationRows, medicationRows, labRows, medicationLogRows, monitoringRows] = await Promise.all([
    db.select({ record: vaccinations, vaccine: vaccines }).from(vaccinations).leftJoin(vaccines, eq(vaccinations.vaccineId, vaccines.id)).where(eq(vaccinations.userId, userId)),
    db.select().from(medications).where(and(eq(medications.userId, userId), eq(medications.isActive, true))),
    db.select().from(labResults).where(eq(labResults.userId, userId)),
    db.select().from(medicationLogs).where(eq(medicationLogs.userId, userId)),
    db.select().from(monitoringCompletions).where(eq(monitoringCompletions.userId, userId)),
  ]);

  return {
    vaccinations: vaccinationRows.map(({ record, vaccine }) => {
      const metadata = readVaccinationMetadata(record.notes);
      const customId = isCustomVaccineId(record.vaccineId);
      return {
        id: record.id,
        name: metadata.name || vaccine?.nameRu || (customId ? "" : record.vaccineId),
        catalogId: customId ? null : record.vaccineId,
        dateString: metadata.dateString || record.dateGiven || "",
        dateDoneISO: metadata.dateDoneISO || dateOnly(record.dateGiven),
        doses: record.doseNumber,
        totalDoses: metadata.totalDoses ?? vaccine?.totalDoses ?? 1,
        nextDue: metadata.nextDue || null,
        isUpcoming: metadata.isUpcoming === true,
        vaccineBrand: record.brand,
        brand: record.brand,
        clinic: record.clinic,
        notes: metadata.userNotes || null,
        createdAt: record.createdAt,
      };
    }),
    medications: medicationRows.map((record) => ({
      id: record.id,
      name: record.name,
      drug_code: record.drugCode,
      dosage: record.dosage || "",
      frequency: record.frequency || "daily",
      days_of_week: medicationDaysOfWeek(record.timeSlots),
      time_slots: medicationTimeSlots(record.timeSlots, medicationDaysOfWeek(record.timeSlots)),
      meal_relation: record.mealRelation || "any",
      is_indefinite: !record.endDate,
      end_date: record.endDate,
      is_active: record.isActive,
      notes: record.notes || "",
      created_at: record.createdAt,
    })),
    labResults: labRows.map((record) => ({
      id: record.id,
      title: record.name,
      date: record.testedAt || record.createdAt.slice(0, 10),
      indicators: parseJson(record.indicators, []),
      file_path: record.fileKey ? record.fileKey.split("/").slice(-2).join("/") : null,
      file_ext: record.fileKey?.split(".").pop() || null,
      notes: record.notes || "",
      created_at: record.createdAt,
    })),
    medicationLogs: medicationLogRows.map((record) => ({
      id: record.id,
      medicationId: record.medicationId,
      scheduledAt: record.scheduledAt,
      status: record.status,
      takenAt: record.takenAt,
    })),
    monitoringCompletions: monitoringRows.map((record) => ({
      id: record.id,
      medicationId: record.medicationId,
      ruleId: record.ruleId,
      nextDue: record.nextDue,
      completedAt: record.completedAt,
    })),
  };
}

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  return NextResponse.json(await loadRecords(user.userId));
}

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const kind = String(body.kind || "");
  const record = (body.record && typeof body.record === "object" ? body.record : {}) as Record<string, unknown>;
  const id = String(record.id || "");
  if (!id) return NextResponse.json({ error: "Не указан идентификатор записи." }, { status: 400 });
  const db = getDb();
  const now = new Date().toISOString();

  if (kind === "vaccination") {
    await ensureCatalog();
    const rawVaccineId = String(record.catalogId || record.vaccineId || "");
    const isUpcoming = record.isUpcoming === true;
    const vaccineId = rawVaccineId || `custom:${id}`;
    const dateDoneISO = dateOnly(record.dateDoneISO) || dateOnly(record.dateString);
    const rawTotalDoses = Number(record.totalDoses);
    const values = {
      userId: user.userId,
      vaccineId,
      dateGiven: isUpcoming ? null : dateDoneISO,
      doseNumber: Math.max(1, Number(record.doses || record.doseNumber || 1)),
      brand: String(record.vaccineBrand || record.brand || "") || null,
      clinic: String(record.clinic || "") || null,
      notes: writeVaccinationMetadata({
        name: isCustomVaccineId(vaccineId) || !rawVaccineId ? String(record.name || "").trim() : undefined,
        isUpcoming,
        totalDoses: Number.isFinite(rawTotalDoses) ? Math.max(0, rawTotalDoses) : 1,
        nextDue: String(record.nextDue || "") || null,
        dateString: String(record.dateString || ""),
        dateDoneISO,
        userNotes: String(record.notes || "") || null,
      }),
      createdAt: String(record.createdAt || now),
    };
    const [existing] = await db.select({ id: vaccinations.id }).from(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, user.userId))).limit(1);
    if (existing) await db.update(vaccinations).set(values).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, user.userId)));
    else await db.insert(vaccinations).values({ id, ...values });
    return NextResponse.json({ status: "saved", id });
  }

  if (kind === "medication") {
    const rawSlots = Array.isArray(record.time_slots) ? record.time_slots : [String(record.time || "12:00")];
    const daysOfWeek = Array.isArray(record.days_of_week) ? record.days_of_week.filter((day): day is number => typeof day === "number") : [];
    const defaults: Record<string, string> = { morning: "08:00", afternoon: "13:00", evening: "20:00" };
    const schedule = rawSlots.flatMap((item) => {
      if (typeof item === "string") return [{ label: "morning", time: item, daysOfWeek }];
      if (!item || typeof item !== "object") return [];
      const source = item as Record<string, unknown>;
      const label = typeof source.label === "string" ? source.label : "morning";
      const time = typeof source.time === "string" ? source.time : typeof source.customTime === "string" ? source.customTime : defaults[label] || "12:00";
      const slotDays = Array.isArray(source.daysOfWeek) ? source.daysOfWeek.filter((day): day is number => typeof day === "number") : daysOfWeek;
      return [{ label, time, daysOfWeek: slotDays, hasCustomTime: source.hasCustomTime === true || time !== (defaults[label] || "12:00"), ...(source.hasCustomTime === true ? { customTime: time } : {}) }];
    });
    const values = {
      userId: user.userId,
      drugCode: String(record.drug_code || record.drugCode || "") || null,
      name: String(record.name || "").trim(),
      dosage: String(record.dosage || "") || null,
      frequency: String(record.frequency || "daily") || "daily",
      timeSlots: JSON.stringify(schedule),
      mealRelation: String(record.meal_relation || record.mealRelation || "any") || "any",
      notes: String(record.notes || "") || null,
      startDate: dateOnly(record.start_date || record.startDate),
      endDate: record.is_indefinite === true ? null : dateOnly(record.end_date || record.endDate),
      isActive: record.is_active !== false,
      createdAt: String(record.created_at || now),
    };
    if (!values.name) return NextResponse.json({ error: "Не указано название препарата." }, { status: 400 });
    const [existing] = await db.select({ id: medications.id }).from(medications).where(and(eq(medications.id, id), eq(medications.userId, user.userId))).limit(1);
    if (existing) await db.update(medications).set(values).where(and(eq(medications.id, id), eq(medications.userId, user.userId)));
    else await db.insert(medications).values({ id, ...values });
    return NextResponse.json({ status: "saved", id });
  }

  if (kind === "labResult") {
    const values = {
      userId: user.userId,
      name: String(record.title || record.name || "Анализ").trim(),
      result: null,
      unit: null,
      referenceRange: null,
      testedAt: dateOnly(record.date || record.testedAt),
      fileKey: record.file_path ? `labs/${user.userId}/${String(record.file_path).split("/").pop()}` : null,
      notes: String(record.notes || "") || null,
      indicators: JSON.stringify(record.indicators || []),
      createdAt: String(record.created_at || now),
    };
    const [existing] = await db.select({ id: labResults.id }).from(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, user.userId))).limit(1);
    if (existing) await db.update(labResults).set(values).where(and(eq(labResults.id, id), eq(labResults.userId, user.userId)));
    else await db.insert(labResults).values({ id, ...values });
    return NextResponse.json({ status: "saved", id });
  }

  return NextResponse.json({ error: "Неизвестный тип записи." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") || "";
  const id = params.get("id") || "";
  if (!id) return NextResponse.json({ error: "Не указан идентификатор записи." }, { status: 400 });
  const db = getDb();
  if (kind === "medication") {
    await db.delete(medicationLogs).where(and(eq(medicationLogs.medicationId, id), eq(medicationLogs.userId, user.userId)));
    await db.delete(medications).where(and(eq(medications.id, id), eq(medications.userId, user.userId)));
  } else if (kind === "vaccination") {
    await db.delete(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, user.userId)));
  } else if (kind === "labResult") {
    await db.delete(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, user.userId)));
  } else {
    return NextResponse.json({ error: "Неизвестный тип записи." }, { status: 400 });
  }
  return NextResponse.json({ status: "deleted", id });
}

