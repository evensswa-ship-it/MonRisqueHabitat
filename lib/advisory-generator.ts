import type { RiskResult, RiskCategory, RiskPriority } from "@/types/risk";
import type {
  BrokerInput,
  AdvisoryReport,
  AdvisoryRiskNote,
  AdvisoryOutput,
  DDASection,
  VigilanceLevel,
} from "@/types/advisory-report";
import {
  MEETING_TYPE_LABELS,
  CLIENT_DECISION_LABELS,
  CLIENT_NEED_LABELS,
  PROPERTY_TYPE_LABELS,
  COVERAGE_LEVEL_LABELS,
  PROPERTY_STATUS_LABELS,
  RESIDENCE_TYPE_LABELS,
} from "@/types/advisory-report";

// ── DDA sentence mapping ──────────────────────────────────────────────────────
// Chaque risque MRH → phrase DDA contextualisée, jamais donnée brute.
// Formulées exclusivement pour courtiers et agents généraux d'assurance.

const DDA_SENTENCES: Record<string, Partial<Record<RiskPriority, string>>> = {
  flood: {
    high: "Le bien étant situé en zone à risque d'inondation identifié, une attention particulière a été portée sur les garanties catastrophe naturelle et les franchises applicables. Le conseiller a souligné l'importance de vérifier les conditions de mise en jeu de la garantie et l'adéquation du niveau de couverture proposé.",
    medium: "Le risque d'inondation identifié sur ce secteur a conduit à examiner les garanties événements naturels du contrat envisagé. Une vigilance a été mentionnée concernant les conditions de déclenchement de la garantie catastrophe naturelle.",
    low: "Le risque d'inondation, présent à un niveau limité sur ce territoire, a été mentionné à titre informatif et intégré dans l'analyse globale de couverture.",
  },
  ppri: {
    high: "Le bien étant situé dans le périmètre d'un Plan de Prévention des Risques d'Inondation (PPRI), le conseiller a présenté les implications réglementaires et les garanties adaptées. Ce zonage a été considéré comme structurant dans le choix du contrat recommandé.",
    medium: "La présence d'un PPRI sur ce secteur a été portée à l'attention du client. Le conseiller a évoqué les prescriptions applicables et leur impact potentiel sur les conditions de souscription.",
    low: "Le secteur est concerné par un Plan de Prévention des Risques d'Inondation. Ce point a été évoqué à titre d'information réglementaire dans le cadre du conseil.",
  },
  clay: {
    high: "La forte présence d'argile gonflante dans ce secteur a conduit à une analyse approfondie des garanties couvrant les mouvements différentiels de sol. Le conseiller a signalé ce point comme déterminant dans le choix du niveau de couverture recommandé.",
    medium: "La présence d'argile gonflante a été portée à l'attention du client. Une vigilance particulière a été mentionnée concernant la garantie couvrant les désordres structurels progressifs liés au retrait-gonflement des argiles.",
    low: "La nature argileuse des sols dans ce secteur a été mentionnée comme point de surveillance à intégrer dans l'analyse de couverture.",
  },
  "ground-movement": {
    high: "Le risque de mouvement de terrain, identifié comme élevé sur ce bien, a conduit à examiner les garanties applicables et la stabilité du bâti assuré. Le conseiller a recommandé de documenter l'état structurel dans le dossier de souscription.",
    medium: "Le risque de mouvement de terrain a été identifié et porté à l'attention du client. Une attention particulière a été portée sur les garanties couvrant les désordres structurels.",
    low: "Le risque de mouvement de terrain, présent à un niveau limité sur ce secteur, a été mentionné comme point de surveillance dans l'analyse du risque.",
  },
  fire: {
    high: "L'exposition au risque de feu de forêt, identifiée comme élevée, a conduit à examiner les obligations de débroussaillement applicables et les conditions de couverture du contrat envisagé. Le conseiller a souligné l'importance des mesures de prévention dans ce contexte.",
    medium: "Le risque de feu de forêt a été identifié et discuté lors de cet entretien. Une vigilance a été mentionnée concernant l'environnement végétal du bien et les garanties incendie applicables.",
    low: "Le risque de feu de forêt, présent à un niveau modéré sur ce secteur, a été évoqué comme point de prévention à intégrer dans l'analyse.",
  },
  promethee: {
    high: "L'historique communal d'incendies de forêt, identifié comme significatif, a conduit à examiner les obligations de débroussaillement et les garanties feu de forêt. Le conseiller a recommandé de documenter les mesures de prévention en place dans le dossier de souscription.",
    medium: "Un historique d'incendies de forêt a été identifié sur ce secteur et porté à l'attention du client. Ce point a été pris en compte dans l'analyse des garanties incendie.",
    low: "Le secteur présente un historique limité d'incendies de forêt. Ce point a été évoqué à titre d'information et de vigilance préventive.",
  },
  seismic: {
    high: "Le contexte sismique de cette zone, classé réglementairement élevé, a été présenté comme point structurant, notamment en cas de travaux ou de modification du bâti assuré. Le conseiller a mentionné les implications sur les conditions de couverture à vérifier.",
    medium: "Le zonage sismique de ce secteur a été porté à l'attention du client, en particulier dans la perspective de travaux structurels éventuels sur le bien.",
    low: "Le risque sismique, classé modéré sur ce territoire, a été mentionné à titre d'information réglementaire dans le cadre du conseil.",
  },
  radon: {
    high: "Le potentiel radon identifié comme élevé sur ce secteur a conduit à mentionner les mesures de ventilation nécessaires dans le cadre du conseil, notamment pour les espaces bas et les pièces peu aérées du bien.",
    medium: "Le potentiel radon présent sur ce secteur a été évoqué lors de l'entretien. Une vigilance a été mentionnée concernant la ventilation des espaces enterrés ou peu aérés.",
    low: "Le potentiel radon, à un niveau limité sur ce secteur, a été évoqué à titre d'information sanitaire.",
  },
  storm: {
    high: "L'exposition aux risques météorologiques, identifiée comme élevée, a conduit à examiner les garanties tempête et grêle du contrat envisagé. Le conseiller a souligné l'importance d'une couverture adaptée aux éléments extérieurs exposés.",
    medium: "Le risque météorologique a été abordé lors de cet entretien. Une attention a été portée sur les garanties couvrant les dommages aux éléments extérieurs du bien.",
    low: "Le risque météorologique, présent à un niveau limité, a été mentionné comme point de prévention à intégrer dans le conseil de couverture.",
  },
  pollution: {
    high: "La présence d'un historique de pollution documenté à proximité du bien a conduit à examiner les implications en termes de responsabilité environnementale et les conditions de souscription applicables. Le conseiller a recommandé de qualifier précisément ce signal dans le dossier.",
    medium: "Un historique d'activité industrielle à proximité du bien a été identifié et porté à l'attention du client. Le conseiller a mentionné ce point comme élément à qualifier avant de finaliser les conditions de couverture.",
    low: "Un signal de pollution historique à distance du bien a été identifié et évoqué à titre d'information dans l'analyse du risque.",
  },
  cavites: {
    high: "La présence documentée de cavités souterraines à proximité du bien a conduit à examiner les garanties couvrant les désordres structurels et la stabilité du sol. Le conseiller a recommandé d'obtenir les éléments disponibles sur la nature du sous-sol avant finalisation du dossier.",
    medium: "La présence possible de cavités à proximité a été portée à l'attention du client. Une vigilance a été mentionnée concernant les garanties couvrant les mouvements de sol.",
    low: "Un signal de cavités souterraines à distance a été mentionné à titre d'information et de surveillance dans l'analyse du risque.",
  },
  icpe: {
    high: "La proximité d'une installation classée (ICPE) a été identifiée comme point structurant dans l'analyse du dossier. Le conseiller a examiné les risques technologiques associés et les garanties applicables, en tenant compte du statut éventuel de l'établissement (SEVESO, PPRT).",
    medium: "Un environnement industriel réglementé a été identifié à proximité du bien et porté à l'attention du client. Le conseiller a mentionné ce point dans l'évaluation du profil de risque technologique.",
    low: "La présence d'une installation classée à distance a été évoquée à titre d'information dans l'analyse globale du dossier.",
  },
};

