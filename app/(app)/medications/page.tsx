import { addMedication } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "11px 12px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 14, color: "#1A2050" } as const;

export default async function MedicationsPage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите через ChatGPT, чтобы открыть лекарства.</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12 }}>Лекарства</div><div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Ваш список и напоминания</div>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "15px 17px", marginBottom: 20 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 10 }}><span>Активные препараты</span><span style={{ color: "#5C7CFA" }}>{data.medications.length}</span></div><div style={{ height: 4, background: "rgba(26,32,80,0.07)", borderRadius: 2 }}><div style={{ height: "100%", width: data.medications.length ? "100%" : "0%", background: "linear-gradient(90deg,#748FFC,#74C0FC)", borderRadius: 2 }} /></div></div>
    {data.medications.length === 0 ? <div style={{ color: C.muted, fontSize: 13, padding: "14px 0" }}>Пока нет лекарств. Добавьте препарат, чтобы хранить схему приёма в базе.</div> : data.medications.map((m) => <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginBottom: 5, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D0BFFF" }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 10, color: C.muted }}>{[m.dosage, m.frequency, m.mealRelation].filter(Boolean).join(" · ") || "Схема не указана"}</div></div><span style={{ fontSize: 10, color: "#0CA678" }}>Активно</span></div>)}
    <details style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Добавить лекарство</summary><form action={addMedication} style={{ display: "grid", gap: 9, marginTop: 13 }}><input name="name" required placeholder="Название препарата" style={input} /><input name="dosage" placeholder="Дозировка, например 10 мг" style={input} /><input name="frequency" placeholder="Как часто, например 1 раз в день" style={input} /><input name="time" type="time" style={input} /><select name="mealRelation" style={input} defaultValue=""><option value="">Связь с едой не указана</option><option value="before">До еды</option><option value="during">С едой</option><option value="after">После еды</option></select><button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Сохранить препарат</button></form></details>
  </div>;
}
