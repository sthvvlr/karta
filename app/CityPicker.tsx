"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, LoaderCircle, Map, MapPin, Search, X } from "lucide-react";

type City = { id: string; city: string; region: string; country: string; countryCode: string; label: string };
const text = "#1A2050";
const muted = "rgba(26,32,80,.48)";

export function CityPicker({ initialCity = "", initialRegion = "", initialCountry = "", initialCountryCode = "", fieldPrefix = "cityCurrent", onSelectionChange, en = false }: { initialCity?: string; initialRegion?: string; initialCountry?: string; initialCountryCode?: string; fieldPrefix?: string; onSelectionChange?: (city: City | null) => void; en?: boolean }) {
  const [selected, setSelected] = useState<City | null>(initialCity ? { id: "initial", city: initialCity, region: initialRegion, country: initialCountry, countryCode: initialCountryCode, label: "" } : null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setResults([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = await response.json() as { cities?: City[] };
        setResults(data.cities || []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function choose(city: City) {
    setSelected(city);
    setOpen(false);
    setQuery("");
    setResults([]);
    onSelectionChange?.(city);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${en ? "Choose city" : "Выберите город"}: ${selected?.city || (en ? "not selected" : "не выбран")}`} style={{ width: "100%", display: "block", padding: 13, border: `1px solid ${selected ? "rgba(92,124,250,.3)" : "rgba(255,255,255,.9)"}`, borderRadius: 12, background: "rgba(255,255,255,.72)", color: text, textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,.03)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ flex: 1, minWidth: 0, fontSize: 14, color: selected ? text : muted }}>{selected?.city || (en ? "Select city" : "Выберите город")}</span><ChevronRight size={14} color={muted} /></span>
      {selected && (selected.region || selected.country) && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: muted }}>{[selected.region, selected.country].filter(Boolean).join(" · ")}</span>}
    </button>
    <input type="hidden" name={fieldPrefix} value={selected?.city || ""} />
    <input type="hidden" name={fieldPrefix === "cityCurrent" ? "regionCurrent" : `${fieldPrefix}Region`} value={selected?.region || ""} />
    <input type="hidden" name={fieldPrefix === "cityCurrent" ? "countryCurrent" : `${fieldPrefix}Country`} value={selected?.country || ""} />
    <input type="hidden" name={fieldPrefix === "cityCurrent" ? "countryCode" : `${fieldPrefix}CountryCode`} value={selected?.countryCode || ""} />
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setOpen(false); setQuery(""); } }} style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", justifyContent: "center", background: "#F4F6FF", color: text }}>
      <section role="dialog" aria-modal="true" aria-label={en ? "Choose city" : "Выберите город"} style={{ width: "min(100%, 430px)", height: "100dvh", display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top) + 16px) 0 calc(env(safe-area-inset-bottom) + 12px)", background: "#F4F6FF" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px 12px" }}>
          <button type="button" onClick={() => { setOpen(false); setQuery(""); }} aria-label={en ? "Close" : "Закрыть"} style={{ width: 32, height: 32, flex: "0 0 32px", display: "grid", placeItems: "center", border: 0, borderRadius: "50%", background: "rgba(255,255,255,.65)", color: muted }}><X size={16} /></button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>{en ? "Choose city" : "Выберите город"}</h2>
        </header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 16px 8px", padding: "10px 12px", border: "1px solid rgba(255,255,255,.9)", borderRadius: 12, background: "rgba(255,255,255,.72)" }}>
          <Search size={15} color={muted} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={en ? "Start typing a city…" : "Начните вводить город…"} autoComplete="off" autoCorrect="off" style={{ width: "100%", minWidth: 0, padding: 0, border: 0, outline: 0, background: "transparent", color: text, fontSize: 16 }} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={en ? "Clear search" : "Очистить поиск"} style={{ border: 0, padding: 0, background: "transparent", color: muted }}><X size={16} /></button>}
          {loading && <LoaderCircle size={16} color={muted} className="animate-spin" />}
        </div>
        <div style={{ height: 1, background: "rgba(26,32,80,.08)" }} />
        {query.trim().length < 2 ? <div style={{ flex: 1, display: "grid", placeContent: "center", justifyItems: "center", gap: 12, color: muted }}><Map size={36} color="#5C7CFA" style={{ opacity: .35 }} /><span style={{ fontSize: 14 }}>{en ? "Type a city name" : "Введите название города"}</span></div>
          : !loading && results.length === 0 ? <div style={{ flex: 1, display: "grid", placeContent: "center", justifyItems: "center", gap: 7 }}><Search size={32} color={muted} style={{ opacity: .4, marginBottom: 5 }} /><span style={{ fontSize: 14, fontWeight: 600 }}>{en ? "City not found" : "Город не найден"}</span><span style={{ fontSize: 12, color: muted }}>{en ? "Try a different spelling" : "Попробуйте другое написание"}</span></div>
            : <div style={{ minHeight: 0, flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
              {results.map((city) => <button type="button" key={city.id} onClick={() => choose(city)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: 0, background: "transparent", color: text, textAlign: "left" }}>
                <MapPin size={20} color="rgba(92,124,250,.65)" />
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 650 }}>{city.city}</span><span style={{ display: "block", marginTop: 2, color: muted, fontSize: 11 }}>{[city.region, city.country].filter(Boolean).join(" · ")}</span></span>
                <ChevronRight size={13} color="rgba(26,32,80,.3)" />
              </button>)}
            </div>}
      </section>
    </div>}
  </>;
}
