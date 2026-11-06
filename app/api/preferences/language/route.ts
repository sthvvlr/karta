import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let language: unknown;
  try {
    ({ language } = await request.json() as { language?: unknown });
  } catch {
    return NextResponse.json({ error: "Invalid language preference" }, { status: 400 });
  }

  if (language !== "ru" && language !== "en") {
    return NextResponse.json({ error: "Invalid language preference" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("karta_lang", language, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });
  return response;
}
