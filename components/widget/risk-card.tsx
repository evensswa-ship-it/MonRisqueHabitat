import { ChevronRight } from "@/components/widget/icons";
import { RiskBadge } from "@/components/widget/risk-badge";
import type { RiskCategory } from "@/types/risk";

export function RiskCard({
  risk,
  defaultOpen = false
}: {
  risk: RiskCategory;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[26px] border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
        {/* Left: badge + title + decision */}
        <div className="flex min-w-0 items-start gap-4">
          <RiskBadge priority={risk.priority} />
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-slate-950">{risk.label}</h4>
            <p className="mt-0.5 text-sm text-slate-500">{risk.decision}</p>
          </div>
        </div>
        {/* Expand indicator */}
        <ChevronRight className="shrink-0 text-slate-300 transition-transform duration-200 group-open:rotate-90" />
      </summary>

      {/* Expanded content */}
      <div className="animate-fade-in grid gap-3 border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 md:px-6 md:pb-6">
        <div className="rounded-[18px] bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Ce que cela signifie
          </p>
          <p className="mt-2.5">{risk.summary}</p>
          {risk.territoryContext && (
            <p className="mt-3 rounded-[14px] border border-sky-100 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
              {risk.territoryContext}
            </p>
          )}
        </div>
        <div className="rounded-[18px] bg-white p-4 ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Ce que vous pouvez faire
          </p>
          <p className="mt-2.5 text-slate-700">{risk.recommendation}</p>
        </div>
        <div className="rounded-[18px] bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Ce qu'il faut surveiller
          </p>
          <p className="mt-2.5 text-slate-700">{risk.watch}</p>
        </div>
      </div>
    </details>
  );
}
