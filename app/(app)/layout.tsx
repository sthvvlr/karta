import { BlobBackground } from "@/components/BlobBackground";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#F4F6FF", minHeight: "100dvh", position: "relative" }}>
      <BlobBackground />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 430, margin: "0 auto", minHeight: "100dvh" }}>
        <main style={{ paddingBottom: 96 }}>{children}</main>
        <BottomTabBar />
      </div>
    </div>
  );
}
