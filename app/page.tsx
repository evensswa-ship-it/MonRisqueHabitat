import type { CSSProperties } from "react";
import { RiskWidget } from "@/components/widget/risk-widget";
import { PartnerDemoForm } from "@/components/partner/partner-demo-form";
import {
  Database,
  MessageCircleHeart,
  ShieldCheck,
} from "@/components/widget/icons";
import { MrhLogo } from "@/components/brand/mrh-logo";
import { MobileMenu } from "@/components/nav/mobile-menu";

// ─── Données statiques ────────────────────────────────────────────────────────

const useCases = [
  {
    label: "Avant un mandat",
    title: "Préparez votre rendez-vous vendeur",
    text: "Vérifiez les risques d'un bien avant votre premier contact. Arrivez informé et anticipez les objections.",
  },
  {
    label: "Avant un devis",
    title: "Anticipez les risques avant d'émettre une offre",
    text: "Analysez le profil de risque d'une adresse avant de tarifier. Réduisez les mauvaises surprises après signature.",
  },
  {
    label: "Face à votre client",
    title: "Expliquez les risques simplement",
    text: "Montrez une synthèse lisible et compréhensible. Vos clients entrent dans la transaction informés.",
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
  { label: "Blog", href: "/blog" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/mentions-legales#donnees" },
  { label: "Contact", href: "mailto:monrisquehabitat@agsandco.fr" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="pb-16 md:pb-24">

      {/* ── NAVIGATION ───────────────────────────────────────────────────── */}
      <section id="analyser" className="grid-lines overflow-hidden pt-4 md:pt-6">
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
              <a href="/blog" className="transition hover:text-slate-900">Blog</a>
              <a href="#fonctionnement" className="transition hover:text-slate-900">Fonctionnement</a>
              <a href="#partenaires" className="transition hover:text-slate-900">Partenaires</a>
            </nav>
            <a href="#analyser" className="cta-primary cta-md hidden md:inline-flex">
              Analyser →
            </a>
            <MobileMenu />
          </header>

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <div className="mt-4 pb-8 pt-4 text-center md:mt-10 md:pb-14 md:pt-6">
            <div className="reveal-up">
              <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Analysez les risques immobiliers. Expliquez-les à votre client.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-balance text-lg leading-8 text-slate-600">
                Entrez une adresse et obtenez en quelques secondes une synthèse claire — inondation, sol, environnement, proximité industrielle.
              </p>

              <div className="mt-8">
                <RiskWidget />
              </div>

              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-sm text-slate-400">
                  Basé sur des données publiques officielles (Géorisques, IGN, BRGM) · Gratuit · Sans inscription
                </p>
                <a href="#partenaires" className="text-sm text-slate-400 underline-offset-4 transition hover:text-slate-700 hover:underline">
                  Vous êtes professionnel ? Découvrez l'offre partenaire
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POURQUOI ─────────────────────────────────────────────────────── */}
      <section className="shell mt-6 md:mt-8">
        <div className="glass-panel reveal-up p-6 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-12">
            <div>
              <span className="eyebrow">Le problème</span>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                Les données sont là. La lecture manque.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Géorisques centralise des données fiables sur les risques naturels et technologiques. Mais les consulter prend du temps, les interpréter demande une expertise, et les expliquer à un client dans un rendez-vous est difficile.
              </p>
            </div>
            <div>
              <span className="eyebrow">Ce que fait MRH</span>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                Une synthèse exploitable en quelques secondes.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                MRH croise les mêmes sources officielles et produit une note claire par facteur de risque. Un niveau global, les points d'attention, une lecture que vous pouvez partager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAS D'USAGE ──────────────────────────────────────────────────── */}
      <section id="fonctionnement" className="shell mt-16 md:mt-24">
        <div className="mb-10 text-center md:mb-14">
          <span className="eyebrow mx-auto">
            <MessageCircleHeart />
            Cas d'usage
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
            Utilisé à chaque étape d'une transaction.
          </h2>
        </div>
        <div className="grid gap-5 md:gap-6 md:grid-cols-3">
          {useCases.map(({ label, title, text }, index) => (
            <article
              key={label}
              className="panel-card reveal-up relative p-6 md:p-8"
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">{label}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center md:mt-12">
          <a href="#analyser" className="cta-primary cta-lg">
            Analyser une adresse →
          </a>
        </div>
      </section>

      {/* ── CRÉDIBILITÉ ──────────────────────────────────────────────────── */}
      <section className="shell mt-16 md:mt-24">
        <div className="glass-panel reveal-up p-6 md:p-10">
          <div className="mb-8 grid gap-6 md:mb-10 md:grid-cols-[0.85fr_1.15fr] md:items-end">
            <div>
            <span className="eyebrow">
              <Database />
              Sources officielles
            </span>
            <h2 className="mt-5 max-w-xl text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
              Des données que vous pouvez vérifier.
            </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-slate-600 md:justify-self-end">
              L'analyse est construite à partir de bases de données publiques reconnues — Géorisques, ERRIAL, BRGM. Les mêmes données que les professionnels consultent, présentées différemment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {dataSources.map(({ Icon, label, sub }) => (
              <div key={label} className="panel-card p-5 md:p-6">
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
        <div className="reveal-up rounded-[28px] bg-[var(--brand-ink)] p-8 text-left text-white shadow-[0_28px_80px_rgba(8,38,79,0.22)] md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Pour les professionnels de l'immobilier et de l'assurance
          </p>
          <h2 className="mt-5 max-w-2xl text-balance text-3xl font-semibold md:text-4xl">
            Ajoutez l'analyse de risque à chaque transaction.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-blue-100">
            Gratuit, immédiat, sans inscription. Pour l'intégrer à votre workflow, découvrez l'offre partenaire.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#analyser" className="cta-secondary cta-lg inline-flex">
              Analyser une adresse →
            </a>
            <a href="#partenaires" className="text-sm font-medium text-blue-200 transition hover:text-white">
              Voir l'offre partenaire
            </a>
          </div>
        </div>
      </section>

      {/* ── B2B — PARTENAIRES ────────────────────────────────────────────── */}
      <section id="partenaires" className="shell mt-16 pt-2 md:mt-24 md:pt-4">
        <div className="grid items-start gap-8 md:gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="glass-panel reveal-up p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Espace partenaires
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold text-slate-950 md:text-4xl">
              Intégrez le diagnostic dans votre parcours client.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Pour les agences, courtiers, assureurs et réseaux immobiliers. Ajoutez une analyse de risque à chaque dossier — sans changer votre outil actuel.
            </p>
            <div className="mt-7 divide-y divide-slate-200/80 border-y border-slate-200/80 text-sm leading-7 text-slate-700">
              <div className="py-4">
                <span className="font-semibold text-slate-950">Réduisez les sinistres non anticipés</span>
                <p className="mt-1 text-slate-500">Vos clients entrent informés, vos contrats sont mieux dimensionnés.</p>
              </div>
              <div className="py-4">
                <span className="font-semibold text-slate-950">Intégration en une semaine</span>
                <p className="mt-1 text-slate-500">API simple, widget embarquable, ou lien direct — selon votre stack.</p>
              </div>
              <div className="py-4">
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
              Une synthèse claire des risques immobiliers pour les professionnels de l'immobilier et de l'assurance.
            </p>
            <p className="mt-3 text-xs text-slate-400">© 2026 AGS & Co — Tous droits réservés</p>
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
