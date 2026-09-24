import Link from "next/link";
import { loginAccount } from "@/app/actions";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/";
  const input = { width: "100%", padding: "12px 13px", border: "1px solid #DCE3FF", borderRadius: 12, fontSize: 16, color: "#1A2050", boxSizing: "border-box" as const };
  return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 20, background: "#F4F6FF", color: "#1A2050" }}><div style={{ width: "100%", maxWidth: 390, background: "rgba(255,255,255,.82)", borderRadius: 24, padding: 22, boxShadow: "0 8px 30px rgba(26,32,80,.08)" }}>
    <div style={{ fontSize: 36, marginBottom: 8 }}>💙</div><h1 style={{ margin: 0, fontSize: 25 }}>Войти в Karta</h1><p style={{ color: "rgba(26,32,80,.55)", fontSize: 13 }}>Данные будут доступны с любого устройства.</p>
    {params.error && <div style={{ color: "#C92A2A", background: "#FFF5F5", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{params.error}</div>}
    <form action={loginAccount} style={{ display: "grid", gap: 10 }}><input type="hidden" name="returnTo" value={returnTo} /><input name="email" type="email" required placeholder="Email" style={input} /><input name="password" type="password" required placeholder="Пароль" style={input} /><button type="submit" style={{ padding: 13, border: 0, borderRadius: 12, background: "#5C7CFA", color: "white", fontWeight: 700 }}>Войти</button></form>
    <div style={{ textAlign: "center", color: "rgba(26,32,80,.42)", fontSize: 12, margin: "16px 0" }}>или</div>
    <a href={chatGPTSignInPath(returnTo)} style={{ display: "block", textAlign: "center", padding: 12, border: "1px solid #DCE3FF", borderRadius: 12, color: "#5C7CFA", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>Войти через ChatGPT</a>
    <div style={{ textAlign: "center", fontSize: 13, marginTop: 16 }}>Нет аккаунта? <Link href={`/register?return_to=${encodeURIComponent(returnTo)}`} style={{ color: "#5C7CFA" }}>Зарегистрироваться</Link></div>
  </div></main>;
}
