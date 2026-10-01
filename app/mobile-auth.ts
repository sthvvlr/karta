import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { authAccounts, authSessions } from "@/db/schema";

export type MobileUser = {
  userId: string;
  email: string;
  displayName: string;
};

export async function getMobileUser(request: Request): Promise<MobileUser | null> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;

  const now = new Date().toISOString();
  const [session] = await getDb()
    .select({
      userId: authSessions.userId,
      email: authAccounts.email,
      displayName: authAccounts.displayName,
    })
    .from(authSessions)
    .innerJoin(authAccounts, eq(authSessions.userId, authAccounts.id))
    .where(and(eq(authSessions.id, token), gt(authSessions.expiresAt, now)))
    .limit(1);

  return session || null;
}

export async function createMobileSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  await getDb().insert(authSessions).values({
    id: token,
    userId,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });
  return token;
}

export function mobileUserResponse(user: MobileUser, token: string) {
  return {
    token,
    user: {
      id: user.userId,
      email: user.email,
      displayName: user.displayName,
    },
  };
}

