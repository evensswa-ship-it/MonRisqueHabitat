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
const SLATE_600 = rgb(0.29, 0.35, 0.44);
const SLATE_400 = rgb(0.58, 0.64, 0.72);
const LINE = rgb(0.86, 0.89, 0.93);
const PANEL = rgb(0.97, 0.98, 0.99);

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
  if (priority === "high") {
    return "Élevé";
  }

  if (priority === "medium") {
    return "Modéré";
  }

  return "Faible";
}

function getPriorityColors(priority: RiskCategory["priority"]) {
  if (priority === "high") {
    return {
      fill: rgb(0.99, 0.93, 0.93),
      text: rgb(0.66, 0.18, 0.18)
    };
  }

  if (priority === "medium") {
    return {
      fill: rgb(1, 0.96, 0.86),
      text: rgb(0.7, 0.47, 0.12)
    };
  }

  return {
    fill: rgb(0.91, 0.97, 0.93),
    text: rgb(0.11, 0.48, 0.35)
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

  if (!existsSync(normalizedPath)) {
    return null;
  }

  const bytes = readFileSync(normalizedPath);
  const extension = path.extname(normalizedPath).toLowerCase();

  if (extension === ".png") {
    return pdf.embedPng(bytes);
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return pdf.embedJpg(bytes);
  }

  return null;
}

function buildFooter(page: ReturnType<PDFDocument["addPage"]>, pageNumber: number) {
  page.drawLine({
    start: { x: PAGE_MARGIN, y: 36 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: 36 },
    thickness: 1,
    color: LINE
  });
  page.drawText("Mon Risque Habitat — by AGS & Co", {
    x: PAGE_MARGIN,
    y: 20,
    size: 9,
    color: SLATE_400
  });
  page.drawText(`Page ${pageNumber}`, {
    x: PAGE_WIDTH - PAGE_MARGIN - 30,
    y: 20,
    size: 9,
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
) {
  const lines = wrapText(text, font, size, maxWidth);

  page.drawText(lines.join("\n"), {
    x,
    y,
    font,
    size,
    color,
    lineHeight
  });

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
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const titleSize = 10;
  const bodySize = 11;
  const bodyLineHeight = 16;
  const contentWidth = width - 28;
  const textLines = wrapText(text, bodyFont, bodySize, contentWidth);
  const cardHeight = 24 + textLines.length * bodyLineHeight + 22;

  page.drawRectangle({
    x,
    y: y - cardHeight,
    width,
    height: cardHeight,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 1
  });
  page.drawText(label, {
    x: x + 14,
    y: y - 18,
    font: titleFont,
    size: titleSize,
    color: SLATE_400
  });
  page.drawText(textLines.join("\n"), {
    x: x + 14,
    y: y - 40,
    font: bodyFont,
    size: bodySize,
    color: SLATE_600,
    lineHeight: bodyLineHeight
  });

  return y - cardHeight - 12;
}

function drawRiskBlock(
  page: ReturnType<PDFDocument["addPage"]>,
  risk: RiskCategory,
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const tone = getPriorityColors(risk.priority);

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 32,
    width: 92,
    height: 24,
    color: tone.fill
  });
  page.drawText(getPriorityLabel(risk.priority), {
    x: PAGE_MARGIN + 14,
    y: PAGE_HEIGHT - PAGE_MARGIN - 16,
    size: 10,
    font: titleFont,
    color: tone.text
  });
  page.drawText(risk.label, {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 64,
    size: 22,
    font: titleFont,
    color: SLATE_900
  });
  page.drawText(risk.decision, {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 88,
    size: 11,
    font: bodyFont,
    color: BRAND
  });

  let cursorY = PAGE_HEIGHT - PAGE_MARGIN - 116;
  cursorY = drawSectionCard(
    page,
    "Ce que cela signifie",
    [risk.summary, risk.territoryContext].filter(Boolean).join(" "),
    PAGE_MARGIN,
    cursorY,
    CONTENT_WIDTH,
    titleFont,
    bodyFont
  );
  cursorY = drawSectionCard(
    page,
    "Ce que vous pouvez faire",
    risk.recommendation,
    PAGE_MARGIN,
    cursorY,
    CONTENT_WIDTH,
    titleFont,
    bodyFont
  );
  drawSectionCard(
    page,
    "Ce qu'il faut surveiller",
    risk.watch,
    PAGE_MARGIN,
    cursorY,
    CONTENT_WIDTH,
    titleFont,
    bodyFont
  );
}

function drawRecommendationPage(
  page: ReturnType<PDFDocument["addPage"]>,
  recommendation: RiskResult["finalRecommendation"],
  titleFont: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bodyFont: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const CARD_WIDTH = (CONTENT_WIDTH - 16) / 3;
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN;

  // Section label
  page.drawText("PRIORITÉS", {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 10,
    font: titleFont,
    color: BRAND
  });
  cursorY -= 28;

  // Title
  page.drawText(recommendation.title, {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 22,
    font: titleFont,
    color: SLATE_900
  });
  cursorY -= 22;

  // Separator line
  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: cursorY },
    thickness: 1,
    color: LINE
  });
  cursorY -= 22;

  // Summary
  cursorY = drawParagraph(
    page,
    recommendation.summary,
    PAGE_MARGIN,
    cursorY,
    CONTENT_WIDTH,
    bodyFont,
    12,
    SLATE_600,
    18
  );
  cursorY -= 28;

  // Checklist cards (3 items side by side)
  recommendation.checklist.forEach((item, index) => {
    const x = PAGE_MARGIN + index * (CARD_WIDTH + 8);
    const textLines = wrapText(item, bodyFont, 11, CARD_WIDTH - 28);
    const cardHeight = 36 + textLines.length * 16 + 20;

    // Card background
    page.drawRectangle({
      x,
      y: cursorY - cardHeight,
      width: CARD_WIDTH,
      height: cardHeight,
      color: PANEL,
      borderColor: LINE,
      borderWidth: 1
    });

    // Action number label
    page.drawText(`ACTION ${index + 1}`, {
      x: x + 14,
      y: cursorY - 18,
      size: 9,
      font: titleFont,
      color: BRAND
    });

    // Accent bar at top of card
    page.drawRectangle({
      x,
      y: cursorY - 4,
      width: CARD_WIDTH,
      height: 4,
      color: BRAND
    });

    // Item text
    page.drawText(textLines.join("\n"), {
      x: x + 14,
      y: cursorY - 40,
      font: bodyFont,
      size: 11,
      color: SLATE_600,
      lineHeight: 16
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

  const cover = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  cover.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(1, 1, 1)
  });

  const LOGO_SIZE = 72;
  if (logo) {
    const dimensions = logo.scale(1);
    const ratio = Math.min(LOGO_SIZE / dimensions.width, LOGO_SIZE / dimensions.height);
    const width = dimensions.width * ratio;
    const height = dimensions.height * ratio;

    cover.drawImage(logo, {
      x: PAGE_WIDTH - PAGE_MARGIN - width,
      y: PAGE_HEIGHT - PAGE_MARGIN - height,
      width,
      height
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

  cover.drawText("Mon Risque Habitat", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 8,
    size: 20,
    font: headingFont,
    color: SLATE_900
  });
  cover.drawText("by AGS & Co", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - PAGE_MARGIN - 28,
    size: 10,
    font: bodyFont,
    color: SLATE_400
  });

  cover.drawText("Rapport de synthèse", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 172,
    size: 28,
    font: headingFont,
    color: SLATE_900
  });
  cover.drawText("Analyse d'un bien à partir des données Géorisques disponibles.", {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 196,
    size: 12,
    font: bodyFont,
    color: SLATE_600
  });

  cover.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 346,
    width: CONTENT_WIDTH,
    height: 126,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 1
  });
  cover.drawText("Adresse analysée", {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 246,
    size: 10,
    font: headingFont,
    color: SLATE_400
  });
  drawParagraph(
    cover,
    result.address,
    PAGE_MARGIN + 20,
    PAGE_HEIGHT - 272,
    CONTENT_WIDTH - 40,
    headingFont,
    18,
    SLATE_900,
    22
  );
  cover.drawText("Date d'analyse", {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 316,
    size: 10,
    font: headingFont,
    color: SLATE_400
  });
  cover.drawText(formatAnalysisDate(result.analyzedAt), {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 334,
    size: 11,
    font: bodyFont,
    color: SLATE_600
  });

  cover.drawRectangle({
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 486,
    width: CONTENT_WIDTH,
    height: 112,
    color: rgb(0.94, 0.97, 1),
    borderColor: rgb(0.84, 0.9, 0.98),
    borderWidth: 1
  });
  cover.drawText(result.overallRisk.label, {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 404,
    size: 20,
    font: headingFont,
    color: BRAND_DEEP
  });
  cover.drawText(result.overallRisk.decision, {
    x: PAGE_MARGIN + 20,
    y: PAGE_HEIGHT - 428,
    size: 11,
    font: headingFont,
    color: BRAND
  });
  drawParagraph(
    cover,
    result.overallRisk.summary,
    PAGE_MARGIN + 20,
    PAGE_HEIGHT - 450,
    CONTENT_WIDTH - 40,
    bodyFont
  );

  let summaryY = PAGE_HEIGHT - 540;
  cover.drawText("Lecture rapide", {
    x: PAGE_MARGIN,
    y: summaryY,
    size: 11,
    font: headingFont,
    color: SLATE_400
  });
  summaryY = drawParagraph(
    cover,
    result.overallRisk.takeaway,
    PAGE_MARGIN,
    summaryY - 20,
    CONTENT_WIDTH,
    bodyFont
  );
  summaryY = drawParagraph(
    cover,
    `Méthode de lecture : ${result.overallRisk.rationale}`,
    PAGE_MARGIN,
    summaryY - 10,
    CONTENT_WIDTH,
    bodyFont,
    10,
    SLATE_400,
    14
  );

  cover.drawText("Risques identifiés", {
    x: PAGE_MARGIN,
    y: summaryY - 26,
    size: 11,
    font: headingFont,
    color: SLATE_400
  });
  drawParagraph(
    cover,
    result.categories.map((risk) => `${risk.label} (${getPriorityLabel(risk.priority)})`).join(" | "),
    PAGE_MARGIN,
    summaryY - 46,
    CONTENT_WIDTH,
    bodyFont
  );
  buildFooter(cover, 1);

  result.categories.forEach((risk, index) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawRiskBlock(page, risk, headingFont, bodyFont);
    buildFooter(page, index + 2);
  });

  // Page de recommandations — dernière page du rapport
  const recoPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawRecommendationPage(recoPage, result.finalRecommendation, headingFont, bodyFont);
  buildFooter(recoPage, result.categories.length + 2);

  return pdf.save();
}
