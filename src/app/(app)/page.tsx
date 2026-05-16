import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

const C = { text: '#1A2050', muted: 'rgba(26,32,80,0.42)', card: 'rgba(255,255,255,0.72)', border: 'rgba(255,255,255,0.9)' }

const tiles = [
  { href: '/vaccinations', icon: '💉', label: 'Прививки', blob: '#BAC8FF' },
  { href: '/medications',  icon: '💊', label: 'Лекарства', blob: '#D0BFFF' },
  { href: '#',             icon: '🧪', label: 'Анализы',   blob: '#A5F3FC' },
  { href: '#',             icon: '📋', label: 'Чекапы',    blob: '#C7F5E8' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, birth_date')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { full_name: string | null; birth_date: string | null } | null

  if (!profile?.full_name) redirect('/onboarding')

  const firstName = profile.full_name!.split(' ')[0]

  // Today's active medications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: medsRaw } = await (supabase as any)
    .from('user_medications')
    .select('id, name, dosage, reminder_times, meal_relation')
    .eq('user_id', user.id)
    .eq('active', true)
    .lte('start_date', new Date().toISOString().slice(0, 10))

  type MedRow = { id: string; name: string; dosage: string | null; reminder_times: string[] | null; meal_relation: string }
  const meds = medsRaw as MedRow[] | null

  // Today's logs
  const today = new Date().toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logsRaw } = await (supabase as any)
    .from('medication_logs')
    .select('medication_id, status')
    .eq('user_id', user.id)
    .gte('scheduled_at', `${today}T00:00:00`)
    .lte('scheduled_at', `${today}T23:59:59`)

  type LogRow = { medication_id: string; status: string }
  const doneIds = new Set(((logsRaw ?? []) as LogRow[]).filter(l => l.status === 'taken').map(l => l.medication_id))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vacCount = await (supabase as any).from('user_vaccinations').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  const medCount = meds?.length ?? 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div style={{ padding: '12px 16px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{greeting}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.4px' }}>{firstName}</div>
        </div>
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 2px 8px rgba(26,32,80,0.12)', cursor: 'pointer' }}>
            {firstName[0].toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)', padding: '18px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)', top: -35, right: -35, filter: 'blur(30px)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#A5F3FC,#C7F5E8)', bottom: -20, left: 10, filter: 'blur(20px)', opacity: 0.45 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#748FFC" /><stop offset="100%" stopColor="#A5F3FC" /></linearGradient></defs>
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(26,32,80,0.07)" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="url(#rg)" strokeWidth="5" strokeDasharray="138" strokeDashoffset="24" strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 15, fontWeight: 700, color: C.text }}>—</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Добро пожаловать</div>
            <div style={{ fontSize: 11, color: C.muted }}>Заполняйте данные, строим вашу карту</div>
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Разделы</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 20 }}>
        {tiles.map(t => {
          const sub = t.label === 'Прививки' ? `${vacCount.count ?? 0} записей`
                    : t.label === 'Лекарства' ? `${medCount} активных`
                    : '—'
          return (
            <Link key={t.label} href={t.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, position: 'relative', overflow: 'hidden', boxShadow: '0 1px 6px rgba(26,32,80,0.04)' }}>
                <div style={{ position: 'absolute', width: 55, height: 55, borderRadius: '50%', background: t.blob, top: -14, right: -14, filter: 'blur(14px)', opacity: 0.5 }} />
                <div style={{ fontSize: 20, marginBottom: 7, position: 'relative', zIndex: 1 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, position: 'relative', zIndex: 1 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: C.muted, position: 'relative', zIndex: 1 }}>{sub}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Today's meds */}
      {(meds?.length ?? 0) > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Сегодня</div>
          {meds!.map((med, i) => {
            const isDone = doneIds.has(med.id)
            const time = med.reminder_times?.[0] ?? '—'
            const meal = med.meal_relation === 'before' ? 'до еды' : med.meal_relation === 'after' ? 'после еды' : med.meal_relation === 'during' ? 'с едой' : ''
            return (
              <div key={med.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < meds!.length - 1 ? '1px solid rgba(26,32,80,0.05)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>💊</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{med.name}{med.dosage ? ` ${med.dosage}` : ''}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{[time, meal].filter(Boolean).join(' · ')}</div>
                </div>
                {isDone
                  ? <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#748FFC,#74C0FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white' }}>✓</div>
                  : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(26,32,80,0.15)' }} />
                }
              </div>
            )
          })}
        </>
      )}

      {(meds?.length ?? 0) === 0 && (
        <Link href="/medications" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '14px 16px', background: C.card, border: `1px dashed rgba(186,200,255,0.5)`, borderRadius: 16, fontSize: 13, color: C.muted, textAlign: 'center' }}>
            + Добавьте первое лекарство
          </div>
        </Link>
      )}

    </div>
  )
}
