"use client";

import { useState } from "react";
import type { RiskResult, RiskCategory } from "@/types/risk";
import type {
  AdvisoryResult,
  BrokerInput,
  ClientDecision,
  ClientNeed,
  ClientType,
  CoverageLevel,
  MeetingType,
  PropertyStatus,
  PropertyType,
  ResidenceType,
} from "@/types/advisory-report";
import {
  CLIENT_NEED_LABELS,
  CONTRACT_OPTIONS,
  COVERAGE_LEVEL_LABELS,
  COVERAGE_OPTIONS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  RESIDENCE_TYPE_LABELS,
} from "@/types/advisory-report";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "form" | "loading" | "result" | "error";

type FormState = {
  advisorName: string;
  advisorFirmName: string;
  advisorOrias: string;
  meetingType: MeetingType;
  meetingDate: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientType: ClientType;
  propertyStatus: PropertyStatus | "";
  residenceType: ResidenceType | "";
  householdComposition: string;
  activityType: string;
  hasEquipmentOrStock: boolean | null;
  receivesPublic: boolean | null;
  propertyType: PropertyType;
  clientNeed: ClientNeed | "";
  clientNeedOther: string;
  rdvPoint0: string;
  rdvPoint1: string;
  rdvPoint2: string;
  contractType: string;
  coverageLevel: CoverageLevel;
  selectedOptions: string[];
  confirmedRiskIds: string[];
  clientDecision: ClientDecision;
  decisionNote: string;
  showFullProfile: boolean;
  showRdvPoints: boolean;
};

// ── Icônes ────────────────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 4.5H8.5M4.5 6.5H8.5M4.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8.5H2C1.45 8.5 1 8.05 1 7.5V2C1 1.45 1.45 1 2 1H7.5C8.05 1 8.5 1.45 8.5 2V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 7L5 10L11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const INPUT = "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100";
const LABEL = "block text-sm font-semibold text-slate-700";
const SECTION_LABEL = "text-xs font-semibold uppercase tracking-[0.16em] text-slate-400";
const BRAND_CARD = "reveal-up rounded-[24px] bg-[linear-gradient(135deg,#eff6ff_0%,#dbeafe_45%,#f8faff_100%)] p-6 ring-1 ring-blue-200 md:p-8";
const CHIP_BASE = "cursor-pointer rounded-2xl border px-4 py-2.5 text-sm transition select-none";
const CHIP_ON = "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-ink)] font-medium";
const CHIP_OFF = "border-slate-200 bg-white text-slate-600 hover:border-slate-300";

// ── Document helpers ──────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return isoDate; }
}

