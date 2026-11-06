"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, FileText, Paperclip, TestTube2, Trash2, X } from "lucide-react";
import { deleteLabResult } from "@/app/actions";
import markers from "@/app/lab_markers.json";
import { LabResultSheet } from "@/app/LabResultSheet";
import { useKartaLanguage } from "@/app/LanguageRuntime";

type Indicator = { name: string; markerCode?: string; value: string; unit?: string; refLow?: string; refHigh?: string };
type Result = { id: string; name: string | null; testedAt: string | null; notes: string | null; fileKey: string | null; indicators: string | null; result: string | null; unit: string | null };
type Marker = { code: string; cat_ru: string; cat_en: string };

const markerCategories = new Map((markers as Marker[]).map((marker) => [marker.code, marker]));
const C = { text: "#1A2050", muted: "rgba(26,32,80,.48)", card: "rgba(255,255,255,.76)", border: "rgba(255,255,255,.92)", primary: "#5C7CFA" };

function parseIndicators(raw: string | null): Indicator[] {
  try { return JSON.parse(raw || "[]") as Indicator[]; } catch { return []; }
}

function statusOf(item: Indicator): "low" | "high" | "normal" | "unknown" {
  const match = String(item.value).replace(/,/g, ".").replace(/\s/g, "").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
  const value = match ? Number(match[0]) : Number.NaN;
  const low = Number(item.refLow);
  const high = Number(item.refHigh);
  if (!Number.isFinite(value)) return "unknown";
  if (Number.isFinite(low) && value < low) return "low";
  if (Number.isFinite(high) && value > high) return "high";
  return Number.isFinite(low) || Number.isFinite(high) ? "normal" : "unknown";
}

