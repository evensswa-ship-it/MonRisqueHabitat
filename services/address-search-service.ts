import type { AddressSuggestion } from "@/types/address";

type AddressSearchResponse = {
  message?: string;
  suggestions?: AddressSuggestion[];
};

export async function getAddressSuggestions(
  query: string
): Promise<AddressSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return [];
  }

  const searchParams = new URLSearchParams({ q: trimmedQuery });
  const response = await fetch(`/api/address-search?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });

  const payload = (await response.json()) as AddressSearchResponse;

  if (!response.ok) {
    throw new Error(
      payload.message ?? "La recherche d'adresse est momentanément indisponible."
    );
  }

  return payload.suggestions ?? [];
}
