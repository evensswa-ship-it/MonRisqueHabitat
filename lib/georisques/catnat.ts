import "server-only";

import type { AddressSuggestion } from "@/types/address";
import type { CatNatSummary } from "@/types/risk";

const TABULAR_API = "https://tabular-api.data.gouv.fr/api/resources/a515d412-122f-4852-8f14-90ec1d97b52c/data/";

type TabularRow = {
  INSEE?: string;
  Périls?: string;
  "Date début"?: string;
};

type TabularPayload = {
  data?: TabularRow[];
  meta?: { total?: number };
};

const PERIL_MAP: Array<{ keywords: string[]; label: string }> = [
  { keywords: ["inond", "submersion", "crue", "debordement", "coulée"], label: "inondation" },
  { keywords: ["secheresse", "argile", "retrait"], label: "sécheresse" },
  { keywords: ["mouvement", "glissement", "eboulement", "affaissement"], label: "mouvement de terrain" },
  { keywords: ["tempete", "vent", "orage"], label: "tempête" },
  { keywords: ["seisme", "sismique"], label: "séisme" },
  { keywords: ["feu", "incendie"], label: "feu de forêt" },
];

function normalizePeril(libelle: string): string | undefined {
  const normalized = libelle
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
  for (const { keywords, label } of PERIL_MAP) {
    if (keywords.some((kw) => normalized.includes(kw))) return label;
  }
  return undefined;
}

function getDominantPeril(rows: TabularRow[]): string | undefined {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row["Périls"]) continue;
    const peril = normalizePeril(row["Périls"]);
    if (peril) counts[peril] = (counts[peril] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return undefined;
  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
}

function getLastYear(rows: TabularRow[]): number | undefined {
  const years = rows
    .map((r) => (r["Date début"] ? new Date(r["Date début"]).getFullYear() : NaN))
    .filter((y) => !isNaN(y));
  return years.length > 0 ? Math.max(...years) : undefined;
}

function buildSentence(count: number, peril?: string, year?: number): string {
  const base =
    count === 1
      ? "1 arrêté de catastrophe naturelle reconnu"
      : `${count} arrêtés de catastrophe naturelle reconnus`;
  const perilPart = peril ? `, principalement pour ${peril}` : "";
  const yearPart = year ? ` — dernière reconnaissance en ${year}` : "";
  return `${base}${perilPart} sur cette commune${yearPart}.`;
}

async function fetchInseeCode(address: AddressSuggestion): Promise<string | undefined> {
  if (address.cityCode) return address.cityCode;

  const url = new URL("https://geo.api.gouv.fr/communes");
  url.searchParams.set("lat", String(address.coordinates.lat));
  url.searchParams.set("lon", String(address.coordinates.lon));
  url.searchParams.set("fields", "code");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return undefined;

  const payload = (await response.json()) as Array<{ code?: string }>;
  return payload[0]?.code;
}

export async function getCatNatSummary(
  address: AddressSuggestion
): Promise<CatNatSummary | undefined> {
  const codeInsee = await fetchInseeCode(address);
  if (!codeInsee) return undefined;

  const url = new URL(TABULAR_API);
  // Dataset stores numeric INSEE codes as floats (e.g. "13004.0" from Excel)
  const inseeTabular = /^\d+$/.test(codeInsee)
    ? `${parseInt(codeInsee, 10)}.0`
    : codeInsee;
  url.searchParams.set("INSEE__exact", inseeTabular);
  url.searchParams.set("page_size", "50");
  url.searchParams.set("Date début__sort", "desc");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return undefined;

  const payload = (await response.json()) as TabularPayload;
  const rows = payload.data ?? [];
  const count = payload.meta?.total ?? rows.length;

  if (count === 0) return undefined;

  const dominantPeril = getDominantPeril(rows);
  const lastYear = getLastYear(rows);

  return {
    count,
    lastYear,
    dominantPeril,
    sentence: buildSentence(count, dominantPeril, lastYear),
  };
}
