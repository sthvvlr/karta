import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  medications,
  profiles,
  vaccineDoses,
  vaccineBrands,
  vaccines,
  vaccinations,
} from "@/db/schema";
import catalog from "./vaccinations_catalog.json";
import brandCatalog from "./vaccine_brands.json";

export type AppUser = {
  userId: string;
  email: string;
  displayName: string;
};

export async function ensureProfile(user: AppUser) {
  const db = getDb();
  const existing = await db.select().from(profiles).where(eq(profiles.userId, user.userId)).limit(1);
  if (existing[0]) return existing[0];

  const now = new Date().toISOString();
  const row = {
    userId: user.userId,
    email: user.email,
    fullName: user.displayName,
    birthDate: null,
    gender: null,
    cityCurrent: null,
    countryCurrent: null,
    countryCode: null,
    regionCurrent: null,
    remindersEnabled: true,
    remindersMorning: "08:00",
    remindersEvening: "21:00",
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(profiles).values(row);
  return row;
}

export async function ensureCatalog() {
  const db = getDb();
  const existing = await db.select({ id: vaccines.id }).from(vaccines).limit(1);
  if (existing.length) return;

  const now = new Date().toISOString();
  const vaccineRows = catalog.map((item) => ({
    id: item.id,
    nameRu: item.nameRu,
    nameEn: item.nameEn,
    descriptionRu: item.descriptionRu,
    scheduleRu: item.scheduleRu,
    intervalYears: item.intervalYears,
    totalDoses: item.totalDoses,
    audience: item.audience,
    pregnancyRelevant: item.pregnancyRelevant,
    createdAt: now,
  }));
  for (let index = 0; index < vaccineRows.length; index += 3) {
    await db.insert(vaccines).values(vaccineRows.slice(index, index + 3));
  }

  const doseRows = catalog.flatMap((item) =>
    Array.from({ length: item.totalDoses || 1 }, (_, index) => ({
      id: `${item.id}_dose_${index + 1}`,
      vaccineId: item.id,
      doseNumber: index + 1,
      afterPreviousDays: item.doseScheduleDays[index - 1] ?? null,
    }))
  );
  for (let index = 0; index < doseRows.length; index += 10) {
    await db.insert(vaccineDoses).values(doseRows.slice(index, index + 10));
  }

  const brandRows = Object.entries(brandCatalog).flatMap(([vaccineId, names]) =>
    (names as string[]).map((name, index) => ({
      id: `${vaccineId}_brand_${index}`,
      vaccineId,
      name,
      region: null,
    }))
  );
  for (let index = 0; index < brandRows.length; index += 10) {
    await db.insert(vaccineBrands).values(brandRows.slice(index, index + 10));
  }
}

export async function getUserData(user: AppUser) {
  await ensureProfile(user);
  await ensureCatalog();
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.userId)).limit(1);
  const userVaccinations = await db
    .select({ record: vaccinations, vaccine: vaccines })
    .from(vaccinations)
    .leftJoin(vaccines, eq(vaccinations.vaccineId, vaccines.id))
    .where(eq(vaccinations.userId, user.userId))
    .orderBy(desc(vaccinations.dateGiven));
  const userMedications = await db.select().from(medications)
    .where(and(eq(medications.userId, user.userId), eq(medications.isActive, true)))
    .orderBy(desc(medications.createdAt));
  const availableVaccines = await db.select().from(vaccines).orderBy(vaccines.nameRu);

  return { profile, vaccinations: userVaccinations, medications: userMedications, vaccines: availableVaccines };
}

export function hasDatabase() {
  return Boolean(env.DB);
}
