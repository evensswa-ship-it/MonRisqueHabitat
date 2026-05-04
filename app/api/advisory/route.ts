import { NextResponse } from "next/server";
import { buildRiskNotes } from "@/lib/advisory-generator";
import { generateDDAReport } from "@/lib/ai/mistral";
import type {
  AdvisoryResult,
  BrokerInput,
  MistralDDAContent,
  AdvisoryRiskNote,
} from "@/types/advisory-report";
import {
  CLIENT_NEED_LABELS,
  CLIENT_DECISION_LABELS,
  COVERAGE_LEVEL_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  RESIDENCE_TYPE_LABELS,
} from "@/types/advisory-report";
import type { RiskResult } from "@/types/risk";

export const maxDuration = 30;

type Payload = {
  riskResult: RiskResult;
  brokerInput: BrokerInput;
};

function validate(body: unknown): Payload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Partial<Payload>;

  if (
    !b.riskResult ||
    typeof b.riskResult !== "object" ||
    !b.riskResult.address ||
    !Array.isArray(b.riskResult.categories)
  ) {
    return null;
  }

  const bi = b.brokerInput;
  if (
    !bi ||
    typeof bi !== "object" ||
    !bi.advisorName ||
    !bi.clientFirstName ||
    !bi.clientLastName ||
    !bi.meetingDate ||
    !bi.clientDecision
  ) {
    return null;
  }

  return { riskResult: b.riskResult, brokerInput: bi };
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return isoDate; }
}

// ── Deterministic fallback ────────────────────────────────────────────────────
// Used when Mistral is unavailable. Builds MistralDDAContent from BrokerInput
// without AI — same shape, all fields filled from structured form data.

