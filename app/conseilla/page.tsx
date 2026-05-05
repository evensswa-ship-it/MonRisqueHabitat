import type { Metadata } from "next";
import { MrhLogo } from "@/components/brand/mrh-logo";
import { MobileMenu } from "@/components/nav/mobile-menu";
import { WaitlistNavButton } from "@/components/waitlist/waitlist-nav-button";
import { AdvisoryPanel } from "@/components/advisory/advisory-panel";

export const metadata: Metadata = {
  title: "Conseilla | Mon Risque Habitat",
  description: "Transformez vos notes de RDV en synthèse DDA, points de vigilance et mail client en 30 secondes. Outil post-rendez-vous pour courtiers en assurance.",
};

export default function ConseilllaPage() {
  return (
    <main className="pb-16 md:pb-24">

      {/* ── COMING SOON OVERLAY ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="panel-card animate-fade-in mx-4 max-w-md px-8 py-10 text-center">
          <span className="text-4xl">🛠️</span>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            On fabrique quelque chose rien que pour vous.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Conseilla est en cours de finalisation. Synthèse DDA, devoir de conseil, mail client — tout ça arrive très bientôt.
          </p>
          <a href="/" className="cta-secondary cta-md mt-7 inline-flex">
            ← Retour à l'accueil
          </a>
        </div>
      </div>

      {/* ── NAVIGATION ───────────────────────────────────────────────────── */}
      <div className="grid-lines overflow-hidden pt-4 md:pt-6">
        <div className="shell">
          <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/78 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
            <a href="/" className="flex items-center gap-3">
              <MrhLogo size={44} className="rounded-2xl" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Mon Risque Habitat</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  by AGS &amp; Co
                </p>
              </div>
            </a>
            <nav className="hidden gap-7 text-sm text-slate-600 md:flex">
              <a href="/#analyser" className="transition hover:text-slate-900">Analyser</a>
              <a href="/conseilla" className="font-medium text-[var(--brand)] transition hover:text-[var(--brand-deep)]">Conseilla</a>
              <a href="/blog" className="transition hover:text-slate-900">Blog</a>
              <a href="/#fonctionnement" className="transition hover:text-slate-900">Fonctionnement</a>
              <a href="/#partenaires" className="transition hover:text-slate-900">Partenaires</a>
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <WaitlistNavButton />
            </div>
            <MobileMenu />
          </header>

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <div className="mt-10 pb-10 md:mt-16 md:pb-14">
            <div className="reveal-up max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="eyebrow">Conseilla</span>
                <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--brand)]">
                  DDA
                </span>
              </div>
              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Votre dossier post-RDV en quelques minutes
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                Renseignez les informations clés de votre rendez-vous. Conseilla structure votre devoir de conseil, vos points de vigilance et votre mail client, prêts à relire, valider et envoyer.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Exclusivement pour courtiers en assurance et agents généraux. Le conseiller reste responsable du conseil et de la validation finale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PANEL ────────────────────────────────────────────────────────── */}
      <div className="shell mt-2">
        <AdvisoryPanel />
      </div>

    </main>
  );
}
