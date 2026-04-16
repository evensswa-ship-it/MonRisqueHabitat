import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PartnerRequest, PartnerRequestPayload } from "@/types/partner";

type SupabasePartnerRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  org_type: string;
  message: string | null;
};

const PARTNER_COLUMNS = `
  id,
  created_at,
  first_name,
  last_name,
  company,
  email,
  org_type,
  message
`;

function mapSupabaseRowToPartnerRequest(row: SupabasePartnerRow): PartnerRequest {
  return {
    id: row.id,
    createdAt: row.created_at,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    email: row.email,
    orgType: row.org_type,
    message: row.message ?? ""
  };
}

function mapPayloadToSupabaseInsert(payload: PartnerRequestPayload) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    company: payload.company,
    email: payload.email,
    org_type: payload.orgType,
    message: payload.message || null
  };
}

export async function createPartnerRequest(
  payload: PartnerRequestPayload
): Promise<PartnerRequest> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("partner_requests")
    .insert(mapPayloadToSupabaseInsert(payload))
    .select(PARTNER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error("Impossible d'enregistrer la demande de démo.");
  }

  return mapSupabaseRowToPartnerRequest(data as SupabasePartnerRow);
}
