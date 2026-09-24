import Link from "next/link";
import { completeMonitoringTask, completeUpcomingVaccination, toggleMedicationTaken } from "@/app/actions";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import healthFacts from "@/app/health_facts.json";
import rules from "@/app/monitoring_rules.json";
import catalog from "@/app/vaccinations_catalog.json";
import { dateKey, medicationTasksForDate, monitoringTasksForDate, recommendedVaccines, vaccinationScore, upcomingVaccineTasks } from "@/app/tasks";
import { ScoreDetails } from "@/app/ScoreDetails";
import { OnboardingCard } from "@/app/OnboardingCard";
import { getDb } from "@/db";
import { labResults, medicationLogs, monitoringCompletions } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
  const today = new Date();
  const todayKey = dateKey(today);
  const db = getDb();
  const [logs, completions, labs] = await Promise.all([
    db.select().from(medicationLogs).where(and(eq(medicationLogs.userId, user.userId), gte(medicationLogs.scheduledAt, `${todayKey}T00:00:00`), lt(medicationLogs.scheduledAt, `${todayKey}T23:59:59`))),
    db.select().from(monitoringCompletions).where(eq(monitoringCompletions.userId, user.userId)),
    db.select({ id: labResults.id }).from(labResults).where(eq(labResults.userId, user.userId)),
  ]);
  const medicationTasks = medicationTasksForDate(data.medications, logs, today);
  const vaccineTasks = upcomingVaccineTasks(data.vaccinations.map(({ record }) => record), catalog, today);
  const recommended = recommendedVaccines(data.profile, data.vaccinations.map(({ record }) => record), catalog, today);
  const score = vaccinationScore(data.profile, data.vaccinations.map(({ record }) => record), catalog, today);
  const monitoringTasks = monitoringTasksForDate(data.medications, completions, rules, today);
  const name = data.profile?.fullName?.split(" ")[0] || user.displayName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const profileFields = [data.profile?.fullName, data.profile?.birthDate, data.profile?.cityCurrent, data.vaccinations.length || data.medications.length];
  const profileProgress = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const todayFact = healthFacts[(dayOfYear - 1) % healthFacts.length];

  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingTop: 12 }}>
        <div><div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{greeting}</div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{name}</div></div>
        <Link href="/profile" style={{ textDecoration: "none" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: C.text }}>{name[0]?.toUpperCase()}</div></Link>
      </div>

      {(!data.profile?.birthDate || !data.profile?.cityCurrent) && <OnboardingCard name={data.profile?.fullName || user.displayName} birthDate={data.profile?.birthDate} gender={data.profile?.gender} city={data.profile?.cityCurrent} region={data.profile?.regionCurrent} country={data.profile?.countryCurrent} countryCode={data.profile?.countryCode} />}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 2px 16px rgba(26,32,80,0.06)", padding: "18px 20px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 130, height: 130, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", top: -35, right: -35, filter: "blur(30px)", opacity: 0.6 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#748FFC,#A5F3FC)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 17 }}>{score}</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Karta Score</div><div style={{ fontSize: 11, color: C.muted }}>{recommended.length ? `${recommended.length} рекомендаций требуют внимания` : "Все доступные рекомендации учтены"}</div></div>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 8px rgba(26,32,80,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Прогресс профиля</div><div style={{ fontSize: 13, color: "#5C7CFA", fontWeight: 700 }}>{profileProgress}%</div></div>
        <div style={{ height: 8, borderRadius: 99, background: "#E8ECFF", overflow: "hidden" }}><div style={{ width: `${profileProgress}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#748FFC,#5C7CFA)" }} /></div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 7 }}>{profileProgress === 100 ? "Профиль заполнен — можно пользоваться картой." : "Добавьте дату рождения, город и записи, чтобы карта была полезнее."}</div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.58)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 16px", marginBottom: 10 }}><div style={{ fontSize: 11, color: "#5C7CFA", fontWeight: 700, marginBottom: 5 }}>💡 ИНТЕРЕСНЫЙ ФАКТ</div><div style={{ fontSize: 13, lineHeight: 1.45, color: C.text }}>{todayFact.ru}</div></div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 14px", marginBottom: 10, fontSize: 12, fontWeight: 700 }}><ScoreDetails score={score} pending={recommended.map((item) => item.nameRu)} /></div>

      <Link href="/export" style={{ textDecoration: "none" }}><div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(92,124,250,0.09)", border: "1px solid rgba(92,124,250,0.16)", borderRadius: 14, padding: "12px 14px", marginBottom: 20, color: "#4C6EF5" }}><span style={{ fontSize: 20 }}>📄</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Моя карта здоровья</div><div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>Открыть и сохранить в PDF</div></div><span style={{ fontSize: 18 }}>›</span></div></Link>

      {medicationTasks.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Лекарства сегодня</div><Link href="/medications" style={{ color: "#5C7CFA", fontSize: 11, textDecoration: "none" }}>{medicationTasks.filter((task) => task.taken).length}/{medicationTasks.length}</Link></div><div style={{ display: "grid", gap: 6 }}>{medicationTasks.slice(0, 4).map((task) => <div key={task.key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, opacity: task.taken ? 0.62 : 1 }}><form action={toggleMedicationTaken}><input type="hidden" name="medicationId" value={task.medicationId} /><input type="hidden" name="scheduledAt" value={task.scheduledAt} /><button type="submit" style={{ width: 27, height: 27, borderRadius: "50%", border: task.taken ? 0 : "1.5px solid rgba(26,32,80,0.18)", background: task.taken ? "#5C7CFA" : "transparent", color: "white" }}>{task.taken ? "✓" : ""}</button></form><div style={{ flex: 1, fontSize: 12, fontWeight: 600, textDecoration: task.taken ? "line-through" : "none" }}>{task.name}<span style={{ display: "block", fontSize: 10, color: C.muted, fontWeight: 400, marginTop: 2 }}>{task.time}{task.dosage ? ` · ${task.dosage}` : ""}</span></div></div>)}</div>{medicationTasks.length > 4 && <Link href="/medications" style={{ display: "block", marginTop: 7, color: "#5C7CFA", fontSize: 11, textDecoration: "none" }}>Все задачи →</Link>}</section>}

      {vaccineTasks.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Предстоящие прививки</div><Link href="/vaccinations" style={{ color: "#5C7CFA", fontSize: 11, textDecoration: "none" }}>Все →</Link></div><div style={{ display: "grid", gap: 6 }}>{vaccineTasks.slice(0, 3).map((task) => <div key={task.key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: "rgba(255,247,230,0.85)", border: "1px solid rgba(217,119,6,0.16)", borderRadius: 13 }}><div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{task.nameRu}<span style={{ display: "block", fontSize: 10, color: task.overdue ? "#E03131" : C.muted, fontWeight: 400, marginTop: 2 }}>{task.overdue ? "Просрочено" : "Запланировано"}: {task.dueDate} · доза {task.doseNumber}/{task.totalDoses}</span></div><form action={completeUpcomingVaccination}><input type="hidden" name="vaccineId" value={task.vaccineId} /><input type="hidden" name="doseNumber" value={task.doseNumber} /><input type="hidden" name="dateGiven" value={todayKey} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "7px 8px", background: "#5C7CFA", color: "white", fontSize: 11, fontWeight: 700 }}>Готово</button></form></div>)}</div></section>}

      {monitoringTasks.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 9 }}>Напоминания курса</div>{monitoringTasks.slice(0, 2).map((item) => <div key={`${item.id}:${item.medicationId}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: C.card, border: `1px solid ${item.overdue ? "rgba(224,49,49,0.24)" : C.border}`, borderRadius: 13, marginBottom: 6 }}><div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>🧪 {item.title_ru}<span style={{ display: "block", fontSize: 10, color: item.overdue ? "#E03131" : C.muted, fontWeight: 400, marginTop: 2 }}>{item.overdue ? "Просрочено" : "До"} {item.dueDate}</span></div><form action={completeMonitoringTask}><input type="hidden" name="medicationId" value={item.medicationId} /><input type="hidden" name="ruleId" value={item.id} /><input type="hidden" name="repeatDays" value={item.repeat_days} /><button type="submit" style={{ border: 0, background: "transparent", color: "#5C7CFA", fontSize: 11, fontWeight: 700 }}>Готово</button></form></div>)}</section>}
      {data.medications.length === 0 && <section style={{ marginBottom: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><div style={{ fontSize: 13, fontWeight: 700 }}>Вы принимаете лекарства?</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Добавьте препарат в расписание и отмечайте каждый приём.</div><Link href="/medications" style={{ display: "inline-block", marginTop: 9, color: "#5C7CFA", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Да, добавить →</Link></section>}

      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Разделы</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
        {tiles.map((tile) => <Link key={tile.label} href={tile.href} style={{ textDecoration: "none" }}><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, position: "relative", overflow: "hidden", boxShadow: "0 1px 6px rgba(26,32,80,0.04)" }}><div style={{ position: "absolute", width: 55, height: 55, borderRadius: "50%", background: tile.blob, top: -14, right: -14, filter: "blur(14px)", opacity: 0.5 }} /><div style={{ fontSize: 20, marginBottom: 7, position: "relative" }}>{tile.icon}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text, position: "relative" }}>{tile.label}</div><div style={{ fontSize: 10, color: C.muted, position: "relative" }}>{tile.label === "Прививки" ? `${data.vaccinations.length} записей` : tile.label === "Лекарства" ? `${data.medications.length} активных` : tile.label === "Анализы" ? `${labs.length} записей` : "Скоро"}</div></div></Link>)}
      </div>

      {data.medications.length === 0 ? <Link href="/medications" style={{ textDecoration: "none" }}><div style={{ padding: "14px 16px", background: C.card, border: "1px dashed rgba(186,200,255,0.5)", borderRadius: 16, fontSize: 13, color: C.muted, textAlign: "center" }}>+ Добавьте первое лекарство</div></Link> : <div style={{ fontSize: 13, color: C.muted }}>Активных лекарств: {data.medications.length}</div>}
    </div>
  );
}

function Landing() {
  return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "#1A2050" }}><div><div style={{ fontSize: 56, marginBottom: 12 }}>💙</div><h1 style={{ fontSize: 28, margin: "0 0 10px" }}>Karta</h1><p style={{ color: "rgba(26,32,80,0.55)", lineHeight: 1.5 }}>Ваша карта прививок, лекарств и анализов в одном месте.</p><a href={chatGPTSignInPath("/")} style={{ display: "inline-block", marginTop: 14, padding: "13px 20px", borderRadius: 14, background: "#5C7CFA", color: "white", textDecoration: "none", fontWeight: 700 }}>Войти через ChatGPT</a><div style={{ marginTop: 12, fontSize: 13 }}><Link href="/login" style={{ color: "#5C7CFA" }}>Войти по email</Link><span style={{ color: "rgba(26,32,80,.35)", margin: "0 7px" }}>·</span><Link href="/register" style={{ color: "#5C7CFA" }}>Создать аккаунт</Link></div></div></div>;
}
