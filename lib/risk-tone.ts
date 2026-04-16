import type { RiskPriority, RiskTone } from "@/types/risk";

const riskTones: Record<RiskPriority, RiskTone> = {
  low: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    label: "Faible"
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
    label: "Modéré"
  },
  high: {
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    label: "Élevé"
  }
};

export function getRiskTone(priority: RiskPriority) {
  return riskTones[priority];
}
