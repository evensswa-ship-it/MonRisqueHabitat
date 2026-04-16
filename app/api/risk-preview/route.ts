import { NextResponse } from "next/server";
import { getGeorisquesRiskResult } from "@/lib/georisques/client";
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

function hasGeorisquesConfig() {
  return Boolean(process.env.GEORISQUES_API_TOKEN && process.env.GEORISQUES_API_BASE_URL);
}

function buildAddressLogContext(address: AddressSuggestion) {
  return {
    label: address.label,
    postcode: address.postcode,
    city: address.city,
    coordinates: address.coordinates
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const address = validateAddress(body);

  if (!address) {
    return NextResponse.json(
      { message: "Adresse invalide. Merci de choisir une adresse dans la liste." },
      { status: 400 }
    );
  }

  if (!hasGeorisquesConfig()) {
    return NextResponse.json(
      {
        message:
          "Le diagnostic est indisponible pour cette adresse. Configurez Géorisques pour activer les données réelles."
      },
      { status: 503 }
    );
  }

  try {
    console.info("[RiskPreview] Request accepted", {
      address: buildAddressLogContext(address)
    });
    const result = await getGeorisquesRiskResult(address);
    console.info("[RiskPreview] Result generated", {
      address: buildAddressLogContext(address),
      categoryIds: result.categories.map((category) => category.id),
      overallRisk: result.overallRisk.label
    });
    return NextResponse.json({ result, mocked: false });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de charger le diagnostic Géorisques.";

    console.error("[RiskPreview] Request failed", {
      address: buildAddressLogContext(address),
      message
    });

    if (message.includes("Aucune donnée Géorisques")) {
      return NextResponse.json(
        {
          message:
            "Aucune donnée Géorisques exploitable n'est disponible pour cette zone."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message
      },
      { status: 502 }
    );
  }
}
