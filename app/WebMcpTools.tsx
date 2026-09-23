"use client";

import { useEffect } from "react";

type ModelContext = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => Promise<unknown>;
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

export function WebMcpTools() {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const post = async (kind: "vaccination" | "medication", input: Record<string, unknown>) => {
      const response = await fetch("/api/records", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ...input }) });
      const result = await response.json() as { error?: string; record?: { id: string } };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить запись");
      return result;
    };
    void Promise.resolve(context.registerTool({
      name: "add_vaccination",
      title: "Добавить прививку",
      description: "Добавляет одну запись о вакцинации в карту Karta текущего владельца.",
      inputSchema: { type: "object", properties: { vaccineId: { type: "string" }, dateGiven: { type: "string" }, doseNumber: { type: "number" }, brand: { type: "string" }, clinic: { type: "string" } }, required: ["vaccineId"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) { return post("vaccination", input as Record<string, unknown>); },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: "add_medication",
      title: "Добавить лекарство",
      description: "Добавляет препарат и его схему приёма в карту Karta текущего владельца.",
      inputSchema: { type: "object", properties: { name: { type: "string" }, dosage: { type: "string" }, frequency: { type: "string" }, time: { type: "string" }, mealRelation: { type: "string" } }, required: ["name"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) { return post("medication", input as Record<string, unknown>); },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return null;
}
