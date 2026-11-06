"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock3, Map, MapPin, Bell, Pencil, PersonStanding, Settings, Trash2, UserRound, X } from "lucide-react";
import { CityPicker } from "@/app/CityPicker";
import { DeleteDataForm } from "@/app/DeleteDataForm";
import { addProfileLocation, changePassword, deleteProfileLocation, saveProfile, saveReminderSettings, setCurrentProfileLocation, signOutAccount, updateProfileLocation } from "@/app/actions";
import { birthDateInputValue } from "@/app/profile-dates";

type Profile = {
  fullName: string | null; birthDate: string | null; gender: string | null;
  cityCurrent: string | null; regionCurrent: string | null; countryCurrent: string | null; countryCode: string | null;
  remindersEnabled: boolean; remindersMorning: string; remindersEvening: string;
};
type Location = { id: string; city: string; country: string | null; region: string | null; fromDate: string | null; toDate: string | null; fromYear: number | null; toYear: number | null; isCurrent: boolean };

const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.72)", border: "rgba(255,255,255,.9)", primary: "#5C7CFA" };
const field = { width: "100%", padding: "12px 13px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: C.text } as const;

export function ProfileScreen({ profile, locations, displayName, email, userId, chatSignOutUrl, en = false }: { profile: Profile; locations: Location[]; displayName: string; email: string; userId: string; chatSignOutUrl: string; en?: boolean }) {
  const [sheet, setSheet] = useState<"edit" | "cities" | "reminders" | "account" | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const name = profile.fullName || displayName || "Karta";
  const gender = profile.gender === "female" ? (en ? "Female" : "Женский") : profile.gender === "male" ? (en ? "Male" : "Мужской") : profile.gender === "other" ? (en ? "Other" : "Другой") : "—";
  const city = [profile.cityCurrent, profile.regionCurrent, profile.countryCurrent].filter(Boolean).join(" · ") || "—";
  const guest = userId.startsWith("guest:");

  return <div style={{ padding: "12px 16px 0", color: C.text }}>
    <header style={{ paddingTop: 16, paddingBottom: 22 }}><h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.2, fontWeight: 700 }}>{en ? "Profile" : "Профиль"}</h1><div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{en ? "Personal info" : "Личные данные"}</div></header>

    {guest && <div style={{ ...cardStyle(16, 14), marginBottom: 20, borderColor: "rgba(92,124,250,.16)" }}><div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Guest mode" : "Гостевой режим"}</div><div style={{ marginTop: 4, color: C.muted, fontSize: 11, lineHeight: 1.4 }}>{en ? "Your data is stored securely and linked to this browser. Create an account to access it on other devices." : "Данные хранятся в базе Karta и связаны с этим браузером. Создайте аккаунт, чтобы открыть их на других устройствах."}</div><div style={{ display: "flex", gap: 8, marginTop: 12 }}><Link href="/register?return_to=%2Fprofile" style={{ ...secondaryButton, flex: 1, boxSizing: "border-box", textAlign: "center", textDecoration: "none" }}>{en ? "Create account" : "Создать аккаунт"}</Link><Link href="/login?return_to=%2Fprofile&guest=1" style={{ ...secondaryButton, flex: 1, boxSizing: "border-box", textAlign: "center", textDecoration: "none" }}>{en ? "Sign in" : "Войти"}</Link></div></div>}

    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", display: "grid", placeItems: "center", fontSize: 30, color: C.text, boxShadow: "0 4px 12px rgba(92,124,250,.15)" }}>{name[0]?.toUpperCase() || "K"}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>{name}</div>
      {email && !guest && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{email}</div>}
    </div>

    <SectionTitle>{en ? "PERSONAL INFO" : "ЛИЧНЫЕ ДАННЫЕ"}</SectionTitle>
    <div style={cardStyle(20, 0)}>
      <InfoRow icon={<UserRound size={15} />} label={en ? "Name" : "Имя"} value={name} />
      <Divider />
      <InfoRow icon={<CalendarDays size={15} />} label={en ? "Date of birth" : "Дата рождения"} value={profile.birthDate ? displayBirth(profile.birthDate) : "—"} />
      <Divider />
      <InfoRow icon={<PersonStanding size={16} />} label={en ? "Gender" : "Пол"} value={gender} />
      <Divider />
      <InfoRow icon={<MapPin size={15} />} label={en ? "City" : "Город"} value={city} />
    </div>

    <SectionTitle style={{ marginTop: 22 }}>{en ? "SETTINGS" : "НАСТРОЙКИ"}</SectionTitle>
    <div style={cardStyle(20, 0)}>
      <ActionRow icon={<Pencil size={14} />} label={en ? "Edit profile" : "Редактировать профиль"} onClick={() => setSheet("edit")} />
      <Divider />
      <ActionRow icon={<Map size={14} />} label={en ? "City history" : "История городов"} color="#20C997" onClick={() => setSheet("cities")} />
      <Divider />
      <ActionRow icon={<Bell size={14} />} label={en ? "Reminders" : "Напоминания"} color="#F59F00" onClick={() => setSheet("reminders")} />
      {userId.startsWith("email:") && <><Divider /><ActionRow icon={<Settings size={14} />} label={en ? "Account settings" : "Настройки аккаунта"} onClick={() => setSheet("account")} /></>}
    </div>

    <div style={{ ...cardStyle(20, 0), marginTop: 14, marginBottom: 32 }}>
      {guest ? <form action={signOutAccount}><button type="submit" style={accountButton}><span style={{ color: "#E03131", width: 28 }}>↪</span><span>{en ? "Exit guest mode" : "Выйти из гостевого режима"}</span></button></form> : <a href={chatSignOutUrl} style={{ ...accountButton, textDecoration: "none", boxSizing: "border-box" }}><span style={{ color: "#E03131", width: 28 }}>↪</span><span>{en ? "Sign out of ChatGPT" : "Выйти через ChatGPT"}</span></a>}
      {userId.startsWith("email:") && <><Divider /><form action={signOutAccount}><button type="submit" style={accountButton}><span style={{ color: "#E03131", width: 28 }}>↪</span><span>{en ? "Sign out of email account" : "Выйти из email-аккаунта"}</span></button></form></>}
      <Divider />
      <div style={{ padding: 14 }}><DeleteDataForm en={en} /></div>
    </div>

    {sheet === "edit" && <Sheet title={en ? "Edit profile" : "Редактировать профиль"} onClose={() => setSheet(null)} en={en}>
      <form action={saveProfile} style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", placeItems: "center", padding: "8px 0 2px" }}><div style={{ width: 80, height: 80, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#BAC8FF,#D0BFFF)", fontSize: 32, boxShadow: "0 4px 14px rgba(92,124,250,.15)" }}>{name[0]?.toUpperCase() || "?"}</div></div>
        <label style={labelStyle}>{en ? "NAME" : "ИМЯ"}<input name="fullName" defaultValue={profile.fullName || displayName} placeholder={en ? "Enter your name" : "Введите имя"} style={{ ...field, marginTop: 6 }} /></label>
        <label style={labelStyle}>{en ? "DATE OF BIRTH" : "ДАТА РОЖДЕНИЯ"}<input name="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={birthDateInputValue(profile.birthDate)} style={{ ...field, marginTop: 6 }} /></label>
        <GenderPicker initial={profile.gender || ""} en={en} />
        <label style={labelStyle}>{en ? "CURRENT CITY" : "ТЕКУЩИЙ ГОРОД"}<CityPicker initialCity={profile.cityCurrent || ""} initialRegion={profile.regionCurrent || ""} initialCountry={profile.countryCurrent || ""} initialCountryCode={profile.countryCode || ""} en={en} /></label>
        <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.45 }}>{en ? "Your region affects the vaccine catalog and recommendations." : "Регион влияет на каталог и рекомендации по прививкам."}</div>
        <button type="submit" style={primaryButton}>{en ? "Save" : "Сохранить"}</button>
      </form>
    </Sheet>}

    {sheet === "cities" && <Sheet title={en ? "City history" : "История городов"} onClose={() => setSheet(null)} en={en} ariaHidden={Boolean(editingLocation)}>
      {locations.length === 0 ? <div style={{ textAlign: "center", padding: "36px 16px", color: C.muted }}><Map size={34} color="#5C7CFA" style={{ opacity: .45, marginBottom: 12 }} /><div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{en ? "No cities yet" : "Нет городов"}</div><p style={{ fontSize: 13, lineHeight: 1.45 }}>{en ? "Add cities where you live or have lived. This affects vaccine recommendations." : "Добавьте города, где вы живёте или жили. Это влияет на рекомендации по прививкам."}</p></div> : <>
        <div style={{ background: "rgba(92,124,250,.06)", borderRadius: 11, padding: 12, color: C.muted, fontSize: 11, lineHeight: 1.45, marginBottom: 8 }}>{en ? "Cities affect regional vaccine recommendations." : "Города влияют на региональные рекомендации по прививкам."}</div>
        {locations.map((location) => <div key={location.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 3px", borderBottom: "1px solid rgba(26,32,80,.08)" }}>
          <div style={{ color: location.isCurrent ? C.primary : C.muted }}>{location.isCurrent ? <MapPin size={19} /> : <Clock3 size={19} />}</div>
          <button type="button" onClick={() => setEditingLocation(location)} aria-label={en ? `Edit ${location.city}` : `Редактировать ${location.city}`} style={{ minWidth: 0, flex: 1, border: 0, padding: 0, background: "transparent", color: "inherit", textAlign: "left" }}><div style={{ fontSize: 14, fontWeight: 600 }}>{location.city}{location.isCurrent && <span style={{ marginLeft: 6, color: "white", background: C.primary, borderRadius: 9, padding: "2px 6px", fontSize: 9 }}>{en ? "current" : "текущий"}</span>}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{[location.region, location.country].filter(Boolean).join(" · ")}<span style={{ display: "block" }}>{locationPeriod(location, en)}</span></div></button>
          <button type="button" onClick={() => setEditingLocation(location)} aria-label={en ? `Edit dates for ${location.city}` : `Изменить даты для города ${location.city}`} style={iconButton}><Pencil size={14} /></button>
          {!location.isCurrent && <form action={setCurrentProfileLocation}><input type="hidden" name="id" value={location.id} /><button type="submit" aria-label={en ? `Set ${location.city} as current city` : `Сделать город ${location.city} текущим`} style={iconButton}><MapPin size={15} /></button></form>}
          <form action={deleteProfileLocation}><input type="hidden" name="id" value={location.id} /><button type="submit" aria-label={en ? `Delete city ${location.city}` : `Удалить город ${location.city}`} style={{ ...iconButton, color: "#E03131" }}><Trash2 size={15} /></button></form>
        </div>)}
      </>}
      <form action={addProfileLocation} style={{ display: "grid", gap: 10, marginTop: 16 }}><div style={labelStyle}>{en ? "ADD CITY" : "ДОБАВИТЬ ГОРОД"}<CityPicker fieldPrefix="historyCity" en={en} requireSelection /></div><button type="submit" style={secondaryButton}>{en ? "Add city" : "Добавить город"}</button></form>
    </Sheet>}

    {sheet === "cities" && editingLocation && <Sheet title={en ? "Edit city" : "Редактировать город"} onClose={() => setEditingLocation(null)} en={en} zIndex={130}>
      <div style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>{editingLocation.city}</div>
      <form action={async (formData) => { await updateProfileLocation(formData); setEditingLocation(null); }} style={{ display: "grid", gap: 13 }}>
        <input type="hidden" name="id" value={editingLocation.id} />
        {(editingLocation.fromYear || editingLocation.toYear) && <div style={{ padding: 10, borderRadius: 10, background: "rgba(92,124,250,.06)", color: C.muted, fontSize: 12 }}>{en ? `Existing year range: ${editingLocation.fromYear || "?"}–${editingLocation.toYear || "now"}` : `Сохранённый период по годам: ${editingLocation.fromYear || "?"}–${editingLocation.toYear || "сейчас"}`}</div>}
        <label style={labelStyle}>{en ? "START DATE (OPTIONAL)" : "ДАТА НАЧАЛА (НЕОБЯЗАТЕЛЬНО)"}<input type="date" name="fromDate" defaultValue={editingLocation.fromDate || ""} max={localToday()} style={{ ...field, marginTop: 6 }} /></label>
        {!editingLocation.isCurrent && <label style={labelStyle}>{en ? "END DATE (OPTIONAL)" : "ДАТА ОКОНЧАНИЯ (НЕОБЯЗАТЕЛЬНО)"}<input type="date" name="toDate" defaultValue={editingLocation.toDate || ""} min={editingLocation.fromDate || undefined} max={localToday()} style={{ ...field, marginTop: 6 }} /></label>}
        <button type="submit" style={primaryButton}>{en ? "Save dates" : "Сохранить даты"}</button>
      </form>
      {!editingLocation.isCurrent && <form action={async (formData) => { await setCurrentProfileLocation(formData); setEditingLocation(null); }} style={{ marginTop: 9 }}><input type="hidden" name="id" value={editingLocation.id} /><button type="submit" style={secondaryButton}>{en ? "Set as current city" : "Сделать текущим городом"}</button></form>}
    </Sheet>}

    {sheet === "reminders" && <Sheet title={en ? "Reminders" : "Напоминания"} onClose={() => setSheet(null)} en={en}>
      <ReminderForm enabled={profile.remindersEnabled} morning={profile.remindersMorning} evening={profile.remindersEvening} en={en} />
    </Sheet>}

    {sheet === "account" && <Sheet title={en ? "Account settings" : "Настройки аккаунта"} onClose={() => setSheet(null)} en={en}>
      <form action={changePassword} style={{ display: "grid", gap: 10 }}><label style={labelStyle}>{en ? "CHANGE PASSWORD" : "ИЗМЕНИТЬ ПАРОЛЬ"}<input name="newPassword" type="password" minLength={6} required placeholder={en ? "New password, at least 6 characters" : "Новый пароль, минимум 6 символов"} style={{ ...field, marginTop: 6 }} /></label><button type="submit" style={primaryButton}>{en ? "Save new password" : "Сохранить новый пароль"}</button></form>
    </Sheet>}
  </div>;
}