const DECISION_STYLE: Record<ClientDecision, { badge: string; label: string }> = {
  accepted: { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "Accepté" },
  pending:  { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   label: "En réflexion" },
  declined: { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",     label: "Refusé" },
};

function serializeDocument(r: AdvisoryResult): string {
  const c = r.content;
  const lines: string[] = [
    "DEVOIR DE CONSEIL — DOCUMENT DE TRAÇABILITÉ",
    `${r.advisorFirmName}${r.advisorOrias ? ` · ORIAS ${r.advisorOrias}` : ""}`,
    `Conseiller : ${r.advisorName}  |  Client : ${r.clientName}`,
    `Date RDV : ${formatDate(r.meetingDate)}  |  Bien : ${r.propertyAddress}`,
    `Contrat envisagé : ${r.contractType}`,
    "",
    "── 1. SYNTHÈSE CLIENT ──────────────────────────────────",
    c.synthese_client,
    "",
    "── 2. ANALYSE DU BESOIN ────────────────────────────────",
    `Objectif : ${c.analyse_besoin.objectif}`,
    c.analyse_besoin.enjeux.length > 0 ? `\nEnjeux :\n${c.analyse_besoin.enjeux.map(e => `· ${e}`).join("\n")}` : "",
    c.analyse_besoin.niveau_comprehension ? `\nNiveau de compréhension : ${c.analyse_besoin.niveau_comprehension}` : "",
    "",
    "── 3. DEVOIR DE CONSEIL (DDA) ──────────────────────────",
    `Besoin exprimé : ${c.devoir_conseil.besoin_exprime}`,
    c.devoir_conseil.solutions_evoquees.length > 0
      ? `\nSolutions évoquées :\n${c.devoir_conseil.solutions_evoquees.map(s => `· ${s}`).join("\n")}`
      : "",
    `\nAdéquation : ${c.devoir_conseil.adequation}`,
    c.devoir_conseil.limites ? `\nLimites / à compléter : ${c.devoir_conseil.limites}` : "",
    "",
    "── 4. POINTS DE VIGILANCE ──────────────────────────────",
    c.points_de_vigilance.risques.length > 0
      ? `Risques :\n${c.points_de_vigilance.risques.map(x => `· ${x}`).join("\n")}`
      : "",
    c.points_de_vigilance.incertitudes.length > 0
      ? `\nIncertitudes :\n${c.points_de_vigilance.incertitudes.map(x => `· ${x}`).join("\n")}`
      : "",
    c.points_de_vigilance.a_valider.length > 0
      ? `\nÀ valider :\n${c.points_de_vigilance.a_valider.map(x => `· ${x}`).join("\n")}`
      : "",
    "",
    "── 5. RECOMMANDATIONS ──────────────────────────────────",
    c.recommandations.actions.length > 0
      ? `Actions :\n${c.recommandations.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
      : "",
    c.recommandations.ajustements ? `\nAjustements : ${c.recommandations.ajustements}` : "",
    c.recommandations.a_clarifier ? `\nÀ clarifier : ${c.recommandations.a_clarifier}` : "",
    "",
    "───────────────────────────────────────────────────────",
    r.legalFooter,
  ];
  return lines.filter((l) => l !== "").join("\n");
}

function serializeEmail(r: AdvisoryResult): string {
  return `Objet : ${r.content.mail_client.objet}\n\n${r.content.mail_client.corps}`;
}

// ── Document sub-components ───────────────────────────────────────────────────

function DocSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
          {number}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SubBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
          <span className="mt-0.5 w-4 shrink-0 text-xs font-bold text-slate-400">{i + 1}.</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

// ── DocumentResult ────────────────────────────────────────────────────────────

function DocumentResult({ result, onReset }: { result: AdvisoryResult; onReset: () => void }) {
  const [copied, setCopied] = useState<"doc" | "mail" | null>(null);
  const c = result.content;
  const dateStr = formatDate(result.meetingDate);
  const generatedStr = formatDate(result.generatedAt);
  const decisionInfo = DECISION_STYLE[result.clientDecision];

  async function copyDoc() {
    try {
      await navigator.clipboard.writeText(serializeDocument(result));
      setCopied("doc");
      setTimeout(() => setCopied(null), 2500);
    } catch { /* no-op */ }
  }

  async function copyMail() {
    try {
      await navigator.clipboard.writeText(serializeEmail(result));
      setCopied("mail");
      setTimeout(() => setCopied(null), 2500);
    } catch { /* no-op */ }
  }

  return (
    <div className="panel-card p-6 md:p-8">

      {/* ── En-tête document ── */}
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Devoir de conseil — Traçabilité
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Généré le {generatedStr} · Mon Risque Habitat
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.source === "ai" && (
              <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">
                IA Conseilla
              </span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${decisionInfo.badge}`}>
              {decisionInfo.label}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
          {[
            { label: "Client",     value: result.clientName },
            { label: "Conseiller", value: result.advisorName },
            { label: "Cabinet",    value: `${result.advisorFirmName}${result.advisorOrias ? ` · ORIAS ${result.advisorOrias}` : ""}` },
            { label: "Date RDV",   value: dateStr },
            { label: "Bien",       value: result.propertyAddress },
            { label: "Contrat",    value: result.contractType },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-xs text-slate-400">{label} </span>
              <span className="text-sm font-medium text-slate-700">{value || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sections 1–5 ── */}
      <div className="mt-4 space-y-3">

        <DocSection number={1} title="Synthèse client">
          <p className="text-sm leading-7 text-slate-700">{c.synthese_client}</p>
        </DocSection>

        <DocSection number={2} title="Analyse du besoin">
          <SubBlock label="Objectif">
            <p className="text-sm leading-7 text-slate-700">{c.analyse_besoin.objectif}</p>
          </SubBlock>
          {c.analyse_besoin.enjeux.length > 0 && (
            <SubBlock label="Enjeux identifiés">
              <BulletList items={c.analyse_besoin.enjeux} />
            </SubBlock>
          )}
          {c.analyse_besoin.niveau_comprehension && (
            <SubBlock label="Niveau de compréhension">
              <p className="text-sm leading-7 text-slate-700">{c.analyse_besoin.niveau_comprehension}</p>
            </SubBlock>
          )}
        </DocSection>

        <DocSection number={3} title="Devoir de conseil (DDA)">
          <SubBlock label="Besoin exprimé">
            <p className="text-sm leading-7 text-slate-700">{c.devoir_conseil.besoin_exprime}</p>
          </SubBlock>
          {c.devoir_conseil.solutions_evoquees.length > 0 && (
            <SubBlock label="Solutions évoquées">
              <BulletList items={c.devoir_conseil.solutions_evoquees} />
            </SubBlock>
          )}
          <SubBlock label="Adéquation besoin / solution">
            <p className="text-sm leading-7 text-slate-700">{c.devoir_conseil.adequation}</p>
          </SubBlock>
          {c.devoir_conseil.limites && (
            <SubBlock label="Limites / éléments à compléter">
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm leading-7 text-amber-700">
                {c.devoir_conseil.limites}
              </p>
            </SubBlock>
          )}
        </DocSection>

        <DocSection number={4} title="Points de vigilance">
          {c.points_de_vigilance.risques.length > 0 && (
            <SubBlock label="Risques identifiés">
              <BulletList items={c.points_de_vigilance.risques} />
            </SubBlock>
          )}
          {c.points_de_vigilance.incertitudes.length > 0 && (
            <SubBlock label="Zones d'incertitude">
              <BulletList items={c.points_de_vigilance.incertitudes} />
            </SubBlock>
          )}
          {c.points_de_vigilance.a_valider.length > 0 && (
            <SubBlock label="À valider avant souscription">
              <BulletList items={c.points_de_vigilance.a_valider} />
            </SubBlock>
          )}
        </DocSection>

        <DocSection number={5} title="Recommandations">
          {c.recommandations.actions.length > 0 && (
            <SubBlock label="Actions">
              <NumberedList items={c.recommandations.actions} />
            </SubBlock>
          )}
          {c.recommandations.ajustements && (
            <SubBlock label="Ajustements possibles">
              <p className="text-sm leading-7 text-slate-700">{c.recommandations.ajustements}</p>
            </SubBlock>
          )}
          {c.recommandations.a_clarifier && (
            <SubBlock label="À clarifier avec le client">
              <p className="text-sm leading-7 text-slate-700">{c.recommandations.a_clarifier}</p>
            </SubBlock>
          )}
        </DocSection>
      </div>

      {/* ── Mail client ── */}
      <div className="mt-4 rounded-[20px] border border-blue-200 bg-blue-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Mail client — prêt à envoyer
          </p>
          <button
            type="button"
            onClick={copyMail}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-[var(--brand)] transition hover:border-[var(--brand)]"
          >
            {copied === "mail" ? <CheckIcon size={10} /> : <CopyIcon />}
            {copied === "mail" ? "Copié !" : "Copier le mail"}
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <div className="rounded-[14px] border border-blue-100 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Objet</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{c.mail_client.objet}</p>
          </div>
          <div className="rounded-[14px] bg-white px-5 py-4">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{c.mail_client.corps}</p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
        {result.legalFooter}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyDoc}
          className="cta-primary cta-md inline-flex items-center gap-2"
        >
          {copied === "doc" ? <CheckIcon /> : <CopyIcon />}
          {copied === "doc" ? "Copié !" : "Copier le document"}
        </button>
        <button type="button" onClick={onReset} className="cta-secondary cta-md">
          Nouveau compte rendu
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Ce document est généré à partir des informations saisies par le conseiller. À relire avant archivage ou envoi. Ne constitue pas un document réglementaire final.
      </p>
    </div>
  );
}

// ── Idle card ─────────────────────────────────────────────────────────────────

function IdleCard({ onStart }: { onStart: () => void }) {
  return (
    <div className={BRAND_CARD}>
      <div className="flex items-center gap-2.5">
        <span className="eyebrow">Devoir de conseil</span>
        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">
          DDA
        </span>
      </div>
      <h4 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)] md:text-4xl">
        Compte rendu post-RDV
      </h4>
      <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600">
        Structurez votre devoir de conseil en quelques secondes. L'analyse risque devient la base de votre DDA — document interne archivable et mail client prêt à envoyer.
      </p>
      <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
        {["Document DDA défendable", "Mail client prêt à envoyer", "Trace archivable 5 ans"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-white/70 px-4 py-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
            {item}
          </div>
        ))}
      </div>
      <button type="button" onClick={onStart} className="cta-primary cta-md mt-6 inline-flex items-center gap-2">
        <FileIcon />
        Générer le compte rendu
      </button>
      <p className="mt-3 text-xs text-slate-400">
        Exclusivement pour courtiers en assurance et agents généraux.
      </p>
    </div>
  );
}

