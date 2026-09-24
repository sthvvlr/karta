"use client";

import { useMemo, useState } from "react";

type Slot = { label: string; time: string; daysOfWeek?: number[] };
const dayLabels = [[1, "Пн"], [2, "Вт"], [3, "Ср"], [4, "Чт"], [5, "Пт"], [6, "Сб"], [0, "Вс"]] as const;
const slotLabels = [{ label: "morning", title: "Утро", defaultTime: "08:00" }, { label: "afternoon", title: "День", defaultTime: "13:00" }, { label: "evening", title: "Вечер", defaultTime: "20:00" }] as const;

function parseInitial(raw: string | undefined): Slot[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown[];
    const slots = parsed.flatMap((item): Slot[] => {
      if (typeof item === "string") return [{ label: "morning", time: item }];
      if (!item || typeof item !== "object") return [];
      const value = item as { label?: unknown; time?: unknown; customTime?: unknown; daysOfWeek?: unknown };
      return typeof (value.time || value.customTime) === "string" ? [{ label: typeof value.label === "string" ? value.label : "morning", time: String(value.time || value.customTime), daysOfWeek: Array.isArray(value.daysOfWeek) ? value.daysOfWeek as number[] : undefined }] : [];
    });
    return slots;
  } catch { return []; }
}

export function MedicationSchedulePicker({ initialFrequency = "daily", initialSchedule = "" }: { initialFrequency?: string; initialSchedule?: string }) {
  const initial = parseInitial(initialSchedule);
  const [frequency, setFrequency] = useState(initialFrequency || "daily");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(slotLabels.map((slot) => [slot.label, initial.length ? initial.some((item) => item.label === slot.label) : slot.label === "morning"])));
  const [times, setTimes] = useState<Record<string, string>>(() => Object.fromEntries(slotLabels.map((slot) => [slot.label, initial.find((item) => item.label === slot.label)?.time || slot.defaultTime])));
  const [days, setDays] = useState<number[]>(initial.find((item) => item.daysOfWeek)?.daysOfWeek || [1, 2, 3, 4, 5, 6, 0]);
  const schedule = useMemo(() => slotLabels.filter((slot) => enabled[slot.label]).map((slot) => ({ label: slot.label, time: times[slot.label] || slot.defaultTime, daysOfWeek: frequency === "weekly" ? days : undefined })), [days, enabled, frequency, times]);
  return <div style={{ display: "grid", gap: 9 }}>
    <select name="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} style={{ width: "100%", padding: "11px 12px", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 11, background: "rgba(244,246,255,0.8)", color: "#1A2050", fontSize: 16 }}><option value="daily">Каждый день</option><option value="weekly">Несколько раз в неделю</option><option value="as_needed">По необходимости</option></select>
    {frequency === "weekly" && <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>{dayLabels.map(([day, label]) => <button type="button" key={day} onClick={() => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", border: 0, background: days.includes(day) ? "#5C7CFA" : "rgba(92,124,250,0.1)", color: days.includes(day) ? "white" : "#5C7CFA", fontWeight: 700, fontSize: 12 }}>{label}</button>)}</div>}
    {frequency !== "as_needed" && <div style={{ display: "grid", gap: 7 }}>{slotLabels.map((slot) => <label key={slot.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#1A2050" }}><input type="checkbox" checked={enabled[slot.label]} onChange={() => setEnabled((current) => ({ ...current, [slot.label]: !current[slot.label] }))} /><span style={{ flex: 1 }}>{slot.title}</span><input type="time" value={times[slot.label]} onChange={(event) => setTimes((current) => ({ ...current, [slot.label]: event.target.value }))} disabled={!enabled[slot.label]} style={{ padding: "7px 8px", border: "1px solid rgba(186,200,255,0.4)", borderRadius: 8, fontSize: 16, color: "#1A2050" }} /></label>)}</div>}
    {frequency === "as_needed" && <div style={{ fontSize: 12, color: "rgba(26,32,80,0.55)" }}>Задачи на конкретное время создаваться не будут — приём можно отметить вручную.</div>}
    <input type="hidden" name="schedule" value={JSON.stringify(schedule.length ? schedule : [{ label: "morning", time: "12:00" }])} />
  </div>;
}
