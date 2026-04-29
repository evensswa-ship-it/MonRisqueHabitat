import type { RiskCategory, RiskResult } from "@/types/risk";

type ProfessionalReading = {
  source: string;
  impact: string;
  fileAction: string;
  underwritingPoint: string;
};

type DeskSummary = {
  agency: string;
  broker: string;
  underwriting: string;
};

const DEFAULT_READING: ProfessionalReading = {
  source: "Données publiques officielles",
  impact:
    "Signal à replacer dans le contexte du bien, de son usage et de son historique d'entretien.",
  fileAction:
    "Conserver le diagnostic dans le dossier et demander les éléments complémentaires si le risque influence la décision.",
  underwritingPoint:
    "Tracer le point de vigilance dans l'analyse afin de justifier la lecture du risque.",
};

const READINGS: Record<string, ProfessionalReading> = {
  flood: {
    source: "Géorisques / GASPAR",
    impact:
      "Risque naturel déclaré à l'échelle communale. Pour l'agent, c'est un sujet de transparence acquéreur; pour l'assureur, un signal sur les franchises CatNat et la sinistralité potentielle.",
    fileAction:
      "Demander l'historique des sinistres, vérifier caves, rez-de-chaussée, évacuations et conserver l'information dans le dossier de vente ou de souscription.",
    underwritingPoint:
      "Questionner les antécédents d'inondation et la présence de mesures de prévention déjà en place.",
  },
  ppri: {
    source: "Géorisques WMS / zonage réglementaire PPR inondation",
    impact:
      "Zonage réglementaire localisé. C'est le signal le plus structurant pour qualifier la constructibilité, les travaux possibles et le niveau de vigilance avant engagement.",
    fileAction:
      "Récupérer le règlement PPRI, identifier la couleur de zone et vérifier les prescriptions applicables au bâti existant.",
    underwritingPoint:
      "Tracer le classement PPRI et demander si des obligations de mise en conformité ou de prévention s'appliquent au bien.",
  },
  pollution: {
    source: "Géorisques SSP / CASIAS, BASOL, SIS",
    impact:
      "Historique industriel ou pollution documentée à proximité. En immobilier, cela peut peser sur la valeur, la négociation et les projets de travaux; en assurance, c'est un signal de responsabilité environnementale à qualifier.",
    fileAction:
      "Identifier la fiche du site, sa distance, son statut et demander une étude de sol si le projet implique terrassement, jardin, extension ou changement d'usage.",
    underwritingPoint:
      "Vérifier si le risque relève d'un simple historique d'activité ou d'un site nécessitant action publique, car la portée assurantielle n'est pas la même.",
  },
  cavites: {
    source: "Géorisques / BDCAVITE",
    impact:
      "Présence possible de vide souterrain à proximité. Pour l'agent et le conseiller, c'est un point structurel; pour l'assureur, un signal de stabilité du sol et de dommages potentiels au bâti.",
    fileAction:
      "Demander les diagnostics ou études géotechniques disponibles et inspecter fissures, affaissements, dallages et murs porteurs.",
    underwritingPoint:
      "Documenter la distance à la cavité et les signes visibles de mouvement avant de conclure sur l'acceptabilité du risque.",
  },
  icpe: {
    source: "Géorisques / installations classées ICPE et SEVESO",
    impact:
      "Environnement industriel réglementé dans le périmètre. Ce n'est pas automatiquement bloquant, mais cela doit être qualifié pour les risques technologiques, nuisances, servitudes et perception client.",
    fileAction:
      "Identifier l'établissement le plus proche, son statut SEVESO éventuel, son activité et l'existence d'un PPRT ou d'une servitude locale.",
    underwritingPoint:
      "Distinguer ICPE non SEVESO, SEVESO seuil bas et seuil haut; le niveau de documentation attendu change fortement.",
  },
  promethee: {
    source: "Base PROMETHEE / historique feux méditerranéens",
    impact:
      "Historique communal d'incendies de forêt. Utile pour qualifier l'interface forêt-habitat, la prévention et les obligations de débroussaillement.",
    fileAction:
      "Vérifier les obligations légales de débroussaillement, les accès secours, la végétation proche et les matériaux exposés.",
    underwritingPoint:
      "Tracer l'exposition feu de forêt si le bien est proche de végétation dense ou si les obligations de prévention ne sont pas documentées.",
  },
  clay: {
    source: "Géorisques / exposition retrait-gonflement des argiles",
    impact:
      "Signal de sensibilité du sol. Il influence surtout les fissures, fondations, extensions et travaux lourds.",
    fileAction:
      "Observer les fissures en façade, les ouvertures qui coincent, l'écoulement des eaux pluviales et les travaux récents.",
    underwritingPoint:
      "Demander si des désordres structurels ont déjà été déclarés ou réparés.",
  },
  "ground-movement": {
    source: "Géorisques / mouvements de terrain",
    impact:
      "Signal de stabilité du terrain. Il doit être rapproché de la pente, des murs de soutènement et des désordres visibles.",
    fileAction:
      "Inspecter les abords, murs de soutènement, talus, remblais et décalages de niveau.",
    underwritingPoint:
      "Tracer tout indice visible d'affaissement ou de glissement avant décision.",
  },
  fire: {
    source: "Géorisques / risque feu de forêt",
    impact:
      "Signal d'exposition environnementale. Il appelle une lecture prévention, accès secours et débroussaillement.",
    fileAction:
      "Vérifier la végétation à proximité, les obligations locales et les accès pompiers.",
    underwritingPoint:
      "Documenter les mesures de prévention existantes et l'environnement immédiat du bien.",
  },
  storm: {
    source: "Géorisques / risque météorologique",
    impact:
      "Signal d'entretien et de vulnérabilité des éléments exposés: toiture, gouttières, volets, clôtures et dépendances.",
    fileAction:
      "Vérifier l'état de la toiture et des éléments extérieurs avant saison à risque.",
    underwritingPoint:
      "Qualifier l'entretien du bâti et les sinistres tempête antérieurs.",
  },
  seismic: {
    source: "Géorisques / zonage sismique",
    impact:
      "Signal réglementaire surtout utile en cas de travaux structurels, extension ou surélévation.",
    fileAction:
      "Vérifier les règles applicables si un projet modifie la structure du bâtiment.",
    underwritingPoint:
      "Tracer le contexte sismique lorsque des travaux lourds sont prévus.",
  },
  radon: {
    source: "Géorisques / potentiel radon",
    impact:
      "Signal sanitaire lié aux pièces basses et peu ventilées. Il pèse surtout sur l'usage et la prévention.",
    fileAction:
      "Vérifier ventilation, caves, sous-sols et possibilité de mesure radon si occupation régulière.",
    underwritingPoint:
      "Mentionner les mesures de ventilation existantes en cas de locaux enterrés.",
  },
};

