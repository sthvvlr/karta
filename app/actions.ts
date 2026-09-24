"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";
import { getDb } from "@/db";
import { labResults, medicationLogs, medications, monitoringCompletions, profiles, vaccinations } from "@/db/schema";
import { ensureCatalog } from "./data";

export async function addVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  await ensureCatalog();
  await getDb().insert(vaccinations).values({
    id: crypto.randomUUID(),
    userId: auth.userId,
    vaccineId: String(formData.get("vaccineId") || ""),
    dateGiven: String(formData.get("dateGiven") || "") || null,
    doseNumber: Number(formData.get("doseNumber") || 1),
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/vaccinations");
}

export async function addMedication(formData: FormData) {
  const auth = await requireChatGPTUser("/medications");
  const id = String(formData.get("id") || "");
  const scheduleRaw = String(formData.get("schedule") || "");
  let schedule = [{ time: String(formData.get("time") || "12:00"), label: "" }];
  try {
    const parsed = JSON.parse(scheduleRaw) as unknown;
    if (Array.isArray(parsed) && parsed.length) schedule = parsed as typeof schedule;
  } catch { /* legacy single-time form */ }
  const values = {
    userId: auth.userId,
    drugCode: String(formData.get("drugCode") || "") || null,
    name: String(formData.get("name") || "Новый препарат").trim(),
    dosage: String(formData.get("dosage") || "") || null,
    frequency: String(formData.get("frequency") || "") || null,
    timeSlots: JSON.stringify(schedule),
    mealRelation: String(formData.get("mealRelation") || "") || null,
    startDate: String(formData.get("startDate") || "") || null,
    endDate: String(formData.get("endDate") || "") || null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  if (id) await getDb().update(medications).set(values).where(and(eq(medications.id, id), eq(medications.userId, auth.userId)));
  else await getDb().insert(medications).values({ id: crypto.randomUUID(), ...values });
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function deleteMedication(formData: FormData) {
  const auth = await requireChatGPTUser("/medications");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await getDb().delete(medicationLogs).where(and(eq(medicationLogs.medicationId, id), eq(medicationLogs.userId, auth.userId)));
  await getDb().delete(medications).where(and(eq(medications.id, id), eq(medications.userId, auth.userId)));
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function toggleMedicationTaken(formData: FormData) {
  const auth = await requireChatGPTUser("/medications");
  const medicationId = String(formData.get("medicationId") || "");
  const today = new Date().toISOString().slice(0, 10);
  const scheduledAt = String(formData.get("scheduledAt") || `${today}T${String(formData.get("time") || "12:00")}:00`);
  const db = getDb();
  const [medication] = await db.select({ id: medications.id }).from(medications).where(and(eq(medications.id, medicationId), eq(medications.userId, auth.userId))).limit(1);
  if (!medication) return;
  const [existing] = await db.select().from(medicationLogs).where(and(eq(medicationLogs.medicationId, medicationId), eq(medicationLogs.userId, auth.userId), eq(medicationLogs.scheduledAt, scheduledAt))).limit(1);
  if (existing) await db.update(medicationLogs).set({ status: existing.status === "taken" ? "planned" : "taken", takenAt: existing.status === "taken" ? null : new Date().toISOString() }).where(and(eq(medicationLogs.id, existing.id), eq(medicationLogs.userId, auth.userId)));
  else await db.insert(medicationLogs).values({ id: crypto.randomUUID(), userId: auth.userId, medicationId, scheduledAt, status: "taken", takenAt: new Date().toISOString() });
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function completeUpcomingVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  const vaccineId = String(formData.get("vaccineId") || "");
  if (!vaccineId) return;
  await ensureCatalog();
  await getDb().insert(vaccinations).values({
    id: crypto.randomUUID(),
    userId: auth.userId,
    vaccineId,
    dateGiven: String(formData.get("dateGiven") || new Date().toISOString().slice(0, 10)) || null,
    doseNumber: Number(formData.get("doseNumber") || 1),
    brand: null,
    clinic: null,
    notes: "Отмечено из списка предстоящих задач",
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/vaccinations");
}

export async function completeMonitoringTask(formData: FormData) {
  const auth = await requireChatGPTUser("/medications");
  const medicationId = String(formData.get("medicationId") || "");
  const ruleId = String(formData.get("ruleId") || "");
  const repeatDays = Math.max(0, Number(formData.get("repeatDays") || 0));
  if (!medicationId || !ruleId) return;
  const [medication] = await getDb().select({ id: medications.id }).from(medications).where(and(eq(medications.id, medicationId), eq(medications.userId, auth.userId))).limit(1);
  if (!medication) return;
  const next = new Date();
  next.setDate(next.getDate() + (repeatDays || 3650));
  const db = getDb();
  const values = { nextDue: next.toISOString().slice(0, 10), completedAt: new Date().toISOString() };
  const [existing] = await db.select({ id: monitoringCompletions.id }).from(monitoringCompletions).where(and(eq(monitoringCompletions.userId, auth.userId), eq(monitoringCompletions.medicationId, medicationId), eq(monitoringCompletions.ruleId, ruleId))).limit(1);
  if (existing) await db.update(monitoringCompletions).set(values).where(and(eq(monitoringCompletions.id, existing.id), eq(monitoringCompletions.userId, auth.userId)));
  else await db.insert(monitoringCompletions).values({ id: crypto.randomUUID(), userId: auth.userId, medicationId, ruleId, ...values });
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function deleteVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  const id = String(formData.get("id") || "");
  if (id) await getDb().delete(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId)));
  revalidatePath("/");
  revalidatePath("/vaccinations");
}

export async function deleteLabResult(formData: FormData) {
  const auth = await requireChatGPTUser("/labs");
  const id = String(formData.get("id") || "");
  if (id) await getDb().delete(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId)));
  revalidatePath("/labs");
}

export async function saveProfile(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const current = await getChatGPTUser();
  await getDb().update(profiles).set({
    fullName: String(formData.get("fullName") || current?.displayName || auth.email).trim(),
    birthDate: String(formData.get("birthDate") || "") || null,
    gender: String(formData.get("gender") || "") || null,
    cityCurrent: String(formData.get("cityCurrent") || "") || null,
    regionCurrent: String(formData.get("regionCurrent") || "") || null,
    countryCurrent: String(formData.get("countryCurrent") || "") || null,
    updatedAt: new Date().toISOString(),
  }).where(eq(profiles.userId, auth.userId));
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function addLabResult(formData: FormData) {
  const auth = await requireChatGPTUser("/labs");
  await getDb().insert(labResults).values({
    id: crypto.randomUUID(),
    userId: auth.userId,
    name: String(formData.get("name") || "Анализ").trim(),
    result: String(formData.get("result") || "") || null,
    unit: String(formData.get("unit") || "") || null,
    referenceRange: String(formData.get("referenceRange") || "") || null,
    testedAt: String(formData.get("testedAt") || "") || null,
    fileKey: null,
    notes: String(formData.get("notes") || "") || null,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/labs");
}
