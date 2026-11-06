import { BlobBackground } from "@/components/BlobBackground";
import { BottomTabBar } from "@/components/BottomTabBar";
import { WebMcpTools } from "@/app/WebMcpTools";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getChatGPTUser();
  return (
    <div style={{ background: "#F4F6FF", minHeight: "100dvh", position: "relative" }}>
      <BlobBackground />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 430, margin: "0 auto", minHeight: "100dvh" }}>
        <WebMcpTools />
        <main style={{ paddingBottom: user ? "calc(100px + env(safe-area-inset-bottom, 0px))" : 24 }}>{children}</main>
        {user && <BottomTabBar />}
      </div>
    </div>
  );
}
