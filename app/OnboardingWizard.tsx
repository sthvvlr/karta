"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { CityPicker } from "@/app/CityPicker";
import { saveOnboarding } from "@/app/actions";
import { birthDateInputValue } from "@/app/profile-dates";

const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", primary: "#5C7CFA", border: "rgba(255,255,255,.9)" };
const input = { width: "100%", padding: "13px 14px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.45)", borderRadius: 12, fontSize: 16, color: C.text } as const;
export function OnboardingWizard({ initialName, initialBirthDate = "", initialGender = "", initialCity = "", initialRegion = "", initialCountry = "", initialCountryCode = "", guest = false, en = false }: { initialName: string; initialBirthDate?: string | null; initialGender?: string | null; initialCity?: string | null; initialRegion?: string | null; initialCountry?: string | null; initialCountryCode?: string | null; guest?: boolean; en?: boolean }) {
  const steps = en
    ? [["What is your name?", "This is the name shown in the app"], ["A little about you", "Used to personalize your recommendations"], ["Where do you live?", "This affects vaccine recommendations"]]
    : [["Как вас зовут?", "Это ваше имя в приложении"], ["Немного о вас", "Нужно для персональных рекомендаций"], ["Где вы живёте?", "Влияет на рекомендации по прививкам"]];
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [birth, setBirth] = useState(birthDateInputValue(initialBirthDate));
  const [hasBirth, setHasBirth] = useState(Boolean(birthDateInputValue(initialBirthDate)));
  const [gender, setGender] = useState(initialGender || "");
  const [currentCity, setCurrentCity] = useState(initialCity || "");
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function advance() {
    if (step === 0 && name.trim().length < 2) return;
    if (step === 2 && !currentCity) return;
    setStep((current) => Math.min(2, current + 1));
  }

  return <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "max(22px, env(safe-area-inset-top)) 20px max(22px, env(safe-area-inset-bottom))", color: C.text }}>
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto" }}>
      {guest && <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><Link href="/login?return_to=%2Fonboarding&guest=1" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, background: "rgba(92,124,250,.08)", color: C.primary, fontSize: 12, fontWeight: 600, textDecoration: "none" }}><UserRound size={14} aria-hidden="true" />{en ? "Sign in" : "Войти в аккаунт"}</Link></div>}
      <div aria-label={en ? `Step ${step + 1} of 3` : `Шаг ${step + 1} из 3`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
        {steps.map((_, index) => <div key={index} style={{ width: index === step ? 22 : 6, height: 6, borderRadius: 99, background: index === step ? C.primary : index < step ? "rgba(92,124,250,.4)" : "rgba(26,32,80,.12)", transition: "all .2s" }} />)}
      </div>

      <form action={saveOnboarding}>
        <div style={{ background: "rgba(255,255,255,.72)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 20, boxShadow: "0 5px 24px rgba(26,32,80,.07)" }}>
          <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: "0 0 5px", color: C.text }}>{steps[step][0]}</h1>
          <p style={{ fontSize: 13, margin: "0 0 20px", color: C.muted }}>{steps[step][1]}</p>

          <section style={{ display: step === 0 ? "block" : "none" }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{en ? "Name" : "Имя"}</label>
            <input name="fullName" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" style={input} />
          </section>

          <section style={{ display: step === 1 ? "block" : "none" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, fontSize: 13, fontWeight: 600 }}><input type="checkbox" checked={hasBirth} onChange={(event) => setHasBirth(event.target.checked)} style={{ width: 18, height: 18, accentColor: C.primary }} />{en ? "Set date of birth" : "Указать дату рождения"}</label>
            {hasBirth && <input aria-label={en ? "Date of birth" : "Дата рождения"} name="birthDate" type="date" max={localToday} value={birth} onChange={(event) => setBirth(event.target.value)} style={{ ...input, marginTop: 8 }} />}
            {!hasBirth && <input type="hidden" name="birthDate" value="" />}
            <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{en ? "Gender" : "Пол"}</div>
              <div style={{ display: "flex", gap: 8 }}>{[ ["female", en ? "Female" : "Женский"], ["male", en ? "Male" : "Мужской"], ["other", en ? "Other" : "Другой"] ].map(([value, label]) => <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)} style={{ flex: 1, padding: "11px 4px", borderRadius: 12, border: `1px solid ${gender === value ? C.primary : "rgba(186,200,255,.45)"}`, background: gender === value ? "rgba(92,124,250,.08)" : "rgba(244,246,255,.65)", color: gender === value ? C.primary : C.muted, fontSize: 12, fontWeight: 650 }}>{label}</button>)}</div>
            </div>
            <input type="hidden" name="gender" value={gender} />
          </section>

          <section style={{ display: step === 2 ? "block" : "none" }}>
            <div style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{en ? "Current city" : "Город сейчас"}</div>
            <CityPicker initialCity={initialCity || ""} initialRegion={initialRegion || ""} initialCountry={initialCountry || ""} initialCountryCode={initialCountryCode || ""} onSelectionChange={(city) => setCurrentCity(city?.city || "")} en={en} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{en ? "Your region is used when selecting vaccines." : "Регион учитывается при подборе прививок."}</div>
            <div style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginTop: 20, marginBottom: 6 }}>{en ? "Where have you lived in the past 10 years?" : "Где жили последние 10 лет"}</div>
            <CityPicker fieldPrefix="historyCity" en={en} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{en ? "Add this city or another one to account for regional risks." : "Укажите тот же или другой город — это влияет на региональные риски."}</div>
          </section>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} style={{ flex: 1, padding: 15, borderRadius: 14, border: "1px solid rgba(186,200,255,.45)", background: "rgba(255,255,255,.65)", color: C.text, fontWeight: 650, fontSize: 15 }}>{en ? "Back" : "Назад"}</button>}
          {step < 2 ? <button type="button" onClick={advance} style={{ flex: 1, padding: 15, borderRadius: 14, border: 0, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 15, boxShadow: "0 5px 14px rgba(92,124,250,.25)" }}>{en ? "Next" : "Далее"}</button> : <button type="submit" disabled={!currentCity || name.trim().length < 2} style={{ flex: 1, padding: 15, borderRadius: 14, border: 0, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 15, opacity: currentCity && name.trim().length >= 2 ? 1 : .5 }}>{en ? "Done" : "Готово"}</button>}
        </div>
      </form>
    </div>
  </main>;
}
