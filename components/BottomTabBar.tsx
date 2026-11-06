'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Syringe, Pill, UserRound } from 'lucide-react'
import { useKartaLanguage } from '@/app/LanguageRuntime'

const tabs = [
  { href: '/',             Icon: House,     label: 'Главная'  },
  { href: '/vaccinations', Icon: Syringe,   label: 'Прививки' },
  { href: '/medications',  Icon: Pill,      label: 'Лекарства'},
  { href: '/profile',      Icon: UserRound, label: 'Профиль'  },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const en = useKartaLanguage() === 'en'

  if (pathname === '/labs') return null

  return (
    <nav aria-label={en ? "Main navigation" : "Основная навигация"} className="no-print" style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      background: 'rgba(244,246,255,0.88)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(186,200,255,0.25)',
      display: 'flex',
      alignItems: 'flex-start',
      paddingTop: 10,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      justifyContent: 'space-around',
      zIndex: 50,
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              flex: 1,
              textDecoration: 'none',
              opacity: active ? 1 : 0.3,
            }}
          >
            <tab.Icon size={20} strokeWidth={active ? 2.4 : 2} color={active ? '#5C7CFA' : '#1A2050'} aria-hidden="true" />
            <span style={{
              fontSize: 9,
              fontWeight: active ? 700 : 500,
              color: active ? '#5C7CFA' : '#1A2050',
              letterSpacing: '0.02em',
            }}>
              {en ? ({ 'Главная': 'Home', 'Прививки': 'Vaccines', 'Лекарства': 'Medications', 'Профиль': 'Profile' }[tab.label] || tab.label) : tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
