"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import type { RiskResult } from "@/types/risk";
import type { AdviceContent, ClientContext, RiskAdvice } from "@/lib/ai/mistral";

type AdvicePanelProps = {
  result: RiskResult;
};

type Phase = "idle" | "loading" | "error";

type EditState = {
  synthese: string;
  vigilance: string;
  discours: string;
};

const CLIENT_TYPE_OPTIONS = [
  { value: "", label: "Non précisé" },
  { value: "particulier", label: "Particulier" },
  { value: "professionnel", label: "Professionnel" },
];

const USAGE_OPTIONS = [
  { value: "", label: "Non précisé" },
  { value: "résidence principale", label: "Résidence principale" },
  { value: "investissement locatif", label: "Investissement locatif" },
  { value: "résidence secondaire", label: "Résidence secondaire" },
];

function formatForCopy(a: AdviceContent): string {
  const lines = [
    "NOTE DE CONSEIL — Support de travail à valider",
    "",
    "SYNTHÈSE RISQUE",
    a.synthese_risque,
    "",
  ];
  if (a.points_de_vigilance.length > 0) {
    lines.push("POINTS DE VIGILANCE");
    a.points_de_vigilance.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  if (a.angle_de_discours) {
    lines.push("ANGLE DE DISCOURS");
    lines.push(a.angle_de_discours);
    lines.push("");
  }
  lines.push("---");
  lines.push(
    "Support généré par Mon Risque Habitat · Conseilla. À relire et adapter avant tout usage."
  );
  return lines.join("\n");
}

// ── Icônes & badges ───────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M2 4.5L6.5 9L11 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M6.5 1L7.7 5.3L12 6.5L7.7 7.7L6.5 12L5.3 7.7L1 6.5L5.3 5.3L6.5 1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IaBadge() {
  return (
    <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">
      IA
    </span>
  );
}

// ── Aperçu statique — structure identique à la vraie sortie ──────────────────

function StaticPreview() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-blue-100 bg-white/80 p-5">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/90 to-transparent" />
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Exemple de note générée
      </p>
      <div className="pointer-events-none select-none space-y-4 opacity-55">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Synthèse risque
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Ce bien présente un risque inondation élevé, confirmé par l'historique CatNat de la
            commune. Le risque mouvement de terrain est identifié comme modéré.
          </p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Points de vigilance
          </p>
          <ul className="space-y-1.5">
            {[
              "Vérifier l'existence d'un PPRI et ses implications pratiques",
              "Examiner les franchises liées aux événements climatiques",
              "Confirmer l'absence de zone inconstructible",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Angle de discours
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Ce bien a fait l'objet d'une analyse complète des risques naturels. Il convient
            d'aborder clairement la question de l'exposition avant toute décision.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Header commun (idle / loading / error) ────────────────────────────────────

function ConseillaBrandHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="eyebrow">Assistant de conseil</span>
      <IaBadge />
    </div>
  );
}

// ── Classe du card de découverte (gradient bleu brand) ────────────────────────

const BRAND_CARD =
  "reveal-up rounded-[24px] bg-[linear-gradient(135deg,#eff6ff_0%,#dbeafe_45%,#f8faff_100%)] p-6 ring-1 ring-blue-200 md:p-8";

// ── Input classes ─────────────────────────────────────────────────────────────

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100";

// ── Composant principal ───────────────────────────────────────────────────────

