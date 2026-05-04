"use client";

import { useMemo, useState } from "react";
import type { AddressSuggestion } from "@/types/address";
import type { RiskResult } from "@/types/risk";
import type {
  LeadFormStatus,
  LeadFormValues,
  LeadProjectType,
  LeadRequestType
} from "@/types/lead";

type LeadCaptureFormProps = {
  selectedAddress: AddressSuggestion;
  result: RiskResult;
};

const initialValues: LeadFormValues = {
  firstName: "",
  email: "",
  phone: "",
  project: "",
  consent: false
};

const projectOptions: Array<{ value: LeadProjectType; label: string }> = [
  { value: "", label: "Choisir un sujet" },
  { value: "archiver-synthese-dda", label: "Archiver une synthèse DDA" },
  { value: "preparer-entretien-client", label: "Préparer un entretien client" },
  { value: "qualifier-avant-devis", label: "Qualifier un risque avant devis" },
  { value: "equiper-parcours-courtage", label: "Équiper un parcours courtage" }
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LeadCaptureForm({ selectedAddress, result }: LeadCaptureFormProps) {
  const [values, setValues] = useState<LeadFormValues>(initialValues);
  const [status, setStatus] = useState<LeadFormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");

  const validationMessage = useMemo(() => {
    if (values.firstName.trim().length > 0 && values.firstName.trim().length < 2) {
      return "Saisissez un prénom valide.";
    }

    if (values.email.trim().length > 0 && !isValidEmail(values.email.trim())) {
      return "Saisissez une adresse e-mail valide.";
    }

    if (!values.consent && status === "error") {
      return "Veuillez accepter le traitement de votre demande.";
    }

    return "";
  }, [status, values.consent, values.email, values.firstName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.firstName.trim().length < 2) {
      setStatus("error");
      setErrorMessage("Saisissez votre prénom.");
      return;
    }

    if (!isValidEmail(values.email.trim())) {
      setStatus("error");
      setErrorMessage("Saisissez une adresse e-mail valide.");
      return;
    }

    if (!values.consent) {
      setStatus("error");
      setErrorMessage("Veuillez accepter le traitement de votre demande.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    setLastSubmittedEmail(values.email.trim());

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: values.firstName,
          email: values.email,
          phone: values.phone,
          project: values.project,
          requestType: "report_email" satisfies LeadRequestType,
          consent: values.consent,
          selectedAddress,
          riskSummaryLabel: result.overallRisk.label,
          riskTakeaway: result.overallRisk.takeaway
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(
          payload.message ?? "Une erreur est survenue lors de l'enregistrement."
        );
      }

      setStatus("success");
      setValues(initialValues);
    } catch (submissionError) {
      setStatus("error");
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : "Une erreur est survenue lors de l'enregistrement."
      );
    }
  }

  return (
    <div className="panel-card p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
        Garder une trace
      </p>
      <h4 className="mt-3 text-2xl font-semibold text-slate-950">
        Recevez l'analyse et préparez la synthèse DDA.
      </h4>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Recevez le rapport par e-mail pour l'archiver, le relire avec votre client ou préparer votre compte rendu post-RDV. Mon Risque Habitat ne vend pas d'assurance.
      </p>

      {status === "success" ? (
        <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Demande envoyée
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Votre rapport a été envoyé à <strong>{lastSubmittedEmail}</strong> pour{" "}
            <strong>{selectedAddress.label}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Prénom</span>
              <input
                id="lead-first-name"
                name="firstName"
                type="text"
                value={values.firstName}
                onChange={(event) =>
                  setValues((current) => ({ ...current, firstName: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="Votre prénom"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">E-mail</span>
              <input
                id="lead-email"
                name="email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="vous@exemple.fr"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Téléphone
                <span className="ml-1 font-normal text-slate-400">(optionnel, si vous souhaitez être recontacté)</span>
              </span>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={(event) =>
                  setValues((current) => ({ ...current, phone: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="06 00 00 00 00"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Projet
                <span className="ml-1 font-normal text-slate-400">(optionnel)</span>
              </span>
              <select
                id="lead-project"
                name="project"
                value={values.project}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    project: event.target.value as LeadProjectType
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
              >
                {projectOptions.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
            <input
              id="lead-consent"
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={(event) =>
                setValues((current) => ({ ...current, consent: event.target.checked }))
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
            />
            <span className="text-sm leading-7 text-slate-600">
              J'accepte le traitement de cette demande et, si j'ai laissé un téléphone, d'être recontacté à ce sujet.
            </span>
          </label>

          {(errorMessage || validationMessage) && (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage || validationMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="cta-primary cta-lg disabled:cursor-wait disabled:opacity-70"
          >
            {status === "submitting"
              ? "Envoi en cours…"
              : "Recevoir l'analyse par e-mail"}
          </button>
        </form>
      )}
    </div>
  );
}
