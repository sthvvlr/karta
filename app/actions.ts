"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";
import { getDb } from "@/db";
import { labResults, medications, profiles, vaccinations } from "@/db/schema";
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
  await getDb().insert(medications).values({
    id: crypto.randomUUID(),
    userId: auth.userId,
    name: String(formData.get("name") || "Новый препарат").trim(),
    dosage: String(formData.get("dosage") || "") || null,
    frequency: String(formData.get("frequency") || "") || null,
    timeSlots: JSON.stringify([String(formData.get("time") || "")]),
    mealRelation: String(formData.get("mealRelation") || "") || null,
    startDate: String(formData.get("startDate") || "") || null,
    endDate: String(formData.get("endDate") || "") || null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/medications");
}

export async function saveProfile(formData: FormData) {
  const auth = await requireChatGPTUser("/profile");
  const current = await getChatGPTUser();
  await getDb().update(profiles).set({
    fullName: String(formData.get("fullName") || current?.displayName || auth.email).trim(),
    birthDate: String(formData.get("birthDate") || "") || null,
    gender: String(formData.get("gender") || "") || null,
    cityCurrent: String(formData.get("cityCurrent") || "") || null,
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
