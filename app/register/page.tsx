import Link from "next/link";
import { cookies } from "next/headers";
import { registerAccount } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/";
  const input = { width: "100%", padding: "12px 13px", border: "1px solid #DCE3FF", borderRadius: 12, fontSize: 16, color: "#1A2050", boxSizing: "border-box" as const };
  const error = en ? ({ "Проверьте имя, email и пароль (минимум 6 символов).": "Check your name, email, and password (at least 6 characters).", "Аккаунт с таким email уже существует.": "An account with this email already exists." }[params.error || ""] || params.error) : params.error;
  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 20, background: "#F4F6FF", color: "#1A2050" }}><div style={{ width: "100%", maxWidth: 390, background: "rgba(255,255,255,.82)", borderRadius: 24, padding: 22, boxShadow: "0 8px 30px rgba(26,32,80,.08)" }}>
    <img src="/karta-icon.png" alt="Karta" style={{ width: 52, height: 52, marginBottom: 8, borderRadius: 15 }} /><h1 style={{ margin: 0, fontSize: 25 }}>{en ? "Create an account" : "Создать аккаунт"}</h1><p style={{ color: "rgba(26,32,80,.55)", fontSize: 13 }}>{en ? "Your health card will be stored securely in Karta." : "Сохраним карту в постоянной базе Karta."}</p>
    {error && <div style={{ color: "#C92A2A", background: "#FFF5F5", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
    <form action={registerAccount} style={{ display: "grid", gap: 10 }}><input type="hidden" name="returnTo" value={returnTo} /><input name="displayName" required minLength={2} placeholder={en ? "Name" : "Имя"} style={input} /><input name="email" type="email" required placeholder="Email" style={input} /><input name="password" type="password" required minLength={6} placeholder={en ? "Password (at least 6 characters)" : "Пароль (минимум 6 символов)"} style={input} /><button type="submit" style={{ padding: 13, border: 0, borderRadius: 12, background: "#5C7CFA", color: "white", fontWeight: 700 }}>{en ? "Create account" : "Создать аккаунт"}</button></form>
    <div style={{ textAlign: "center", fontSize: 13, marginTop: 16 }}>{en ? "Already have an account?" : "Уже есть аккаунт?"} <Link href={`/login?return_to=${encodeURIComponent(returnTo)}`} style={{ color: "#5C7CFA" }}>{en ? "Sign in" : "Войти"}</Link></div>
  </div></main>;
}