function displayBirth(value: string) {
  const iso = birthDateInputValue(value);
  if (!iso) return value;
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function localToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function locationPeriod(location: Location, en: boolean) {
  const locale = en ? "en-US" : "ru-RU";
  const format = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(locale, { month: "short", year: "numeric" });
  const from = location.fromDate ? format(location.fromDate) : location.fromYear ? String(location.fromYear) : "";
  const to = location.toDate ? format(location.toDate) : location.toYear ? String(location.toYear) : "";
  if (location.isCurrent) return from ? (en ? `since ${from}` : `с ${from}`) : (en ? "Current city" : "Текущий город");
  if (from && to) return `${from} — ${to}`;
  if (from) return en ? `from ${from}` : `с ${from}`;
  if (to) return en ? `until ${to}` : `по ${to}`;
  return en ? "Past city" : "Прошлый город";
}

function Sheet({ title, onClose, children, en, zIndex = 120, ariaHidden = false }: { title: string; onClose: () => void; children: ReactNode; en: boolean; zIndex?: number; ariaHidden?: boolean }) {
  return <div role="presentation" aria-hidden={ariaHidden || undefined} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
    <section role="dialog" aria-modal="true" aria-label={title} style={{ width: "min(100%, 430px)", maxHeight: "91dvh", overflow: "auto", padding: "10px 20px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><span style={{ width: 34 }} /><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2><button type="button" onClick={onClose} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: C.text }}><X size={18} /></button></div>
      {children}
    </section>
  </div>;
}

function GenderPicker({ initial, en }: { initial: string; en: boolean }) {
  const [gender, setGender] = useState(initial);
  const choices = [["female", en ? "Female" : "Женский"], ["male", en ? "Male" : "Мужской"], ["other", en ? "Other" : "Другой"]];
  return <div style={labelStyle}>{en ? "GENDER" : "ПОЛ"}<input type="hidden" name="gender" value={gender} /><div style={{ display: "flex", gap: 8, marginTop: 6 }}>{choices.map(([value, label]) => <button key={value} type="button" onClick={() => setGender(gender === value ? "" : value)} style={{ flex: 1, padding: "11px 5px", borderRadius: 12, border: `1px solid ${gender === value ? C.primary : "rgba(186,200,255,.55)"}`, background: gender === value ? "rgba(92,124,250,.08)" : "#F4F6FF", color: gender === value ? C.primary : C.muted, fontWeight: 600, fontSize: 12 }}>{label}</button>)}</div></div>;
}

function ReminderForm({ enabled: initialEnabled, morning: initialMorning, evening: initialEvening, en }: { enabled: boolean; morning: string; evening: string; en: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  return <form action={saveReminderSettings} style={{ display: "grid", gap: 14 }}>
    <input type="hidden" name="enabled" value={String(enabled)} />
    <div style={{ ...cardStyle(15, 14), display: "flex", alignItems: "center", gap: 11 }}><Bell size={18} color={C.primary} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{en ? "Medication reminders" : "Напоминания о лекарствах"}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{en ? "Daily notifications" : "Ежедневные уведомления"}</div></div><button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)} style={{ width: 46, height: 28, border: 0, borderRadius: 20, padding: 3, background: enabled ? C.primary : "#C9CEDD", transition: "background .16s" }}><span style={{ display: "block", width: 22, height: 22, borderRadius: "50%", background: "white", transform: enabled ? "translateX(18px)" : "translateX(0)", transition: "transform .16s" }} /></button></div>
    {enabled && <>
      <label style={labelStyle}>{en ? "MORNING REMINDER" : "УТРЕННЕЕ НАПОМИНАНИЕ"}<input type="time" name="morning" defaultValue={initialMorning} style={{ ...field, marginTop: 6 }} /></label>
      <label style={labelStyle}>{en ? "EVENING REMINDER" : "ВЕЧЕРНЕЕ НАПОМИНАНИЕ"}<input type="time" name="evening" defaultValue={initialEvening} style={{ ...field, marginTop: 6 }} /></label>
    </>}
    {!enabled && <><input type="hidden" name="morning" value={initialMorning} /><input type="hidden" name="evening" value={initialEvening} /></>}
    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{en ? "Push notifications will be added in a future version." : "Push-уведомления будут добавлены в следующей версии."}</div>
    <button type="submit" style={primaryButton}>{en ? "Done" : "Готово"}</button>
  </form>;
}

function SectionTitle({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) { return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: C.muted, padding: "0 4px 8px", ...style }}>{children}</div>; }
function Divider() { return <div style={{ height: 1, background: "rgba(26,32,80,.08)", marginLeft: 44 }} />; }
function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, minHeight: 54 }}><span style={{ width: 28, color: C.muted, display: "grid", placeItems: "center" }}>{icon}</span><span style={{ fontSize: 13, color: C.muted }}>{label}</span><span style={{ marginLeft: "auto", maxWidth: "52%", textAlign: "right", fontSize: 13, fontWeight: 600, color: C.text, overflowWrap: "anywhere" }}>{value}</span></div>; }
function ActionRow({ icon, label, color = C.primary, onClick }: { icon: ReactNode; label: string; color?: string; onClick: () => void }) { return <button type="button" onClick={onClick} style={{ width: "100%", border: 0, background: "transparent", display: "flex", alignItems: "center", gap: 12, padding: 14, textAlign: "left" }}><span style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 8, background: `${color}1F`, color }}>{icon}</span><span style={{ flex: 1, color: C.text, fontSize: 14, fontWeight: 600 }}>{label}</span><ChevronRight size={15} color="rgba(26,32,80,.32)" /></button>; }
function cardStyle(radius: number, padding: number): React.CSSProperties { return { background: C.card, border: `1px solid ${C.border}`, borderRadius: radius, padding, boxShadow: "0 2px 12px rgba(26,32,80,.035)" }; }
const labelStyle: React.CSSProperties = { display: "block", color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: ".06em" };
const primaryButton: React.CSSProperties = { width: "100%", border: 0, borderRadius: 12, padding: 13, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 14, fontWeight: 700 };
const secondaryButton: React.CSSProperties = { width: "100%", border: "1px solid #DCE3FF", borderRadius: 11, padding: 12, background: "white", color: C.primary, fontSize: 13, fontWeight: 700 };
const accountButton: React.CSSProperties = { width: "100%", border: 0, background: "transparent", display: "flex", alignItems: "center", gap: 8, padding: 15, textAlign: "left", fontSize: 14, fontWeight: 600, color: "#E03131" };
const iconButton: React.CSSProperties = { width: 32, height: 32, border: 0, borderRadius: 10, background: "rgba(92,124,250,.08)", color: C.primary, display: "grid", placeItems: "center" };
