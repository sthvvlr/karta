const C = {
  text: '#1A2050',
  muted: 'rgba(26,32,80,0.42)',
  card: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.9)',
  cardSm: 'rgba(255,255,255,0.72)',
  borderSm: 'rgba(255,255,255,0.88)',
}

const dotColors = ['#BAC8FF', '#A5F3FC', '#D0BFFF', '#C7F5E8']

interface MedItem {
  name: string
  dose: string
  meal: string
  done: boolean
  color: string
}

const morning: MedItem[] = [
  { name: 'Омега-3',   dose: '1 капсула',  meal: 'с едой',  done: true,  color: dotColors[0] },
  { name: 'Витамин D3', dose: '2000 МЕ',   meal: 'с едой',  done: true,  color: dotColors[1] },
]

const evening: MedItem[] = [
  { name: 'Розувастатин', dose: '10 мг', meal: 'натощак', done: false, color: dotColors[2] },
]

function MedRow({ item }: { item: MedItem }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 13px', marginBottom: 5,
      background: C.cardSm, border: `1px solid ${C.borderSm}`,
      borderRadius: 14, boxShadow: '0 1px 6px rgba(26,32,80,0.04)',
      opacity: item.done ? 0.4 : 1,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.name}</div>
        <div style={{ fontSize: 10, color: C.muted }}>{item.dose} · {item.meal}</div>
      </div>
      {item.done ? (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#748FFC,#74C0FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white' }}>✓</div>
      ) : (
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(26,32,80,0.13)' }} />
      )}
    </div>
  )
}

export default function MedicationsPage() {
  const today = new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long' })
  const total = morning.length + evening.length
  const done = [...morning, ...evening].filter(m => m.done).length
  const progress = (done / total) * 100

  return (
    <div style={{ padding: '12px 16px 0' }}>

      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.4px', paddingTop: 12 }}>Лекарства</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Сегодня, {today}</div>

      {/* Progress card */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)',
        padding: '15px 17px', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)', top: -20, right: -20, filter: 'blur(22px)', opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Прогресс дня</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#5C7CFA' }}>{done} / {total}</div>
          </div>
          <div style={{ height: 4, background: 'rgba(26,32,80,0.07)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#748FFC,#74C0FC,#A5F3FC)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Morning */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Утро · 08:00</div>
      {morning.map(m => <MedRow key={m.name} item={m} />)}

      {/* Evening */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '14px 0 10px' }}>Вечер · 21:00</div>
      {evening.map(m => <MedRow key={m.name} item={m} />)}

      {/* Course reminder */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '14px 0 10px' }}>Напоминания курса</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 13px',
        background: 'rgba(186,200,255,0.1)', border: '1px solid rgba(186,200,255,0.3)',
        borderRadius: 13,
      }}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>🧪</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5C7CFA' }}>Анализ крови</div>
          <div style={{ fontSize: 10, color: C.muted }}>На статинах · раз в 3 мес</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#5C7CFA' }}>июл 25</div>
      </div>

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
