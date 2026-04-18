# Mon Risque Habitat

Application Next.js de lecture simplifiée du risque habitat.

MRH transforme des données publiques techniques en informations lisibles, calmes et actionnables pour :
- professionnels de l'immobilier
- professionnels de l'assurance
- acheteurs et investisseurs particuliers

Le produit reste volontairement simple :
- pas de tableau de bord technique
- pas d'exposition de données brutes
- pas de logique d'assurance
- pas de mock dans les flux principaux

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Resend
- PDF-lib

## Ce Que Fait L'App

Le parcours principal repose sur 4 briques :

1. recherche d'adresse France via IGN / Géoplateforme
2. analyse de risque réelle via Géorisques
3. enrichissement territorial léger via données publiques complémentaires
4. capture de leads + envoi d'e-mails + stockage Supabase

## Architecture

Principales zones du projet :

- `app/page.tsx` : landing et parcours principal
- `components/widget/` : widget d'analyse, résultat, formulaires, cartes risque
- `app/api/address-search/route.ts` : proxy recherche d'adresse
- `app/api/risk-preview/route.ts` : génération du diagnostic
- `app/api/risk-report/route.ts` : génération du PDF
- `app/api/leads/route.ts` : leads particuliers, demandes de rappel, envoi rapport e-mail
- `app/api/b2b/route.ts` : demandes de démo partenaires
- `lib/georisques/client.ts` : récupération et transformation des données risques
- `lib/territory-context.ts` : enrichissement contextuel territorial
- `lib/email/` : envoi d'e-mails via Resend
- `services/lead-storage-service.ts` : stockage et lecture des leads Supabase
- `services/partner-request-service.ts` : stockage des demandes partenaires
- `supabase/` : schémas SQL à exécuter dans Supabase

## Flux Fonctionnels

### 1. Recherche d'adresse

Le front interroge :
- `services/address-search-service.ts`

Cette couche appelle :
- `GET /api/address-search`

La route appelle ensuite :
- `lib/address/ban.ts`

La recherche repose sur l'API officielle IGN / Géoplateforme.
L'utilisateur ne saisit pas une adresse libre stockée telle quelle : il choisit une suggestion officielle.

### 2. Analyse de risque

Le widget appelle :
- `POST /api/risk-preview`

La route :
- valide l'adresse sélectionnée
- vérifie la présence de la configuration Géorisques
- appelle `lib/georisques/client.ts`

Le client Géorisques :
- interroge l'API réelle avec latitude / longitude
- extrait les aléas utiles
- les mappe vers des catégories MRH compréhensibles
- calcule un niveau global
- enrichit le résultat avec un peu de contexte territorial

### 3. Rapport PDF

Le widget peut déclencher :
- `POST /api/risk-report`

La route :
- relance une analyse réelle de l'adresse
- génère un PDF côté serveur
- retourne le fichier en téléchargement

Le PDF n'est pas stocké dans Supabase.

### 4. Leads et e-mails

Deux flux principaux existent :

- `POST /api/leads`
- `POST /api/b2b`

`/api/leads` couvre :
- demande d'envoi du rapport par e-mail
- demande de rappel

`/api/b2b` couvre :
- demande de démo partenaire

Les e-mails partent via Resend, côté serveur uniquement.

## Sources De Données

### Sources principales

- IGN / Géoplateforme : recherche d'adresse
- Géorisques : exposition aux risques
- `geo.api.gouv.fr` : contexte communal léger
- IGN altimétrie : contexte topographique léger

### Principe produit

MRH n'affiche pas les données brutes.

Exemple de logique suivie :
- au lieu d'afficher une mesure ou un code brut, MRH produit une phrase courte
- au lieu d'exposer un type de sol tel quel, MRH reformule l'impact possible sur le bâti

## Comment Est Gérée La Qualité Des Données

La qualité des données est gérée à plusieurs niveaux.

### 1. Sélection d'adresse contrôlée

L'utilisateur doit sélectionner une adresse réelle issue de la liste de suggestions.
Cela réduit fortement :
- fautes de saisie
- adresses ambiguës
- coordonnées incohérentes

### 2. Validation serveur

Les routes API revalident les payloads.

