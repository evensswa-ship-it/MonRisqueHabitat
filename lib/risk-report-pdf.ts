import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { RiskCategory, RiskResult } from "@/types/risk";

const PAGE_MARGIN = 48;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const BRAND = rgb(0.06, 0.31, 0.66);
const BRAND_DEEP = rgb(0.03, 0.21, 0.44);
const SLATE_900 = rgb(0.06, 0.09, 0.16);
const SLATE_700 = rgb(0.17, 0.22, 0.31);
const SLATE_600 = rgb(0.29, 0.35, 0.44);
const SLATE_400 = rgb(0.58, 0.64, 0.72);
const LINE = rgb(0.86, 0.89, 0.93);
const PANEL = rgb(0.97, 0.98, 0.99);
const WHITE = rgb(1, 1, 1);

function formatAnalysisDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(new Date(value));
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function getPriorityLabel(priority: RiskCategory["priority"]) {
  if (priority === "high") return "Élevé";
  if (priority === "medium") return "Modéré";
  return "Faible";
}

function getPriorityColors(priority: RiskCategory["priority"]) {
  if (priority === "high") {
    return { fill: rgb(0.99, 0.93, 0.93), text: rgb(0.66, 0.18, 0.18), band: rgb(0.86, 0.23, 0.23) };
  }
  if (priority === "medium") {
    return { fill: rgb(1, 0.96, 0.86), text: rgb(0.7, 0.47, 0.12), band: rgb(0.92, 0.6, 0.12) };
  }
  return { fill: rgb(0.91, 0.97, 0.93), text: rgb(0.11, 0.48, 0.35), band: rgb(0.13, 0.6, 0.42) };
}

