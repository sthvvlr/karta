import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { PdfExportControls } from "@/app/PdfExportControls";
import { getDb } from "@/db";
import { labResults } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: "#1A2050" }}>Войдите через ChatGPT, чтобы выгрузить карту.</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const labs = await getDb().select().from(labResults).where(eq(labResults.userId, user.userId)).orderBy(desc(labResults.testedAt));
  const profile = data.profile;
  return <div className="print-page" style={{ maxWidth: 760, margin: "0 auto", padding: "24px 18px 48px", color: "#1A2050" }}>
    <div className="no-print" style={{ marginBottom: 16 }}><Link href="/" style={{ color: "#5C7CFA", textDecoration: "none", fontSize: 14 }}>← Вернуться в Karta</Link></div>
    <PdfExportControls />
    <header style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "2px solid #DCE3FF", paddingBottom: 18, marginBottom: 20 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/karta-icon.png" alt="Karta" width={58} height={58} style={{ borderRadius: 14 }} />
      <div><h1 style={{ margin: 0, fontSize: 25 }}>Моя карта здоровья</h1><div style={{ color: "rgba(26,32,80,0.58)", marginTop: 4 }}>Karta · сформировано {new Date().toLocaleDateString("ru-RU")}</div></div>
    </header>
    <section className="print-card" style={{ background: "rgba(244,246,255,0.8)", borderRadius: 16, padding: 16, marginBottom: 18 }}><h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Профиль</h2><div><b>{profile?.fullName || user.displayName}</b></div><div style={{ color: "rgba(26,32,80,0.62)", marginTop: 4 }}>Дата рождения: {profile?.birthDate || "не указана"}</div><div style={{ color: "rgba(26,32,80,0.62)", marginTop: 3 }}>Город: {[profile?.cityCurrent, profile?.regionCurrent, profile?.countryCurrent].filter(Boolean).join(", ") || "не указан"}</div></section>
    <section className="print-card" style={{ marginBottom: 18 }}><h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Прививки · {data.vaccinations.length}</h2>{data.vaccinations.length ? <div style={{ display: "grid", gap: 7 }}>{data.vaccinations.map(({ record, vaccine }) => <div key={record.id} style={{ padding: "9px 11px", border: "1px solid #E5E9FF", borderRadius: 10 }}><b>{vaccine?.nameRu || record.vaccineId}</b><div style={{ color: "rgba(26,32,80,0.62)", fontSize: 13, marginTop: 3 }}>{record.dateGiven || "Дата не указана"} · доза {record.doseNumber}{record.brand ? ` · ${record.brand}` : ""}{record.clinic ? ` · ${record.clinic}` : ""}</div></div>)}</div> : <div style={{ color: "rgba(26,32,80,0.62)" }}>Записей пока нет</div>}</section>
    <section className="print-card" style={{ marginBottom: 18 }}><h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Лекарства · {data.medications.length}</h2>{data.medications.length ? <div style={{ display: "grid", gap: 7 }}>{data.medications.map((med) => <div key={med.id} style={{ padding: "9px 11px", border: "1px solid #E5E9FF", borderRadius: 10 }}><b>{med.name}</b><div style={{ color: "rgba(26,32,80,0.62)", fontSize: 13, marginTop: 3 }}>{[med.dosage, med.frequency, med.mealRelation].filter(Boolean).join(" · ") || "Схема не указана"}</div></div>)}</div> : <div style={{ color: "rgba(26,32,80,0.62)" }}>Записей пока нет</div>}</section>
    <section className="print-card"><h2 style={{ fontSize: 17, margin: "0 0 10px" }}>Анализы · {labs.length}</h2>{labs.length ? <div style={{ display: "grid", gap: 7 }}>{labs.map((lab) => <div key={lab.id} style={{ padding: "9px 11px", border: "1px solid #E5E9FF", borderRadius: 10 }}><b>{lab.name}</b><div style={{ color: "rgba(26,32,80,0.62)", fontSize: 13, marginTop: 3 }}>{[lab.result, lab.unit].filter(Boolean).join(" ") || "Результат не указан"} · {lab.testedAt || "Дата не указана"}</div></div>)}</div> : <div style={{ color: "rgba(26,32,80,0.62)" }}>Записей пока нет</div>}</section>
  </div>;
}
