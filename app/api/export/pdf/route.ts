import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import { getDb } from "@/db";
import { labResults } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const transliteration: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function pdfSafe(value: unknown): string {
  return String(value ?? "").split("").map((char) => transliteration[char.toLowerCase()] ? (char === char.toUpperCase() ? transliteration[char.toLowerCase()].toUpperCase() : transliteration[char.toLowerCase()]) : char).join("").replace(/[^\x20-\x7E]/g, "?");
}

function wrap(text: string, max = 82): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const labs = await getDb().select().from(labResults).where(eq(labResults.userId, user.userId)).orderBy(desc(labResults.testedAt));
  const lang = new URL(request.url).searchParams.get("lang") === "ru" ? "ru" : "en";
  const en = lang === "en";
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const margin = 42;
  let page = pdf.addPage([pageWidth, 842]);
  let y = 800;
  const ink = rgb(0.10, 0.13, 0.31);
  const muted = rgb(0.35, 0.38, 0.52);
  const blue = rgb(0.36, 0.49, 0.98);
  const ensureSpace = (height: number) => { if (y - height < 42) { page = pdf.addPage([pageWidth, 842]); y = 800; } };
  const text = (value: unknown, size = 10, font = regular, color = ink) => { for (const line of wrap(String(value), Math.floor((pageWidth - margin * 2) / (size * 0.52)))) { ensureSpace(size + 6); page.drawText(pdfSafe(line), { x: margin, y, size, font, color }); y -= size + 5; } };
  const section = (title: string) => { ensureSpace(34); y -= 8; page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 24, color: rgb(0.95, 0.96, 1) }); page.drawText(pdfSafe(title), { x: margin + 9, y: y + 3, size: 12, font: bold, color: ink }); y -= 28; };
  page.drawText("KARTA", { x: margin, y, size: 26, font: bold, color: blue }); y -= 32;
  text(en ? "My health card" : "Moya karta zdorovya", 18, bold); text(`${en ? "Generated" : "Sformirovano"}: ${new Date().toLocaleDateString(en ? "en-US" : "ru-RU")}`, 9, regular, muted); y -= 6;
  section(en ? "Profile" : "Profil");
  text(data.profile?.fullName || user.displayName, 12, bold); text(`${en ? "Date of birth" : "Data rozhdeniya"}: ${data.profile?.birthDate || (en ? "not specified" : "ne ukazana")}`, 10, regular, muted); text(`${en ? "City" : "Gorod"}: ${[data.profile?.cityCurrent, data.profile?.regionCurrent, data.profile?.countryCurrent].filter(Boolean).join(", ") || (en ? "not specified" : "ne ukazan")}`, 10, regular, muted);
  section(`${en ? "Vaccinations" : "Privivki"} · ${data.vaccinations.length}`);
  if (!data.vaccinations.length) text(en ? "No records" : "Zapisey poka net", 10, regular, muted);
  for (const { record, vaccine } of data.vaccinations) text(`${en ? (vaccine?.nameEn || record.vaccineId) : (vaccine?.nameRu || record.vaccineId)} · ${record.dateGiven || (en ? "date not specified" : "data ne ukazana")} · ${en ? "dose" : "doza"} ${record.doseNumber}${record.brand ? ` · ${record.brand}` : ""}${record.clinic ? ` · ${record.clinic}` : ""}`, 10);
  section(`${en ? "Medications" : "Lekarstva"} · ${data.medications.length}`);
  if (!data.medications.length) text(en ? "No records" : "Zapisey poka net", 10, regular, muted);
  for (const medication of data.medications) text(`${medication.name}${medication.dosage ? ` · ${medication.dosage}` : ""}${medication.frequency ? ` · ${medication.frequency}` : ""}`, 10);
  section(`${en ? "Lab tests" : "Analizy"} · ${labs.length}`);
  if (!labs.length) text(en ? "No records" : "Zapisey poka net", 10, regular, muted);
  for (const lab of labs) text(`${lab.name} · ${[lab.result, lab.unit].filter(Boolean).join(" ") || (en ? "result not specified" : "rezultat ne ukazan")} · ${lab.testedAt || (en ? "date not specified" : "data ne ukazana")}`, 10);
  const bytes = await pdf.save();
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="karta-health-card-${lang}.pdf"`, "Cache-Control": "no-store" } });
}
