"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { env } from "cloudflare:workers";
import { getChatGPTUser, requireChatGPTUser, createAppSession, clearAppSession } from "./chatgpt-auth";
import { getDb } from "@/db";
import { authAccounts, authSessions, labResults, medicationLogs, medications, monitoringCompletions, profileLocations, profiles, vaccinations } from "@/db/schema";
import { ensureCatalog, ensureProfile } from "./data";

async function hashPassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" }, material, 256);
  return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function registerAccount(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/");
  if (!email.includes("@") || password.length < 6 || displayName.length < 2) redirect(`/register?error=${encodeURIComponent("Проверьте имя, email и пароль (минимум 6 символов).")}`);
  const db = getDb();
  const [existing] = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
  if (existing) redirect(`/login?error=${encodeURIComponent("Аккаунт с таким email уже существует.")}`);
  const id = `email:${crypto.randomUUID()}`;
  const salt = crypto.randomUUID();
  const passwordHash = `${salt}:${await hashPassword(password, salt)}`;
  await db.insert(authAccounts).values({ id, email, passwordHash, displayName, createdAt: new Date().toISOString() });
  await ensureProfile({ userId: id, email, displayName });
  await createAppSession(id);
  redirect(returnTo.startsWith("/") ? returnTo : "/");
}

export async function loginAccount(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/");
  const [account] = await getDb().select().from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
  if (!account) redirect(`/login?error=${encodeURIComponent("Неверный email или пароль.")}`);
  const [salt, expected] = account.passwordHash.split(":");
  const actual = await hashPassword(password, salt);
  if (actual !== expected) redirect(`/login?error=${encodeURIComponent("Неверный email или пароль.")}`);
  await createAppSession(account.id);
  redirect(returnTo.startsWith("/") ? returnTo : "/");
}

export async function signOutAccount() {
  await clearAppSession();
  redirect("/");
}

export async function deleteAccountData() {
  const auth = await requireChatGPTUser("/profile");
  const db = getDb();
  await db.delete(medicationLogs).where(eq(medicationLogs.userId, auth.userId));
  await db.delete(monitoringCompletions).where(eq(monitoringCompletions.userId, auth.userId));
  await db.delete(medications).where(eq(medications.userId, auth.userId));
  await db.delete(vaccinations).where(eq(vaccinations.userId, auth.userId));
  await db.delete(labResults).where(eq(labResults.userId, auth.userId));
  await db.delete(profileLocations).where(eq(profileLocations.userId, auth.userId));
  await db.delete(profiles).where(eq(profiles.userId, auth.userId));
  await db.delete(authSessions).where(eq(authSessions.userId, auth.userId));
  await db.delete(authAccounts).where(eq(authAccounts.id, auth.userId));
  await clearAppSession();
  redirect("/");
}

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

export async function updateVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await getDb().update(vaccinations).set({
    vaccineId: String(formData.get("vaccineId") || ""),
    dateGiven: String(formData.get("dateGiven") || "") || null,
    doseNumber: Number(formData.get("doseNumber") || 1),
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  }).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId)));
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
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: String(formData.get("notes") || "Отмечено из списка предстоящих задач"),
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
  if (id) {
    const [row] = await getDb().select({ fileKey: labResults.fileKey }).from(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId))).limit(1);
    if (row?.fileKey && env.BUCKET) await env.BUCKET.delete(row.fileKey);
    await getDb().delete(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId)));
  }
  revalidatePath("/labs");
}

export async function updateLabResult(formData: FormData) {
  return addLabResult(formData);
}

export async function saveProfile(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const current = await getChatGPTUser();
  const city = String(formData.get("cityCurrent") || "") || null;
  const region = String(formData.get("regionCurrent") || "") || null;
  const country = String(formData.get("countryCurrent") || "") || null;
  const countryCode = String(formData.get("countryCode") || "") || null;
  const db = getDb();
  await db.update(profiles).set({
    fullName: String(formData.get("fullName") || current?.displayName || auth.email).trim(),
    birthDate: String(formData.get("birthDate") || "") || null,
    gender: String(formData.get("gender") || "") || null,
    cityCurrent: city,
    regionCurrent: region,
    countryCurrent: country,
    countryCode,
    updatedAt: new Date().toISOString(),
  }).where(eq(profiles.userId, auth.userId));
  if (city) {
    await db.update(profileLocations).set({ isCurrent: false }).where(eq(profileLocations.userId, auth.userId));
    const [existingLocation] = await db.select({ id: profileLocations.id }).from(profileLocations).where(and(eq(profileLocations.userId, auth.userId), eq(profileLocations.city, city))).limit(1);
    if (existingLocation) await db.update(profileLocations).set({ country, region, countryCode, isCurrent: true }).where(eq(profileLocations.id, existingLocation.id));
    else await db.insert(profileLocations).values({ id: crypto.randomUUID(), userId: auth.userId, city, country, region, countryCode, fromYear: null, toYear: null, isCurrent: true });
  }
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function addProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const city = String(formData.get("historyCity") || "").trim();
  if (!city) return;
  await getDb().insert(profileLocations).values({
    id: crypto.randomUUID(), userId: auth.userId, city,
    country: String(formData.get("historyCityCountry") || "") || null,
    region: String(formData.get("historyCityRegion") || "") || null,
    countryCode: String(formData.get("historyCityCountryCode") || "") || null,
    fromYear: Number(formData.get("fromYear") || 0) || null,
    toYear: Number(formData.get("toYear") || 0) || null,
    isCurrent: false,
  });
  revalidatePath("/profile");
}

export async function deleteProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const id = String(formData.get("id") || "");
  if (id) await getDb().delete(profileLocations).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId)));
  revalidatePath("/profile");
}

export async function setCurrentProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const id = String(formData.get("id") || "");
  const [location] = await getDb().select().from(profileLocations).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId))).limit(1);
  if (!location) return;
  await getDb().update(profileLocations).set({ isCurrent: false }).where(eq(profileLocations.userId, auth.userId));
  await getDb().update(profileLocations).set({ isCurrent: true }).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId)));
  await getDb().update(profiles).set({ cityCurrent: location.city, regionCurrent: location.region, countryCurrent: location.country, countryCode: location.countryCode, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, auth.userId));
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function addLabResult(formData: FormData) {
  const auth = await requireChatGPTUser("/labs");
  const id = String(formData.get("id") || "") || crypto.randomUUID();
  const db = getDb();
  const [existing] = await db.select({ fileKey: labResults.fileKey }).from(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId))).limit(1);
  let fileKey = existing?.fileKey || null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0 && env.BUCKET) {
    fileKey = `labs/${auth.userId}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await env.BUCKET.put(fileKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  }
  const values = {
    userId: auth.userId,
    name: String(formData.get("name") || "Анализ").trim(),
    result: String(formData.get("result") || "") || null,
    unit: String(formData.get("unit") || "") || null,
    referenceRange: String(formData.get("referenceRange") || "") || null,
    testedAt: String(formData.get("testedAt") || "") || null,
    fileKey,
    notes: String(formData.get("notes") || "") || null,
    indicators: String(formData.get("indicators") || "[]"),
    createdAt: new Date().toISOString(),
  };
  if (existing) await db.update(labResults).set(values).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId)));
  else await db.insert(labResults).values({ id, ...values });
  revalidatePath("/labs");
}