function getDDASentence(cat: RiskCategory): string {
  const sentences = DDA_SENTENCES[cat.id];
  if (sentences?.[cat.priority]) return sentences[cat.priority] as string;
  return `Le risque ${cat.label.toLowerCase()} a fait l'objet d'une attention particulière lors de cet entretien, sur la base des données officielles disponibles. Le conseiller a intégré ce point dans son analyse du profil de couverture.`;
}

function toVigilanceLevel(priority: RiskPriority): VigilanceLevel {
  if (priority === "high") return "urgent";
  if (priority === "medium") return "action";
  return "watch";
}

export function buildRiskNotes(result: RiskResult, confirmedRiskIds: string[]): AdvisoryRiskNote[] {
  return result.categories
    .filter((c) => confirmedRiskIds.includes(c.id))
    .map((c) => ({
      riskId: c.id,
      label: c.label,
      vigilanceLevel: toVigilanceLevel(c.priority),
      ddaSentence: getDDASentence(c),
    }));
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function shortAddress(address: string): string {
  return address.split(",")[0]?.trim() ?? address;
}

// ── Client profile block ──────────────────────────────────────────────────────

function buildClientProfileBlock(input: BrokerInput): string {
  if (input.clientType === "particulier") {
    const lines = ["Type de client : Particulier"];
    if (input.propertyStatus)
      lines.push(`Statut occupant : ${PROPERTY_STATUS_LABELS[input.propertyStatus]}`);
    if (input.residenceType)
      lines.push(`Type de résidence : ${RESIDENCE_TYPE_LABELS[input.residenceType]}`);
    if (input.householdComposition)
      lines.push(`Composition du foyer : ${input.householdComposition}`);
    return lines.join("\n");
  }

  const lines = ["Type de client : Professionnel"];
  if (input.activityType) lines.push(`Activité : ${input.activityType}`);
  if (input.hasEquipmentOrStock !== undefined)
    lines.push(`Matériel / stock assuré : ${input.hasEquipmentOrStock ? "Oui" : "Non"}`);
  if (input.receivesPublic !== undefined)
    lines.push(`Accueil du public : ${input.receivesPublic ? "Oui" : "Non"}`);
  return lines.join("\n");
}

// ── Internal DDA document ─────────────────────────────────────────────────────

function buildInternalSections(
  input: BrokerInput,
  result: RiskResult,
  riskNotes: AdvisoryRiskNote[]
): DDASection[] {
  const clientName = `${input.clientFirstName} ${input.clientLastName}`;
  const meetingDateFr = formatDate(input.meetingDate);
  const generatedFr = formatDate(new Date().toISOString());
  const oriasLine = input.advisorOrias ? `, ORIAS n° ${input.advisorOrias}` : "";

  const riskBlock =
    riskNotes.length > 0
      ? riskNotes
          .map((n) => {
            const marker =
              n.vigilanceLevel === "urgent"
                ? "Vigilance renforcée"
                : n.vigilanceLevel === "action"
                  ? "Point de vigilance"
                  : "À surveiller";
            return `${n.label} — ${marker}\n${n.ddaSentence}`;
          })
          .join("\n\n")
      : "Aucun risque significatif n'a été retenu dans le périmètre de ce conseil. Le profil de risque du bien apparaît favorable au regard des données disponibles.";

  const catnatBlock =
    result.catnat && result.catnat.count > 0
      ? `\nHistorique sinistres CatNat : ${result.catnat.sentence}`
      : "";

  const rdvPointsBlock = input.rdvPoints
    .filter((p) => p.trim())
    .map((p) => `· ${p}`)
    .join("\n");

  const optionsBlock =
    input.selectedOptions.length > 0
      ? `\nOptions et garanties complémentaires retenues :\n${input.selectedOptions.map((o) => `· ${o}`).join("\n")}`
      : "";

  const decisionLabel = CLIENT_DECISION_LABELS[input.clientDecision];
  const decisionNoteBlock =
    input.clientDecision !== "accepted" && input.decisionNote
      ? `\nMotif exprimé par le client : « ${input.decisionNote} »\n\nLe conseiller a informé le client des conséquences d'une absence ou d'une sous-couverture sur ce type de bien.`
      : "";

  return [
    {
      id: "identification",
      title: "A. Identification de l'entretien",
      content: [
        `Date : ${meetingDateFr}`,
        `Conseiller : ${input.advisorName}, ${input.advisorFirmName}${oriasLine}`,
        `Type d'entretien : ${MEETING_TYPE_LABELS[input.meetingType]}`,
        "",
        `Client : ${clientName}`,
        `Email : ${input.clientEmail}`,
        `Bien concerné : ${result.address}`,
        `Type de bien : ${PROPERTY_TYPE_LABELS[input.propertyType]}`,
        `Document généré le : ${generatedFr}`,
      ].join("\n"),
    },
    {
      id: "profil",
      title: "B. Profil client et situation",
      content: buildClientProfileBlock(input),
    },
    {
      id: "besoins",
      title: "C. Besoins identifiés",
      content: [
        `Besoin principal exprimé : ${CLIENT_NEED_LABELS[input.clientNeed]}${input.clientNeedOther ? ` — ${input.clientNeedOther}` : ""}`,
        "",
        rdvPointsBlock
          ? `Points évoqués lors de l'entretien :\n${rdvPointsBlock}`
          : "Aucun point particulier complémentaire renseigné.",
      ].join("\n"),
    },
    {
      id: "risques",
      title: "D. Analyse des risques liés au bien",
      content: `Sur la base de l'analyse du bien effectuée à partir des données officielles (Géorisques, GASPAR, IGN), les éléments suivants ont été portés à l'attention du client et retenus dans le cadre du conseil :\n\n${riskBlock}${catnatBlock}`,
    },
    {
      id: "solution",
      title: "E. Solution envisagée et recommandation du conseiller",
      content: [
        `Type de contrat : ${input.contractType}`,
        `Niveau de couverture : ${COVERAGE_LEVEL_LABELS[input.coverageLevel]}`,
        optionsBlock,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      id: "decision",
      title: "F. Décision du client",
      content: `À l'issue de l'entretien, le client a :\n\n${decisionLabel}${decisionNoteBlock}`,
    },
    {
      id: "dda",
      title: "G. Mentions réglementaires — Devoir de conseil (DDA)",
      content: `Conformément à la Directive sur la Distribution d'Assurances (DDA) et à l'article L521-2 du Code des assurances :\n\n· Le conseiller a procédé à une analyse des besoins du client préalablement à toute recommandation.\n· Les informations recueillies sont fondées sur les déclarations du client lors de cet entretien.\n· Les produits et niveaux de couverture présentés correspondent aux besoins identifiés et au profil de risque du bien.\n· Le client a été informé de la nature du conseil fourni et du statut du conseiller (courtier / agent général).\n\nDocument conservé par ${input.advisorFirmName} conformément aux obligations d'archivage réglementaire (5 ans minimum).`,
      isSignatureBlock: true,
    },
    {
      id: "signature",
      title: "H. Signature",
      content: `Fait à ____________, le ${meetingDateFr}\n\nSignature du conseiller : ________________________\n\nSignature du client (pour accusé de réception) : ________________________`,
      isSignatureBlock: true,
    },
  ];
}

// ── Client email ──────────────────────────────────────────────────────────────

function buildClientSections(
  input: BrokerInput,
  result: RiskResult,
  riskNotes: AdvisoryRiskNote[]
): DDASection[] {
  const meetingDateFr = formatDate(input.meetingDate);
  const shortAddr = shortAddress(result.address);

  const highlightedRisks = riskNotes
    .filter((n) => n.vigilanceLevel === "urgent" || n.vigilanceLevel === "action")
    .slice(0, 3);

  const riskBlock =
    highlightedRisks.length > 0
      ? highlightedRisks.map((n) => `· ${n.ddaSentence}`).join("\n\n")
      : "· L'analyse n'a pas identifié de risque majeur sur ce bien. Le profil apparaît favorable.";

  const nextStep =
    input.clientDecision === "accepted"
      ? `Comme convenu lors de notre échange, la prochaine étape est la mise en place du contrat suivant :\n\n${input.contractType} — ${COVERAGE_LEVEL_LABELS[input.coverageLevel]}`
      : input.clientDecision === "pending"
        ? "Comme convenu, je vous laisse le temps de la réflexion. N'hésitez pas à me contacter si vous avez des questions avant de vous décider."
        : "Suite à votre décision, je reste disponible si vous souhaitez revenir sur ce sujet ou explorer d'autres solutions.";

  const oriasLine = input.advisorOrias ? ` — ORIAS n° ${input.advisorOrias}` : "";

  return [
    {
      id: "intro",
      title: "Introduction",
      content: `Bonjour ${input.clientFirstName},\n\nMerci pour notre échange de ce ${meetingDateFr}. Comme convenu, je vous adresse un récapitulatif de notre entretien concernant votre ${PROPERTY_TYPE_LABELS[input.propertyType].toLowerCase()} situé ${shortAddr}.`,
    },
    {
      id: "risques_client",
      title: "Ce que nous avons examiné ensemble",
      content: `Nous avons passé en revue le profil de risque de votre bien et les points de couverture à considérer. Voici les éléments qui ont orienté notre analyse et notre recommandation :\n\n${riskBlock}`,
    },
    {
      id: "suite",
      title: "La suite",
      content: nextStep,
    },
    {
      id: "signature_client",
      title: "Signature",
      content: `Bien cordialement,\n\n${input.advisorName}\n${input.advisorFirmName}${oriasLine}\n\n---\nCe message fait suite à un entretien de conseil réalisé le ${meetingDateFr}. Il est fourni à titre de récapitulatif et ne constitue pas un contrat ni un document de souscription.`,
    },
  ];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateAdvisoryReport(result: RiskResult, input: BrokerInput): AdvisoryReport {
  const riskNotes = buildRiskNotes(result, input.confirmedRiskIds);
  const generatedAt = new Date().toISOString();
  const id = `advisory-${Date.now()}`;
  const shortAddr = shortAddress(result.address);
  const meetingDateFr = formatDate(input.meetingDate);

  const internal: AdvisoryOutput = {
    emailSubject: `Compte rendu de conseil — ${input.clientFirstName} ${input.clientLastName} — ${meetingDateFr}`,
    sections: buildInternalSections(input, result, riskNotes),
    legalFooter: `Document de traçabilité — confidentiel — usage interne ${input.advisorFirmName} · Généré via Mon Risque Habitat (AGS & Co) · ${new Date(generatedAt).toLocaleDateString("fr-FR")}`,
  };

  const client: AdvisoryOutput = {
    emailSubject: `Suite à notre entretien du ${meetingDateFr} — Récapitulatif pour ${shortAddr}`,
    sections: buildClientSections(input, result, riskNotes),
    legalFooter: "Mon Risque Habitat ne se substitue pas à un état des risques officiel. Il en facilite la lecture et la communication dans le cadre du conseil en assurance.",
  };

  return {
    id,
    generatedAt,
    propertyAddress: result.address,
    meetingDate: input.meetingDate,
    advisorName: input.advisorName,
    advisorFirmName: input.advisorFirmName,
    advisorOrias: input.advisorOrias,
    clientName: `${input.clientFirstName} ${input.clientLastName}`,
    clientEmail: input.clientEmail,
    riskNotes,
    internal,
    client,
  };
}

// ── Plain text serializer (for copy/clipboard) ────────────────────────────────

export function serializeAdvisoryOutput(output: AdvisoryOutput): string {
  const lines: string[] = [output.emailSubject, ""];
  for (const section of output.sections) {
    lines.push(`── ${section.title.toUpperCase()} ──`);
    lines.push(section.content);
    lines.push("");
  }
  lines.push("---");
  lines.push(output.legalFooter);
  return lines.join("\n");
}
