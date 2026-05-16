import type { Metadata } from 'next'
import './globals.css'
import { BlobBackground } from '@/components/BlobBackground'
import { BottomTabBar } from '@/components/BottomTabBar'

export const metadata: Metadata = {
  title: 'Karta — Ваше здоровье',
  description: 'Паспорт здоровья в кармане',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: '#F4F6FF', minHeight: '100dvh' }}>
        <BlobBackground />
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 430,
          margin: '0 auto',
          minHeight: '100dvh',
        }}>
          <main style={{ paddingBottom: 96 }}>
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  )
}
