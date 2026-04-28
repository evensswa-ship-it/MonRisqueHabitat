import { NextResponse } from "next/server";
import { generateRiskSummary } from "@/lib/ai/mistral";
import type { ClientContext } from "@/lib/ai/mistral";
import type { RiskResult } from "@/types/risk";

export const maxDuration = 30;

type Payload = {
  riskResult: RiskResult;
  clientContext?: ClientContext;
};

function validate(body: unknown): Payload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Partial<Payload>;
  if (
    !b.riskResult ||
    typeof b.riskResult !== "object" ||
    !b.riskResult.overallRisk ||
    !Array.isArray(b.riskResult.categories)
  ) {
    return null;
  }
  return { riskResult: b.riskResult, clientContext: b.clientContext ?? {} };
}

export async function POST(request: Request) {
  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json(
      { message: "Fonctionnalité non disponible." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Corps de requête invalide." }, { status: 400 });
  }

  const payload = validate(body);
  if (!payload) {
    return NextResponse.json({ message: "Données invalides." }, { status: 400 });
  }

  try {
    const advice = await generateRiskSummary(payload.riskResult, payload.clientContext);
    return NextResponse.json(advice);
  } catch (error) {
    console.error("[GenerateAdvice]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: "La génération a échoué. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
