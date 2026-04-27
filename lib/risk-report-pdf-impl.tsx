import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { RiskCategory, RiskResult } from "@/types/risk";

// ── Fonts ──────────────────────────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

// ── Palette — aligned with globals.css design system ──────────────────────────
const C = {
  brand:     "#0f4fa8",
  brandDeep: "#0a356f",
  brandSoft: "#dbeafe",
  slate950:  "#030712",
  slate800:  "#1e293b",
  slate700:  "#334155",
  slate600:  "#475569",
  slate500:  "#64748b",
  slate400:  "#94a3b8",
  slate200:  "#e2e8f0",
  slate100:  "#f1f5f9",
  slate50:   "#f8fafc",
  white:     "#ffffff",
} as const;

// ── Risk tones — mirrors --low / --medium / --high from globals.css ────────────
type Tone = { fill: string; text: string; band: string; dot: string; border: string };

function getTone(priority: RiskCategory["priority"]): Tone {
  if (priority === "high")
    return { fill: "#fff1f2", text: "#b93838", band: "#dc2626", dot: "#ef4444", border: "#fecaca" };
  if (priority === "medium")
    return { fill: "#fffbeb", text: "#b7791f", band: "#d97706", dot: "#f59e0b", border: "#fde68a" };
  return { fill: "#f0fdf4", text: "#1d7a58", band: "#059669", dot: "#10b981", border: "#a7f3d0" };
}

function getPriorityLabel(priority: RiskCategory["priority"]) {
  if (priority === "high")   return "Élevé";
  if (priority === "medium") return "Modéré";
  return "Faible";
}

function formatDate(value: string) {
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

function getLogoPath(): string | null {
  const configured = process.env.MRH_PDF_LOGO_PATH ?? "/brand/logoMRH.png";
  const abs = configured.startsWith("/")
    ? path.join(process.cwd(), "public", configured)
    : path.join(process.cwd(), configured);
  return existsSync(abs) ? abs : null;
}

// ── Layout ─────────────────────────────────────────────────────────────────────
const MARGIN = 48;

// ── Shared styles ──────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Inter",
    fontSize: 10,
  },
  footer: {
    paddingHorizontal: MARGIN,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 0.5,
    borderTopColor: C.slate200,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerBrand: { fontSize: 7.5, fontWeight: 600, color: C.slate600 },
  footerSub:   { fontSize: 7.5, color: C.slate400 },
  footerPage:  { fontSize: 7.5, color: C.slate400 },
  sectionCard: {
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.slate200,
    borderStyle: "solid",
    backgroundColor: C.slate50,
    padding: 14,
    marginBottom: 10,
  },
  sectionCardLabel: {
    fontSize: 7,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.slate400,
    marginBottom: 7,
  },
  sectionCardBody: {
    fontSize: 10,
    lineHeight: 1.65,
    color: C.slate700,
  },
  eyebrow: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.slate400,
    marginBottom: 5,
  },
  eyebrowBrand: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.brand,
    marginBottom: 5,
  },
  eyebrowWhite: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: C.brandSoft,
    marginBottom: 6,
  },
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function Footer({ page }: { page: number }) {
  return (
    <View style={S.footer}>
      <View style={{ flexDirection: "row" }}>
        <Text style={S.footerBrand}>Mon Risque Habitat</Text>
        <Text style={S.footerSub}>{"  ·  by AGS & Co"}</Text>
      </View>
      <Text style={S.footerPage}>{page}</Text>
    </View>
  );
}

function SectionCard({ label, text }: { label: string; text: string }) {
  return (
    <View style={S.sectionCard}>
      <Text style={S.sectionCardLabel}>{label}</Text>
      <Text style={S.sectionCardBody}>{text}</Text>
    </View>
  );
}

