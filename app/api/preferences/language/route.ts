import { NextResponse } from "next/server";

function saveLanguage(language: "ru" | "en", request: Request) {
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

  return saveLanguage(language, request);
}

export async function GET(request: Request) {
  const current = new URL(request.url);
  const language = current.searchParams.get("language");
  if (language !== "ru" && language !== "en") {
    return NextResponse.json({ error: "Invalid language preference" }, { status: 400 });
  }

  const requestedPath = current.searchParams.get("return_to") || "/";
  let returnTo = "/";
  if (requestedPath.startsWith("/") && !requestedPath.startsWith("//")) {
    try {
      const safeUrl = new URL(requestedPath, current.origin);
      if (safeUrl.origin === current.origin) returnTo = `${safeUrl.pathname}${safeUrl.search}${safeUrl.hash}`;
    } catch {
      returnTo = "/";
    }
  }

  const response = NextResponse.redirect(new URL(returnTo, current.origin), 303);
  response.cookies.set("karta_lang", language, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: current.protocol === "https:",
  });
  return response;
}
