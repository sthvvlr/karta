import Link from "next/link";
import { ChevronLeft, ChevronRight, Paperclip, TestTube2 } from "lucide-react";
import { cookies } from "next/headers";
import { LabResultSheet } from "@/app/LabResultSheet";
import { LabResultDeleteForm } from "@/app/LabResultDeleteForm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { labResults, medications, profiles } from "@/db/schema";
import markers from "@/app/lab_markers.json";
import rules from "@/app/monitoring_rules.json";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.76)", border: "rgba(255,255,255,.92)", primary: "#5C7CFA" };
type Indicator = { name: string; markerCode?: string; value: string; unit?: string; refLow?: string; refHigh?: string };
type Marker = { code: string; cat_ru: string; cat_en: string };
const markerCategories = new Map((markers as Marker[]).map((marker) => [marker.code, marker]));
function parseIndicators(raw: string | null): Indicator[] { try { return JSON.parse(raw || "[]") as Indicator[]; } catch { return []; } }
function indicatorStatus(item: Indicator) {
  const numeric = String(item.value).replace(/,/g, ".").replace(/\s/g, "").match(/[0-9]+(?:\.[0-9]+)?/);
  const value = numeric ? Number(numeric[0]) : Number.NaN;
  const low = Number(item.refLow); const high = Number(item.refHigh);
  if (!Number.isFinite(value)) return "";
  if (Number.isFinite(low) && value < low) return "low";
  if (Number.isFinite(high) && value > high) return "high";
  return Number.isFinite(low) || Number.isFinite(high) ? "normal" : "unknown";
}

