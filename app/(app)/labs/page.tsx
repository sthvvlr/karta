import { addLabResult } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { labResults } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 14, color: "#1A2050" } as const;

export default async function LabsPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите через ChatGPT, чтобы открыть анализы.</div>;
  const rows = await getDb().select().from(labResults).where(eq(labResults.userId, user.userId)).orderBy(desc(labResults.testedAt));
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12 }}>Анализы</div><div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Результаты и история обследований</div>
    {rows.length === 0 ? <div style={{ padding: "16px 0", color: C.muted, fontSize: 13 }}>Пока нет результатов. Добавьте первый анализ — он сохранится в базе Karta.</div> : rows.map((row) => <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginBottom: 5, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}><div style={{ fontSize: 18 }}>🧪</div><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</div><div style={{ fontSize: 10, color: C.muted }}>{row.result || "Результат не указан"}{row.unit ? ` ${row.unit}` : ""} · {row.testedAt || "Дата не указана"}</div></div></div>)}
    <details style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Добавить анализ</summary><form action={addLabResult} style={{ display: "grid", gap: 9, marginTop: 13 }}><input name="name" required placeholder="Название анализа" style={input} /><div style={{ display: "flex", gap: 8 }}><input name="result" placeholder="Результат" style={{ ...input, flex: 1 }} /><input name="unit" placeholder="Единицы" style={{ ...input, flex: 1 }} /></div><input name="testedAt" type="date" style={input} /><input name="referenceRange" placeholder="Референсный диапазон (необязательно)" style={input} /><button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Сохранить результат</button></form></details>
  </div>;
}
