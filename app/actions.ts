"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { getChatGPTUser, getGuestUserFromSession, requireChatGPTUser, createAppSession, clearAppSession } from "./chatgpt-auth";
import { getDb } from "@/db";
import { authAccounts, authSessions, labResults, medicationLogs, medications, monitoringCompletions, profileLocations, profiles, vaccinations, vaccines } from "@/db/schema";
import { readVaccinationMetadata, writeVaccinationMetadata } from "./vaccination-record";
import { ensureCatalog, ensureProfile } from "./data";
import monitoringRules from "./monitoring_rules.json";
import { verifyAppleIdentityToken } from "./apple-auth";

async function removeUpcomingVaccineRows(userId: string, vaccineId: string, exceptId?: string) {
  const db = getDb();
  const candidates = await db.select({ id: vaccinations.id, notes: vaccinations.notes }).from(vaccinations).where(and(eq(vaccinations.userId, userId), eq(vaccinations.vaccineId, vaccineId)));
  const ids = candidates.filter((row) => row.id !== exceptId && readVaccinationMetadata(row.notes).isUpcoming).map((row) => row.id);
  for (const id of ids) await db.delete(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, userId)));
}

async function hashPassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-256" }, material, 256);
  return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function moveGuestData(guestId: string, userId: string, displayName: string, newAccount: boolean) {
  if (!guestId.startsWith("guest:") || guestId === userId) return;
  const db = getDb();
  const [guestAccount] = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.id, guestId)).limit(1);
  if (!guestAccount) return;
  const [guestProfile] = await db.select().from(profiles).where(eq(profiles.userId, guestId)).limit(1);
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!userProfile) return;

  const [currentLocation] = await db.select({ id: profileLocations.id }).from(profileLocations).where(and(eq(profileLocations.userId, userId), eq(profileLocations.isCurrent, true))).limit(1);
  if (currentLocation) await db.update(profileLocations).set({ isCurrent: false }).where(and(eq(profileLocations.userId, guestId), eq(profileLocations.isCurrent, true)));
  await db.update(profileLocations).set({ userId }).where(eq(profileLocations.userId, guestId));

  const guestVaccinations = await db.select().from(vaccinations).where(eq(vaccinations.userId, guestId));
  const userVaccinations = await db.select({ dateGiven: vaccinations.dateGiven }).from(vaccinations).where(eq(vaccinations.userId, userId));
  const occupiedDates = new Set(userVaccinations.map((row) => row.dateGiven).filter((value): value is string => Boolean(value)));
  for (const record of guestVaccinations) {
    if (!record.dateGiven || !occupiedDates.has(record.dateGiven)) continue;
    const metadata = readVaccinationMetadata(record.notes);
    await db.update(vaccinations).set({
      dateGiven: null,
      notes: writeVaccinationMetadata({ ...metadata, dateString: metadata.dateString || record.dateGiven, dateDoneISO: metadata.dateDoneISO || record.dateGiven, userNotes: metadata.userNotes || record.notes }),
    }).where(and(eq(vaccinations.id, record.id), eq(vaccinations.userId, guestId)));
  }

  await db.update(vaccinations).set({ userId }).where(eq(vaccinations.userId, guestId));
  await db.update(medications).set({ userId }).where(eq(medications.userId, guestId));
  await db.update(medicationLogs).set({ userId }).where(eq(medicationLogs.userId, guestId));
  await db.update(monitoringCompletions).set({ userId }).where(eq(monitoringCompletions.userId, guestId));
  await db.update(labResults).set({ userId }).where(eq(labResults.userId, guestId));
  if (guestProfile) {
    await db.update(profiles).set({
      fullName: newAccount ? displayName : userProfile.fullName || guestProfile.fullName || displayName,
      birthDate: userProfile.birthDate || guestProfile.birthDate,
      gender: userProfile.gender || guestProfile.gender,
      cityCurrent: userProfile.cityCurrent || guestProfile.cityCurrent,
      regionCurrent: userProfile.regionCurrent || guestProfile.regionCurrent,
      countryCurrent: userProfile.countryCurrent || guestProfile.countryCurrent,
      countryCode: userProfile.countryCode || guestProfile.countryCode,
      onboardingCompleted: userProfile.onboardingCompleted || guestProfile.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    }).where(eq(profiles.userId, userId));
    await db.delete(profiles).where(eq(profiles.userId, guestId));
  }
  await db.delete(authSessions).where(eq(authSessions.userId, guestId));
  await db.delete(authAccounts).where(eq(authAccounts.id, guestId));
}

