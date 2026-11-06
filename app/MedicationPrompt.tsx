"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  return <section style={{ marginBottom: 18, background: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.9)", borderRadius: 16, padding: "13px 14px" }}>
    <div style={{ fontSize: 13, fontWeight: 700 }}>{en ? "Do you take any medications?" : "Вы принимаете лекарства?"}</div>
    <div style={{ fontSize: 11, color: "rgba(26,32,80,.42)", marginTop: 4 }}>{en ? "Add them to your schedule and track each dose." : "Добавьте их в расписание и отмечайте каждый приём."}</div>
    <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 9 }}>
      <Link href="/medications?add=1" onClick={dismiss} style={{ color: "#5C7CFA", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{en ? "Yes, add →" : "Да, добавить →"}</Link>
      <button type="button" onClick={dismiss} style={{ border: 0, padding: 0, background: "transparent", color: "rgba(26,32,80,.42)", fontSize: 12 }}>{en ? "Not now" : "Пока нет"}</button>
    </div>
  </section>;
}