export function AdvicePanel({ result }: AdvicePanelProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [advice, setAdvice] = useState<AdviceContent | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [validated, setValidated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [clientContext, setClientContext] = useState<ClientContext>({
    type_client: "",
    usage: "",
    produit_envisage: "",
  });
  const [editState, setEditState] = useState<EditState>({
    synthese: "",
    vigilance: "",
    discours: "",
  });

  async function generate(ctx: ClientContext = clientContext) {
    setPhase("loading");
    setAdvice(null);
    setValidated(false);
    setIsEditing(false);
    setWarnings([]);

    try {
      const res = await fetch("/api/generate-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskResult: result,
          clientContext: {
            type_client: ctx.type_client || undefined,
            usage: ctx.usage || undefined,
            produit_envisage: ctx.produit_envisage || undefined,
          },
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? "Erreur lors de la génération.");
      }

      const data = (await res.json()) as RiskAdvice;
      setAdvice(data.content);
      setWarnings(data.warnings);
      setEditState({
        synthese: data.content.synthese_risque,
        vigilance: data.content.points_de_vigilance.join("\n"),
        discours: data.content.angle_de_discours,
      });
      setPhase("idle");
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  function saveEdits() {
    if (!advice) return;
    setAdvice({
      synthese_risque: editState.synthese,
      points_de_vigilance: editState.vigilance
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      angle_de_discours: editState.discours,
    });
    setIsEditing(false);
    setValidated(false);
  }

  function reset() {
    setAdvice(null);
    setPhase("idle");
    setValidated(false);
    setIsEditing(false);
    setWarnings([]);
  }

  async function copyToClipboard() {
    if (!advice) return;
    try {
      await navigator.clipboard.writeText(formatForCopy(advice));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard non disponible
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className={BRAND_CARD} style={{ "--delay": "160ms" } as CSSProperties}>
        <ConseillaBrandHeader />
        <h4 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)] md:text-4xl">
          Conseilla
        </h4>
        <div className="mt-6 flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <p className="text-sm text-slate-600">Analyse en cours…</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className={BRAND_CARD} style={{ "--delay": "160ms" } as CSSProperties}>
        <ConseillaBrandHeader />
        <h4 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)] md:text-4xl">
          Conseilla
        </h4>
        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="cta-secondary cta-md mt-4"
        >
          Retour
        </button>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────────
  if (advice) {
    return (
      <div
        className="panel-card reveal-up p-6 md:p-8"
        style={{ "--delay": "160ms" } as CSSProperties}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="eyebrow">Conseilla</span>
              <IaBadge />
            </div>
            <h4 className="mt-2 text-xl font-semibold text-slate-950">Synthèse générée</h4>
          </div>
          {validated && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Validé
            </span>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {warnings[0]}
          </div>
        )}

        {isEditing ? (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Synthèse risque
              </label>
              <textarea
                value={editState.synthese}
                onChange={(e) => setEditState((s) => ({ ...s, synthese: e.target.value }))}
                rows={4}
                className={`${INPUT_CLASS} min-h-[96px] leading-7`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Points de vigilance{" "}
                <span className="font-normal normal-case text-slate-400">(un par ligne)</span>
              </label>
              <textarea
                value={editState.vigilance}
                onChange={(e) => setEditState((s) => ({ ...s, vigilance: e.target.value }))}
                rows={4}
                className={`${INPUT_CLASS} min-h-[96px] leading-7`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Angle de discours
              </label>
              <textarea
                value={editState.discours}
                onChange={(e) => setEditState((s) => ({ ...s, discours: e.target.value }))}
                rows={3}
                className={`${INPUT_CLASS} min-h-[72px] leading-7`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={saveEdits} className="cta-primary cta-md">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cta-secondary cta-md"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-[18px] bg-slate-50 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Synthèse risque
              </p>
              <p className="text-sm leading-7 text-slate-700">{advice.synthese_risque}</p>
            </div>

            {advice.points_de_vigilance.length > 0 && (
              <div className="rounded-[18px] bg-slate-50 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Points de vigilance
                </p>
                <ul className="space-y-2">
                  {advice.points_de_vigilance.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {advice.angle_de_discours && (
              <div className="rounded-[18px] bg-slate-50 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Angle de discours
                </p>
                <p className="text-sm leading-7 text-slate-700">{advice.angle_de_discours}</p>
              </div>
            )}

            <p className="text-xs leading-5 text-slate-400">
              Ce contenu est généré à partir des données disponibles et doit être vérifié avant
              utilisation. Il ne constitue pas une recommandation contractuelle ni un document
              réglementaire.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {!validated ? (
                <button
                  type="button"
                  onClick={() => setValidated(true)}
                  className="cta-primary cta-md"
                >
                  Valider
                </button>
              ) : (
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="cta-primary cta-md"
                >
                  {copied ? "Copié !" : "Copier"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setValidated(false);
                }}
                className="cta-secondary cta-md"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                Effacer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Idle — carte de découverte Conseilla ─────────────────────────────────────
  return (
    <div className={BRAND_CARD} style={{ "--delay": "160ms" } as CSSProperties}>

      {/* Header */}
      <ConseillaBrandHeader />

      {/* Nom produit */}
      <h4 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)] md:text-4xl">
        Conseilla
      </h4>
      <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600">
        Structurez votre discours client à partir de cette analyse. La note est un support de
        travail — à relire avant tout usage.
      </p>

      {/* Aperçu — mobile uniquement (colonne unique) */}
      <div className="mt-5 md:hidden">
        <StaticPreview />
      </div>

      {/* Layout desktop : contenu gauche + aperçu droit */}
      <div className="mt-4 md:mt-6 md:grid md:grid-cols-5 md:items-start md:gap-8">

        {/* Colonne gauche — formulaire + CTA */}
        <div className="md:col-span-3">
          {/* Contexte client — accordion */}
          <button
            type="button"
            onClick={() => setIsContextExpanded((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[var(--brand)]"
            aria-expanded={isContextExpanded}
          >
            <span
              className={`transition-transform duration-200 ${isContextExpanded ? "rotate-180" : ""}`}
            >
              <ChevronDown />
            </span>
            {isContextExpanded
              ? "Masquer le contexte client"
              : "Ajouter un contexte client (optionnel)"}
          </button>

          {isContextExpanded && (
            <div className="mt-4 space-y-4 rounded-[20px] border border-blue-100 bg-white/70 p-5">
              <p className="text-xs text-slate-400">
                Ces données affinent la note. Elles ne sont ni stockées ni transmises à des tiers.
              </p>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Type de client</span>
                <select
                  value={clientContext.type_client}
                  onChange={(e) =>
                    setClientContext((c) => ({ ...c, type_client: e.target.value }))
                  }
                  className={INPUT_CLASS}
                >
                  {CLIENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Usage du bien</span>
                <select
                  value={clientContext.usage}
                  onChange={(e) => setClientContext((c) => ({ ...c, usage: e.target.value }))}
                  className={INPUT_CLASS}
                >
                  {USAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Produit envisagé{" "}
                  <span className="font-normal text-slate-400">(optionnel)</span>
                </span>
                <input
                  type="text"
                  value={clientContext.produit_envisage}
                  onChange={(e) =>
                    setClientContext((c) => ({ ...c, produit_envisage: e.target.value }))
                  }
                  placeholder="MRH standard, garanties renforcées inondation…"
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={() => generate()}
            className="cta-primary cta-md mt-5 inline-flex items-center gap-2"
          >
            <SparkleIcon />
            Générer une synthèse conseil
          </button>
        </div>

        {/* Colonne droite — aperçu (desktop uniquement) */}
        <div className="hidden md:col-span-2 md:block">
          <StaticPreview />
        </div>
      </div>
    </div>
  );
}