const monthLabels = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ru: ["янв.", "февр.", "мар.", "апр.", "май", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
};

const monthAliases = [
  ["jan", "january", "янв", "январ", "январь"], ["feb", "february", "фев", "февр", "феврал", "февраль"],
  ["mar", "march", "мар", "март"], ["apr", "april", "апр", "апрел", "апрель"],
  ["may", "май"], ["jun", "june", "июн", "июнь"], ["jul", "july", "июл", "июль"],
  ["aug", "august", "авг", "август"], ["sep", "sept", "september", "сен", "сент", "сентябр", "сентябрь"],
  ["oct", "october", "окт", "октябр", "октябрь"], ["nov", "november", "ноя", "нояб", "ноябр", "ноябрь"],
  ["dec", "december", "дек", "декабр", "декабрь"],
];

function exactDateLabel(value: string, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function monthDateLabel(value: string, en: boolean) {
  const [year, month] = value.split("-").map(Number);
  const label = monthLabels[en ? "en" : "ru"][month - 1];
  return `${en ? label : label[0].toLocaleUpperCase("ru-RU") + label.slice(1)} ${year}`;
}

function parseVaccinationDate(raw: string, en: boolean) {
  const value = raw.trim();
  if (!value) return { dateGiven: null, dateString: "", dateMonthISO: null, dateDoneISO: null };

  const isoDay = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const monthYear = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  if (isoDay) {
    year = Number(isoDay[1]); month = Number(isoDay[2]); day = Number(isoDay[3]);
  } else if (monthYear) {
    year = Number(monthYear[1]); month = Number(monthYear[2]);
  } else {
    const numericDay = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value);
    const namedMonthYear = /^([\p{L}.]+)\s+(\d{4})$/u.exec(value);
    const namedDayMonth = /^(\d{1,2})\s+([\p{L}.]+)\s+(\d{4})$/u.exec(value);
    const namedMonthDay = /^([\p{L}.]+)\s+(\d{1,2}),?\s+(\d{4})$/u.exec(value);
    if (numericDay) { day = Number(numericDay[1]); month = Number(numericDay[2]); year = Number(numericDay[3]); }
    else if (namedMonthYear || namedDayMonth || namedMonthDay) {
      const match = namedMonthYear || namedDayMonth || namedMonthDay!;
      const monthText = (namedDayMonth ? namedDayMonth[2] : match[1]).toLocaleLowerCase().replace(/\.$/, "");
      const monthIndex = monthAliases.findIndex((aliases) => aliases.includes(monthText));
      if (monthIndex >= 0) {
        month = monthIndex + 1;
        year = Number(namedMonthYear ? namedMonthYear[2] : namedDayMonth ? namedDayMonth[3] : namedMonthDay![3]);
        if (namedDayMonth) day = Number(namedDayMonth[1]);
        if (namedMonthDay) day = Number(namedMonthDay[2]);
      }
    }
  }

  if (year && month && day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { dateGiven: iso, dateString: exactDateLabel(iso, en), dateMonthISO: null, dateDoneISO: iso };
    }
  }
  if (year && month && !day && month >= 1 && month <= 12) {
    const iso = `${year}-${String(month).padStart(2, "0")}`;
    return { dateGiven: iso, dateString: monthDateLabel(iso, en), dateMonthISO: iso, dateDoneISO: null };
  }
  return { dateGiven: null, dateString: value, dateMonthISO: null, dateDoneISO: null };
}

