import type { CSSProperties } from "react";

const loadingSteps = [
  "Localisation du bien…",
  "Identification des risques…",
  "Préparation de votre diagnostic…"
];

export function WidgetLoading() {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-semibold text-slate-700">Analyse en cours</p>
        <div className="mt-4 space-y-3 text-sm text-slate-500">
          {loadingSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <span
                className={`loading-dot shrink-0 ${index === 1 ? "loading-dot-delay" : index === 2 ? "loading-dot-delay-2" : ""}`}
              />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="loading-bar h-full w-2/5 rounded-full bg-[var(--brand)]" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-slate-200 bg-white p-6"
            style={{ animationDelay: `${index * 80}ms` } as CSSProperties}
          >
            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 h-5 w-2/5 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="mt-5 h-16 animate-pulse rounded-[18px] bg-slate-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
