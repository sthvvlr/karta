import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { authAccounts, authSessions, labResults, medicationLogs, medications, monitoringCompletions, profileLocations, profiles, vaccinations } from "@/db/schema";
import { getMobileUser } from "@/app/mobile-auth";

export async function DELETE(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const db = getDb();
  const files = await db.select({ fileKey: labResults.fileKey }).from(labResults).where(eq(labResults.userId, user.userId));
  if (env.BUCKET) {
    for (const file of files) if (file.fileKey) await env.BUCKET.delete(file.fileKey);
  }
  await db.delete(medicationLogs).where(eq(medicationLogs.userId, user.userId));
  await db.delete(monitoringCompletions).where(eq(monitoringCompletions.userId, user.userId));
  await db.delete(medications).where(eq(medications.userId, user.userId));
  await db.delete(vaccinations).where(eq(vaccinations.userId, user.userId));
  await db.delete(labResults).where(eq(labResults.userId, user.userId));
  await db.delete(profileLocations).where(eq(profileLocations.userId, user.userId));
  await db.delete(profiles).where(eq(profiles.userId, user.userId));
  await db.delete(authSessions).where(eq(authSessions.userId, user.userId));
  await db.delete(authAccounts).where(eq(authAccounts.id, user.userId));
  return NextResponse.json({ status: "deleted" });
}

