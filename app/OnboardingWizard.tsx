"use client";

import { useState } from "react";
import { CityPicker } from "@/app/CityPicker";
import { saveOnboarding } from "@/app/actions";
import { birthDateInputValue } from "@/app/profile-dates";

const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", primary: "#5C7CFA", border: "rgba(255,255,255,.9)" };
const input = { width: "100%", padding: "13px 14px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.45)", borderRadius: 12, fontSize: 16, color: C.text } as const;
export function OnboardingWizard({ initialName, initialBirthDate = "", initialGender = "", initialCity = "", initialRegion = "", initialCountry = "", initialCountryCode = "", en = false }: { initialName: string; initialBirthDate?: string | null; initialGender?: string | null; initialCity?: string | null; initialRegion?: string | null; initialCountry?: string | null; initialCountryCode?: string | null; en?: boolean }) {
  const steps = en
    ? [["What is your name?", "This is the name shown in the app"], ["A little about you", "Used to personalize your recommendations"], ["Where do you live?", "This affects vaccine recommendations"]]
    : [["Как вас зовут?", "Это ваше имя в приложении"], ["Немного о вас", "Нужно для персональных рекомендаций"], ["Где вы живёте?", "Влияет на рекомендации по прививкам"]];
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [birth, setBirth] = useState(birthDateInputValue(initialBirthDate));
  const [gender, setGender] = useState(initialGender || "");
  const [currentCity, setCurrentCity] = useState(initialCity || "");
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function advance() {
    if (step === 0 && name.trim().length < 2) return;
    if (step === 2 && !currentCity) return;
    setStep((current) => Math.min(2, current + 1));
  }

  return <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "max(48px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom))", color: C.text }}>
    <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", display: "flex", flex: 1, flexDirection: "column" }}>
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <img src="/karta-icon.png" alt="Karta" style={{ width: 64, height: 64, borderRadius: 18, boxShadow: "0 8px 24px rgba(92,124,250,.2)" }} />
        <div style={{ fontSize: 22, fontWeight: 750, marginTop: 9 }}>Karta</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{en ? "Let's set up your health card" : "Настроим вашу карту"}</div>
      </header>

      <div aria-label={en ? `Step ${step + 1} of 3` : `Шаг ${step + 1} из 3`} style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {steps.map((_, index) => <div key={index} style={{ flex: 1, height: 4, borderRadius: 3, background: index <= step ? C.primary : "rgba(26,32,80,.12)" }} />)}
      </div>

      <form action={saveOnboarding} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "rgba(255,255,255,.82)", border: `1px solid ${C.border}`, borderRadius: 22, padding: 20, boxShadow: "0 5px 24px rgba(26,32,80,.07)", flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: ".1em", fontWeight: 800, color: C.primary, marginBottom: 8 }}>{en ? `STEP ${step + 1} OF 3` : `ШАГ ${step + 1} ИЗ 3`}</div>
          <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: "0 0 5px", color: C.text }}>{steps[step][0]}</h1>
          <p style={{ fontSize: 13, margin: "0 0 22px", color: C.muted }}>{steps[step][1]}</p>

          <section style={{ display: step === 0 ? "block" : "none" }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{en ? "Name" : "Имя"}</label>
            <input name="fullName" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" style={input} />
          </section>

          <section style={{ display: step === 1 ? "block" : "none" }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{en ? "Date of birth" : "Дата рождения"}</label>
            <input name="birthDate" type="date" max={localToday} value={birth} onChange={(event) => setBirth(event.target.value)} style={input} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{en ? "Date of birth is optional" : "Дата необязательна"}</div>
            <div style={{ display: "grid", gap: 8, marginTop: 20 }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{en ? "Gender" : "Пол"}</div>
              {[ ["female", en ? "Female" : "Женский"], ["male", en ? "Male" : "Мужской"], ["other", en ? "Other" : "Другой"] ].map(([value, label]) => <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, border: `1px solid ${gender === value ? C.primary : "rgba(186,200,255,.45)"}`, background: gender === value ? "rgba(92,124,250,.08)" : "rgba(244,246,255,.65)", color: C.text, fontSize: 14 }}>{label}{gender === value && <span style={{ float: "right", color: C.primary }}>✓</span>}</button>)}
            </div>
            <input type="hidden" name="gender" value={gender} />
          </section>

          <section style={{ display: step === 2 ? "block" : "none" }}>
            <label style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{en ? "Current city" : "Город сейчас"}</label>
            <CityPicker initialCity={initialCity || ""} initialRegion={initialRegion || ""} initialCountry={initialCountry || ""} initialCountryCode={initialCountryCode || ""} onSelectionChange={(city) => setCurrentCity(city?.city || "")} en={en} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{en ? "Your region is used when selecting vaccines." : "Регион учитывается при подборе прививок."}</div>
            <label style={{ display: "block", color: C.muted, fontSize: 12, fontWeight: 600, marginTop: 20, marginBottom: 6 }}>{en ? "Where have you lived in the past 10 years?" : "Где жили последние 10 лет"}</label>
            <CityPicker fieldPrefix="historyCity" en={en} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{en ? "Add this city or another one to account for regional risks." : "Укажите тот же или другой город — это влияет на региональные риски."}</div>
          </section>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} style={{ flex: 1, padding: 15, borderRadius: 14, border: "1px solid rgba(186,200,255,.45)", background: "rgba(255,255,255,.65)", color: C.text, fontWeight: 650, fontSize: 15 }}>{en ? "Back" : "Назад"}</button>}
          {step < 2 ? <button type="button" onClick={advance} style={{ flex: 1, padding: 15, borderRadius: 14, border: 0, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 15, boxShadow: "0 5px 14px rgba(92,124,250,.25)" }}>{en ? "Continue" : "Далее"}</button> : <button type="submit" disabled={!currentCity || name.trim().length < 2} style={{ flex: 1, padding: 15, borderRadius: 14, border: 0, background: "linear-gradient(105deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 15, opacity: currentCity && name.trim().length >= 2 ? 1 : .5 }}>{en ? "Done" : "Готово"}</button>}
        </div>
      </form>
    </div>
  </main>;
}
