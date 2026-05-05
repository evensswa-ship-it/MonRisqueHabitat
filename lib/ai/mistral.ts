import type { RiskResult } from "@/types/risk";
import { getProfessionalReading } from "@/lib/risk-professional-wording";
import type {
  BrokerInput,
  MistralDDAContent,
  AdvisoryRiskNote,
  VigilanceLevel,
} from "@/types/advisory-report";
import {
  CLIENT_NEED_LABELS,
  CLIENT_DECISION_LABELS,
  COVERAGE_LEVEL_LABELS,
  MEETING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  RESIDENCE_TYPE_LABELS,
} from "@/types/advisory-report";

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

  return `Tu es Conseilla, un assistant d'aide à la rédaction pour un courtier en assurance ou un agent général d'assurance.

Tu génères uniquement des notes orientées conseil assurance, devoir de conseil (DDA) et traçabilité professionnelle. Ton interlocuteur est exclusivement un courtier en assurance ou un agent général.

À partir des données de risque ci-dessous, produis une note de conseil structurée à destination d'un courtier ou agent général.

## Données risque
- Niveau global : ${data.globalLevel} (score indicatif : ${data.globalScore}/10)
- Risques identifiés :
${riskLines}
${catnatLine}

## Contexte client
${clientLines || "Non renseigné"}

## Format de réponse (JSON strict, aucun texte en dehors du JSON)
{
  "synthese_risque": "3 à 4 phrases factuelles sur les risques identifiés, formulées pour un conseiller en assurance",
  "points_de_vigilance": ["point 1 orienté souscription ou conseil assurance", "point 2", "point 3"],
  "angle_de_discours": "2 à 3 phrases d'introduction pour l'entretien client en contexte assurance"
}

## Contraintes absolues
- Destinataire exclusif : courtier en assurance ou agent général
- Aucune mention hors parcours assurance, souscription, couverture ou devoir de conseil
- Aucune recommandation contractuelle ni produit commercial nommé
- Aucun montant, tarif ou prime d'assurance
- Aucun document réglementaire reproduit (IPID, DIPA, fiche conseil DDA)
- Aucune adresse précise du lieu analysé
- Français, ton professionnel et factuel, orienté conseil assurance
- La synthèse commence par : "Cette adresse présente"
- Les points de vigilance sont formulés comme des questions de souscription ou des actions de conseil, pas comme des vérifications immobilières`;
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

export async function callMistral(messages: MistralMessage[], maxTokens = 900): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY non configurée");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

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
        max_tokens: maxTokens,
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

// ── DDA generation (Conseilla fusion) ────────────────────────────────────────

function ddaFormatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return isoDate; }
}

function ddaBuildClientBlock(input: BrokerInput): string {
  if (input.clientType === "particulier") {
    const lines = ["Type : Particulier"];
    if (input.propertyStatus) lines.push(`Statut : ${PROPERTY_STATUS_LABELS[input.propertyStatus]}`);
    if (input.residenceType) lines.push(`Résidence : ${RESIDENCE_TYPE_LABELS[input.residenceType]}`);
    if (input.householdComposition) lines.push(`Foyer : ${input.householdComposition}`);
    return lines.join("\n");
  }
  const lines = ["Type : Professionnel"];
  if (input.activityType) lines.push(`Activité : ${input.activityType}`);
  if (input.hasEquipmentOrStock !== undefined) lines.push(`Matériel / stock : ${input.hasEquipmentOrStock ? "Oui" : "Non"}`);
  if (input.receivesPublic !== undefined) lines.push(`Accueil du public : ${input.receivesPublic ? "Oui" : "Non"}`);
  return lines.join("\n");
}

