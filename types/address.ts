export type AddressProvider = "ban";

export type AddressCoordinates = {
  lat: number;
  lon: number;
};

export type AddressSuggestion = {
  id: string;
  label: string;
  line1: string;
  postcode: string;
  city: string;
  cityCode?: string;
  context?: string;
  coordinates: AddressCoordinates;
  score?: number;
  country: "France";
  provider: AddressProvider;
};

export type AddressSearchState = "idle" | "loading" | "success" | "empty" | "error";
