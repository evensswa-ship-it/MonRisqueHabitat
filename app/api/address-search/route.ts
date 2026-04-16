import { NextResponse } from "next/server";
import { searchFrenchAddresses } from "@/lib/address/ban";

const MIN_QUERY_LENGTH = 3;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await searchFrenchAddresses(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "La recherche d'adresse est momentanément indisponible.";

    return NextResponse.json({ message }, { status: 502 });
  }
}
