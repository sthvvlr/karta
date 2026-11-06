import Link from "next/link";
import { cookies } from "next/headers";
import { registerAccount } from "@/app/actions";
import { BlobBackground } from "@/components/BlobBackground";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/";
  const input = { width: "100%", minHeight: 46, padding: "12px 14px", border: "1px solid rgba(186,200,255,.5)", borderRadius: 12, background: "#F4F6FF", fontSize: 16, color: "#1A2050", boxSizing: "border-box" as const };
  const error = en ? ({ "Проверьте имя, email и пароль (минимум 6 символов).": "Check your name, email, and password (at least 6 characters).", "Аккаунт с таким email уже существует.": "An account with this email already exists.", "Пароли не совпадают.": "Passwords do not match." }[params.error || ""] || params.error) : params.error;
  return <main style={{ minHeight: "100dvh", overflowY: "auto", position: "relative", display: "flex", justifyContent: "center", padding: "52px 0 48px", background: "#F4F6FF", color: "#1A2050" }}>
    <BlobBackground />
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 430 }}>
      <div style={{ padding: "0 20px", marginBottom: 24 }}><Link href={`/login?return_to=${encodeURIComponent(returnTo)}`} aria-label={en ? "Back to sign in" : "Назад ко входу"} style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(255,255,255,.5)", color: "rgba(26,32,80,.55)", textDecoration: "none", fontSize: 16 }}>×</Link></div>
      <header style={{ padding: "0 20px", textAlign: "center", marginBottom: 28 }}><h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{en ? "Create account" : "Создать аккаунт"}</h1><div style={{ marginTop: 6, color: "rgba(26,32,80,.48)", fontSize: 13 }}>{en ? "Your data syncs across devices" : "Данные синхронизируются между устройствами"}</div></header>
      <section style={{ margin: "0 20px", padding: 16, border: "1px solid rgba(255,255,255,.9)", borderRadius: 20, background: "rgba(255,255,255,.72)", boxShadow: "0 2px 16px rgba(26,32,80,.06)" }}>
        {error && <div role="alert" style={{ color: "#C92A2A", background: "#FFF5F5", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <form action={registerAccount} style={{ display: "grid", gap: 16 }}><input type="hidden" name="returnTo" value={returnTo} />
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>{en ? "Name" : "Имя"}<input name="displayName" required minLength={2} autoComplete="name" placeholder={en ? "Your name" : "Как вас зовут?"} style={input} /></label>
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>Email<input name="email" type="email" required autoComplete="email" placeholder={en ? "you@example.com" : "ваш@email.com"} style={input} /></label>
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>{en ? "Password" : "Пароль"}<input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder={en ? "At least 6 characters" : "Минимум 6 символов"} style={input} /></label>
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>{en ? "Confirm password" : "Подтвердите пароль"}<input name="confirmPassword" type="password" required minLength={6} autoComplete="new-password" placeholder={en ? "Repeat password" : "Повторите пароль"} style={input} /></label>
          <button type="submit" style={{ minHeight: 50, padding: 13, border: 0, borderRadius: 14, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontSize: 15, fontWeight: 700, boxShadow: "0 5px 14px rgba(92,124,250,.22)" }}>{en ? "Sign up" : "Зарегистрироваться"}</button>
        </form>
      </section>
    </div>
  </main>;
}
