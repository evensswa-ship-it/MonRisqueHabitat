import type { RiskCategory, RiskOverview } from "@/types/risk";

const PRIORITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 4
} as const;

const MAX_REFERENCE_SCORE = 10;

function summarizeExposure(categories: RiskCategory[]) {
  const high = categories.filter((risk) => risk.priority === "high").length;
  const medium = categories.filter((risk) => risk.priority === "medium").length;
  const low = categories.filter((risk) => risk.priority === "low").length;

  return { high, medium, low, total: categories.length };
}

function computeScore(categories: RiskCategory[]) {
  const weightedScore = categories.reduce(
    (total, category) => total + PRIORITY_WEIGHTS[category.priority],
    0
  );
  const stackingBonus = categories.length >= 3 ? 1 : 0;

  return Math.min(MAX_REFERENCE_SCORE, weightedScore + stackingBonus);
}

export function buildOverallRisk(categories: RiskCategory[]): RiskOverview {
  const exposure = summarizeExposure(categories);
  const score = computeScore(categories);

  if (exposure.high >= 2 || score >= 6) {
    return {
      level: "high",
      score,
      maxScore: MAX_REFERENCE_SCORE,
      label: "Risque global : Élevé",
      decision: "Vigilance recommandée",
      summary:
        "Plusieurs expositions demandent une attention immédiate avant décision ou mise en location.",
      takeaway:
        "Vérifiez les points les plus sensibles du bien, documentez-les et complétez l'analyse si l'enjeu patrimonial est important.",
      rationale:
        "Le niveau élevé est retenu lorsqu'au moins deux risques élevés sont identifiés ou lorsque le cumul des risques atteint un niveau significatif."
    };
  }

  if (exposure.high >= 1 || exposure.medium >= 2 || score >= 3) {
    return {
      level: "medium",
      score,
      maxScore: MAX_REFERENCE_SCORE,
      label: "Risque global : Modéré",
      decision: "Point d'attention avant achat",
      summary:
        "Une vigilance particulière est recommandée sur ce bien, sans signal d'alerte systématique à ce stade.",
      takeaway:
        "Gardez ces sujets dans votre grille de décision et complétez les vérifications utiles selon le projet, le budget ou l'usage du bien.",
      rationale:
        "Le niveau modéré est retenu dès qu'un risque élevé apparaît, que plusieurs risques modérés se cumulent, ou que le volume total de risques devient notable."
    };
  }

  return {
    level: "low",
    score,
    maxScore: MAX_REFERENCE_SCORE,
    label: "Risque global : Faible",
    decision: "Exposition limitée",
    summary:
      "Les données disponibles font ressortir une exposition limitée et sans point de vigilance majeur identifié.",
    takeaway:
      "Le bien peut être analysé sereinement, avec les vérifications d'usage habituelles et une surveillance régulière.",
    rationale:
      "Le niveau faible est retenu lorsque seuls des risques limités sont identifiés et qu'aucun cumul significatif ne ressort."
  };
}