export function getProfessionalReading(risk: RiskCategory): ProfessionalReading {
  return READINGS[risk.id] ?? DEFAULT_READING;
}

export function buildDeskSummary(result: RiskResult): DeskSummary {
  const high = result.categories.filter((risk) => risk.priority === "high");
  const regulated = result.categories.find((risk) => risk.id === "ppri");
  const pollution = result.categories.find((risk) => risk.id === "pollution");
  const icpe = result.categories.find((risk) => risk.id === "icpe");
  const dominant = high[0] ?? result.categories[0];

  const agency = regulated
    ? "Mettre le zonage PPRI au centre de l'échange: il peut conditionner travaux, revente et négociation."
    : dominant
      ? `Présenter d'abord ${dominant.label.toLowerCase()} comme point de lecture du bien, puis rattacher les autres signaux aux vérifications terrain.`
      : "Présenter le dossier comme favorable, tout en conservant les éléments de preuve dans le dossier client.";

  const broker = pollution
    ? "Qualifier l'origine du signal pollution: simple ancien site industriel, site BASOL ou SIS n'ont pas la même portée pour le conseil."
    : icpe
      ? "Qualifier le voisinage industriel avant de parler garanties: statut SEVESO, distance et PPRT éventuel font la différence."
      : "Transformer les risques visibles en questions de souscription: sinistres passés, prévention existante, travaux prévus.";

  const underwriting = high.length > 0
    ? "Prioriser les pièces justificatives sur les risques élevés avant validation: règlement, historique sinistre, photos, diagnostics ou études disponibles."
    : "Dossier plutôt lisible: tracer les signaux modérés et demander uniquement les pièces qui changent réellement l'appréciation du risque.";

  return { agency, broker, underwriting };
}
