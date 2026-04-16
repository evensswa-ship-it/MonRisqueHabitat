import "server-only";

import type { AddressSuggestion } from "@/types/address";
import type { RiskCategory, RiskPriority, RiskResult } from "@/types/risk";
import { buildOverallRisk } from "@/lib/risk-scoring";
import {
  applyTerritoryContextToResult,
  getTerritoryContext
} from "@/lib/territory-context";

type RiskScope = "commune" | "address" | "unknown";

type GeorisquesRiskItem = {
  id?: string;
  code?: string;
  libelle?: string;
  label?: string;
  type?: string;
};

type GeorisquesPayload = {
  risques?: GeorisquesRiskItem[];
  data?: {
    risques?: GeorisquesRiskItem[];
  };
  results?: GeorisquesRiskItem[];
  features?: Array<{ properties?: GeorisquesRiskItem }>;
  content?: Array<{
    communes?: Array<{
      aleas?: Array<{
        codeGaspar?: string;
        libelle?: string;
      }>;
    }>;
  }>;
};

type ExtractedRiskSignal = {
  label: string;
  scope: RiskScope;
};

type RiskCatalogItem = {
  id: string;
  label: string;
  priority: RiskPriority;
  keywords: string[];
  decision: string;
  summary: string;
  recommendation: string;
  watch: string;
};

const RISK_CATALOG: RiskCatalogItem[] = [
  {
    id: "flood",
    label: "Inondation",
    priority: "high",
    keywords: ["inond", "submersion", "crue", "debordement"],
    decision: "Vigilance recommandée avant acquisition",
    summary:
      "Le bien peut être exposé à des montées d'eau, des débordements ou du ruissellement lors d'épisodes intenses.",
    recommendation:
      "Demandez si des sinistres passés sont connus, vérifiez les points bas et prévoyez la protection des espaces sensibles.",
    watch:
      "Les caves, rez-de-chaussée, évacuations d'eau, traces d'humidité et zones de ruissellement."
  },
  {
    id: "clay",
    label: "Retrait-gonflement des argiles",
    priority: "medium",
    keywords: ["argile", "secheresse", "retrait"],
    decision: "Analyse à compléter si nécessaire",
    summary:
      "Les variations d'humidité du sol peuvent créer des mouvements progressifs du bâti et fragiliser certaines parties de la structure.",
    recommendation:
      "Vérifiez l'historique des fissures, l'état des façades et la bonne gestion des eaux autour du bien.",
    watch:
      "Les fissures évolutives, les déformations de sols, les portes qui ferment mal et les abords du logement."
  },
  {
    id: "ground-movement",
    label: "Mouvement de terrain",
    priority: "medium",
    keywords: ["mouvement", "glissement", "eboulement", "terrain"],
    decision: "Point d'attention sur le terrain",
    summary:
      "Le terrain peut présenter une instabilité ponctuelle qui mérite une lecture attentive du site et de ses abords.",
    recommendation:
      "Observez la topographie, les soutènements et faites vérifier tout désordre inhabituel si le contexte local le justifie.",
    watch:
      "Les affaissements, glissements, fissures, soutènements et changements de niveau autour du bien."
  },
  {
    id: "seismic",
    label: "Activité sismique",
    priority: "low",
    keywords: ["sism", "seisme"],
    decision: "Exposition limitée",
    summary:
      "Une exposition sismique existe, mais elle ne constitue pas ici le premier facteur de décision.",
    recommendation:
      "Conservez les bons réflexes de prévention et vérifiez la conformité du bâti si le projet comporte des travaux importants.",
    watch: "Les consignes locales, les travaux structurels prévus et les prescriptions de construction applicables."
  },
  {
    id: "storm",
    label: "Tempête",
    priority: "medium",
    keywords: ["tempete", "vent", "orage"],
    decision: "Vigilance saisonnière",
    summary:
      "Les épisodes de vent ou d'orage peuvent fragiliser la toiture, les fermetures et les équipements extérieurs.",
    recommendation:
      "Vérifiez la toiture, les fixations et l'état général des extérieurs, surtout avant les périodes les plus exposées.",
    watch:
      "Les tuiles, fixations, volets, clôtures, gouttières et éléments extérieurs sensibles au vent."
  },
  {
    id: "fire",
    label: "Feu de forêt",
    priority: "high",
    keywords: ["feu", "incendie", "foret"],
    decision: "Vigilance renforcée sur l'environnement proche",
    summary:
      "L'environnement du bien peut être concerné par un risque d'incendie nécessitant une lecture attentive des abords et des accès.",
    recommendation:
      "Vérifiez le débroussaillement, les accès et la capacité du bien à rester protégé pendant les périodes à risque.",
    watch:
      "La végétation proche, les zones boisées, les accès secours et les obligations locales de débroussaillement."
  },
  {
    id: "radon",
    label: "Radon",
    priority: "low",
    keywords: ["radon"],
    decision: "Analyse à compléter si nécessaire",
    summary:
      "Le sujet concerne surtout la qualité de ventilation et mérite un contrôle simple dans les espaces peu aérés.",
    recommendation:
      "Vérifiez l'aération, en particulier dans les pièces en sous-sol, et complétez l'analyse si l'usage du bien le justifie.",
    watch: "Les pièces basses, caves, sous-sols et zones durablement peu ventilées."
  }
];

