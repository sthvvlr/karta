"use client";

import { useMemo, useState } from "react";
import { Moon, Sun, Sunrise } from "lucide-react";
import { useKartaLanguage } from "@/app/LanguageRuntime";

type Slot = { label: string; customTime?: string | null; hasCustomTime?: boolean; time?: string; daysOfWeek?: number[] };
type SlotDefinition = { label: string; titleRu: string; titleEn: string; defaultTime: string; Icon: typeof Sun };
const dayLabels = [[1, "Пн", "Mo"], [2, "Вт", "Tu"], [3, "Ср", "We"], [4, "Чт", "Th"], [5, "Пт", "Fr"], [6, "Сб", "Sa"], [0, "Вс", "Su"]] as const;
const slotLabels: SlotDefinition[] = [
  { label: "morning", titleRu: "Утро", titleEn: "Morning", defaultTime: "08:00", Icon: Sunrise },
  { label: "afternoon", titleRu: "День", titleEn: "Afternoon", defaultTime: "13:00", Icon: Sun },
  { label: "evening", titleRu: "Вечер", titleEn: "Evening", defaultTime: "20:00", Icon: Moon },
];
const frequencies = [
  { value: "daily", ru: "Каждый день", en: "Every day" },
  { value: "weekly", ru: "Несколько раз в неделю", en: "Several times a week" },
  { value: "as_needed", ru: "По необходимости", en: "As needed" },
] as const;

function parseInitial(raw: string | undefined): Slot[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown[];
    return parsed.flatMap((item): Slot[] => {
      if (typeof item === "string") return [{ label: "morning", time: item }];
      if (!item || typeof item !== "object") return [];
      const value = item as Slot;
      return typeof value.label === "string" ? [value] : [];
    });
  } catch { return []; }
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} style={{ width: 42, height: 26, padding: 3, border: 0, borderRadius: 99, background: checked ? "#5C7CFA" : "rgba(26,32,80,.18)", transition: "background .18s", flexShrink: 0 }}><span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.18)", transform: checked ? "translateX(16px)" : "translateX(0)", transition: "transform .18s" }} /></button>;
}

const card = { background: "white", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,.04)", overflow: "hidden" } as const;
const sectionTitle = { fontSize: 10, fontWeight: 750, letterSpacing: ".06em", color: "rgba(26,32,80,.48)", margin: "0 4px 7px" } as const;

