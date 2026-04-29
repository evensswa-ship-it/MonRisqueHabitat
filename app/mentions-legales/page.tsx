import type { Metadata } from "next";
import { MrhLogo } from "@/components/brand/mrh-logo";

export const metadata: Metadata = {
  title: "Mentions légales | Mon Risque Habitat",
  description:
    "Mentions légales du service Mon Risque Habitat, édité par AGS & Co."
};

const sections = [
  {
    id: "presentation",
    title: "Présentation du service",
    content: (
      <p>
        Mon Risque Habitat est un service d'aide à la décision immobilière. Il permet
        d'obtenir une synthèse des risques naturels et technologiques associés à une
        adresse, à partir de bases de données publiques officielles. Ce service est
        édité par <strong>AGS &amp; Co</strong>.
      </p>
    )
  },
  {
    id: "editeur",
    title: "Éditeur",
    content: (
      <div className="space-y-1 text-sm leading-7 text-slate-600">
        <p><strong className="text-slate-900">AGS &amp; Co</strong></p>
        <p>Représentant : <strong className="text-slate-900">Evens Augustin</strong></p>
        <p>59 rue de Ponthieu, Bureau 326</p>
        <p>75008 Paris, France</p>
        <p className="pt-1">
          Tél. :{" "}
          <a
            href="tel:+33749213505"
            className="text-[var(--brand)] underline-offset-4 hover:underline"
          >
            +33 7 49 21 35 05
          </a>
        </p>
        <p>
          Email :{" "}
          <a
            href="mailto:evensswa@gmail.com"
            className="text-[var(--brand)] underline-offset-4 hover:underline"
          >
            evensswa@gmail.com
          </a>
        </p>
        <div className="pt-2 space-y-1 text-slate-500">
          <p>N° SIRET : <span className="font-mono">91206657800028</span></p>
          <p>N° TVA intracommunautaire : <span className="font-mono">FR78912066578</span></p>
          <p>Code NAF : 70.22Z</p>
        </div>
        <p className="pt-1">Directeur de la publication : <strong className="text-slate-900">Evens Augustin</strong></p>
      </div>
    )
  },
  {
    id: "hebergement",
    title: "Hébergement",
    content: (
      <p>
        Ce site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street,
        Suite 701, San Francisco, CA 94104, États-Unis.{" "}
        <span className="text-slate-500">vercel.com</span>
      </p>
    )
  },
  {
    id: "nature",
    title: "Nature informative du service",
    content: (
      <div className="space-y-4">
        <p>
          Les analyses fournies par Mon Risque Habitat sont des synthèses
          informatives construites à partir de sources de données publiques. Elles
          ne constituent pas :
        </p>
        <ul className="space-y-2 pl-1">
          {[
            "un état des risques et pollutions (ERP) au sens réglementaire",
            "une expertise technique certifiée sur site",
            "un conseil en assurance ou en investissement immobilier"
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-slate-600">
          L'utilisateur reste seul responsable des décisions prises sur la base
          de ces informations.
        </p>
      </div>
    )
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    content: (
      <p>
        AGS &amp; Co s'efforce de maintenir les informations à jour et fiables.
        La société ne peut être tenue responsable des erreurs ou omissions dans
        les données issues de sources tierces, ni des décisions prises par les
        utilisateurs sur la base de ces analyses. Les données sont susceptibles
        d'évoluer indépendamment du service.
      </p>
    )
  },
  {
    id: "sources",
    title: "Sources des données",
    content: (
      <div className="space-y-4">
        <p>Les analyses s'appuient sur des bases de données publiques, notamment :</p>
        <div className="space-y-3">
          {[
            {
              name: "Géorisques",
              desc: "portail officiel du gouvernement français sur les risques naturels et technologiques"
            },
            {
              name: "BRGM",
              desc: "Bureau de Recherches Géologiques et Minières"
            },
            {
              name: "ERRIAL",
              desc: "portail d'information sur les risques relatifs aux installations classées"
            }
          ].map(({ name, desc }) => (
            <div key={name} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
              <p>
                <strong>{name}</strong>. {desc}
              </p>
            </div>
          ))}
        </div>
        <p className="text-slate-500">
          Ces sources sont indépendantes d'AGS &amp; Co.
        </p>
      </div>
    )
  },
  {
    id: "utilisation",
    title: "Utilisation du service",
    content: (
      <p>
        Toute reproduction, diffusion ou exploitation commerciale des analyses
        générées sans autorisation écrite d'AGS &amp; Co est interdite.
      </p>
    )
  },
  {
    id: "donnees",
    title: "Données personnelles",
    content: (
      <div className="space-y-3">
        <p>
          Certaines données sont collectées (adresse email, nom, adresse analysée)
          dans le seul but de transmettre les rapports demandés. Ces données ne
          sont pas revendues à des tiers.
        </p>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD),
          vous disposez d'un droit d'accès, de rectification et de suppression de
          vos données. Pour l'exercer :{" "}
          <a
            href="mailto:monrisquehabitat@agsandco.fr"
            className="text-[var(--brand)] underline-offset-4 hover:underline"
          >
            monrisquehabitat@agsandco.fr
          </a>
        </p>
      </div>
    )
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Pour toute question relative au service :{" "}
        <a
          href="mailto:monrisquehabitat@agsandco.fr"
          className="text-[var(--brand)] underline-offset-4 hover:underline"
        >
          monrisquehabitat@agsandco.fr
        </a>
      </p>
    )
  }
];

export default function MentionsLegalesPage() {
  return (
    <main className="pb-20 md:pb-28">

      {/* Navigation minimale */}
      <div className="shell pt-4 md:pt-6">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/78 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
          <a href="/" className="flex items-center gap-3">
            <MrhLogo size={40} className="rounded-2xl" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Mon Risque Habitat</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                by AGS &amp; Co
              </p>
            </div>
          </a>
          <a
            href="/"
            className="cta-secondary cta-md text-sm"
          >
            ← Retour
          </a>
        </header>
      </div>

      {/* En-tête de page */}
      <div className="shell mt-14 md:mt-20">
        <div className="reveal-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Informations légales
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 md:text-5xl">
            Mentions légales
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Dernière mise à jour : avril 2026
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="shell mt-12 md:mt-16">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-12">

          {/* Table des matières — desktop */}
          <nav className="hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Sommaire
              </p>
              {sections.map(({ id, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {title}
                </a>
              ))}
            </div>
          </nav>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map(({ id, title, content }) => (
              <section
                key={id}
                id={id}
                className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_4px_20px_rgba(15,23,42,0.04)] md:p-9"
              >
                <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
                <div className="mt-5 text-sm leading-7 text-slate-600">
                  {content}
                </div>
              </section>
            ))}

            {/* Disclaimer */}
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-7 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Note
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Ce diagnostic est fourni à titre informatif, sur la base de données publiques
                officielles (Géorisques, BRGM, ERRIAL, GASPAR via data.gouv.fr). Il ne remplace pas un état des risques
                réglementaire ni l'avis d'un professionnel qualifié. Mon Risque Habitat ne vend
                pas d'assurance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
