import { MedicationPicker } from "@/app/MedicationPicker";
import { MedicationSchedulePicker } from "@/app/MedicationSchedulePicker";
import { MedicationAddButton } from "@/app/MedicationAddButton";
import Link from "next/link";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { addMedication, completeMonitoringTask, deleteMedication, toggleMedicationTaken } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import rules from "@/app/monitoring_rules.json";
import { dateKey, medicationTasksForDate, monitoringTasksForDate } from "@/app/tasks";
import { getDb } from "@/db";
import { medicationLogs, medications, monitoringCompletions } from "@/db/schema";
import { and, desc, eq, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.48)", card: "rgba(255,255,255,0.78)", border: "rgba(255,255,255,0.92)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;
const mealLabels: Record<string, string> = { any: "Неважно", before: "До еды", after: "После еды", during: "Во время еды" };
const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function MedicationEditor({ med }: { med?: typeof medications.$inferSelect }) {
  return <form action={addMedication} style={{ display: "grid", gap: 9, marginTop: 12 }}>
    {med && <input type="hidden" name="id" value={med.id} />}
    <MedicationPicker initialName={med?.name} initialCode={med?.drugCode || ""} />
    <input name="dosage" defaultValue={med?.dosage || ""} placeholder="Дозировка" style={input} />
    <MedicationSchedulePicker initialFrequency={med?.frequency || "daily"} initialSchedule={med?.timeSlots || ""} />
    <select name="mealRelation" defaultValue={med?.mealRelation || "any"} style={input}><option value="any">Неважно</option><option value="before">До еды</option><option value="during">Во время еды</option><option value="after">После еды</option></select>
    <label style={{ fontSize: 11, color: C.muted }}>Принимать до (необязательно)<input name="endDate" defaultValue={med?.endDate || ""} type="date" style={{ ...input, display: "block", marginTop: 5 }} /></label>
    <textarea name="notes" defaultValue={med?.notes || ""} placeholder="Заметки (необязательно)" rows={2} style={input} />
    <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>{med ? "Сохранить изменения" : "Сохранить лекарство"}</button>
  </form>;
}

