"use client";

export function PdfExportControls({ lang = "en" }: { lang?: "ru" | "en" }) {
  return <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
    <button type="button" onClick={() => window.print()} style={{ flex: 1, minWidth: 190, padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 14 }}>Печать / сохранить PDF</button>
    <a href={`/api/export/pdf?lang=${lang}`} download style={{ flex: 1, minWidth: 190, padding: 12, border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", textDecoration: "none", fontWeight: 700, fontSize: 14, textAlign: "center" }}>Скачать PDF-файл</a>
    <a href="?lang=ru" style={{ padding: "12px 10px", border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", textDecoration: "none", fontWeight: 700, fontSize: 12 }}>RU</a><a href="?lang=en" style={{ padding: "12px 10px", border: "1px solid #DCE3FF", borderRadius: 12, background: "white", color: "#5C7CFA", textDecoration: "none", fontWeight: 700, fontSize: 12 }}>EN</a>
    <button type="button" onClick={() => window.close()} style={{ padding: "12px 14px", border: "1px solid rgba(186,200,255,0.55)", borderRadius: 12, background: "white", color: "#1A2050", fontWeight: 600, fontSize: 14 }}>Закрыть</button>
  </div>;
}
