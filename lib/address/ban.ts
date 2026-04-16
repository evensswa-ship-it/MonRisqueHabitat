import "server-only";

import type { AddressSuggestion } from "@/types/address";

const DEFAULT_ADDRESS_API_URL = "https://data.geopf.fr/geocodage/completion/";
const DEFAULT_ADDRESS_LIMIT = 5;

type GeoplateformeResult = {
  x?: number;
  y?: number;
  city?: string;
  fulltext?: string;
  kind?: string;
  street?: string;
  zipcode?: string;
  classification?: number;
};

type GeoplateformeCompletionResponse = {
  results?: GeoplateformeResult[];
};

function getAddressApiUrl() {
  return process.env.ADDRESS_API_URL ?? process.env.NEXT_PUBLIC_ADDRESS_API_URL ?? DEFAULT_ADDRESS_API_URL;
}

function getAddressResultLimit() {
  const rawLimit =
    process.env.ADDRESS_SEARCH_LIMIT ?? process.env.NEXT_PUBLIC_ADDRESS_SEARCH_LIMIT;
  const parsedLimit = Number(rawLimit);

  if (Number.isFinite(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 10) {
    return parsedLimit;
  }

  return DEFAULT_ADDRESS_LIMIT;
}

function buildBanSearchUrl(query: string) {
  const searchParams = new URLSearchParams({
    text: query,
    type: "StreetAddress",
    maximumResponses: String(getAddressResultLimit())
  });

  return `${getAddressApiUrl()}?${searchParams.toString()}`;
}

function mapFeatureToAddressSuggestion(
  result: GeoplateformeResult,
  index: number
): AddressSuggestion | null {
  if (
    typeof result.fulltext !== "string" ||
    typeof result.city !== "string" ||
    typeof result.zipcode !== "string" ||
    typeof result.x !== "number" ||
    typeof result.y !== "number"
  ) {
    return null;
  }

  const line1 = result.fulltext.split(",")[0]?.trim() || result.street?.trim() || result.fulltext;

  return {
    id: `${result.fulltext}-${index}`,
    label: result.fulltext,
    line1,
    postcode: result.zipcode,
    city: result.city,
    coordinates: {
      lon: result.x,
      lat: result.y
    },
    score: result.classification,
    country: "France",
    provider: "ban"
  };
}

export async function searchFrenchAddresses(query: string): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return [];
  }

  const response = await fetch(buildBanSearchUrl(trimmedQuery), {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Le service d'adresse est momentanément indisponible.");
  }

  const payload = (await response.json()) as GeoplateformeCompletionResponse;

  return (payload.results ?? [])
    .map(mapFeatureToAddressSuggestion)
    .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null);
}
