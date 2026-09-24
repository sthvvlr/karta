import { LabResultForm } from "@/app/LabResultForm";
import { addLabResult, deleteLabResult } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { labResults } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
type Indicator = { name: string; value: string; unit?: string; refLow?: string; refHigh?: string };
function parseIndicators(raw: string | null): Indicator[] { try { return JSON.parse(raw || "[]") as Indicator[]; } catch { return []; } }
function indicatorStatus(item: Indicator) { const value = Number(String(item.value).replace(",", ".")); const low = Number(item.refLow); const high = Number(item.refHigh); if (!Number.isFinite(value)) return ""; if (Number.isFinite(low) && value < low) return "ниже нормы"; if (Number.isFinite(high) && value > high) return "выше нормы"; return Number.isFinite(low) || Number.isFinite(high) ? "в норме" : ""; }

export default async function LabsPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите, чтобы открыть анализы.</div>;
  const rows = await getDb().select().from(labResults).where(eq(labResults.userId, user.userId)).orderBy(desc(labResults.testedAt));
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12 }}>Анализы</div><div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Результаты, показатели и прикреплённые файлы</div>
    {rows.length === 0 ? <div style={{ padding: "16px 0", color: C.muted, fontSize: 13 }}>Пока нет результатов. Добавьте первый анализ.</div> : rows.map((row) => { const indicators = parseIndicators(row.indicators); const abnormal = indicators.filter((item) => indicatorStatus(item) && indicatorStatus(item) !== "в норме"); return <details key={row.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: "11px 13px" }}>
      <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 10 }}><div style={{ fontSize: 18 }}>🧪</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{row.name}</div><div style={{ fontSize: 11, color: abnormal.length ? "#E03131" : C.muted }}>{row.testedAt || "Дата не указана"}{indicators.length ? ` · ${indicators.length} показ.` : ""}{abnormal.length ? ` · ${abnormal.length} отклон.` : ""}</div></div><span style={{ color: "#5C7CFA", fontSize: 12 }}>Подробнее</span></summary>
      <div style={{ borderTop: "1px solid #EEF1FF", marginTop: 10, paddingTop: 10 }}>
        {indicators.length > 0 ? <div style={{ display: "grid", gap: 6 }}>{indicators.map((item, index) => <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 8px", background: "rgba(244,246,255,.7)", borderRadius: 9 }}><div><b style={{ fontSize: 12 }}>{item.name}</b><div style={{ fontSize: 10, color: C.muted }}>Норма: {[item.refLow, item.refHigh].filter(Boolean).join("–") || "не указана"}</div></div><div style={{ textAlign: "right", color: indicatorStatus(item) === "в норме" ? "#099268" : indicatorStatus(item) ? "#E03131" : C.text, fontSize: 12, fontWeight: 700 }}>{item.value} {item.unit || ""}<div style={{ fontSize: 10 }}>{indicatorStatus(item)}</div></div></div>)}</div> : <div style={{ fontSize: 12, color: C.muted }}>{row.result || "Показатели не добавлены"}{row.unit ? ` ${row.unit}` : ""}</div>}
        {row.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 9 }}>Заметка: {row.notes}</div>}
        {row.fileKey && <a href={`/api/labs/${row.id}/file`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 9, color: "#5C7CFA", fontSize: 12 }}>Открыть исходный файл</a>}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}><details style={{ flex: 1 }}><summary style={{ cursor: "pointer", color: "#5C7CFA", fontSize: 12 }}>Изменить</summary><LabResultForm action={addLabResult} initial={row} /></details><form action={deleteLabResult}><input type="hidden" name="id" value={row.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 12 }}>Удалить</button></form></div>
      </div>
    </details>; })}
    <details open={rows.length === 0} style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Добавить анализ</summary><LabResultForm action={addLabResult} /></details>
  </div>;
}
