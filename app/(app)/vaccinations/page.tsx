import Link from "next/link";
import { FileDown } from "lucide-react";
import { addVaccination, completeUpcomingVaccination, deleteVaccination, updateVaccination } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import catalog from "@/app/vaccinations_catalog.json";
import { catalogRegion, dateKey, recommendedVaccines, tbeRisk, vaccinationScore, upcomingVaccineTasks, type VaccineForTasks } from "@/app/tasks";
import { VaccinationDateInput } from "@/app/VaccinationDateInput";
import { isCustomVaccineId, readVaccinationMetadata } from "@/app/vaccination-record";
import brandCatalog from "@/app/vaccine_brands.json";
import { AddVaccinationSheet } from "@/app/AddVaccinationSheet";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;
const brands = Array.from(new Set(Object.values(brandCatalog).flat()));
const taskCatalog = catalog as unknown as VaccineForTasks[];

export default async function VaccinationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите, чтобы открыть карту.</div>;

  const tab = (await searchParams).tab === "recommendations" ? "recommendations" : "passport";
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const records = data.vaccinations.map(({ record }) => record);
  const todayDate = new Date();
  const generatedUpcoming = upcomingVaccineTasks(records, taskCatalog, todayDate);
  const manualUpcoming = data.vaccinations.flatMap(({ record, vaccine }) => {
    const metadata = readVaccinationMetadata(record.notes);
    if (!metadata.isUpcoming) return [];
    const dueDate = metadata.nextDue || "";
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
      <div><div style={{ fontSize: 24, fontWeight: 700 }}>Прививки</div><div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{tab === "passport" ? "Паспорт вакцинации" : "Персональные рекомендации"}</div></div>
      <div style={{ display: "flex", gap: 8 }}><Link href="/export?scope=full" aria-label="Выгрузить карту в PDF" style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(92,124,250,.1)", color: "#5C7CFA" }}><FileDown size={18} /></Link><AddVaccinationSheet vaccines={data.vaccines} brands={brands} /></div>
    </div>

    <div style={{ display: "flex", gap: 4, padding: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 20 }}>
      <Link href="/vaccinations?tab=passport" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "passport" ? "#5C7CFA" : C.muted, background: tab === "passport" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "passport" ? 700 : 500 }}>Паспорт</Link>
      <Link href="/vaccinations?tab=recommendations" style={{ flex: 1, padding: "10px 8px", borderRadius: 10, textAlign: "center", textDecoration: "none", color: tab === "recommendations" ? "#5C7CFA" : C.muted, background: tab === "recommendations" ? "rgba(92,124,250,.1)" : "transparent", fontSize: 13, fontWeight: tab === "recommendations" ? 700 : 500 }}>Рекомендации</Link>
    </div>

    <datalist id="vaccine-brands">{brands.map((brand) => <option value={brand} key={brand} />)}</datalist>

    {tab === "passport" ? <PassportContent data={data} records={records} upcoming={upcoming} score={score} today={today} /> : <RecommendationsContent data={data} recommendations={recommendations} region={region || undefined} today={today} />}

  </div>;
}

