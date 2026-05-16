const C = {
  text: '#1A2050',
  muted: 'rgba(26,32,80,0.42)',
  card: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.9)',
  cardSm: 'rgba(255,255,255,0.72)',
  borderSm: 'rgba(255,255,255,0.88)',
}

type VaxStatus = 'done' | 'soon'

interface VaxRow {
  name: string
  when: string
  status: VaxStatus
  badge: string
}

const current: VaxRow[] = [
  { name: 'Грипп',              when: 'Окт 2024 · повтор окт 2025', status: 'done', badge: 'Готово' },
  { name: 'COVID-19',           when: 'Март 2024 · 3 дозы',         status: 'done', badge: '3/3'    },
  { name: 'Дифтерия, столбняк', when: 'Рекомендована в июне',       status: 'soon', badge: 'Скоро'  },
]

const history: VaxRow[] = [
  { name: 'Гепатит B',              when: '2010 · 3 дозы',  status: 'done', badge: '3/3' },
  { name: 'Корь, краснуха, паротит', when: '1995, 2002',    status: 'done', badge: '2/2' },
  { name: 'Полиомиелит',            when: '1991–1995',       status: 'done', badge: '4/4' },
]

function Dot({ status }: { status: VaxStatus }) {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      background: status === 'done' ? '#20C997' : '#F59E0B',
      boxShadow: status === 'done' ? '0 0 5px rgba(32,201,151,0.4)' : 'none',
    }} />
  )
}

function Chip({ status, badge }: { status: VaxStatus; badge: string }) {
  const done = status === 'done'
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      background: done ? 'rgba(32,201,151,0.1)' : 'rgba(245,158,11,0.1)',
      border: `1px solid ${done ? 'rgba(32,201,151,0.2)' : 'rgba(245,158,11,0.2)'}`,
      color: done ? '#0CA678' : '#D97706',
    }}>{badge}</div>
  )
}

function VaxRow({ row }: { row: VaxRow }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 13px', marginBottom: 5,
      background: C.cardSm, border: `1px solid ${C.borderSm}`,
      borderRadius: 14, boxShadow: '0 1px 6px rgba(26,32,80,0.04)',
    }}>
      <Dot status={row.status} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{row.name}</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{row.when}</div>
      </div>
      <Chip status={row.status} badge={row.badge} />
    </div>
  )
}

export default function VaccinationsPage() {
  return (
    <div style={{ padding: '12px 16px 0' }}>

      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.4px', paddingTop: 12 }}>Прививки</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Паспорт вакцинации</div>

      {/* Passport card */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)',
        padding: '18px 18px 52px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)', top: -40, right: -40, filter: 'blur(35px)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#A5F3FC,#C7F5E8)', bottom: -20, left: 10, filter: 'blur(25px)', opacity: 0.45 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'linear-gradient(135deg,#748FFC,#74C0FC)' }} />
            Karta · Vaccination Record
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 2 }}>Мария Иванова</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Дата рождения: 15.03.1990</div>
          <div style={{ display: 'flex', gap: 22 }}>
            {[['8', 'Вакцин'], ['12', 'Доз'], ['1', 'Скоро']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 2 }}>{n}</div>
                <div style={{ fontSize: 9, color: 'rgba(26,32,80,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* PDF button */}
        <div style={{
          position: 'absolute', right: 14, bottom: 14, zIndex: 2,
          background: 'white', border: '1px solid rgba(186,200,255,0.4)',
          borderRadius: 10, padding: '6px 12px',
          fontSize: 11, color: '#5C7CFA', fontWeight: 600,
          boxShadow: '0 2px 8px rgba(92,124,250,0.1)', cursor: 'pointer',
        }}>↑ PDF</div>
      </div>

      {/* Current */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Актуальные</div>
      {current.map(r => <VaxRow key={r.name} row={r} />)}

      {/* History */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '14px 0 10px' }}>История</div>
      {history.map(r => <VaxRow key={r.name} row={r} />)}

      {/* Add */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: 13, border: '1.5px dashed rgba(26,32,80,0.1)', borderRadius: 14,
        marginTop: 10, color: 'rgba(26,32,80,0.32)', fontSize: 12, fontWeight: 500,
        cursor: 'pointer',
      }}>+ Добавить прививку</div>

      {/* FAB */}
      <div style={{
        position: 'fixed', right: 'max(16px, calc(50vw - 215px + 16px))',
        bottom: 88, width: 44, height: 44,
        background: 'linear-gradient(135deg,#748FFC,#74C0FC)',
        borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: 'white', boxShadow: '0 6px 20px rgba(92,124,250,0.38)',
        zIndex: 10, cursor: 'pointer',
      }}>+</div>

    </div>
  )
}