export default async function LabsPage({ searchParams }: { searchParams: Promise<{ monitoringMedicationId?: string; monitoringRuleId?: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите, чтобы открыть анализы.</div>;
  const params = await searchParams;
  const cookieStore = await cookies();
  const en = cookieStore.get("karta_lang")?.value === "en";
  const locale = en ? "en-US" : "ru-RU";
  const db = getDb();
  const [rows, profile] = await Promise.all([
    db.select().from(labResults).where(eq(labResults.userId, user.userId)).orderBy(desc(labResults.testedAt)),
    db.select({ gender: profiles.gender }).from(profiles).where(eq(profiles.userId, user.userId)).limit(1).then((items) => items[0]),
  ]);
  let monitoringPrefill: { medicationId: string; ruleId: string; title: string; tests: string[] } | null = null;
  if (params.monitoringMedicationId && params.monitoringRuleId) {
    const [medication] = await db.select({ id: medications.id, drugCode: medications.drugCode }).from(medications).where(and(eq(medications.id, params.monitoringMedicationId), eq(medications.userId, user.userId), eq(medications.isActive, true))).limit(1);
    const rule = rules.find((item) => item.id === params.monitoringRuleId && medication?.drugCode && item.drug_codes.includes(medication.drugCode));
    if (medication && rule) monitoringPrefill = { medicationId: medication.id, ruleId: rule.id, title: en ? rule.title_en || rule.title_ru : rule.title_ru, tests: en ? rule.tests_en || rule.tests_ru : rule.tests_ru };
  }

  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <header style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, paddingBottom: 12 }}>
      <Link href="/" aria-label={en ? "Back" : "Назад"} style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", background: C.card, color: C.text, textDecoration: "none" }}><ChevronLeft size={18} /></Link>
      <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{en ? "Lab tests" : "Анализы"}</div><div style={{ fontSize: 12, color: C.muted }}>{en ? "Your indicators over time" : "Ваши показатели в динамике"}</div></div>
      <LabResultSheet gender={profile?.gender} prefillTitle={monitoringPrefill?.title} prefillTests={monitoringPrefill?.tests} monitoringMedicationId={monitoringPrefill?.medicationId} monitoringRuleId={monitoringPrefill?.ruleId} initiallyOpen={!!monitoringPrefill} />
    </header>

    {rows.length === 0 ? <div style={{ display: "grid", justifyItems: "center", textAlign: "center", padding: "44px 12px 30px" }}>
      <TestTube2 size={40} color={C.primary} style={{ opacity: .35 }} />
      <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700 }}>{en ? "No lab results yet" : "Пока нет анализов"}</div>
      <div style={{ marginTop: 6, maxWidth: 280, fontSize: 13, lineHeight: 1.45, color: C.muted }}>{en ? "Add a result and enter your values — out-of-range values will be flagged." : "Загрузите результат и внесите показатели — система отметит отклонения от нормы."}</div>
      <LabResultSheet gender={profile?.gender} prefillTitle={monitoringPrefill?.title} prefillTests={monitoringPrefill?.tests} monitoringMedicationId={monitoringPrefill?.medicationId} monitoringRuleId={monitoringPrefill?.ruleId} />
    </div> : <div style={{ display: "grid", gap: 8, paddingBottom: 28 }}>
      {rows.map((row) => {
        const indicators = parseIndicators(row.indicators);
        const abnormalCount = indicators.filter((item) => ["low", "high"].includes(indicatorStatus(item))).length;
        const knownCount = indicators.filter((item) => indicatorStatus(item) !== "unknown").length;
        const date = row.testedAt ? new Date(`${row.testedAt}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : (en ? "Date not specified" : "Дата не указана");
        const groups: Array<{ label: string; items: Array<{ item: Indicator; status: string }> }> = [];
        for (const item of indicators) {
          const marker = item.markerCode ? markerCategories.get(item.markerCode) : undefined;
          const label = marker ? (en ? marker.cat_en : marker.cat_ru) : (en ? "Other" : "Другое");
          let group = groups.find((value) => value.label === label);
          if (!group) { group = { label, items: [] }; groups.push(group); }
          group.items.push({ item, status: indicatorStatus(item) });
        }
        return <details key={row.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 15, padding: "12px 13px", boxShadow: "0 1px 8px rgba(26,32,80,.04)" }}>
          <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, flex: "0 0 38px", display: "grid", placeItems: "center", borderRadius: 10, background: "rgba(92,124,250,.12)", color: C.primary }}><TestTube2 size={17} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 650 }}>{row.name || (en ? "Lab result" : "Анализ")}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{date}</div></div>
            {row.fileKey && <Paperclip size={14} color={C.muted} />}
            <ChevronRight size={15} color="rgba(26,32,80,.3)" />
          </summary>
          <div style={{ borderTop: "1px solid #EEF1FF", marginTop: 12, paddingTop: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              {abnormalCount > 0 ? <span style={badgeStyle("#E03131")}>{en ? `${abnormalCount} abnormal` : `${abnormalCount} отклон.`}</span> : knownCount > 0 ? <span style={badgeStyle("#099268")}>{en ? "Normal" : "В норме"}</span> : null}
              <span style={{ fontSize: 11, color: C.muted }}>{en ? `${indicators.length} values` : `${indicators.length} показ.`}</span>
            </div>
            {indicators.length > 0 ? groups.map((group) => <section key={group.label} style={{ marginBottom: 10 }}><div style={{ margin: "0 2px 5px", fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: C.muted }}>{group.label.toLocaleUpperCase(en ? "en-US" : "ru-RU")}</div><div style={{ background: "white", borderRadius: 12, overflow: "hidden" }}>{group.items.map(({ item, status }, index) => <div key={`${item.name}:${index}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 11px", borderBottom: index < group.items.length - 1 ? "1px solid rgba(26,32,80,.07)" : 0 }}><span style={{ width: 8, height: 8, flex: "0 0 8px", borderRadius: "50%", background: status === "low" || status === "high" ? "#E03131" : status === "normal" ? "#099268" : "#ADB5BD" }} /><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 13, fontWeight: 550 }}>{item.name}</div>{(item.refLow || item.refHigh) && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{en ? "Ref: " : "Норма: "}{[item.refLow, item.refHigh].filter(Boolean).join("–")}{item.unit ? ` ${item.unit}` : ""}</div>}</div><div style={{ textAlign: "right", whiteSpace: "nowrap", color: status === "low" || status === "high" ? "#E03131" : status === "normal" ? "#099268" : C.text, fontSize: 13, fontWeight: 650 }}>{item.value}{item.unit ? <small style={{ fontSize: 10, color: C.muted, marginLeft: 3 }}>{item.unit}</small> : null}{(status === "low" || status === "high") && <div style={{ fontSize: 9 }}>{status === "low" ? (en ? "Low" : "ниже нормы") : (en ? "High" : "выше нормы")}</div>}</div></div>)}</div></section>) : <div style={{ fontSize: 12, color: C.muted }}>{row.result || (en ? "No values added" : "Показатели не добавлены")}{row.unit ? ` ${row.unit}` : ""}</div>}
            {row.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}><b>{en ? "Note:" : "Заметка:"}</b> {row.notes}</div>}
            {row.fileKey && <a href={`/api/labs/${row.id}/file`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, padding: "11px 12px", borderRadius: 11, background: "rgba(92,124,250,.07)", color: C.primary, fontSize: 13, fontWeight: 600, textDecoration: "none" }}><Paperclip size={15} />{en ? "Open source file" : "Открыть исходный файл"}<ChevronRight size={14} style={{ marginLeft: "auto" }} /></a>}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 9, marginTop: 12 }}><LabResultSheet initial={{ id: row.id, name: row.name, testedAt: row.testedAt, notes: row.notes, fileKey: row.fileKey, indicators: row.indicators }} gender={profile?.gender} /><LabResultDeleteForm id={row.id} /></div>
          </div>
        </details>;
      })}
    </div>}
  </div>;
}

function badgeStyle(color: string): React.CSSProperties { return { color, background: `${color}16`, borderRadius: 99, padding: "4px 8px", fontSize: 10, fontWeight: 700 }; }
