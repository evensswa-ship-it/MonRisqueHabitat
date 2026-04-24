"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { RiskResult } from "@/types/risk";

// ── Types ─────────────────────────────────────────────────────────────────────

type InsightData = {
  meaning: string;
  checklist: string[];
  script: string;
};

type Tab = 0 | 1 | 2;

const TABS: [string, string, string] = [
  "Ce que ça signifie",
  "Ce qu'il faut vérifier",
  "Pour votre client",
];

// ── Static fallback (used if API call fails) ──────────────────────────────────

const RISK_ACTIONS: Record<string, string> = {
  flood:
    "Consulter le Plan de Prévention des Risques inondation (PPRi) et vérifier le classement de la parcelle.",
  fire:
    "Vérifier la proximité des massifs boisés et les obligations de débroussaillement applicables.",
  "ground-movement":
    "S'informer sur les mouvements de terrain répertoriés et leurs conséquences sur le bâti.",
  clay:
    "Examiner l'exposition au retrait-gonflement des argiles, particulièrement en cas de vente ou de travaux.",
  seismic:
    "Vérifier la zone sismique et les règles parasismiques si des travaux sont envisagés.",
  radon:
    "Prendre connaissance du potentiel radon de la zone et des mesures de prévention recommandées.",
  storm:
    "Évaluer l'exposition aux risques météo dans le cadre de la tarification assurance.",
};

function buildStaticFallback(result: RiskResult): InsightData {
  const { level } = result.overallRisk;
  const highs = result.categories.filter((c) => c.priority === "high");
  const mediums = result.categories.filter((c) => c.priority === "medium");

  // meaning
  let meaning =
    level === "low"
      ? "L'analyse ne fait pas ressortir de facteur de risque majeur pour cette adresse. Le profil est globalement favorable — ce n'est pas une garantie absolue, mais c'est un signal positif pour la suite du dossier."
      : level === "medium"
        ? "L'analyse identifie des facteurs qui méritent attention avant toute décision. Ce niveau est courant — il n'interdit pas le projet, mais appelle à une vérification ciblée avant engagement."
        : "L'analyse identifie au moins un facteur de risque significatif sur cette adresse. Ces données s'imposent à la lecture avant tout engagement, qu'il s'agisse d'un achat, d'une location ou d'une souscription.";

  if (highs.length === 1) {
    meaning += ` Le risque ${highs[0].label.toLowerCase()} ressort comme facteur prioritaire.`;
  } else if (highs.length > 1) {
    const names = highs.map((r) => r.label.toLowerCase());
    meaning += ` Les risques ${names.slice(0, -1).join(", ")} et ${names[names.length - 1]} ressortent comme facteurs prioritaires.`;
  } else if (mediums.length > 0) {
    meaning += ` Le risque ${mediums[0].label.toLowerCase()} est à surveiller.`;
  }

  if (result.catnat && result.catnat.count > 0) {
    meaning += ` La commune a par ailleurs fait l'objet de ${result.catnat.count} arrêté${result.catnat.count > 1 ? "s" : ""} CatNat reconnu${result.catnat.count > 1 ? "s" : ""}.`;
  }

  // checklist
  const risksToDetail = [
    ...highs,
    ...(highs.length < 3 ? mediums.slice(0, 2) : []),
  ].slice(0, 3);

  const checklist: string[] = risksToDetail.map(
    (r) => RISK_ACTIONS[r.id] ?? r.watch,
  );

  if (result.catnat && result.catnat.count > 0) {
    checklist.push(
      `Historique CatNat : ${result.catnat.count} arrêté${result.catnat.count > 1 ? "s" : ""} reconnu${result.catnat.count > 1 ? "s" : ""} — à mentionner dans le dossier.`,
    );
  }
  if (highs.length > 0 || (result.catnat && result.catnat.count > 2)) {
    checklist.push(
      "Anticiper l'impact éventuel sur les conditions d'assurance habitation avant de finaliser.",
    );
  }
  if (checklist.length === 0) {
    checklist.push(
      "Conserver ce rapport dans le dossier du bien, comme élément d'information client.",
    );
  }

  // script
  const riskMentioned =
    highs.length > 0
      ? ` — notamment sur le risque ${highs[0].label.toLowerCase()}`
      : "";

  const script =
    level === "low"
      ? "«J'ai fait une analyse complète des risques sur ce bien à partir des données officielles. Il n'y a pas de point d'alerte particulier — le profil est globalement sain. Je vous remets ce rapport pour que vous ayez une lecture claire du contexte avant de vous décider.»"
      : level === "medium"
        ? "«Avant de finaliser quoi que ce soit, j'ai voulu vérifier le profil de risque de ce bien. Il y a quelques éléments à regarder de plus près — c'est courant, la majorité des biens présentent des risques modérés sur au moins un facteur. L'essentiel, c'est d'en avoir connaissance maintenant, pas après la signature.»"
        : `«L'analyse fait ressortir un risque élevé sur ce bien${riskMentioned}. Je vous en parle maintenant, en toute transparence, pour que vous preniez votre décision avec les bonnes informations en main. Ce n'est pas forcément un frein — mais c'est un point qu'on doit regarder ensemble avant d'aller plus loin.»`;

  return { meaning, checklist, script };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3.5 w-full rounded-full bg-slate-100" />
      <div className="h-3.5 w-11/12 rounded-full bg-slate-100" />
      <div className="h-3.5 w-4/6 rounded-full bg-slate-100" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GuidedRiskAssistant({ result }: { result: RiskResult }) {
  const [active, setActive] = useState<Tab>(0);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedKey = useRef<string | null>(null);

  const resultKey = `${result.address}|${result.analyzedAt}`;

  useEffect(() => {
    if (fetchedKey.current === resultKey) return;
    fetchedKey.current = resultKey;

    setLoading(true);
    setInsight(null);

    let cancelled = false;

    fetch("/api/guided-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: InsightData) => {
        if (!cancelled) {
          setInsight(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInsight(buildStaticFallback(result));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      fetchedKey.current = null;
    };
  }, [resultKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="panel-card reveal-up p-6 md:p-8"
      style={{ "--delay": "90ms" } as CSSProperties}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
        Comprendre ce résultat
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActive(i as Tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === i
                ? "bg-[var(--brand)] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 min-h-[72px]">
        {loading && <Skeleton />}

        {!loading && insight && (
          <>
            {active === 0 && (
              <p className="text-sm leading-7 text-slate-700">{insight.meaning}</p>
            )}

            {active === 1 && (
              <ul className="space-y-3">
                {insight.checklist.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {active === 2 && (
              <div className="rounded-[18px] bg-slate-50 px-5 py-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Formulation suggérée
                </p>
                <p className="text-sm italic leading-7 text-slate-700">
                  {insight.script}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
