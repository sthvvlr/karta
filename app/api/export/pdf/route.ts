import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserData } from "@/app/data";
import medicationCatalog from "@/app/medications_ru.json";
import { displayVaccinationDate, readVaccinationMetadata } from "@/app/vaccination-record";
import { birthDateDisplayValue } from "@/app/profile-dates";

export const dynamic = "force-dynamic";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;
const FOOTER_H = 30;
const INK = rgb(0.102, 0.125, 0.314);
// iOS draws #1A2050 at 40% opacity. These PDF colors are the equivalent
// composited on the white page; pdf-lib does not apply UIKit alpha here.
const MUTED = rgb(0.641, 0.65, 0.726);
const PROFILE_MUTED = rgb(0.615, 0.629, 0.726);
const BLUE = rgb(0.361, 0.486, 0.98);
const PURPLE = rgb(0.545, 0.361, 0.98);
const SUCCESS = rgb(0.125, 0.784, 0.592);
const PALE = rgb(0.957, 0.965, 1);
const BORDER = rgb(0.854, 0.864, 0.918);
// iOS row/footer rules use #1A2050 at 7%/10% opacity over white.
const ROW_RULE = rgb(0.937, 0.94, 0.952);
const FOOTER_RULE = rgb(0.91, 0.913, 0.931);

