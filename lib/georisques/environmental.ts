import "server-only";

import { get as httpsGet } from "node:https";
import type { RiskCategory, RiskPriority } from "@/types/risk";

const TABULAR = "https://tabular-api.data.gouv.fr/api/resources";
const GEORISQUES_CARTO_ORIGIN = "https://www.georisques.gouv.fr";

function geoBase(): string {
  const base = process.env.GEORISQUES_API_BASE_URL ?? "https://georisques.gouv.fr/api/v2";
  return base.replace(/\/(gaspar|basias|basol|icpe|cavites|zonages_ppr).*$/, "");
}

function logEnv(id: string, url: string, status?: number, note?: string) {
  console.info(`[Env/${id}]`, url, status ? `→ ${status}` : "", note ?? "");
}

// Départements couverts par la base PROMÉTHÉE (bassin méditerranéen)
const PROMETHEE_DEPTS = new Set([
  "04", "06", "07", "11", "13", "26", "30", "34", "48", "66", "83", "84", "2A", "2B",
]);

function georisquesHeaders(): Record<string, string> {
  const token = process.env.GEORISQUES_API_TOKEN;
  const key = process.env.GEORISQUES_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (key) headers["X-Api-Key"] = key;
  return headers;
}

function geoParams(lat: number, lon: number, rayon: number): URLSearchParams {
  const p = new URLSearchParams();
  p.set("latitude", String(lat));
  p.set("longitude", String(lon));
  p.set("rayon", String(rayon));
  p.set("page", "1");
  p.set("page_size", "10");
  return p;
}

function geoV2Params(lat: number, lon: number, rayon: number, pageSize = 10): URLSearchParams {
  const p = new URLSearchParams();
  p.set("latitude", String(lat));
  p.set("longitude", String(lon));
  p.set("rayon", String(rayon));
  p.set("pageNumber", "0");
  p.set("pageSize", String(pageSize));
  return p;
}

