import Link from "next/link";
import { cookies } from "next/headers";
import { Globe2, MapPin, Syringe } from "lucide-react";
import { addVaccination, completeUpcomingVaccination, deleteVaccination } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import catalog from "@/app/vaccinations_catalog.json";
import { catalogRegion, dateKey, plannedVaccinationDateKey, recommendedVaccines, tbeRisk, upcomingVaccineTasks, type VaccineForTasks } from "@/app/tasks";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import { readVaccinationMetadata } from "@/app/vaccination-record";
import brandCatalog from "@/app/vaccine_brands.json";
import { AddVaccinationSheet } from "@/app/AddVaccinationSheet";
import { VaccineRecommendationSheet } from "@/app/VaccineRecommendationSheet";
import { VaccinationHistory } from "@/app/VaccinationHistory";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;
const brands = Array.from(new Set(Object.values(brandCatalog).flat()));
const taskCatalog = catalog as unknown as VaccineForTasks[];

export default async function VaccinationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const en = (await cookies()).get("karta_lang")?.value === "en";
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>{en ? "Sign in to open your vaccination card." : "Войдите, чтобы открыть карту."}</div>;

  const tab = (await searchParams).tab === "recommendations" ? "recommendations" : "passport";
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const records = data.vaccinations.map(({ record }) => record);
  const todayDate = new Date();
  const generatedUpcoming = upcomingVaccineTasks(records, taskCatalog, todayDate);
  const manualUpcoming = data.vaccinations.flatMap(({ record, vaccine }) => {
    const metadata = readVaccinationMetadata(record.notes);
    if (!metadata.isUpcoming) return [];
    const dueDate = plannedVaccinationDateKey(metadata);
    return [{ key: record.id, recordId: record.id, vaccineId: record.vaccineId, nameRu: metadata.name || vaccine?.nameRu || record.vaccineId, doseNumber: record.doseNumber, totalDoses: metadata.totalDoses || vaccine?.totalDoses || 1, dueDate, overdue: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && dueDate < dateKey(todayDate) }];
  });
  const manualKeys = new Set(manualUpcoming.map((task) => `${task.vaccineId}:${task.doseNumber}`));
  const upcoming = [...manualUpcoming, ...generatedUpcoming.filter((task) => !manualKeys.has(`${task.vaccineId}:${task.doseNumber}`))].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const recommendations = recommendedVaccines(data.profile, records, taskCatalog);
  const region = catalogRegion(data.profile?.countryCode);
  const today = dateKey(new Date());

  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 12, marginBottom: 14 }}>
      <div><div style={{ fontSize: 26, fontWeight: 700 }}>{en ? "Vaccinations" : "Прививки"}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{tab === "passport" ? (en ? "Vaccination record" : "Паспорт вакцинации") : (en ? "Personal recommendations" : "Персональные рекомендации")}</div></div>
      <AddVaccinationSheet vaccines={data.vaccines} brands={brands} />
    </div>

    <div style={{ display: "flex", gap: 4, padding: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 20 }}>
      <Link href="/vaccinations?tab=passport" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "passport" ? "#5C7CFA" : C.muted, background: tab === "passport" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "passport" ? 700 : 500 }}>{en ? "Record" : "Паспорт"}</Link>
      <Link href="/vaccinations?tab=recommendations" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "recommendations" ? "#5C7CFA" : C.muted, background: tab === "recommendations" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "recommendations" ? 700 : 500 }}>{en ? "Recommendations" : "Рекомендации"}</Link>
    </div>

    <datalist id="vaccine-brands">{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>

    {tab === "passport" ? <PassportContent data={data} records={records} upcoming={upcoming} recommendedCount={recommendations.length} today={today} en={en} vaccines={data.vaccines} /> : <RecommendationsContent data={data} recommendations={recommendations} region={region || undefined} today={today} en={en} />}

  </div>;
}