function PassportContent({ data, records, upcoming, score, today }: { data: Awaited<ReturnType<typeof getUserData>>; records: Array<{ id: string; vaccineId: string; dateGiven: string | null; doseNumber: number; brand: string | null; clinic: string | null; notes: string | null }>; upcoming: Array<ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }>; score: number; today: string }) {
  const history = data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming);
  return <>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "17px 18px", marginBottom: 18, boxShadow: "0 2px 16px rgba(26,32,80,.06)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", color: C.muted, marginBottom: 10 }}>KARTA · VACCINATION RECORD</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>{data.profile?.fullName}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{data.profile?.birthDate ? `Дата рождения: ${data.profile.birthDate}` : "Добавьте дату рождения в профиле"}</div>
      <div style={{ display: "flex", gap: 24, marginTop: 17 }}><Stat value={history.length} label="ЗАПИСЕЙ" /><Stat value={history.reduce((n, { record }) => n + (record.doseNumber || 1), 0)} label="ДОЗ" /><Stat value={score} label="KARTA SCORE" accent={score === 100 ? "#099268" : "#5C7CFA"} /></div>
    </div>

    <div style={{ background: upcoming.length ? "rgba(255,247,230,.9)" : "rgba(232,250,241,.8)", border: `1px solid ${upcoming.length ? "rgba(217,119,6,.2)" : "rgba(32,201,151,.2)"}`, borderRadius: 16, padding: "13px 14px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: upcoming.length ? 9 : 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Предстоящие прививки</div><div style={{ color: upcoming.length ? "#D97706" : "#0CA678", fontWeight: 700 }}>{upcoming.length}</div></div>
      {upcoming.length === 0 ? <div style={{ fontSize: 11, color: C.muted }}>Предстоящих доз пока нет.</div> : <div style={{ display: "grid", gap: 8 }}>{upcoming.map((task) => <UpcomingTask key={task.key} task={task} today={today} firstDoseDate={records.find((record) => record.vaccineId === task.vaccineId && record.doseNumber === 1)?.dateGiven || ""} />)}</div>}
    </div>

    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Моя история</div>
    {history.length === 0 ? <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>Пока нет записей. Добавьте первую прививку ниже.</div> : history.map(({ record, vaccine }) => {
      const metadata = readVaccinationMetadata(record.notes);
      const custom = isCustomVaccineId(record.vaccineId);
      const title = metadata.name || vaccine?.nameRu || record.vaccineId;
      return <details key={record.id} style={{ marginBottom: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "11px 13px" }}><summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#20C997" }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div><div style={{ fontSize: 10, color: C.muted }}>{metadata.dateString || record.dateGiven || "Дата не указана"} · доза {record.doseNumber}{metadata.totalDoses && metadata.totalDoses > 1 ? `/${metadata.totalDoses}` : ""}{record.brand ? ` · ${record.brand}` : ""}</div></div><span style={{ color: "#5C7CFA", fontSize: 11 }}>Изменить</span></summary><form action={updateVaccination} style={{ display: "grid", gap: 8, marginTop: 10 }}><input type="hidden" name="id" value={record.id} /><select name="vaccineId" defaultValue={custom ? "" : record.vaccineId} style={input}><option value="">Своя прививка</option>{data.vaccines.map((v) => <option value={v.id} key={v.id}>{v.nameRu}</option>)}</select><input name="customName" defaultValue={custom ? title : ""} placeholder="Название своей прививки" style={input} /><input name="dateGiven" type="date" defaultValue={metadata.dateDoneISO || record.dateGiven || ""} style={input} /><input name="nextDue" type="date" defaultValue={metadata.nextDue || ""} style={input} /><input name="doseNumber" type="number" min="1" defaultValue={record.doseNumber} style={input} /><input name="totalDoses" type="number" min="1" max="10" defaultValue={metadata.totalDoses || vaccine?.totalDoses || 1} style={input} /><input name="brand" list="vaccine-brands" defaultValue={record.brand || ""} placeholder="Препарат / бренд" style={input} /><input name="clinic" defaultValue={record.clinic || ""} placeholder="Клиника" style={input} /><textarea name="notes" defaultValue={metadata.userNotes || ""} placeholder="Заметки" rows={2} style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>Сохранить изменения</button></form><form action={deleteVaccination} style={{ marginTop: 7 }}><input type="hidden" name="id" value={record.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 12 }}>Удалить запись</button></form></details>;
    })}
  </>;
}

function Stat({ value, label, accent = C.text }: { value: number; label: string; accent?: string }) {
  return <div><b style={{ fontSize: 22, color: accent }}>{value}</b><small style={{ display: "block", fontSize: 9, color: C.muted }}>{label}</small></div>;
}

function UpcomingTask({ task, today, firstDoseDate }: { task: ReturnType<typeof upcomingVaccineTasks>[number] & { recordId?: string }; today: string; firstDoseDate: string }) {
  const vaccine = taskCatalog.find((item) => item.id === task.vaccineId);
  return <details style={{ background: "rgba(255,255,255,.7)", borderRadius: 12, padding: "10px 11px" }}>
    <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{task.nameRu}</div><div style={{ fontSize: 11, color: task.overdue ? "#E03131" : C.muted }}>{task.overdue ? "Просрочено" : "Запланировано"}: {task.dueDate} · доза {task.doseNumber}/{task.totalDoses}</div></div><span style={{ color: "#5C7CFA", fontSize: 11 }}>Отметить</span></summary>
    <form action={completeUpcomingVaccination} style={{ display: "grid", gap: 7, marginTop: 10 }}>{task.recordId && <input type="hidden" name="id" value={task.recordId} />}<input type="hidden" name="vaccineId" value={task.vaccineId} /><input type="hidden" name="doseNumber" value={task.doseNumber} /><input type="hidden" name="totalDoses" value={task.totalDoses} /><VaccinationDateInput initialDate={today} maxDate={today} doseNumber={task.doseNumber} totalDoses={task.totalDoses} doseScheduleDays={vaccine?.doseScheduleDays} firstDoseDate={firstDoseDate} frequencyType={vaccine?.frequencyType} intervalYears={vaccine?.intervalYears} style={input} /><input name="brand" list="vaccine-brands" placeholder="Препарат / бренд" style={input} /><input name="clinic" placeholder="Клиника" style={input} /><button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>Сохранить выполненную дозу</button></form>
    {task.recordId && <form action={deleteVaccination} style={{ marginTop: 6, textAlign: "right" }}><input type="hidden" name="id" value={task.recordId} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 11 }}>Удалить план</button></form>}
  </details>;
}

