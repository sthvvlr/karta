import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Pill, Syringe } from "lucide-react";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { PdfExportControls } from "@/app/PdfExportControls";
import medicationCatalog from "@/app/medications_ru.json";
import { birthDateDisplayValue } from "@/app/profile-dates";
import { displayVaccinationDate, readVaccinationMetadata } from "@/app/vaccination-record";

export const dynamic = "force-dynamic";

const ink = "#1A2050";
const muted = "rgba(26,32,80,.48)";
const line = "rgba(26,32,80,.09)";

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ lang?: string; scope?: string }> }) {
  const params = await searchParams;
  const preferredLanguage = (await cookies()).get("karta_lang")?.value;
  const lang = params.lang === "en" || params.lang === "ru"
    ? params.lang
    : preferredLanguage === "en" ? "en" : "ru";
  const scope = params.scope === "vaccinations" || params.scope === "medications" ? params.scope : "full";
  const en = lang === "en";
  const user = await getChatGPTUser();
  const exportPath = `/export?${new URLSearchParams({ lang, scope }).toString()}`;
  if (!user) redirect(`/login?return_to=${encodeURIComponent(exportPath)}`);
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const activeMeds = data.medications.filter((med) => med.isActive);
  const generated = new Date().toLocaleDateString(en ? "en-US" : "ru-RU", { dateStyle: "long" });

  return <div className="print-page" style={{ maxWidth: 760, margin: "0 auto", padding: "24px 18px 56px", color: ink, fontFamily: "KartaPDF, Arial, sans-serif" }}>
    <div className="no-print" style={{ marginBottom: 16 }}><Link href="/" style={{ color: "#5C7CFA", textDecoration: "none", fontSize: 14 }}>{en ? "← Back to Karta" : "← Вернуться в Karta"}</Link></div>
    <PdfExportControls lang={lang} scope={scope} />

    <header className="passport-header" style={{ position: "relative", display: "flex", alignItems: "center", height: 92, margin: "0 -18px", padding: "0 36px", overflow: "hidden", color: "white", background: "linear-gradient(112deg,#5C7CFA 0%,#748FFC 55%,#74C0FC 100%)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/karta-icon.png" alt="Karta" width={42} height={42} style={{ borderRadius: 9, flex: "none" }} />
      <div style={{ marginLeft: 10, fontSize: 24, fontWeight: 700, letterSpacing: -.5 }}>Karta</div>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 600, letterSpacing: 2.1, whiteSpace: "nowrap" }}>{en ? "HEALTH PASSPORT" : "ПАСПОРТ ЗДОРОВЬЯ"}</div>
      <div aria-hidden="true" style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -30, left: "42%" }} />
      <div aria-hidden="true" style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: 20, left: "55%" }} />
    </header>

    <section className="passport-profile print-card" style={{ position: "relative", minHeight: 64, margin: "16px 0 18px", padding: "12px 14px", border: `1px solid ${line}`, borderRadius: 10, background: "#F4F6FF" }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{data.profile?.fullName || user.displayName || (en ? "Name not set" : "Имя не указано")}</div>
      <div style={{ maxWidth: "78%", marginTop: 5, color: muted, fontSize: 11 }}>{[birthDateDisplayValue(data.profile?.birthDate), data.profile?.cityCurrent].filter(Boolean).join("  ·  ") || (en ? "Location not set" : "Город не указан")}</div>
      <div style={{ position: "absolute", right: 14, bottom: 9, color: muted, fontSize: 9 }}>{en ? "Generated" : "Выгружено"} {generated}</div>
    </section>

    {scope !== "vaccinations" && <section className="passport-section print-card">
      <div className="passport-section-title" style={{ background: "rgba(139,92,246,.10)", borderColor: "rgba(139,92,246,.18)" }}><Pill size={14} color="#8B5CF6" />{en ? "CURRENT MEDICATIONS" : "ПРИНИМАЕМЫЕ ЛЕКАРСТВА"}</div>
      {activeMeds.length ? activeMeds.map((med) => {
        const entry = (medicationCatalog as Array<{ id: string; ru: string; en: string }>).find((item) => item.id === med.drugCode || item.ru === med.name);
        const name = en && entry?.en ? entry.en.charAt(0).toLocaleUpperCase("en-US") + entry.en.slice(1) : med.name;
        const frequency = med.frequency === "weekly" ? (en ? "weekly" : "еженедельно") : med.frequency === "as_needed" ? (en ? "as needed" : "по необходимости") : (en ? "daily" : "ежедневно");
        return <div key={med.id} className="passport-med-row" style={{ display: "flex", alignItems: "baseline", gap: 12, minHeight: 26, padding: "5px 0 4px", borderBottom: `1px solid ${line}` }}><span aria-hidden="true" style={{ width: 18, flex: "none", color: "rgba(92,124,250,.55)", textAlign: "center" }}>•</span><span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600 }}>{name}</span><span style={{ color: muted, fontSize: 10, textAlign: "right" }}>{[med.dosage, frequency].filter(Boolean).join(" · ")}</span></div>;
      }) : <div className="passport-empty">{en ? "No medication records" : "Нет записей о лекарствах"}</div>}
    </section>}

    {scope !== "medications" && <section className="passport-section print-card" style={{ marginTop: 8 }}>
      <div className="passport-section-title" style={{ background: "rgba(92,124,250,.10)", borderColor: "rgba(92,124,250,.18)" }}><Syringe size={14} color="#5C7CFA" />{en ? "COMPLETED VACCINATIONS" : "СДЕЛАННЫЕ ПРИВИВКИ"}</div>
      {data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming).length ? data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming).map(({ record, vaccine }) => {
        const metadata = readVaccinationMetadata(record.notes);
        const name = en ? vaccine?.nameEn || metadata.name || record.vaccineId : metadata.name || vaccine?.nameRu || record.vaccineId;
        const totalDoses = metadata.totalDoses ?? vaccine?.totalDoses ?? 1;
        const dose = totalDoses > 1 ? (en ? ` (dose ${record.doseNumber} of ${totalDoses})` : ` (доза ${record.doseNumber} из ${totalDoses})`) : "";
        const date = displayVaccinationDate(metadata, record.dateGiven, lang);
        return <div key={record.id} className="passport-vax-row" style={{ display: "flex", alignItems: "flex-start", gap: 8, minHeight: record.brand ? 38 : 26, padding: "4px 0", borderBottom: `1px solid ${line}` }}><span style={{ width: 14, flex: "none", color: "#20C997", fontSize: 14, lineHeight: "18px" }}>✓</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{name}{dose}</span><span style={{ color: muted, fontSize: 11, whiteSpace: "nowrap" }}>{date}</span></div>{record.brand && <div style={{ marginTop: 3, color: "rgba(92,124,250,.7)", fontSize: 10 }}>{record.brand}</div>}</div></div>;
      }) : <div className="passport-empty">{en ? "No vaccination records" : "Нет записей о прививках"}</div>}
    </section>}
    <footer className="passport-footer"><span>Karta</span><span>{en ? "Health passport" : "Паспорт здоровья"}</span></footer>
  </div>;
}
