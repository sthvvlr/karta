import { BlobBackground } from '@/components/BlobBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#F4F6FF', minHeight: '100dvh', position: 'relative' }}>
      <BlobBackground />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 430, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px' }}>
        {children}
      </div>
    </div>
  )
}
