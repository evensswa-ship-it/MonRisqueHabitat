"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { ArrowRight, Check, Download, RefreshCcw, Share2 } from "@/components/widget/icons";
import { GuidedRiskAssistant } from "@/components/widget/guided-risk-assistant";
import { LeadCaptureForm } from "@/components/widget/lead-capture-form";
import { RiskCard } from "@/components/widget/risk-card";
import { enableNearbyPartners, enableAdvicePanel } from "@/lib/feature-flags";
import { AdvicePanel } from "@/components/widget/advice-panel";
import { downloadRiskReport } from "@/services/risk-report-service";
import { getRiskTone } from "@/lib/risk-tone";
import type { AddressSuggestion } from "@/types/address";
import type { RiskLevel, RiskResult } from "@/types/risk";

type WidgetResultProps = {
  selectedAddress: AddressSuggestion;
  result: RiskResult;
  onReset: () => void;
};

type HeroTone = {
  bg: string;
  ring: string;
  label: string;
  decisionBadge: string;
  dot: string;
};

const heroTones: Record<RiskLevel, HeroTone> = {
  low: {
    bg: "bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_60%,#ffffff_100%)]",
    ring: "ring-emerald-100",
    label: "text-emerald-700",
    decisionBadge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500"
  },
  medium: {
    bg: "bg-[linear-gradient(135deg,#fffbeb_0%,#fef9c3_60%,#ffffff_100%)]",
    ring: "ring-amber-100",
    label: "text-amber-700",
    decisionBadge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500"
  },
  high: {
    bg: "bg-[linear-gradient(135deg,#fff1f2_0%,#fef2f2_60%,#ffffff_100%)]",
    ring: "ring-rose-100",
    label: "text-rose-700",
    decisionBadge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500"
  }
};

