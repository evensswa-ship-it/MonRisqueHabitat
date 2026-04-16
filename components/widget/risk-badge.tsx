import { getRiskTone } from "@/lib/risk-tone";
import type { RiskPriority } from "@/types/risk";

export function RiskBadge({ priority }: { priority: RiskPriority }) {
  const tone = getRiskTone(priority);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}
