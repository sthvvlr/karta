import { addVaccination, deleteVaccination } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 14, color: "#1A2050" } as const;

export default async function VaccinationsPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите через ChatGPT, чтобы открыть карту.</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12 }}>Прививки</div><div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Паспорт вакцинации · {data.vaccinations.length} записей</div>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "17px 18px", marginBottom: 20, boxShadow: "0 2px 16px rgba(26,32,80,0.06)" }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", color: C.muted, marginBottom: 10 }}>KARTA · VACCINATION RECORD</div><div style={{ fontSize: 17, fontWeight: 700 }}>{data.profile?.fullName || user.displayName}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{data.profile?.birthDate ? `Дата рождения: ${data.profile.birthDate}` : "Добавьте дату рождения в профиле"}</div><div style={{ display: "flex", gap: 24, marginTop: 17 }}><div><b style={{ fontSize: 22 }}>{data.vaccinations.length}</b><small style={{ display: "block", fontSize: 9, color: C.muted }}>ЗАПИСЕЙ</small></div><div><b style={{ fontSize: 22 }}>{data.vaccinations.reduce((n, x) => n + (x.record.doseNumber || 1), 0)}</b><small style={{ display: "block", fontSize: 9, color: C.muted }}>ДОЗ</small></div></div></div>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Моя история</div>
    {data.vaccinations.length === 0 ? <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>Пока нет записей. Добавьте первую прививку ниже.</div> : data.vaccinations.map(({ record, vaccine }) => <div key={record.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginBottom: 5, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#20C997" }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{vaccine?.nameRu || record.vaccineId}</div><div style={{ fontSize: 10, color: C.muted }}>{record.dateGiven || "Дата не указана"} · доза {record.doseNumber}{record.brand ? ` · ${record.brand}` : ""}</div></div><form action={deleteVaccination}><input type="hidden" name="id" value={record.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 12 }}>Удалить</button></form></div>)}
    <details style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Добавить прививку</summary><form action={addVaccination} style={{ display: "grid", gap: 9, marginTop: 13 }}><select name="vaccineId" required style={input} defaultValue=""><option value="" disabled>Выберите вакцину</option>{data.vaccines.map((v) => <option value={v.id} key={v.id}>{v.nameRu}</option>)}</select><input name="dateGiven" type="date" style={input} /><input name="brand" placeholder="Препарат / бренд (необязательно)" style={input} /><input name="clinic" placeholder="Клиника (необязательно)" style={input} /><button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Сохранить запись</button></form></details>
  </div>;
}
