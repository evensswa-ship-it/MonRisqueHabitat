import type { AddressSuggestion } from "@/types/address";

export type LeadProjectType =
  | ""
  | "archiver-synthese-dda"
  | "preparer-entretien-client"
  | "qualifier-avant-devis"
  | "equiper-parcours-courtage";

export type LeadRequestType = "report_email" | "callback";

export type LeadFormValues = {
  firstName: string;
  email: string;
  phone: string;
  project: LeadProjectType;
  consent: boolean;
};

export type LeadSubmission = {
  id: string;
  createdAt: string;
  firstName: string;
  email: string;
  phone?: string;
  project?: LeadProjectType;
  consent: boolean;
  selectedAddress: AddressSuggestion;
  riskSummaryLabel: string;
  riskTakeaway: string;
};

export type LeadSubmissionPayload = {
  firstName: string;
  email: string;
  phone?: string;
  project?: LeadProjectType;
  requestType?: LeadRequestType;
  consent: boolean;
  selectedAddress: AddressSuggestion;
  riskSummaryLabel: string;
  riskTakeaway: string;
};

export type LeadFormStatus = "idle" | "submitting" | "success" | "error";