type Language = "ru" | "en";

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
  const boldFontResponse = await fetch(new URL("/fonts/NotoSans-Bold.ttf", request.url));
  if (!fontResponse.ok || !boldFontResponse.ok) return new Response("PDF font is unavailable", { status: 503 });
  const iconResponse = await fetch(new URL("/karta-icon.png", request.url));

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await fontResponse.arrayBuffer();
  const boldFontBytes = await boldFontResponse.arrayBuffer();
  const regular = await pdf.embedFont(fontBytes, { subset: false });
  const bold = await pdf.embedFont(boldFontBytes, { subset: false });
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
      const leafX = MARGIN + 7;
      const leafY = PAGE_H - 45;
      page.drawEllipse({ x: leafX, y: leafY, xScale: 5, yScale: 2.5, rotate: degrees(42), color: BLUE });
      page.drawEllipse({ x: leafX + 2, y: leafY + 1.5, xScale: 3.5, yScale: 1.7, rotate: degrees(42), color: BLUE });
      page.drawLine({ start: { x: leafX - 3, y: leafY - 3 }, end: { x: leafX + 5, y: leafY + 5 }, thickness: 0.8, color: BLUE });
      page.drawText("KARTA", { x: MARGIN + 20, y: PAGE_H - 45, size: 10, font: bold, color: BLUE, characterSpacing: 2 });
      page.drawLine({ start: { x: MARGIN, y: PAGE_H - 58 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 58 }, thickness: 0.6, color: FOOTER_RULE });
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

  const drawEmptyRow = (value: string) => {
    ensureSpace(26);
    page.drawText(value, { x: MARGIN + 22, y: y - 11, size: 11, font: regular, color: MUTED });
    y -= 26;
  };

  const drawRoundedRect = (x: number, bottom: number, width: number, height: number, radius: number, fill: ReturnType<typeof rgb>, stroke: ReturnType<typeof rgb>, strokeWidth: number, strokeOpacity = 1) => {
    const r = Math.min(radius, width / 2, height / 2);
    const path = `M ${r} 0 H ${width - r} Q ${width} 0 ${width} ${r} V ${height - r} Q ${width} ${height} ${width - r} ${height} H ${r} Q 0 ${height} 0 ${height - r} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(path, { x, y: bottom + height, color: fill, borderColor: stroke, borderWidth: strokeWidth, borderOpacity: strokeOpacity });
  };

  const section = (title: string, icon: string, tint: ReturnType<typeof rgb>) => {
    ensureSpace(56);
    const top = y;
    const accent = icon === "vaccine" ? BLUE : PURPLE;
    drawRoundedRect(MARGIN, top - 27, contentW, 27, 7, tint, accent, 0.5, 0.18);
    if (icon === "vaccine") {
      const cx = MARGIN + 16;
      const cy = top - 14;
      const syringe = rgb(0.457, 0.562, 0.983);
      page.drawLine({ start: { x: cx - 4.5, y: cy - 4.5 }, end: { x: cx + 3.8, y: cy + 3.8 }, thickness: 1.25, color: syringe });
      page.drawLine({ start: { x: cx - 2.5, y: cy - 6.5 }, end: { x: cx + 5.8, y: cy + 1.8 }, thickness: 1.25, color: syringe });
      page.drawLine({ start: { x: cx - 5.6, y: cy - 3.4 }, end: { x: cx - 3.4, y: cy - 5.6 }, thickness: 1.1, color: syringe });
      page.drawLine({ start: { x: cx + 2.7, y: cy + 2.7 }, end: { x: cx + 5.5, y: cy - 0.1 }, thickness: 1.1, color: syringe });
      page.drawLine({ start: { x: cx + 3.8, y: cy + 3.8 }, end: { x: cx + 6.2, y: cy + 6.2 }, thickness: 1.1, color: syringe });
      page.drawLine({ start: { x: cx - 4.5, y: cy - 4.5 }, end: { x: cx - 6.5, y: cy - 6.5 }, thickness: 0.8, color: syringe });
    } else {
      const centerX = MARGIN + 16;
      const centerY = top - 14;
      page.drawEllipse({ x: centerX, y: centerY, xScale: 8, yScale: 4.5, rotate: degrees(35), color: tint, borderColor: accent, borderWidth: 0.9 });
      page.drawLine({ start: { x: centerX - 1.4, y: centerY - 2 }, end: { x: centerX + 1.4, y: centerY + 2 }, thickness: 0.7, color: accent });
    }
    page.drawText(title.toLocaleUpperCase(en ? "en-US" : "ru-RU"), { x: MARGIN + 30, y: top - 18, size: 9, font: bold, color: accent, characterSpacing: 1.8 });
    y -= 38;
  };

  const vaccineRow = (title: string, doseLabel: string, date: string, brand?: string | null) => {
    const dateWidth = regular.widthOfTextAtSize(date, 11);
    const titleMaxWidth = contentW - 22 - dateWidth - 12;
    const titleLines = wrappedLines(`${title}${doseLabel}`, bold, 12, titleMaxWidth);
    const brandLines = brand ? wrappedLines(brand, regular, 10, contentW - 22) : [];
    const height = Math.max(26, titleLines.length * 14 + (brandLines.length ? brandLines.length * 12 + 3 : 0) + 6);
    ensureSpace(height + 4);
    const top = y;
    page.drawCircle({ x: MARGIN + 9, y: top - 10, size: 6.5, color: SUCCESS });
    page.drawLine({ start: { x: MARGIN + 6.4, y: top - 10 }, end: { x: MARGIN + 8.3, y: top - 11.9 }, thickness: 1, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: MARGIN + 8.3, y: top - 11.9 }, end: { x: MARGIN + 11.8, y: top - 8.2 }, thickness: 1, color: rgb(1, 1, 1) });
    titleLines.forEach((line, index) => page.drawText(line, { x: MARGIN + 22, y: top - 11 - index * 14, size: 12, font: bold, color: INK }));
    page.drawText(date, { x: PAGE_W - MARGIN - dateWidth, y: top - 11, size: 11, font: regular, color: MUTED });
    brandLines.forEach((line, index) => page.drawText(line, { x: MARGIN + 22, y: top - 11 - titleLines.length * 14 - index * 12, size: 10, font: regular, color: rgb(0.586, 0.665, 0.987) }));
    y = top - height;
    page.drawLine({ start: { x: MARGIN + 22, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: ROW_RULE });
    y -= 4;
  };

  const medicationRow = (title: string, dosage: string | null, frequency: string) => {
    const detail = [dosage, frequency].filter(Boolean).join(" · ");
    const detailMaxWidth = contentW * 0.44;
    const detailWidth = Math.min(detailMaxWidth, Math.max(90, regular.widthOfTextAtSize(detail, 10)));
    const titleLines = wrappedLines(title, bold, 12, contentW - 18 - detailWidth - 12);
    const detailLines = wrappedLines(detail, regular, 10, detailWidth);
    const height = Math.max(22, Math.max(titleLines.length * 14, detailLines.length * 12) + 8);
    ensureSpace(height + 4);
    const top = y;
    page.drawCircle({ x: MARGIN + 7.5, y: top - 10, size: 2.5, color: rgb(0.361, 0.486, 0.98), opacity: 0.35 });
    titleLines.forEach((line, index) => page.drawText(line, { x: MARGIN + 18, y: top - 11 - index * 14, size: 12, font: bold, color: INK }));
    detailLines.forEach((line, index) => {
      const lineWidth = regular.widthOfTextAtSize(line, 10);
      page.drawText(line, { x: PAGE_W - MARGIN - lineWidth, y: top - 10 - index * 12, size: 10, font: regular, color: MUTED });
    });
    y = top - height;
    page.drawLine({ start: { x: MARGIN + 18, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: ROW_RULE });
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
    page.drawLine({ start: { x: MARGIN + 22, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: ROW_RULE });
    y -= 4;
  };

  newPage(true);
  // Recreate the iOS diagonal blue gradient with small interpolated PDF tiles.
  const gradientStops = [rgb(0.361, 0.486, 0.98), rgb(0.455, 0.561, 0.988), rgb(0.455, 0.753, 0.988)];
  const columns = 48;
  const rows = 12;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = PAGE_W * column / columns;
      const topY = 92 * row / rows;
      const t = (x + topY) / (PAGE_W + 92);
      const segment = t < 0.55 ? 0 : 1;
      const localT = segment === 0 ? t / 0.55 : (t - 0.55) / 0.45;
      const from = gradientStops[segment];
      const to = gradientStops[segment + 1];
      const color = rgb(from.red + (to.red - from.red) * localT, from.green + (to.green - from.green) * localT, from.blue + (to.blue - from.blue) * localT);
      const tileY = PAGE_H - 92 + (rows - 1 - row) * 92 / rows;
      page.drawRectangle({ x, y: tileY, width: PAGE_W / columns + 0.4, height: 92 / rows + 0.4, color });
    }
  }
  page.drawCircle({ x: PAGE_W * 0.49, y: PAGE_H + 22, size: 70, color: rgb(1, 1, 1), opacity: 0.06 });
  page.drawCircle({ x: PAGE_W * 0.55, y: PAGE_H - 50, size: 40, color: rgb(1, 1, 1), opacity: 0.06 });
  if (icon) page.drawImage(icon, { x: MARGIN, y: PAGE_H - 69, width: 42, height: 42 });
  page.drawText("Karta", { x: MARGIN + 52, y: PAGE_H - 48, size: 24, font: bold, color: rgb(1, 1, 1) });
  const passportTitle = en ? "HEALTH PASSPORT" : "ПАСПОРТ ЗДОРОВЬЯ";
  const titleWidth = bold.widthOfTextAtSize(passportTitle, 10) + Math.max(0, passportTitle.length - 1) * 2.5;
  page.drawText(passportTitle, { x: (PAGE_W - titleWidth) / 2, y: PAGE_H - 47, size: 10, font: bold, color: rgb(1, 1, 1), characterSpacing: 2.5 });
  y = PAGE_H - 108;

  const profileTop = y;
  drawRoundedRect(MARGIN, profileTop - 64, contentW, 64, 10, PALE, BORDER, 0.5);
  const name = data.profile?.fullName || user.displayName || (en ? "Name not specified" : "Имя не указано");
  page.drawText(name, { x: MARGIN + 14, y: profileTop - 22, size: 15, font: bold, color: INK, maxWidth: contentW - 28 });
  const profileLine = [birthDateDisplayValue(data.profile?.birthDate), data.profile?.cityCurrent].filter(Boolean).join("  ·  ") || (en ? "Location not set" : "Город не указан");
  page.drawText(profileLine, { x: MARGIN + 14, y: profileTop - 42, size: 11, font: regular, color: PROFILE_MUTED, maxWidth: contentW - 28 });
  const generated = `${en ? "Generated" : "Выгружено"} ${new Intl.DateTimeFormat(en ? "en-US" : "ru-RU", { dateStyle: "long" }).format(new Date())}`;
  page.drawText(generated, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(generated, 9) - 14, y: profileTop - 57, size: 9, font: regular, color: MUTED });
  y -= 82;

  if (showMedications) {
    const activeMeds = data.medications.filter((med) => med.isActive);
    section(en ? "Current medications" : "Принимаемые лекарства", "medication", rgb(0.96, 0.93, 1));
    if (!activeMeds.length) drawEmptyRow(en ? "No medication records" : "Нет записей о лекарствах");
    for (const med of activeMeds) {
      const frequency = med.frequency === "weekly" ? (en ? "weekly" : "еженедельно") : med.frequency === "as_needed" ? (en ? "as needed" : "по необходимости") : (en ? "daily" : "ежедневно");
      const entry = (medicationCatalog as Array<{ id: string; ru: string; en: string }>).find((item) => item.id === med.drugCode || item.ru === med.name);
      const title = en && entry?.en ? entry.en.charAt(0).toLocaleUpperCase("en-US") + entry.en.slice(1) : med.name;
      medicationRow(title, med.dosage, frequency);
    }
    y -= 8;
  }

  if (showVaccinations) {
    section(en ? "Completed vaccinations" : "Сделанные прививки", "vaccine", rgb(0.93, 0.95, 1));
    const completedVaccinations = data.vaccinations.filter(({ record }) => !readVaccinationMetadata(record.notes).isUpcoming);
    if (completedVaccinations.length === 0) drawEmptyRow(en ? "No vaccination records" : "Нет записей о прививках");
    for (const { record, vaccine } of completedVaccinations) {
      const metadata = readVaccinationMetadata(record.notes);
      const title = en ? (vaccine?.nameEn || metadata.name || record.vaccineId) : (metadata.name || vaccine?.nameRu || record.vaccineId);
      const totalDoses = metadata.totalDoses ?? vaccine?.totalDoses ?? 1;
      const dose = totalDoses > 1 ? (en ? ` (dose ${record.doseNumber} of ${totalDoses})` : ` (доза ${record.doseNumber} из ${totalDoses})`) : "";
      vaccineRow(title, dose, displayVaccinationDate(metadata, record.dateGiven, lang), record.brand);
    }
    y -= 8;
  }

  for (const [index, pdfPage] of pdf.getPages().entries()) {
    pdfPage.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: PAGE_W - MARGIN, y: 28 }, thickness: 0.5, color: FOOTER_RULE });
    pdfPage.drawText("Karta", { x: MARGIN, y: 15, size: 8, font: regular, color: MUTED });
    const label = en ? `Page ${index + 1}` : `Стр. ${index + 1}`;
    pdfPage.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8), y: 15, size: 8, font: regular, color: MUTED });
  }

  const bytes = await pdf.save();
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="karta-health-card-${lang}.pdf"`, "Cache-Control": "no-store" } });
}
