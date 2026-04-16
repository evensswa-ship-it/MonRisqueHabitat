# MonRisqueHabitat

Prototype frontend Next.js d'un widget embarquable de prevention des risques habitation pour assureurs, courtiers et parcours d'assurance habitation.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase

## Installation locale

1. Installer les dependances

```bash
npm install
```

2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Renseigner ensuite les valeurs Supabase dans `.env.local`.

3. Lancer le serveur de developpement

```bash
npm run dev
```

4. Ouvrir l'application dans le navigateur

```text
http://localhost:3000
```

## Variables d'environnement

Variables requises :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Variable non utilisee dans ce MVP :

- `SUPABASE_SERVICE_ROLE_KEY`

Ne la configurez pas dans le frontend et ne l'exposez jamais au navigateur.

Le projet contient :

- `.env.example` : modele a copier
- `.env.local` : configuration locale actuelle

## Supabase

### Packages utilises

- `@supabase/supabase-js`
- `@supabase/ssr`

### Helpers clients

- `lib/supabase/client.ts` : client navigateur
- `lib/supabase/server.ts` : client serveur SSR / routes API
- `lib/supabase/config.ts` : lecture des variables d'environnement

### Stockage des leads

Les leads sont maintenant stockes dans Supabase via :

- `services/lead-storage-service.ts`

Le stockage JSON local n'est plus utilise.
Le fichier `data/storage/leads.json` peut rester present en archive locale, mais il n'est plus lu par l'application.

### Routes API

- `POST /api/leads` : insertion d'un lead dans `public.leads`
- `GET /api/leads` : lecture des leads
- `GET /api/leads/export` : export CSV

### Page interne

La page suivante lit les leads depuis Supabase :

```text
http://localhost:3000/review
```

## Table Supabase requise

Le schema SQL a executer se trouve dans :

- `supabase/leads.sql`

Il cree :

- la table `public.leads`
- la cle primaire UUID
- les colonnes de contact
- l'adresse selectionnee en `jsonb`
- un index sur `created_at` pour la revue interne
- les politiques RLS minimales de demonstration

## Guide de mise en place Supabase

1. Creer un projet sur Supabase.
2. Recuperer dans `Project Settings > API` :
   - l'URL du projet
   - la publishable key
3. Copier `.env.example` vers `.env.local`.
4. Renseigner dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Ouvrir `SQL Editor` dans Supabase.
6. Executer le contenu de `supabase/leads.sql`.
7. Verifier dans `Table Editor` que `public.leads` existe.
8. Lancer l'application avec `npm run dev`.
9. Faire une soumission de lead depuis la landing page.
10. Ouvrir `/review` pour verifier l'affichage et utiliser l'export CSV si besoin.

## Ce que vous devez configurer manuellement dans Supabase

1. Ouvrir le projet Supabase
2. Aller dans SQL Editor
3. Executer le contenu de `supabase/leads.sql`
4. Verifier que la table `public.leads` existe
5. Verifier que les policies autorisent bien `insert` et `select` pour `anon`

## Checklist de validation

- La landing page s'affiche sans changement d'UX.
- Une adresse peut etre selectionnee comme avant.
- Le formulaire de lead s'envoie sans erreur.
- Une nouvelle ligne apparait dans `public.leads` dans Supabase.
- La page `/review` affiche les donnees reelles issues de Supabase.
- L'export CSV telecharge bien les donnees issues de Supabase.
- Aucune cle service role n'est exposee au frontend.

## Ce que vous devez configurer manuellement dans Vercel

Ajouter ces variables d'environnement dans le projet :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Puis redeployer.

## Architecture actuelle

- `app/page.tsx` : landing page
- `components/widget/risk-widget.tsx` : parcours principal
- `components/widget/lead-capture-form.tsx` : capture de lead
- `app/review/page.tsx` : revue interne
- `services/address-search-service.ts` : recherche d'adresse France
- `services/risk-preview-service.ts` : moteur de risque mocke
- `services/lead-storage-service.ts` : lecture/ecriture Supabase

## Statut du MVP

Le MVP couvre :

1. recherche d'adresse
2. synthese de risque
3. capture de lead
4. persistance dans Supabase
5. revue interne et export CSV
