import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { RiskCategory, RiskResult } from "@/types/risk";

// ── Layout ────────────────────────────────────────────────────────────────────
const PAGE_MARGIN  = 48;
const PAGE_WIDTH   = 595.28;
const PAGE_HEIGHT  = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const BAND_HEIGHT  = 8;

// ── Palette ───────────────────────────────────────────────────────────────────
const BRAND      = rgb(0.06, 0.31, 0.66);
const BRAND_DEEP = rgb(0.03, 0.21, 0.44);
const BRAND_SOFT = rgb(0.86, 0.91, 0.99);
const SLATE_950  = rgb(0.04, 0.05, 0.09);
const SLATE_900  = rgb(0.06, 0.09, 0.16);
const SLATE_700  = rgb(0.17, 0.22, 0.31);
const SLATE_600  = rgb(0.29, 0.35, 0.44);
const SLATE_400  = rgb(0.58, 0.64, 0.72);
const LINE       = rgb(0.90, 0.92, 0.95);
const PANEL      = rgb(0.97, 0.98, 0.99);
const WHITE      = rgb(1, 1, 1);

// ── Risk tones ────────────────────────────────────────────────────────────────
function getPriorityLabel(priority: RiskCategory["priority"]) {
  if (priority === "high")   return "Élevé";
  if (priority === "medium") return "Modéré";
  return "Faible";
}

function getPriorityColors(priority: RiskCategory["priority"]) {
  if (priority === "high") return {
    fill:   rgb(0.99, 0.93, 0.93),
    text:   rgb(0.66, 0.18, 0.18),
    band:   rgb(0.86, 0.23, 0.23),
    dot:    rgb(0.94, 0.27, 0.27),
  };
  if (priority === "medium") return {
    fill:   rgb(1.00, 0.97, 0.88),
    text:   rgb(0.72, 0.47, 0.12),
    band:   rgb(0.92, 0.60, 0.12),
    dot:    rgb(0.96, 0.69, 0.13),
  };
  return {
    fill:   rgb(0.91, 0.97, 0.93),
    text:   rgb(0.11, 0.48, 0.35),
    band:   rgb(0.13, 0.60, 0.42),
    dot:    rgb(0.13, 0.73, 0.49),
  };
}

