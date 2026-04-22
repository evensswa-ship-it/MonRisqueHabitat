import "server-only";

import type {
  CatNatFactor,
  CatNatLevel,
  CatNatSummary,
  Priority,
  RiskCategory,
  RiskLevel,
  RiskOverview,
  RiskPriority,
  ScoredFactor,
  ScoringResult,
} from "@/types/risk";

// ── Category weights ──────────────────────────────────────────────────────────
// Each weight reflects the typical financial and structural impact of the risk.
// flood > fire > ground-movement > clay ≈ storm > seismic > radon
const CATEGORY_WEIGHTS: Record<string, number> = {
  flood:             1.4,
  fire:              1.3,
  "ground-movement": 1.1,
  clay:              1.0,
  storm:             1.0,
  seismic:           0.9,
  radon:             0.8,
};

// ── Priority → base score (0–100) ─────────────────────────────────────────────
const PRIORITY_BASE: Record<RiskPriority, number> = {
  high:   80,
  medium: 50,
  low:    20,
};

// ── Per-factor human-readable data ────────────────────────────────────────────
const FACTOR_EXPLANATIONS: Record<string, Partial<Record<RiskPriority, string>>> = {
  flood: {
    high:   "L'adresse est exposée à un risque d'inondation significatif — montées d'eau ou ruissellement lors de fortes pluies.",
    medium: "Un risque d'inondation est identifié sur ce secteur, à apprécier selon la configuration exacte du bien.",
    low:    "Le secteur présente une exposition modérée au risque d'inondation.",
  },
  fire: {
    high:   "La proximité de zones boisées expose ce bien à un risque sérieux d'incendie de forêt en période sèche.",
    medium: "Un risque de feu de forêt est présent dans l'environnement proche du bien.",
    low:    "Le secteur présente une faible exposition au risque d'incendie.",
  },
  "ground-movement": {
    high:   "Le terrain présente une instabilité notable — glissements ou affaissements possibles, notamment en terrain pentu.",
    medium: "Un risque de mouvement de terrain est identifié, à évaluer selon la topographie et les aménagements.",
    low:    "Le sol peut présenter une légère instabilité dans certaines configurations.",
  },
  clay: {
    high:   "Le sol argileux présente un fort potentiel de retrait-gonflement, susceptible de provoquer des fissures structurelles.",
    medium: "Le retrait-gonflement des argiles est présent et peut affecter les fondations sur le long terme.",
    low:    "Le sol présente une sensibilité aux argiles limitée, à surveiller.",
  },
  storm: {
    high:   "Ce secteur est exposé à des épisodes de vents forts ou d'orages pouvant fragiliser toiture et extérieurs.",
    medium: "Un risque tempête est identifié — un entretien régulier des éléments exposés est recommandé.",
    low:    "Le secteur présente une faible exposition au risque tempête.",
  },
  seismic: {
    high:   "La zone présente une exposition sismique notable à prendre en compte pour tout projet de travaux structurels.",
    medium: "Une activité sismique est identifiée dans ce secteur, sans danger majeur dans la plupart des cas.",
    low:    "L'exposition sismique est limitée et ne présente pas de risque particulier.",
  },
  radon: {
    high:   "Une concentration en radon potentiellement élevée est possible dans les sous-sols de ce secteur.",
    medium: "Le radon est présent dans ce secteur — la ventilation des espaces confinés est recommandée.",
    low:    "Un potentiel radon modéré est identifié, sans urgence particulière.",
  },
};

const FACTOR_ACTION_HINTS: Record<string, string> = {
  flood:             "Vérifier l'historique des sinistres auprès du vendeur et l'état des évacuations d'eau.",
  fire:              "Confirmer le respect des obligations de débroussaillement et l'accessibilité des secours.",
  "ground-movement": "Inspecter les murs de soutènement et les abords pour tout signe d'affaissement ou de décalage.",
  clay:              "Observer les façades et l'intérieur pour des fissures en diagonale ou des décollements de revêtement.",
  storm:             "Vérifier l'état de la toiture, des gouttières et des volets — idéalement avant l'automne.",
  seismic:           "S'assurer de la conformité aux normes parasismiques pour tout projet de travaux structurels.",
  radon:             "Assurer une bonne ventilation des sous-sols et caves — un test de mesure simple est disponible.",
};

// ── CatNat classification ─────────────────────────────────────────────────────
const CATNAT_MODIFIERS: Record<CatNatLevel, number> = {
  none:        0,
  old:         3,
  moderate:    8,
  significant: 15,
};

