"use client";

import { useState } from "react";
import markers from "@/app/lab_markers.json";

type Marker = { code: string; ru: string; en: string; unit: string; cat_ru: string; ref?: { low: number; high: number }; ref_male?: { low: number; high: number }; ref_female?: { low: number; high: number } };
type Indicator = { name: string; markerCode?: string; value: string; unit: string; refLow: string; refHigh: string };

function defaultIndicator(): Indicator { return { name: "", value: "", unit: "", refLow: "", refHigh: "" }; }

export function LabResultForm({ action, initial }: { action: (formData: FormData) => void; initial?: { id?: string; name?: string | null; testedAt?: string | null; notes?: string | null; fileKey?: string | null; indicators?: string | null } }) {
  let parsed: Indicator[] = [];
  try { parsed = JSON.parse(initial?.indicators || "[]") as Indicator[]; } catch { parsed = []; }
  const [indicators, setIndicators] = useState<Indicator[]>(parsed.length ? parsed : [defaultIndicator()]);
  const [queries, setQueries] = useState<string[]>(indicators.map(() => ""));
  function update(index: number, patch: Partial<Indicator>) { setIndicators((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  function select(index: number, marker: Marker) {
    const ref = marker.ref || marker.ref_female || marker.ref_male;
    update(index, { name: marker.ru, markerCode: marker.code, unit: marker.unit, refLow: ref ? String(ref.low) : "", refHigh: ref ? String(ref.high) : "" });
    setQueries((items) => items.map((item, i) => i === index ? marker.ru : item));
  }
  return <form action={action} style={{ display: "grid", gap: 9, marginTop: 13 }}>
    {initial?.id && <input type="hidden" name="id" value={initial.id} />}
    <input name="name" required defaultValue={initial?.name || ""} placeholder="Название анализа" style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <input name="testedAt" type="date" defaultValue={initial?.testedAt || ""} style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2050", marginTop: 4 }}>Показатели</div>
    {indicators.map((item, index) => { const q = queries[index] ?? item.name; const suggestions = !item.markerCode && q.trim().length >= 2 ? (markers as Marker[]).filter((marker) => `${marker.ru} ${marker.en}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []; return <div key={index} style={{ padding: 10, background: "rgba(244,246,255,.65)", borderRadius: 12, display: "grid", gap: 7, position: "relative" }}>
      <div style={{ display: "flex", gap: 6 }}><input value={q} onChange={(event) => { setQueries((items) => items.map((value, i) => i === index ? event.target.value : value)); update(index, { name: event.target.value, markerCode: undefined }); }} placeholder="Начните вводить показатель" style={{ flex: 1, minWidth: 0, padding: "9px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 14 }} /><button type="button" onClick={() => { setIndicators((items) => items.filter((_, i) => i !== index)); setQueries((items) => items.filter((_, i) => i !== index)); }} style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 16 }}>×</button></div>
      {suggestions.length > 0 && <div style={{ position: "absolute", left: 10, right: 34, top: 48, zIndex: 3, background: "white", border: "1px solid #DCE3FF", borderRadius: 9, boxShadow: "0 8px 20px rgba(26,32,80,.12)", overflow: "hidden" }}>{suggestions.map((marker) => <button type="button" key={marker.code} onClick={() => select(index, marker)} style={{ width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #EEF1FF", background: "white", padding: "8px 10px", color: "#1A2050" }}><b>{marker.ru}</b><small style={{ display: "block", color: "rgba(26,32,80,.5)" }}>{marker.cat_ru} · {marker.unit}</small></button>)}</div>}
      <div style={{ display: "flex", gap: 7 }}><input value={item.value} onChange={(event) => update(index, { value: event.target.value })} placeholder="Значение" required={index === 0} style={{ flex: 1, minWidth: 0, padding: "9px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 14 }} /><input value={item.unit} onChange={(event) => update(index, { unit: event.target.value })} placeholder="Единицы" style={{ flex: 1, minWidth: 0, padding: "9px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 14 }} /></div>
      <div style={{ display: "flex", gap: 7 }}><input value={item.refLow} onChange={(event) => update(index, { refLow: event.target.value })} placeholder="Норма от" style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 13 }} /><input value={item.refHigh} onChange={(event) => update(index, { refHigh: event.target.value })} placeholder="Норма до" style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 13 }} /></div>
    </div> })}
    <button type="button" onClick={() => { setIndicators((items) => [...items, defaultIndicator()]); setQueries((items) => [...items, ""]); }} style={{ padding: 9, border: "1px dashed #BAC8FF", borderRadius: 10, background: "transparent", color: "#5C7CFA", fontWeight: 700 }}>+ Добавить показатель</button>
    <textarea name="notes" defaultValue={initial?.notes || ""} placeholder="Заметки (необязательно)" rows={2} style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>Фото или PDF результата<input name="file" type="file" accept="image/*,.pdf" style={{ display: "block", marginTop: 5, width: "100%", fontSize: 13 }} /></label>
    <input type="hidden" name="indicators" value={JSON.stringify(indicators.filter((item) => item.name.trim() || item.value.trim()))} />
    <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>{initial?.id ? "Сохранить изменения" : "Сохранить результат"}</button>
  </form>;
}