function getOverallRiskColors(level: "low" | "medium" | "high") {
  if (level === "high") {
    return {
      bg: rgb(1, 0.94, 0.94),
      border: rgb(0.98, 0.84, 0.84),
      label: rgb(0.66, 0.18, 0.18),
      band: rgb(0.86, 0.23, 0.23)
    };
  }
  if (level === "medium") {
    return {
      bg: rgb(1, 0.97, 0.9),
      border: rgb(0.98, 0.93, 0.77),
      label: rgb(0.7, 0.47, 0.12),
      band: rgb(0.92, 0.6, 0.12)
    };
  }
  return {
    bg: rgb(0.93, 0.99, 0.95),
    border: rgb(0.82, 0.96, 0.88),
    label: rgb(0.11, 0.48, 0.35),
    band: rgb(0.13, 0.6, 0.42)
  };
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];

    for (const word of words.slice(1)) {
      const candidate = `${currentLine} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
        continue;
      }
      lines.push(currentLine);
      currentLine = word;
    }

    lines.push(currentLine);
  }

  return lines;
}

async function loadLogo(pdf: PDFDocument) {
  const configuredPath = process.env.MRH_PDF_LOGO_PATH ?? "/brand/logoMRH.png";
  const normalizedPath = configuredPath.startsWith("/")
    ? path.join(process.cwd(), "public", configuredPath)
    : path.join(process.cwd(), configuredPath);

  if (!existsSync(normalizedPath)) return null;

  const bytes = readFileSync(normalizedPath);
  const extension = path.extname(normalizedPath).toLowerCase();

  if (extension === ".png") return pdf.embedPng(bytes);
  if (extension === ".jpg" || extension === ".jpeg") return pdf.embedJpg(bytes);
  return null;
}

function buildFooter(
  page: ReturnType<PDFDocument["addPage"]>,
  pageNumber: number,
  headingFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  page.drawLine({
    start: { x: PAGE_MARGIN, y: 38 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 38 },
    thickness: 0.5,
    color: LINE
  });
  page.drawText("Mon Risque Habitat", {
    x: PAGE_MARGIN,
    y: 22,
    size: 8,
    font: headingFont,
    color: SLATE_600
  });
  page.drawText("by AGS & Co", {
    x: PAGE_MARGIN + 112,
    y: 22,
    size: 8,
    font: bodyFont,
    color: SLATE_400
  });
  page.drawText(`${pageNumber}`, {
    x: PAGE_WIDTH - PAGE_MARGIN - 8,
    y: 22,
    size: 8,
    font: bodyFont,
    color: SLATE_400
  });
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
  lineHeight = 16
): number {
  const lines = wrapText(text, font, size, maxWidth);
  page.drawText(lines.join("\n"), { x, y, font, size, color, lineHeight });
  return y - lines.length * lineHeight;
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
  gap = 14
): number {
  const bodySize = 10.5;
  const bodyLineHeight = 15;
  const contentWidth = width - 28;
  const textLines = wrapText(text, bodyFont, bodySize, contentWidth);
  const cardHeight = 26 + textLines.length * bodyLineHeight + 18;

  page.drawRectangle({
    x,
    y: y - cardHeight,
    width,
    height: cardHeight,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 0.5
  });
  page.drawText(label.toUpperCase(), {
    x: x + 14,
    y: y - 17,
    font: titleFont,
    size: 7.5,
    color: SLATE_400
  });
  page.drawText(textLines.join("\n"), {
    x: x + 14,
    y: y - 34,
    font: bodyFont,
    size: bodySize,
    color: SLATE_700,
    lineHeight: bodyLineHeight
  });

  return y - cardHeight - gap;
}

function drawRiskBlock(
  page: ReturnType<PDFDocument["addPage"]>,
  risk: RiskCategory,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const tone = getPriorityColors(risk.priority);

  // Colored top band
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: tone.band
  });

  let cursorY = PAGE_HEIGHT - PAGE_MARGIN - 10;

  // Priority badge
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: cursorY - 22,
    width: 80,
    height: 22,
    color: tone.fill,
    borderColor: tone.text,
    borderWidth: 0.5
  });
  page.drawText(getPriorityLabel(risk.priority).toUpperCase(), {
    x: PAGE_MARGIN + 12,
    y: cursorY - 14,
    size: 8,
    font: titleFont,
    color: tone.text
  });
  cursorY -= 38;

  // Risk title
  page.drawText(risk.label, {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 26,
    font: titleFont,
    color: SLATE_900
  });
  cursorY -= 28;

  // Decision
  page.drawText(risk.decision, {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 11,
    font: titleFont,
    color: tone.band
  });
  cursorY -= 24;

  // Separator
  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: cursorY },
    thickness: 0.5,
    color: LINE
  });
  cursorY -= 18;

  const summaryText = [risk.summary, risk.territoryContext].filter(Boolean).join(" ");
  cursorY = drawSectionCard(page, "Synthèse", summaryText, PAGE_MARGIN, cursorY, CONTENT_WIDTH, titleFont, bodyFont);
  cursorY = drawSectionCard(page, "Ce que vous pouvez faire", risk.recommendation, PAGE_MARGIN, cursorY, CONTENT_WIDTH, titleFont, bodyFont);
  drawSectionCard(page, "Points à surveiller", risk.watch, PAGE_MARGIN, cursorY, CONTENT_WIDTH, titleFont, bodyFont);
}

function drawRecommendationPage(
  page: ReturnType<PDFDocument["addPage"]>,
  recommendation: RiskResult["finalRecommendation"],
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  // Top accent band
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 6,
    width: PAGE_WIDTH,
    height: 6,
    color: BRAND
  });

  let cursorY = PAGE_HEIGHT - PAGE_MARGIN - 10;

  page.drawText("PRIORITÉS", {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 8,
    font: titleFont,
    color: BRAND
  });
  cursorY -= 28;

  page.drawText(recommendation.title, {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 24,
    font: titleFont,
    color: SLATE_900
  });
  cursorY -= 16;

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: cursorY },
    thickness: 0.5,
    color: LINE
  });
  cursorY -= 20;

  cursorY = drawParagraph(page, recommendation.summary, PAGE_MARGIN, cursorY, CONTENT_WIDTH, bodyFont, 11, SLATE_600, 17);
  cursorY -= 28;

  const CARD_WIDTH = (CONTENT_WIDTH - 16) / 3;
  recommendation.checklist.forEach((item, index) => {
    const x = PAGE_MARGIN + index * (CARD_WIDTH + 8);
    const textLines = wrapText(item, bodyFont, 10.5, CARD_WIDTH - 28);
    const cardHeight = 38 + textLines.length * 15 + 18;

    page.drawRectangle({
      x,
      y: cursorY - cardHeight,
      width: CARD_WIDTH,
      height: cardHeight,
      color: PANEL,
      borderColor: LINE,
      borderWidth: 0.5
    });
    page.drawRectangle({
      x,
      y: cursorY - 4,
      width: CARD_WIDTH,
      height: 4,
      color: BRAND
    });
    page.drawText(`ACTION ${index + 1}`, {
      x: x + 14,
      y: cursorY - 20,
      size: 7.5,
      font: titleFont,
      color: BRAND
    });
    page.drawText(textLines.join("\n"), {
      x: x + 14,
      y: cursorY - 38,
      font: bodyFont,
      size: 10.5,
      color: SLATE_700,
      lineHeight: 15
    });
  });
}

export function buildRiskReportFilename(address: string, analyzedAt: string) {
  const datePart = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(new Date(analyzedAt))
    .replaceAll("-", "");

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
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const logo = await loadLogo(pdf);
  const riskColors = getOverallRiskColors(result.overallRisk.level);

  // ── PAGE DE COUVERTURE ──────────────────────────────────────────────────────

  const cover = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: WHITE });

  // Bande colorée en haut
  cover.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: riskColors.band });

  // Logo
  const LOGO_SIZE = 72;
  if (logo) {
    const dimensions = logo.scale(1);
    const ratio = Math.min(LOGO_SIZE / dimensions.width, LOGO_SIZE / dimensions.height);
    const w = dimensions.width * ratio;
    const h = dimensions.height * ratio;
    cover.drawImage(logo, {
      x: PAGE_WIDTH - PAGE_MARGIN - w,
      y: PAGE_HEIGHT - PAGE_MARGIN - h,
      width: w,
      height: h
    });
  } else {
    cover.drawRectangle({
      x: PAGE_WIDTH - PAGE_MARGIN - LOGO_SIZE,
      y: PAGE_HEIGHT - PAGE_MARGIN - LOGO_SIZE,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      borderWidth: 1,
      borderColor: LINE
    });
    cover.drawText("MRH", {
      x: PAGE_WIDTH - PAGE_MARGIN - LOGO_SIZE + 14,
      y: PAGE_HEIGHT - PAGE_MARGIN - LOGO_SIZE / 2 - 4,
      size: 12,
      font: headingFont,
      color: BRAND_DEEP
    });
  }

  // En-tête marque
  cover.drawText("Mon Risque Habitat", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 8,
    size: 18,
    font: headingFont,
    color: SLATE_900
  });
  cover.drawText("by AGS & Co", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 26,
    size: 9,
    font: bodyFont,
    color: SLATE_400
  });

  // Titre du document
  cover.drawText("Rapport de synthèse des risques", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 164,
    size: 26,
    font: headingFont,
    color: SLATE_900
  });
  cover.drawText("Analyse construite à partir des données officielles Géorisques.", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 190,
    size: 11,
    font: bodyFont,
    color: SLATE_600
  });

  // Séparateur
  cover.drawLine({
    start: { x: PAGE_MARGIN, y: PAGE_HEIGHT - 208 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: PAGE_HEIGHT - 208 },
    thickness: 0.5,
    color: LINE
  });

  // Bloc adresse + date
  cover.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 344,
    width: CONTENT_WIDTH,
    height: 118,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 0.5
  });
  cover.drawText("ADRESSE ANALYSÉE", {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 238,
    size: 7.5,
    font: headingFont,
    color: SLATE_400
  });
  drawParagraph(cover, result.address, PAGE_MARGIN + 20, PAGE_HEIGHT - 256, CONTENT_WIDTH - 40, headingFont, 16, SLATE_900, 20);
  cover.drawText("DATE D'ANALYSE", {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 308,
    size: 7.5,
    font: headingFont,
    color: SLATE_400
  });
  cover.drawText(formatAnalysisDate(result.analyzedAt), {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 326,
    size: 10,
    font: bodyFont,
    color: SLATE_600
  });

  // Bloc niveau de risque global — couleurs adaptées au niveau
  cover.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 480,
    width: CONTENT_WIDTH,
    height: 118,
    color: riskColors.bg,
    borderColor: riskColors.border,
    borderWidth: 0.5
  });
  cover.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 366,
    width: CONTENT_WIDTH,
    height: 4,
    color: riskColors.band
  });
  cover.drawText("NIVEAU DE RISQUE GLOBAL", {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 384,
    size: 7.5,
    font: headingFont,
    color: riskColors.label
  });
  cover.drawText(result.overallRisk.label, {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 406,
    size: 20,
    font: headingFont,
    color: riskColors.label
  });
  cover.drawText(result.overallRisk.decision, {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 428,
    size: 10,
    font: headingFont,
    color: riskColors.band
  });
  drawParagraph(cover, result.overallRisk.summary, PAGE_MARGIN + 20, PAGE_HEIGHT - 448, CONTENT_WIDTH - 40, bodyFont, 10, SLATE_600, 15);

  // Synthèse rapide
  let summaryY = PAGE_HEIGHT - 506;
  cover.drawText("SYNTHÈSE", {
    x: PAGE_MARGIN,
    y: summaryY,
    size: 7.5,
    font: headingFont,
    color: SLATE_400
  });
  summaryY = drawParagraph(cover, result.overallRisk.takeaway, PAGE_MARGIN, summaryY - 16, CONTENT_WIDTH, bodyFont, 11, SLATE_700, 16);
  summaryY -= 16;

  // Risques identifiés
  cover.drawText("RISQUES IDENTIFIÉS", {
    x: PAGE_MARGIN,
    y: summaryY,
    size: 7.5,
    font: headingFont,
    color: SLATE_400
  });
  drawParagraph(
    cover,
    result.categories.map((r) => `${r.label} (${getPriorityLabel(r.priority)})`).join("  ·  "),
    PAGE_MARGIN,
    summaryY - 16,
    CONTENT_WIDTH,
    bodyFont,
    10,
    SLATE_600,
    15
  );

  // Disclaimer en bas de page
  cover.drawLine({
    start: { x: PAGE_MARGIN, y: 80 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 80 },
    thickness: 0.5,
    color: LINE
  });
  drawParagraph(
    cover,
    "Ce rapport est fourni à titre informatif sur la base de données publiques officielles (Géorisques, BRGM, ERRIAL). Il ne remplace pas un état des risques réglementaire ni l'avis d'un professionnel qualifié.",
    PAGE_MARGIN,
    62,
    CONTENT_WIDTH,
    bodyFont,
    8,
    SLATE_400,
    12
  );
  buildFooter(cover, 1, headingFont, bodyFont);

  // ── PAGES PAR RISQUE ────────────────────────────────────────────────────────

  result.categories.forEach((risk, index) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawRiskBlock(page, risk, headingFont, bodyFont);
    buildFooter(page, index + 2, headingFont, bodyFont);
  });

  // ── PAGE DE RECOMMANDATIONS ─────────────────────────────────────────────────

  const recoPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawRecommendationPage(recoPage, result.finalRecommendation, headingFont, bodyFont);
  buildFooter(recoPage, result.categories.length + 2, headingFont, bodyFont);

  return pdf.save();
}
