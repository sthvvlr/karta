import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { labResults } from "@/db/schema";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user || !env.BUCKET) return new Response("Not found", { status: 404 });
  const { id } = await context.params;
  const [row] = await getDb().select({ fileKey: labResults.fileKey }).from(labResults)
    .where(and(eq(labResults.id, id), eq(labResults.userId, user.userId))).limit(1);
  if (!row?.fileKey) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(row.fileKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