function getRequiredEnv(name: "GEORISQUES_API_TOKEN" | "GEORISQUES_API_BASE_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante.`);
  }

  return value;
}

function getOptionalEnv(name: "GEORISQUES_API_KEY") {
  return process.env[name] ?? "";
}

function buildAddressLogContext(address: AddressSuggestion) {
  return {
    label: address.label,
    postcode: address.postcode,
    city: address.city,
    coordinates: address.coordinates
  };
}

function buildPayloadSummary(payload: GeorisquesPayload) {
  return {
    contentCount: payload.content?.length ?? 0,
    communeCount:
      payload.content?.reduce((count, item) => count + (item.communes?.length ?? 0), 0) ?? 0,
    aleaCount:
      payload.content?.reduce(
        (count, item) =>
          count +
          (item.communes?.reduce(
            (communeCount, commune) => communeCount + (commune.aleas?.length ?? 0),
            0
          ) ?? 0),
        0
      ) ?? 0,
    risquesCount: payload.risques?.length ?? 0,
    resultsCount: payload.results?.length ?? 0,
    featuresCount: payload.features?.length ?? 0
  };
}

function buildGeorisquesRiskUrl() {
  const configuredBaseUrl = new URL(getRequiredEnv("GEORISQUES_API_BASE_URL"));
  const normalizedPath = configuredBaseUrl.pathname.replace(/\/+$/, "");

  if (normalizedPath.endsWith("/gaspar/risques")) {
    return configuredBaseUrl;
  }

  if (normalizedPath.endsWith("/api/v2")) {
    configuredBaseUrl.pathname = `${normalizedPath}/gaspar/risques`;
    return configuredBaseUrl;
  }

  if (normalizedPath === "" || normalizedPath === "/") {
    configuredBaseUrl.pathname = "/api/v2/gaspar/risques";
    return configuredBaseUrl;
  }

  configuredBaseUrl.pathname = `${normalizedPath}/gaspar/risques`;
  return configuredBaseUrl;
}

function extractRiskSignals(payload: GeorisquesPayload): ExtractedRiskSignal[] {
  const gasparRisks = payload.content
    ?.flatMap((item) => item.communes ?? [])
    .flatMap((commune) => commune.aleas ?? [])
    .map((alea) => alea.libelle ?? alea.codeGaspar)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({
      label: value.toLowerCase(),
      scope: "commune" as const
    }));

  if (gasparRisks && gasparRisks.length > 0) {
    return gasparRisks;
  }

  const risks =
    payload.risques ??
    payload.data?.risques ??
    payload.results ??
    payload.features?.map((feature) => feature.properties).filter(Boolean);

  if (!risks || !Array.isArray(risks)) {
    return [];
  }

  return risks
    .map((item) => item?.label ?? item?.libelle ?? item?.type ?? item?.code ?? item?.id)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({
      label: value.toLowerCase(),
      scope: "address" as const
    }));
}

function buildTerritoryContext(scope: RiskScope, address: AddressSuggestion) {
  if (scope === "commune") {
    return `Ce risque est également identifié sur la commune de ${address.city}.`;
  }

  if (scope === "address") {
    return "Votre adresse se situe dans une zone de vigilance sur ce point.";
  }

  return undefined;
}