function buildFallbackContent(
  result: RiskResult,
  input: BrokerInput,
  riskNotes: AdvisoryRiskNote[]
): MistralDDAContent {
  const meetingDateFr = formatDate(input.meetingDate);
  const needLabel = CLIENT_NEED_LABELS[input.clientNeed ?? "protection-essentielle"];
  const propertyLabel = PROPERTY_TYPE_LABELS[input.propertyType];
  const contractInfo = `${input.contractType} — ${COVERAGE_LEVEL_LABELS[input.coverageLevel]}`;
  const oriasLine = input.advisorOrias ? ` — ORIAS n° ${input.advisorOrias}` : "";

  const profileDetail =
    input.clientType === "particulier"
      ? [
          input.propertyStatus ? `statut ${PROPERTY_STATUS_LABELS[input.propertyStatus].toLowerCase()}` : null,
          input.residenceType ? `résidence ${RESIDENCE_TYPE_LABELS[input.residenceType].toLowerCase()}` : null,
          input.householdComposition ? `foyer : ${input.householdComposition}` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : [
          input.activityType ? `activité : ${input.activityType}` : null,
          input.hasEquipmentOrStock !== undefined
            ? `matériel/stock : ${input.hasEquipmentOrStock ? "oui" : "non"}`
            : null,
          input.receivesPublic !== undefined
            ? `accueil public : ${input.receivesPublic ? "oui" : "non"}`
            : null,
        ]
          .filter(Boolean)
          .join(", ");

  const rdvPoints = input.rdvPoints.filter((p) => p.trim());

  const synthese = [
    `Client ${input.clientType}${profileDetail ? ` (${profileDetail})` : ""}, entretien du ${meetingDateFr} portant sur un ${propertyLabel.toLowerCase()}.`,
    `Besoin principal exprimé : ${needLabel.toLowerCase()}.`,
    rdvPoints.length > 0 ? `Points évoqués : ${rdvPoints.join(" ; ")}.` : null,
    `Solution envisagée : ${contractInfo}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const risques = riskNotes
    .filter((n) => n.vigilanceLevel === "urgent" || n.vigilanceLevel === "action")
    .map((n) => n.ddaSentence);
  const vigilanceFaible = riskNotes
    .filter((n) => n.vigilanceLevel === "watch")
    .map((n) => `${n.label} — présent à un niveau limité sur ce secteur, à surveiller.`);

  const mailCorps = [
    `Bonjour ${input.clientFirstName},`,
    "",
    `Je vous adresse ce récapitulatif de notre entretien du ${meetingDateFr} concernant votre ${propertyLabel.toLowerCase()}.`,
    "",
    `Besoin identifié : ${needLabel}.`,
    `Solution envisagée : ${contractInfo}.`,
    input.selectedOptions.length > 0
      ? `Options évoquées : ${input.selectedOptions.join(", ")}.`
      : null,
    "",
    input.clientDecision === "accepted"
      ? "Comme convenu, je prends en charge les prochaines étapes pour la mise en place du contrat."
      : input.clientDecision === "pending"
        ? "Je reste disponible pour répondre à toute question avant votre décision."
        : "Suite à votre décision, n'hésitez pas à me recontacter si vous souhaitez explorer d'autres options.",
    "",
    "Bien cordialement,",
    input.advisorName,
    `${input.advisorFirmName}${oriasLine}`,
  ]
    .filter((s) => s !== null)
    .join("\n");

  return {
    synthese_client: synthese,
    analyse_besoin: {
      objectif: `Le client souhaite obtenir une ${needLabel.toLowerCase()} pour son ${propertyLabel.toLowerCase()}.`,
      enjeux: [
        ...rdvPoints.slice(0, 2),
        riskNotes.length > 0
          ? `Profil de risque du bien — ${riskNotes.length} point${riskNotes.length > 1 ? "s" : ""} de vigilance identifié${riskNotes.length > 1 ? "s" : ""}`
          : null,
      ].filter(Boolean) as string[],
      niveau_comprehension: null,
    },
    devoir_conseil: {
      besoin_exprime: `${needLabel} pour un ${propertyLabel.toLowerCase()}${profileDetail ? ` (${profileDetail})` : ""}.`,
      solutions_evoquees: [contractInfo, ...input.selectedOptions.slice(0, 2)],
      adequation: `La solution ${contractInfo} a été proposée en adéquation avec le besoin de ${needLabel.toLowerCase()} et le profil de risque identifié sur ce bien.`,
      limites: null,
    },
    points_de_vigilance: {
      risques:
        risques.length > 0
          ? risques
          : ["Aucun risque significatif retenu dans le périmètre de ce conseil."],
      incertitudes: vigilanceFaible,
      a_valider: [],
    },
    recommandations: {
      actions: [
        "Finaliser les éléments du dossier avant souscription.",
        "Transmettre les documents contractuels au client (IPID, conditions générales).",
        "Conserver ce document dans le dossier client pour traçabilité (5 ans minimum).",
      ],
      ajustements: null,
      a_clarifier:
        input.clientDecision !== "accepted" && input.decisionNote
          ? `Motif de réserve exprimé : "${input.decisionNote}". Point à reprendre lors du prochain contact.`
          : null,
    },
    mail_client: {
      objet: `Suite à notre entretien du ${meetingDateFr} — ${propertyLabel}`,
      corps: mailCorps,
    },
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Corps de requête invalide." }, { status: 400 });
  }

  const payload = validate(body);
  if (!payload) {
    return NextResponse.json({ message: "Données manquantes ou invalides." }, { status: 400 });
  }

  const { riskResult, brokerInput } = payload;
  const riskNotes = buildRiskNotes(riskResult, brokerInput.confirmedRiskIds);

  let content: MistralDDAContent;
  let source: "ai" | "deterministic";

  try {
    content = await generateDDAReport(riskResult, brokerInput, riskNotes);
    source = "ai";
  } catch (err) {
    console.warn("[Advisory] Mistral unavailable, using deterministic fallback:", err instanceof Error ? err.message : err);
    content = buildFallbackContent(riskResult, brokerInput, riskNotes);
    source = "deterministic";
  }

  const result: AdvisoryResult = {
    id: `advisory-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    propertyAddress: riskResult.address,
    meetingDate: brokerInput.meetingDate,
    advisorName: brokerInput.advisorName,
    advisorFirmName: brokerInput.advisorFirmName,
    advisorOrias: brokerInput.advisorOrias,
    clientName: `${brokerInput.clientFirstName} ${brokerInput.clientLastName}`,
    clientEmail: brokerInput.clientEmail,
    clientDecision: brokerInput.clientDecision,
    contractType: brokerInput.contractType || "Contrat non précisé",
    source,
    content,
    legalFooter: `Document de traçabilité — confidentiel — ${brokerInput.advisorFirmName} · Généré via Mon Risque Habitat (AGS & Co) · ${new Date().toLocaleDateString("fr-FR")}`,
  };

  return NextResponse.json(result);
}
