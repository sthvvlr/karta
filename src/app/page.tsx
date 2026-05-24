import { KartaLogo } from '@/components/KartaLogo'
import { BlobBackground } from '@/components/BlobBackground'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div style={{ background: '#F4F6FF', minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <BlobBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 40px',
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KartaLogo size={40} />
            <span style={{
              fontSize: 22,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #5C7CFA 0%, #748FFC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}>Karta</span>
          </div>
          <a
            href="mailto:valeriya.astahova@gmail.com"
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(92,124,250,0.08)',
              color: '#5C7CFA',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid rgba(92,124,250,0.15)',
              transition: 'all 0.2s',
            }}
          >
            Поддержка
          </a>
        </nav>

        {/* Hero */}
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '60px 40px 40px',
          textAlign: 'center',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 100,
            background: 'rgba(92,124,250,0.1)',
            border: '1px solid rgba(92,124,250,0.2)',
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 14, color: '#5C7CFA', fontWeight: 600 }}>Скоро в App Store</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            color: '#1a1d2e',
            marginBottom: 24,
            maxWidth: 800,
            margin: '0 auto 24px',
          }}>
            Паспорт здоровья{' '}
            <span style={{
              background: 'linear-gradient(135deg, #5C7CFA 0%, #74C0FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>
              в&nbsp;кармане
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#6b7280',
            maxWidth: 520,
            margin: '0 auto 48px',
            lineHeight: 1.6,
          }}>
            Прививки, лекарства и анализы — всё в одном месте.
            Отслеживайте своё здоровье и здоровье близких.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 80,
          }}>
            {/* App Store button */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #5C7CFA 0%, #748FFC 100%)',
              boxShadow: '0 8px 24px rgba(92,124,250,0.35)',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'default',
              opacity: 0.85,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Скоро в App Store
            </div>

            {/* Support button */}
            <a
              href="mailto:valeriya.astahova@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 28px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(92,124,250,0.2)',
                color: '#5C7CFA',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(92,124,250,0.1)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Написать в поддержку
            </a>
          </div>

          {/* Screenshots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 'clamp(12px, 2vw, 28px)',
            padding: '0 20px',
          }}>
            {/* Left screen — tilted left */}
            <div style={{
              transform: 'rotate(-6deg) translateY(20px)',
              flex: '0 0 auto',
              width: 'clamp(140px, 18vw, 230px)',
              borderRadius: 'clamp(20px, 3vw, 36px)',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(92,124,250,0.25), 0 4px 16px rgba(0,0,0,0.12)',
              border: '3px solid rgba(255,255,255,0.8)',
            }}>
              <Image
                src="/screenshots/screen2.png"
                alt="Прививки"
                width={621}
                height={1344}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Center screen — upright, bigger */}
            <div style={{
              flex: '0 0 auto',
              width: 'clamp(180px, 24vw, 300px)',
              borderRadius: 'clamp(24px, 3.5vw, 44px)',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(92,124,250,0.3), 0 8px 24px rgba(0,0,0,0.15)',
              border: '3px solid rgba(255,255,255,0.9)',
              zIndex: 2,
              position: 'relative',
            }}>
              <Image
                src="/screenshots/screen1.png"
                alt="Главный экран"
                width={621}
                height={1344}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Right screen — tilted right */}
            <div style={{
              transform: 'rotate(6deg) translateY(20px)',
              flex: '0 0 auto',
              width: 'clamp(140px, 18vw, 230px)',
              borderRadius: 'clamp(20px, 3vw, 36px)',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(92,124,250,0.25), 0 4px 16px rgba(0,0,0,0.12)',
              border: '3px solid rgba(255,255,255,0.8)',
            }}>
              <Image
                src="/screenshots/screen3.png"
                alt="Лекарства"
                width={621}
                height={1344}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{
          maxWidth: 1100,
          margin: '80px auto 0',
          padding: '0 40px 80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              icon: '💉',
              title: 'Прививки',
              desc: 'Храните историю вакцинаций и получайте напоминания о следующих дозах',
            },
            {
              icon: '💊',
              title: 'Лекарства',
              desc: 'Контролируйте приём препаратов и никогда не пропускайте дозу',
            },
            {
              icon: '🩺',
              title: 'Анализы',
              desc: 'Следите за рекомендациями по сдаче анализов на основе вашего профиля',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                padding: '28px 28px',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 24px rgba(92,124,250,0.08)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1d2e', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid rgba(92,124,250,0.1)',
          padding: '32px 40px',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KartaLogo size={28} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#9ca3af' }}>Karta</span>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:valeriya.astahova@gmail.com" style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'none' }}>
              valeriya.astahova@gmail.com
            </a>
            <span style={{ fontSize: 14, color: '#c4c9d8' }}>© 2025 Karta</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