function getOverallRiskColors(level: "low" | "medium" | "high") {
  if (level === "high") return {
    bg:     rgb(1.00, 0.94, 0.94),
    border: rgb(0.98, 0.84, 0.84),
    label:  rgb(0.66, 0.18, 0.18),
    band:   rgb(0.86, 0.23, 0.23),
  };
  if (level === "medium") return {
    bg:     rgb(1.00, 0.97, 0.90),
    border: rgb(0.98, 0.93, 0.77),
    label:  rgb(0.72, 0.47, 0.12),
    band:   rgb(0.92, 0.60, 0.12),
  };
  return {
    bg:     rgb(0.93, 0.99, 0.95),
    border: rgb(0.82, 0.96, 0.88),
    label:  rgb(0.11, 0.48, 0.35),
    band:   rgb(0.13, 0.60, 0.42),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAnalysisDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

function sanitizeFilenamePart(value: string) {
  // eslint-disable-next-line no-control-regex
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(""); continue; }
    let current = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

function drawParagraph(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size = 11,
  color = SLATE_600,
  lineHeight = 16,
): number {
  const lines = wrapText(text, font, size, maxWidth);
  page.drawText(lines.join("\n"), { x, y, font, size, color, lineHeight });
  return y - lines.length * lineHeight;
}

// ── Reusable drawing ──────────────────────────────────────────────────────────

function drawLabel(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  color = SLATE_400,
) {
  page.drawText(text.toUpperCase(), { x, y, font, size: 7.5, color });
}

function drawSectionCard(
  page: ReturnType<PDFDocument["addPage"]>,
  label: string,
  text: string,
  x: number,
  y: number,
  width: number,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  gap = 12,
): number {
  const bodySize = 10.5;
  const bodyLH = 15;
  const inner = width - 32;
  const textLines = wrapText(text, bodyFont, bodySize, inner);
  const cardH = 28 + textLines.length * bodyLH + 16;

  page.drawRectangle({
    x, y: y - cardH, width, height: cardH,
    color: PANEL, borderColor: LINE, borderWidth: 0.5,  });
  drawLabel(page, label, x + 16, y - 17, titleFont);
  page.drawText(textLines.join("\n"), {
    x: x + 16, y: y - 33,
    font: bodyFont, size: bodySize, color: SLATE_700, lineHeight: bodyLH,
  });

  return y - cardH - gap;
}

// Draws the horizontal risk scan bar used on the cover
function drawScanBar(
  page: ReturnType<PDFDocument["addPage"]>,
  categories: RiskCategory[],
  x: number,
  y: number,
  totalWidth: number,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): number {
  const n = categories.length;
  const gap = 6;
  const pillW = (totalWidth - (n - 1) * gap) / n;
  const pillH = 42;

  categories.forEach((risk, i) => {
    const tone = getPriorityColors(risk.priority);
    const px = x + i * (pillW + gap);

    page.drawRectangle({
      x: px, y: y - pillH, width: pillW, height: pillH,
      color: tone.fill, borderColor: tone.text, borderWidth: 0.5,
    });

    // Colored left accent bar
    page.drawRectangle({
      x: px, y: y - pillH, width: 4, height: pillH,
      color: tone.band,
    });

    // Category label
    const maxLabelW = pillW - 20;
    const labelLines = wrapText(risk.label, titleFont, 9, maxLabelW);
    page.drawText(labelLines[0] ?? risk.label, {
      x: px + 12, y: y - 17,
      font: titleFont, size: 9, color: SLATE_900,
    });
    // Level text
    page.drawText(getPriorityLabel(risk.priority), {
      x: px + 12, y: y - 30,
      font: bodyFont, size: 8.5, color: tone.text,
    });
  });

  return y - pillH;
}

function drawTopBand(
  page: ReturnType<PDFDocument["addPage"]>,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - BAND_HEIGHT, width: PAGE_WIDTH, height: BAND_HEIGHT, color });
}

// Mini page header for interior pages (address context)
function drawPageHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  address: string,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  const short = address.length > 72 ? `${address.slice(0, 72)}…` : address;
  page.drawText("Mon Risque Habitat  ·  ", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - BAND_HEIGHT - 20,
    font: bodyFont, size: 7.5, color: SLATE_400,
  });
  page.drawText(short, {
    x: PAGE_MARGIN + 107,
    y: PAGE_HEIGHT - BAND_HEIGHT - 20,
    font: bodyFont, size: 7.5, color: SLATE_600,
  });
}

function buildFooter(
  page: ReturnType<PDFDocument["addPage"]>,
  pageNumber: number,
  headingFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  page.drawLine({
    start: { x: PAGE_MARGIN, y: 40 },
    end:   { x: PAGE_WIDTH - PAGE_MARGIN, y: 40 },
    thickness: 0.5, color: LINE,
  });
  page.drawText("Mon Risque Habitat", {
    x: PAGE_MARGIN, y: 24,
    size: 8, font: headingFont, color: SLATE_600,
  });
  page.drawText("by AGS & Co", {
    x: PAGE_MARGIN + 112, y: 24,
    size: 8, font: bodyFont, color: SLATE_400,
  });
  page.drawText(`${pageNumber}`, {
    x: PAGE_WIDTH - PAGE_MARGIN - 8, y: 24,
    size: 8, font: bodyFont, color: SLATE_400,
  });
}