export async function registerAccount(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/");
  if (!email.includes("@") || password.length < 6 || displayName.length < 2 || password !== confirmPassword) redirect(`/register?error=${encodeURIComponent(password !== confirmPassword ? "Пароли не совпадают." : "Проверьте имя, email и пароль (минимум 6 символов).")}`);
  const db = getDb();
  const [existing] = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
  if (existing) redirect(`/login?error=${encodeURIComponent("Аккаунт с таким email уже существует.")}`);
  const id = `email:${crypto.randomUUID()}`;
  const salt = crypto.randomUUID();
  const passwordHash = `${salt}:${await hashPassword(password, salt)}`;
  await db.insert(authAccounts).values({ id, email, passwordHash, displayName, createdAt: new Date().toISOString() });
  await ensureProfile({ userId: id, email, displayName });
  const guest = await getGuestUserFromSession();
  if (guest) await moveGuestData(guest.userId, id, displayName, true);
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
  await ensureProfile({ userId: account.id, email: account.email, displayName: account.displayName });
  const guest = await getGuestUserFromSession();
  if (guest) await moveGuestData(guest.userId, account.id, account.displayName, false);
  await createAppSession(account.id);
  redirect(returnTo.startsWith("/") ? returnTo : "/");
}

export async function startGuestSession(formData: FormData) {
  const deviceId = String(formData.get("deviceId") || "").trim().toLowerCase();
  const returnTo = String(formData.get("returnTo") || "/");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(deviceId)) redirect("/login");
  const userId = `guest:${deviceId}`;
  const email = `guest-${deviceId}@guest.karta.invalid`;
  const db = getDb();
  let [account] = await db.select().from(authAccounts).where(eq(authAccounts.id, userId)).limit(1);
  if (!account) {
    account = { id: userId, email, passwordHash: `guest:${crypto.randomUUID()}`, displayName: "Guest", createdAt: new Date().toISOString() };
    await db.insert(authAccounts).values(account);
  }
  await ensureProfile({ userId, email, displayName: account.displayName });
  await createAppSession(userId);
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
}

