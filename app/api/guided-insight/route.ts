import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { RiskResult } from "@/types/risk";

const client = new Anthropic();

const SYSTEM = `Tu es un conseiller senior en risques immobiliers avec 15 ans d'expérience. Tu parles à des professionnels : agents, courtiers et assureurs. Ils ont déjà l'analyse sous les yeux. Ils n'ont pas besoin qu'on leur réexplique les données : ils ont besoin de savoir quoi en faire.

Tu génères 3 textes courts, en français, orientés décision.

1. meaning : 2 phrases max. Commence par la conséquence pour le dossier, pas par la cause. Ce que ce profil change concrètement : impact sur la négociation, sur l'assurance, sur la revente, sur les travaux à prévoir. Ne mentionne pas les niveaux ou scores déjà visibles. Ne dis jamais "ce bien est exposé à X". Dis ce que X implique dans ce contexte précis.

2. checklist : 3 à 4 actions dans l'ordre de priorité réelle. Chaque item = verbe d'action + objet précis + raison courte qui justifie l'urgence. Ex : "Demander le PPRi communal, car il détermine si des travaux de mise en conformité sont obligatoires avant vente." Pas de généralités, pas de "vérifiez les risques". Chaque ligne doit faire avancer le dossier.

3. script : La phrase que le professionnel dit après avoir posé le rapport sur la table. 1 à 2 phrases, ton direct, humain. Pas de préambule ("j'ai fait une analyse…"). Le client le sait déjà. Donne la phrase qui mène vers la décision ou la question suivante. Elle doit provoquer une réaction, pas clore la conversation.

Règles absolues :
- Ne jamais reformuler ce qui est déjà dans le rapport
- Pas de réassurance vide ("c'est courant", "ça ne veut pas dire que c'est bloquant")
- Pas de jargon pédagogique sur les sources officielles
- Basé uniquement sur les données transmises, zéro invention
- Aucun nom de produit, d'assureur ou de service tiers

Format : JSON pur, sans markdown, sans commentaire.
{ "meaning": "...", "checklist": ["...", "...", "..."], "script": "..." }`;

type GuideRequest = { result: RiskResult };

function buildContext(result: RiskResult): string {
  const lines: string[] = [
    `Niveau global : ${result.overallRisk.label} (score ${result.overallRisk.score ?? "?"}/${result.overallRisk.maxScore ?? 100})`,
    `Décision globale : ${result.overallRisk.decision}`,
    `Rationale : ${result.overallRisk.rationale ?? result.overallRisk.summary}`,
  ];

  const highs = result.categories.filter((c) => c.priority === "high");
  const mediums = result.categories.filter((c) => c.priority === "medium");
  const lows = result.categories.filter((c) => c.priority === "low");

  for (const r of highs) {
    lines.push(
      `[RISQUE ÉLEVÉ] ${r.label}. ${r.decision}. Synthèse : ${r.summary}. À surveiller : ${r.watch}. Recommandation : ${r.recommendation}`,
    );
  }
  for (const r of mediums) {
    lines.push(
      `[RISQUE MODÉRÉ] ${r.label}. ${r.decision}. À surveiller : ${r.watch}`,
    );
  }
  if (lows.length > 0) {
    lines.push(`Risques faibles (signal faible) : ${lows.map((r) => r.label).join(", ")}`);
  }

  if (result.catnat) {
    lines.push(`CatNat : ${result.catnat.sentence}`);
    if (result.catnat.count > 0 && result.catnat.lastYear) {
      lines.push(`Dernier arrêté CatNat : ${result.catnat.lastYear}`);
    }
  }

  const sourceContexts = result.categories
    .filter((category) => category.territoryContext)
    .map((category) => `${category.label} : ${category.territoryContext}`);

  if (sourceContexts.length > 0) {
    lines.push(`Contextes issus des sources : ${sourceContexts.join(" | ")}`);
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { result } = (await req.json()) as GuideRequest;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: [
        {
          type: "text",
          text: SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Données de l'analyse :\n\n${buildContext(result)}`,
        },
      ],
    });

    const raw =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const data = JSON.parse(cleaned) as {
      meaning: string;
      checklist: string[];
      script: string;
    };

    if (!data.meaning || !Array.isArray(data.checklist) || !data.script) {
      throw new Error("invalid_shape");
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[guided-insight]", err);
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
