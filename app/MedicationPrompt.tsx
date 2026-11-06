"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pill } from "lucide-react";

export function MedicationPrompt({ en }: { en: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem("karta-med-prompt-dismissed") !== "1");
  }, []);

  function dismiss() {
    window.localStorage.setItem("karta-med-prompt-dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;
  return <section style={{ margin: "0 0 14px", background: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.9)", borderRadius: 20, padding: 16, boxShadow: "0 2px 16px rgba(26,32,80,.045)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Pill size={16} color="#5C7CFA" style={{ opacity: .72 }} /><div style={{ fontSize: 14, fontWeight: 650, color: "#1A2050" }}>{en ? "Do you take any medications?" : "Вы принимаете лекарства?"}</div></div>
    <div style={{ fontSize: 12, color: "rgba(26,32,80,.48)", marginTop: 9, lineHeight: 1.4 }}>{en ? "Add them to your schedule and get daily reminders" : "Добавьте их в расписание и получайте ежедневные напоминания"}</div>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <Link href="/medications?add=1" onClick={dismiss} style={{ flex: 1, display: "grid", placeItems: "center", minHeight: 40, borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontSize: 13, fontWeight: 650, textDecoration: "none" }}>{en ? "Yes, add them" : "Да, добавить"}</Link>
      <button type="button" onClick={dismiss} style={{ flex: 1, minHeight: 40, border: "1px solid rgba(186,200,255,.4)", borderRadius: 10, background: "rgba(244,246,255,.6)", color: "rgba(26,32,80,.58)", fontSize: 13, fontWeight: 550 }}>{en ? "Not now" : "Пока нет"}</button>
    </div>
  </section>;
}
