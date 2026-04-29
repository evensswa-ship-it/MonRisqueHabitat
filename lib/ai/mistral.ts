import type { RiskResult } from "@/types/risk";
import { getProfessionalReading } from "@/lib/risk-professional-wording";

// ── Types ─────────────────────────────────────────────────────────────────────

type MistralMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type MistralApiResponse = {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
};

export type ClientContext = {
  type_client?: string;
  usage?: string;
  produit_envisage?: string;
};

export type AdviceContent = {
  synthese_risque: string;
  points_de_vigilance: string[];
  angle_de_discours: string;
};

export type RiskAdvice = {
  content: AdviceContent;
  confidence: number;
  warnings: string[];
};

// ── Anonymisation ─────────────────────────────────────────────────────────────
// Aucune adresse précise, aucune donnée personnelle transmise au LLM.

type AnonymizedInput = {
  globalLevel: string;
  globalScore: number;
  risks: Array<{
    label: string;
    priority: string;
    source: string;
    professionalPoint: string;
  }>;
  catnat?: { count: number; lastYear?: number; dominantPeril?: string };
  clientContext: ClientContext;
};

function anonymize(result: RiskResult, clientContext: ClientContext): AnonymizedInput {
  return {
    globalLevel: result.overallRisk.label,
    globalScore: result.overallRisk.score,
    risks: result.categories.map((c) => {
      const reading = getProfessionalReading(c);
      return {
        label: c.label,
        priority: c.priority === "high" ? "Élevé" : c.priority === "medium" ? "Modéré" : "Faible",
        source: reading.source,
        professionalPoint: reading.underwritingPoint,
      };
    }),
    catnat: result.catnat
      ? {
          count: result.catnat.count,
          lastYear: result.catnat.lastYear,
          dominantPeril: result.catnat.dominantPeril,
        }
      : undefined,
    clientContext,
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(data: AnonymizedInput): string {
  const riskLines = data.risks
    .map((r) => `  - ${r.label} : ${r.priority}. Source : ${r.source}. Point métier : ${r.professionalPoint}`)
    .join("\n");

  const catnatLine = data.catnat
    ? `- Historique CatNat : ${data.catnat.count} arrêté(s)${
        data.catnat.lastYear ? `, dernier en ${data.catnat.lastYear}` : ""
      }${data.catnat.dominantPeril ? `, péril dominant : ${data.catnat.dominantPeril}` : ""}`
    : "";

  const clientLines = [
    data.clientContext.type_client && `- Profil : ${data.clientContext.type_client}`,
    data.clientContext.usage && `- Usage : ${data.clientContext.usage}`,
    data.clientContext.produit_envisage && `- Produit envisagé : ${data.clientContext.produit_envisage}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Tu es Conseilla, un assistant d'aide à la rédaction pour un professionnel de l'assurance, du courtage ou de l'immobilier.

À partir des données de risque ci-dessous, produis une note de conseil structurée.

## Données risque
- Niveau global : ${data.globalLevel} (score indicatif : ${data.globalScore}/10)
- Risques identifiés :
${riskLines}
${catnatLine}

## Contexte client
${clientLines || "Non renseigné"}

## Format de réponse (JSON strict, aucun texte en dehors du JSON)
{
  "synthese_risque": "3 à 4 phrases factuelles sur les risques identifiés",
  "points_de_vigilance": ["point 1", "point 2", "point 3"],
  "angle_de_discours": "2 à 3 phrases d'introduction pour l'entretien client"
}

## Contraintes absolues
- Aucune recommandation contractuelle ni produit commercial nommé
- Aucun montant, tarif ou prime d'assurance
- Aucun document réglementaire (IPID, DIPA, fiche conseil DDA)
- Aucune adresse précise du lieu analysé
- Français, ton professionnel et factuel
- La synthèse commence par : "Cette adresse présente"`;
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseContent(raw: string): { content: AdviceContent; warnings: string[] } {
  const warnings: string[] = [];

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Record<string, unknown>;

    if (
      typeof parsed["synthese_risque"] !== "string" ||
      !Array.isArray(parsed["points_de_vigilance"]) ||
      typeof parsed["angle_de_discours"] !== "string"
    ) {
      throw new Error("Champs manquants");
    }

    return {
      content: {
        synthese_risque: parsed["synthese_risque"] as string,
        points_de_vigilance: (parsed["points_de_vigilance"] as unknown[]).filter(
          (p): p is string => typeof p === "string"
        ),
        angle_de_discours: parsed["angle_de_discours"] as string,
      },
      warnings,
    };
  } catch {
    warnings.push(
      "Format de réponse inattendu. Vérifiez l'intégralité du contenu avant utilisation."
    );
    return {
      content: {
        synthese_risque: raw.slice(0, 800),
        points_de_vigilance: [],
        angle_de_discours: "",
      },
      warnings,
    };
  }
}

// ── API call ──────────────────────────────────────────────────────────────────

export async function callMistral(messages: MistralMessage[]): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY non configurée");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages,
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Mistral API error ${res.status}`);
    }

    const data = (await res.json()) as MistralApiResponse;
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Réponse vide de l'API Mistral");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Public ────────────────────────────────────────────────────────────────────

export async function generateRiskSummary(
  result: RiskResult,
  clientContext: ClientContext = {}
): Promise<RiskAdvice> {
  const data = anonymize(result, clientContext);
  const raw = await callMistral([{ role: "user", content: buildPrompt(data) }]);
  const { content, warnings } = parseContent(raw);

  return {
    content,
    confidence: warnings.length === 0 ? 1.0 : 0.6,
    warnings,
  };
}
