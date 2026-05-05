// ── Enums ─────────────────────────────────────────────────────────────────────

export type MeetingType = "discovery" | "renewal" | "amendment" | "expertise";
export type ClientDecision = "accepted" | "pending" | "declined";
export type VigilanceLevel = "watch" | "action" | "urgent";

export type ClientType = "particulier" | "professionnel";
export type PropertyStatus = "proprietaire" | "locataire";
export type ResidenceType = "principale" | "secondaire";
export type PropertyType = "appartement" | "maison" | "local-commercial" | "bureau" | "entrepot";
export type ClientNeed =
  | "protection-essentielle"
  | "couverture-renforcee"
  | "optimisation-budget"
  | "conformite"
  | "autre";
export type CoverageLevel = "essentielle" | "intermediaire" | "complete" | "premium";

// ── Labels ────────────────────────────────────────────────────────────────────

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  discovery: "Découverte",
  renewal: "Renouvellement",
  amendment: "Avenant / modification",
  expertise: "Expertise / sinistre",
};

export const CLIENT_DECISION_LABELS: Record<ClientDecision, string> = {
  accepted: "A accepté la recommandation et souhaite donner suite",
  pending: "A demandé un délai de réflexion",
  declined: "A refusé la recommandation",
};

export const CLIENT_NEED_LABELS: Record<ClientNeed, string> = {
  "protection-essentielle": "Protection essentielle",
  "couverture-renforcee": "Couverture renforcée",
  "optimisation-budget": "Optimisation du budget",
  conformite: "Conformité / obligation légale",
  autre: "Autre besoin",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  appartement: "Appartement",
  maison: "Maison",
  "local-commercial": "Local commercial",
  bureau: "Bureau / cabinet",
  entrepot: "Entrepôt / atelier",
};

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  essentielle: "Couverture essentielle",
  intermediaire: "Couverture intermédiaire",
  complete: "Couverture complète",
  premium: "Couverture premium",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  proprietaire: "Propriétaire",
  locataire: "Locataire",
};

export const RESIDENCE_TYPE_LABELS: Record<ResidenceType, string> = {
  principale: "Résidence principale",
  secondaire: "Résidence secondaire",
};

// ── Main contract options ─────────────────────────────────────────────────────

export const CONTRACT_OPTIONS = [
  "MRH (Multirisque Habitation)",
  "MRP (Multirisque Professionnelle)",
  "RC Pro",
  "PNO (Propriétaire Non Occupant)",
  "Garantie loyers impayés",
  "Assurance emprunteur",
] as const;

export const COVERAGE_OPTIONS = [
  "Garantie dommages électriques",
  "Protection juridique",
  "Garantie catastrophe naturelle renforcée",
  "Bris de glace étendu",
  "Vol et vandalisme",
  "Assistance et relogement",
  "Garantie piscine / dépendances",
  "Pertes d'exploitation",
] as const;

// ── Input types ───────────────────────────────────────────────────────────────

export interface BrokerInput {
  // Conseiller
  advisorName: string;
  advisorFirmName: string;
  advisorOrias?: string;
  meetingType: MeetingType;
  meetingDate: string;

  // Client
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientType: ClientType;

  // Profil particulier
  propertyStatus?: PropertyStatus;
  residenceType?: ResidenceType;
  householdComposition?: string;

  // Profil professionnel
  activityType?: string;
  hasEquipmentOrStock?: boolean;
  receivesPublic?: boolean;

  // Bien assuré
  propertyType: PropertyType;
  propertyAddress?: string;

  // Besoin principal
  clientNeed: ClientNeed;
  clientNeedOther?: string;

  // Points évoqués en RDV (max 3)
  rdvPoints: [string, string, string];

  // Solution envisagée
  contractType: string;
  coverageLevel: CoverageLevel;
  selectedOptions: string[];

  // Risques MRH validés par le conseiller
  confirmedRiskIds: string[];

  // Décision
  clientDecision: ClientDecision;
  decisionNote?: string;
}

// ── Output types ──────────────────────────────────────────────────────────────

export interface AdvisoryRiskNote {
  riskId: string;
  label: string;
  vigilanceLevel: VigilanceLevel;
  ddaSentence: string;
}

export interface DDASection {
  id: string;
  title: string;
  content: string;
  isSignatureBlock?: boolean;
}

export interface AdvisoryOutput {
  emailSubject: string;
  sections: DDASection[];
  legalFooter: string;
}

export interface AdvisoryReport {
  id: string;
  generatedAt: string;
  propertyAddress: string;
  meetingDate: string;
  advisorName: string;
  advisorFirmName: string;
  advisorOrias?: string;
  clientName: string;
  clientEmail: string;
  riskNotes: AdvisoryRiskNote[];
  internal: AdvisoryOutput;
  client: AdvisoryOutput;
}

// ── AI DDA types (Conseilla) ──────────────────────────────────────────────────

export interface MistralDDAContent {
  synthese_client: string;
  analyse_besoin: {
    objectif: string;
    enjeux: string[];
    niveau_comprehension: string | null;
  };
  devoir_conseil: {
    besoin_exprime: string;
    solutions_evoquees: string[];
    adequation: string;
    limites: string | null;
  };
  points_de_vigilance: {
    risques: string[];
    incertitudes: string[];
    a_valider: string[];
  };
  recommandations: {
    actions: string[];
    ajustements: string | null;
    a_clarifier: string | null;
  };
  mail_client: {
    objet: string;
    corps: string;
  };
}

export interface AdvisoryResult {
  id: string;
  generatedAt: string;
  propertyAddress: string;
  meetingDate: string;
  advisorName: string;
  advisorFirmName: string;
  advisorOrias?: string;
  clientName: string;
  clientEmail: string;
  clientDecision: ClientDecision;
  contractType: string;
  source: "ai" | "deterministic";
  content: MistralDDAContent;
  legalFooter: string;
}