export async function loginWithApple(formData: FormData) {
  const identityToken = String(formData.get("identityToken") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/");
  const appleWebClientId = (env as unknown as Record<string, string | undefined>).APPLE_WEB_CLIENT_ID || "";
  if (!appleWebClientId || !identityToken) redirect(`/login?error=${encodeURIComponent("Вход через Apple пока не настроен для веб-версии.")}`);
  let claims;
  try { claims = await verifyAppleIdentityToken(identityToken, [appleWebClientId]); }
  catch { redirect(`/login?error=${encodeURIComponent("Не удалось проверить вход через Apple.")}`); }

  const db = getDb();
  const accountId = `apple:${claims.sub}`;
  let [account] = await db.select().from(authAccounts).where(eq(authAccounts.id, accountId)).limit(1);
  if (!account && claims.email) [account] = await db.select().from(authAccounts).where(eq(authAccounts.email, claims.email.toLowerCase())).limit(1);
  if (!account) {
    const email = (claims.email || `${claims.sub}@apple.karta`).toLowerCase();
    account = { id: accountId, email, passwordHash: `apple:${crypto.randomUUID()}`, displayName: fullName || email, createdAt: new Date().toISOString() };
    await db.insert(authAccounts).values(account);
  } else if (fullName && account.displayName !== fullName) {
    await db.update(authAccounts).set({ displayName: fullName }).where(eq(authAccounts.id, account.id));
    account.displayName = fullName;
  }
  await ensureProfile({ userId: account.id, email: account.email, displayName: account.displayName });
  const guest = await getGuestUserFromSession();
  if (guest) await moveGuestData(guest.userId, account.id, account.displayName, false);
  await createAppSession(account.id);
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
}

export async function changePassword(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const nextPassword = String(formData.get("newPassword") || "");
  if (auth.userId.startsWith("email:") && nextPassword.length >= 6) {
    const salt = crypto.randomUUID();
    const passwordHash = `${salt}:${await hashPassword(nextPassword, salt)}`;
    await getDb().update(authAccounts).set({ passwordHash }).where(eq(authAccounts.id, auth.userId));
  }
  revalidatePath("/profile");
}

export async function signOutAccount() {
  await clearAppSession();
  redirect("/");
}

export async function deleteAccountData() {
  const auth = await requireChatGPTUser("/profile");
  const db = getDb();
  const labFiles = await db.select({ fileKey: labResults.fileKey }).from(labResults).where(eq(labResults.userId, auth.userId));
  if (env.BUCKET) {
    for (const file of labFiles) if (file.fileKey) await env.BUCKET.delete(file.fileKey);
  }
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
  const customName = String(formData.get("customName") || "").trim();
  const vaccineId = String(formData.get("vaccineId") || "");
  if (!customName && !vaccineId) return;
  const isUpcoming = formData.get("isUpcoming") === "true";
  const dateInput = String(formData.get("dateGiven") || "");
  const parsedDate = parseVaccinationDate(dateInput, (await cookies()).get("karta_lang")?.value === "en");
  const dateGiven = parsedDate.dateGiven;
  const [catalogVaccine] = vaccineId ? await getDb().select({ totalDoses: vaccines.totalDoses }).from(vaccines).where(eq(vaccines.id, vaccineId)).limit(1) : [];
  const totalDoses = Math.max(1, Math.min(10, Number(customName ? formData.get("totalDoses") || 1 : catalogVaccine?.totalDoses || 1)));
  const nextDue = String(formData.get("nextDue") || "") || null;
  const userNotes = String(formData.get("notes") || "") || null;
  const id = crypto.randomUUID();
  await getDb().insert(vaccinations).values({
    id,
    userId: auth.userId,
    vaccineId: customName ? `custom:${id}` : vaccineId,
    dateGiven: isUpcoming ? null : dateGiven,
    doseNumber: Number(formData.get("doseNumber") || 1),
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: writeVaccinationMetadata({ name: customName || undefined, isUpcoming, totalDoses, nextDue, dateString: isUpcoming ? "" : parsedDate.dateString, dateMonthISO: isUpcoming ? null : parsedDate.dateMonthISO, dateDoneISO: isUpcoming ? null : parsedDate.dateDoneISO, userNotes }),
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/vaccinations");
}

export async function updateVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = getDb();
  const [existing] = await db.select().from(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId))).limit(1);
  if (!existing) return;
  const customName = String(formData.get("customName") || "").trim();
  const vaccineId = customName ? `custom:${id}` : String(formData.get("vaccineId") || existing.vaccineId);
  const [catalogVaccine] = vaccineId.startsWith("custom:") ? [] : await db.select({ totalDoses: vaccines.totalDoses }).from(vaccines).where(eq(vaccines.id, vaccineId)).limit(1);
  const dateInput = String(formData.get("dateGiven") || "");
  const parsedDate = parseVaccinationDate(dateInput, (await cookies()).get("karta_lang")?.value === "en");
  const dateGiven = parsedDate.dateGiven;
  await db.update(vaccinations).set({
    vaccineId,
    dateGiven,
    doseNumber: Number(formData.get("doseNumber") || 1),
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: writeVaccinationMetadata({
      name: customName || undefined,
      isUpcoming: false,
      totalDoses: Math.max(1, Math.min(10, Number(customName ? formData.get("totalDoses") || 1 : catalogVaccine?.totalDoses || 1))),
      nextDue: String(formData.get("nextDue") || "") || null,
      dateString: parsedDate.dateString,
      dateMonthISO: parsedDate.dateMonthISO,
      dateDoneISO: parsedDate.dateDoneISO,
      userNotes: String(formData.get("notes") || "") || null,
    }),
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
    notes: String(formData.get("notes") || "").trim() || null,
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
  const candidate = String(formData.get("scheduledAt") || "").slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate);
  const validDay = match && new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).toISOString().slice(0, 10) === candidate;
  const day = validDay ? candidate : new Date().toISOString().slice(0, 10);
  const nextDayDate = new Date(`${day}T00:00:00.000Z`);
  nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1);
  const dayStart = `${day}T00:00:00`;
  const dayEnd = `${nextDayDate.toISOString().slice(0, 10)}T00:00:00`;
  const db = getDb();
  const [medication] = await db.select({ id: medications.id }).from(medications).where(and(eq(medications.id, medicationId), eq(medications.userId, auth.userId))).limit(1);
  if (!medication) return;
  const dayLogs = await db.select({ id: medicationLogs.id, status: medicationLogs.status }).from(medicationLogs).where(and(
    eq(medicationLogs.medicationId, medicationId),
    eq(medicationLogs.userId, auth.userId),
    gte(medicationLogs.scheduledAt, dayStart),
    lt(medicationLogs.scheduledAt, dayEnd),
  ));
  const nextStatus = dayLogs.some((log) => log.status === "taken") ? "planned" : "taken";
  const takenAt = nextStatus === "taken" ? new Date().toISOString() : null;
  if (dayLogs.length) {
    await db.update(medicationLogs).set({ status: nextStatus, takenAt }).where(and(
      eq(medicationLogs.medicationId, medicationId),
      eq(medicationLogs.userId, auth.userId),
      gte(medicationLogs.scheduledAt, dayStart),
      lt(medicationLogs.scheduledAt, dayEnd),
    ));
  } else {
    await db.insert(medicationLogs).values({ id: crypto.randomUUID(), userId: auth.userId, medicationId, scheduledAt: dayStart, status: nextStatus, takenAt });
  }
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function completeUpcomingVaccination(formData: FormData) {
  const auth = await requireChatGPTUser("/vaccinations");
  const id = String(formData.get("id") || "");
  const vaccineId = String(formData.get("vaccineId") || "");
  const dateGiven = String(formData.get("dateGiven") || new Date().toISOString().slice(0, 10));
  if (id) {
    const db = getDb();
    const [existing] = await db.select().from(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId))).limit(1);
    if (!existing) return;
    const metadata = readVaccinationMetadata(existing.notes);
    if (!existing.vaccineId.startsWith("custom:")) await removeUpcomingVaccineRows(auth.userId, existing.vaccineId, id);
    await db.update(vaccinations).set({
      dateGiven,
      notes: writeVaccinationMetadata({ ...metadata, isUpcoming: false, dateString: dateGiven, dateDoneISO: dateGiven }),
      brand: String(formData.get("brand") || "") || existing.brand,
      clinic: String(formData.get("clinic") || "") || existing.clinic,
    }).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId)));
    revalidatePath("/");
    revalidatePath("/vaccinations");
    return;
  }
  if (!vaccineId) return;
  await ensureCatalog();
  const doseNumber = Math.max(1, Number(formData.get("doseNumber") || 1));
  const totalDoses = Math.max(1, Number(formData.get("totalDoses") || 1));
  await getDb().insert(vaccinations).values({
    id: crypto.randomUUID(),
    userId: auth.userId,
    vaccineId,
    dateGiven,
    doseNumber,
    brand: String(formData.get("brand") || "") || null,
    clinic: String(formData.get("clinic") || "") || null,
    notes: writeVaccinationMetadata({ isUpcoming: false, totalDoses, nextDue: null, dateString: dateGiven, dateDoneISO: dateGiven, userNotes: String(formData.get("notes") || "Отмечено из списка предстоящих задач") }),
    createdAt: new Date().toISOString(),
  });
  await removeUpcomingVaccineRows(auth.userId, vaccineId);
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
  if (id) {
    const db = getDb();
    const [record] = await db.select().from(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId))).limit(1);
    if (record) {
      const metadata = readVaccinationMetadata(record.notes);
      if (!metadata.isUpcoming && !record.vaccineId.startsWith("custom:")) {
        const related = await db.select({ id: vaccinations.id, notes: vaccinations.notes }).from(vaccinations).where(and(eq(vaccinations.userId, auth.userId), eq(vaccinations.vaccineId, record.vaccineId)));
        const pendingIds = related.filter((row) => readVaccinationMetadata(row.notes).isUpcoming).map((row) => row.id);
        for (const pendingId of pendingIds) await db.delete(vaccinations).where(and(eq(vaccinations.id, pendingId), eq(vaccinations.userId, auth.userId)));
      }
      await db.delete(vaccinations).where(and(eq(vaccinations.id, id), eq(vaccinations.userId, auth.userId)));
    }
  }
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

