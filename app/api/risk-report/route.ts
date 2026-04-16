import { NextResponse } from "next/server";
import { getGeorisquesRiskResult } from "@/lib/georisques/client";
import { buildRiskReportFilename, createRiskReportPdf } from "@/lib/risk-report-pdf";
import type { AddressSuggestion } from "@/types/address";

function validateAddress(body: unknown): AddressSuggestion | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as { selectedAddress?: AddressSuggestion };

  if (!payload.selectedAddress) {
    return null;
  }

  const address = payload.selectedAddress;

  if (
    typeof address.label !== "string" ||
    typeof address.line1 !== "string" ||
    typeof address.postcode !== "string" ||
    typeof address.city !== "string" ||
    !address.coordinates ||
    typeof address.coordinates.lat !== "number" ||
    typeof address.coordinates.lon !== "number"
  ) {
    return null;
  }

  return address;
}

export async function POST(request: Request) {
  const body = await request.json();
  const address = validateAddress(body);

  if (!address) {
    return NextResponse.json(
      { message: "Adresse invalide. Merci de relancer l'analyse depuis une adresse réelle." },
      { status: 400 }
    );
  }

  try {
    const result = await getGeorisquesRiskResult(address);
    const pdfBytes = await createRiskReportPdf(result);
    const filename = buildRiskReportFilename(result.address, result.analyzedAt);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de générer le rapport PDF pour cette adresse.";

    return NextResponse.json({ message }, { status: 502 });
  }
}