export function WidgetResult({ selectedAddress, result, onReset }: WidgetResultProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const tone = heroTones[result.overallRisk.level];
  const highCount = result.categories.filter((r) => r.priority === "high").length;
  const mediumCount = result.categories.filter((r) => r.priority === "medium").length;

  async function handleShare() {
    const shareData = {
      title: "Mon Risque Habitat",
      text: `Diagnostic risque pour ${result.address} — ${result.overallRisk.label} · ${result.overallRisk.decision}`,
      url: window.location.href,
    };
    if (typeof navigator.share === "function" && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // utilisateur a annulé
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        // clipboard non disponible
      }
    }
  }

  async function handleDownloadReport() {
    setIsDownloading(true);
    setDownloadError("");
    try {
      await downloadRiskReport(selectedAddress);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Le rapport PDF n'a pas pu être généré pour cette adresse."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-5 md:space-y-6">

      {/* ── BLOC 1 : HERO ──────────────────────────────────────────────── */}
      <div
        className={`reveal-up rounded-[24px] p-6 ring-1 md:p-8 ${tone.bg} ${tone.ring}`}
      >
        {/* Adresse + date */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">{result.address}</p>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-200/80 backdrop-blur">
            {new Date(result.analyzedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </span>
        </div>

        {/* Niveau de risque — dominant */}
        <div className="mt-7 flex items-center gap-4">
          <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${tone.dot}`} />
          <h3 className={`text-4xl font-semibold tracking-tight md:text-6xl ${tone.label}`}>
            {result.overallRisk.label}
          </h3>
        </div>

        {/* Badge décision */}
        <div className="mt-4">
          <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ${tone.decisionBadge}`}>
            {result.overallRisk.decision}
          </span>
        </div>

        {/* Phrase de synthèse */}
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
          {result.overallRisk.summary}
        </p>

        {/* CatNat */}
        {result.catnat && (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
            {result.catnat.sentence}
          </p>
        )}

        {/* CTAs */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="cta-primary cta-md inline-flex items-center gap-2 disabled:cursor-wait disabled:opacity-70"
          >
            <Download />
            {isDownloading ? "Préparation…" : "Télécharger le rapport"}
          </button>
          <a
            href="#diagnostic-email"
            className="cta-secondary cta-md"
          >
            Recevoir par email
          </a>
          <button
            type="button"
            onClick={handleShare}
            className="cta-secondary cta-md inline-flex items-center gap-2"
          >
            {shareCopied ? <Check /> : <Share2 />}
            {shareCopied ? "Lien copié !" : "Partager"}
          </button>
        </div>

        {/* Compteurs */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
            {result.categories.length} risque{result.categories.length > 1 ? "s" : ""} analysé{result.categories.length > 1 ? "s" : ""}
          </span>
          {highCount > 0 && (
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
              {highCount} élevé{highCount > 1 ? "s" : ""}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              {mediumCount} modéré{mediumCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {downloadError && (
          <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {downloadError}
          </div>
        )}
      </div>

      {/* ── SCAN RAPIDE ───────────────────────────────────────────────── */}
      <div
        className="panel-card reveal-up px-5 py-4"
        style={{ "--delay": "60ms" } as CSSProperties}
      >
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Vue d'ensemble
        </p>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
          {result.categories.map((risk, index) => {
            const scanTone = getRiskTone(risk.priority);
            const isLastOdd =
              index === result.categories.length - 1 &&
              result.categories.length % 2 !== 0;
            return (
              <div
                key={risk.id}
                className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 md:rounded-full md:py-2 ${scanTone.badge}${isLastOdd ? " col-span-2 md:col-auto" : ""}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${scanTone.dot}`} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 md:flex-none">
                  {risk.label}
                </span>
                <span className="shrink-0 text-xs font-bold">{scanTone.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COMPRENDRE CE RÉSULTAT ───────────────────────────────────── */}
      <GuidedRiskAssistant result={result} />

      {/* ── PRIORITÉS ─────────────────────────────────────────────────── */}
      <div
        className="panel-card reveal-up p-6 md:p-8"
        style={{ "--delay": "120ms" } as CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Priorités
        </p>
        <h4 className="mt-3 text-xl font-semibold text-slate-950">
          {result.finalRecommendation.title}
        </h4>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          {result.finalRecommendation.summary}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">
          {result.finalRecommendation.checklist.map((item, index) => {
            const priorityContext = result.scoring?.priorities[index]?.context;
            return (
              <div
                key={item}
                className="rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Action {index + 1}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item}</p>
                {priorityContext && (
                  <p className="mt-2 text-xs leading-5 text-slate-400">{priorityContext}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CONSEILLA ─────────────────────────────────────────────────── */}
      {enableAdvicePanel && <AdvicePanel result={result} />}

      {/* ── RISQUES DÉTAIL ────────────────────────────────────────────── */}
      <div className="reveal-up" style={{ "--delay": "200ms" } as CSSProperties}>
        <div className="mb-6 md:mb-7">
          <h4 className="text-2xl font-semibold text-slate-950">Points de vigilance</h4>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Voici les principaux risques identifiés pour ce bien. Ouvrez chaque carte pour l'explication et les actions utiles.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {result.categories.map((risk, index) => (
            <div
              key={risk.id}
              className="reveal-up"
              style={{ "--delay": `${220 + index * 60}ms` } as CSSProperties}
            >
              <RiskCard risk={risk} defaultOpen={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTEXTE + DÉCISION ───────────────────────────────────────── */}
      <div
        className="panel-card reveal-up p-6 md:p-8"
        style={{ "--delay": "300ms" } as CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Aide à la décision
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-5">
          <div className="rounded-[18px] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Analyse
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {result.overallRisk.takeaway}
            </p>
          </div>
          <div className="rounded-[18px] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Contexte
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {result.overallRisk.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* ── ADVISOR CTA ───────────────────────────────────────────────── */}
      <div
        className="reveal-up rounded-[24px] bg-[var(--brand-deep)] p-6 text-white md:p-8"
        style={{ "--delay": "360ms" } as CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
          Besoin d'aide ?
        </p>
        <h4 className="mt-3 text-xl font-semibold">{result.advisorCta.title}</h4>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
          {result.advisorCta.text}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="cta-secondary cta-md inline-flex items-center gap-2"
          >
            {result.advisorCta.label}
            <ArrowRight />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:text-white"
          >
            <RefreshCcw />
            Analyser un autre bien
          </button>
        </div>
      </div>

      {/* Partenaires à proximité (feature flag) */}
      {enableNearbyPartners && (
        <div
          className="reveal-up rounded-[24px] border border-dashed border-slate-200 bg-white p-6 md:p-7"
          style={{ "--delay": "400ms" } as CSSProperties}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Partenaires à proximité
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Fonctionnalité en préparation : afficher des partenaires et agences autour de l'adresse analysée.
          </p>
        </div>
      )}

      {/* Note */}
      <div
        className="reveal-up rounded-[20px] border border-slate-200 bg-slate-50/80 px-5 py-5"
        style={{ "--delay": "440ms" } as CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Note
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          Ce diagnostic est fourni à titre informatif, sur la base de données publiques officielles (Géorisques, BRGM, ERRIAL, GASPAR via data.gouv.fr). Il ne remplace pas un état des risques réglementaire ni l'avis d'un professionnel qualifié. Mon Risque Habitat ne vend pas d'assurance.
        </p>
      </div>

      {/* Lead capture form */}
      <div id="diagnostic-email">
        <LeadCaptureForm selectedAddress={selectedAddress} result={result} />
      </div>
    </div>
  );
}
