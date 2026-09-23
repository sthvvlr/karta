import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { ensureCatalog } from "@/app/data";
import { medications, vaccinations } from "@/db/schema";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Требуется вход через ChatGPT" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const now = new Date().toISOString();
  if (body.kind === "vaccination") {
    await ensureCatalog();
    const record = { id: crypto.randomUUID(), userId: user.userId, vaccineId: String(body.vaccineId || ""), dateGiven: String(body.dateGiven || "") || null, doseNumber: Number(body.doseNumber || 1), brand: String(body.brand || "") || null, clinic: String(body.clinic || "") || null, notes: null, createdAt: now };
    await getDb().insert(vaccinations).values(record);
    return NextResponse.json({ record: { id: record.id }, status: "saved" });
  }
  if (body.kind === "medication") {
    const record = { id: crypto.randomUUID(), userId: user.userId, name: String(body.name || "").trim(), dosage: String(body.dosage || "") || null, frequency: String(body.frequency || "") || null, timeSlots: JSON.stringify([String(body.time || "")]), mealRelation: String(body.mealRelation || "") || null, startDate: null, endDate: null, isActive: true, createdAt: now };
    if (!record.name) return NextResponse.json({ error: "Не указано название препарата" }, { status: 400 });
    await getDb().insert(medications).values(record);
    return NextResponse.json({ record: { id: record.id }, status: "saved" });
  }
  return NextResponse.json({ error: "Неизвестный тип записи" }, { status: 400 });
}