export default async function MedicationsPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите через ChatGPT, чтобы открыть лекарства.</div>;
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
    { key: "morning", title: "☀ Утро" },
    { key: "afternoon", title: "🌤 День" },
    { key: "evening", title: "🌙 Вечер" },
    { key: "other", title: "Другое время" },
  ].map((section) => ({ ...section, tasks: tasks.filter((task) => section.key === "other" ? !task.timeSlots.some((slot) => ["morning", "afternoon", "evening"].includes(slot.label)) : task.timeSlots.some((slot) => slot.label === section.key)) })).filter((section) => section.tasks.length);
  const todayLabel = today.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return <div style={{ padding: "12px 16px 100px", color: C.text }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, paddingBottom: 20 }}>
      <div><div style={{ fontSize: 26, fontWeight: 700 }}>Лекарства</div><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Сегодня, {todayLabel.replace(/^\S+,?\s*/, "")}</div></div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{rows.length > 0 && <a href="/export?scope=medications" aria-label="Выгрузить лекарства в PDF" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(92,124,250,0.1)", color: "#5C7CFA" }}><FileDown size={18} /></a>}<MedicationAddButton /></div>
    </header>

    {rows.length === 0 ? <section style={{ textAlign: "center", padding: "36px 18px 30px" }}><div style={{ fontSize: 42, opacity: .35 }}>💊</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>Нет активных лекарств</div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: "8px auto 18px", maxWidth: 260 }}>Добавьте лекарства, чтобы следить за расписанием приёма</div><MedicationAddButton primary /></section> : <div style={{ display: "grid", gap: 4 }}>{sections.map((section) => <section key={section.key} style={{ marginBottom: 10 }}><div style={{ fontSize: 13, fontWeight: 700, margin: "0 4px 6px" }}>{section.title}</div>{section.tasks.map((task) => { const med = rows.find((item) => item.id === task.medicationId)!; const weeklyDays = task.daysOfWeek.length ? task.daysOfWeek.slice().sort((a, b) => a - b).map((day) => weekdays[day]).join(", ") : ""; return <article key={`${task.medicationId}:${section.key}`} style={{ marginBottom: 5, padding: "9px 10px 9px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, opacity: task.taken ? .66 : 1, boxShadow: "0 1px 6px rgba(26,32,80,.035)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><form action={toggleMedicationTaken}><input type="hidden" name="medicationId" value={task.medicationId} /><input type="hidden" name="scheduledAt" value={task.scheduledAt} /><button type="submit" aria-label={task.taken ? "Отменить приём" : "Отметить приём"} style={{ display: "grid", placeItems: "center", width: 24, height: 24, padding: 0, borderRadius: "50%", border: task.taken ? "1.5px solid #5C7CFA" : "1.5px solid rgba(26,32,80,.28)", background: task.taken ? "linear-gradient(135deg,#748FFC,#5C7CFA)" : "transparent", color: "white" }}>{task.taken ? "✓" : ""}</button></form><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: task.taken ? C.muted : C.text, textDecoration: task.taken ? "line-through" : "none" }}>{task.name}</div><div style={{ display: "flex", flexWrap: "wrap", gap: "0 5px", fontSize: 11, color: C.muted, marginTop: 3 }}>{task.dosage && <span>{task.dosage} ·</span>}<span>{mealLabels[task.mealRelation || "any"] || mealLabels.any}</span>{task.endDate && <span>· до {new Date(`${task.endDate}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}</div>{task.frequency === "weekly" && weeklyDays && <div style={{ fontSize: 10, color: "rgba(92,124,250,.8)", marginTop: 2 }}>{weeklyDays}</div>}</div><details><summary aria-label={`Изменить ${med.name}`} style={{ listStyle: "none", cursor: "pointer", display: "grid", placeItems: "center", width: 30, height: 30, color: "rgba(26,32,80,.48)" }}><Pencil size={14} /></summary><MedicationEditor med={med} /></details><form action={deleteMedication}><input type="hidden" name="id" value={med.id} /><button type="submit" aria-label={`Удалить ${med.name}`} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", color: "rgba(224,49,49,.6)" }}><Trash2 size={14} /></button></form></div></article>; })}</section>)}</div>}

    {monitoring.length > 0 && <section style={{ marginTop: 16 }}><div style={{ fontSize: 13, fontWeight: 700, margin: "0 4px 9px" }}>Напоминания курса</div>{monitoring.map((item) => <article key={`${item.id}:${item.medicationId}`} style={{ background: C.card, border: `1px solid ${item.overdue ? "rgba(224,49,49,.26)" : C.border}`, borderRadius: 14, padding: "12px 13px", marginBottom: 7 }}><div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><div style={{ fontSize: 18 }}>🧪</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{item.title_ru}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.reason_ru} · {item.medicationName}</div><div style={{ fontSize: 11, color: item.overdue ? "#E03131" : "#D97706", marginTop: 5 }}>{item.overdue ? "Просрочено" : "Запланировано"}: {item.dueDate}</div></div></div><details style={{ marginTop: 8 }}><summary style={{ cursor: "pointer", color: "#5C7CFA", fontSize: 12 }}>Что проверить</summary><div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 7 }}>{item.tests_ru.join(" · ")}<br />{item.schedule_ru}<Link href={`/labs?monitoringMedicationId=${encodeURIComponent(item.medicationId)}&monitoringRuleId=${encodeURIComponent(item.id)}`} style={{ display: "block", marginTop: 9, padding: "9px 10px", borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", textAlign: "center", fontWeight: 700, textDecoration: "none" }}>Внести результат</Link><form action={completeMonitoringTask} style={{ marginTop: 7 }}><input type="hidden" name="medicationId" value={item.medicationId} /><input type="hidden" name="ruleId" value={item.id} /><input type="hidden" name="repeatDays" value={item.repeat_days} /><button type="submit" style={{ width: "100%", padding: "8px 10px", border: 0, borderRadius: 9, background: "rgba(92,124,250,.1)", color: "#5C7CFA", fontWeight: 700, fontSize: 12 }}>Просто отметить выполненным</button></form></div></details></article>)}</section>}

    <details id="add-medication" open={rows.length === 0} style={{ marginTop: 14, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Добавить лекарство</summary><MedicationEditor /></details>
  </div>;
}
