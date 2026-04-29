"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type WaitlistModalProps = {
  open: boolean;
  onClose: () => void;
};

const professions = [
  { value: "", label: "Sélectionner votre métier" },
  { value: "courtier", label: "Courtier en assurance" },
  { value: "agent-immo", label: "Agent immobilier" },
  { value: "notaire", label: "Notaire" },
  { value: "autre", label: "Autre" },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isValidEmail(email.trim())) {
      setStatus("error");
      setErrorMessage("Saisissez une adresse e-mail valide.");
      return;
    }

    if (!profession) {
      setStatus("error");
      setErrorMessage("Sélectionnez votre métier.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), profession, message: message.trim() }),
      });

      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        throw new Error(payload.message ?? "Une erreur est survenue.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rejoindre la waitlist Conseilla"
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-[opacity,visibility] duration-250 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--brand-ink)]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="glass-panel relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto p-6 md:p-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Assistant IA de conseil</span>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">
              Conseilla
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              La note de conseil générée à partir du diagnostic MRH.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Description */}
        <div className="panel-card mb-6 p-5 text-sm leading-7 text-slate-600 space-y-2">
          <p>
            Structurez votre <strong className="text-slate-900">discours client</strong> à partir
            des données de risque MRH : synthèse, points de vigilance, angle d'approche pour un logement, un local professionnel ou un espace mixte.
          </p>
          <p>
            Conseilla produit une note de travail que vous relisez et adaptez. Aucun document
            réglementaire, aucune recommandation contractuelle.
          </p>
          <p className="font-semibold text-[var(--brand)]">
            Disponible prochainement. Inscrivez-vous pour un accès prioritaire.
          </p>
        </div>

        {/* Form or success state */}
        {status === "success" ? (
          <div className="mb-6 rounded-[20px] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Inscription confirmée
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Merci ! Vous serez parmi les premiers à accéder à Conseilla.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email professionnel</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="prenom.nom@entreprise.fr"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Votre métier</span>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
              >
                {professions.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Message <span className="text-slate-400">(optionnel)</span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="Ce qui vous intéresserait dans cette fonctionnalité..."
              />
            </label>

            {errorMessage && (
              <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="cta-primary cta-lg w-full disabled:cursor-wait disabled:opacity-70"
            >
              {status === "submitting" ? "Inscription en cours..." : "S'inscrire pour un accès prioritaire"}
            </button>
          </form>
        )}

        {/* Static preview */}
        <div className="border-t border-slate-200/80 pt-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Aperçu de sortie générée
          </p>
          <div className="space-y-4 rounded-[20px] border border-slate-200 bg-[var(--background)] p-5 text-sm leading-7">
            <div>
              <p className="mb-1 font-semibold text-slate-900">Synthèse des risques</p>
              <p className="text-slate-600">
                L'adresse située au{" "}
                <span className="font-medium text-slate-800">[ADRESSE]</span> présente les
                risques suivants : <strong>inondation (niveau 3)</strong>,{" "}
                <strong>séisme (niveau 2)</strong>. Ces risques sont identifiés via les bases
                Géorisques et BRGM.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900">Points de vigilance</p>
              <p className="italic text-slate-400">
                [Points clés à expliquer à votre client : garanties et exclusions à surveiller]
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900">Angle de discours</p>
              <p className="italic text-slate-400">
                [Formulation d'introduction pour aborder les risques avec votre client]
              </p>
            </div>
            <p className="border-t border-slate-200 pt-3 text-xs text-slate-400">
              Aperçu illustratif. La note générée reste un support de travail à valider par le
              professionnel.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
