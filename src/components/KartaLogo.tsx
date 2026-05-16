export function KartaLogo({ size = 40 }: { size?: number }) {
  const r = size / 56
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: 'linear-gradient(140deg, #748FFC 0%, #5C7CFA 45%, #74C0FC 100%)',
        boxShadow: '0 6px 20px rgba(92,124,250,0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Glass sheen */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, transparent 55%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      {/* A4 logo — three fanned cards */}
      <svg
        width={36 * r}
        height={36 * r}
        viewBox="0 0 36 36"
        fill="none"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <rect x="4" y="8" width="18" height="22" rx="4" fill="rgba(255,255,255,0.15)" transform="rotate(-8 4 8)" />
        <rect x="7" y="7" width="18" height="22" rx="4" fill="rgba(255,255,255,0.25)" transform="rotate(-3 7 7)" />
        <rect x="10" y="8" width="18" height="22" rx="4" fill="white" />
        <rect x="13" y="13" width="10" height="2" rx="1" fill="#BAC8FF" />
        <rect x="13" y="17" width="7" height="2" rx="1" fill="#BAC8FF" />
        <rect x="13" y="21" width="9" height="2" rx="1" fill="#BAC8FF" />
        <circle cx="29" cy="10" r="4" fill="#74C0FC" />
      </svg>
    </div>
  )
}
