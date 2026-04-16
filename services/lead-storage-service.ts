import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AddressSuggestion } from "@/types/address";
import type { LeadProjectType, LeadSubmission, LeadSubmissionPayload } from "@/types/lead";

type SupabaseLeadRow = {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  phone: string | null;
  project: string | null;
  consent: boolean;
  selected_address: AddressSuggestion;
  risk_summary_label: string;
  risk_takeaway: string;
};

const LEAD_COLUMNS = `
  id,
  created_at,
  first_name,
  email,
  phone,
  project,
  consent,
  selected_address,
  risk_summary_label,
  risk_takeaway
`;

function mapSupabaseRowToLeadSubmission(row: SupabaseLeadRow): LeadSubmission {
  return {
    id: row.id,
    createdAt: row.created_at,
    firstName: row.first_name,
    email: row.email,
    phone: row.phone ?? "",
    project: (row.project ?? "") as LeadProjectType,
    consent: row.consent,
    selectedAddress: row.selected_address,
    riskSummaryLabel: row.risk_summary_label,
    riskTakeaway: row.risk_takeaway
  };
}

function mapPayloadToSupabaseInsert(payload: LeadSubmissionPayload) {
  return {
    first_name: payload.firstName,
    email: payload.email,
    phone: payload.phone || null,
    project: payload.project || null,
    consent: payload.consent,
    selected_address: payload.selectedAddress,
    risk_summary_label: payload.riskSummaryLabel,
    risk_takeaway: payload.riskTakeaway
  };
}

export async function listLeadSubmissions() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Impossible de récupérer les demandes depuis Supabase.");
  }

  return ((data ?? []) as SupabaseLeadRow[]).map(mapSupabaseRowToLeadSubmission);
}

export async function createLeadSubmission(
  payload: LeadSubmissionPayload
): Promise<LeadSubmission> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .insert(mapPayloadToSupabaseInsert(payload))
    .select(LEAD_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Impossible d'enregistrer la demande dans Supabase.");
  }

  return mapSupabaseRowToLeadSubmission(data as SupabaseLeadRow);
}

export function formatLeadsAsCsv(leads: LeadSubmission[]) {
  const header = [
    "id",
    "createdAt",
    "firstName",
    "email",
    "phone",
    "project",
    "consent",
    "addressLabel",
    "postcode",
    "city",
    "riskSummaryLabel",
    "riskTakeaway"
  ];

  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.createdAt,
      lead.firstName,
      lead.email,
      lead.phone ?? "",
      lead.project ?? "",
      lead.consent ? "oui" : "non",
      lead.selectedAddress.label,
      lead.selectedAddress.postcode,
      lead.selectedAddress.city,
      lead.riskSummaryLabel,
      lead.riskTakeaway
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}
