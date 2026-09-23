import { CityPicker } from "@/app/CityPicker";
import { saveProfile } from "@/app/actions";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";

export const dynamic = "force-dynamic";

const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "12px 13px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;

export default async function ProfilePage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите через ChatGPT, чтобы открыть профиль.</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const profile = data.profile;
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12, marginBottom: 4 }}>Профиль</div>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Личные данные и региональные рекомендации</div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 10 }}>🌿</div><div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.fullName || user.displayName}</div><div style={{ fontSize: 12, color: C.muted }}>{user.email}</div></div>
    <form action={saveProfile} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, display: "grid", gap: 12 }}>
      <label style={{ fontSize: 12, color: C.muted }}>Имя<input name="fullName" defaultValue={profile?.fullName || user.displayName} style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: C.muted }}>Дата рождения<input name="birthDate" type="date" defaultValue={profile?.birthDate || ""} style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: C.muted }}>Пол<select name="gender" defaultValue={profile?.gender || ""} style={{ ...input, marginTop: 5 }}><option value="">Не указан</option><option value="female">Женский</option><option value="male">Мужской</option><option value="other">Другой</option></select></label>
      <label style={{ fontSize: 12, color: C.muted }}>Город проживания<CityPicker initialCity={profile?.cityCurrent || ""} initialRegion={profile?.regionCurrent || ""} initialCountry={profile?.countryCurrent || ""} /></label>
      <div style={{ fontSize: 12, lineHeight: 1.45, color: C.muted }}>Выберите город из подсказок — Karta сохранит регион и сможет учитывать местные рекомендации по прививкам.</div>
      <button type="submit" style={{ marginTop: 2, padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Сохранить профиль</button>
    </form>
  </div>;
}
