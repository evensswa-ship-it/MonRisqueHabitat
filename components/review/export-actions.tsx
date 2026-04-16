"use client";

import { useState } from "react";

type ExportActionsProps = {
  csvUrl: string;
  json: string;
};

export function ExportActions({ csvUrl, json }: ExportActionsProps) {
  const [copyLabel, setCopyLabel] = useState("Copier les données");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyLabel("Données copiées");
      window.setTimeout(() => setCopyLabel("Copier les données"), 1800);
    } catch {
      setCopyLabel("Copie impossible");
      window.setTimeout(() => setCopyLabel("Copier les données"), 1800);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={csvUrl}
        className="rounded-full bg-[var(--brand-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand)]"
      >
        Exporter en CSV
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:text-slate-950"
      >
        {copyLabel}
      </button>
    </div>
  );
}
