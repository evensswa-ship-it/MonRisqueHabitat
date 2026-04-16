import "server-only";

import { Resend } from "resend";

function getRequiredEnv(name: "RESEND_API_KEY" | "PARTNER_LEADS_TO" | "EMAIL_FROM" | "EMAIL_REPLY_TO") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante.`);
  }

  return value;
}

export function getResendClient() {
  return new Resend(getRequiredEnv("RESEND_API_KEY"));
}

export function getEmailConfig() {
  return {
    to: getRequiredEnv("PARTNER_LEADS_TO"),
    from: getRequiredEnv("EMAIL_FROM"),
    replyTo: getRequiredEnv("EMAIL_REPLY_TO")
  };
}
