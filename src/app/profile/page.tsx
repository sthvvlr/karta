const C = {
  text: '#1A2050',
  muted: 'rgba(26,32,80,0.42)',
  card: 'rgba(255,255,255,0.72)',
  border: 'rgba(255,255,255,0.9)',
}

export default function ProfilePage() {
  return (
    <div style={{ padding: '12px 16px 0' }}>

      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.4px', paddingTop: 12, marginBottom: 4 }}>Профиль</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Личные данные</div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg,#BAC8FF,#D0BFFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 12,
          boxShadow: '0 4px 16px rgba(92,124,250,0.2)',
        }}>🌿</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Мария</div>
        <div style={{ fontSize: 12, color: C.muted }}>мария@email.com</div>
      </div>

      {/* Info card */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)',
        overflow: 'hidden', marginBottom: 14,
      }}>
        {[
          ['Имя',          'Мария Иванова'],
          ['Дата рождения', '15.03.1990'],
          ['Пол',           'Женский'],
          ['Город',         'Москва'],
        ].map(([label, value], i, arr) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid rgba(26,32,80,0.05)' : 'none',
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, boxShadow: '0 2px 16px rgba(26,32,80,0.06)',
        overflow: 'hidden',
      }}>
        {['Редактировать профиль', 'История городов', 'Настройки напоминаний', 'Выйти'].map((item, i, arr) => (
          <div key={item} style={{
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid rgba(26,32,80,0.05)' : 'none',
            fontSize: 13, fontWeight: 600,
            color: item === 'Выйти' ? '#E03131' : C.text,
            cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {item}
            {item !== 'Выйти' && <span style={{ color: C.muted, fontSize: 16 }}>›</span>}
          </div>
        ))}
      </div>

    </div>
  )
}
