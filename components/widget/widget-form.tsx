import type { CSSProperties, FormEvent } from "react";
import { Search } from "@/components/widget/icons";
import type { AddressSearchState, AddressSuggestion } from "@/types/address";

type WidgetFormProps = {
  isLoading: boolean;
  query: string;
  selectedAddress: AddressSuggestion | null;
  suggestions: AddressSuggestion[];
  searchState: AddressSearchState;
  onQueryChange: (value: string) => void;
  onSuggestionSelect: (value: AddressSuggestion) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function SearchStatus({
  query,
  searchState
}: {
  query: string;
  searchState: AddressSearchState;
}) {
  if (query.trim().length < 3) {
    return (
      <p className="mt-3 text-sm text-slate-400">
        Continuez à saisir pour lancer la recherche…
      </p>
    );
  }

  if (searchState === "loading") {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <span className="loading-dot" />
        Recherche en cours…
      </p>
    );
  }

  if (searchState === "empty") {
    return (
      <p className="mt-3 text-sm text-slate-500">
        Aucune adresse trouvée. Essayez d'ajouter le numéro de rue ou la ville.
      </p>
    );
  }

  if (searchState === "error") {
    return (
      <p className="mt-3 text-sm text-slate-500">
        La recherche est momentanément indisponible. Réessayez dans quelques instants.
      </p>
    );
  }

  return null;
}

export function WidgetForm({
  isLoading,
  query,
  selectedAddress,
  suggestions,
  searchState,
  onQueryChange,
  onSuggestionSelect,
  onSubmit
}: WidgetFormProps) {
  const showSuggestions = searchState === "success" && suggestions.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      className="mt-7 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 md:p-6"
    >
      <label htmlFor="address" className="text-sm font-semibold text-slate-700">
        Adresse du bien à analyser
      </label>
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-4 text-slate-400" />
          <input
            id="address"
            name="address"
            value={query}
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Numéro, rue, ville…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
          />

          {showSuggestions && (
            <div
              className="animate-fade-in mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              style={{ "--delay": "0ms" } as CSSProperties}
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{suggestion.line1}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {suggestion.postcode} {suggestion.city}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    France
                  </span>
                </button>
              ))}
            </div>
          )}

          <SearchStatus query={query} searchState={searchState} />
        </div>

        <button
          type="submit"
          disabled={isLoading || !selectedAddress}
          className="cta-primary cta-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Analyse en cours…" : "Voir le diagnostic"}
        </button>
      </div>

      {selectedAddress && (
        <div className="animate-fade-in mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Adresse confirmée
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{selectedAddress.line1}</p>
          <p className="mt-1 text-sm text-slate-600">
            {selectedAddress.postcode} {selectedAddress.city}
          </p>
        </div>
      )}
    </form>
  );
}
