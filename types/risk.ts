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

export type RiskResult = {
  address: string;
  analyzedAt: string;
  overallRisk: RiskOverview;
  categories: RiskCategory[];
  finalRecommendation: FinalRecommendation;
  advisorCta: AdvisorCta;
};

export type RiskTone = {
  badge: string;
  dot: string;
  label: string;
};
