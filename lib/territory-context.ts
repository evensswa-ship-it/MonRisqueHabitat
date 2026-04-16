import "server-only";

import type { AddressSuggestion } from "@/types/address";
import type { RiskCategory, RiskResult } from "@/types/risk";

type CommuneApiResponse = Array<{
  nom?: string;
  population?: number;
  departement?: {
    nom?: string;
    code?: string;
  };
  region?: {
    nom?: string;
    code?: string;
  };
}>;

type ElevationApiResponse = {
  elevations?: Array<{
    z?: number;
  }>;
};

type TerritoryContext = {
  communeSentence?: string;
  topographySentence?: string;
  riskSentences: Partial<Record<RiskCategory["id"], string>>;
};

function joinSentences(...values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value)).join(" ");
}

async function fetchCommuneContext(address: AddressSuggestion) {
  const url = new URL("https://geo.api.gouv.fr/communes");
  url.searchParams.set("nom", address.city);
  url.searchParams.set("codePostal", address.postcode);
  url.searchParams.set("fields", "nom,population,departement,region");
  url.searchParams.set("boost", "population");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer le contexte communal.");
  }

  const payload = (await response.json()) as CommuneApiResponse;
  const commune = payload[0];

  if (!commune || typeof commune.population !== "number") {
    return undefined;
  }

  if (commune.population >= 100000) {
    return `L'analyse s'inscrit dans un environnement urbain dense sur la commune de ${address.city}.`;
  }

  if (commune.population <= 5000) {
    return `L'analyse s'inscrit dans un territoire plus diffus autour de ${address.city}, où la lecture du terrain et des abords reste particulièrement utile.`;
  }

  return `Ce sujet est à lire dans le contexte de la commune de ${address.city} et de ses caractéristiques locales.`;
}

async function fetchTopographyContext(address: AddressSuggestion) {
  const url = new URL(
    "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json"
  );
  url.searchParams.set("lon", String(address.coordinates.lon));
  url.searchParams.set("lat", String(address.coordinates.lat));
  url.searchParams.set("resource", "ign_rge_alti_wld");
  url.searchParams.set("zonly", "false");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer le contexte topographique.");
  }

  const payload = (await response.json()) as ElevationApiResponse;
  const elevation = payload.elevations?.[0]?.z;

  if (typeof elevation !== "number" || elevation === -99999) {
    return undefined;
  }

  if (elevation <= 35) {
    return "L'adresse se situe dans un relief bas, ce qui invite à regarder avec attention les points d'écoulement et les zones basses du bien.";
  }

  if (elevation >= 250) {
    return "L'adresse se situe dans un relief plus marqué, ce qui justifie une lecture attentive de la pente, des accès et des abords.";
  }

  return undefined;
}

function buildRiskSentences(context: {
  communeSentence?: string;
  topographySentence?: string;
}): TerritoryContext["riskSentences"] {
  return {
    flood: context.topographySentence ?? context.communeSentence,
    storm: context.topographySentence ?? context.communeSentence,
    clay: context.topographySentence ?? context.communeSentence,
    "ground-movement": context.topographySentence ?? context.communeSentence,
    fire: context.communeSentence,
    seismic: context.communeSentence,
    radon: context.communeSentence
  };
}

export async function getTerritoryContext(address: AddressSuggestion): Promise<TerritoryContext> {
  const [communeResult, topographyResult] = await Promise.allSettled([
    fetchCommuneContext(address),
    fetchTopographyContext(address)
  ]);

  if (communeResult.status === "rejected") {
    console.warn("[TerritoryContext] Commune context unavailable", {
      city: address.city,
      postcode: address.postcode,
      message: communeResult.reason instanceof Error ? communeResult.reason.message : "Unknown error"
    });
  }

  if (topographyResult.status === "rejected") {
    console.warn("[TerritoryContext] Topography context unavailable", {
      address: address.label,
      message: topographyResult.reason instanceof Error ? topographyResult.reason.message : "Unknown error"
    });
  }

  const communeSentence =
    communeResult.status === "fulfilled" ? communeResult.value : undefined;
  const topographySentence =
    topographyResult.status === "fulfilled" ? topographyResult.value : undefined;

  return {
    communeSentence,
    topographySentence,
    riskSentences: buildRiskSentences({ communeSentence, topographySentence })
  };
}

export function applyTerritoryContextToResult(
  result: RiskResult,
  territoryContext: TerritoryContext
): RiskResult {
  const summaryContext = joinSentences(
    territoryContext.communeSentence,
    territoryContext.topographySentence
  );

  return {
    ...result,
    overallRisk: {
      ...result.overallRisk,
      summary: joinSentences(result.overallRisk.summary, summaryContext),
      takeaway: joinSentences(result.overallRisk.takeaway, territoryContext.communeSentence)
    },
    categories: result.categories.map((category) => ({
      ...category,
      territoryContext: joinSentences(
        category.territoryContext,
        territoryContext.riskSentences[category.id]
      )
    })),
    finalRecommendation: {
      ...result.finalRecommendation,
      summary: joinSentences(result.finalRecommendation.summary, territoryContext.communeSentence)
    }
  };
}
