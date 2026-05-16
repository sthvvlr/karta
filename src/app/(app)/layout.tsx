import { BottomTabBar } from '@/components/BottomTabBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{ paddingBottom: 96 }}>{children}</main>
      <BottomTabBar />
    </>
  )
}
