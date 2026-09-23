"use client";

export function PdfExportControls() {
  return <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
    <button type="button" onClick={() => window.print()} style={{ flex: 1, padding: 12, border: 0, borderRadius: 12, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", fontWeight: 700, fontSize: 14 }}>Печать / сохранить PDF</button>
    <button type="button" onClick={() => window.close()} style={{ padding: "12px 14px", border: "1px solid rgba(186,200,255,0.55)", borderRadius: 12, background: "white", color: "#1A2050", fontWeight: 600, fontSize: 14 }}>Закрыть</button>
  </div>;
}