// ── Risk suggestion row ───────────────────────────────────────────────────────

function RiskSuggestion({ cat, confirmed, onToggle }: { cat: RiskCategory; confirmed: boolean; onToggle: () => void }) {
  const priorityLabel = cat.priority === "high" ? "Élevé" : cat.priority === "medium" ? "Modéré" : "Faible";
  const priorityColor =
    cat.priority === "high"
      ? "text-rose-700 bg-rose-50"
      : cat.priority === "medium"
        ? "text-amber-700 bg-amber-50"
        : "text-emerald-700 bg-emerald-50";

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${priorityColor}`}>
          {priorityLabel}
        </span>
        <div>
          <p className="text-sm font-medium text-slate-800">{cat.label}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {confirmed ? "Inclus dans le compte rendu DDA" : "Ajouter comme point de vigilance ?"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
          confirmed
            ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
            : "border-slate-200 bg-white text-slate-500 hover:border-[var(--brand)] hover:text-[var(--brand)]"
        }`}
      >
        {confirmed ? "Inclus" : "Inclure"}
      </button>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

function AdvisoryForm({
  form,
  result,
  onChange,
  onToggleOption,
  onToggleRisk,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  result: RiskResult;
  onChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onToggleOption: (opt: string) => void;
  onToggleRisk: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const suggestedRisks = result.categories.filter(
    (c) => c.priority === "high" || c.priority === "medium"
  );

  const isQuickValid =
    form.clientFirstName.trim() &&
    form.clientLastName.trim() &&
    form.clientNeed &&
    form.contractType.trim() &&
    form.clientDecision;

  return (
    <div className="panel-card p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Compte rendu DDA</span>
          <h4 className="mt-2 text-xl font-semibold text-slate-950">Informations du rendez-vous</h4>
        </div>
        <button type="button" onClick={onCancel} className="text-sm text-slate-400 transition hover:text-slate-700">
          Annuler
        </button>
      </div>

      <div className="mt-7 space-y-7">

        {/* ── CONSEILLER ─────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Conseiller</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Nom <span className="font-normal text-rose-400">*</span></span>
              <input id="advisory-advisor-name" name="advisorName" type="text" value={form.advisorName} onChange={(e) => onChange("advisorName", e.target.value)} placeholder="Prénom Nom" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>Cabinet <span className="font-normal text-rose-400">*</span></span>
              <input id="advisory-advisor-firm-name" name="advisorFirmName" type="text" value={form.advisorFirmName} onChange={(e) => onChange("advisorFirmName", e.target.value)} placeholder="Cabinet Dupont Assurances" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>N° ORIAS <span className="font-normal text-slate-400">(optionnel)</span></span>
              <input id="advisory-advisor-orias" name="advisorOrias" type="text" value={form.advisorOrias} onChange={(e) => onChange("advisorOrias", e.target.value)} placeholder="0000 0000" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>Date du RDV <span className="font-normal text-rose-400">*</span></span>
              <input id="advisory-meeting-date" name="meetingDate" type="date" value={form.meetingDate} onChange={(e) => onChange("meetingDate", e.target.value)} className={INPUT} />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "discovery",  label: "Découverte" },
                { value: "renewal",    label: "Renouvellement" },
                { value: "amendment",  label: "Avenant" },
                { value: "expertise",  label: "Expertise / sinistre" },
              ] as { value: MeetingType; label: string }[]
            ).map(({ value, label }) => (
              <button key={value} type="button" onClick={() => onChange("meetingType", value)}
                className={`${CHIP_BASE} text-left ${form.meetingType === value ? CHIP_ON : CHIP_OFF}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CLIENT ──────────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Client</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Prénom <span className="font-normal text-rose-400">*</span></span>
              <input id="advisory-client-first-name" name="clientFirstName" type="text" value={form.clientFirstName} onChange={(e) => onChange("clientFirstName", e.target.value)} placeholder="Marie" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>Nom <span className="font-normal text-rose-400">*</span></span>
              <input id="advisory-client-last-name" name="clientLastName" type="text" value={form.clientLastName} onChange={(e) => onChange("clientLastName", e.target.value)} placeholder="Dupont" className={INPUT} />
            </label>
            <label className="block sm:col-span-2">
              <span className={LABEL}>Email <span className="font-normal text-slate-400">(pour le mail récapitulatif)</span></span>
              <input id="advisory-client-email" name="clientEmail" type="email" value={form.clientEmail} onChange={(e) => onChange("clientEmail", e.target.value)} placeholder="marie.dupont@exemple.fr" className={INPUT} />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            {(
              [
                { value: "particulier",    label: "Particulier" },
                { value: "professionnel",  label: "Professionnel" },
              ] as { value: ClientType; label: string }[]
            ).map(({ value, label }) => (
              <button key={value} type="button" onClick={() => onChange("clientType", value)}
                className={`${CHIP_BASE} ${form.clientType === value ? CHIP_ON : CHIP_OFF}`}>
                {label}
              </button>
            ))}
          </div>

          <button type="button" onClick={() => onChange("showFullProfile", !form.showFullProfile)}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-[var(--brand)]">
            <ChevronIcon open={form.showFullProfile} />
            {form.showFullProfile ? "Masquer le profil détaillé" : "Compléter le profil client"}
          </button>

          {form.showFullProfile && (
            <div className="mt-3 space-y-5 rounded-[20px] border border-slate-100 bg-slate-50/60 p-5">
              {form.clientType === "particulier" ? (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-500">Statut</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(PROPERTY_STATUS_LABELS) as [PropertyStatus, string][]).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => onChange("propertyStatus", value)}
                          className={`${CHIP_BASE} ${form.propertyStatus === value ? CHIP_ON : CHIP_OFF}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-500">Type de résidence</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(RESIDENCE_TYPE_LABELS) as [ResidenceType, string][]).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => onChange("residenceType", value)}
                          className={`${CHIP_BASE} ${form.residenceType === value ? CHIP_ON : CHIP_OFF}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Composition du foyer <span className="font-normal">(optionnel)</span></span>
                    <input id="advisory-household-composition" name="householdComposition" type="text" value={form.householdComposition} onChange={(e) => onChange("householdComposition", e.target.value)} placeholder="Ex : 2 adultes, 1 enfant" className={INPUT} />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-500">Type d'activité</span>
                    <input id="advisory-activity-type" name="activityType" type="text" value={form.activityType} onChange={(e) => onChange("activityType", e.target.value)} placeholder="Ex : Artisan plombier, cabinet médical…" className={INPUT} />
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">Matériel / stock assuré</p>
                      <div className="flex gap-2">
                        {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map(({ v, l }) => (
                          <button key={l} type="button" onClick={() => onChange("hasEquipmentOrStock", v)}
                            className={`${CHIP_BASE} ${form.hasEquipmentOrStock === v ? CHIP_ON : CHIP_OFF}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">Accueil du public</p>
                      <div className="flex gap-2">
                        {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map(({ v, l }) => (
                          <button key={l} type="button" onClick={() => onChange("receivesPublic", v)}
                            className={`${CHIP_BASE} ${form.receivesPublic === v ? CHIP_ON : CHIP_OFF}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── BIEN ─────────────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Bien assuré</p>
          <p className="mt-0.5 text-xs text-slate-400">{result.address}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([value, label]) => (
              <button key={value} type="button" onClick={() => onChange("propertyType", value)}
                className={`${CHIP_BASE} ${form.propertyType === value ? CHIP_ON : CHIP_OFF}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── BESOIN ───────────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Besoin principal <span className="font-normal text-rose-400">*</span></p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(CLIENT_NEED_LABELS) as [ClientNeed, string][]).map(([value, label]) => (
              <button key={value} type="button" onClick={() => onChange("clientNeed", value)}
                className={`${CHIP_BASE} text-left ${form.clientNeed === value ? CHIP_ON : CHIP_OFF}`}>
                {label}
              </button>
            ))}
          </div>
          {form.clientNeed === "autre" && (
            <input id="advisory-client-need-other" name="clientNeedOther" type="text" value={form.clientNeedOther} onChange={(e) => onChange("clientNeedOther", e.target.value)} placeholder="Précisez le besoin…" className={`${INPUT} mt-3`} />
          )}
        </div>

        {/* ── POINTS RDV ───────────────────────────────────────────── */}
        <div>
          <button type="button" onClick={() => onChange("showRdvPoints", !form.showRdvPoints)}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-[var(--brand)]">
            <ChevronIcon open={form.showRdvPoints} />
            {form.showRdvPoints ? "Masquer les points RDV" : "Ajouter des points évoqués en entretien (optionnel)"}
          </button>
          {form.showRdvPoints && (
            <div className="mt-3 space-y-2.5">
              <p className="text-xs text-slate-400">Max 3 points courts — inquiétudes, contraintes, éléments spécifiques.</p>
              {(["rdvPoint0", "rdvPoint1", "rdvPoint2"] as const).map((field, i) => (
                <input key={field} id={`advisory-${field}`} name={field} type="text" value={form[field]} onChange={(e) => onChange(field, e.target.value)}
                  placeholder={i === 0 ? "Ex : Inquiétude sur la franchise inondation" : i === 1 ? "Ex : Contrat actuel à échéance dans 3 mois" : "Ex : Cave aménagée au rez-de-chaussée"}
                  className={INPUT} />
              ))}
            </div>
          )}
        </div>

        {/* ── SOLUTION ─────────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Solution envisagée</p>
          <div className="mt-3 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Type de contrat <span className="font-normal text-rose-400">*</span></p>
              <div className="flex flex-wrap gap-2">
                {CONTRACT_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => onChange("contractType", opt)}
                    className={`${CHIP_BASE} ${form.contractType === opt ? CHIP_ON : CHIP_OFF}`}>
                    {opt}
                  </button>
                ))}
              </div>
              <input id="advisory-contract-type-other" name="contractTypeOther" type="text"
                value={CONTRACT_OPTIONS.includes(form.contractType as (typeof CONTRACT_OPTIONS)[number]) ? "" : form.contractType}
                onChange={(e) => onChange("contractType", e.target.value)}
                placeholder="Autre contrat…" className={`${INPUT} mt-2`} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Niveau de couverture</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.entries(COVERAGE_LEVEL_LABELS) as [CoverageLevel, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => onChange("coverageLevel", value)}
                    className={`${CHIP_BASE} text-left ${form.coverageLevel === value ? CHIP_ON : CHIP_OFF}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Options et garanties complémentaires</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {COVERAGE_OPTIONS.map((opt) => {
                  const active = form.selectedOptions.includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => onToggleOption(opt)}
                      className={`flex items-center gap-2.5 ${CHIP_BASE} text-left ${active ? CHIP_ON : CHIP_OFF}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-white transition ${active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-slate-300"}`}>
                        {active && <CheckIcon size={10} />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RISQUES MRH ──────────────────────────────────────────── */}
        {suggestedRisks.length > 0 && (
          <div>
            <p className={SECTION_LABEL}>Risques détectés sur ce bien</p>
            <p className="mt-1 text-xs text-slate-400">Sélectionnez les risques à inclure comme points de vigilance dans le compte rendu DDA.</p>
            <div className="mt-3 space-y-2">
              {suggestedRisks.map((cat) => (
                <RiskSuggestion key={cat.id} cat={cat} confirmed={form.confirmedRiskIds.includes(cat.id)} onToggle={() => onToggleRisk(cat.id)} />
              ))}
            </div>
          </div>
        )}

        {/* ── DÉCISION ─────────────────────────────────────────────── */}
        <div>
          <p className={SECTION_LABEL}>Décision du client <span className="font-normal text-rose-400">*</span></p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(
              [
                { value: "accepted" as ClientDecision, label: "Accepté",    color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
                { value: "pending"  as ClientDecision, label: "Réflexion",  color: "border-amber-300 bg-amber-50 text-amber-800" },
                { value: "declined" as ClientDecision, label: "Refus",      color: "border-rose-300 bg-rose-50 text-rose-800" },
              ]
            ).map(({ value, label, color }) => (
              <button key={value} type="button" onClick={() => onChange("clientDecision", value)}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${form.clientDecision === value ? color : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
          {form.clientDecision !== "accepted" && (
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-500">Motif exprimé <span className="font-normal">(optionnel)</span></span>
              <input id="advisory-decision-note" name="decisionNote" type="text" value={form.decisionNote} onChange={(e) => onChange("decisionNote", e.target.value)} placeholder="Ex : Souhaite comparer avec son assureur actuel." className={INPUT} />
            </label>
          )}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onSubmit} disabled={!isQuickValid}
            className="cta-primary cta-md inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            <FileIcon />
            Générer le compte rendu
          </button>
          <button type="button" onClick={onCancel} className="cta-secondary cta-md">Annuler</button>
          <p className="text-xs text-slate-400">Champs <span className="text-rose-400">*</span> requis.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  advisorName: "",
  advisorFirmName: "",
  advisorOrias: "",
  meetingType: "discovery",
  meetingDate: new Date().toISOString().slice(0, 10),
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  clientType: "particulier",
  propertyStatus: "",
  residenceType: "",
  householdComposition: "",
  activityType: "",
  hasEquipmentOrStock: null,
  receivesPublic: null,
  propertyType: "maison",
  clientNeed: "",
  clientNeedOther: "",
  rdvPoint0: "",
  rdvPoint1: "",
  rdvPoint2: "",
  contractType: "",
  coverageLevel: "complete",
  selectedOptions: [],
  confirmedRiskIds: [],
  clientDecision: "accepted",
  decisionNote: "",
  showFullProfile: false,
  showRdvPoints: false,
};

export function AdvisoryPanel({ result }: { result: RiskResult }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [report, setReport] = useState<AdvisoryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleToggleOption(opt: string) {
    setForm((f) => ({
      ...f,
      selectedOptions: f.selectedOptions.includes(opt)
        ? f.selectedOptions.filter((o) => o !== opt)
        : [...f.selectedOptions, opt],
    }));
  }

  function handleToggleRisk(id: string) {
    setForm((f) => ({
      ...f,
      confirmedRiskIds: f.confirmedRiskIds.includes(id)
        ? f.confirmedRiskIds.filter((r) => r !== id)
        : [...f.confirmedRiskIds, id],
    }));
  }

  async function handleSubmit() {
    setPhase("loading");

    const brokerInput: BrokerInput = {
      advisorName: form.advisorName,
      advisorFirmName: form.advisorFirmName,
      advisorOrias: form.advisorOrias || undefined,
      meetingType: form.meetingType,
      meetingDate: form.meetingDate,
      clientFirstName: form.clientFirstName,
      clientLastName: form.clientLastName,
      clientEmail: form.clientEmail,
      clientType: form.clientType,
      propertyStatus: form.propertyStatus || undefined,
      residenceType: form.residenceType || undefined,
      householdComposition: form.householdComposition || undefined,
      activityType: form.activityType || undefined,
      hasEquipmentOrStock: form.hasEquipmentOrStock ?? undefined,
      receivesPublic: form.receivesPublic ?? undefined,
      propertyType: form.propertyType,
      clientNeed: (form.clientNeed || "protection-essentielle") as ClientNeed,
      clientNeedOther: form.clientNeedOther || undefined,
      rdvPoints: [form.rdvPoint0, form.rdvPoint1, form.rdvPoint2],
      contractType: form.contractType || "Contrat MRH",
      coverageLevel: form.coverageLevel,
      selectedOptions: form.selectedOptions,
      confirmedRiskIds: form.confirmedRiskIds,
      clientDecision: form.clientDecision,
      decisionNote: form.decisionNote || undefined,
    };

    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskResult: result, brokerInput }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? "Erreur lors de la génération.");
      }

      const data = (await res.json()) as AdvisoryResult;
      setReport(data);
      setPhase("result");
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  function handleReset() {
    setPhase("idle");
    setReport(null);
    setErrorMessage("");
  }

  if (phase === "idle") return <IdleCard onStart={() => setPhase("form")} />;

  if (phase === "loading") {
    return (
      <div className={BRAND_CARD}>
        <span className="eyebrow">Devoir de conseil</span>
        <h4 className="mt-3 text-3xl font-semibold text-[var(--brand-ink)]">Conseilla rédige…</h4>
        <div className="mt-6 flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <p className="text-sm text-slate-600">
            Analyse de l'entretien et rédaction du document DDA en cours. Quelques secondes.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className={BRAND_CARD}>
        <span className="eyebrow">Devoir de conseil</span>
        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
        <button type="button" onClick={handleReset} className="cta-secondary cta-md mt-4">Retour</button>
      </div>
    );
  }

  if (phase === "result" && report) {
    return <DocumentResult result={report} onReset={handleReset} />;
  }

  return (
    <AdvisoryForm
      form={form}
      result={result}
      onChange={handleChange}
      onToggleOption={handleToggleOption}
      onToggleRisk={handleToggleRisk}
      onSubmit={handleSubmit}
      onCancel={handleReset}
    />
  );
}