function RecommendationsContent({ data, recommendations, region, today }: { data: Awaited<ReturnType<typeof getUserData>>; recommendations: ReturnType<typeof recommendedVaccines>; region: string | undefined; today: string }) {
  const travelAdvisory = tbeRisk(data.profile?.countryCode, data.profile?.regionCurrent) === "low";
  const endemicRegions = [
    { flag: "🇪🇪🇱🇻🇱🇹🇦🇹🇨🇿🇸🇮🇸🇰", title: "Высокий риск", regions: "Эстония, Латвия, Литва, Австрия, Чехия, Словения, Словакия", color: "#EF4444" },
    { flag: "🇩🇪🇨🇭🇸🇪🇫🇮🇵🇱🇭🇺🇭🇷", title: "Умеренный риск", regions: "Германия, Швейцария, Швеция, Финляндия, Польша, Венгрия, Хорватия, Беларусь, Украина", color: "#D97706" },
    { flag: "🇷🇺", title: "Россия (высокий/умеренный риск)", regions: "Урал, Сибирь, Дальний Восток, Поволжье, Северо-Западный регион", color: "#EF4444" },
    { flag: "🇨🇳🇲🇳🇰🇿", title: "Умеренный риск", regions: "Северо-восточный Китай, Монголия, Казахстан", color: "#D97706" },
    { flag: "🇯🇵", title: "Низкий риск", regions: "Япония: только Хоккайдо", color: "#6B7280" },
  ];
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px", marginBottom: 18 }}>
    <div style={{ fontSize: 13, fontWeight: 700 }}>Рекомендовано для вас · {recommendations.length}</div>
    <div style={{ marginTop: 10 }}>
      {!data.profile?.countryCode && <div style={{ padding: 10, background: "rgba(255,247,230,.75)", borderRadius: 10, fontSize: 11, color: "#9A6700", marginBottom: 8 }}>Укажите город в профиле — региональные рекомендации станут точнее.</div>}
      {recommendations.length === 0 ? <div style={{ color: C.muted, fontSize: 12 }}>Все подходящие записи уже добавлены или данных профиля недостаточно.</div> : <div style={{ display: "grid", gap: 8 }}>{recommendations.map((item) => {
        const local = region ? item.regions?.[region] : undefined;
        const pregnancyNote = item.pregnancyRelevant ? item.pregnancyNoteRu : null;
        const tags = item.tags || [];
        const isTravelAdvisory = item.requiresEndemicCheck && travelAdvisory;
        const schedule = local?.scheduleRu || item.scheduleRu || "По назначению врача";
        const note = local?.noteRu || item.noteRu;
        const disclaimer = local?.disclaimerRu || item.disclaimerRu;
        return <details key={item.id} style={{ padding: "10px 11px", borderRadius: 12, background: "rgba(244,246,255,.72)" }}>
          <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{item.nameRu}{tags.length > 0 && <span style={{ display: "block", color: "#5C7CFA", fontSize: 10, fontWeight: 600, marginTop: 3 }}>{tags.map((tag) => tag === "travel" ? "Путешествия" : tag === "pregnancy" ? "Беременность" : tag === "infant_contact" ? "Контакт с младенцами" : tag === "60plus" ? "60+" : tag).join(" · ")}</span>}<span style={{ display: "block", color: C.muted, fontSize: 11, fontWeight: 400, marginTop: 3 }}>{schedule}</span></summary>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45, marginTop: 8 }}>
            {isTravelAdvisory && <div style={{ padding: "7px 9px", marginBottom: 8, borderRadius: 8, color: "#0B7285", background: "rgba(6,182,212,.08)" }}>⌖ Рекомендуется при поездке в эндемичные регионы</div>}
            <b>О вакцине:</b> {item.descriptionRu}<br /><br />
            <b>Кому делать:</b> {local?.whoRu || item.whoRu || "Взрослым по показаниям"}<br /><br />
            <b>Схема вакцинации:</b> {schedule}
            {note && <><br /><br /><b>Важно знать:</b> {note}</>}
            {disclaimer && <><br /><br /><b>Примечание:</b> {disclaimer}</>}
            {pregnancyNote && <><br /><br /><b>Беременность:</b> {pregnancyNote}</>}
            {item.infantContactNoteRu && <><br /><br /><b>Если рядом младенец:</b> {item.infantContactNoteRu}</>}
            {item.requiresEndemicCheck && <div style={{ marginTop: 12, padding: "10px 11px", borderRadius: 11, background: "rgba(255,255,255,.76)", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Эндемичные регионы</div>
              <div style={{ display: "grid", gap: 8 }}>{endemicRegions.map((entry) => <div key={entry.title + entry.flag} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span style={{ width: 29, flexShrink: 0 }}>{entry.flag}</span><div><b style={{ display: "block", color: entry.color }}>{entry.title}</b>{entry.regions}</div></div>)}</div>
            </div>}
            <form action={addVaccination} style={{ display: "grid", gap: 7, marginTop: 10 }}><input type="hidden" name="vaccineId" value={item.id} /><VaccinationDateInput initialDate={today} maxDate={today} doseNumber={1} totalDoses={item.totalDoses} doseScheduleDays={item.doseScheduleDays} frequencyType={item.frequencyType} intervalYears={item.intervalYears} style={input} /><input name="brand" list="vaccine-brands" placeholder="Препарат / бренд" style={input} /><input name="clinic" placeholder="Клиника" style={input} /><button type="submit" style={{ border: 0, borderRadius: 9, padding: "9px 10px", background: "#5C7CFA", color: "white", fontSize: 12, fontWeight: 700 }}>Сохранить выполненную дозу</button></form>
          </div>
        </details>;
      })}</div>}
    </div>
  </div>;
}
