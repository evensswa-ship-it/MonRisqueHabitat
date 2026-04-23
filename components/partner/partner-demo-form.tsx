"use client";

import { useMemo, useState } from "react";

type PartnerDemoValues = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  orgType: string;
  message: string;
};

const initialValues: PartnerDemoValues = {
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  orgType: "",
  message: ""
};

const orgTypes = [
  { value: "", label: "Sélectionner un type" },
  { value: "assureur", label: "Assureur" },
  { value: "courtier", label: "Courtier" },
  { value: "mutuelle", label: "Mutuelle" },
  { value: "reseau", label: "Réseau d'agences" },
  { value: "habitat", label: "Acteur de l'habitat" },
  { value: "autre", label: "Autre" }
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PartnerDemoForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const validationMessage = useMemo(() => {
    if (values.firstName.trim().length > 0 && values.firstName.trim().length < 2) {
      return "Saisissez un prénom valide.";
    }

    if (values.lastName.trim().length > 0 && values.lastName.trim().length < 2) {
      return "Saisissez un nom valide.";
    }

    if (values.email.trim().length > 0 && !isValidEmail(values.email.trim())) {
      return "Saisissez une adresse e-mail professionnelle valide.";
    }

    return "";
  }, [values.email, values.firstName, values.lastName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.firstName.trim().length < 2) {
      setStatus("error");
      setErrorMessage("Saisissez votre prénom.");
      return;
    }

    if (values.lastName.trim().length < 2) {
      setStatus("error");
      setErrorMessage("Saisissez votre nom.");
      return;
    }

    if (values.company.trim().length < 2) {
      setStatus("error");
      setErrorMessage("Saisissez le nom de votre société.");
      return;
    }

    if (!isValidEmail(values.email.trim())) {
      setStatus("error");
      setErrorMessage("Saisissez une adresse e-mail professionnelle valide.");
      return;
    }

    if (!values.orgType) {
      setStatus("error");
      setErrorMessage("Sélectionnez votre type de structure.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/b2b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          company: values.company,
          email: values.email,
          orgType: values.orgType,
          message: values.message
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Une erreur est survenue lors de l'envoi.");
      }

      setStatus("success");
      setValues(initialValues);
    } catch (submissionError) {
      setStatus("error");
      setErrorMessage(
        submissionError instanceof Error
          ? submissionError.message
          : "Une erreur est survenue lors de l'envoi."
      );
    }
  }

  return (
    <div className="panel-card reveal-up p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
        Demande de démo
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-slate-950">
        Parlons de votre projet.
      </h3>
      <p className="mt-4 text-sm leading-8 text-slate-600">
        Ce formulaire est réservé aux professionnels. Nous revenons vers vous sous 48 heures pour organiser un échange.
      </p>

      {status === "success" ? (
        <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Demande envoyée
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Merci. Nous revenons vers vous rapidement pour organiser la démo.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Prénom</span>
              <input
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
              <span className="text-sm font-semibold text-slate-700">Nom</span>
              <input
                type="text"
                value={values.lastName}
                onChange={(event) =>
                  setValues((current) => ({ ...current, lastName: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="Votre nom"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Société</span>
              <input
                type="text"
                value={values.company}
                onChange={(event) =>
                  setValues((current) => ({ ...current, company: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="Nom de votre structure"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email professionnel</span>
              <input
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
                placeholder="prenom.nom@entreprise.fr"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Type de structure</span>
            <select
              value={values.orgType}
              onChange={(event) =>
                setValues((current) => ({ ...current, orgType: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
            >
              {orgTypes.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Message <span className="text-slate-400">(optionnel)</span>
            </span>
            <textarea
              value={values.message}
              onChange={(event) =>
                setValues((current) => ({ ...current, message: event.target.value }))
              }
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100"
              placeholder="Votre cas d'usage, vos parcours actuels, votre calendrier..."
            />
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
            {status === "submitting" ? "Envoi en cours..." : "Envoyer ma demande"}
          </button>
          <p className="text-xs leading-6 text-slate-400">
            Pas de démarchage. Pas d'abonnement. Un échange sur votre projet.
          </p>
        </form>
      )}
    </div>
  );
}