function PassportContent({ data, records, upcoming, recommendedCount, today, en, vaccines }: { data: Awaited<ReturnType<typeof getUserData>>; records: Array<{ id: string; vaccineId: string; dateGiven: string | null; doseNumber: number; brand: string | null; clinic: string | null; notes: string | null }>; upcoming: Array<ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }>; recommendedCount: number; today: string; en: boolean; vaccines: Array<{ id: string; nameRu: string; nameEn?: string | null; totalDoses?: number | null; doseScheduleDays?: number[] | null; frequencyType?: string | null; intervalYears?: number | null }> }) {
  const history = data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming);
  return <>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, marginBottom: 20, boxShadow: "0 2px 16px rgba(26,32,80,.06)" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <a href="#upcoming-doses" style={{ flex: 1, display: "grid", justifyItems: "center", gap: 3, padding: "12px 8px", borderRadius: 12, background: upcoming.length ? "rgba(245,158,11,.08)" : "rgba(32,201,151,.08)", textDecoration: "none" }}><b style={{ color: upcoming.length ? "#F59E0B" : "#20C997", fontSize: 22, lineHeight: 1 }}>{upcoming.length}</b><span style={{ color: C.muted, fontSize: 10 }}>{en ? "upcoming" : "предстоящих"}</span></a>
        <Link href="/vaccinations?tab=recommendations" style={{ flex: 1, display: "grid", justifyItems: "center", gap: 3, padding: "12px 8px", border: `1px solid ${recommendedCount ? "rgba(92,124,250,.15)" : "rgba(32,201,151,.2)"}`, borderRadius: 12, background: recommendedCount ? "rgba(92,124,250,.08)" : "rgba(32,201,151,.08)", textDecoration: "none" }}><b style={{ color: recommendedCount ? "#5C7CFA" : "#20C997", fontSize: 22, lineHeight: 1 }}>{recommendedCount}</b><span style={{ color: C.muted, fontSize: 10 }}>{en ? "recommended" : "рекомендованных"}</span></Link>
      </div>
    </div>

    <div id="upcoming-doses" style={{ background: "transparent", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: upcoming.length ? 9 : 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Upcoming vaccinations" : "Предстоящие прививки"}</div><div style={{ color: upcoming.length ? "#D97706" : "#0CA678", fontWeight: 700 }}>{upcoming.length}</div></div>
      {upcoming.length === 0 ? <div style={{ fontSize: 11, color: C.muted }}>{en ? "No upcoming doses yet." : "Предстоящих доз пока нет."}</div> : <div style={{ display: "grid", gap: 4 }}>{upcoming.map((task) => <UpcomingTask key={task.key} task={task} today={today} firstDoseDate={records.find((record) => record.vaccineId === task.vaccineId && record.doseNumber === 1)?.dateGiven || ""} en={en} />)}</div>}
    </div>

    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{en ? "My history" : "Моя история"}</div>
    <VaccinationHistory records={history.map(({ record }) => record)} vaccines={vaccines} brands={brands} />
  </>;
}

function UpcomingTask({ task, today, firstDoseDate, en }: { task: ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }; today: string; firstDoseDate: string; en: boolean }) {
  const vaccine = taskCatalog.find((item) => item.id === task.vaccineId);
  const vaccineName = task.recordId ? task.nameRu : (en ? vaccine?.nameEn : vaccine?.nameRu) || task.nameRu;
  const date = new Date(`${task.dueDate.slice(0, 10)}T00:00:00`);
  const dueLabel = Number.isNaN(date.getTime()) ? task.dueDate : date.toLocaleDateString(en ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric" });
  const daysUntil = Math.ceil((date.getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
  const soon = !task.overdue && Number.isFinite(daysUntil) && daysUntil <= 30;
  const accent = task.overdue ? "#E03131" : soon ? "#F59E0B" : "#5C7CFA";
  return <details style={{ background: C.card, border: `1px solid ${task.overdue ? "rgba(224,49,49,.3)" : C.border}`, borderRadius: 14, overflow: "hidden" }}>
    <summary className="vax-upcoming-summary" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", listStyle: "none" }}><span style={{ width: 36, height: 36, flex: "0 0 36px", display: "grid", placeItems: "center", borderRadius: 8, background: `${accent}1F` }}><Syringe size={15} color={accent} /></span><span style={{ minWidth: 0, flex: 1 }}><span style={{ display: "block", fontSize: 13, fontWeight: 650 }}>{vaccineName}</span><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>{task.totalDoses > 1 ? en ? `Dose ${task.doseNumber} of ${task.totalDoses}` : `Доза ${task.doseNumber} из ${task.totalDoses}` : en ? "Booster" : "Ревакцинация"}</span></span><span style={{ textAlign: "right" }}><span style={{ display: "block", color: accent, fontSize: 13, fontWeight: 650, whiteSpace: "nowrap" }}>{dueLabel}</span>{(task.overdue || soon) && <span style={{ display: "block", color: accent, fontSize: 9 }}>{task.overdue ? en ? "overdue" : "просрочено" : en ? "soon" : "скоро"}</span>}</span><span aria-hidden="true" style={{ color: "rgba(26,32,80,.35)", fontSize: 16 }}>⌄</span></summary>
    <div style={{ padding: "0 14px 12px" }}><div style={{ height: 1, background: "rgba(26,32,80,.08)", marginBottom: 8 }} />{vaccine?.descriptionRu && <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px" }}>{en ? vaccine.descriptionEn || vaccine.descriptionRu : vaccine.descriptionRu}</p>}
      <form action={completeUpcomingVaccination} style={{ display: "grid", gap: 7, marginTop: 8 }}>{task.recordId && <input type="hidden" name="id" value={task.recordId} />}<input type="hidden" name="vaccineId" value={task.vaccineId} /><input type="hidden" name="doseNumber" value={task.doseNumber} /><input type="hidden" name="totalDoses" value={task.totalDoses} /><VaccinationDateInput initialDate={today} maxDate={today} doseNumber={task.doseNumber} totalDoses={task.totalDoses} doseScheduleDays={vaccine?.doseScheduleDays} firstDoseDate={firstDoseDate} frequencyType={vaccine?.frequencyType} intervalYears={vaccine?.intervalYears} style={input} /><input name="brand" list="vaccine-brands" placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><input name="clinic" placeholder={en ? "Clinic" : "Клиника"} style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>{en ? "Mark as done" : "Отметить сделанной"}</button></form>
      {task.recordId && <form action={deleteVaccination} style={{ marginTop: 6, textAlign: "right" }}><input type="hidden" name="id" value={task.recordId} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 11 }}>{en ? "Delete plan" : "Удалить план"}</button></form>}
    </div>
  </details>;
}

function RecommendationsContent({ data, recommendations, region, today, en }: { data: Awaited<ReturnType<typeof getUserData>>; recommendations: ReturnType<typeof recommendedVaccines>; region: string | undefined; today: string; en: boolean }) {
  const travelAdvisory = tbeRisk(data.profile?.countryCode, data.profile?.regionCurrent) === "low";
  const city = data.profile?.cityCurrent;
  const countryCode = data.profile?.countryCode;
  const countryName = data.profile?.countryCurrent || (countryCode
    ? new Intl.DisplayNames([en ? "en-US" : "ru-RU"], { type: "region" }).of(countryCode) || countryCode
    : "");
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px", marginBottom: 18, textAlign: "center" as const };

  if (!city) return <section style={card}>
    <MapPin size={32} color={C.primary} style={{ opacity: .5 }} />
    <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700 }}>{en ? "Set your city" : "Укажите город"}</div>
    <div style={{ maxWidth: 290, margin: "6px auto 14px", color: C.muted, fontSize: 12, lineHeight: 1.45 }}>{en ? "To see vaccine recommendations for your country, add your city to your profile." : "Чтобы увидеть рекомендации для вашей страны, укажите город в профиле."}</div>
    <Link href="/profile" style={{ display: "inline-block", padding: "10px 16px", borderRadius: 999, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{en ? "Go to profile" : "Перейти в профиль"}</Link>
  </section>;

  if (!region) return <section style={card}>
    <Globe2 size={32} color={C.primary} style={{ opacity: .5 }} />
    <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700 }}>{en ? "Coming soon" : "Скоро"}</div>
    <div style={{ maxWidth: 290, margin: "6px auto 0", color: C.muted, fontSize: 12, lineHeight: 1.45 }}>{en ? `Recommendations for ${countryName || "your country"} are coming soon.` : `Рекомендации для страны «${countryName || "вашего региона"}» пока готовятся.`}</div>
  </section>;

  return <section style={{ ...card, textAlign: "left" }}>
    <div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Recommended for you" : "Рекомендовано для вас"} · {recommendations.length}</div>
    <div style={{ marginTop: 10 }}>
      {recommendations.length === 0 ? <div style={{ color: C.muted, fontSize: 12 }}>{en ? "All applicable vaccinations are already recorded, or more profile details are needed." : "Все подходящие прививки уже записаны или нужны дополнительные данные профиля."}</div> : <div style={{ display: "grid", gap: 8 }}>{recommendations.map((item) => <VaccineRecommendationSheet key={item.id} vaccine={item} region={region} today={today} brands={brandCatalog[item.id] || []} travelAdvisory={Boolean(item.requiresEndemicCheck && travelAdvisory)} />)}</div>}
    </div>
  </section>;
}
