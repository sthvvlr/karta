import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authAccounts } from "@/db/schema";
import { getDb } from "@/db";
import { ensureProfile } from "@/app/data";
import { createMobileSession, mobileUserResponse } from "@/app/mobile-auth";

async function hashPassword(password: string, salt: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" }, material, 256);
  return Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim();
  if (!email.includes("@") || password.length < 6 || displayName.length < 2) {
    return NextResponse.json({ error: "Проверьте имя, email и пароль (минимум 6 символов)." }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
  if (existing) return NextResponse.json({ error: "Аккаунт с таким email уже существует." }, { status: 409 });

  const id = `email:${crypto.randomUUID()}`;
  const salt = crypto.randomUUID();
  const passwordHash = `${salt}:${await hashPassword(password, salt)}`;
  await db.insert(authAccounts).values({ id, email, passwordHash, displayName, createdAt: new Date().toISOString() });
  await ensureProfile({ userId: id, email, displayName });
  const token = await createMobileSession(id);
  return NextResponse.json(mobileUserResponse({ userId: id, email, displayName }, token));
}

