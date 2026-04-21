import type { CSSProperties } from "react";
import { RiskWidget } from "@/components/widget/risk-widget";
import { PartnerDemoForm } from "@/components/partner/partner-demo-form";
import {
  Database,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "@/components/widget/icons";
import { MrhLogo } from "@/components/brand/mrh-logo";

// ─── Données statiques ────────────────────────────────────────────────────────

const benefits = [
  {
    Icon: Sparkles,
    title: "Immédiat",
    text: "Le diagnostic complet s'affiche en quelques secondes après saisie de l'adresse.",
  },
  {
    Icon: MessageCircleHeart,
    title: "Clair",
    text: "Les risques sont expliqués simplement, avec des conseils orientés vers l'action.",
  },
  {
    Icon: ShieldCheck,
    title: "Fiable",
    text: "Analyse construite sur des sources officielles : Géorisques, BRGM, ERRIAL.",
  },
];

const steps = [
  {
    step: "01",
    title: "Saisissez une adresse",
    text: "Tapez n'importe quelle adresse en France. L'autocomplétion vous guide.",
  },
  {
    step: "02",
    title: "Analyse automatique",
    text: "Les données sont croisées en temps réel à partir de sources publiques officielles.",
  },
  {
    step: "03",
    title: "Rapport clair et exploitable",
    text: "Consultez le diagnostic, téléchargez le PDF ou recevez-le par email.",
  },
];

const dataSources = [
  {
    Icon: Database,
    label: "Données officielles françaises",
    sub: "Géorisques, ERRIAL, BRGM",
  },
  {
    Icon: ShieldCheck,
    label: "Conforme au cadre ERPS",
    sub: "Information et prévention uniquement",
  },
  {
    Icon: MessageCircleHeart,
    label: "Mise à jour régulière",
    sub: "Bases synchronisées en continu",
  },
];

const footerLinks = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/mentions-legales#donnees" },
  { label: "Contact", href: "mailto:monrisquehabitat@agsandco.fr" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="pb-16 md:pb-24">

      {/* ── NAVIGATION ───────────────────────────────────────────────────── */}
      <section className="grid-lines overflow-hidden pt-4 md:pt-6">
        <div className="shell">
          <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/78 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center gap-3">
              <MrhLogo size={44} className="rounded-2xl" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Mon Risque Habitat</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  by AGS &amp; Co
                </p>
              </div>
            </div>
            <nav className="hidden gap-7 text-sm text-slate-600 md:flex">
              <a href="#analyser" className="transition hover:text-slate-900">Analyser</a>
              <a href="#fonctionnement" className="transition hover:text-slate-900">Fonctionnement</a>
              <a href="#partenaires" className="transition hover:text-slate-900">Partenaires</a>
            </nav>
            <a href="#analyser" className="cta-primary cta-md hidden md:inline-flex">
              Analyser →
            </a>
          </header>

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <div className="mt-16 pb-20 pt-8 text-center md:mt-24 md:pb-28 md:pt-12">
            <div className="reveal-up">
              <span className="eyebrow mx-auto">
                <Sparkles />
                Diagnostic immobilier gratuit
              </span>

              <h1 className="mx-auto mt-7 max-w-3xl text-balance text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                Votre bien est-il exposé à des risques ?
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-8 text-slate-600">
                Entrez une adresse en France et obtenez en quelques secondes une analyse claire — inondation, sol, environnement, proximité industrielle.
              </p>

              <div className="mt-9 flex flex-col items-center gap-3">
                <a href="#analyser" className="cta-primary cta-lg">
                  Analyser une adresse gratuitement →
                </a>
                <a href="#partenaires" className="text-sm text-slate-400 transition hover:text-slate-700">
                  Vous êtes professionnel ? Découvrez l'offre partenaire
                </a>
              </div>

              <p className="mt-7 text-sm text-slate-400">
                Gratuit · Aucune inscription · Données officielles · Mon Risque Habitat ne vend pas d'assurance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES ────────────────────────────────────────────────────── */}
      <section className="shell mt-6 md:mt-8">
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {benefits.map(({ Icon, title, text }, index) => (
            <article
              key={title}
              className="glass-panel hover-lift reveal-up rounded-[28px] p-7 md:p-8"
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon />
              </div>
              <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────────── */}
      <section id="fonctionnement" className="shell mt-24 md:mt-32">
        <div className="mb-10 text-center md:mb-14">
          <span className="eyebrow mx-auto">
            <MessageCircleHeart />
            Fonctionnement
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
            Trois étapes, un diagnostic complet.
          </h2>
        </div>
        <div className="grid gap-5 md:gap-6 md:grid-cols-3">
          {steps.map(({ step, title, text }, index) => (
            <article
              key={step}
              className="reveal-up relative rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_8px_32px_rgba(15,23,42,0.04)] md:p-9"
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <p className="text-4xl font-semibold tracking-tight text-slate-100 md:text-5xl">
                {step}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        {/* CTA après les étapes */}
        <div className="mt-10 text-center md:mt-12">
          <a href="#analyser" className="cta-primary cta-lg">
            Lancer mon diagnostic →
          </a>
        </div>
      </section>

      {/* ── WIDGET — ZONE D'ANALYSE ──────────────────────────────────────── */}
      <section id="analyser" className="shell mt-24 md:mt-32">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
            Entrez une adresse, obtenez votre diagnostic.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
            Résultat immédiat. Aucune inscription requise.
          </p>
        </div>
        <RiskWidget />
      </section>

      {/* ── CRÉDIBILITÉ ──────────────────────────────────────────────────── */}
      <section className="shell mt-16 md:mt-24">
        <div className="glass-panel reveal-up rounded-[34px] p-8 md:p-11">
          <div className="mb-8 text-center md:mb-10">
            <span className="eyebrow mx-auto">
              <Database />
              Sources officielles
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
              Des données que vous pouvez vérifier.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              L'analyse est construite à partir de bases de données publiques reconnues — Géorisques, ERRIAL, BRGM — enrichies d'une lecture orientée vers l'action.
            </p>
            <p className="mx-auto mt-5 max-w-xl text-balance rounded-2xl bg-[var(--brand-soft)] px-6 py-4 text-sm leading-7 text-[var(--brand-ink)]">
              Les données officielles sont complètes, mais leur lecture peut prendre du temps.{" "}
              MRH propose une synthèse claire et exploitable en quelques secondes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {dataSources.map(({ Icon, label, sub }) => (
              <div key={label} className="panel-card rounded-[22px] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon />
                </div>
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-sm text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-t border-slate-200/80 pt-6 text-center text-sm leading-7 text-slate-400">
            Mon Risque Habitat ne se substitue pas à un état des risques officiel. Il en facilite la lecture et la communication.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="shell mt-16 md:mt-24">
        <div className="reveal-up rounded-[34px] bg-[linear-gradient(135deg,#08264f_0%,#0f4fa8_52%,#3b82f6_100%)] p-10 text-center text-white shadow-[0_28px_80px_rgba(15,79,168,0.24)] md:p-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Prenez les bonnes décisions
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold md:text-4xl">
            Analysez votre bien avant qu'il soit trop tard.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-blue-100">
            Gratuit, immédiat, sans inscription. Les données qui changent une décision d'achat.
          </p>
          <a href="#analyser" className="cta-secondary cta-lg mt-8 inline-flex">
            Lancer le diagnostic →
          </a>
        </div>
      </section>

      {/* ── B2B — PARTENAIRES ────────────────────────────────────────────── */}
      <section id="partenaires" className="shell mt-16 pt-2 md:mt-24 md:pt-4">
        <div className="grid items-start gap-8 md:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="glass-panel reveal-up rounded-[30px] p-7 md:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Espace partenaires
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
              Intégrez le diagnostic dans votre parcours client.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Conçu pour les assureurs, courtiers, réseaux d'agences et mutuelles. Ajoutez une lecture du risque habitat à chaque devis ou transaction.
            </p>
            <div className="mt-7 space-y-4 text-sm leading-7 text-slate-700">
              <div className="panel-card hover-lift rounded-2xl p-5">
                <span className="font-semibold text-slate-950">Réduisez les sinistres non anticipés</span>
                <p className="mt-1 text-slate-500">Vos clients entrent informés, vos contrats sont mieux dimensionnés.</p>
              </div>
              <div className="panel-card hover-lift rounded-2xl p-5">
                <span className="font-semibold text-slate-950">Intégration en moins d'une journée</span>
                <p className="mt-1 text-slate-500">API simple, widget embarquable, ou lien direct — selon votre stack.</p>
              </div>
              <div className="panel-card hover-lift rounded-2xl p-5">
                <span className="font-semibold text-slate-950">Marque blanche disponible</span>
                <p className="mt-1 text-slate-500">Personnalisez l'interface aux couleurs de votre structure.</p>
              </div>
            </div>
          </div>

          <PartnerDemoForm />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="shell mt-10 border-t border-slate-200/80 pt-8 text-sm text-slate-500">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <MrhLogo size={32} className="rounded-xl" />
              <div>
                <p className="font-semibold text-slate-700">Mon Risque Habitat</p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">by AGS &amp; Co</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm leading-6 text-slate-500">
              Une lecture claire des risques liés à l'habitat, pour les particuliers et les professionnels.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map(({ label, href }) => (
              <a key={label} href={href} className="transition hover:text-slate-700">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
