"use client";

import { Plus } from "lucide-react";

export function MedicationAddButton({ primary = false }: { primary?: boolean }) {
  return <button type="button" aria-label="Добавить лекарство" onClick={() => {
    const panel = document.getElementById("add-medication") as HTMLDetailsElement | null;
    if (panel) {
      panel.open = true;
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: primary ? "auto" : 36, height: 36, padding: primary ? "0 16px" : 0, border: 0, borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", boxShadow: "0 4px 10px rgba(92,124,250,.24)", fontWeight: 700 }}><Plus size={18} />{primary && "Добавить лекарство"}</button>;
}
