"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Syringe, X } from "lucide-react";
import { useKartaLanguage } from "@/app/LanguageRuntime";

type PendingVaccine = { id: string; name: string; nameEn?: string; description?: string | null; descriptionEn?: string | null };
type OverdueDose = { key: string; nameRu: string; nameEn?: string; doseNumber: number; totalDoses: number; dueDate: string };

export function ScoreDetails({ score, pending, overdue = [], children }: { score: number; pending: PendingVaccine[]; overdue?: OverdueDose[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const en = useKartaLanguage() === "en";
  const sheetTitle = en ? "My Score" : "Мой скор";
  const formatDate = (value: string) => {
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(date);
  };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={en ? "Open Karta Score details" : "Открыть подробности Karta Score"} style={{ width: "100%", display: "block", border: 0, background: "transparent", padding: 0, color: "inherit", cursor: "pointer", font: "inherit" }}>{children}</button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", justifyContent: "center", alignItems: "flex-end", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-labelledby="score-sheet-title" style={{ width: "min(100%, 430px)", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "#F4F6FF", color: "#1A2050", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div style={{ flex: "none", padding: "9px 16px 8px", borderBottom: "1px solid rgba(26,32,80,.08)", background: "rgba(255,255,255,.56)" }}>
          <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 4, background: "rgba(26,32,80,.18)", margin: "0 auto 8px" }} />
          <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ width: 34 }} /><h2 id="score-sheet-title" style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>{sheetTitle}</h2><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "transparent", color: "#5C7CFA" }}><X size={19} /></button></div>
        </div>
        <div style={{ overflowY: "auto", overscrollBehavior: "contain", padding: 20 }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 110, height: 110, borderRadius: "50%", padding: 8, display: "grid", placeItems: "center", background: `conic-gradient(from 0deg, #748FFC ${score}%, rgba(26,32,80,.07) ${score}% 100%)` }}><div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "grid", placeItems: "center", background: "#F4F6FF" }}><div style={{ textAlign: "center" }}><b style={{ display: "block", color: "#5C7CFA", fontSize: 32, lineHeight: 1 }}>{score}</b><span style={{ color: "rgba(26,32,80,.42)", fontSize: 13 }}>/ 100</span></div></div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700 }}>Karta Score</div><div style={{ maxWidth: 310, marginTop: 4, color: "rgba(26,32,80,.42)", fontSize: 13, lineHeight: 1.45 }}>{en ? "Complete all recommended vaccines to reach a score of 100" : "Сделайте все рекомендованные прививки, чтобы получить скор 100"}</div></div>
          </div>

          {overdue.length > 0 && <section style={{ marginBottom: 20 }}><h3 style={{ margin: "0 0 10px", color: "#E03131", fontSize: 13, fontWeight: 650 }}>{en ? "Overdue doses" : "Просроченные дозы"}</h3><div style={{ display: "grid", gap: 8 }}>{overdue.map((item) => <div key={item.key} style={{ minHeight: 58, display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid rgba(224,49,49,.25)", borderRadius: 12, background: "rgba(255,255,255,.72)" }}><div style={{ width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(224,49,49,.1)" }}><Syringe size={15} color="#E03131" /></div><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{en ? item.nameEn || item.nameRu : item.nameRu}</div><div style={{ marginTop: 2, color: "rgba(26,32,80,.42)", fontSize: 11 }}>{item.totalDoses > 1 ? en ? `Dose ${item.doseNumber} of ${item.totalDoses}` : `Доза ${item.doseNumber} из ${item.totalDoses}` : en ? "Booster" : "Ревакцинация"}</div></div><span style={{ color: "#E03131", fontSize: 12, fontWeight: 650, whiteSpace: "nowrap" }}>{formatDate(item.dueDate)}</span></div>)}</div></section>}

          {pending.length > 0 ? <section><h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 650 }}>{en ? "Recommended vaccines" : "Рекомендованные прививки"}</h3><div style={{ display: "grid", gap: 8 }}>{pending.map((item) => <div key={item.id} style={{ minHeight: 58, display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid rgba(255,255,255,.9)", borderRadius: 12, background: "rgba(255,255,255,.72)" }}><div style={{ width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(92,124,250,.1)" }}><Syringe size={15} color="#5C7CFA" /></div><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>{en ? item.nameEn || item.name : item.name}</div>{(en ? item.descriptionEn || item.description : item.description) && <div style={{ marginTop: 2, overflow: "hidden", color: "rgba(26,32,80,.42)", fontSize: 11, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{en ? item.descriptionEn || item.description : item.description}</div>}</div></div>)}</div></section> : overdue.length === 0 && <div style={{ padding: 12, borderRadius: 12, background: "#E8FAF1", color: "#087F5B", fontSize: 13 }}>{en ? "There are no outstanding recommendations based on your current information." : "По текущим данным рекомендаций не осталось."}</div>}
        </div>
      </section>
    </div>}
  </>;
}
