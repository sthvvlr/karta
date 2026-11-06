import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, TestTube2 } from "lucide-react";
import { cookies } from "next/headers";
import { LabResultSheet } from "@/app/LabResultSheet";
import { LabResultsList } from "@/app/LabResultsList";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { labResults, medications, profiles } from "@/db/schema";
import rules from "@/app/monitoring_rules.json";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.76)", border: "rgba(255,255,255,.92)", primary: "#5C7CFA" };
export default async function LabsPage({ searchParams }: { searchParams: Promise<{ monitoringMedicationId?: string; monitoringRuleId?: string }> }) {
  const cookieStore = await cookies();
  const en = cookieStore.get("karta_lang")?.value === "en";
  const user = await getChatGPTUser();
  if (!user) redirect(`/login?return_to=${encodeURIComponent("/labs")}`);
  const params = await searchParams;
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

  return <div style={{ padding: "0 16px", color: C.text }}>
    <header style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, paddingBottom: 12 }}>
      <Link href="/" aria-label={en ? "Back" : "Назад"} style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", background: C.card, color: C.text, textDecoration: "none" }}><ChevronLeft size={18} /></Link>
      <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 22, fontWeight: 700 }}>{en ? "Lab tests" : "Анализы"}</div><div style={{ fontSize: 12, color: C.muted }}>{en ? "Your indicators over time" : "Ваши показатели в динамике"}</div></div>
      <LabResultSheet gender={profile?.gender} prefillTitle={monitoringPrefill?.title} prefillTests={monitoringPrefill?.tests} monitoringMedicationId={monitoringPrefill?.medicationId} monitoringRuleId={monitoringPrefill?.ruleId} initiallyOpen={!!monitoringPrefill} />
    </header>

    {rows.length === 0 ? <div style={{ display: "grid", justifyItems: "center", textAlign: "center", padding: "44px 12px 30px" }}>
      <TestTube2 size={40} color={C.primary} style={{ opacity: .35 }} />
      <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700 }}>{en ? "No lab results yet" : "Пока нет анализов"}</div>
      <div style={{ marginTop: 6, maxWidth: 280, fontSize: 13, lineHeight: 1.45, color: C.muted }}>{en ? "Add a result and enter your values — out-of-range values will be flagged." : "Загрузите результат и внесите показатели — система отметит отклонения от нормы."}</div>
      <LabResultSheet primary gender={profile?.gender} prefillTitle={monitoringPrefill?.title} prefillTests={monitoringPrefill?.tests} monitoringMedicationId={monitoringPrefill?.medicationId} monitoringRuleId={monitoringPrefill?.ruleId} />
    </div> : <LabResultsList rows={rows} gender={profile?.gender} />}
  </div>;
}