Exemples de vérifications :
- prénom minimal
- e-mail valide
- consentement
- structure complète de l'adresse
- projet autorisé
- type de demande autorisé

### 3. Donnée publique réelle uniquement

Les flux principaux reposent sur des APIs publiques réelles :
- adresse
- Géorisques
- contexte territorial

Le moteur ne bascule pas vers une donnée mockée en silence.

### 4. Simplification maîtrisée

Le produit interprète les retours bruts pour rester lisible.
Cette simplification est volontaire et assumée.

Elle améliore :
- lisibilité
- usage commercial
- compréhension rapide

Elle implique aussi une limite :
- MRH donne une lecture d'aide à la décision
- MRH ne remplace pas une expertise technique complète

### 5. Robustesse des enrichissements

Les enrichissements territoriaux complémentaires sont non bloquants.

Si une source secondaire échoue :
- le diagnostic principal continue
- l'erreur est journalisée côté serveur
- l'UX reste simple

## Score Global

Le score global est une couche d'interprétation simple.

Logique actuelle :
- risque `high` = 4 points
- risque `medium` = 2 points
- risque `low` = 1 point
- bonus de cumul = `+1` si au moins 3 risques sont présents

Seuils :
- `Élevé` si au moins 2 risques élevés ou score total `>= 6`
- `Modéré` si au moins 1 risque élevé, ou au moins 2 risques modérés, ou score total `>= 3`
- `Faible` sinon

Le score numérique reste interne.
L'interface expose surtout :
- `Faible`
- `Modéré`
- `Élevé`

## Stockage

Supabase est utilisé pour le stockage commercial et l'exploitation interne.

### Tables réellement utilisées

- `public.leads`
- `public.partner_requests`

### Ce qui n'est pas stocké dans Supabase

- les résultats de risque détaillés
- les PDF
- les appels adresse
- les réponses Géorisques brutes
- les e-mails envoyés

### Pourquoi ce choix

Le produit privilégie aujourd'hui :
- simplicité
- fiabilité de réception des demandes
- faible complexité de maintenance

et non :
- historisation exhaustive
- audit métier détaillé
- entrepôt analytique

## Tables Supabase Nécessaires

Si seule la table `leads` existe aujourd'hui dans ton projet Supabase, la table manquante à créer pour l'app actuelle est :

- `public.partner_requests`

### SQL à exécuter pour `partner_requests`

```sql
create extension if not exists pgcrypto;

create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(trim(first_name)) >= 2),
  last_name text not null check (char_length(trim(last_name)) >= 2),
  company text not null check (char_length(trim(company)) >= 2),
  email text not null check (position('@' in email) > 1),
  org_type text not null,
  message text
);

create index if not exists partner_requests_created_at_idx
on public.partner_requests (created_at desc);

alter table public.partner_requests enable row level security;

drop policy if exists "Allow public partner request insert" on public.partner_requests;
create policy "Allow public partner request insert"
on public.partner_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow authenticated partner request read" on public.partner_requests;
create policy "Allow authenticated partner request read"
on public.partner_requests
for select
to authenticated
using (true);
```

### SQL existant pour `leads`

Le projet contient déjà :
- `supabase/leads.sql`

### Schémas présents dans le repo

- [supabase/leads.sql](./supabase/leads.sql)
- [supabase/partner-requests.sql](./supabase/partner-requests.sql)

## Fonctionnement Du Stockage

### Leads particuliers

Le flux `POST /api/leads` :
- valide les données
- envoie les e-mails
- tente ensuite de persister la demande dans `public.leads`

Le stockage contient :
- identité de contact
- e-mail
- téléphone éventuel
- projet éventuel
- consentement
- adresse choisie en `jsonb`
- résumé du risque
- takeaway

### Demandes partenaires

Le flux `POST /api/b2b` :
- valide les données
- envoie l'e-mail de notification
- tente ensuite la persistance dans `public.partner_requests`

Le stockage contient :
- prénom
- nom
- société
- e-mail
- type d'organisation
- message éventuel

## Limites Supabase : À Partir De Combien De Requêtes ?

### Réponse courte

Avec l'usage actuel de MRH, tu ne risques pas de saturer Supabase sur quelques milliers ou dizaines de milliers de leads.

Le vrai plafond vient surtout de la taille de base.

