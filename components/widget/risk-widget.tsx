"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { WidgetEmptyState } from "@/components/widget/widget-empty-state";
import { WidgetError } from "@/components/widget/widget-error";
import { WidgetForm } from "@/components/widget/widget-form";
import { WidgetLoading } from "@/components/widget/widget-loading";
import { WidgetResult } from "@/components/widget/widget-result";
import { getAddressSuggestions } from "@/services/address-search-service";
import { getRiskPreviewByAddress } from "@/services/risk-preview-service";
import type { AddressSearchState, AddressSuggestion } from "@/types/address";
import type { RiskResult } from "@/types/risk";
import type { WidgetViewState } from "@/types/widget";

const SEARCH_DEBOUNCE_MS = 250;

export function RiskWidget() {
  const [query, setQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchState, setSearchState] = useState<AddressSearchState>("idle");
  const [view, setView] = useState<WidgetViewState>("idle");
  const [result, setResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState("");

  const currentStep =
    view === "result" ? 3 : view === "loading" || selectedAddress ? 2 : 1;
  const steps = [
    { id: 1, label: "Adresse" },
    { id: 2, label: view === "loading" ? "En cours…" : "Analyse" },
    { id: 3, label: "Résultat" }
  ];

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (selectedAddress && trimmedQuery === selectedAddress.label) {
      setSuggestions([]);
      setSearchState("idle");
      return;
    }

    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setSearchState("idle");
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      setSearchState("loading");

      try {
        const nextSuggestions = await getAddressSuggestions(trimmedQuery);

        if (cancelled) {
          return;
        }

        setSuggestions(nextSuggestions);
        setSearchState(nextSuggestions.length > 0 ? "success" : "empty");
      } catch {
        if (cancelled) {
          return;
        }

        setSuggestions([]);
        setSearchState("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, selectedAddress]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAddress) {
      setView("error");
      setError("Veuillez choisir une adresse dans la liste pour afficher le diagnostic.");
      setResult(null);
      return;
    }

    setView("loading");
    setError("");

    try {
      const nextResult = await getRiskPreviewByAddress(selectedAddress);
      setResult(nextResult);
      setView("result");
    } catch (submissionError) {
      setResult(null);
      setView("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Une erreur est survenue pendant le chargement du diagnostic."
      );
    }
  }

  function handleReset() {
    setQuery("");
    setSelectedAddress(null);
    setSuggestions([]);
    setSearchState("idle");
    setResult(null);
    setError("");
    setView("idle");
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setSelectedAddress(null);
    setSuggestions([]);
    setError("");

    if (view !== "idle") {
      setView("idle");
    }
  }

  function handleSelectAddress(nextAddress: AddressSuggestion) {
    setSelectedAddress(nextAddress);
    setQuery(nextAddress.label);
    setSuggestions([]);
    setSearchState("idle");
    setError("");

    if (view !== "idle") {
      setView("idle");
    }
  }

  return (
    <section className="glass-panel rounded-[36px] p-6 md:p-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-7 md:p-10">
        <div className="flex justify-end">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
            Adresse en France
          </div>
        </div>

        {view !== "result" && (
          <div className="mt-7 flex flex-wrap gap-2.5">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`step-pill ${currentStep >= step.id ? "step-active" : "step-inactive"}`}
              >
                {step.label}
              </div>
            ))}
          </div>
        )}

        <WidgetForm
          isLoading={view === "loading"}
          query={query}
          selectedAddress={selectedAddress}
          suggestions={suggestions}
          searchState={searchState}
          onQueryChange={handleQueryChange}
          onSuggestionSelect={handleSelectAddress}
          onSubmit={handleSubmit}
        />

        <div className="mt-8">
          {view === "idle" && <WidgetEmptyState />}
          {view === "loading" && (
            <div className="reveal-up">
              <WidgetLoading />
            </div>
          )}
          {view === "result" && result && selectedAddress && (
            <WidgetResult
              selectedAddress={selectedAddress}
              result={result}
              onReset={handleReset}
            />
          )}
          {view === "error" && (
            <div className="reveal-up">
              <WidgetError message={error} onReset={handleReset} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
