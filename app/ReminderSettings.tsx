"use client";

import { useState } from "react";
import { saveReminderSettings } from "./actions";

export function ReminderSettings({ initialEnabled = true, initialMorning = "08:00", initialEvening = "21:00" }: { initialEnabled?: boolean; initialMorning?: string; initialEvening?: string }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [morning, setMorning] = useState(initialMorning);
  const [evening, setEvening] = useState(initialEvening);
  const [permission, setPermission] = useState("");
  async function requestPermission() { if (!("Notification" in window)) { setPermission("Браузер не поддерживает уведомления"); return; } const result = await Notification.requestPermission(); setPermission(result === "granted" ? "Уведомления разрешены" : "Разрешение не выдано"); }
  return <details style={{ background: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.9)", borderRadius: 16, padding: "13px 14px", marginBottom: 12 }}><summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🔔 Напоминания</summary><form action={saveReminderSettings} style={{ display: "grid", gap: 10, marginTop: 12 }}>
    <input type="hidden" name="enabled" value={String(enabled)} /><input type="hidden" name="morning" value={morning} /><input type="hidden" name="evening" value={evening} />
    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Напоминания о лекарствах включены</label>
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>Утро<input type="time" value={morning} disabled={!enabled} onChange={(event) => setMorning(event.target.value)} style={{ display: "block", marginTop: 4, padding: 9, border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></label>
    <label style={{ fontSize: 12, color: "rgba(26,32,80,.55)" }}>Вечер<input type="time" value={evening} disabled={!enabled} onChange={(event) => setEvening(event.target.value)} style={{ display: "block", marginTop: 4, padding: 9, border: "1px solid #DCE3FF", borderRadius: 9, fontSize: 16 }} /></label>
    <button type="submit" style={{ padding: 10, border: 0, borderRadius: 10, background: "#5C7CFA", color: "white", fontWeight: 700 }}>Сохранить настройки</button>
    <button type="button" onClick={requestPermission} style={{ padding: 10, border: "1px solid #DCE3FF", borderRadius: 10, background: "white", color: "#5C7CFA", fontWeight: 700 }}>Разрешить уведомления браузера</button>{permission && <div style={{ color: "rgba(26,32,80,.55)", fontSize: 11 }}>{permission}</div>}
    <div style={{ color: "rgba(26,32,80,.48)", fontSize: 11, lineHeight: 1.4 }}>Настройки сохраняются в базе Karta и доступны на других устройствах.</div>
  </form></details>;
}