function buildDDAPrompt(
  result: RiskResult | undefined,
  input: BrokerInput,
  riskNotes: AdvisoryRiskNote[]
): string {
  const meetingDateFr = ddaFormatDate(input.meetingDate);
  const oriasLine = input.advisorOrias ? `, ORIAS n° ${input.advisorOrias}` : "";
  const decisionLabel = CLIENT_DECISION_LABELS[input.clientDecision];
  const decisionNoteBlock =
    input.clientDecision !== "accepted" && input.decisionNote
      ? `\nMotif exprimé : "${input.decisionNote}"`
      : "";

  const rdvPoints = input.rdvPoints.filter((p) => p.trim());
  const rdvBlock =
    rdvPoints.length > 0
      ? rdvPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")
      : "Non renseignés lors de cet entretien";

  const optionsBlock =
    input.selectedOptions.length > 0
      ? input.selectedOptions.map((o) => `· ${o}`).join("\n")
      : "Aucune option complémentaire retenue";

  const needLabel = CLIENT_NEED_LABELS[input.clientNeed ?? "protection-essentielle"];
  const needLine = input.clientNeedOther
    ? `${needLabel} — Précision : ${input.clientNeedOther}`
    : needLabel;

  const vigilanceLabels: Record<VigilanceLevel, string> = {
    urgent: "Risque élevé — vigilance renforcée",
    action: "Risque modéré — point de vigilance",
    watch: "Risque faible — à surveiller",
  };

  const riskBlock =
    riskNotes.length > 0
      ? riskNotes
          .map((n) => `• ${n.label} [${vigilanceLabels[n.vigilanceLevel]}]\n  ${n.ddaSentence}`)
          .join("\n\n")
      : "Aucun risque significatif sélectionné par le conseiller pour ce dossier.";

  const catnatBlock =
    result?.catnat && result.catnat.count > 0
      ? `\nHistorique CatNat : ${result.catnat.sentence}`
      : "";

  return `Tu es Conseilla, assistant métier en assurance habitation, au service de courtiers et agents généraux. Tu structures les informations d'un entretien de conseil pour produire un document DDA archivable et défendable.

RÈGLES IMPÉRATIVES :
- Ne jamais inventer d'informations absentes des données ci-dessous
- Champ absent → écrire "Non renseigné lors de l'entretien"
- Aucun montant, tarif, prime ni référence commerciale nominative
- Aucune mention hors parcours assurance, souscription, couverture ou devoir de conseil
- Les données MRH sont des indicateurs issus de sources publiques, non des certitudes contractuelles
- L'adresse exacte du bien a bien été analysée par MRH ; elle est seulement masquée dans ce prompt pour confidentialité
- Ne jamais présenter l'absence d'adresse dans ce prompt comme une limite, une incertitude ou un élément à vérifier
- Format de sortie : JSON strict uniquement, sans aucun texte en dehors

DONNÉES DE L'ENTRETIEN
══════════════════════

Date : ${meetingDateFr}
Conseiller : ${input.advisorName} — ${input.advisorFirmName}${oriasLine}
Type d'entretien : ${MEETING_TYPE_LABELS[input.meetingType]}
Décision du client : ${decisionLabel}${decisionNoteBlock}

PROFIL CLIENT
─────────────
${ddaBuildClientBlock(input)}

BIEN ASSURÉ
───────────
Type : ${PROPERTY_TYPE_LABELS[input.propertyType]}
Adresse : analysée par MRH et masquée uniquement dans ce prompt pour confidentialité

BESOIN PRINCIPAL
────────────────
${needLine}

POINTS ÉVOQUÉS EN ENTRETIEN
────────────────────────────
${rdvBlock}

SOLUTION ENVISAGÉE
──────────────────
Contrat : ${input.contractType}
Niveau de couverture : ${COVERAGE_LEVEL_LABELS[input.coverageLevel]}
Options retenues :
${optionsBlock}

RISQUES MRH IDENTIFIÉS SUR CE BIEN
────────────────────────────────────
${result ? `(Sources : Géorisques, GASPAR, BRGM — données publiques indicatives)
Niveau global : ${result.overallRisk.label}

${riskBlock}${catnatBlock}` : "Données MRH non disponibles pour ce dossier."}

FORMAT DE SORTIE — JSON strict uniquement
═════════════════════════════════════════

{
  "synthese_client": "3-4 phrases. Situation du client, nature du besoin, contexte du bien. Factuel, commencer par le type de client et le type de bien.",
  "analyse_besoin": {
    "objectif": "1-2 phrases sur ce que le client cherche à obtenir.",
    "enjeux": ["enjeu identifié 1", "enjeu identifié 2", "enjeu identifié 3"],
    "niveau_comprehension": "1 phrase sur le niveau d'information perçu du client, ou null"
  },
  "devoir_conseil": {
    "besoin_exprime": "Reformulation fidèle du besoin exprimé. Utiliser uniquement les informations fournies.",
    "solutions_evoquees": ["solution avec niveau de couverture", "options complémentaires si retenues"],
    "adequation": "2-3 phrases. Pourquoi la solution répond au besoin et au profil de risque du bien.",
    "limites": "Éléments manquants ou à compléter avant finalisation, ou null"
  },
  "points_de_vigilance": {
    "risques": ["risque 1 contextualisé en langage assurance", "risque 2"],
    "incertitudes": ["zone d'incertitude à qualifier"],
    "a_valider": ["élément à confirmer avant souscription"]
  },
  "recommandations": {
    "actions": ["action concrète 1", "action concrète 2", "action concrète 3"],
    "ajustements": "Ajustements possibles selon évolution du dossier, ou null",
    "a_clarifier": "Points à revoir avec le client, ou null"
  },
  "mail_client": {
    "objet": "Objet de l'email — court et professionnel",
    "corps": "Corps complet. Formule d'appel nominative. Résumé bref de l'entretien. Rappel de la solution ou de la prochaine étape selon la décision du client. Formule de politesse avec nom et cabinet. Ton professionnel. Prêt à envoyer sans modification."
  }
}`;
}

