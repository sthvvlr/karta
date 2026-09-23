import { KartaLogo } from '@/components/KartaLogo'
import { BlobBackground } from '@/components/BlobBackground'
import Image from 'next/image'
import Link from 'next/link'

const FRAME_THIN = '1.5px solid rgba(255,255,255,0.65)'

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
            }}
          >
            Поддержка
          </a>
        </nav>

        {/* Hero */}
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '60px 40px 0',
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
            marginBottom: 72,
          }}>
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

          {/* Hero phone mockups — smaller, visual teaser */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 'clamp(8px, 1.5vw, 20px)',
            padding: '0 20px',
          }}>
            <div style={{
              transform: 'rotate(-6deg) translateY(20px)',
              flex: '0 0 auto',
              width: 'clamp(120px, 15vw, 200px)',
              borderRadius: 'clamp(18px, 2.5vw, 32px)',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(92,124,250,0.22), 0 3px 12px rgba(0,0,0,0.1)',
              border: FRAME_THIN,
            }}>
              <Image src="/screenshots/screen2.png" alt="Прививки" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            <div style={{
              flex: '0 0 auto',
              width: 'clamp(160px, 20vw, 260px)',
              borderRadius: 'clamp(22px, 3vw, 40px)',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(92,124,250,0.28), 0 6px 20px rgba(0,0,0,0.12)',
              border: FRAME_THIN,
              zIndex: 2,
              position: 'relative',
            }}>
              <Image src="/screenshots/screen1.png" alt="Главный экран" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            <div style={{
              transform: 'rotate(6deg) translateY(20px)',
              flex: '0 0 auto',
              width: 'clamp(120px, 15vw, 200px)',
              borderRadius: 'clamp(18px, 2.5vw, 32px)',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(92,124,250,0.22), 0 3px 12px rgba(0,0,0,0.1)',
              border: FRAME_THIN,
            }}>
              <Image src="/screenshots/screen3.png" alt="Лекарства" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </section>

        {/* ── Feature annotation section ── */}
        <div className="kt-features-wrap">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 42px)',
              fontWeight: 800,
              color: '#1a1d2e',
              letterSpacing: '-1px',
              margin: '0 0 12px',
            }}>Всё для контроля здоровья</h2>
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
              Прививки, лекарства, анализы и показатели — в одном приложении
            </p>
          </div>

          <div className="kt-features-grid">

            {/* Left features */}
            <div className="kt-feat-col">
              {[
                { icon: '💉', title: 'Паспорт вакцинаций', desc: 'Вся история прививок и напоминания о следующих дозах' },
                { icon: '🔔', title: 'Никогда не пропустите дозу', desc: 'Умные уведомления о прививках и приёме лекарств' },
                { icon: '👨‍👩‍👧', title: 'Вся семья', desc: 'Ведите профили здоровья для всех близких в одном аккаунте' },
              ].map(f => (
                <div key={f.title} className="kt-feat-item kt-feat-item--left">
                  <div>
                    <p className="kt-feat-title">{f.title}</p>
                    <p className="kt-feat-desc">{f.desc}</p>
                  </div>
                  <div className="kt-feat-line" />
                  <div className="kt-feat-dot" />
                  <div className="kt-feat-icon">{f.icon}</div>
                </div>
              ))}
            </div>

            {/* Center phones */}
            <div className="kt-phones">
              <div style={{
                transform: 'rotate(-4deg) translateY(12px)',
                width: 'clamp(100px, 12vw, 165px)',
                borderRadius: 'clamp(16px, 2vw, 28px)',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(92,124,250,0.2), 0 3px 10px rgba(0,0,0,0.1)',
                border: FRAME_THIN,
                flexShrink: 0,
              }}>
                <Image src="/screenshots/screen2.png" alt="Прививки" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>

              <div style={{
                width: 'clamp(140px, 16vw, 215px)',
                borderRadius: 'clamp(20px, 2.5vw, 36px)',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(92,124,250,0.26), 0 6px 18px rgba(0,0,0,0.12)',
                border: FRAME_THIN,
                zIndex: 2,
                position: 'relative',
                flexShrink: 0,
              }}>
                <Image src="/screenshots/screen1.png" alt="Главный экран" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>

              <div style={{
                transform: 'rotate(4deg) translateY(12px)',
                width: 'clamp(100px, 12vw, 165px)',
                borderRadius: 'clamp(16px, 2vw, 28px)',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(92,124,250,0.2), 0 3px 10px rgba(0,0,0,0.1)',
                border: FRAME_THIN,
                flexShrink: 0,
              }}>
                <Image src="/screenshots/screen3.png" alt="Лекарства" width={621} height={1344} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>

            {/* Right features */}
            <div className="kt-feat-col">
              {[
                { icon: '📊', title: 'Karta Score', desc: 'Персональный индекс здоровья на основе ваших данных' },
                { icon: '💊', title: 'Расписание лекарств', desc: 'Курсы препаратов с напоминаниями утром и вечером' },
                { icon: '🩺', title: 'Анализы и чекапы', desc: 'Рекомендации по обследованиям на основе вашего профиля' },
              ].map(f => (
                <div key={f.title} className="kt-feat-item">
                  <div className="kt-feat-icon">{f.icon}</div>
                  <div className="kt-feat-dot" />
                  <div className="kt-feat-line" style={{ background: 'linear-gradient(to right, rgba(92,124,250,0.5), rgba(92,124,250,0.15))' }} />
                  <div>
                    <p className="kt-feat-title">{f.title}</p>
                    <p className="kt-feat-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

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
            <Link href="/privacy" style={{ fontSize: 14, color: '#9ca3af', textDecoration: 'none' }}>
              Политика конфиденциальности
            </Link>
            <span style={{ fontSize: 14, color: '#c4c9d8' }}>© 2026 Karta</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
