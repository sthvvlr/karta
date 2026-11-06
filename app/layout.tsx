import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = (await cookies()).get("karta_lang")?.value === "en" ? "en" : "ru";
  return <html lang={lang}><body><LanguageRuntime initialLanguage={lang}>{children}</LanguageRuntime></body></html>;
}
