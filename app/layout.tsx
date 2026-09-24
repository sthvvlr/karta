import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageRuntime } from "@/app/LanguageRuntime";

export const metadata: Metadata = {
  title: "Karta — карта здоровья",
  description: "Прививки, лекарства и анализы в одном месте.",
  icons: {
    icon: "/karta-icon.png",
    apple: "/karta-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Karta",
    statusBarStyle: "default",
  },
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><LanguageRuntime />{children}</body></html>;
}
