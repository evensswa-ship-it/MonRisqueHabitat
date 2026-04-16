const previewItems = [
  { label: "Niveau de risque global", sub: "Une lecture immédiate de l'exposition du bien" },
  { label: "Risques détaillés", sub: "Inondation, sol, environnement, proximité industrielle" },
  { label: "Conseils concrets", sub: "Ce qu'il faut surveiller et comment agir" }
];

export function WidgetEmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 md:p-8 reveal-up">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        Ce que vous obtenez
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">
        Un diagnostic clair, en quelques secondes.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Saisissez une adresse ci-dessus pour visualiser les principaux risques et recevoir des recommandations orientées vers l'action.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {previewItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white/90 p-4"
          >
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
