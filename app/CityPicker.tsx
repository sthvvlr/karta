"use client";

import { useEffect, useState } from "react";

type City = { id: string; city: string; region: string; country: string; countryCode: string; label: string };

export function CityPicker({ initialCity = "", initialRegion = "", initialCountry = "" }: { initialCity?: string; initialRegion?: string; initialCountry?: string }) {
  const [value, setValue] = useState(initialCity);
  const [selected, setSelected] = useState<City | null>(initialCity ? { id: "initial", city: initialCity, region: initialRegion, country: initialCountry, countryCode: "", label: "" } : null);
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2 || (selected && value === selected.city)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await response.json() as { cities?: City[] };
        setResults(data.cities || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value, selected]);

  function choose(city: City) {
    setValue(city.city);
    setSelected(city);
    setResults([]);
  }

  return <div style={{ position: "relative" }}>
    <input value={value} onChange={(event) => { setValue(event.target.value); setSelected(null); setResults([]); }} placeholder="Начните вводить город" autoComplete="address-level2" style={{ width: "100%", padding: "12px 13px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <input type="hidden" name="cityCurrent" value={selected?.city || value} />
    <input type="hidden" name="regionCurrent" value={selected?.region || ""} />
    <input type="hidden" name="countryCurrent" value={selected?.country || ""} />
    {loading && <div style={{ position: "absolute", right: 12, top: 13, fontSize: 12, color: "rgba(26,32,80,0.42)" }}>Поиск…</div>}
    {results.length > 0 && <div style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "calc(100% + 5px)", background: "white", border: "1px solid rgba(186,200,255,0.45)", borderRadius: 13, boxShadow: "0 8px 24px rgba(26,32,80,0.14)", overflow: "hidden" }}>{results.map((city) => <button type="button" key={city.id} onClick={() => choose(city)} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 13px", border: 0, borderBottom: "1px solid rgba(26,32,80,0.06)", background: "white", color: "#1A2050", fontSize: 14 }}><span style={{ display: "block", fontWeight: 600 }}>{city.city}</span><span style={{ display: "block", marginTop: 2, fontSize: 12, color: "rgba(26,32,80,0.48)" }}>{[city.region, city.country].filter(Boolean).join(" · ")}</span></button>)}</div>}
    {selected?.region && <div style={{ marginTop: 6, fontSize: 12, color: "rgba(26,32,80,0.52)" }}>Регион для рекомендаций: {selected.region}{selected.country ? ` · ${selected.country}` : ""}</div>}
  </div>;
}