// ── Risk detail page ──────────────────────────────────────────────────────────
function drawRiskBlock(
  page: ReturnType<PDFDocument["addPage"]>,
  risk: RiskCategory,
  address: string,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  const tone = getPriorityColors(risk.priority);

  drawTopBand(page, tone.band);
  drawPageHeader(page, address, bodyFont);

  let y = PAGE_HEIGHT - BAND_HEIGHT - 44;

  // Priority pill badge
  const badgeLabel = getPriorityLabel(risk.priority).toUpperCase();
  const badgeW = titleFont.widthOfTextAtSize(badgeLabel, 8) + 28;
  page.drawRectangle({
    x: PAGE_MARGIN, y: y - 22, width: badgeW, height: 22,
    color: tone.fill, borderColor: tone.text, borderWidth: 0.5,
  });
  page.drawEllipse({ x: PAGE_MARGIN + 13, y: y - 11, xScale: 3.5, yScale: 3.5, color: tone.dot });
  page.drawText(badgeLabel, {
    x: PAGE_MARGIN + 20, y: y - 15,
    size: 8, font: titleFont, color: tone.text,
  });
  y -= 36;

  // Risk title
  page.drawText(risk.label, {
    x: PAGE_MARGIN, y,
    size: 28, font: titleFont, color: SLATE_950,
  });
  y -= 32;

  // Decision line
  page.drawText(risk.decision, {
    x: PAGE_MARGIN, y,
    size: 11, font: titleFont, color: tone.band,
  });
  y -= 22;

  // Separator
  page.drawLine({
    start: { x: PAGE_MARGIN, y }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5, color: LINE,
  });
  y -= 18;

  // Section cards
  const summaryText = [risk.summary, risk.territoryContext].filter(Boolean).join(" ");
  y = drawSectionCard(page, "Synthèse", summaryText, PAGE_MARGIN, y, CONTENT_WIDTH, titleFont, bodyFont);
  y = drawSectionCard(page, "Ce que vous pouvez faire", risk.recommendation, PAGE_MARGIN, y, CONTENT_WIDTH, titleFont, bodyFont);
  drawSectionCard(page, "Points à surveiller", risk.watch, PAGE_MARGIN, y, CONTENT_WIDTH, titleFont, bodyFont);
}

// ── Recommendation page ───────────────────────────────────────────────────────
function drawRecommendationPage(
  page: ReturnType<PDFDocument["addPage"]>,
  recommendation: RiskResult["finalRecommendation"],
  address: string,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  drawTopBand(page, BRAND);
  drawPageHeader(page, address, bodyFont);

  let y = PAGE_HEIGHT - BAND_HEIGHT - 44;

  // Eyebrow
  drawLabel(page, "Priorités", PAGE_MARGIN, y, titleFont, BRAND);
  y -= 28;

  // Title
  const titleLines = wrapText(recommendation.title, titleFont, 24, CONTENT_WIDTH);
  page.drawText(titleLines.join("\n"), {
    x: PAGE_MARGIN, y,
    font: titleFont, size: 24, color: SLATE_950, lineHeight: 30,
  });
  y -= titleLines.length * 30 + 14;

  // Separator
  page.drawLine({
    start: { x: PAGE_MARGIN, y }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5, color: LINE,
  });
  y -= 20;

  // Summary
  y = drawParagraph(page, recommendation.summary, PAGE_MARGIN, y, CONTENT_WIDTH, bodyFont, 11, SLATE_600, 17);
  y -= 28;

  // Action cards — 3 columns
  const n = recommendation.checklist.length;
  const cardGap = 10;
  const cardW = (CONTENT_WIDTH - (n - 1) * cardGap) / n;

  recommendation.checklist.forEach((item, index) => {
    const cx = PAGE_MARGIN + index * (cardW + cardGap);
    const textLines = wrapText(item, bodyFont, 10.5, cardW - 32);
    const cardH = 50 + textLines.length * 15 + 16;

    // Card background
    page.drawRectangle({
      x: cx, y: y - cardH, width: cardW, height: cardH,
      color: PANEL, borderColor: LINE, borderWidth: 0.5,    });
    // Top accent
    page.drawRectangle({
      x: cx, y: y - 4, width: cardW, height: 4,
      color: BRAND,    });
    // Action label
    page.drawText(`ACTION ${index + 1}`, {
      x: cx + 16, y: y - 20,
      size: 7.5, font: titleFont, color: BRAND,
    });
    // Item text
    page.drawText(textLines.join("\n"), {
      x: cx + 16, y: y - 38,
      font: bodyFont, size: 10.5, color: SLATE_700, lineHeight: 15,
    });
  });
}

