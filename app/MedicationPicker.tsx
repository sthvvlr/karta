"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import medications from "./medications_ru.json";
import { useKartaLanguage } from "@/app/LanguageRuntime";

export type MedicationCatalogEntry = { id: string; ru: string; en: string };

export function MedicationPicker({ label, initialName = "", initialCode = "", nameError = false, onNameChange, onSuggestionsChange, renderSuggestions = true }: { label: string; initialName?: string; initialCode?: string; nameError?: boolean; onNameChange?: () => void; onSuggestionsChange?: (items: MedicationCatalogEntry[], select: (item: MedicationCatalogEntry) => void) => void; renderSuggestions?: boolean }) {
  const [value, setValue] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [open, setOpen] = useState(false);
  const lang = useKartaLanguage();
  const results = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length < 2 || !open) return [];
    const source = medications as MedicationCatalogEntry[];
    return source.filter((item) => item.ru.toLowerCase().includes(query) || item.en.toLowerCase().includes(query)).slice(0, 8);
  }, [value, open]);
  const selectSuggestion = useCallback((item: MedicationCatalogEntry) => {
    setValue(lang === "en" ? item.en : item.ru);
    setCode(item.id);
    setOpen(false);
  }, [lang]);
  useEffect(() => { onSuggestionsChange?.(results, selectSuggestion); }, [onSuggestionsChange, results, selectSuggestion]);
  return <div style={{ position: "relative" }}>
    <input value={value} onChange={(event) => { setValue(event.target.value); setCode(""); setOpen(true); onNameChange?.(); }} onBlur={() => window.setTimeout(() => setOpen(false), 150)} name="name" aria-label={label} aria-invalid={nameError} placeholder={lang === "en" ? "e.g. Ibuprofen" : "Например, Ибупрофен"} autoComplete="off" style={{ display: "block", width: "100%", minHeight: 32, boxSizing: "border-box", padding: "0 16px 12px", background: "transparent", border: 0, outlineColor: nameError ? "#E03131" : "#5C7CFA", fontSize: 15, color: "#1A2050" }} />
    <input type="hidden" name="drugCode" value={code} />
    {renderSuggestions && results.length > 0 && <div style={{ margin: "0 12px 10px", background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,.04)", overflow: "hidden" }}>{results.map((item) => <button type="button" key={item.id} onMouseDown={(event) => { event.preventDefault(); selectSuggestion(item); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: 0, borderBottom: "1px solid rgba(26,32,80,0.06)", background: "white", color: "#1A2050", fontSize: 14 }}><span style={{ display: "block", fontWeight: 600 }}>{lang === "en" ? item.en : item.ru}</span>{item.en && <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "rgba(26,32,80,0.45)" }}>{lang === "en" ? item.ru : item.en}</span>}</button>)}</div>}
  </div>;
}
