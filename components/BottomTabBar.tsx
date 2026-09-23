'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',             icon: '⌂',  label: 'Главная'  },
  { href: '/vaccinations', icon: '💉', label: 'Прививки' },
  { href: '/medications',  icon: '💊', label: 'Лекарства'},
  { href: '/profile',      icon: '◯',  label: 'Профиль'  },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: 80,
      background: 'rgba(244,246,255,0.88)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(186,200,255,0.25)',
      display: 'flex',
      alignItems: 'flex-start',
      paddingTop: 10,
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
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontSize: 9,
              fontWeight: active ? 700 : 500,
              color: active ? '#5C7CFA' : '#1A2050',
              letterSpacing: '0.02em',
            }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