function formatDist(meters: number | undefined): string {
  if (meters === undefined) return "à proximité";
  if (meters < 1000) return `à ${Math.round(meters)} m`;
  return `à ${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

function distanceMeters(fromLat: number, fromLon: number, toLat?: number, toLon?: number): number | undefined {
  if (toLat === undefined || toLon === undefined) return undefined;
  const earthRadius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type GeoV1Page<T> = {
  total?: number;
  data?: T[];
};

type GeoV2Page<T> = {
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  content?: T[];
};

// ── PPRI — Zonage réglementaire inondation ────────────────────────────────────

type PPRIZone = {
  lib_long?: string;
  lib_ppri?: string;
  nom_ppr?: string;
  type_ppr?: string;
  zone_lib?: string;
  zone_type?: string;
  libelle_zone?: string;
  libelle_reglement_standardise?: string;
  alea_libelle?: string;
};

function buildWmsFeatureInfoUrl(lat: number, lon: number, layer: string): URL {
  const delta = 0.01;
  const url = new URL(`${GEORISQUES_CARTO_ORIGIN}/services`);
  url.searchParams.set("language", "fre");
  url.searchParams.set("SERVICE", "WMS");
  url.searchParams.set("VERSION", "1.3.0");
  url.searchParams.set("REQUEST", "GetFeatureInfo");
  url.searchParams.set("LAYERS", layer);
  url.searchParams.set("STYLES", "");
  url.searchParams.set("FORMAT", "image/png");
  url.searchParams.set("QUERY_LAYERS", layer);
  url.searchParams.set("CRS", "EPSG:4326");
  url.searchParams.set("BBOX", `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`);
  url.searchParams.set("WIDTH", "101");
  url.searchParams.set("HEIGHT", "101");
  url.searchParams.set("I", "50");
  url.searchParams.set("J", "50");
  url.searchParams.set("INFO_FORMAT", "text/plain");
  url.searchParams.set("FEATURE_COUNT", "5");
  return url;
}

function parseWmsProperties(text: string): Record<string, string>[] {
  if (/Search returned no results/i.test(text)) return [];

  const records: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  for (const line of text.split(/\r?\n/)) {
    const featureMatch = line.match(/^\s*Layer ['"]?([^'"]+)['"]?/i);
    if (featureMatch) {
      if (current && Object.keys(current).length > 0) records.push(current);
      current = {};
      continue;
    }

    const propertyMatch = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*'?([^']*)'?\s*$/);
    if (propertyMatch && current) {
      current[propertyMatch[1]] = propertyMatch[2];
    }
  }

  if (current && Object.keys(current).length > 0) records.push(current);
  return records;
}

function fetchTextViaHttps(url: URL): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = httpsGet(
      url,
      {
        headers: {
          Accept: "text/plain",
          "User-Agent": "MonRisqueHabitat/1.0",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );

    request.setTimeout(10000, () => {
      request.destroy(new Error("Timeout lors de l'appel WMS Géorisques."));
    });
    request.on("error", reject);
  });
}

export async function fetchPPRI(lat: number, lon: number): Promise<RiskCategory | null> {
  try {
    const url = buildWmsFeatureInfoUrl(lat, lon, "PPRN_ZONE_INOND");

    const res = await fetchTextViaHttps(url);
    logEnv("ppri", url.toString(), res.status);
    if (res.status < 200 || res.status >= 300) { console.warn("[Env/ppri] body:", res.body); return null; }

    const zones = parseWmsProperties(res.body) as PPRIZone[];
    const total = zones.length;
    if (total === 0 || zones.length === 0) { logEnv("ppri", url.toString(), 200, "total=0"); return null; }

    const first = zones[0];
    const zoneName =
      first.libelle_zone ??
      first.libelle_reglement_standardise ??
      first.zone_lib ??
      first.zone_type ??
      "réglementée";
    const ppriName = first.nom_ppr ?? first.lib_long ?? first.lib_ppri ?? "PPR";
    const isRedZone = /rouge/i.test(zoneName);
    const priority: RiskPriority = isRedZone ? "high" : "medium";

    const territoryContext =
      `Le bien est situé en zone ${zoneName} du ${ppriName}.` +
      (total > 1 ? ` ${total} zonages réglementaires actifs sur ce secteur.` : "");

    return {
      id: "ppri",
      label: "Zonage réglementaire inondation",
      priority,
      decision: isRedZone
        ? "Zone rouge. Vérification obligatoire avant acquisition"
        : "Zone réglementée. Prescriptions à consulter en mairie",
      territoryContext,
      summary:
        "Ce bien est soumis à un Plan de Prévention des Risques inondation (PPRI). Le règlement du plan définit les constructions autorisées, les prescriptions obligatoires et peut influencer directement les conditions d'assurabilité et le montant des franchises.",
      recommendation:
        "Consultez le règlement du PPRI en mairie ou sur Géorisques. Identifiez le classement de zone et les prescriptions applicables au bien. En zone rouge, tout projet de travaux nécessite une vérification préalable au regard du règlement.",
      watch:
        "Le classement de zone (rouge, bleue, blanche), les prescriptions constructives imposées, les conditions de couverture assurantielle applicables et les éventuelles mesures de prévention à la charge du propriétaire.",
    };
  } catch (e) {
    console.error("[Env/ppri] exception:", e);
    return null;
  }
}

// ── Pollution des sols — BASIAS + BASOL ───────────────────────────────────────

type BASIASSite = {
  identifiant?: string;
  identifiantSsp?: string;
  identifiantBasias?: string;
  nom_usuel?: string;
  nom?: string;
  raison_sociale?: string;
  etat_site?: string;
  statut?: string;
  geom?: {
    coordinates?: [number, number];
  };
  distance?: number;
};

type BASOLSite = {
  numero_basol?: string;
  identifiantSsp?: string;
  nom_usuel?: string;
  nom?: string;
  etat?: string;
  geom?: {
    coordinates?: [number, number];
  };
  distance?: number;
};

type SSPPayload = {
  casias?: GeoV2Page<BASIASSite>;
  instructions?: GeoV2Page<BASOLSite>;
  conclusionsSis?: GeoV2Page<BASOLSite>;
  conclusionsSup?: GeoV2Page<BASOLSite>;
};

export async function fetchPollution(lat: number, lon: number): Promise<RiskCategory | null> {
  try {
    const base = geoBase();
    const url = new URL(`${base}/ssp`);
    geoV2Params(lat, lon, 500).forEach((v, k) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: georisquesHeaders(), cache: "no-store" });

    logEnv("ssp", url.toString(), res.status);
    if (!res.ok) { console.warn("[Env/ssp] body:", await res.text()); return null; }

    const body = (await res.json()) as SSPPayload;
    const basiasCount = body.casias?.totalElements ?? body.casias?.content?.length ?? 0;
    const basolCount =
      body.instructions?.totalElements ??
      body.instructions?.content?.length ??
      0;
    const sisCount = body.conclusionsSis?.totalElements ?? body.conclusionsSis?.content?.length ?? 0;
    const total = basiasCount + basolCount;
    if (total === 0 && sisCount === 0) { logEnv("pollution", url.toString(), 200, "total=0"); return null; }

    const hasConfirmedPollution = basolCount > 0 || sisCount > 0;
    const priority: RiskPriority = hasConfirmedPollution ? "high" : "medium";

    const parts: string[] = [];
    if (basolCount > 0)
      parts.push(`${basolCount} site${basolCount > 1 ? "s" : ""} BASOL (pollution confirmée)`);
    if (basiasCount > 0)
      parts.push(
        `${basiasCount} site${basiasCount > 1 ? "s" : ""} BASIAS (activité industrielle passée)`
      );
    if (sisCount > 0)
      parts.push(`${sisCount} secteur${sisCount > 1 ? "s" : ""} d'information sur les sols`);
    const territoryContext = `${parts.join(". ")} dans un rayon de 500 m.`;

    return {
      id: "pollution",
      label: "Pollution des sols",
      priority,
      decision: hasConfirmedPollution
        ? "Site pollué confirmé. Investigation de sol recommandée"
        : "Activité industrielle passée. Vérification conseillée",
      territoryContext,
      summary:
        "Des activités industrielles passées ou un site de pollution confirmée sont recensés à proximité du bien. La pollution des sols peut affecter la valeur vénale, restreindre la constructibilité et engager la responsabilité civile du propriétaire en cas de cession.",
      recommendation:
        "Consultez les fiches BASIAS et BASOL disponibles sur Géorisques. En présence d'un site BASOL, une étude de sol est recommandée avant toute acquisition ou projet de travaux. Vérifiez les clauses d'information dans l'acte notarié.",
      watch:
        "La présence de puits, sources ou jardins potagers à proximité, les variations de végétation inexpliquées, les odeurs inhabituelles et les clauses environnementales dans les actes de cession.",
    };
  } catch (e) {
    console.error("[Env/pollution] exception:", e);
    return null;
  }
}

