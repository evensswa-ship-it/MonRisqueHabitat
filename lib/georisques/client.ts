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
      "Ce bien peut être touché par des montées d'eau ou du ruissellement lors de fortes pluies. Caves et rez-de-chaussée sont les espaces les plus exposés.",
    recommendation:
      "Renseignez-vous sur d'éventuels sinistres passés auprès du vendeur ou de la mairie. Vérifiez l'état des caves, des évacuations et des murs en contact avec le sol.",
    watch:
      "Les caves, rez-de-chaussée, évacuations d'eau bouchées, traces d'humidité sur les murs et sols en légère cuvette."
  },
  {
    id: "clay",
    label: "Retrait-gonflement des argiles",
    priority: "medium",
    keywords: ["argile", "secheresse", "retrait"],
    decision: "Analyse à compléter si nécessaire",
    summary:
      "Le sol peut gonfler ou se rétracter selon l'humidité des saisons. Sur le long terme, cela peut provoquer des fissures dans les murs ou les fondations.",
    recommendation:
      "Regardez si des fissures sont visibles sur les façades ou à l'intérieur. Vérifiez que les eaux de pluie s'écoulent bien loin du bâtiment, sans stagner contre les murs.",
    watch:
      "Les fissures en diagonale sur les murs, les portes ou fenêtres qui coincent, les décollements de carrelage ou de parquet."
  },
  {
    id: "ground-movement",
    label: "Mouvement de terrain",
    priority: "medium",
    keywords: ["mouvement", "glissement", "eboulement", "terrain"],
    decision: "Point d'attention sur le terrain",
    summary:
      "Le terrain autour du bien peut présenter une certaine instabilité — glissements, affaissements — surtout si le sol est en pente ou a été remblayé.",
    recommendation:
      "Vérifiez si le terrain est en pente, s'il existe des murs de soutènement et s'il y a des signes d'affaissement visibles. En cas de doute, faites passer un professionnel.",
    watch:
      "Les terrains en pente, les murs de soutènement fissurés, les décalages de niveau au sol et les fissures à la jonction sol-mur."
  },
  {
    id: "seismic",
    label: "Activité sismique",
    priority: "low",
    keywords: ["sism", "seisme"],
    decision: "Exposition limitée",
    summary:
      "La zone est légèrement exposée au risque sismique, mais cela ne représente pas un danger majeur dans la grande majorité des cas.",
    recommendation:
      "Pas d'inquiétude particulière dans l'immédiat. Si vous prévoyez des travaux structurels importants, vérifiez simplement que les normes parasismiques en vigueur sont respectées.",
    watch:
      "Les travaux de structure importants (extension, surélévation) et les prescriptions de construction applicables localement."
  },
  {
    id: "storm",
    label: "Tempête",
    priority: "medium",
    keywords: ["tempete", "vent", "orage"],
    decision: "Vigilance saisonnière",
    summary:
      "Le bien peut être exposé à des vents forts ou des orages qui fragilisent la toiture et les éléments en extérieur.",
    recommendation:
      "Vérifiez régulièrement l'état de la toiture, des gouttières et des volets — idéalement avant l'automne. Sécurisez ce qui peut s'envoler en cas de vent fort.",
    watch:
      "Les tuiles descellées, gouttières obstruées, volets mal fixés, antennes, clôtures et mobilier de jardin."
  },
  {
    id: "fire",
    label: "Feu de forêt",
    priority: "high",
    keywords: ["feu", "incendie", "foret"],
    decision: "Vigilance renforcée sur l'environnement proche",
    summary:
      "L'environnement proche du bien peut être exposé au risque de feu de forêt, notamment en période sèche ou de vent fort.",
    recommendation:
      "Vérifiez qu'un débroussaillement est effectué autour du bien — c'est une obligation légale dans certaines zones. Assurez-vous que les accès restent dégagés.",
    watch:
      "La végétation contre le bien, les zones boisées à proximité immédiate, les accès pour les secours et les obligations locales de débroussaillement."
  },
  {
    id: "radon",
    label: "Radon",
    priority: "low",
    keywords: ["radon"],
    decision: "Analyse à compléter si nécessaire",
    summary:
      "Le radon est un gaz naturel présent dans certains sous-sols. Il s'accumule dans les pièces peu aérées et peut devenir un sujet de santé sur la durée.",
    recommendation:
      "Assurez-vous que les caves et pièces en sous-sol sont bien ventilées. Un test de mesure simple et peu coûteux existe si vous souhaitez aller plus loin.",
    watch:
      "Les sous-sols, caves, rez-de-chaussée et pièces qui restent longtemps fermées sans aération naturelle."
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

function cityPreposition(city: string): string {
  if (/^le\s/i.test(city)) return `du ${city.slice(3)}`;
  if (/^les\s/i.test(city)) return `des ${city.slice(4)}`;
  return `de ${city}`;
}

function buildTerritoryContext(scope: RiskScope, address: AddressSuggestion) {
  if (scope === "commune") {
    const prep = cityPreposition(address.city ?? "");
    return `Ce risque a été identifié sur la commune ${prep}.`;
  }

  if (scope === "address") {
    return "L'adresse se situe directement dans une zone concernée par ce risque.";
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
