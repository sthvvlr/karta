import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { authSessions } from "@/db/schema";
import { getMobileUser } from "@/app/mobile-auth";

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "Сессия истекла." }, { status: 401 });
  return NextResponse.json({ user: { id: user.userId, email: user.email, displayName: user.displayName } });
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (token) await getDb().delete(authSessions).where(eq(authSessions.id, token));
  return NextResponse.json({ status: "signed_out" });
}