function PriorityBadge({ priority }: { priority: RiskCategory["priority"] }) {
  const tone = getTone(priority);
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: tone.fill,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: tone.border,
      borderStyle: "solid",
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 10,
    }}>
      <View style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: tone.dot,
        marginRight: 5,
      }} />
      <Text style={{
        fontSize: 7.5,
        fontWeight: 700,
        color: tone.text,
        letterSpacing: 0.8,
      }}>
        {getPriorityLabel(priority).toUpperCase()}
      </Text>
    </View>
  );
}

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min(Math.round((score / max) * 100), 100);
  return (
    <View style={{ marginTop: 10, marginBottom: 8 }}>
      <View style={{ height: 5, backgroundColor: C.slate200, borderRadius: 3 }}>
        <View style={{
          width: `${pct}%`,
          height: 5,
          backgroundColor: color,
          borderRadius: 3,
        }} />
      </View>
      <Text style={{ fontSize: 7.5, color: C.slate400, marginTop: 3 }}>
        Score {score}/{max}
      </Text>
    </View>
  );
}

function MiniHeader({ address }: { address: string }) {
  const short = address.length > 65 ? `${address.slice(0, 65)}…` : address;
  return (
    <Text style={{ fontSize: 7, color: C.slate400, marginBottom: 12 }}>
      <Text style={{ fontWeight: 600 }}>{"Mon Risque Habitat"}</Text>
      {"  ·  "}
      {short}
    </Text>
  );
}

