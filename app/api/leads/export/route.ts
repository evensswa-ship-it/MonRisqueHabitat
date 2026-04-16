import { NextResponse } from "next/server";
import { formatLeadsAsCsv, listLeadSubmissions } from "@/services/lead-storage-service";

export async function GET() {
  try {
    const leads = await listLeadSubmissions();
    const csv = formatLeadsAsCsv(leads);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mon-risque-habitat-leads.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'exporter les demandes."
      },
      { status: 500 }
    );
  }
}
