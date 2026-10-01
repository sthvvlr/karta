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
  const [account] = await getDb().select().from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
  if (!account) return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });

  const [salt, expected] = account.passwordHash.split(":");
  if (!salt || !expected || await hashPassword(password, salt) !== expected) {
    return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
  }

  await ensureProfile({ userId: account.id, email: account.email, displayName: account.displayName });
  const token = await createMobileSession(account.id);
  return NextResponse.json(mobileUserResponse({ userId: account.id, email: account.email, displayName: account.displayName }, token));
}

