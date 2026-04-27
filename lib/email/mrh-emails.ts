import "server-only";

import { buildRiskReportFilename, createRiskReportPdf } from "@/lib/risk-report-pdf";
import { getResendClient, getEmailConfig } from "@/lib/email/resend";
import type { AddressSuggestion } from "@/types/address";
import type { PartnerRequestPayload } from "@/types/partner";
import type { LeadProjectType, LeadRequestType } from "@/types/lead";
import type { RiskResult } from "@/types/risk";

type LeadNotificationInput = {
  name?: string;
  email: string;
  phone?: string;
  userType?: string;
  message?: string;
  analyzedAddress?: string;
  requestType?: LeadRequestType;
  riskSummary?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailShell(title: string, intro: string, rows: Array<{ label: string; value: string }>) {
  const renderedRows = rows
    .filter((row) => row.value.trim().length > 0)
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; width: 180px; vertical-align: top; color: #64748b; font-size: 13px; font-weight: 600;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 14px; line-height: 1.7;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="margin: 0; padding: 32px; background: #f8fbfe; font-family: Aptos, 'Segoe UI', Helvetica, Arial, sans-serif;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 32px;">
        <div style="margin-bottom: 24px;">
          <div style="color: #0f172a; font-size: 20px; font-weight: 700;">Mon Risque Habitat</div>
          <div style="margin-top: 4px; color: #94a3b8; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">by AGS &amp; Co</div>
        </div>
        <h1 style="margin: 0; color: #0f172a; font-size: 24px; line-height: 1.3;">${escapeHtml(title)}</h1>
        <p style="margin: 16px 0 0; color: #475569; font-size: 14px; line-height: 1.8;">
          ${escapeHtml(intro)}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
          <tbody>
            ${renderedRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildTextBody(title: string, intro: string, rows: Array<{ label: string; value: string }>) {
  const lines = [title, "", intro, ""];

  rows
    .filter((row) => row.value.trim().length > 0)
    .forEach((row) => {
      lines.push(`${row.label}: ${row.value}`);
    });

  lines.push("", "Mon Risque Habitat — by AGS & Co");

  return lines.join("\n");
}

function assertResendSuccess(response: { error?: { message?: string } | null }) {
  if (response.error) {
    throw new Error(response.error.message ?? "L'envoi d'e-mail a échoué.");
  }
}

function mapLeadProjectToUserType(project?: LeadProjectType) {
  if (project === "equiper-un-parcours-client") {
    return "Professionnel";
  }

  if (project === "preparer-un-devis") {
    return "Assurance";
  }

  if (project === "proteger-mon-logement" || project === "etre-accompagne") {
    return "Particulier";
  }

  return "";
}

function getLeadIntentLabel(requestType?: LeadRequestType) {
  if (requestType === "callback") {
    return "Demande de rappel";
  }

  if (requestType === "report_email") {
    return "Envoi du rapport";
  }

  return "Lead";
}

export async function sendInternalLeadNotification(input: LeadNotificationInput) {
  const resend = getResendClient();
  const config = getEmailConfig();
  const rows = [
    { label: "Type", value: getLeadIntentLabel(input.requestType) },
    { label: "Nom", value: input.name ?? "" },
    { label: "Email", value: input.email },
    { label: "Téléphone", value: input.phone ?? "" },
    { label: "Profil", value: input.userType ?? "" },
    { label: "Adresse analysée", value: input.analyzedAddress ?? "" },
    { label: "Résumé", value: input.riskSummary ?? "" },
    { label: "Message", value: input.message ?? "" }
  ];

  const title = "New MRH lead";
  const intro = "Un nouveau lead vient d'être transmis depuis Mon Risque Habitat.";

  const response = await resend.emails.send({
    from: config.from,
    to: config.to,
    replyTo: config.replyTo,
    subject: "New MRH lead",
    html: buildEmailShell(title, intro, rows),
    text: buildTextBody(title, intro, rows)
  });

  assertResendSuccess(response);
  return response;
}

export async function sendPartnerLeadNotification(payload: PartnerRequestPayload) {
  return sendInternalLeadNotification({
    name: `${payload.firstName} ${payload.lastName}`,
    email: payload.email,
    userType: payload.orgType,
    message: payload.message ?? "",
    requestType: "callback"
  });
}

export async function sendUserRiskReportEmail(
  email: string,
  firstName: string,
  address: AddressSuggestion,
  result: RiskResult
) {
  const resend = getResendClient();
  const config = getEmailConfig();
  const pdfBytes = await createRiskReportPdf(result);
  const filename = buildRiskReportFilename(result.address, result.analyzedAt);
  const introName = firstName.trim().length > 0 ? firstName.trim() : "Bonjour";
  const title = "Votre analyse Mon Risque Habitat";
  const intro =
    "Vous trouverez en pièce jointe votre rapport d'analyse. Ce document reprend les principaux points de vigilance identifiés pour l'adresse analysée.";

  const rows = [
    { label: "Adresse analysée", value: result.address },
    { label: "Niveau global", value: result.overallRisk.label },
    { label: "Lecture rapide", value: result.overallRisk.summary }
  ];

  const response = await resend.emails.send({
    from: config.from,
    to: email,
    replyTo: config.replyTo,
    subject: "Votre rapport Mon Risque Habitat",
    html: `
      <div style="margin: 0; padding: 32px; background: #f8fbfe; font-family: Aptos, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(148,163,184,0.18); border-radius: 24px; padding: 32px;">
          <div style="margin-bottom: 24px;">
            <div style="color: #0f172a; font-size: 20px; font-weight: 700;">Mon Risque Habitat</div>
            <div style="margin-top: 4px; color: #94a3b8; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">by AGS &amp; Co</div>
          </div>
          <p style="margin: 0; color: #0f172a; font-size: 14px; line-height: 1.8;">${escapeHtml(introName)},</p>
          <p style="margin: 16px 0 0; color: #475569; font-size: 14px; line-height: 1.8;">${escapeHtml(intro)}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      <td style="padding: 10px 0; width: 180px; vertical-align: top; color: #64748b; font-size: 13px; font-weight: 600;">
                        ${escapeHtml(row.label)}
                      </td>
                      <td style="padding: 10px 0; color: #0f172a; font-size: 14px; line-height: 1.7;">
                        ${escapeHtml(row.value)}
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          <p style="margin: 24px 0 0; color: #475569; font-size: 14px; line-height: 1.8;">
            Si vous souhaitez compléter cette analyse, vous pouvez répondre directement à cet e-mail.
          </p>
        </div>
      </div>
    `,
    text: [
      `Bonjour ${introName},`,
      "",
      intro,
      "",
      `Adresse analysée : ${result.address}`,
      `Niveau global : ${result.overallRisk.label}`,
      `Lecture rapide : ${result.overallRisk.summary}`,
      "",
      "Le rapport PDF est joint à cet e-mail.",
      "",
      "Mon Risque Habitat — by AGS & Co"
    ].join("\n"),
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBytes)
      }
    ]
  });

  assertResendSuccess(response);
  return response;
}

export function getLeadUserType(project?: LeadProjectType) {
  return mapLeadProjectToUserType(project);
}

export async function sendWaitlistNotification(input: {
  email: string;
  profession: string;
  message?: string;
}) {
  const resend = getResendClient();
  const config = getEmailConfig();

  const rows = [
    { label: "Email", value: input.email },
    { label: "Métier", value: input.profession },
    { label: "Message", value: input.message ?? "" },
  ];

  const title = "Nouvelle inscription waitlist — Assistant Conseil";
  const intro =
    "Un professionnel vient de s'inscrire sur la waitlist pour l'Assistant Conseil & Conformité.";

  const response = await resend.emails.send({
    from: config.from,
    to: config.to,
    replyTo: config.replyTo,
    subject: "Waitlist — Assistant Conseil & Conformité",
    html: buildEmailShell(title, intro, rows),
    text: buildTextBody(title, intro, rows),
  });

  assertResendSuccess(response);
  return response;
}
