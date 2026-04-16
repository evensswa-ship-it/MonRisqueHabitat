import { AlertCircle, RefreshCcw } from "@/components/widget/icons";

type WidgetErrorProps = {
  message: string;
  onReset: () => void;
};

export function WidgetError({ message, onReset }: WidgetErrorProps) {
  const isNoData = message.toLowerCase().includes("aucune donnée georisques");

  return (
    <div
      className={`rounded-[28px] border p-6 ${
        isNoData
          ? "border-slate-200 bg-white"
          : "border-rose-200 bg-rose-50/80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${
            isNoData ? "bg-slate-100 text-slate-500" : "bg-white text-rose-600"
          }`}
        >
          <AlertCircle />
        </div>
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.16em] ${
              isNoData ? "text-slate-500" : "text-rose-600"
            }`}
          >
            {isNoData ? "Information indisponible" : "Diagnostic indisponible"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            {isNoData
              ? "Aucune donnée Géorisques exploitable n'est disponible pour cette zone."
              : "Nous n'avons pas pu générer le diagnostic pour cette adresse."}
          </h3>
          {!isNoData && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{message}</p>
          )}
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {isNoData
              ? "Nous mettons régulièrement à jour nos sources. Vous pouvez analyser un autre bien ou revenir plus tard."
              : "Essayez une autre adresse ou réessayez dans quelques instants."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="cta-secondary cta-md mt-6 inline-flex items-center gap-2 border-rose-200"
      >
        <RefreshCcw />
        Essayer une autre adresse
      </button>
    </div>
  );
}
