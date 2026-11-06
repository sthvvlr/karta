"use client";

import { Trash2 } from "lucide-react";
import { deleteLabResult } from "@/app/actions";

export function LabResultDeleteForm({ id }: { id: string }) {
  return <form action={deleteLabResult} onSubmit={(event) => {
    const en = document.cookie.split(";").some((value) => value.trim() === "karta_lang=en");
    if (!window.confirm(en ? "Delete this lab result?" : "Удалить этот анализ?")) event.preventDefault();
  }}><input type="hidden" name="id" value={id} /><button type="submit" aria-label="Удалить анализ" style={{ display: "grid", placeItems: "center", width: 34, height: 34, border: 0, borderRadius: 10, background: "rgba(224,49,49,.07)", color: "#E03131" }}><Trash2 size={15} /></button></form>;
}
