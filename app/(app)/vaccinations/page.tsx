import Link from "next/link";
import { cookies } from "next/headers";
import { FileDown, Globe2, MapPin } from "lucide-react";
import { addVaccination, completeUpcomingVaccination, deleteVaccination, updateVaccination } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import catalog from "@/app/vaccinations_catalog.json";
import { catalogRegion, dateKey, plannedVaccinationDateKey, recommendedVaccines, tbeRisk, vaccinationScore, upcomingVaccineTasks, type VaccineForTasks } from "@/app/tasks";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import { isCustomVaccineId, readVaccinationMetadata } from "@/app/vaccination-record";
import brandCatalog from "@/app/vaccine_brands.json";
import { AddVaccinationSheet } from "@/app/AddVaccinationSheet";
import { VaccineRecommendationSheet } from "@/app/VaccineRecommendationSheet";

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
  const score = vaccinationScore(data.profile, records, taskCatalog);
  const region = catalogRegion(data.profile?.countryCode);
  const today = dateKey(new Date());

  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 12, marginBottom: 14 }}>
      <div><div style={{ fontSize: 24, fontWeight: 700 }}>{en ? "Vaccinations" : "Прививки"}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{tab === "passport" ? (en ? "Vaccination record" : "Паспорт вакцинации") : (en ? "Personal recommendations" : "Персональные рекомендации")}</div></div>
      <div style={{ display: "flex", gap: 8 }}><Link href="/export?scope=full" aria-label={en ? "Export health card as PDF" : "Выгрузить карту в PDF"} style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(92,124,250,.1)", color: "#5C7CFA" }}><FileDown size={18} /></Link><AddVaccinationSheet vaccines={data.vaccines} brands={brands} /></div>
    </div>

    <div style={{ display: "flex", gap: 4, padding: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 20 }}>
      <Link href="/vaccinations?tab=passport" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "passport" ? "#5C7CFA" : C.muted, background: tab === "passport" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "passport" ? 700 : 500 }}>{en ? "Record" : "Паспорт"}</Link>
      <Link href="/vaccinations?tab=recommendations" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "recommendations" ? "#5C7CFA" : C.muted, background: tab === "recommendations" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "recommendations" ? 700 : 500 }}>{en ? "Recommendations" : "Рекомендации"}</Link>
    </div>

    <datalist id="vaccine-brands">{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>

    {tab === "passport" ? <PassportContent data={data} records={records} upcoming={upcoming} score={score} today={today} en={en} /> : <RecommendationsContent data={data} recommendations={recommendations} region={region || undefined} today={today} en={en} />}

  </div>;
}

