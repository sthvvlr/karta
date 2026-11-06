"use client";

import { useState } from "react";
import { FilePlus2, Pencil, X } from "lucide-react";
import { LabResultForm } from "@/app/LabResultForm";
import { addLabResult } from "@/app/actions";
import { useKartaLanguage } from "@/app/LanguageRuntime";

type InitialResult = { id: string; name: string | null; testedAt: string | null; notes: string | null; fileKey: string | null; indicators: string | null };
type Props = { initial?: InitialResult; gender?: string | null; prefillTitle?: string; prefillTests?: string[]; monitoringMedicationId?: string; monitoringRuleId?: string; initiallyOpen?: boolean; onSaved?: () => void };

export function LabResultSheet(props: Props) {
  const [open, setOpen] = useState(props.initiallyOpen || false);
  const editing = Boolean(props.initial);
  const en = useKartaLanguage() === "en";
  async function save(formData: FormData) {
    await addLabResult(formData);
    setOpen(false);
    props.onSaved?.();
  }
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={editing ? (en ? "Edit lab result" : "Изменить анализ") : (en ? "Add lab test" : "Добавить анализ")} style={{ width: 36, height: 36, display: "grid", placeItems: "center", border: 0, borderRadius: 10, background: "linear-gradient(135deg,#748FFC,#5C7CFA)", color: "white", boxShadow: "0 4px 10px rgba(92,124,250,.25)" }}>{editing ? <Pencil size={15} /> : <FilePlus2 size={17} />}</button>
    {open && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(20,25,55,.38)", backdropFilter: "blur(7px)" }}>
      <section role="dialog" aria-modal="true" aria-label={editing ? (en ? "Edit lab result" : "Редактировать анализ") : (en ? "New lab test" : "Новый анализ")} style={{ width: "min(100%, 430px)", maxHeight: "92dvh", overflow: "auto", padding: "10px 20px calc(24px + env(safe-area-inset-bottom))", border: "1px solid rgba(255,255,255,.75)", borderBottom: 0, borderRadius: "24px 24px 0 0", background: "rgba(250,251,255,.98)", boxShadow: "0 -12px 42px rgba(26,32,80,.18)", color: "#1A2050" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ width: 34 }} /><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editing ? (en ? "Edit lab result" : "Редактировать анализ") : (en ? "New lab test" : "Новый анализ")}</h2><button type="button" onClick={() => setOpen(false)} aria-label={en ? "Close" : "Закрыть"} style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 17, background: "rgba(26,32,80,.06)", color: "#1A2050" }}><X size={18} /></button></div>
        <LabResultForm action={save} initial={props.initial} prefillTitle={props.prefillTitle} prefillTests={props.prefillTests} gender={props.gender} monitoringMedicationId={props.monitoringMedicationId} monitoringRuleId={props.monitoringRuleId} />
      </section>
    </div>}
  </>;
}
