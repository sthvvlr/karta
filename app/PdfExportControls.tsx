"use client";

export function PdfExportControls({ lang = "en", scope = "full" }: { lang?: "ru" | "en"; scope?: "full" | "vaccinations" | "medications" }) {
  const en = lang === "en";
  const change = (key: "lang" | "scope", value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    window.location.assign(`/export?${params.toString()}`);
  };
  return <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
    <select aria-label={en ? "PDF sections" : "Разделы PDF"} value={scope} onChange={(event) => change("scope", event.target.value)} style={{ flex: "1 1 150px", padding: 11, border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#1A2050", fontSize: 14 }}><option value="full">{en ? "Full health card" : "Вся карта"}</option><option value="vaccinations">{en ? "Vaccinations" : "Прививки"}</option><option value="medications">{en ? "Medications" : "Лекарства"}</option></select>
    <button type="button" onClick={() => window.print()} style={{ flex: 1, minWidth: 190, padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 14 }}>{en ? "Print / save PDF" : "Печать / сохранить PDF"}</button>
    <a href={`/api/export/pdf?lang=${lang}&scope=${scope}`} download style={{ flex: 1, minWidth: 190, padding: 12, border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", textDecoration: "none", fontWeight: 700, fontSize: 14, textAlign: "center" }}>{en ? "Download PDF file" : "Скачать PDF-файл"}</a>
    <button type="button" onClick={() => change("lang", "ru")} aria-pressed={lang === "ru"} style={{ padding: "12px 10px", border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", fontWeight: 700, fontSize: 12 }}>RU</button><button type="button" onClick={() => change("lang", "en")} aria-pressed={lang === "en"} style={{ padding: "12px 10px", border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", fontWeight: 700, fontSize: 12 }}>EN</button>
    <button type="button" onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.assign("/"); }} style={{ padding: "12px 14px", border: "1px solid rgba(186,200,255,0.55)", borderRadius: 12, background: "white", color: "#1A2050", fontWeight: 600, fontSize: 14 }}>{en ? "Close" : "Закрыть"}</button>
  </div>;
}