function ScanBar({ categories }: { categories: RiskCategory[] }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 4 }}>
      {categories.map((cat, i) => {
        const tone = getTone(cat.priority);
        return (
          <View
            key={cat.id}
            style={{
              flex: 1,
              backgroundColor: tone.fill,
              borderRadius: 6,
              borderWidth: 0.5,
              borderColor: tone.border,
              borderStyle: "solid",
              borderLeftWidth: 3,
              borderLeftColor: tone.band,
              padding: 10,
              paddingLeft: 8,
              marginRight: i < categories.length - 1 ? 6 : 0,
            }}
          >
            <Text style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: C.slate800,
              marginBottom: 3,
            }}>
              {cat.label}
            </Text>
            <Text style={{
              fontSize: 8,
              fontWeight: 600,
              color: tone.text,
            }}>
              {getPriorityLabel(cat.priority)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── COVER PAGE ─────────────────────────────────────────────────────────────────
function CoverPage({ result, logoPath }: { result: RiskResult; logoPath: string | null }) {
  const tone = getTone(result.overallRisk.level);

  return (
    <Page size="A4" style={S.page}>
      {/* Dark blue header */}
      <View style={{
        backgroundColor: C.brandDeep,
        paddingHorizontal: MARGIN,
        paddingTop: 26,
        paddingBottom: 22,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: -0.3 }}>
              Mon Risque Habitat
            </Text>
            <Text style={{ fontSize: 9, color: C.brandSoft, marginTop: 3 }}>
              by AGS & Co
            </Text>
          </View>
          {logoPath ? (
            <Image src={logoPath} style={{ width: 44, height: 44, objectFit: "contain" }} />
          ) : (
            <View style={{
              width: 44,
              height: 44,
              backgroundColor: C.brand,
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: C.white }}>MRH</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 8, color: C.brandSoft, marginTop: 16, opacity: 0.75 }}>
          {formatDate(result.analyzedAt)}
        </Text>
      </View>

      {/* Risk tone accent line */}
      <View style={{ height: 3, backgroundColor: tone.band }} />

      {/* Body */}
      <View style={{ paddingHorizontal: MARGIN, paddingTop: 20 }}>
        {/* Title block */}
        <Text style={S.eyebrowBrand}>Analyse immobilière</Text>
        <Text style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.slate950,
          letterSpacing: -0.3,
          lineHeight: 1.2,
          marginBottom: 5,
        }}>
          Rapport de synthèse des risques
        </Text>
        <Text style={{ fontSize: 10, color: C.slate500, marginBottom: 16 }}>
          Analyse construite à partir des données officielles Géorisques.
        </Text>

        <View style={{ height: 0.5, backgroundColor: C.slate200, marginBottom: 16 }} />

        {/* Address card */}
        <View style={{
          borderRadius: 8,
          borderWidth: 0.5,
          borderColor: C.slate200,
          borderStyle: "solid",
          backgroundColor: C.slate50,
          padding: 16,
          marginBottom: 12,
        }}>
          <Text style={{ fontSize: 7, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.slate400, marginBottom: 5 }}>
            Adresse analysée
          </Text>
          <Text style={{ fontSize: 13, fontWeight: 700, color: C.slate800, lineHeight: 1.3, marginBottom: 10 }}>
            {result.address}
          </Text>
          <Text style={{ fontSize: 7, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.slate400, marginBottom: 4 }}>
            Date d'analyse
          </Text>
          <Text style={{ fontSize: 9.5, color: C.slate600 }}>
            {formatDate(result.analyzedAt)}
          </Text>
        </View>

        {/* Risk level hero card */}
        <View style={{
          borderRadius: 8,
          borderWidth: 0.5,
          borderColor: tone.border,
          borderStyle: "solid",
          borderLeftWidth: 4,
          borderLeftColor: tone.band,
          backgroundColor: tone.fill,
          padding: 16,
          paddingLeft: 14,
          marginBottom: 14,
        }}>
          <Text style={{ fontSize: 7, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: tone.text, marginBottom: 5 }}>
            Niveau de risque global
          </Text>
          <Text style={{
            fontSize: 24,
            fontWeight: 700,
            color: tone.text,
            letterSpacing: -0.3,
            lineHeight: 1.15,
          }}>
            {result.overallRisk.label}
          </Text>
          <ScoreBar score={result.overallRisk.score} max={result.overallRisk.maxScore} color={tone.band} />
          <Text style={{ fontSize: 9.5, fontWeight: 600, color: tone.band, marginBottom: 7 }}>
            {result.overallRisk.decision}
          </Text>
          <Text style={{ fontSize: 9.5, color: C.slate700, lineHeight: 1.55 }}>
            {result.overallRisk.summary}
          </Text>
        </View>

        {/* Scan bar */}
        <Text style={S.eyebrow}>Vue d'ensemble</Text>
        <ScanBar categories={result.categories} />

        {/* CatNat */}
        {result.catnat && (
          <View style={{ marginTop: 14 }}>
            <Text style={S.eyebrow}>Catastrophes naturelles reconnues</Text>
            <Text style={{ fontSize: 9.5, color: C.slate600, lineHeight: 1.55 }}>
              {result.catnat.sentence}
            </Text>
          </View>
        )}

        {/* Synthèse */}
        <View style={{ marginTop: 12 }}>
          <Text style={S.eyebrow}>Synthèse</Text>
          <Text style={{ fontSize: 9.5, color: C.slate700, lineHeight: 1.55 }}>
            {result.overallRisk.takeaway}
          </Text>
        </View>

        {/* Contexte */}
        <View style={{ marginTop: 10 }}>
          <Text style={S.eyebrow}>Contexte</Text>
          <Text style={{ fontSize: 9.5, color: C.slate600, lineHeight: 1.55 }}>
            {result.overallRisk.rationale}
          </Text>
        </View>

      </View>

      {/* Disclaimer */}
      <View style={{
        marginTop: 16,
        paddingHorizontal: MARGIN,
        paddingTop: 10,
        paddingBottom: 8,
        borderTopWidth: 0.5,
        borderTopColor: C.slate200,
        borderTopStyle: "solid",
      }}>
        <Text style={{ fontSize: 7.5, color: C.slate400, lineHeight: 1.6 }}>
          {
            "Ce rapport est fourni à titre informatif sur la base de données publiques officielles " +
            "(Géorisques, BRGM, ERRIAL, GASPAR via data.gouv.fr). " +
            "Il ne remplace pas un état des risques réglementaire ni l'avis d'un professionnel qualifié."
          }
        </Text>
      </View>

      <Footer page={1} />
    </Page>
  );
}

// ── RISK DETAIL PAGE ───────────────────────────────────────────────────────────
function RiskDetailPage({
  category,
  address,
  pageNumber,
}: {
  category: RiskCategory;
  address: string;
  pageNumber: number;
}) {
  const tone = getTone(category.priority);
  const summaryText = [category.summary, category.territoryContext].filter(Boolean).join(" ");

  return (
    <Page size="A4" style={S.page}>
      {/* Colored header zone */}
      <View style={{
        backgroundColor: tone.fill,
        paddingHorizontal: MARGIN,
        paddingTop: 20,
        paddingBottom: 22,
        borderBottomWidth: 3,
        borderBottomColor: tone.band,
        borderBottomStyle: "solid",
      }}>
        <MiniHeader address={address} />
        <PriorityBadge priority={category.priority} />
        <Text style={{
          fontSize: 26,
          fontWeight: 700,
          color: C.slate950,
          letterSpacing: -0.3,
          lineHeight: 1.15,
          marginBottom: 8,
        }}>
          {category.label}
        </Text>
        <Text style={{ fontSize: 10.5, fontWeight: 600, color: tone.band }}>
          {category.decision}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: MARGIN, paddingTop: 22 }}>
        <SectionCard label="Synthèse" text={summaryText} />
        <SectionCard label="Ce que vous pouvez faire" text={category.recommendation} />
        <SectionCard label="Points à surveiller" text={category.watch} />
      </View>

      <Footer page={pageNumber} />
    </Page>
  );
}