function PassportContent({ data, records, upcoming, score, today, en }: { data: Awaited<ReturnType<typeof getUserData>>; records: Array<{ id: string; vaccineId: string; dateGiven: string | null; doseNumber: number; brand: string | null; clinic: string | null; notes: string | null }>; upcoming: Array<ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }>; score: number; today: string; en: boolean }) {
  const history = data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming);
  return <>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "17px 18px", marginBottom: 18, boxShadow: "0 2px 16px rgba(26,32,80,.06)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", color: C.muted, marginBottom: 10 }}>KARTA · {en ? "VACCINATION RECORD" : "ПАСПОРТ ВАКЦИНАЦИИ"}</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>{data.profile?.fullName}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{data.profile?.birthDate ? `${en ? "Date of birth" : "Дата рождения"}: ${new Date(`${data.profile.birthDate.slice(0, 10)}T00:00:00`).toLocaleDateString(en ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric" })}` : (en ? "Add your date of birth in your profile" : "Добавьте дату рождения в профиле")}</div>
      <div style={{ display: "flex", gap: 24, marginTop: 17 }}><Stat value={history.length} label={en ? "RECORDS" : "ЗАПИСЕЙ"} /><Stat value={history.reduce((n, { record }) => n + (record.doseNumber || 1), 0)} label={en ? "DOSES" : "ДОЗ"} /><Stat value={score} label="KARTA SCORE" accent={score === 100 ? "#099268" : "#5C7CFA"} /></div>
    </div>

    <div style={{ background: upcoming.length ? "rgba(255,247,230,.9)" : "rgba(232,250,241,.8)", border: `1px solid ${upcoming.length ? "rgba(217,119,6,.2)" : "rgba(32,201,151,.2)"}`, borderRadius: 16, padding: "13px 14px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: upcoming.length ? 9 : 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Upcoming vaccinations" : "Предстоящие прививки"}</div><div style={{ color: upcoming.length ? "#D97706" : "#0CA678", fontWeight: 700 }}>{upcoming.length}</div></div>
      {upcoming.length === 0 ? <div style={{ fontSize: 11, color: C.muted }}>{en ? "No upcoming doses yet." : "Предстоящих доз пока нет."}</div> : <div style={{ display: "grid", gap: 8 }}>{upcoming.map((task) => <UpcomingTask key={task.key} task={task} today={today} firstDoseDate={records.find((record) => record.vaccineId === task.vaccineId && record.doseNumber === 1)?.dateGiven || ""} en={en} />)}</div>}
    </div>

    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{en ? "My history" : "Моя история"}</div>
    {history.length === 0 ? <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>{en ? "No records yet. Add your first vaccination below." : "Пока нет записей. Добавьте первую прививку ниже."}</div> : history.map(({ record, vaccine }) => {
      const metadata = readVaccinationMetadata(record.notes);
      const custom = isCustomVaccineId(record.vaccineId);
      const title = metadata.name || (en ? vaccine?.nameEn : vaccine?.nameRu) || record.vaccineId;
      return <details key={record.id} style={{ marginBottom: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "11px 13px" }}><summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#20C997" }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div><div style={{ fontSize: 10, color: C.muted }}>{metadata.dateString || record.dateGiven || (en ? "Date not specified" : "Дата не указана")} · {en ? "dose" : "доза"} {record.doseNumber}{metadata.totalDoses && metadata.totalDoses > 1 ? `/${metadata.totalDoses}` : ""}{record.brand ? ` · ${record.brand}` : ""}</div></div><span style={{ color: "#5C7CFA", fontSize: 11 }}>{en ? "Edit" : "Изменить"}</span></summary><form action={updateVaccination} style={{ display: "grid", gap: 8, marginTop: 10 }}><input type="hidden" name="id" value={record.id} /><select name="vaccineId" defaultValue={custom ? "" : record.vaccineId} style={input}><option value="">{en ? "Custom vaccination" : "Своя прививка"}</option>{data.vaccines.map((v) => <option value={v.id} key={v.id}>{en ? v.nameEn : v.nameRu}</option>)}</select><input name="customName" defaultValue={custom ? title : ""} placeholder={en ? "Custom vaccination name" : "Название своей прививки"} style={input} /><input name="dateGiven" type="date" defaultValue={metadata.dateDoneISO || record.dateGiven || ""} style={input} /><input name="nextDue" type="date" defaultValue={metadata.nextDue || ""} style={input} /><input name="doseNumber" type="number" min="1" defaultValue={record.doseNumber} style={input} /><input name="totalDoses" type="number" min="1" max="10" defaultValue={metadata.totalDoses || vaccine?.totalDoses || 1} style={input} /><input name="brand" list="vaccine-brands" defaultValue={record.brand || ""} placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><input name="clinic" defaultValue={record.clinic || ""} placeholder={en ? "Clinic" : "Клиника"} style={input} /><textarea name="notes" defaultValue={metadata.userNotes || ""} placeholder={en ? "Notes" : "Заметки"} rows={2} style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>{en ? "Save changes" : "Сохранить изменения"}</button></form><form action={deleteVaccination} style={{ marginTop: 7 }}><input type="hidden" name="id" value={record.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 12 }}>{en ? "Delete record" : "Удалить запись"}</button></form></details>;
    })}
  </>;
}

function Stat({ value, label, accent = C.text }: { value: number; label: string; accent?: string }) {
  return <div><b style={{ fontSize: 22, color: accent }}>{value}</b><small style={{ display: "block", fontSize: 9, color: C.muted }}>{label}</small></div>;
}

function UpcomingTask({ task, today, firstDoseDate, en }: { task: ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }; today: string; firstDoseDate: string; en: boolean }) {
  const vaccine = taskCatalog.find((item) => item.id === task.vaccineId);
  const vaccineName = task.recordId ? task.nameRu : (en ? vaccine?.nameEn : vaccine?.nameRu) || task.nameRu;
  return <details style={{ background: "rgba(255,255,255,.7)", borderRadius: 12, padding: "10px 11px" }}>
    <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{vaccineName}</div><div style={{ fontSize: 11, color: task.overdue ? "#E03131" : C.muted }}>{task.overdue ? (en ? "Overdue" : "Просрочено") : (en ? "Scheduled" : "Запланировано")}: {task.dueDate} · {en ? "dose" : "доза"} {task.doseNumber}/{task.totalDoses}</div></div><span style={{ color: "#5C7CFA", fontSize: 11 }}>{en ? "Mark done" : "Отметить"}</span></summary>
    <form action={completeUpcomingVaccination} style={{ display: "grid", gap: 7, marginTop: 10 }}>{task.recordId && <input type="hidden" name="id" value={task.recordId} />}<input type="hidden" name="vaccineId" value={task.vaccineId} /><input type="hidden" name="doseNumber" value={task.doseNumber} /><input type="hidden" name="totalDoses" value={task.totalDoses} /><VaccinationDateInput initialDate={today} maxDate={today} doseNumber={task.doseNumber} totalDoses={task.totalDoses} doseScheduleDays={vaccine?.doseScheduleDays} firstDoseDate={firstDoseDate} frequencyType={vaccine?.frequencyType} intervalYears={vaccine?.intervalYears} style={input} /><input name="brand" list="vaccine-brands" placeholder={en ? "Product / brand" : "Препарат / бренд"} style={input} /><input name="clinic" placeholder={en ? "Clinic" : "Клиника"} style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>{en ? "Save completed dose" : "Сохранить выполненную дозу"}</button></form>
    {task.recordId && <form action={deleteVaccination} style={{ marginTop: 6, textAlign: "right" }}><input type="hidden" name="id" value={task.recordId} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 11 }}>{en ? "Delete plan" : "Удалить план"}</button></form>}
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