export async function saveOnboarding(formData: FormData) {
  const auth = await requireChatGPTUser("/onboarding");
  const current = await getChatGPTUser();
  const fullName = String(formData.get("fullName") || current?.displayName || auth.email).trim();
  const birthDate = String(formData.get("birthDate") || "") || null;
  const gender = String(formData.get("gender") || "") || null;
  const city = String(formData.get("cityCurrent") || "").trim();
  const region = String(formData.get("regionCurrent") || "") || null;
  const country = String(formData.get("countryCurrent") || "") || null;
  const countryCode = String(formData.get("countryCode") || "") || null;
  const pastCity = String(formData.get("historyCity") || "").trim();
  const pastRegion = String(formData.get("historyCityRegion") || "") || null;
  const pastCountry = String(formData.get("historyCityCountry") || "") || null;
  const pastCountryCode = String(formData.get("historyCityCountryCode") || "") || null;
  if (fullName.length < 2 || !city) redirect("/onboarding");

  const db = getDb();
  await db.update(profiles).set({
    fullName, birthDate, gender, cityCurrent: city, regionCurrent: region,
    countryCurrent: country, countryCode, onboardingCompleted: true,
    updatedAt: new Date().toISOString(),
  }).where(eq(profiles.userId, auth.userId));

  await db.update(profileLocations).set({ isCurrent: false }).where(eq(profileLocations.userId, auth.userId));
  const currentLocation = await db.select({ id: profileLocations.id }).from(profileLocations)
    .where(and(eq(profileLocations.userId, auth.userId), eq(profileLocations.city, city))).limit(1);
  if (currentLocation[0]) {
    await db.update(profileLocations).set({ country, region, countryCode, isCurrent: true })
      .where(eq(profileLocations.id, currentLocation[0].id));
  } else {
    await db.insert(profileLocations).values({ id: crypto.randomUUID(), userId: auth.userId, city, country, region, countryCode, fromYear: null, toYear: null, isCurrent: true });
  }

  if (pastCity && pastCity.toLocaleLowerCase() !== city.toLocaleLowerCase()) {
    const previousLocation = await db.select({ id: profileLocations.id }).from(profileLocations)
      .where(and(eq(profileLocations.userId, auth.userId), eq(profileLocations.city, pastCity))).limit(1);
    if (previousLocation[0]) {
      await db.update(profileLocations).set({ country: pastCountry, region: pastRegion, countryCode: pastCountryCode, isCurrent: false })
        .where(eq(profileLocations.id, previousLocation[0].id));
    } else {
      await db.insert(profileLocations).values({ id: crypto.randomUUID(), userId: auth.userId, city: pastCity, country: pastCountry, region: pastRegion, countryCode: pastCountryCode, fromYear: null, toYear: null, isCurrent: false });
    }
  }

  revalidatePath("/");
  revalidatePath("/profile");
  redirect("/");
}