const CATNAT_LABELS: Record<CatNatLevel, string> = {
  none:        "Pas d'historique notable",
  old:         "Historique ancien",
  moderate:    "Historique modéré",
  significant: "Historique récent et significatif",
};

function classifyCatNat(catnat: CatNatSummary | undefined): CatNatFactor {
  if (!catnat || catnat.count === 0) {
    return {
      available: Boolean(catnat),
      level: "none",
      modifier: 0,
      label: CATNAT_LABELS.none,
    };
  }

  const yearsAgo = catnat.lastYear
    ? new Date().getFullYear() - catnat.lastYear
    : Infinity;

  let level: CatNatLevel;
  if (catnat.count >= 8 || (catnat.count >= 3 && yearsAgo <= 5)) {
    level = "significant";
  } else if (catnat.count >= 3 || yearsAgo <= 10) {
    level = "moderate";
  } else {
    level = "old";
  }

  return {
    available: true,
    count: catnat.count,
    lastYear: catnat.lastYear,
    dominantPeril: catnat.dominantPeril,
    level,
    modifier: CATNAT_MODIFIERS[level],
    label: CATNAT_LABELS[level],
    sentence: catnat.sentence,
  };
}

// ── Factor scoring ────────────────────────────────────────────────────────────
function scoreFactors(categories: RiskCategory[]): ScoredFactor[] {
  return categories.map((category) => {
    const weight = CATEGORY_WEIGHTS[category.id] ?? 1.0;
    const base = PRIORITY_BASE[category.priority];
    const score = Math.min(100, Math.round(base * weight));
    const explanations = FACTOR_EXPLANATIONS[category.id];

    return {
      id: category.id,
      label: category.label,
      priority: category.priority,
      score,
      weight,
      explanation: explanations?.[category.priority] ?? category.summary,
      actionHint: FACTOR_ACTION_HINTS[category.id] ?? category.recommendation,
    };
  });
}

// ── Global score ──────────────────────────────────────────────────────────────
// Formula: dominant risk × 70% + average of remaining × 30% + CatNat modifier.
// This preserves the signal of the strongest exposure without diluting it
// across all possible categories.
function computeGlobalScore(factors: ScoredFactor[], catnatModifier: number): number {
  if (factors.length === 0) return Math.min(100, catnatModifier);

  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const dominant = sorted[0].score;
  const rest = sorted.slice(1);
  const restAvg =
    rest.length > 0
      ? rest.reduce((sum, f) => sum + f.score, 0) / rest.length
      : 0;

  return Math.min(100, Math.round(dominant * 0.7 + restAvg * 0.3 + catnatModifier));
}

// ── Level thresholds ──────────────────────────────────────────────────────────
function scoreToLevel(score: number): RiskLevel {
  if (score >= 66) return "high";
  if (score >= 33) return "medium";
  return "low";
}

// ── Summary ───────────────────────────────────────────────────────────────────
function buildSummary(factors: ScoredFactor[], level: RiskLevel, catnat: CatNatFactor): string {
  const levelLabel = { high: "élevé", medium: "modéré", low: "faible" }[level];

  if (factors.length === 0) {
    return "Aucun risque notable identifié pour cette adresse sur la base des données disponibles.";
  }

  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const highFactors = sorted.filter((f) => f.priority === "high");

  let base: string;
  if (highFactors.length >= 2) {
    const names = highFactors
      .slice(0, 2)
      .map((f) => f.label.toLowerCase())
      .join(" et ");
    base = `Risque ${levelLabel} avec deux expositions importantes : ${names}.`;
  } else if (sorted.length >= 2 && sorted[1].score >= 40) {
    base = `Risque ${levelLabel} principalement lié à ${sorted[0].label.toLowerCase()}, avec un cumul à considérer (${sorted[1].label.toLowerCase()}).`;
  } else {
    base = `Risque ${levelLabel} principalement lié à ${sorted[0].label.toLowerCase()}.`;
  }

  if (catnat.level === "significant" || catnat.level === "moderate") {
    base += " L'historique de catastrophes naturelles sur cette commune renforce cette lecture.";
  }

  return base;
}

