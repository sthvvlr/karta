import { CityPicker } from "@/app/CityPicker";
import { saveProfile } from "@/app/actions";

const input = { width: "100%", padding: "12px 13px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" } as const;

export function OnboardingCard({ name, birthDate, gender, city, region, country, countryCode }: { name: string; birthDate?: string | null; gender?: string | null; city?: string | null; region?: string | null; country?: string | null; countryCode?: string | null }) {
  return <details open={!birthDate || !city} style={{ background: "rgba(255,255,255,.86)", border: "1px solid rgba(116,143,255,.22)", borderRadius: 20, padding: "16px 17px", marginBottom: 14, boxShadow: "0 5px 22px rgba(92,124,250,.09)" }}>
    <summary style={{ cursor: "pointer", listStyle: "none" }}><div style={{ fontSize: 10, letterSpacing: ".12em", color: "#5C7CFA", fontWeight: 800 }}>KARTA · НАСТРОЙКА ПРОФИЛЯ</div><div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>Давайте настроим вашу карту</div><div style={{ fontSize: 12, color: "rgba(26,32,80,.52)", marginTop: 4 }}>Это займёт около минуты и улучшит рекомендации по прививкам.</div></summary>
    <form action={saveProfile} style={{ display: "grid", gap: 10, marginTop: 14 }}>
      <label style={{ fontSize: 12, color: "rgba(26,32,80,.58)" }}>Имя<input name="fullName" defaultValue={name} required style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: "rgba(26,32,80,.58)" }}>Дата рождения<input name="birthDate" type="date" defaultValue={birthDate || ""} required style={{ ...input, marginTop: 5 }} /></label>
      <label style={{ fontSize: 12, color: "rgba(26,32,80,.58)" }}>Пол<select name="gender" defaultValue={gender || ""} style={{ ...input, marginTop: 5 }}><option value="">Не указан</option><option value="female">Женский</option><option value="male">Мужской</option><option value="other">Другой</option></select></label>
      <label style={{ fontSize: 12, color: "rgba(26,32,80,.58)" }}>Текущий город<CityPicker initialCity={city || ""} initialRegion={region || ""} initialCountry={country || ""} initialCountryCode={countryCode || ""} /></label>
      <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>Продолжить</button>
    </form>
  </details>;
}
