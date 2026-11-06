"use client";

import { useRef } from "react";

type PendingVaccine = { id: string; name: string; description?: string | null };
type OverdueDose = { key: string; nameRu: string; doseNumber: number; totalDoses: number; dueDate: string };

export function ScoreDetails({ score, pending, overdue = [] }: { score: number; pending: PendingVaccine[]; overdue?: OverdueDose[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialogRef.current?.showModal()} style={{ width: "100%", textAlign: "left", border: 0, background: "transparent", padding: 0, color: "inherit", cursor: "pointer" }} aria-label="Подробнее о Karta Score">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>Подробнее о Karta Score · {score}/100</span><span style={{ color: "#5C7CFA", fontSize: 18 }}>›</span></div>
    </button>
    <dialog ref={dialogRef} style={{ width: "min(390px, calc(100% - 28px))", border: 0, borderRadius: 22, padding: 0, color: "#1A2050", boxShadow: "0 18px 60px rgba(26,32,80,.25)" }}>
      <div style={{ padding: 22, background: "#F4F6FF", maxHeight: "82dvh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Закрыть" style={{ border: 0, background: "white", borderRadius: "50%", width: 32, height: 32, color: "#5C7CFA", fontSize: 18 }}>×</button></div>
        <div style={{ display: "grid", placeItems: "center", margin: "2px 0 15px" }}><div style={{ width: 116, height: 116, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(#5C7CFA ${score}%, #E5E9FF 0)`, position: "relative" }}><div style={{ width: 96, height: 96, borderRadius: "50%", background: "#F4F6FF", display: "grid", placeItems: "center", textAlign: "center" }}><div><b style={{ display: "block", fontSize: 30, lineHeight: 1 }}>{score}</b><span style={{ fontSize: 12, color: "rgba(26,32,80,.5)" }}>/ 100</span></div></div></div></div>
        <h2 style={{ textAlign: "center", fontSize: 20, margin: "0 0 5px" }}>Karta Score</h2>
        <p style={{ textAlign: "center", color: "rgba(26,32,80,.56)", fontSize: 13, lineHeight: 1.45, margin: "0 0 18px" }}>Сделайте рекомендованные прививки, чтобы получить скор 100.</p>
        {overdue.length > 0 && <section style={{ marginBottom: 18 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#E03131", marginBottom: 8 }}>Просроченные дозы</div><div style={{ display: "grid", gap: 7 }}>{overdue.map((item) => <div key={item.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "white", border: "1px solid rgba(224,49,49,.22)", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}><div><b>{item.nameRu}</b><div style={{ color: "rgba(26,32,80,.55)", fontSize: 11, marginTop: 3 }}>{item.totalDoses > 1 ? `Доза ${item.doseNumber} из ${item.totalDoses}` : "Ревакцинация"}</div></div><b style={{ color: "#E03131", whiteSpace: "nowrap" }}>{item.dueDate}</b></div>)}</div></section>}
        {pending.length > 0 ? <div><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Рекомендованные прививки</div><div style={{ display: "grid", gap: 7 }}>{pending.map((item) => <div key={item.id} style={{ background: "white", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}><b>{item.name}</b>{item.description && <div style={{ color: "rgba(26,32,80,.55)", fontSize: 11, marginTop: 3 }}>{item.description}</div>}</div>)}</div></div> : overdue.length === 0 && <div style={{ background: "#E8FAF1", borderRadius: 12, padding: 12, fontSize: 13, color: "#087F5B" }}>По текущим данным рекомендаций не осталось.</div>}
      </div>
    </dialog>
  </>;
}
