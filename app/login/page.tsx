import Link from "next/link";
import Script from "next/script";
import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { loginAccount } from "@/app/actions";
import { AppleWebSignInButton } from "@/app/AppleWebSignInButton";
import { GuestModeButton } from "@/app/GuestModeButton";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { BlobBackground } from "@/components/BlobBackground";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string; guest?: string }> }) {
  const params = await searchParams;
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const returnTo = params.return_to?.startsWith("/") && !params.return_to.startsWith("//") ? params.return_to : "/";
  const appleClientId = (env as unknown as Record<string, string | undefined>).APPLE_WEB_CLIENT_ID || "";
  const input = { width: "100%", minHeight: 48, padding: "11px 13px", border: "1px solid rgba(186,200,255,.48)", borderRadius: 13, background: "rgba(244,246,255,.7)", fontSize: 16, color: "#1A2050", boxSizing: "border-box" as const };
  const errorText: Record<string, [string, string]> = {
    "Неверный email или пароль.": ["Неверный email или пароль.", "Incorrect email or password."],
    "Не удалось проверить вход через Apple.": ["Не удалось проверить вход через Apple.", "Apple sign-in could not be verified."],
    "Вход через Apple пока не настроен для веб-версии.": ["Вход через Apple пока не настроен для веб-версии.", "Apple sign-in is not configured for the web version yet."],
  };
  const error = params.error ? errorText[params.error]?.[en ? 1 : 0] || params.error : "";
  return <main style={{ minHeight: "100dvh", overflowY: "auto", position: "relative", display: "flex", justifyContent: "center", padding: "38px 20px 44px", background: "#F4F6FF", color: "#1A2050" }}>
    <BlobBackground />
    {appleClientId && <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" />}
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 430, margin: "auto 0", textAlign: "center" }}>
      <header style={{ display: "grid", justifyItems: "center", gap: 7, marginBottom: 34 }}>
        <img src="/karta-icon.png" alt="Karta" style={{ width: 64, height: 64, borderRadius: 17, boxShadow: "0 8px 20px rgba(92,124,250,.24)" }} />
        <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 750 }}>{en ? "karta" : "karta"}</div>
        <div style={{ color: "rgba(26,32,80,.48)", fontSize: 14 }}>{en ? "Welcome" : "Добро пожаловать"}</div>
      </header>

      <section style={{ padding: 16, border: "1px solid rgba(255,255,255,.88)", borderRadius: 23, background: "rgba(255,255,255,.57)", boxShadow: "0 8px 28px rgba(92,124,250,.08)", textAlign: "left" }}>
        {error && <div role="alert" style={{ color: "#C92A2A", background: "#FFF5F5", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <form action={loginAccount} style={{ display: "grid", gap: 14 }}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>Email<input name="email" type="email" required autoComplete="email" placeholder={en ? "you@example.com" : "ваш@email.com"} style={input} /></label>
          <label style={{ display: "grid", gap: 6, color: "rgba(26,32,80,.62)", fontSize: 12, fontWeight: 650 }}>{en ? "Password" : "Пароль"}<input name="password" type="password" required autoComplete="current-password" placeholder={en ? "Your password" : "Ваш пароль"} style={input} /></label>
          <button type="submit" style={{ minHeight: 50, padding: 13, border: 0, borderRadius: 14, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontSize: 15, fontWeight: 700, boxShadow: "0 5px 14px rgba(92,124,250,.22)" }}>{en ? "Sign in" : "Войти"}</button>
        </form>
      </section>

      <div style={{ marginTop: 18, fontSize: 13, color: "rgba(26,32,80,.52)" }}>{en ? "Don't have an account?" : "Нет аккаунта?"} <Link href={`/register?return_to=${encodeURIComponent(returnTo)}`} style={{ color: "#5C7CFA", textDecoration: "none", fontWeight: 600 }}>{en ? "Sign up" : "Зарегистрироваться"}</Link></div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 12px", color: "rgba(26,32,80,.42)", fontSize: 11 }}><span style={{ height: 1, flex: 1, background: "rgba(26,32,80,.1)" }} />{en ? "or" : "или"}<span style={{ height: 1, flex: 1, background: "rgba(26,32,80,.1)" }} /></div>
      <div style={{ display: "grid", gap: 10 }}>
        <AppleWebSignInButton clientId={appleClientId} returnTo={returnTo} en={en} />
        {params.guest !== "1" && <a href={chatGPTSignInPath(returnTo)} style={{ display: "block", minHeight: 46, boxSizing: "border-box", padding: 13, border: "1px solid rgba(186,200,255,.42)", borderRadius: 14, background: "rgba(255,255,255,.36)", color: "#5C7CFA", textDecoration: "none", fontWeight: 650, fontSize: 13 }}>{en ? "Continue with ChatGPT" : "Войти через ChatGPT"}</a>}
        <GuestModeButton en={en} returnTo={returnTo} />
      </div>
      <div style={{ maxWidth: 300, margin: "9px auto 0", color: "rgba(26,32,80,.43)", fontSize: 11, lineHeight: 1.4 }}>{en ? "Guest data stays linked to this browser. Create an account to sync across devices." : "Данные гостевого режима привязаны к этому браузеру. Создайте аккаунт для синхронизации между устройствами."}</div>
    </div>
  </main>;
}