function matchRisksToCategories(
  riskSignals: ExtractedRiskSignal[],
  address: AddressSuggestion
): RiskCategory[] {
  const categories: RiskCategory[] = [];

  for (const catalogItem of RISK_CATALOG) {
    const matchingSignals = riskSignals.filter((signal) =>
      catalogItem.keywords.some((keyword) => signal.label.includes(keyword))
    );

    if (matchingSignals.length > 0) {
      const territorySignal =
        matchingSignals.find((signal) => signal.scope === "commune") ??
        matchingSignals.find((signal) => signal.scope === "address");

      categories.push({
        id: catalogItem.id,
        label: catalogItem.label,
        priority: catalogItem.priority,
        decision: catalogItem.decision,
        territoryContext: territorySignal
          ? buildTerritoryContext(territorySignal.scope, address)
          : undefined,
        summary: catalogItem.summary,
        recommendation: catalogItem.recommendation,
        watch: catalogItem.watch
      });
    }
  }

  return categories;
}

function buildFinalRecommendation(categories: RiskCategory[]) {
  const checklist = categories.slice(0, 3).map((risk) => risk.recommendation);

  return {
    title: "Les priorités à retenir",
    summary:
      categories.length > 0
        ? "Concentrez-vous sur les gestes simples qui réduisent l'exposition aux principaux risques."
        : "Conservez de bons réflexes d'entretien et de prévention au quotidien.",
    checklist:
      checklist.length > 0
        ? checklist
        : [
            "Surveiller régulièrement l'état du logement",
            "Entretenir les évacuations et les abords",
            "Anticiper les épisodes météo sensibles"
          ]
  };
}

export async function getGeorisquesRiskResult(
  address: AddressSuggestion
): Promise<RiskResult> {
  if (!address.coordinates) {
    throw new Error("Coordonnées indisponibles pour cette adresse.");
  }

  const territoryContextPromise = getTerritoryContext(address);

  const baseUrl = buildGeorisquesRiskUrl();
  baseUrl.searchParams.set("latitude", String(address.coordinates.lat));
  baseUrl.searchParams.set("longitude", String(address.coordinates.lon));
  baseUrl.searchParams.set("pageSize", "10");
  baseUrl.searchParams.set("pageNumber", "0");

  console.info("[Georisques] Request started", {
    address: buildAddressLogContext(address),
    url: baseUrl.toString()
  });

  const response = await fetch(baseUrl.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getRequiredEnv("GEORISQUES_API_TOKEN")}`,
      ...(getOptionalEnv("GEORISQUES_API_KEY")
        ? { "X-Api-Key": getOptionalEnv("GEORISQUES_API_KEY") }
        : {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[Georisques] Request failed", {
      address: buildAddressLogContext(address),
      url: baseUrl.toString(),
      status: response.status,
      statusText: response.statusText,
      body: message
    });
    throw new Error(
      `Impossible de récupérer les risques Géorisques. ${message}`.trim()
    );
  }

  const payload = (await response.json()) as GeorisquesPayload;
  const riskSignals = extractRiskSignals(payload);
  const riskLabels = riskSignals.map((signal) => signal.label);

  console.info("[Georisques] Response received", {
    address: buildAddressLogContext(address),
    url: baseUrl.toString(),
    status: response.status,
    payload: buildPayloadSummary(payload),
    extractedRiskLabels: riskLabels
  });

  if (riskLabels.length === 0) {
    console.warn("[Georisques] No exploitable risk data", {
      address: buildAddressLogContext(address),
      url: baseUrl.toString(),
      payload: buildPayloadSummary(payload)
    });
    throw new Error("Aucune donnée Géorisques disponible pour cette adresse.");
  }

  const categories = matchRisksToCategories(riskSignals, address);

  if (categories.length === 0) {
    console.warn("[Georisques] No exploitable risk data", {
      address: buildAddressLogContext(address),
      url: baseUrl.toString(),
      payload: buildPayloadSummary(payload),
      riskLabels
    });
    throw new Error("Aucune donnée Géorisques exploitable n'est disponible pour cette adresse.");
  }

  console.info("[Georisques] Categories mapped", {
    address: buildAddressLogContext(address),
    categoryIds: categories.map((category) => category.id),
    riskLabels
  });

  const result = {
    address: address.label,
    analyzedAt: new Date().toISOString(),
    overallRisk: buildOverallRisk(categories),
    categories,
    finalRecommendation: buildFinalRecommendation(categories),
    advisorCta: {
      title: "Professionnels : demandez une démo.",
      text:
        "Nous vous présentons l'intégration et les options adaptées à votre structure.",
      label: "Demander une démo"
    }
  };

  const territoryContext = await territoryContextPromise;

  return applyTerritoryContextToResult(result, territoryContext);
}