### Référence officielle Supabase

Au moment de cette documentation, les quotas Free mentionnés par Supabase sont de l'ordre de :
- base de données : `500 MB` par projet
- egress : `5 GB`
- storage : `1 GB`

Ces quotas peuvent évoluer.
Vérifie toujours la page officielle Supabase avant arbitrage final :
- https://supabase.com/docs/guides/platform/billing-on-supabase

### Estimation pratique pour MRH

Ordre de grandeur moyen :
- 1 ligne `leads` : environ `2 à 3 KB`
- 1 ligne `partner_requests` : environ `1 à 2 KB`

Donc, très approximativement :
- `500 MB / 2 KB` = environ `250 000` leads
- `500 MB / 3 KB` = environ `170 000` leads

Lecture simple :
- tu commenceras plutôt à t'approcher du plafond base autour de `170k à 250k` leads stockés
- pour `partner_requests`, le plafond est encore plus loin

### Ce que cela veut dire concrètement

Tu n'atteindras pas la limite avec :
- 1 000 leads
- 10 000 leads
- 50 000 leads

Tu commenceras à te poser la question sérieusement si tu arrives à des volumes de l'ordre de :
- plusieurs centaines de milliers d'insertions cumulées

### Ce qui consomme vraiment

Consomme la base :
- chaque `POST /api/leads`
- chaque `POST /api/b2b`

Ne gonfle presque pas la base :
- consultation de la page `/review`
- export CSV
- lecture de leads

### Ce qui peut devenir limitant avant la base

Selon ton usage, avant même la taille SQL, tu peux rencontrer :
- quotas API tiers
- limites d'e-mails Resend
- coût de build / exécution côté Vercel

## Variables D'Environnement

Variables réellement utilisées dans le projet :

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Géorisques

- `GEORISQUES_API_BASE_URL`
- `GEORISQUES_API_TOKEN`
- `GEORISQUES_API_KEY` optionnelle

### E-mail

- `RESEND_API_KEY`
- `PARTNER_LEADS_TO`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

### Adresse

- `ADDRESS_API_URL`
- `ADDRESS_SEARCH_LIMIT`
- `NEXT_PUBLIC_ADDRESS_API_URL`
- `NEXT_PUBLIC_ADDRESS_SEARCH_LIMIT`

### PDF / UI

- `MRH_PDF_LOGO_PATH`
- `NEXT_PUBLIC_FEATURE_NEARBY_PARTNERS`

## Mise En Place Supabase

1. créer un projet Supabase
2. récupérer l'URL du projet et la publishable key
3. copier `.env.example` vers `.env.local`
4. renseigner les variables nécessaires
5. ouvrir `SQL Editor`
6. exécuter `supabase/leads.sql`
7. exécuter `supabase/partner-requests.sql`
8. vérifier l'existence des tables
9. vérifier les policies RLS

## Vérifications Conseillées

### Vérification fonctionnelle minimale

1. rechercher une adresse
2. lancer un diagnostic
3. demander un rapport par e-mail
4. soumettre une demande de rappel
5. soumettre une demande de démo partenaire
6. vérifier les lignes dans Supabase
7. vérifier la page `/review`
8. vérifier l'export CSV

### Vérification stockage

Dans Supabase, contrôler :
- `public.leads`
- `public.partner_requests`
- les policies RLS actives
- l'évolution de la taille de base si le volume augmente

## Limites Actuelles Du Design Technique

Le design actuel est volontairement simple, mais il a quelques limites :

- pas d'archivage des e-mails envoyés
- pas de statut de traitement commercial
- pas de table de diagnostics historisés
- pas de séparation forte entre lecture interne et exposition publique dans `leads`
- persistance SQL secondaire après notification e-mail dans certains flux

Ce choix est cohérent avec l'état actuel du produit :
- rapide à déployer
- simple à maintenir
- suffisant pour un lancement initial

## Résumé Exploitation

Pour faire tourner l'app aujourd'hui, il faut :

- les variables d'environnement
- la table `public.leads`
- la table `public.partner_requests`
- un token Géorisques valide
- une clé Resend valide

Et pour la partie base de données :
- tu n'as pas besoin d'autres tables que `leads` et `partner_requests` pour l'état actuel du code