// ── Takeaway (for "Aide à la décision" / Analyse card) ───────────────────────
function buildTakeaway(scoring: ScoringResult): string {
  const { globalLevel, factors, catnatFactor } = scoring;

  if (factors.length === 0) {
    return "Conservez de bons réflexes d'entretien et de prévention au quotidien.";
  }

  const sorted = [...factors].sort((a, b) => b.score - a.score);

  if (globalLevel === "high") {
    const catnatNote =
      catnatFactor.level !== "none"
        ? "L'historique de sinistres de la commune est un signal supplémentaire à ne pas négliger."
        : "Un professionnel peut vous aider à évaluer l'exposition réelle avant engagement.";
    return `Vérifiez en priorité les points liés à ${sorted[0].label.toLowerCase()} avant toute décision. ${catnatNote}`;
  }

  if (globalLevel === "medium") {
    return "Gardez ces sujets dans votre grille de décision et complétez les vérifications utiles selon le projet et le budget.";
  }

  return "Le bien peut être analysé sereinement, avec les vérifications d'usage habituelles et une surveillance régulière.";
}

// ── Rationale (for "Aide à la décision" / Contexte card) ─────────────────────
export function buildRationale(scoring: ScoringResult): string {
  const { globalLevel, globalScore, catnatFactor } = scoring;
  const catnatNote =
    catnatFactor.level !== "none"
      ? ` L'historique CatNat (${catnatFactor.label.toLowerCase()}) est intégré dans le calcul.`
      : "";

  if (globalLevel === "high") {
    return `Le niveau élevé est retenu en raison d'expositions significatives identifiées (score ${globalScore}/100).${catnatNote}`;
  }
  if (globalLevel === "medium") {
    return `Le niveau modéré est retenu dès qu'un risque notable apparaît ou que plusieurs facteurs se cumulent (score ${globalScore}/100).${catnatNote}`;
  }
  return `Le niveau faible est retenu lorsque seuls des risques limités sont identifiés, sans cumul significatif (score ${globalScore}/100).${catnatNote}`;
}

// ── Recommendation ────────────────────────────────────────────────────────────
function buildRecommendation(level: RiskLevel): string {
  if (level === "high") return "Vigilance renforcée recommandée avant tout engagement";
  if (level === "medium") return "Point d'attention avant décision d'achat ou de mise en location";
  return "Exposition limitée — vérifications d'usage suffisantes";
}

// ── Priorities ────────────────────────────────────────────────────────────────
function buildPriorities(factors: ScoredFactor[], catnat: CatNatFactor): Priority[] {
  const priorities: Priority[] = [];
  const sorted = [...factors].sort((a, b) => b.score - a.score);

  for (const factor of sorted.slice(0, 2)) {
    priorities.push({
      rank: priorities.length + 1,
      action: factor.actionHint,
      context: factor.explanation,
    });
  }

  if (catnat.level === "significant" || catnat.level === "moderate") {
    priorities.push({
      rank: priorities.length + 1,
      action: "Demander l'historique complet des sinistres à la mairie ou à l'assureur du vendeur.",
      context: catnat.sentence ?? catnat.label,
    });
  } else if (priorities.length < 2) {
    priorities.push({
      rank: priorities.length + 1,
      action: "Maintenir de bons réflexes d'entretien préventif du bien.",
      context: "Une surveillance régulière reste suffisante pour ce niveau d'exposition.",
    });
  }

  return priorities.slice(0, 3);
}

// ── Main V2 export ────────────────────────────────────────────────────────────
export function computeV2Scoring(
  categories: RiskCategory[],
  catnat: CatNatSummary | undefined
): ScoringResult {
  const catnatFactor = classifyCatNat(catnat);
  const factors = scoreFactors(categories);
  const globalScore = computeGlobalScore(factors, catnatFactor.modifier);
  const globalLevel = scoreToLevel(globalScore);

  return {
    globalScore,
    globalLevel,
    factors,
    catnatFactor,
    summary: buildSummary(factors, globalLevel, catnatFactor),
    recommendation: buildRecommendation(globalLevel),
    priorities: buildPriorities(factors, catnatFactor),
  };
}

// ── Derive RiskOverview from ScoringResult ────────────────────────────────────
export function deriveOverallRisk(scoring: ScoringResult): RiskOverview {
  const levelLabel = { high: "Élevé", medium: "Modéré", low: "Faible" }[scoring.globalLevel];
  return {
    level: scoring.globalLevel,
    score: Math.round(scoring.globalScore / 10),
    maxScore: 10,
    label: `Risque global : ${levelLabel}`,
    decision: scoring.recommendation,
    summary: scoring.summary,
    takeaway: buildTakeaway(scoring),
    rationale: buildRationale(scoring),
  };
}

// ── Legacy export (backward compat) ──────────────────────────────────────────
export function buildOverallRisk(categories: RiskCategory[]): RiskOverview {
  return deriveOverallRisk(computeV2Scoring(categories, undefined));
}