// ── PRIORITIES PAGE ────────────────────────────────────────────────────────────
function PrioritiesPage({
  recommendation,
  address,
  pageNumber,
}: {
  recommendation: RiskResult["finalRecommendation"];
  address: string;
  pageNumber: number;
}) {
  return (
    <Page size="A4" style={S.page}>
      {/* Brand header */}
      <View style={{
        backgroundColor: C.brandDeep,
        paddingHorizontal: MARGIN,
        paddingTop: 20,
        paddingBottom: 22,
        borderBottomWidth: 3,
        borderBottomColor: C.brand,
        borderBottomStyle: "solid",
      }}>
        <MiniHeader address={address} />
        <Text style={S.eyebrowWhite}>Priorités</Text>
        <Text style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.white,
          letterSpacing: -0.3,
          lineHeight: 1.2,
        }}>
          {recommendation.title}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: MARGIN, paddingTop: 22 }}>
        <Text style={{
          fontSize: 10.5,
          color: C.slate600,
          lineHeight: 1.65,
          marginBottom: 22,
        }}>
          {recommendation.summary}
        </Text>

        {/* Action cards — 3 columns */}
        <View style={{ flexDirection: "row" }}>
          {recommendation.checklist.map((item, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                backgroundColor: C.slate50,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: C.slate200,
                borderStyle: "solid",
                borderTopWidth: 3,
                borderTopColor: C.brand,
                padding: 14,
                marginRight: index < recommendation.checklist.length - 1 ? 10 : 0,
              }}
            >
              <Text style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: C.brand,
                marginBottom: 8,
              }}>
                {`Action ${index + 1}`}
              </Text>
              <Text style={{ fontSize: 9.5, color: C.slate700, lineHeight: 1.65 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Footer page={pageNumber} />
    </Page>
  );
}

// ── Main document ──────────────────────────────────────────────────────────────
function RiskReportDocument({ result, logoPath }: { result: RiskResult; logoPath: string | null }) {
  const totalPages = result.categories.length + 2;
  return (
    <Document
      title={`Mon Risque Habitat | ${result.address}`}
      author="AGS & Co"
      subject="Synthèse de risque habitat"
      creator="Mon Risque Habitat — by AGS & Co"
      producer="Mon Risque Habitat — by AGS & Co"
    >
      <CoverPage result={result} logoPath={logoPath} />
      {result.categories.map((cat, i) => (
        <RiskDetailPage
          key={cat.id}
          category={cat}
          address={result.address}
          pageNumber={i + 2}
        />
      ))}
      <PrioritiesPage
        recommendation={result.finalRecommendation}
        address={result.address}
        pageNumber={totalPages}
      />
    </Document>
  );
}

// ── Public exports ─────────────────────────────────────────────────────────────
export function buildRiskReportFilename(address: string, analyzedAt: string) {
  const datePart = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(analyzedAt))
    .replaceAll("-", "");
  return `mrh-rapport-${sanitizeFilenamePart(address) || "adresse"}-${datePart}.pdf`;
}

export async function createRiskReportPdf(result: RiskResult): Promise<Uint8Array> {
  const logoPath = getLogoPath();
  const buffer = await renderToBuffer(
    <RiskReportDocument result={result} logoPath={logoPath} />,
  );
  return new Uint8Array(buffer);
}
