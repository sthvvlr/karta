import Link from "next/link";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };

const tiles = [
  { href: "/vaccinations", icon: "💉", label: "Прививки", blob: "#BAC8FF" },
  { href: "/medications", icon: "💊", label: "Лекарства", blob: "#D0BFFF" },
  { href: "/labs", icon: "🧪", label: "Анализы", blob: "#A5F3FC" },
  { href: "#coming-soon", icon: "📋", label: "Чекапы", blob: "#C7F5E8" },
];

export default async function HomePage() {
  const user = await getChatGPTUser();
  if (!user) {
    return <Landing />;
  }
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const name = data.profile?.fullName?.split(" ")[0] || user.displayName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingTop: 12 }}>
        <div><div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{greeting}</div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{name}</div></div>
        <Link href="/profile" style={{ textDecoration: "none" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: C.text }}>{name[0]?.toUpperCase()}</div></Link>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 2px 16px rgba(26,32,80,0.06)", padding: "18px 20px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 130, height: 130, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", top: -35, right: -35, filter: "blur(30px)", opacity: 0.6 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#748FFC,#A5F3FC)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 17 }}>{data.vaccinations.length}</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Ваша карта здоровья</div><div style={{ fontSize: 11, color: C.muted }}>Данные сохраняются в защищённой базе</div></div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Разделы</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
        {tiles.map((tile) => <Link key={tile.label} href={tile.href} style={{ textDecoration: "none" }}><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, position: "relative", overflow: "hidden", boxShadow: "0 1px 6px rgba(26,32,80,0.04)" }}><div style={{ position: "absolute", width: 55, height: 55, borderRadius: "50%", background: tile.blob, top: -14, right: -14, filter: "blur(14px)", opacity: 0.5 }} /><div style={{ fontSize: 20, marginBottom: 7, position: "relative" }}>{tile.icon}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text, position: "relative" }}>{tile.label}</div><div style={{ fontSize: 10, color: C.muted, position: "relative" }}>{tile.label === "Прививки" ? `${data.vaccinations.length} записей` : tile.label === "Лекарства" ? `${data.medications.length} активных` : "Скоро"}</div></div></Link>)}
      </div>

      {data.medications.length === 0 ? <Link href="/medications" style={{ textDecoration: "none" }}><div style={{ padding: "14px 16px", background: C.card, border: "1px dashed rgba(186,200,255,0.5)", borderRadius: 16, fontSize: 13, color: C.muted, textAlign: "center" }}>+ Добавьте первое лекарство</div></Link> : <div style={{ fontSize: 13, color: C.muted }}>Активных лекарств: {data.medications.length}</div>}
    </div>
  );
}

function Landing() {
  return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "#1A2050" }}><div><div style={{ fontSize: 56, marginBottom: 12 }}>💙</div><h1 style={{ fontSize: 28, margin: "0 0 10px" }}>Karta</h1><p style={{ color: "rgba(26,32,80,0.55)", lineHeight: 1.5 }}>Ваша карта прививок, лекарств и анализов в одном месте.</p><a href={chatGPTSignInPath("/")} style={{ display: "inline-block", marginTop: 14, padding: "13px 20px", borderRadius: 14, background: "#5C7CFA", color: "white", textDecoration: "none", fontWeight: 700 }}>Войти через ChatGPT</a></div></div>;
}
