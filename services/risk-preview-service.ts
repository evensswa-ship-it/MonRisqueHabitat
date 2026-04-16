import type { AddressSuggestion } from "@/types/address";
import type { RiskResult } from "@/types/risk";

export async function getRiskPreviewByAddress(address: AddressSuggestion): Promise<RiskResult> {
  const response = await fetch("/api/risk-preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ selectedAddress: address })
  });

  const payload = (await response.json()) as { message?: string; result?: RiskResult };

  if (!response.ok) {
    throw new Error(
      payload.message ?? "Impossible de charger le diagnostic pour cette adresse."
    );
  }

  if (!payload.result) {
    throw new Error("Diagnostic indisponible pour cette adresse.");
  }

  return payload.result;
}
