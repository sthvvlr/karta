"use client";

import { useState } from "react";

export function ReminderSettings() {
  const [enabled, setEnabled] = useState(() => typeof window === "undefined" || localStorage.getItem("karta_reminders_enabled") !== "false");
  const [morning, setMorning] = useState(() => typeof window === "undefined" ? "08:00" : localStorage.getItem("karta_reminders_morning") || "08:00");
  const [evening, setEvening] = useState(() => typeof window === "undefined" ? "21:00" : localStorage.getItem("karta_reminders_evening") || "21:00");
  const [permission, setPermission] = useState("");
  function save(nextEnabled = enabled, nextMorning = morning, nextEvening = evening) { localStorage.setItem("karta_reminders_enabled", String(nextEnabled)); localStorage.setItem("karta_reminders_morning", nextMorning); localStorage.setItem("karta_reminders_evening", nextEvening); }
  async function requestPermission() { if (!("Notification" in window)) { setPermission("Браузер не поддерживает уведомления"); return; } const result = await Notification.requestPermission(); setPermission(result === "granted" ? "Уведомления разрешены" : "Разрешение не выдано"); }
  return <details style={{ background: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.9)", borderRadius: 16, padding: "13px 14px", marginBottom: 12 }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🔔 Напоминания</summary><div style={{ display: "grid", gap: 10, marginTop: 12 }}>
    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><input type="checkbox" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); save(event.target.checked); }} /> Напоминания о лекарствах включены</label>
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>Утро<input type="time" value={morning} disabled={!enabled} onChange={(event) => { setMorning(event.target.value); save(enabled, event.target.value, evening); }} style={{ display: "block", marginTop: 4, padding: 9, border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></label>
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>Вечер<input type="time" value={evening} disabled={!enabled} onChange={(event) => { setEvening(event.target.value); save(enabled, morning, event.target.value); }} style={{ display: "block", marginTop: 4, padding: 9, border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></label>
    <button type="button" onClick={requestPermission} style={{ padding: 10, border: "1px solid #DCE3FF", borderRadius: 10, background: "white", color: "#5C7CFA", fontWeight: 700 }}>Разрешить уведомления браузера</button>{permission && <div style={{ color: "rgba(26,32,80,.55)", fontSize: 11 }}>{permission}</div>}
    <div style={{ color: "rgba(26,32,80,.48)", fontSize: 11, lineHeight: 1.4 }}>Настройки сохраняются на этом устройстве. Задачи и история приёмов сохраняются в базе Karta.</div>
  </div></details>;
}
