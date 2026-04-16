import { ExportActions } from "@/components/review/export-actions";
import { listLeadSubmissions } from "@/services/lead-storage-service";
import type { LeadSubmission } from "@/types/lead";

export default async function ReviewPage() {
  let leads: LeadSubmission[] = [];
  let loadError = "";

  try {
    leads = await listLeadSubmissions();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Impossible de récupérer les demandes depuis Supabase.";
  }

  const jsonExport = JSON.stringify(leads, null, 2);

  return (
    <main className="pb-12 pt-6">
      <div className="shell">
        <div className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                Espace interne
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">
                Leads Mon Risque Habitat
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Consultez les demandes reçues, les adresses sélectionnées et exportez les données pour un usage commercial ou de démonstration.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {leads.length} demande{leads.length > 1 ? "s" : ""}
            </div>
          </div>

          <div className="mt-6">
            <ExportActions csvUrl="/api/leads/export" json={jsonExport} />
          </div>

          {loadError && (
            <div className="mt-6 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {loadError}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Date</th>
                    <th className="px-4 py-4 font-semibold">Prénom</th>
                    <th className="px-4 py-4 font-semibold">Email</th>
                    <th className="px-4 py-4 font-semibold">Téléphone</th>
                    <th className="px-4 py-4 font-semibold">Projet</th>
                    <th className="px-4 py-4 font-semibold">Adresse</th>
                    <th className="px-4 py-4 font-semibold">Résumé</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Aucune demande enregistrée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-4 text-slate-600">
                          {new Date(lead.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {lead.firstName}
                        </td>
                        <td className="px-4 py-4 text-slate-700">{lead.email}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {lead.phone || "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {lead.project || "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <div>{lead.selectedAddress.line1}</div>
                          <div className="text-slate-500">
                            {lead.selectedAddress.postcode} {lead.selectedAddress.city}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <div className="font-semibold text-slate-900">
                            {lead.riskSummaryLabel}
                          </div>
                          <div className="mt-1 max-w-sm">{lead.riskTakeaway}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">Export brut</p>
            <textarea
              readOnly
              value={jsonExport}
              className="mt-3 h-48 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-xs leading-6 text-slate-700 outline-none"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
