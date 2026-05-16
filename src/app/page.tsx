import Link from 'next/link'

const C = {
  text: '#1A2050',
  muted: 'rgba(26,32,80,0.42)',
  card: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.9)',
}

const tiles = [
  { href: '/vaccinations', icon: '💉', label: 'Прививки',  sub: '8 записей', blob: '#BAC8FF' },
  { href: '/medications',  icon: '💊', label: 'Лекарства', sub: '2 из 3',    blob: '#D0BFFF' },
  { href: '#',             icon: '🧪', label: 'Анализы',   sub: '12 апр',    blob: '#A5F3FC' },
  { href: '#',             icon: '📋', label: 'Чекапы',    sub: '2 рек.',    blob: '#C7F5E8' },
]

const todayItems = [
  { icon: '💊', name: 'Омега-3',            when: '08:00 · с едой',        done: true,  soon: false },
  { icon: '💊', name: 'Розувастатин 10 мг', when: '21:00 · натощак',        done: false, soon: false },
  { icon: '💉', name: 'Дифтерия, столбняк', when: 'Рекомендована в июне',   done: false, soon: true  },
]

export default function HomePage() {
  return (
    <div style={{ padding: '12px 16px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Доброе утро</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.4px' }}>Мария</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, boxShadow: '0 2px 8px rgba(26,32,80,0.12)',
        }}>🌿</div>
      </div>

      {/* Hero — Karta index */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)',
        padding: '18px 20px', marginBottom: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)', top: -35, right: -35, filter: 'blur(30px)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#A5F3FC,#C7F5E8)', bottom: -20, left: 10, filter: 'blur(20px)', opacity: 0.45, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#748FFC" />
                  <stop offset="100%" stopColor="#A5F3FC" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(26,32,80,0.07)" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="url(#rg)" strokeWidth="5"
                strokeDasharray="138" strokeDashoffset="24" strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 15, fontWeight: 700, color: C.text }}>84</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Хорошее здоровье</div>
            <div style={{ fontSize: 11, color: C.muted }}>Индекс Karta</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, background: 'rgba(116,192,252,0.15)', border: '1px solid rgba(116,192,252,0.3)', color: '#1971C2', padding: '4px 10px', borderRadius: 20 }}>↑ +3</div>
        </div>
      </div>

      {/* Tiles */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Разделы</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 20 }}>
        {tiles.map(t => (
          <Link key={t.label} href={t.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 14, boxShadow: '0 1px 6px rgba(26,32,80,0.04)',
              padding: 13, position: 'relative', overflow: 'hidden', cursor: 'pointer',
            }}>
              <div style={{ position: 'absolute', width: 55, height: 55, borderRadius: '50%', background: t.blob, top: -14, right: -14, filter: 'blur(14px)', opacity: 0.5 }} />
              <div style={{ fontSize: 20, marginBottom: 7, position: 'relative', zIndex: 1 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, position: 'relative', zIndex: 1 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: C.muted, position: 'relative', zIndex: 1 }}>{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Сегодня</div>
      {todayItems.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 0',
          borderBottom: i < todayItems.length - 1 ? '1px solid rgba(26,32,80,0.05)' : 'none',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
          }}>{item.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 1 }}>{item.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{item.when}</div>
          </div>
          {item.done && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#748FFC,#74C0FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white' }}>✓</div>
          )}
          {!item.done && !item.soon && (
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(26,32,80,0.15)' }} />
          )}
          {item.soon && (
            <div style={{ fontSize: 10, fontWeight: 600, color: '#E67700' }}>Скоро</div>
          )}
        </div>
      ))}

    </div>
  )
}
