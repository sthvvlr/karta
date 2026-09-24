import { CityPicker } from "@/app/CityPicker";
import { ReminderSettings } from "@/app/ReminderSettings";
import { addProfileLocation, changePassword, deleteAccountData, deleteProfileLocation, saveProfile, setCurrentProfileLocation, signOutAccount } from "@/app/actions";
import { getChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { getDb } from "@/db";
import { profileLocations } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
const C = { text: "#1A2050", muted: "rgba(26,32,80,0.42)", card: "rgba(255,255,255,0.72)", border: "rgba(255,255,255,0.9)" };
const input = { width: "100%", padding: "12px 13px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;

export default async function ProfilePage() {
  const user = await getChatGPTUser();
  if (!user) return <div style={{ padding: 24, color: C.text }}>Войдите в Karta, чтобы открыть профиль.</div>;
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const locations = await getDb().select().from(profileLocations).where(eq(profileLocations.userId, user.userId)).orderBy(asc(profileLocations.isCurrent), asc(profileLocations.fromYear));
  const profile = data.profile;
  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <div style={{ fontSize: 24, fontWeight: 700, paddingTop: 12, marginBottom: 4 }}>Профиль</div><div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Личные данные, регионы и настройки</div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 10 }}>{(profile?.fullName || user.displayName)[0]?.toUpperCase() || "K"}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.fullName || user.displayName}</div><div style={{ fontSize: 12, color: C.muted }}>{user.email}</div></div>
    <form action={saveProfile} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, display: "grid", gap: 12 }}>
      <label style={{ fontSize: 12, color: C.muted }}>Имя<input name="fullName" defaultValue={profile?.fullName || user.displayName} style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: C.muted }}>Дата рождения<input name="birthDate" type="date" defaultValue={profile?.birthDate || ""} style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: C.muted }}>Пол<select name="gender" defaultValue={profile?.gender || ""} style={{ ...input, marginTop: 5 }}><option value="">Не указан</option><option value="female">Женский</option><option value="male">Мужской</option><option value="other">Другой</option></select></label>
      <label style={{ fontSize: 12, color: C.muted }}>Текущий город<CityPicker initialCity={profile?.cityCurrent || ""} initialRegion={profile?.regionCurrent || ""} initialCountry={profile?.countryCurrent || ""} initialCountryCode={profile?.countryCode || ""} /></label>
      <div style={{ fontSize: 12, lineHeight: 1.45, color: C.muted }}>Регион влияет на каталог и рекомендации по прививкам.</div>
      <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Сохранить профиль</button>
    </form>

    <details style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px" }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🗺 История городов</summary><div style={{ marginTop: 10, display: "grid", gap: 8 }}>
      {locations.length === 0 ? <div style={{ color: C.muted, fontSize: 12 }}>Добавьте города, где жили раньше, чтобы учитывать региональные риски.</div> : locations.map((location) => <div key={location.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", background: "rgba(244,246,255,.7)", borderRadius: 10 }}><div style={{ flex: 1, fontSize: 12 }}><b>{location.city}</b>{location.isCurrent && <span style={{ color: "#20C997", marginLeft: 5 }}>текущий</span>}<div style={{ color: C.muted, fontSize: 10 }}>{[location.region, location.country].filter(Boolean).join(" · ")}{location.fromYear || location.toYear ? ` · ${location.fromYear || "?"}–${location.toYear || "сейчас"}` : ""}</div></div>{!location.isCurrent && <form action={setCurrentProfileLocation}><input type="hidden" name="id" value={location.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#5C7CFA", fontSize: 11 }}>Сделать текущим</button></form>}<form action={deleteProfileLocation}><input type="hidden" name="id" value={location.id} /><button type="submit" style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 11 }}>Удалить</button></form></div>)}
      <form action={addProfileLocation} style={{ display: "grid", gap: 8, marginTop: 5 }}><CityPicker fieldPrefix="historyCity" /><div style={{ display: "flex", gap: 8 }}><input name="fromYear" type="number" min="1900" max="2100" placeholder="С какого года" style={{ ...input, flex: 1 }} /><input name="toYear" type="number" min="1900" max="2100" placeholder="По какой год" style={{ ...input, flex: 1 }} /></div><button type="submit" style={{ padding: 10, border: "1px solid #DCE3FF", borderRadius: 10, background: "white", color: "#5C7CFA", fontWeight: 700 }}>Добавить город</button></form>
    </div></details>
    <ReminderSettings initialEnabled={profile?.remindersEnabled ?? true} initialMorning={profile?.remindersMorning || "08:00"} initialEvening={profile?.remindersEvening || "21:00"} />
    <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "13px 14px", marginBottom: 12 }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>⚙ Аккаунт</summary><div style={{ display: "grid", gap: 8, marginTop: 12 }}><a href={chatGPTSignOutPath("/")} style={{ padding: 10, borderRadius: 10, background: "white", color: "#C92A2A", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>Выйти через ChatGPT</a><form action={signOutAccount}><button type="submit" style={{ width: "100%", padding: 10, borderRadius: 10, background: "white", border: "1px solid #FFD8D8", color: "#C92A2A", fontWeight: 700 }}>Выйти из email-аккаунта</button></form>{user.userId.startsWith("email:") && <form action={changePassword} style={{ display: "grid", gap: 7, padding: "8px 0" }}><label style={{ fontSize: 12, color: C.muted }}>Изменить пароль<input name="newPassword" type="password" minLength={6} required placeholder="Новый пароль, минимум 6 символов" style={{ ...input, marginTop: 5 }} /></label><button type="submit" style={{ padding: 10, border: "1px solid #DCE3FF", borderRadius: 10, background: "white", color: "#5C7CFA", fontWeight: 700 }}>Сохранить новый пароль</button></form>}<form action={deleteAccountData}><button type="submit" style={{ width: "100%", padding: 10, borderRadius: 10, background: "#FFF5F5", border: "1px solid #FFD8D8", color: "#C92A2A", fontWeight: 700 }}>Удалить данные Karta</button><div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>Удалит карту, лекарства, прививки и анализы из базы. Аккаунт ChatGPT не удаляется.</div></form></div></details>
  </div>;
}