// ── Cavités souterraines — BDCAVITE ──────────────────────────────────────────

type Cavite = {
  identifiant?: string;
  type?: string;
  nature?: string;
  distance?: number;
};

export async function fetchCavites(lat: number, lon: number): Promise<RiskCategory | null> {
  try {
    const url = new URL(`${geoBase()}/cavites`);
    geoParams(lat, lon, 200).forEach((v, k) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: georisquesHeaders(), cache: "no-store" });
    logEnv("cavites", url.toString(), res.status);
    if (!res.ok) { console.warn("[Env/cavites] body:", await res.text()); return null; }

    const body = (await res.json()) as GeoV1Page<Cavite>;
    const total = body.total ?? body.data?.length ?? 0;
    if (total === 0) { logEnv("cavites", url.toString(), 200, "total=0"); return null; }

    const sorted = [...(body.data ?? [])].sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
    );
    const closest = sorted[0];
    const dist = closest?.distance;
    const priority: RiskPriority = dist !== undefined && dist < 100 ? "high" : "medium";

    const types = [
      ...new Set(sorted.map((c) => c.type ?? c.nature).filter(Boolean)),
    ] as string[];
    const typeLabel =
      types.length > 0 ? ` (${types.slice(0, 2).join(", ").toLowerCase()})` : "";

    const territoryContext =
      `${total} cavité${total > 1 ? "s" : ""}${typeLabel} recensée${total > 1 ? "s" : ""} ${formatDist(dist)} du bien.`;

    return {
      id: "cavites",
      label: "Cavités souterraines",
      priority,
      decision:
        priority === "high"
          ? "Cavité très proche. Étude géotechnique impérative"
          : "Cavité recensée. Vérification avant tout projet de travaux",
      territoryContext,
      summary:
        "Des cavités souterraines sont recensées à proximité du bien : anciennes carrières, caves troglodytiques, karst ou effondrements naturels. Elles peuvent fragiliser les fondations et le sol environnant, en particulier lors de travaux de terrassement ou d'extension.",
      recommendation:
        "Vérifiez l'historique géotechnique du terrain auprès de la mairie ou d'un bureau d'études de sol. Si des travaux sont envisagés, une étude géotechnique préalable est impérative. Interrogez le vendeur sur tout affaissement ou fissuration observé.",
      watch:
        "Les fissures soudaines, les affaissements localisés, les zones humides inexpliquées, les décalages de dallage ou de fondation et toute déformation anormale des murs porteurs.",
    };
  } catch (e) {
    console.error("[Env/cavites] exception:", e);
    return null;
  }
}

