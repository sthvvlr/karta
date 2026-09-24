import { NextResponse } from "next/server";

// Authentication is resolved in server components/actions from either the
// Sites ChatGPT identity headers or the Karta email session cookie.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
