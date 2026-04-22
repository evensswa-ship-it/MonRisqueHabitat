export type RiskPriority = "low" | "medium" | "high";
export type RiskLevel = RiskPriority;

export type RiskCategory = {
  id: string;
  label: string;
  priority: RiskPriority;
  decision: string;
  territoryContext?: string;
  summary: string;
  recommendation: string;
  watch: string;
};

export type RiskOverview = {
  level: RiskLevel;
  score: number;
  maxScore: number;
  label: string;
  decision: string;
  summary: string;
  takeaway: string;
  rationale: string;
};

export type AdvisorCta = {
  title: string;
  text: string;
  label: string;
};

export type FinalRecommendation = {
  title: string;
  summary: string;
  checklist: string[];
};

// ── V2 Scoring types ──────────────────────────────────────────────────────────

export type CatNatLevel = "none" | "old" | "moderate" | "significant";

export type CatNatSummary = {
  count: number;
  lastYear?: number;
  dominantPeril?: string;
  sentence: string;
};

export type CatNatFactor = {
  available: boolean;
  count?: number;
  lastYear?: number;
  dominantPeril?: string;
  level: CatNatLevel;
  modifier: number;
  label: string;
  sentence?: string;
};

export type ScoredFactor = {
  id: string;
  label: string;
  priority: RiskPriority;
  score: number;
  weight: number;
  explanation: string;
  actionHint: string;
};

export type Priority = {
  rank: number;
  action: string;
  context: string;
};

export type ScoringResult = {
  globalScore: number;
  globalLevel: RiskLevel;
  factors: ScoredFactor[];
  catnatFactor: CatNatFactor;
  summary: string;
  recommendation: string;
  priorities: Priority[];
};

// ── Root result ───────────────────────────────────────────────────────────────

export type RiskResult = {
  address: string;
  analyzedAt: string;
  overallRisk: RiskOverview;
  categories: RiskCategory[];
  finalRecommendation: FinalRecommendation;
  advisorCta: AdvisorCta;
  catnat?: CatNatSummary;
  scoring?: ScoringResult;
};

export type RiskTone = {
  badge: string;
  dot: string;
  label: string;
};
