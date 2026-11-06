import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import medicationCatalog from "@/app/medications_ru.json";
import { readVaccinationMetadata } from "@/app/vaccination-record";

export const dynamic = "force-dynamic";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const FOOTER_H = 30;
const INK = rgb(0.102, 0.125, 0.314);
const MUTED = rgb(0.43, 0.45, 0.56);
const BLUE = rgb(0.361, 0.486, 0.98);
const PALE = rgb(0.957, 0.965, 1);
const BORDER = rgb(0.87, 0.89, 0.96);

type Language = "ru" | "en";

function formatDate(value: string | null | undefined, lang: Language): string {
  if (!value) return lang === "ru" ? "Дата не указана" : "Date not specified";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return new Response("Sign in required", { status: 401 });

  const data = await getUserData({ userId: user.userId, email: user.email, displayName: user.displayName });
  const params = new URL(request.url).searchParams;
  const lang: Language = params.get("lang") === "en" ? "en" : "ru";
  const requestedScope = params.get("scope");
  const scope = requestedScope === "vaccinations" || requestedScope === "medications" ? requestedScope : "full";
  const showVaccinations = scope !== "medications";
  const showMedications = scope !== "vaccinations";
  const en = lang === "en";
  const fontResponse = await fetch(new URL("/fonts/NotoSans-Variable.ttf", request.url));
  if (!fontResponse.ok) return new Response("PDF font is unavailable", { status: 503 });
  const iconResponse = await fetch(new URL("/karta-icon.png", request.url));

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await fontResponse.arrayBuffer();
  const regular = await pdf.embedFont(fontBytes, { subset: true });
  const bold = regular;
  const icon = iconResponse.ok ? await pdf.embedPng(await iconResponse.arrayBuffer()) : null;
  let page: PDFPage;
  let y = 0;
  let pageNumber = 0;
  const contentW = PAGE_W - MARGIN * 2;

  const newPage = (first = false) => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pageNumber += 1;
    y = first ? 724 : PAGE_H - 70;
    if (!first) {
      page.drawEllipse({ x: MARGIN + 7, y: PAGE_H - 48, xScale: 5, yScale: 2.5, color: BLUE });
      page.drawLine({ start: { x: MARGIN + 7, y: PAGE_H - 50 }, end: { x: MARGIN + 14, y: PAGE_H - 42 }, thickness: 0.8, color: rgb(0.455, 0.561, 0.988) });
      page.drawText("KARTA", { x: MARGIN + 20, y: PAGE_H - 48, size: 10, font: bold, color: BLUE, characterSpacing: 2 });
      page.drawLine({ start: { x: MARGIN, y: PAGE_H - 58 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 58 }, thickness: 0.6, color: BORDER });
    }
  };

  const ensureSpace = (height: number) => {
    if (y - height < FOOTER_H + 12) newPage();
  };

  const wrappedLines = (value: string, font: PDFFont, size: number, maxWidth: number) => {
    const words = value.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const drawText = (value: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number; lineHeight?: number } = {}) => {
    const size = options.size ?? 10;
    const font = options.font ?? regular;
    const color = options.color ?? INK;
    const x = options.x ?? MARGIN;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const lines = wrappedLines(value, font, size, options.maxWidth ?? contentW);
    ensureSpace(lines.length * lineHeight + 2);
    for (const line of lines) {
      page.drawText(line, { x, y: y - size, size, font, color });
      y -= lineHeight;
    }
  };

  const section = (title: string, icon: string, tint: ReturnType<typeof rgb>) => {
    ensureSpace(48);
    const top = y;
    page.drawRectangle({ x: MARGIN, y: top - 27, width: contentW, height: 27, color: tint, borderColor: BORDER, borderWidth: 0.5 });
    if (icon === "vaccine") {
      page.drawCircle({ x: MARGIN + 16, y: top - 14, size: 7, borderColor: BLUE, borderWidth: 0.8, color: tint });
      page.drawText("✓", { x: MARGIN + 12.5, y: top - 17.5, size: 8, font: bold, color: BLUE });
    } else {
      page.drawEllipse({ x: MARGIN + 9, y: top - 19, xScale: 14, yScale: 7, color: tint, borderColor: BLUE, borderWidth: 0.9 });
      page.drawLine({ start: { x: MARGIN + 16, y: top - 19 }, end: { x: MARGIN + 22, y: top - 19 }, thickness: 0.7, color: BLUE });
    }
    page.drawText(title.toLocaleUpperCase(en ? "en-US" : "ru-RU"), { x: MARGIN + 29, y: top - 18, size: 9, font: bold, color: INK });
    y -= 38;
  };

  const vaccineRow = (title: string, doseLabel: string, date: string, brand?: string | null) => {
    const hasBrand = Boolean(brand);
    const height = hasBrand ? 38 : 26;
    ensureSpace(height + 4);
    const top = y;
    page.drawCircle({ x: MARGIN + 9, y: top - 10, size: 6.5, color: rgb(0.125, 0.784, 0.592) });
    page.drawText("✓", { x: MARGIN + 5.7, y: top - 13, size: 7, font: bold, color: rgb(1, 1, 1) });
    const name = `${title}${doseLabel}`;
    page.drawText(name, { x: MARGIN + 22, y: top - 11, size: 12, font: bold, color: INK, maxWidth: contentW - 150 });
    const dateWidth = regular.widthOfTextAtSize(date, 11);
    page.drawText(date, { x: PAGE_W - MARGIN - dateWidth, y: top - 11, size: 11, font: regular, color: MUTED });
    if (brand) page.drawText(brand, { x: MARGIN + 22, y: top - 29, size: 10, font: regular, color: BLUE });
    y = top - height;
    page.drawLine({ start: { x: MARGIN + 22, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: BORDER });
    y -= 4;
  };

  const medicationRow = (title: string, dosage: string | null, frequency: string) => {
    ensureSpace(26);
    const top = y;
    page.drawCircle({ x: MARGIN + 7.5, y: top - 10, size: 2.5, color: rgb(0.361, 0.486, 0.98), opacity: 0.35 });
    page.drawText(title, { x: MARGIN + 18, y: top - 11, size: 12, font: bold, color: INK, maxWidth: contentW * 0.57 });
    const detail = [dosage, frequency].filter(Boolean).join(" · ");
    const detailWidth = regular.widthOfTextAtSize(detail, 10);
    page.drawText(detail, { x: PAGE_W - MARGIN - detailWidth, y: top - 10, size: 10, font: regular, color: MUTED });
    y = top - 22;
    page.drawLine({ start: { x: MARGIN + 18, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: BORDER });
    y -= 4;
  };

  const row = (title: string, details: string[], icon: string) => {
    const titleLines = wrappedLines(title, bold, 11, contentW - 44);
    const detailLines = details.flatMap((detail) => wrappedLines(detail, regular, 9, contentW - 44));
    const height = Math.max(27, 8 + titleLines.length * 14 + detailLines.length * 12);
    ensureSpace(height);
    const top = y;
    page.drawText(icon, { x: MARGIN + 3, y: top - 15, size: 11, font: bold, color: BLUE });
    let textY = top - 11;
    for (const line of titleLines) {
      page.drawText(line, { x: MARGIN + 22, y: textY, size: 11, font: bold, color: INK });
      textY -= 14;
    }
    for (const line of detailLines) {
      page.drawText(line, { x: MARGIN + 22, y: textY, size: 9, font: regular, color: MUTED });
      textY -= 12;
    }
    y = top - height;
    page.drawLine({ start: { x: MARGIN + 22, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: BORDER });
    y -= 4;
  };

  newPage(true);
  // Recreate the iOS diagonal blue gradient with thin color bands.
  const gradientStops = [rgb(0.361, 0.486, 0.98), rgb(0.455, 0.561, 0.988), rgb(0.455, 0.753, 0.988)];
  const bands = 72;
  for (let index = 0; index < bands; index += 1) {
    const t = index / (bands - 1);
    const segment = t < 0.55 ? 0 : 1;
    const localT = segment === 0 ? t / 0.55 : (t - 0.55) / 0.45;
    const from = gradientStops[segment];
    const to = gradientStops[segment + 1];
    page.drawRectangle({ x: PAGE_W * index / bands, y: PAGE_H - 92, width: PAGE_W / bands + 0.4, height: 92, color: rgb(from.red + (to.red - from.red) * localT, from.green + (to.green - from.green) * localT, from.blue + (to.blue - from.blue) * localT) });
  }
  page.drawCircle({ x: PAGE_W * 0.49, y: PAGE_H + 22, size: 70, color: rgb(1, 1, 1), opacity: 0.06 });
  page.drawCircle({ x: PAGE_W * 0.55, y: PAGE_H - 50, size: 40, color: rgb(1, 1, 1), opacity: 0.06 });
  page.drawCircle({ x: PAGE_W - 24, y: PAGE_H - 10, size: 68, color: rgb(0.48, 0.60, 1), opacity: 0.18 });
  if (icon) page.drawImage(icon, { x: MARGIN, y: PAGE_H - 69, width: 42, height: 42 });
  page.drawText("Karta", { x: MARGIN + 52, y: PAGE_H - 48, size: 24, font: bold, color: rgb(1, 1, 1) });
  page.drawText(en ? "HEALTH PASSPORT" : "ПАСПОРТ ЗДОРОВЬЯ", { x: MARGIN + 151, y: PAGE_H - 47, size: 10, font: bold, color: rgb(1, 1, 1) });
  y = PAGE_H - 108;

  const profileTop = y;
  page.drawRectangle({ x: MARGIN, y: profileTop - 64, width: contentW, height: 64, color: PALE, borderColor: BORDER, borderWidth: 0.5 });
  const name = data.profile?.fullName || user.displayName || (en ? "Name not specified" : "Имя не указано");
  page.drawText(name, { x: MARGIN + 14, y: profileTop - 22, size: 15, font: bold, color: INK, maxWidth: contentW - 28 });
  const profileLine = [data.profile?.birthDate, data.profile?.cityCurrent].filter(Boolean).join("  ·  ") || (en ? "Location not set" : "Город не указан");
  page.drawText(profileLine, { x: MARGIN + 14, y: profileTop - 42, size: 9, font: regular, color: MUTED, maxWidth: contentW - 28 });
  const generated = `${en ? "Generated" : "Выгружено"} ${new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { dateStyle: "long" }).format(new Date())}`;
  page.drawText(generated, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(generated, 8) - 14, y: profileTop - 57, size: 8, font: regular, color: MUTED });
  y -= 82;

  if (showMedications) {
    const activeMeds = data.medications.filter((med) => med.isActive);
    section(en ? "Current medications" : "Принимаемые лекарства", "medication", rgb(0.96, 0.93, 1));
    if (!activeMeds.length) drawText(en ? "No medication records" : "Нет записей о лекарствах", { size: 11, color: MUTED, x: MARGIN + 22 });
    for (const med of activeMeds) {
      const frequency = med.frequency === "weekly" ? (en ? "weekly" : "еженедельно") : med.frequency === "as_needed" ? (en ? "as needed" : "по необходимости") : (en ? "daily" : "ежедневно");
      const entry = (medicationCatalog as Array<{ id: string; ru: string; en: string }>).find((item) => item.id === med.drugCode || item.ru === med.name);
      const title = en && entry?.en ? entry.en.charAt(0).toLocaleUpperCase("en-US") + entry.en.slice(1) : med.name;
      medicationRow(title, med.dosage, frequency);
    }
  }

  if (showVaccinations) {
    section(en ? "Completed vaccinations" : "Сделанные прививки", "vaccine", rgb(0.93, 0.95, 1));
    const completedVaccinations = data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming);
    if (completedVaccinations.length === 0) drawText(en ? "No vaccination records" : "Нет записей о прививках", { size: 11, color: MUTED, x: MARGIN + 22 });
    for (const { record, vaccine } of completedVaccinations) {
      const metadata = readVaccinationMetadata(record.notes);
      const title = en ? (vaccine?.nameEn || metadata.name || record.vaccineId) : (metadata.name || vaccine?.nameRu || record.vaccineId);
      const totalDoses = metadata.totalDoses ?? vaccine?.totalDoses ?? 1;
      const dose = totalDoses > 1 ? (en ? ` (dose ${record.doseNumber} of ${totalDoses})` : ` (доза ${record.doseNumber} из ${totalDoses})`) : "";
      vaccineRow(title, dose, formatDate(metadata.dateString || record.dateGiven, lang), record.brand);
    }
  }

  for (const [index, pdfPage] of pdf.getPages().entries()) {
    pdfPage.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: PAGE_W - MARGIN, y: 28 }, thickness: 0.5, color: BORDER });
    pdfPage.drawText("Karta", { x: MARGIN, y: 15, size: 8, font: regular, color: MUTED });
    const label = en ? `Page ${index + 1}` : `Стр. ${index + 1}`;
    pdfPage.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8), y: 15, size: 8, font: regular, color: MUTED });
  }

  const bytes = await pdf.save();
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="karta-health-card-${lang}.pdf"`, "Cache-Control": "no-store" } });
}
