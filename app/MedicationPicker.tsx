"use client";

import { useMemo, useState } from "react";
import medications from "./medications_ru.json";

type Entry = { id: string; ru: string; en: string };

export function MedicationPicker({ initialName = "", initialCode = "" }: { initialName?: string; initialCode?: string }) {
  const [value, setValue] = useState(initialName);
  const [code, setCode] = useState(initialCode);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length < 2 || !open) return [];
    const source = medications as Entry[];
    return source.filter((item) => item.ru.toLowerCase().includes(query) || item.en.toLowerCase().includes(query)).slice(0, 8);
  }, [value, open]);
  return <div style={{ position: "relative" }}>
    <input value={value} onChange={(event) => { setValue(event.target.value); setCode(""); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} name="name" required placeholder="Начните вводить название" autoComplete="off" style={{ width: "100%", padding: "11px 12px", background: "rgba(244,246,255,0.8)", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, fontSize: 16, color: "#1A2050" }} />
    <input type="hidden" name="drugCode" value={code} />
    {results.length > 0 && <div style={{ position: "absolute", zIndex: 30, left: 0, right: 0, top: "calc(100% + 5px)", background: "white", border: "1px solid rgba(186,200,255,0.45)", borderRadius: 13, boxShadow: "0 8px 24px rgba(26,32,80,0.14)", overflow: "hidden" }}>{results.map((item) => <button type="button" key={item.id} onMouseDown={() => { setValue(item.ru); setCode(item.id); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: 0, borderBottom: "1px solid rgba(26,32,80,0.06)", background: "white", color: "#1A2050", fontSize: 14 }}><span style={{ display: "block", fontWeight: 600 }}>{item.ru}</span>{item.en && <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "rgba(26,32,80,0.45)" }}>{item.en}</span>}</button>)}</div>}
  </div>;
}
