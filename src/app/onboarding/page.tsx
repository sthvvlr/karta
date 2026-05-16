'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { KartaLogo } from '@/components/KartaLogo'

const C = { text: '#1A2050', muted: 'rgba(26,32,80,0.42)', card: 'rgba(255,255,255,0.82)', border: 'rgba(255,255,255,0.9)' }

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]               = useState(0)
  const [fullName, setFullName]       = useState('')
  const [birthDate, setBirthDate]     = useState('')
  const [gender, setGender]           = useState<'female' | 'male' | 'other' | ''>('')
  const [cityNow, setCityNow]         = useState('')
  const [cityPast, setCityPast]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const steps = [
    { title: 'Как вас зовут?',       subtitle: 'Это ваше имя в приложении' },
    { title: 'Немного о вас',        subtitle: 'Нужно для персональных рекомендаций' },
    { title: 'Где вы живёте?',       subtitle: 'Влияет на рекомендации по прививкам' },
  ]

  async function handleFinish() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { error: profileError } = await sb
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        gender: gender || null,
        city_current: cityNow.trim() || null,
        country_current: 'Россия',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) { setError(profileError.message); setLoading(false); return }

    if (cityPast.trim() && cityPast.trim() !== cityNow.trim()) {
      await sb.from('profile_locations').insert({
        user_id: user.id, city: cityPast.trim(), country: 'Россия',
        from_year: new Date().getFullYear() - 10, to_year: new Date().getFullYear(), is_current: false,
      })
    }
    if (cityNow.trim()) {
      await sb.from('profile_locations').insert({
        user_id: user.id, city: cityNow.trim(), country: 'Россия',
        from_year: new Date().getFullYear(), to_year: null, is_current: true,
      })
    }

    router.push('/')
    router.refresh()
  }

  function canProceed() {
    if (step === 0) return fullName.trim().length >= 2
    if (step === 1) return true
    if (step === 2) return cityNow.trim().length >= 2
    return true
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <KartaLogo size={44} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 3,
            background: i === step ? '#5C7CFA' : i < step ? 'rgba(92,124,250,0.4)' : 'rgba(26,32,80,0.12)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: '28px 24px', boxShadow: '0 2px 24px rgba(26,32,80,0.08)', backdropFilter: 'blur(16px)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{steps[step].title}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{steps[step].subtitle}</div>

        {step === 0 && (
          <input
            type="text" value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Имя или имя и фамилия"
            autoFocus
            style={inputStyle}
          />
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Дата рождения</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Пол</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['female', 'male', 'other'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)} style={{
                    flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: `1.5px solid ${gender === g ? '#5C7CFA' : 'rgba(186,200,255,0.4)'}`,
                    background: gender === g ? 'rgba(92,124,250,0.08)' : 'rgba(244,246,255,0.8)',
                    color: gender === g ? '#5C7CFA' : C.muted,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {g === 'female' ? 'Женский' : g === 'male' ? 'Мужской' : 'Другой'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Город проживания сейчас</label>
              <input type="text" value={cityNow} onChange={e => setCityNow(e.target.value)} placeholder="Москва" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Где жили большую часть последних 10 лет</label>
              <input type="text" value={cityPast} onChange={e => setCityPast(e.target.value)} placeholder="Тот же город или другой" style={inputStyle} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Влияет на рекомендации по прививкам (клещевой энцефалит, малярия и т.д.)</div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#E03131', marginTop: 12 }}>{error}</div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            flex: 1, padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(186,200,255,0.4)',
            color: C.text, cursor: 'pointer', fontFamily: 'inherit',
          }}>Назад</button>
        )}
        <button
          onClick={step < steps.length - 1 ? () => setStep(s => s + 1) : handleFinish}
          disabled={!canProceed() || loading}
          style={{
            flex: 2, padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: canProceed() ? 'linear-gradient(135deg, #748FFC, #5C7CFA)' : 'rgba(186,200,255,0.4)',
            border: 'none', color: 'white', cursor: canProceed() ? 'pointer' : 'default',
            boxShadow: canProceed() ? '0 6px 20px rgba(92,124,250,0.35)' : 'none',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          {loading ? 'Сохраняем…' : step < steps.length - 1 ? 'Далее' : 'Готово'}
        </button>
      </div>

    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px',
  background: 'rgba(244,246,255,0.8)', border: '1px solid rgba(186,200,255,0.4)',
  borderRadius: 12, fontSize: 15, color: '#1A2050', outline: 'none', fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'rgba(26,32,80,0.42)', marginBottom: 6, display: 'block',
}
