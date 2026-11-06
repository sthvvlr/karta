"use client";

import { useState } from "react";
import markers from "@/app/lab_markers.json";
import { useKartaLanguage } from "@/app/LanguageRuntime";

type Marker = { code: string; ru: string; en: string; unit: string; cat_ru: string; cat_en: string; ref?: { low: number; high: number }; ref_male?: { low: number; high: number }; ref_female?: { low: number; high: number } };
type Indicator = { name: string; markerCode?: string; value: string; unit: string; refLow: string; refHigh: string };

function defaultIndicator(): Indicator { return { name: "", value: "", unit: "", refLow: "", refHigh: "" }; }

function localToday(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function prefilledIndicator(name: string, gender?: string, en = false): Indicator {
  const query = name.trim().toLocaleLowerCase();
  const source = markers as Marker[];
  const marker = source.find((item) => item.ru.trim().toLocaleLowerCase() === query || item.en.trim().toLocaleLowerCase() === query)
    || source.find((item) => `${item.ru} ${item.en}`.toLocaleLowerCase().includes(query));
  const reference = gender === "male" || gender === "мужской" ? marker?.ref_male || marker?.ref
    : gender === "female" || gender === "женский" ? marker?.ref_female || marker?.ref
      : marker?.ref || marker?.ref_female || marker?.ref_male;
  return { name: marker ? (en ? marker.en : marker.ru) : name, markerCode: marker?.code, value: "", unit: marker?.unit || "", refLow: reference ? String(reference.low) : "", refHigh: reference ? String(reference.high) : "" };
}

export function LabResultForm({ action, initial, prefillTitle, prefillTests = [], gender, monitoringMedicationId, monitoringRuleId }: { action: (formData: FormData) => void; initial?: { id?: string; name?: string | null; testedAt?: string | null; notes?: string | null; fileKey?: string | null; indicators?: string | null }; prefillTitle?: string; prefillTests?: string[]; gender?: string | null; monitoringMedicationId?: string; monitoringRuleId?: string }) {
  const en = useKartaLanguage() === "en";
  let parsed: Indicator[] = [];
  try { parsed = JSON.parse(initial?.indicators || "[]") as Indicator[]; } catch { parsed = []; }
  const localizedParsed = parsed.map((item) => {
    const marker = item.markerCode ? (markers as Marker[]).find((entry) => entry.code === item.markerCode) : undefined;
    return marker ? { ...item, name: en ? marker.en : marker.ru } : item;
  });
  const [indicators, setIndicators] = useState<Indicator[]>(localizedParsed.length ? localizedParsed : prefillTests.length ? prefillTests.map((name) => prefilledIndicator(name, gender || undefined, en)) : []);
  const [queries, setQueries] = useState<string[]>(indicators.map(() => ""));
  function update(index: number, patch: Partial<Indicator>) { setIndicators((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  function select(index: number, marker: Marker) {
    const ref = gender === "male" || gender === "мужской"
      ? marker.ref_male || marker.ref
      : gender === "female" || gender === "женский"
        ? marker.ref_female || marker.ref
        : marker.ref || marker.ref_male || marker.ref_female;
    const name = en ? marker.en : marker.ru;
    update(index, { name, markerCode: marker.code, unit: marker.unit, refLow: ref ? String(ref.low) : "", refHigh: ref ? String(ref.high) : "" });
    setQueries((items) => items.map((item, i) => i === index ? name : item));
  }
  return <form action={action} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 9, marginTop: 13, minWidth: 0 }}>
    {initial?.id && <input type="hidden" name="id" value={initial.id} />}
    {monitoringMedicationId && monitoringRuleId && <><input type="hidden" name="monitoringMedicationId" value={monitoringMedicationId} /><input type="hidden" name="monitoringRuleId" value={monitoringRuleId} /></>}
    <input name="name" required defaultValue={initial?.name || prefillTitle || ""} placeholder={en ? "Test name" : "Название анализа"} style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <input name="testedAt" type="date" required defaultValue={initial?.testedAt || localToday()} style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2050", marginTop: 4 }}>{en ? "Indicators" : "Показатели"}</div>
    {indicators.length === 0 && <div style={{ padding: "14px 12px", borderRadius: 12, background: "rgba(244,246,255,.65)", color: "rgba(26,32,80,.48)", fontSize: 13 }}>{en ? "No indicators yet" : "Показатели ещё не добавлены"}</div>}
    {indicators.map((item, index) => { const q = queries[index] ?? item.name; const suggestions = !item.markerCode && q.trim().length >= 2 ? (markers as Marker[]).filter((marker) => `${marker.ru} ${marker.en}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []; return <div key={index} style={{ padding: 10, background: "rgba(244,246,255,.65)", borderRadius: 12, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 7, position: "relative", minWidth: 0 }}>
      <div style={{ display: "flex", gap: 6 }}><input value={q} onChange={(event) => { setQueries((items) => items.map((value, i) => i === index ? event.target.value : value)); update(index, { name: event.target.value, markerCode: undefined }); }} placeholder={en ? "Start typing a marker" : "Начните вводить показатель"} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /><button type="button" aria-label={en ? "Remove indicator" : "Удалить показатель"} onClick={() => { setIndicators((items) => items.filter((_, i) => i !== index)); setQueries((items) => items.filter((_, i) => i !== index)); }} style={{ border: 0, background: "transparent", color: "#E03131", fontSize: 16 }}>×</button></div>
      {suggestions.length > 0 && <div style={{ position: "absolute", left: 10, right: 34, top: 48, zIndex: 3, background: "white", border: "1px solid #DCE3FF", borderRadius: 9, boxShadow: "0 8px 20px rgba(26,32,80,.12)", overflow: "hidden" }}>{suggestions.map((marker) => <button type="button" key={marker.code} onClick={() => select(index, marker)} style={{ width: "100%", textAlign: "left", border: 0, borderBottom: "1px solid #EEF1FF", background: "white", padding: "8px 10px", color: "#1A2050" }}><b>{en ? marker.en : marker.ru}</b><small style={{ display: "block", color: "rgba(26,32,80,.5)" }}>{en ? marker.cat_en : marker.cat_ru} · {marker.unit}</small></button>)}</div>}
      <div style={{ display: "flex", gap: 7 }}><input value={item.value} onChange={(event) => update(index, { value: event.target.value })} placeholder={en ? "Value" : "Значение"} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /><input value={item.unit} onChange={(event) => update(index, { unit: event.target.value })} placeholder={en ? "Unit" : "Единицы"} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></div>
      <div style={{ display: "flex", gap: 7 }}><input value={item.refLow} onChange={(event) => update(index, { refLow: event.target.value })} placeholder={en ? "Reference from" : "Норма от"} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /><input value={item.refHigh} onChange={(event) => update(index, { refHigh: event.target.value })} placeholder={en ? "Reference to" : "Норма до"} style={{ flex: 1, minWidth: 0, padding: "8px 10px", border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></div>
    </div> })}
    <button type="button" onClick={() => { setIndicators((items) => [...items, defaultIndicator()]); setQueries((items) => [...items, ""]); }} style={{ padding: 9, border: "1px dashed #BAC8FF", borderRadius: 10, background: "transparent", color: "#5C7CFA", fontWeight: 700 }}>{en ? "+ Add indicator" : "+ Добавить показатель"}</button>
    <textarea name="notes" defaultValue={initial?.notes || ""} placeholder={en ? "Notes (optional)" : "Заметки (необязательно)"} rows={2} style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,.8)", border: "1px solid rgba(186,200,255,.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    {initial?.fileKey && initial.id && <div style={{ display: "grid", gap: 8, padding: "10px 11px", background: "rgba(244,246,255,.72)", borderRadius: 11 }}><a href={`/api/labs/${initial.id}/file`} target="_blank" rel="noreferrer" style={{ color: "#5C7CFA", fontSize: 12, fontWeight: 600 }}>{en ? "Open attached file" : "Открыть прикреплённый файл"}</a><label style={{ display: "flex", alignItems: "center", gap: 7, color: "#E03131", fontSize: 12 }}><input type="checkbox" name="removeFile" value="true" />{en ? "Remove attached file" : "Удалить прикреплённый файл"}</label></div>}
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>{en ? "Photo or PDF of result" : "Фото или PDF результата"}<input name="file" type="file" accept="image/*,.pdf" style={{ display: "block", marginTop: 5, width: "100%", fontSize: 13 }} /></label>
    <input type="hidden" name="indicators" value={JSON.stringify(indicators.filter((item) => item.name.trim() || item.value.trim()))} />
    <button type="submit" style={{ padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700 }}>{initial?.id ? (en ? "Save changes" : "Сохранить изменения") : (en ? "Save result" : "Сохранить результат")}</button>
  </form>;
}