export async function saveReminderSettings(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const enabled = String(formData.get("enabled") || "false") === "true";
  const morning = String(formData.get("morning") || "08:00").match(/^([01]\d|2[0-3]):[0-5]\d$/)?.[0] || "08:00";
  const evening = String(formData.get("evening") || "21:00").match(/^([01]\d|2[0-3]):[0-5]\d$/)?.[0] || "21:00";
  await getDb().update(profiles).set({ remindersEnabled: enabled, remindersMorning: morning, remindersEvening: evening, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, auth.userId));
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
    fromDate: null,
    toDate: null,
    fromYear: null,
    toYear: null,
    isCurrent: false,
  });
  revalidatePath("/profile");
}

export async function updateProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const id = String(formData.get("id") || "");
  const [location] = await getDb().select().from(profileLocations)
    .where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId))).limit(1);
  if (!location) return;

  const fromDate = String(formData.get("fromDate") || "").trim();
  const requestedToDate = String(formData.get("toDate") || "").trim();
  const validDate = (value: string) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!validDate(fromDate) || !validDate(requestedToDate) || (fromDate && requestedToDate && requestedToDate < fromDate)) return;

  const toDate = location.isCurrent ? null : requestedToDate || null;
  await getDb().update(profileLocations).set({ fromDate: fromDate || null, toDate })
    .where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId)));
  revalidatePath("/profile");
}

