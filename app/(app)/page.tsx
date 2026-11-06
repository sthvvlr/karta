import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { completeMonitoringTask, completeUpcomingVaccination, toggleMedicationTaken } from "@/app/actions";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import healthFacts from "@/app/health_facts.json";
import rules from "@/app/monitoring_rules.json";
import catalog from "@/app/vaccinations_catalog.json";
import brandCatalog from "@/app/vaccine_brands.json";
import { dateKey, medicationTasksForDate, monitoringTasksForDate, recommendedVaccines, vaccinationScore, upcomingVaccineTasks, type VaccineForTasks } from "@/app/tasks";
import { ScoreDetails } from "@/app/ScoreDetails";
import { MedicationPrompt } from "@/app/MedicationPrompt";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import { readVaccinationMetadata } from "@/app/vaccination-record";
import { getDb } from "@/db";
import { labResults, medicationLogs, monitoringCompletions } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;
const taskCatalog = catalog as unknown as VaccineForTasks[];

const tiles = [
  { href: "/vaccinations", icon: "💉", label: "Прививки", blob: "#BAC8FF" },
  { href: "/medications", icon: "💊", label: "Лекарства", blob: "#D0BFFF" },
  { href: "/labs", icon: "🧪", label: "Анализы", blob: "#A5F3FC" },
  { href: "#coming-soon", icon: "📋", label: "Чекапы", blob: "#C7F5E8" },
];

