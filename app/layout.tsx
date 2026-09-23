import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karta — карта здоровья",
  description: "Прививки, лекарства и анализы в одном месте.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
