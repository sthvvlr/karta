import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authAccounts, profiles } from "@/db/schema";
import { ensureProfile } from "@/app/data";
import { createMobileSession, mobileUserResponse } from "@/app/mobile-auth";
import { verifyAppleIdentityToken } from "@/app/apple-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const identityToken = String(body.identityToken || "");
  const fullName = String(body.fullName || "").trim();
  if (!identityToken) return NextResponse.json({ error: "Apple identity token is required." }, { status: 400 });

  let claims;
  try { claims = await verifyAppleIdentityToken(identityToken); }
  catch { return NextResponse.json({ error: "Не удалось проверить вход через Apple." }, { status: 401 }); }

  const db = getDb();
  const accountId = `apple:${claims.sub}`;
  let [account] = await db.select().from(authAccounts).where(eq(authAccounts.id, accountId)).limit(1);
  if (!account && claims.email) {
    [account] = await db.select().from(authAccounts).where(eq(authAccounts.email, claims.email.toLowerCase())).limit(1);
  }
  if (!account) {
    const email = (claims.email || `${claims.sub}@apple.karta`).toLowerCase();
    account = {
      id: accountId,
      email,
      passwordHash: `apple:${crypto.randomUUID()}`,
      displayName: fullName || email,
      createdAt: new Date().toISOString(),
    };
    await db.insert(authAccounts).values(account);
  } else if (fullName && account.displayName !== fullName) {
    await db.update(authAccounts).set({ displayName: fullName }).where(eq(authAccounts.id, account.id));
    account.displayName = fullName;
  }

  await ensureProfile({ userId: account.id, email: account.email, displayName: account.displayName });
  if (fullName) await db.update(profiles).set({ fullName, updatedAt: new Date().toISOString() }).where(eq(profiles.userId, account.id));
  const token = await createMobileSession(account.id);
  return NextResponse.json(mobileUserResponse({ userId: account.id, email: account.email, displayName: account.displayName }, token));
}

