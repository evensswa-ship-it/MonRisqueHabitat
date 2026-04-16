import { NextResponse } from "next/server";
import { getGeorisquesRiskResult } from "@/lib/georisques/client";
import {
  getLeadUserType,
  sendInternalLeadNotification,
  sendUserRiskReportEmail
} from "@/lib/email/mrh-emails";
import { createLeadSubmission, listLeadSubmissions } from "@/services/lead-storage-service";
import type { LeadProjectType, LeadRequestType, LeadSubmissionPayload } from "@/types/lead";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidProject(value: unknown): value is LeadProjectType {
  return (
    value === "" ||
    value === "proteger-mon-logement" ||
    value === "preparer-un-devis" ||
    value === "etre-accompagne" ||
    value === "equiper-un-parcours-client"
  );
}

function isValidRequestType(value: unknown): value is LeadRequestType {
  return value === undefined || value === "report_email" || value === "callback";
}

function validatePayload(body: unknown): LeadSubmissionPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Partial<LeadSubmissionPayload>;

  if (
    typeof payload.firstName !== "string" ||
    payload.firstName.trim().length < 2 ||
    typeof payload.email !== "string" ||
    !isValidEmail(payload.email) ||
    typeof payload.consent !== "boolean" ||
    payload.consent !== true ||
    !payload.selectedAddress ||
    typeof payload.selectedAddress.label !== "string" ||
    typeof payload.selectedAddress.line1 !== "string" ||
    typeof payload.selectedAddress.postcode !== "string" ||
    typeof payload.selectedAddress.city !== "string" ||
    typeof payload.riskSummaryLabel !== "string" ||
    typeof payload.riskTakeaway !== "string"
  ) {
    return null;
  }

  if (!isValidProject(payload.project ?? "")) {
    return null;
  }

  if (!isValidRequestType(payload.requestType)) {
    return null;
  }

  return {
    firstName: payload.firstName.trim(),
    email: payload.email.trim(),
    phone: typeof payload.phone === "string" ? payload.phone.trim() : "",
    project: payload.project ?? "",
    requestType: payload.requestType ?? "report_email",
    consent: true,
    selectedAddress: payload.selectedAddress,
    riskSummaryLabel: payload.riskSummaryLabel.trim(),
    riskTakeaway: payload.riskTakeaway.trim()
  };
}

export async function GET() {
  try {
    const leads = await listLeadSubmissions();
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de récupérer les demandes."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload = validatePayload(body);

  if (!payload) {
    return NextResponse.json(
      { message: "Les informations saisies sont incompletes ou invalides." },
      { status: 400 }
    );
  }

  try {
    console.info("[LeadEmail] Internal notification requested", {
      email: payload.email,
      requestType: payload.requestType ?? "report_email",
      address: payload.selectedAddress.label
    });

    await sendInternalLeadNotification({
      name: payload.firstName,
      email: payload.email,
      phone: payload.phone,
      userType: getLeadUserType(payload.project),
      analyzedAddress: payload.selectedAddress.label,
      requestType: payload.requestType,
      riskSummary: payload.riskSummaryLabel
    });

    console.info("[LeadEmail] Internal notification sent", {
      email: payload.email,
      requestType: payload.requestType ?? "report_email"
    });

    if ((payload.requestType ?? "report_email") === "report_email") {
      console.info("[LeadEmail] User report email requested", {
        email: payload.email,
        address: payload.selectedAddress.label
      });
      const result = await getGeorisquesRiskResult(payload.selectedAddress);
      await sendUserRiskReportEmail(
        payload.email,
        payload.firstName,
        payload.selectedAddress,
        result
      );
      console.info("[LeadEmail] User report email sent", {
        email: payload.email,
        address: payload.selectedAddress.label
      });
    }

    let lead = null;

    try {
      lead = await createLeadSubmission(payload);
    } catch (storageError) {
      console.error("[LeadStorage] Persistence failed", {
        email: payload.email,
        address: payload.selectedAddress.label,
        message:
          storageError instanceof Error
            ? storageError.message
            : "Impossible d'enregistrer la demande."
      });
    }

    return NextResponse.json(
      {
        message:
          (payload.requestType ?? "report_email") === "report_email"
            ? "Votre demande a bien été reçue. Le rapport vous a été envoyé par e-mail."
            : "Votre demande a bien été reçue. Nous reviendrons vers vous rapidement.",
        lead
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[LeadEmail] Request failed", {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de traiter la demande."
    });

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer l'e-mail associé à cette demande."
      },
      { status: 502 }
    );
  }
}