function nullify(val: unknown): string | null {
  if (val === null || val === undefined || val === "null" || val === "") return null;
  return typeof val === "string" ? val : null;
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function parseDDAContent(raw: string): MistralDDAContent {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Record<string, unknown>;

  const ab = (parsed["analyse_besoin"] ?? {}) as Record<string, unknown>;
  const dc = (parsed["devoir_conseil"] ?? {}) as Record<string, unknown>;
  const pv = (parsed["points_de_vigilance"] ?? {}) as Record<string, unknown>;
  const reco = (parsed["recommandations"] ?? {}) as Record<string, unknown>;
  const mail = (parsed["mail_client"] ?? {}) as Record<string, unknown>;

  const content: MistralDDAContent = {
    synthese_client:
      typeof parsed["synthese_client"] === "string"
        ? parsed["synthese_client"]
        : "Non renseigné",
    analyse_besoin: {
      objectif: typeof ab["objectif"] === "string" ? ab["objectif"] : "Non renseigné",
      enjeux: toStringArray(ab["enjeux"]),
      niveau_comprehension: nullify(ab["niveau_comprehension"]),
    },
    devoir_conseil: {
      besoin_exprime:
        typeof dc["besoin_exprime"] === "string" ? dc["besoin_exprime"] : "Non renseigné",
      solutions_evoquees: toStringArray(dc["solutions_evoquees"]),
      adequation: typeof dc["adequation"] === "string" ? dc["adequation"] : "Non renseigné",
      limites: nullify(dc["limites"]),
    },
    points_de_vigilance: {
      risques: toStringArray(pv["risques"]),
      incertitudes: toStringArray(pv["incertitudes"]),
      a_valider: toStringArray(pv["a_valider"]),
    },
    recommandations: {
      actions: toStringArray(reco["actions"]),
      ajustements: nullify(reco["ajustements"]),
      a_clarifier: nullify(reco["a_clarifier"]),
    },
    mail_client: {
      objet:
        typeof mail["objet"] === "string" ? mail["objet"] : "Suite à notre entretien",
      corps: typeof mail["corps"] === "string" ? mail["corps"] : "Non renseigné",
    },
  };

  return sanitizeDDAContent(content);
}

function mentionsMaskedAddressAsLimit(value: string): boolean {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();

  return (
    normalized.includes("absence de donnees precise") &&
    normalized.includes("adresse")
  ) || (
    normalized.includes("adresse") &&
    normalized.includes("non transmise")
  ) || (
    normalized.includes("localisation exacte") &&
    normalized.includes("verifier")
  );
}

function sanitizeDDAContent(content: MistralDDAContent): MistralDDAContent {
  return {
    ...content,
    devoir_conseil: {
      ...content.devoir_conseil,
      limites:
        content.devoir_conseil.limites &&
        mentionsMaskedAddressAsLimit(content.devoir_conseil.limites)
          ? "Non renseigné lors de l'entretien"
          : content.devoir_conseil.limites,
    },
    points_de_vigilance: {
      risques: content.points_de_vigilance.risques,
      incertitudes: content.points_de_vigilance.incertitudes.filter(
        (item) => !mentionsMaskedAddressAsLimit(item)
      ),
      a_valider: content.points_de_vigilance.a_valider.filter(
        (item) => !mentionsMaskedAddressAsLimit(item)
      ),
    },
  };
}

export async function generateDDAReport(
  result: RiskResult | undefined,
  input: BrokerInput,
  riskNotes: AdvisoryRiskNote[]
): Promise<MistralDDAContent> {
  const prompt = buildDDAPrompt(result, input, riskNotes);
  const raw = await callMistral([{ role: "user", content: prompt }], 2500);
  return parseDDAContent(raw);
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