export function MedicationSchedulePicker({ initialFrequency = "daily", initialSchedule = "" }: { initialFrequency?: string; initialSchedule?: string }) {
  const en = useKartaLanguage() === "en";
  const initial = parseInitial(initialSchedule);
  const [frequency, setFrequency] = useState(initialFrequency || "daily");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(slotLabels.map((slot) => [slot.label, initial.length ? initial.some((item) => item.label === slot.label) : slot.label === "morning"])));
  const [exactTime, setExactTime] = useState<Record<string, boolean>>(() => Object.fromEntries(slotLabels.map((slot) => {
    const saved = initial.find((item) => item.label === slot.label);
    return [slot.label, saved?.hasCustomTime ?? Boolean(saved?.customTime || (saved?.time && saved.time !== slot.defaultTime))];
  })));
  const [times, setTimes] = useState<Record<string, string>>(() => Object.fromEntries(slotLabels.map((slot) => {
    const saved = initial.find((item) => item.label === slot.label);
    return [slot.label, saved?.customTime || saved?.time || slot.defaultTime];
  })));
  const [days, setDays] = useState<number[]>(initial.find((item) => item.daysOfWeek)?.daysOfWeek || []);
  const schedule = useMemo(() => slotLabels.filter((slot) => enabled[slot.label]).map((slot) => ({
    label: slot.label,
    hasCustomTime: exactTime[slot.label],
    ...(exactTime[slot.label] ? { customTime: times[slot.label] || slot.defaultTime } : {}),
    ...(frequency === "weekly" ? { daysOfWeek: days } : {}),
  })), [days, enabled, exactTime, frequency, times]);

  return <>
    <input type="hidden" name="frequency" value={frequency} />
    <input type="hidden" name="schedule" value={JSON.stringify(schedule.length ? schedule : [{ label: "morning", hasCustomTime: false }])} />
    <section>
      <div style={sectionTitle}>{en ? "FREQUENCY" : "КАК ЧАСТО"}</div>
      <div style={card}>
        {frequencies.map((item, index) => <div key={item.value}>
          <button type="button" role="radio" aria-checked={frequency === item.value} onClick={() => setFrequency(item.value)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", border: 0, background: "white", color: "#1A2050", textAlign: "left", fontSize: 14 }}>
            <span>{en ? item.en : item.ru}</span>
            <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", border: frequency === item.value ? 0 : "1.5px solid rgba(26,32,80,.24)", color: "white", background: frequency === item.value ? "#5C7CFA" : "transparent", fontSize: 13 }}>{frequency === item.value ? "✓" : ""}</span>
          </button>
          {index < frequencies.length - 1 && <div style={{ height: 1, background: "rgba(26,32,80,.08)", marginLeft: 16 }} />}
        </div>)}
        {frequency === "weekly" && <div style={{ padding: "10px 14px 12px", borderTop: "1px solid rgba(26,32,80,.08)", display: "flex", justifyContent: "space-between", gap: 5 }}>{dayLabels.map(([day, labelRu, labelEn]) => <button type="button" key={day} aria-pressed={days.includes(day)} onClick={() => setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", border: 0, background: days.includes(day) ? "#5C7CFA" : "rgba(92,124,250,.08)", color: days.includes(day) ? "white" : "#5C7CFA", fontWeight: 650, fontSize: 12 }}>{en ? labelEn : labelRu}</button>)}</div>}
      </div>
    </section>

    <section>
      <div style={{ ...sectionTitle, marginTop: 16 }}>{en ? "WHEN TO TAKE" : "КОГДА ПРИНИМАТЬ"}</div>
      <div style={card}>
        {slotLabels.map((slot, index) => {
          const Icon = slot.Icon;
          return <div key={slot.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              <Icon size={17} color={enabled[slot.label] ? "#5C7CFA" : "rgba(26,32,80,.35)"} />
              <span style={{ flex: 1, fontSize: 14, color: "#1A2050" }}>{en ? slot.titleEn : slot.titleRu}</span>
              <Toggle checked={enabled[slot.label]} onChange={() => setEnabled((current) => ({ ...current, [slot.label]: !current[slot.label] }))} label={`${en ? "Enable" : "Включить"}: ${en ? slot.titleEn : slot.titleRu}`} />
            </div>
            {enabled[slot.label] && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px 9px 56px", background: "rgba(92,124,250,.03)" }}>
              <span style={{ flex: 1, color: "rgba(26,32,80,.55)", fontSize: 12 }}>{en ? "Exact time" : "Точное время"}</span>
              <Toggle checked={exactTime[slot.label]} onChange={() => setExactTime((current) => ({ ...current, [slot.label]: !current[slot.label] }))} label={`${en ? "Set exact time" : "Указать точное время"}: ${en ? slot.titleEn : slot.titleRu}`} />
              {exactTime[slot.label] && <input aria-label={`${en ? "Time" : "Время"}: ${en ? slot.titleEn : slot.titleRu}`} type="time" value={times[slot.label]} onChange={(event) => setTimes((current) => ({ ...current, [slot.label]: event.target.value }))} style={{ width: 86, padding: "5px 6px", border: "1px solid rgba(186,200,255,.4)", borderRadius: 8, background: "white", fontSize: 14, color: "#5C7CFA" }} />}
            </div>}
            {index < slotLabels.length - 1 && <div style={{ height: 1, background: "rgba(26,32,80,.08)", marginLeft: 56 }} />}
          </div>;
        })}
      </div>
    </section>
  </>;
}