export function LabResultsList({ rows, gender }: { rows: Result[]; gender?: string | null }) {
  const en = useKartaLanguage() === "en";
  const [selected, setSelected] = useState<Result | null>(null);
  const locale = en ? "en-US" : "ru-RU";

  return <div style={{ display: "grid", gap: 8, paddingBottom: 28 }}>
    {rows.map((row) => {
      const indicators = parseIndicators(row.indicators);
      const abnormalCount = indicators.filter((item) => ["low", "high"].includes(statusOf(item))).length;
      const hasKnownValue = indicators.some((item) => statusOf(item) !== "unknown");
      const date = row.testedAt
        ? new Date(`${row.testedAt.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
        : (en ? "Date not specified" : "Дата не указана");

      return <button key={row.id} type="button" onClick={() => setSelected(row)} aria-label={`${row.name || (en ? "Lab result" : "Анализ")}, ${date}`} style={{ width: "100%", padding: 13, textAlign: "left", color: C.text, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 1px 8px rgba(26,32,80,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, flex: "0 0 38px", display: "grid", placeItems: "center", borderRadius: 10, background: "rgba(92,124,250,.12)", color: C.primary }}><TestTube2 size={17} /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name || (en ? "Lab result" : "Анализ")}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{date}</div></div>
          {row.fileKey && <Paperclip size={14} color={C.muted} />}
          <ChevronRight size={15} color="rgba(26,32,80,.3)" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 0 48px" }}>
          {abnormalCount > 0 ? <span style={badgeStyle("#E03131")}>{en ? `${abnormalCount} abnormal` : `${abnormalCount} отклон.`}</span> : hasKnownValue ? <span style={badgeStyle("#099268")}>{en ? "Normal" : "В норме"}</span> : null}
          <span style={{ color: C.muted, fontSize: 11 }}>{en ? `${indicators.length} values` : `${indicators.length} показ.`}</span>
        </div>
      </button>;
    })}
    {selected && <LabResultDetailSheet result={selected} gender={gender} en={en} onClose={() => setSelected(null)} onDeleted={() => setSelected(null)} />}
  </div>;
}

function LabResultDetailSheet({ result, gender, en, onClose, onDeleted }: { result: Result; gender?: string | null; en: boolean; onClose: () => void; onDeleted: () => void }) {
  const [showFile, setShowFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const locale = en ? "en-US" : "ru-RU";
  const indicators = parseIndicators(result.indicators);
  const groups: Array<{ label: string; items: Indicator[] }> = [];
  for (const item of indicators) {
    const marker = item.markerCode ? markerCategories.get(item.markerCode) : undefined;
    const label = marker ? (en ? marker.cat_en : marker.cat_ru) : (en ? "Other" : "Другое");
    let group = groups.find((value) => value.label === label);
    if (!group) { group = { label, items: [] }; groups.push(group); }
    group.items.push(item);
  }
  const title = result.name || (en ? "Lab result" : "Анализ");
  const endpoint = `/api/labs/${encodeURIComponent(result.id)}/file`;
  const date = result.testedAt
    ? new Date(`${result.testedAt.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : (en ? "Date not specified" : "Дата не указана");

  return <>
  <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
    <section role="dialog" aria-modal="true" aria-label={title} style={{ width: "min(100%, 430px)", maxHeight: "92dvh", overflow: "auto", padding: "10px 18px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 15 }}>
        <button type="button" onClick={onClose} aria-label={en ? "Close" : "Закрыть"} style={iconButton()}><X size={18} /></button>
        <div style={{ minWidth: 0, flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <LabResultSheet initial={{ id: result.id, name: result.name, testedAt: result.testedAt, notes: result.notes, fileKey: result.fileKey, indicators: result.indicators }} gender={gender} onSaved={onClose} />
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{date}</div>

      {result.fileKey && <button type="button" onClick={() => setShowFile(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: 14, border: 0, borderRadius: 12, background: "rgba(92,124,250,.07)", color: C.primary, textAlign: "left", fontSize: 14, fontWeight: 650 }}><FileText size={17} />{en ? "Open source file" : "Открыть исходный файл"}<ChevronRight size={14} style={{ marginLeft: "auto" }} /></button>}

      {groups.map((group) => <section key={group.label} style={{ marginBottom: 14 }}><div style={{ margin: "0 2px 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: C.muted }}>{group.label.toLocaleUpperCase(locale)}</div><div style={{ background: "white", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(26,32,80,.04)" }}>{group.items.map((item, index) => {
        const status = statusOf(item);
        const color = status === "low" || status === "high" ? "#E03131" : status === "normal" ? "#099268" : C.muted;
        const refs = [item.refLow, item.refHigh].filter(Boolean).join("–");
        return <div key={`${item.markerCode || item.name}:${index}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderBottom: index < group.items.length - 1 ? "1px solid rgba(26,32,80,.07)" : 0 }}>
          <span style={{ width: 8, height: 8, flex: "0 0 8px", borderRadius: "50%", background: color }} />
          <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 550 }}>{item.name}</div>{(refs || item.unit) && <div style={{ marginTop: 2, color: C.muted, fontSize: 11 }}>{refs && `${en ? "Ref: " : "Норма: "}${refs}`}{refs && item.unit ? " " : ""}{item.unit || ""}</div>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, textAlign: "right", whiteSpace: "nowrap", color, fontSize: 15, fontWeight: 650 }}>{item.value}{item.unit && <small style={{ color: C.muted, fontSize: 10 }}>{item.unit}</small>}{status === "low" && <ArrowDown size={12} />}{status === "high" && <ArrowUp size={12} />}</div>
        </div>;
      })}</div></section>)}
      {indicators.length === 0 && <div style={{ marginBottom: 16, color: C.muted, fontSize: 13 }}>{result.result || (en ? "No values added" : "Показатели не добавлены")}{result.unit ? ` ${result.unit}` : ""}</div>}
      {result.notes && <section style={{ margin: "12px 0 18px" }}><div style={{ marginBottom: 5, color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: ".06em" }}>{en ? "NOTE" : "ЗАМЕТКА"}</div><div style={{ fontSize: 13, lineHeight: 1.5 }}>{result.notes}</div></section>}
      <button type="button" onClick={() => { setDeleteError(false); setShowDeleteConfirm(true); }} style={{ width: "100%", padding: 12, border: 0, borderRadius: 12, background: "rgba(224,49,49,.08)", color: "#E03131", fontSize: 14, fontWeight: 600 }}><Trash2 size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} />{en ? "Delete result" : "Удалить анализ"}</button>
    </section>
  </div>
  {showDeleteConfirm && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setShowDeleteConfirm(false); }} style={{ position: "fixed", inset: 0, zIndex: 160, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "12px 12px calc(12px + env(safe-area-inset-bottom))", background: "rgba(20,25,55,.48)", backdropFilter: "blur(7px)" }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="lab-delete-title" aria-describedby="lab-delete-description" style={{ width: "min(100%, 430px)", padding: 12, border: "1px solid rgba(255,255,255,.8)", borderRadius: 22, background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: C.text, textAlign: "center" }}>
      <div style={{ padding: "12px 10px 16px" }}>
        <h2 id="lab-delete-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{en ? "Delete this result?" : "Удалить этот анализ?"}</h2>
        <p id="lab-delete-description" style={{ margin: "6px 0 0", color: C.muted, fontSize: 13 }}>{en ? "This action can't be undone." : "Это действие нельзя отменить."}</p>
        {deleteError && <p role="alert" style={{ margin: "10px 0 0", color: "#E03131", fontSize: 12 }}>{en ? "Couldn't delete the result. Try again." : "Не удалось удалить анализ. Попробуйте ещё раз."}</p>}
      </div>
      <button type="button" disabled={isDeleting} onClick={async () => {
        const formData = new FormData();
        formData.set("id", result.id);
        setIsDeleting(true);
        setDeleteError(false);
        try { await deleteLabResult(formData); onDeleted(); }
        catch { setIsDeleting(false); setDeleteError(true); }
      }} style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 14, background: "white", color: "#E03131", fontSize: 16, fontWeight: 650, opacity: isDeleting ? .55 : 1 }}>{isDeleting ? (en ? "Deleting…" : "Удаление…") : (en ? "Delete result" : "Удалить анализ")}</button>
      <button type="button" disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)} style={{ width: "100%", minHeight: 48, marginTop: 8, border: 0, borderRadius: 14, background: "white", color: C.text, fontSize: 16, fontWeight: 650, opacity: isDeleting ? .55 : 1 }}>{en ? "Cancel" : "Отмена"}</button>
    </section>
  </div>}
  {showFile && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowFile(false); }} style={{ position: "fixed", inset: 0, zIndex: 140, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.48)", backdropFilter: "blur(7px)" }}><section role="dialog" aria-modal="true" aria-label={en ? "Source file" : "Исходный файл"} style={{ width: "min(100%, 430px)", height: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", color: C.text }}><header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 16px" }}><span style={{ width: 34 }} /><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{en ? "File" : "Файл"}</h2><button type="button" onClick={() => setShowFile(false)} aria-label={en ? "Close" : "Закрыть"} style={iconButton()}><X size={18} /></button></header><iframe src={endpoint} title={en ? "Lab result source file" : "Исходный файл анализа"} style={{ width: "100%", flex: 1, border: 0, background: "white" }} /></section></div>}
  </>;
}

function badgeStyle(color: string): React.CSSProperties { return { color, background: `${color}16`, borderRadius: 99, padding: "4px 8px", fontSize: 10, fontWeight: 700 }; }
function iconButton(): React.CSSProperties { return { width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: C.text }; }
