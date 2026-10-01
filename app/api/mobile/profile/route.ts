import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile } from "@/app/data";
import { getMobileUser } from "@/app/mobile-auth";

function profileResponse(profile: typeof profiles.$inferSelect) {
  return {
    fullName: profile.fullName,
    birthDate: profile.birthDate,
    gender: profile.gender,
    cityCurrent: profile.cityCurrent,
    regionCurrent: profile.regionCurrent,
    countryCurrent: profile.countryCurrent,
    countryCode: profile.countryCode,
    remindersEnabled: profile.remindersEnabled,
    remindersMorning: profile.remindersMorning,
    remindersEvening: profile.remindersEvening,
  };
}

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const profile = await ensureProfile(user);
  return NextResponse.json({ profile: profileResponse(profile) });
}

export async function PUT(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  await ensureProfile(user);
  await getDb().update(profiles).set({
    fullName: String(body.fullName || user.displayName).trim() || user.displayName,
    birthDate: String(body.birthDate || "") || null,
    gender: String(body.gender || "") || null,
    cityCurrent: String(body.cityCurrent || "") || null,
    regionCurrent: String(body.regionCurrent || "") || null,
    countryCurrent: String(body.countryCurrent || "") || null,
    countryCode: String(body.countryCode || "") || null,
    remindersEnabled: body.remindersEnabled === false ? false : true,
    remindersMorning: String(body.remindersMorning || "08:00"),
    remindersEvening: String(body.remindersEvening || "21:00"),
    updatedAt: new Date().toISOString(),
  }).where(eq(profiles.userId, user.userId));
  const [profile] = await getDb().select().from(profiles).where(eq(profiles.userId, user.userId)).limit(1);
  return NextResponse.json({ profile: profileResponse(profile) });
}