export default async function HomePage() {
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const user = await getChatGPTUser();
  if (!user) {
    return <Landing en={en} />;
  }
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  if (!data.profile?.onboardingCompleted && (!data.profile?.fullName || !data.profile?.cityCurrent)) {
    redirect("/onboarding");
  }
  const today = new Date();
  const todayKey = dateKey(today);
  const db = getDb();
  const [logs, completions, labs] = await Promise.all([
    db.select().from(medicationLogs).where(and(eq(medicationLogs.userId, user.userId), gte(medicationLogs.scheduledAt, `${todayKey}T00:00:00`), lt(medicationLogs.scheduledAt, `${todayKey}T23:59:59`))),
    db.select().from(monitoringCompletions).where(eq(monitoringCompletions.userId, user.userId)),
    db.select({ id: labResults.id }).from(labResults).where(eq(labResults.userId, user.userId)),
  ]);
  const medicationTasks = medicationTasksForDate(data.medications, logs, today);
  const generatedVaccineTasks = upcomingVaccineTasks(data.vaccinations.map(({ record }) => record), taskCatalog, today);
  const manualVaccineTasks = data.vaccinations.flatMap(({ record, vaccine }) => {
    const metadata = readVaccinationMetadata(record.notes);
    if (!metadata.isUpcoming) return [];
    const dueDate = metadata.nextDue || "";
    return [{ key: record.id, recordId: record.id, vaccineId: record.vaccineId, nameRu: metadata.name || vaccine?.nameRu || record.vaccineId, doseNumber: record.doseNumber, totalDoses: metadata.totalDoses ?? vaccine?.totalDoses ?? 1, dueDate, overdue: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && dueDate < todayKey }];
  });
  const manualVaccineTaskKeys = new Set(manualVaccineTasks.map((task) => `${task.vaccineId}:${task.doseNumber}`));
  const vaccineTasks = [...manualVaccineTasks, ...generatedVaccineTasks.filter((task) => !manualVaccineTaskKeys.has(`${task.vaccineId}:${task.doseNumber}`))].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const recommended = recommendedVaccines(data.profile, data.vaccinations.map(({ record }) => record), taskCatalog, today);
  const score = vaccinationScore(data.profile, data.vaccinations.map(({ record }) => record), taskCatalog, today);
  const monitoringTasks = monitoringTasksForDate(data.medications, completions, rules, today);
  const name = data.profile?.fullName?.split(" ")[0] || user.displayName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = en
    ? hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
    : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const profileFields = [data.profile?.fullName, data.profile?.cityCurrent, data.medications.length, data.vaccinations.length];
  const profileProgress = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const todayFact = healthFacts[(dayOfYear - 1) % healthFacts.length];
  const profileComplete = profileProgress === 100;

  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingTop: 12 }}>
        <div><div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{greeting}</div><div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{name}</div></div>
        <Link href="/profile" style={{ textDecoration: "none" }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: C.text }}>{name[0]?.toUpperCase()}</div></Link>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: "0 2px 16px rgba(26,32,80,0.06)", padding: "18px 20px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 130, height: 130, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", top: -35, right: -35, filter: "blur(30px)", opacity: 0.6 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", padding: 5, background: `conic-gradient(#748FFC ${profileComplete ? score : profileProgress}%, rgba(26,32,80,0.08) 0)`, flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "rgba(255,255,255,.86)", display: "grid", placeItems: "center", color: "#5C7CFA", fontWeight: 700, fontSize: profileComplete ? 17 : 12 }}>{profileComplete ? score : `${profileProgress}%`}</div>
          </div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>{profileComplete ? "Karta Score" : en ? "Complete your profile" : "Заполните профиль"}</div><div style={{ fontSize: 11, color: C.muted }}>{profileComplete ? (score === 100 ? (en ? "All vaccinations done 🎉" : "Все прививки сделаны 🎉") : (en ? "Tap to see what's left" : "Нажмите, чтобы узнать что сделать")) : en ? `Profile ${profileProgress}% complete` : `Профиль заполнен на ${profileProgress}%`}</div></div>
          {!profileComplete && <Link href="/profile" aria-label="Заполнить профиль" style={{ color: C.muted, fontSize: 16, textDecoration: "none" }}>›</Link>}
        </div>
        {profileComplete && score < 100 && <div style={{ position: "relative", zIndex: 1, marginTop: 12, padding: "0 4px", fontSize: 12, color: C.muted }}><ScoreDetails score={score} pending={recommended.map((item) => ({ id: item.id, name: item.nameRu, nameEn: item.nameEn, description: item.descriptionRu, descriptionEn: item.descriptionEn }))} overdue={vaccineTasks.filter((task) => task.overdue).map((task) => ({ ...task, nameEn: taskCatalog.find((vaccine) => vaccine.id === task.vaccineId)?.nameEn }))} /></div>}

        <div style={{ position: "relative", zIndex: 1, height: 1, background: "rgba(26,32,80,0.08)", margin: "14px 0" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 8 }}><span style={{ fontSize: 13, lineHeight: 1 }}>💡</span><div><div style={{ fontSize: 10, color: "#5C7CFA", fontWeight: 700, marginBottom: 4 }}>{en ? "INTERESTING FACT" : "ИНТЕРЕСНЫЙ ФАКТ"}</div><div style={{ fontSize: 12, lineHeight: 1.45, color: C.muted }}>{en ? todayFact.en : todayFact.ru}</div></div></div>

        <div style={{ position: "relative", zIndex: 1, height: 1, background: "rgba(26,32,80,0.08)", margin: "14px 0" }} />
        <Link href="/export" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#4C6EF5" }}><span style={{ fontSize: 18 }}>📄</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "My health card" : "Моя карта здоровья"}</div><div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>{en ? "Open and save as PDF" : "Открыть и сохранить в PDF"}</div></div><span style={{ fontSize: 17 }}>›</span></Link>
      </div>

      {data.medications.length === 0 && <MedicationPrompt en={en} />}

      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>{en ? "Sections" : "Разделы"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
        {tiles.map((tile) => { const label = tile.label; const displayLabel = en ? ({ "Прививки": "Vaccinations", "Лекарства": "Medications", "Анализы": "Lab tests", "Чекапы": "Check-ups" }[label] || label) : label; const subtitle = label === "Прививки" ? en ? `${data.vaccinations.length} records` : `${data.vaccinations.length} записей` : label === "Лекарства" ? en ? `${data.medications.length} active` : `${data.medications.length} активных` : label === "Анализы" ? en ? `${labs.length} records` : `${labs.length} записей` : en ? "Coming soon" : "Скоро"; return <Link key={label} href={tile.href} style={{ textDecoration: "none" }}><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, position: "relative", overflow: "hidden", boxShadow: "0 1px 6px rgba(26,32,80,0.04)" }}><div style={{ position: "absolute", width: 55, height: 55, borderRadius: "50%", background: tile.blob, top: -14, right: -14, filter: "blur(14px)", opacity: 0.5 }} /><div style={{ fontSize: 20, marginBottom: 7, position: "relative" }}>{tile.icon}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.text, position: "relative" }}>{displayLabel}</div><div style={{ fontSize: 10, color: C.muted, position: "relative" }}>{subtitle}</div></div></Link>; })}
      </div>

      {medicationTasks.some((task) => !task.taken) && <section style={{ marginBottom: 18 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>{en ? "Today" : "Сегодня"}</div><div style={{ display: "grid", gap: 6 }}>{medicationTasks.filter((task) => !task.taken).slice(0, 3).map((task) => <div key={task.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}><form action={toggleMedicationTaken}><input type="hidden" name="medicationId" value={task.medicationId} /><input type="hidden" name="scheduledAt" value={task.scheduledAt} /><button type="submit" aria-label={en ? "Mark as taken" : "Отметить приём"} style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(26,32,80,0.22)", background: "transparent", color: "white", padding: 0 }} /></form><div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{task.name}{task.dosage && <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{task.dosage}</span>}</div><span style={{ fontSize: 11, color: C.muted }}>{task.time}</span></div>)}</div></section>}

      {vaccineTasks.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Upcoming vaccinations" : "Предстоящие прививки"}</div><Link href="/vaccinations" style={{ color: "#5C7CFA", fontSize: 11, textDecoration: "none" }}>{en ? "All →" : "Все →"}</Link></div><div style={{ display: "grid", gap: 6 }}>{vaccineTasks.slice(0, 3).map((task) => { const vaccine = taskCatalog.find((item) => item.id === task.vaccineId); const firstDoseDate = data.vaccinations.find(({ record }) => record.vaccineId === task.vaccineId && record.doseNumber === 1)?.record.dateGiven || ""; return <details key={task.key} style={{ padding: "10px 12px", background: "rgba(255,247,230,0.85)", border: "1px solid rgba(217,119,6,0.16)", borderRadius: 13 }}><summary style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", listStyle: "none" }}><div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{en ? vaccine?.nameEn || task.nameRu : task.nameRu}<span style={{ display: "block", fontSize: 10, color: task.overdue ? "#E03131" : C.muted, fontWeight: 400, marginTop: 2 }}>{task.overdue ? (en ? "Overdue" : "Просрочено") : (en ? "Scheduled" : "Запланировано")}: {task.dueDate} · {en ? "dose" : "доза"} {task.doseNumber}/{task.totalDoses}</span></div><span style={{ borderRadius: 9, padding: "7px 8px", background: "#5C7CFA", color: "white", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{en ? "Mark done" : "Отметить"}</span></summary><form action={completeUpcomingVaccination} style={{ display: "grid", gap: 7, marginTop: 10 }}>{task.recordId && <input type="hidden" name="id" value={task.recordId} />}<input type="hidden" name="vaccineId" value={task.vaccineId} /><input type="hidden" name="doseNumber" value={task.doseNumber} /><VaccinationDateInput initialDate={todayKey} maxDate={todayKey} doseNumber={task.doseNumber} totalDoses={task.totalDoses} doseScheduleDays={vaccine?.doseScheduleDays} firstDoseDate={firstDoseDate} frequencyType={vaccine?.frequencyType} intervalYears={vaccine?.intervalYears} style={input} /><input name="brand" list="vaccine-brands" placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><input name="clinic" placeholder={en ? "Clinic" : "Клиника"} style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>{en ? "Save completed dose" : "Сохранить выполненную дозу"}</button></form></details>; })}</div></section>}

      {monitoringTasks.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 9 }}>{en ? "Course reminders" : "Напоминания курса"}</div>{monitoringTasks.slice(0, 2).map((item) => <div key={`${item.id}:${item.medicationId}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: C.card, border: `1px solid ${item.overdue ? "rgba(224,49,49,0.24)" : C.border}`, borderRadius: 13, marginBottom: 6 }}><div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>🧪 {en ? item.title_en || item.title_ru : item.title_ru}<span style={{ display: "block", fontSize: 10, color: item.overdue ? "#E03131" : C.muted, fontWeight: 400, marginTop: 2 }}>{item.overdue ? (en ? "Overdue" : "Просрочено") : (en ? "Due" : "До")} {item.dueDate}</span></div><Link href={`/labs?monitoringMedicationId=${encodeURIComponent(item.medicationId)}&monitoringRuleId=${encodeURIComponent(item.id)}`} aria-label={en ? "Add lab result" : "Внести результат проверки"} style={{ color: "#5C7CFA", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", textDecoration: "none" }}>{en ? "Result" : "Результат"}</Link><form action={completeMonitoringTask}><input type="hidden" name="medicationId" value={item.medicationId} /><input type="hidden" name="ruleId" value={item.id} /><input type="hidden" name="repeatDays" value={item.repeat_days} /><button type="submit" style={{ border: 0, background: "transparent", color: "#5C7CFA", fontSize: 11, fontWeight: 700 }}>{en ? "Done" : "Готово"}</button></form></div>)}</section>}

      {data.medications.length === 0 ? <Link href="/medications" style={{ textDecoration: "none" }}><div style={{ padding: "14px 16px", background: C.card, border: "1px dashed rgba(186,200,255,0.5)", borderRadius: 16, fontSize: 13, color: C.muted, textAlign: "center" }}>{en ? "+ Add your first medication" : "+ Добавьте первое лекарство"}</div></Link> : <div style={{ fontSize: 13, color: C.muted }}>{en ? `Active medications: ${data.medications.length}` : `Активных лекарств: ${data.medications.length}`}</div>}
      <datalist id="vaccine-brands">{Array.from(new Set(Object.values(brandCatalog).flat())).map((brand) => <option value={brand} key={brand} />)}</datalist>
    </div>
  );
}

function Landing({ en }: { en: boolean }) {
  return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "#1A2050" }}><div><div style={{ fontSize: 56, marginBottom: 12 }}>💙</div><h1 style={{ fontSize: 28, margin: "0 0 10px" }}>Karta</h1><p style={{ color: "rgba(26,32,80,0.55)", lineHeight: 1.5 }}>{en ? "Your vaccinations, medications and lab tests in one place." : "Ваша карта прививок, лекарств и анализов в одном месте."}</p><a href={chatGPTSignInPath("/")} style={{ display: "inline-block", marginTop: 14, padding: "13px 20px", borderRadius: 14, background: "#5C7CFA", color: "white", textDecoration: "none", fontWeight: 700 }}>{en ? "Sign in with ChatGPT" : "Войти через ChatGPT"}</a><div style={{ marginTop: 12, fontSize: 13 }}><Link href="/login" style={{ color: "#5C7CFA" }}>{en ? "Sign in with email" : "Войти по email"}</Link><span style={{ color: "rgba(26,32,80,.35)", margin: "0 7px" }}>·</span><Link href="/register" style={{ color: "#5C7CFA" }}>{en ? "Create account" : "Создать аккаунт"}</Link></div></div></div>;
}
