import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill, Share, Trash2 } from "lucide-react";
import { cookies } from "next/headers";
import { completeMonitoringTask, deleteMedication, toggleMedicationTaken } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import rules from "@/app/monitoring_rules.json";
import { dateKey, medicationTasksForDate, monitoringTasksForDate } from "@/app/tasks";
import { getDb } from "@/db";
import { medicationLogs, medications, monitoringCompletions } from "@/db/schema";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { MedicationSheet } from "@/app/MedicationSheet";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.48)", card: "rgba(255,255,255,0.78)", border: "rgba(255,255,255,0.92)" };
const mealLabels = { any: { ru: "Неважно", en: "Any time" }, before: { ru: "До еды", en: "Before meals" }, after: { ru: "После еды", en: "After meals" }, during: { ru: "Во время еды", en: "With meals" } };
const weekdays = { ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] };

export default async function MedicationsPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const initialAdd = (await searchParams).add === "1";
  const user = await getChatGPTUser();
  if (!user) redirect(`/login?return_to=${encodeURIComponent(initialAdd ? "/medications?add=1" : "/medications")}`);
  const db = getDb();
  const rows = await db.select().from(medications).where(and(eq(medications.userId, user.userId), eq(medications.isActive, true))).orderBy(desc(medications.createdAt));
  const today = new Date();
  const key = dateKey(today);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const logs = await db.select().from(medicationLogs).where(and(eq(medicationLogs.userId, user.userId), gte(medicationLogs.scheduledAt, `${key}T00:00:00`), lt(medicationLogs.scheduledAt, `${dateKey(tomorrow)}T00:00:00`)));
  const completions = await db.select().from(monitoringCompletions).where(eq(monitoringCompletions.userId, user.userId));
  const tasks = medicationTasksForDate(rows, logs, today);
  const monitoring = monitoringTasksForDate(rows, completions, rules, today);
  const sections = [
    { key: "morning", title: en ? "☀ Morning" : "☀ Утро" },
    { key: "afternoon", title: en ? "🌤 Afternoon" : "🌤 День" },
    { key: "evening", title: en ? "🌙 Evening" : "🌙 Вечер" },
    { key: "other", title: en ? "Other time" : "Другое время" },
  ].map((section) => ({ ...section, tasks: tasks.filter((task) => section.key === "other" ? !task.timeSlots.some((slot) => ["morning", "afternoon", "evening"].includes(slot.label)) : task.timeSlots.some((slot) => slot.label === section.key)) })).filter((section) => section.tasks.length);
  const locale = en ? "en-US" : "ru-RU";
  const todayLabel = today.toLocaleDateString(locale, { day: "numeric", month: "long" });

  return <div style={{ padding: "0 16px 100px", color: C.text }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, paddingBottom: 20 }}>
      <div><div style={{ fontSize: 26, fontWeight: 700 }}>{en ? "Medications" : "Лекарства"}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{en ? `Today, ${todayLabel}` : `Сегодня, ${todayLabel}`}</div></div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{rows.length > 0 && <a href="/export?scope=medications" aria-label={en ? "Export medications as PDF" : "Выгрузить лекарства в PDF"} style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(92,124,250,0.1)", color: "#5C7CFA" }}><Share size={18} strokeWidth={2.2} /></a>}<MedicationSheet initialOpen={initialAdd && rows.length > 0} /></div>
    </header>

    {rows.length === 0 ? <section style={{ textAlign: "center", padding: "36px 18px 30px" }}><Pill size={40} color="#5C7CFA" style={{ opacity: .3 }} /><div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>{en ? "No active medications" : "Нет активных лекарств"}</div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: "8px auto 18px", maxWidth: 260 }}>{en ? "Add medications to track your intake schedule" : "Добавьте лекарства, чтобы следить за расписанием приёма"}</div><MedicationSheet primary initialOpen={initialAdd} /></section> : <div style={{ display: "grid", gap: 4 }}>{sections.map((section) => <section key={section.key} style={{ marginBottom: 10 }}><div style={{ fontSize: 13, fontWeight: 700, margin: "0 4px 6px" }}>{section.title}</div>{section.tasks.map((task) => { const med = rows.find((item) => item.id === task.medicationId)!; const weeklyDays = task.daysOfWeek.length ? task.daysOfWeek.slice().sort((a, b) => a - b).map((day) => weekdays[en ? "en" : "ru"][day]).join(", ") : ""; return <article key={`${task.medicationId}:${section.key}`} style={{ marginBottom: 5, padding: "9px 10px 9px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, opacity: task.taken ? .66 : 1, boxShadow: "0 1px 6px rgba(26,32,80,.035)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><form action={toggleMedicationTaken}><input type="hidden" name="medicationId" value={task.medicationId} /><input type="hidden" name="scheduledAt" value={task.scheduledAt} /><button type="submit" aria-label={task.taken ? (en ? "Undo intake" : "Отменить приём") : (en ? "Mark as taken" : "Отметить приём")} style={{ display: "grid", placeItems: "center", width: 24, height: 24, padding: 0, borderRadius: "50%", border: task.taken ? "1.5px solid #5C7CFA" : "1.5px solid rgba(26,32,80,.28)", background: task.taken ? "linear-gradient(135deg,#748FFC,#5C7CFA)" : "transparent", color: "white" }}>{task.taken ? "✓" : ""}</button></form><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: task.taken ? C.muted : C.text, textDecoration: task.taken ? "line-through" : "none" }}>{task.name}</div><div style={{ display: "flex", flexWrap: "wrap", gap: "0 5px", fontSize: 11, color: C.muted, marginTop: 3 }}>{task.dosage && <span>{task.dosage} ·</span>}<span>{mealLabels[task.mealRelation as keyof typeof mealLabels || "any"]?.[en ? "en" : "ru"] || mealLabels.any[en ? "en" : "ru"]}</span>{task.endDate && <span>· {en ? "until" : "до"} {new Date(`${task.endDate}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>}</div>{task.frequency === "weekly" && weeklyDays && <div style={{ fontSize: 10, color: "rgba(92,124,250,.8)", marginTop: 2 }}>{weeklyDays}</div>}</div><MedicationSheet med={med} /><form action={deleteMedication}><input type="hidden" name="id" value={med.id} /><button type="submit" aria-label={en ? `Delete ${med.name}` : `Удалить ${med.name}`} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", color: "rgba(224,49,49,.6)" }}><Trash2 size={14} /></button></form></div></article>; })}</section>)}</div>}

    {monitoring.length > 0 && <section style={{ marginTop: 16 }}><div style={{ fontSize: 13, fontWeight: 700, margin: "0 4px 9px" }}>{en ? "Course reminders" : "Напоминания курса"}</div>{monitoring.map((item) => <article key={`${item.id}:${item.medicationId}`} style={{ background: C.card, border: `1px solid ${item.overdue ? "rgba(224,49,49,.26)" : C.border}`, borderRadius: 14, padding: "12px 13px", marginBottom: 7 }}><div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><div style={{ fontSize: 18 }}>🧪</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? item.title_en || item.title_ru : item.title_ru}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{en ? item.reason_en || item.reason_ru : item.reason_ru} · {item.medicationName}</div><div style={{ fontSize: 11, color: item.overdue ? "#E03131" : "#D97706", marginTop: 5 }}>{item.overdue ? (en ? "Overdue" : "Просрочено") : (en ? "Scheduled" : "Запланировано")}: {new Date(`${item.dueDate}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</div></div></div><details style={{ marginTop: 8 }}><summary style={{ cursor: "pointer", color: "#5C7CFA", fontSize: 12 }}>{en ? "What to check" : "Что проверить"}</summary><div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 7 }}>{(en ? item.tests_en || item.tests_ru : item.tests_ru).join(" · ")}<br />{en ? item.schedule_en || item.schedule_ru : item.schedule_ru}<Link href={`/labs?monitoringMedicationId=${encodeURIComponent(item.medicationId)}&monitoringRuleId=${encodeURIComponent(item.id)}`} style={{ display: "block", marginTop: 9, padding: "9px 10px", borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", textAlign: "center", fontWeight: 700, textDecoration: "none" }}>{en ? "Add result" : "Внести результат"}</Link><form action={completeMonitoringTask} style={{ marginTop: 7 }}><input type="hidden" name="medicationId" value={item.medicationId} /><input type="hidden" name="ruleId" value={item.id} /><input type="hidden" name="repeatDays" value={item.repeat_days} /><button type="submit" style={{ width: "100%", padding: "8px 10px", border: 0, borderRadius: 9, background: "rgba(92,124,250,.1)", color: "#5C7CFA", fontWeight: 700, fontSize: 12 }}>{en ? "Mark completed" : "Просто отметить выполненным"}</button></form></div></details></article>)}</section>}

  </div>;
}