export async function deleteProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const id = String(formData.get("id") || "");
  if (id) {
    const db = getDb();
    const [location] = await db.select({ isCurrent: profileLocations.isCurrent }).from(profileLocations)
      .where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId))).limit(1);
    if (location) {
      await db.delete(profileLocations).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId)));
      if (location.isCurrent) {
        await db.update(profiles).set({ cityCurrent: null, regionCurrent: null, countryCurrent: null, countryCode: null, updatedAt: new Date().toISOString() })
          .where(eq(profiles.userId, auth.userId));
      }
    }
  }
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function setCurrentProfileLocation(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const id = String(formData.get("id") || "");
  const [location] = await getDb().select().from(profileLocations).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId))).limit(1);
  if (!location) return;
  await getDb().update(profileLocations).set({ isCurrent: false }).where(eq(profileLocations.userId, auth.userId));
  await getDb().update(profileLocations).set({ isCurrent: true, toDate: null }).where(and(eq(profileLocations.id, id), eq(profileLocations.userId, auth.userId)));
  await getDb().update(profiles).set({ cityCurrent: location.city, regionCurrent: location.region, countryCurrent: location.country, countryCode: location.countryCode, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, auth.userId));
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function addLabResult(formData: FormData) {
  const auth = await requireChatGPTUser("/labs");
  const id = String(formData.get("id") || "") || crypto.randomUUID();
  const db = getDb();
  const [existing] = await db.select({ fileKey: labResults.fileKey }).from(labResults).where(and(eq(labResults.id, id), eq(labResults.userId, auth.userId))).limit(1);
  const removeExistingFile = String(formData.get("removeFile") || "") === "true";
  const previousFileKey = existing?.fileKey || null;
  let fileKey = removeExistingFile ? null : previousFileKey;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0 && env.BUCKET) {
    const nextFileKey = `labs/${auth.userId}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await env.BUCKET.put(nextFileKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    fileKey = nextFileKey;
  }
  if (previousFileKey && previousFileKey !== fileKey && env.BUCKET) await env.BUCKET.delete(previousFileKey);
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
  const monitoringMedicationId = String(formData.get("monitoringMedicationId") || "");
  const monitoringRuleId = String(formData.get("monitoringRuleId") || "");
  if (monitoringMedicationId && monitoringRuleId) {
    const [medication] = await db.select({ id: medications.id, drugCode: medications.drugCode }).from(medications).where(and(eq(medications.id, monitoringMedicationId), eq(medications.userId, auth.userId), eq(medications.isActive, true))).limit(1);
    const rule = monitoringRules.find((item) => item.id === monitoringRuleId && medication?.drugCode && item.drug_codes.includes(medication.drugCode));
    if (medication && rule) {
      const next = new Date();
      next.setDate(next.getDate() + (rule.repeat_days || 3650));
      const completion = { nextDue: next.toISOString().slice(0, 10), completedAt: new Date().toISOString() };
      const [previous] = await db.select({ id: monitoringCompletions.id }).from(monitoringCompletions).where(and(eq(monitoringCompletions.userId, auth.userId), eq(monitoringCompletions.medicationId, medication.id), eq(monitoringCompletions.ruleId, rule.id))).limit(1);
      if (previous) await db.update(monitoringCompletions).set(completion).where(and(eq(monitoringCompletions.id, previous.id), eq(monitoringCompletions.userId, auth.userId)));
      else await db.insert(monitoringCompletions).values({ id: crypto.randomUUID(), userId: auth.userId, medicationId: medication.id, ruleId: rule.id, ...completion });
    }
  }
  revalidatePath("/labs");
  revalidatePath("/");
  revalidatePath("/medications");
}
