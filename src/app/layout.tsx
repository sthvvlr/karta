import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Karta — Ваше здоровье',
  description: 'Паспорт здоровья в кармане',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: '#F4F6FF', minHeight: '100dvh' }}>
        {children}
      </body>
    </html>
  )
}
