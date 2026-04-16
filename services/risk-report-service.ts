import type { AddressSuggestion } from "@/types/address";

function readFilename(response: Response) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/i);

  return match?.[1] ?? "mrh-rapport.pdf";
}

export async function downloadRiskReport(address: AddressSuggestion) {
  const response = await fetch("/api/risk-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ selectedAddress: address })
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? "Impossible de générer le rapport PDF.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = readFilename(response);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
