import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { getMobileUser } from "@/app/mobile-auth";

function safeObjectKey(userId: string, path: string) {
  const fileName = path.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  return `labs/${userId}/${fileName}`;
}

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user || !env.BUCKET) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  const path = String(form.get("path") || "");
  if (!(file instanceof File) || !path) return NextResponse.json({ error: "Файл не найден." }, { status: 400 });
  await env.BUCKET.put(safeObjectKey(user.userId, path), await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return NextResponse.json({ status: "uploaded" });
}

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user || !env.BUCKET) return new Response("Not found", { status: 404 });
  const path = new URL(request.url).searchParams.get("path") || "";
  if (!path) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(safeObjectKey(user.userId, path));
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(request: Request) {
  const user = await getMobileUser(request);
  if (!user || !env.BUCKET) return new Response("Not found", { status: 404 });
  const path = new URL(request.url).searchParams.get("path") || "";
  if (!path) return new Response("Not found", { status: 404 });
  await env.BUCKET.delete(safeObjectKey(user.userId, path));
  return NextResponse.json({ status: "deleted" });
}

