import { NextResponse } from "next/server";
import { sendPartnerLeadNotification } from "@/lib/email/mrh-emails";
import { createPartnerRequest } from "@/services/partner-request-service";
import type { PartnerRequestPayload } from "@/types/partner";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePayload(body: unknown): PartnerRequestPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Partial<PartnerRequestPayload>;

  if (
    typeof payload.firstName !== "string" ||
    payload.firstName.trim().length < 2 ||
    typeof payload.lastName !== "string" ||
    payload.lastName.trim().length < 2 ||
    typeof payload.company !== "string" ||
    payload.company.trim().length < 2 ||
    typeof payload.email !== "string" ||
    !isValidEmail(payload.email) ||
    typeof payload.orgType !== "string" ||
    payload.orgType.trim().length === 0
  ) {
    return null;
  }

  return {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    company: payload.company.trim(),
    email: payload.email.trim(),
    orgType: payload.orgType.trim(),
    message: typeof payload.message === "string" ? payload.message.trim() : ""
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload = validatePayload(body);

  if (!payload) {
    return NextResponse.json(
      { message: "Merci de compléter tous les champs obligatoires." },
      { status: 400 }
    );
  }

  try {
    console.info("[PartnerEmail] Internal notification requested", {
      email: payload.email,
      orgType: payload.orgType
    });
    await sendPartnerLeadNotification(payload);
    console.info("[PartnerEmail] Internal notification sent", {
      email: payload.email,
      orgType: payload.orgType
    });

    let partnerRequest = null;

    try {
      partnerRequest = await createPartnerRequest(payload);
    } catch (storageError) {
      console.error("[PartnerStorage] Persistence failed", {
        email: payload.email,
        orgType: payload.orgType,
        message:
          storageError instanceof Error
            ? storageError.message
            : "Impossible d'enregistrer la demande de démo."
      });
    }

    return NextResponse.json(
      {
        message: "Votre demande de démo a bien été envoyée.",
        partnerRequest
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PartnerEmail] Request failed", {
      email: payload.email,
      orgType: payload.orgType,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'e-mail de notification."
    });

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer la demande de démo."
      },
      { status: 502 }
    );
  }
}
