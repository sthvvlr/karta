"use client";

import { Trash2 } from "lucide-react";
import { deleteLabResult } from "@/app/actions";
import { useKartaLanguage } from "@/app/LanguageRuntime";

export function LabResultDeleteForm({ id }: { id: string }) {
  const en = useKartaLanguage() === "en";
  return <form action={deleteLabResult} onSubmit={(event) => {
    if (!window.confirm(en ? "Delete this lab result?" : "Удалить этот анализ?")) event.preventDefault();
  }}><input type="hidden" name="id" value={id} /><button type="submit" aria-label={en ? "Delete lab result" : "Удалить анализ"} style={{ display: "grid", placeItems: "center", width: 34, height: 34, border: 0, borderRadius: 10, background: "rgba(224,49,49,.07)", color: "#E03131" }}><Trash2 size={15} /></button></form>;
}