// ── Risques technologiques — ICPE / SEVESO ────────────────────────────────────

type ICPEInstallation = {
  code_s3ic?: string;
  codeAIOT?: string;
  nom_etablissement?: string;
  raisonSociale?: string;
  seveso?: string;
  statutSeveso?: string | null;
  lib_seveso?: string;
  distance?: number;
  etat_activite?: string;
  etatActivite?: string | null;
  longitude?: number;
  latitude?: number;
};

function isSeveso(installation: ICPEInstallation): boolean {
  const s = (installation.statutSeveso ?? installation.seveso ?? installation.lib_seveso ?? "").toLowerCase();
  return s !== "" && s !== "ns" && !s.includes("non seveso") && !s.includes("non-seveso");
}

function isSevesoHaut(installation: ICPEInstallation): boolean {
  const s = (installation.statutSeveso ?? installation.seveso ?? installation.lib_seveso ?? "").toLowerCase();
  return s === "as" || s.includes("seuil haut") || s.includes("haut");
}

export async function fetchICPE(lat: number, lon: number): Promise<RiskCategory | null> {
  try {
    const url = new URL(`${geoBase()}/installations_classees`);
    geoV2Params(lat, lon, 2000).forEach((v, k) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: georisquesHeaders(), cache: "no-store" });
    logEnv("icpe", url.toString(), res.status);
    if (!res.ok) { console.warn("[Env/icpe] body:", await res.text()); return null; }

    const body = (await res.json()) as GeoV2Page<ICPEInstallation>;
    const total = body.totalElements ?? body.content?.length ?? 0;
    if (total === 0) { logEnv("icpe", url.toString(), 200, "total=0"); return null; }

    const installations = (body.content ?? [])
      .map((installation) => ({
        ...installation,
        distance:
          installation.distance ??
          distanceMeters(lat, lon, installation.latitude, installation.longitude),
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    const sevesoHaut = installations.filter(isSevesoHaut);
    const sevesoAll = installations.filter(isSeveso);
    const sevesoBasCount = sevesoAll.length - sevesoHaut.length;

    const priority: RiskPriority =
      sevesoHaut.length > 0 ? "high" : sevesoAll.length > 0 ? "medium" : "low";

    const closestDist = installations[0]?.distance;

    const parts: string[] = [];
    if (sevesoHaut.length > 0)
      parts.push(`${sevesoHaut.length} SEVESO seuil haut`);
    if (sevesoBasCount > 0)
      parts.push(`${sevesoBasCount} SEVESO seuil bas`);
    const nonSeveso = total - sevesoAll.length;
    if (nonSeveso > 0)
      parts.push(`${nonSeveso} ICPE classée${nonSeveso > 1 ? "s" : ""}`);
    const distLabel = closestDist !== undefined ? `. Plus proche : ${formatDist(closestDist)}` : "";
    const territoryContext = `${parts.join(", ")} dans un rayon de 2 km${distLabel}.`;

    return {
      id: "icpe",
      label: "Risques technologiques",
      priority,
      decision:
        sevesoHaut.length > 0
          ? "Site SEVESO seuil haut. Consultation du PPRT obligatoire"
          : sevesoAll.length > 0
          ? "Site SEVESO à proximité. Vérifier le périmètre d'exposition"
          : "Établissements classés recensés. Impact limité hors périmètre PPRT",
      territoryContext,
      summary:
        "Des installations classées pour la protection de l'environnement (ICPE) sont recensées dans le périmètre du bien, dont potentiellement des sites SEVESO. Ces établissements peuvent présenter des risques d'accident industriel majeur : explosion, incendie ou rejet toxique. Ils sont encadrés par des plans d'urgence dédiés.",
      recommendation:
        "Consultez le Plan de Prévention des Risques Technologiques (PPRT) de la commune si un site SEVESO est présent. Vérifiez si le bien se situe dans un périmètre réglementé et les conditions d'assurabilité qui en découlent.",
      watch:
        "Les Plans Particuliers d'Intervention (PPI) de la mairie, le périmètre réglementaire du PPRT, les servitudes d'utilité publique associées et les prescriptions constructives applicables dans la zone.",
    };
  } catch (e) {
    console.error("[Env/icpe] exception:", e);
    return null;
  }
}

// ── Historique incendies — PROMÉTHÉE ─────────────────────────────────────────
// Nécessite la variable d'environnement PROMETHEE_RESOURCE_ID (ID de ressource
// tabular data.gouv.fr pour le dataset commune Prométhée).

type PrometheeRecord = {
  code_commune?: string;
  nb_feux?: number | string;
  surface_totale?: number | string;
  annee_debut?: number | string;
  annee_fin?: number | string;
};

function getDeptCode(cityCode: string): string {
  // Codes Corse : 2A / 2B
  if (cityCode.startsWith("2A") || cityCode.startsWith("2B")) return cityCode.slice(0, 2);
  return cityCode.slice(0, 2);
}

export async function fetchPromethee(
  cityCode: string | undefined
): Promise<RiskCategory | null> {
  if (!cityCode) return null;

  const dept = getDeptCode(cityCode);
  if (!PROMETHEE_DEPTS.has(dept)) return null;

  const resourceId = process.env.PROMETHEE_RESOURCE_ID;
  if (!resourceId) return null;

  try {
    const url = new URL(`${TABULAR}/${resourceId}/data/`);
    url.searchParams.set("code_commune__exact", cityCode);
    url.searchParams.set("page", "1");
    url.searchParams.set("page_size", "1");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { data?: PrometheeRecord[]; total?: number };
    const record = body.data?.[0];
    if (!record) return null;

    const nbFeux = Number(record.nb_feux ?? 0);
    if (nbFeux === 0) return null;

    const surface = Number(record.surface_totale ?? 0);
    const anneeDebut = record.annee_debut ?? "";
    const anneeFin = record.annee_fin ?? "";

    const priority: RiskPriority = nbFeux >= 5 ? "high" : nbFeux >= 2 ? "medium" : "low";

    const periodLabel =
      anneeDebut && anneeFin ? ` entre ${anneeDebut} et ${anneeFin}` : "";
    const surfaceLabel =
      surface > 0 ? `. ${Math.round(surface).toLocaleString("fr-FR")} ha brûlés` : "";
    const territoryContext =
      `${nbFeux} incendie${nbFeux > 1 ? "s" : ""} recensé${nbFeux > 1 ? "s" : ""} sur la commune${periodLabel}${surfaceLabel} (source Prométhée).`;

    return {
      id: "promethee",
      label: "Historique incendies de forêt",
      priority,
      decision:
        priority === "high"
          ? "Commune fortement concernée. Vigilance renforcée"
          : "Antécédents d'incendies recensés sur la commune",
      territoryContext,
      summary:
        "La commune présente un historique d'incendies de forêt enregistré dans la base PROMÉTHÉE, référence du suivi des feux en région méditerranéenne. Cet historique constitue un signal structurel pour les biens en interface forêt-habitat, au-delà de la simple classification réglementaire.",
      recommendation:
        "Vérifiez les obligations légales de débroussaillement (OLD) applicables au bien. Assurez-vous que les accès restent dégagés pour les services de secours. En zone à fort historique, la souscription d'une couverture incendie de forêt peut faire l'objet d'une déclaration spécifique auprès de l'assureur.",
      watch:
        "La végétation à moins de 50 m du bien, le respect des obligations de débroussaillement, les matériaux exposés en façade et toiture, et les conditions tarifaires de l'assurance habitation en zone exposée.",
    };
  } catch {
    return null;
  }
}
