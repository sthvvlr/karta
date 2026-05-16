'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { KartaLogo } from '@/components/KartaLogo'

const C = { text: '#1A2050', muted: 'rgba(26,32,80,0.42)', card: 'rgba(255,255,255,0.82)', border: 'rgba(255,255,255,0.9)' }

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Неверный email или пароль'); setLoading(false); return }

    // Check if profile is filled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRaw } = await (supabase as any)
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single()

    const profile = profileRaw as { full_name: string | null } | null
    router.push(profile?.full_name ? '/' : '/onboarding')
    router.refresh()
  }

  return (
    <div>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <KartaLogo size={56} />
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.4px' }}>karta</div>
        <div style={{ fontSize: 13, color: C.muted }}>Добро пожаловать</div>
      </div>

      {/* Form card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: '28px 24px', boxShadow: '0 2px 24px rgba(26,32,80,0.08)', backdropFilter: 'blur(16px)' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: 'block' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: 'block' }}>Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Ваш пароль"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#E03131', background: 'rgba(224,49,49,0.07)', border: '1px solid rgba(224,49,49,0.15)', borderRadius: 10, padding: '8px 12px' }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: C.muted }}>
        Нет аккаунта?{' '}
        <Link href="/register" style={{ color: '#5C7CFA', fontWeight: 600, textDecoration: 'none' }}>Зарегистрироваться</Link>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px',
  background: 'rgba(244,246,255,0.8)', border: '1px solid rgba(186,200,255,0.4)',
  borderRadius: 12, fontSize: 15, color: '#1A2050', outline: 'none',
  fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '14px',
  background: 'linear-gradient(135deg, #748FFC, #5C7CFA)',
  border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
  color: 'white', cursor: 'pointer', marginTop: 4,
  boxShadow: '0 6px 20px rgba(92,124,250,0.35)',
  fontFamily: 'inherit',
}