// ── Logo ──────────────────────────────────────────────────────────────────────
async function loadLogo(pdf: PDFDocument) {
  const configuredPath = process.env.MRH_PDF_LOGO_PATH ?? "/brand/logoMRH.png";
  const normalizedPath = configuredPath.startsWith("/")
    ? path.join(process.cwd(), "public", configuredPath)
    : path.join(process.cwd(), configuredPath);
  if (!existsSync(normalizedPath)) return null;
  const bytes = readFileSync(normalizedPath);
  const ext = path.extname(normalizedPath).toLowerCase();
  if (ext === ".png")  return pdf.embedPng(bytes);
  if (ext === ".jpg" || ext === ".jpeg") return pdf.embedJpg(bytes);
  return null;
}

// ── Public exports ────────────────────────────────────────────────────────────
export function buildRiskReportFilename(address: string, analyzedAt: string) {
  const datePart = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(analyzedAt)).replaceAll("-", "");
  return `mrh-rapport-${sanitizeFilenamePart(address) || "adresse"}-${datePart}.pdf`;
}

export async function createRiskReportPdf(result: RiskResult) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Mon Risque Habitat | ${result.address}`);
  pdf.setAuthor("AGS & Co");
  pdf.setSubject("Synthèse de risque habitat");
  pdf.setCreator("Mon Risque Habitat — by AGS & Co");
  pdf.setProducer("Mon Risque Habitat — by AGS & Co");

  const headingFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont    = await pdf.embedFont(StandardFonts.Helvetica);
  const logo        = await loadLogo(pdf);
  const riskColors  = getOverallRiskColors(result.overallRisk.level);

  // ── COUVERTURE ───────────────────────────────────────────────────────────────
  const cover = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });

  drawTopBand(cover, riskColors.band);

  // Logo (top-right)
  const LOGO_SIZE = 52;
  if (logo) {
    const dim = logo.scale(1);
    const ratio = Math.min(LOGO_SIZE / dim.width, LOGO_SIZE / dim.height);
    cover.drawImage(logo, {
      x: PAGE_WIDTH - PAGE_MARGIN - dim.width * ratio,
      y: PAGE_HEIGHT - PAGE_MARGIN - dim.height * ratio,
      width: dim.width * ratio,
      height: dim.height * ratio,
    });
  } else {
    cover.drawRectangle({
      x: PAGE_WIDTH - PAGE_MARGIN - LOGO_SIZE,
      y: PAGE_HEIGHT - PAGE_MARGIN - LOGO_SIZE,
      width: LOGO_SIZE, height: LOGO_SIZE,
      color: BRAND_SOFT,
    });
    cover.drawText("MRH", {
      x: PAGE_WIDTH - PAGE_MARGIN - LOGO_SIZE + 10,
      y: PAGE_HEIGHT - PAGE_MARGIN - LOGO_SIZE / 2 - 5,
      size: 13, font: headingFont, color: BRAND_DEEP,
    });
  }

  // Brand header (top-left)
  cover.drawText("Mon Risque Habitat", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 8,
    size: 17, font: headingFont, color: SLATE_900,
  });
  cover.drawText("by AGS & Co", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 26,
    size: 9, font: bodyFont, color: SLATE_400,
  });

  // ── Document title block
  let y = PAGE_HEIGHT - 132;
  drawLabel(cover, "Analyse immobilière", PAGE_MARGIN, y, headingFont, BRAND);
  y -= 24;
  cover.drawText("Rapport de synthèse des risques", {
    x: PAGE_MARGIN, y,
    size: 26, font: headingFont, color: SLATE_950,
  });
  y -= 16;
  cover.drawText("Analyse construite à partir des données officielles Géorisques.", {
    x: PAGE_MARGIN, y,
    size: 10.5, font: bodyFont, color: SLATE_600,
  });
  y -= 20;

  // Separator
  cover.drawLine({
    start: { x: PAGE_MARGIN, y }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5, color: LINE,
  });
  y -= 22;

  // ── Adresse + date card
  const adresseCardH = 96;
  cover.drawRectangle({
    x: PAGE_MARGIN, y: y - adresseCardH,
    width: CONTENT_WIDTH, height: adresseCardH,
    color: PANEL, borderColor: LINE, borderWidth: 0.5,  });
  drawLabel(cover, "Adresse analysée", PAGE_MARGIN + 20, y - 16, headingFont);
  drawParagraph(cover, result.address, PAGE_MARGIN + 20, y - 33, CONTENT_WIDTH - 40, headingFont, 15, SLATE_900, 20);
  drawLabel(cover, "Date d'analyse", PAGE_MARGIN + 20, y - 66, headingFont);
  cover.drawText(formatAnalysisDate(result.analyzedAt), {
    x: PAGE_MARGIN + 20, y: y - 82,
    size: 10, font: bodyFont, color: SLATE_600,
  });
  y -= adresseCardH + 14;

  // ── Niveau de risque global (hero)
  const heroCardH = 128;
  cover.drawRectangle({
    x: PAGE_MARGIN, y: y - heroCardH,
    width: CONTENT_WIDTH, height: heroCardH,
    color: riskColors.bg, borderColor: riskColors.border, borderWidth: 0.5,  });
  // Left accent
  cover.drawRectangle({
    x: PAGE_MARGIN, y: y - heroCardH,
    width: 5, height: heroCardH,
    color: riskColors.band,  });
  drawLabel(cover, "Niveau de risque global", PAGE_MARGIN + 18, y - 17, headingFont, riskColors.label);
  cover.drawText(result.overallRisk.label, {
    x: PAGE_MARGIN + 18, y: y - 42,
    size: 28, font: headingFont, color: riskColors.label,
  });
  cover.drawText(result.overallRisk.decision, {
    x: PAGE_MARGIN + 18, y: y - 70,
    size: 10, font: headingFont, color: riskColors.band,
  });
  drawParagraph(cover, result.overallRisk.summary, PAGE_MARGIN + 18, y - 86, CONTENT_WIDTH - 36, bodyFont, 10, SLATE_700, 15);
  y -= heroCardH + 14;

  // ── Scan bar (vue d'ensemble des risques)
  drawLabel(cover, "Vue d'ensemble", PAGE_MARGIN, y, headingFont);
  y -= 14;
  y = drawScanBar(cover, result.categories, PAGE_MARGIN, y, CONTENT_WIDTH, headingFont, bodyFont);
  y -= 18;

  // ── Takeaway
  drawLabel(cover, "Synthèse", PAGE_MARGIN, y, headingFont);
  y = drawParagraph(cover, result.overallRisk.takeaway, PAGE_MARGIN, y - 14, CONTENT_WIDTH, bodyFont, 10.5, SLATE_700, 15);
  y -= 14;

  // ── Rationale
  drawLabel(cover, "Contexte", PAGE_MARGIN, y, headingFont);
  drawParagraph(cover, result.overallRisk.rationale, PAGE_MARGIN, y - 14, CONTENT_WIDTH, bodyFont, 10, SLATE_600, 14);

  // ── Disclaimer
  cover.drawLine({
    start: { x: PAGE_MARGIN, y: 82 }, end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 82 },
    thickness: 0.5, color: LINE,
  });
  drawParagraph(
    cover,
    "Ce rapport est fourni à titre informatif sur la base de données publiques officielles (Géorisques, BRGM, ERRIAL). " +
    "Il ne remplace pas un état des risques réglementaire ni l'avis d'un professionnel qualifié.",
    PAGE_MARGIN, 66, CONTENT_WIDTH, bodyFont, 8, SLATE_400, 12,
  );

  buildFooter(cover, 1, headingFont, bodyFont);

  // ── PAGES PAR RISQUE ─────────────────────────────────────────────────────────
  result.categories.forEach((risk, index) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
    drawRiskBlock(page, risk, result.address, headingFont, bodyFont);
    buildFooter(page, index + 2, headingFont, bodyFont);
  });

  // ── PAGE DE RECOMMANDATIONS ───────────────────────────────────────────────────
  const recoPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  recoPage.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });
  drawRecommendationPage(recoPage, result.finalRecommendation, result.address, headingFont, bodyFont);
  buildFooter(recoPage, result.categories.length + 2, headingFont, bodyFont);

  return pdf.save();
}
