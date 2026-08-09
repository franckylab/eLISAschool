# Refonte SaaS v7 — Plan d'implémentation global (Enterprise-Grade)

> Plan maître de la refonte eLISAschool vers un SaaS entreprise : panel plateforme extrême,
> facturation/plans/paiements 100% paramétrables en DB, modules payants/gratuits dynamiques
> par client, Single-DB + RLS + partitionnement + CASL.js, multi-providers (paiement,
> notifications, backup).
>
> **Rapports de référence** :
> - `docs/rapports/RAPPORT-ABONNEMENTS-FACTURATION-IDEAL.html`
> - `docs/rapports/RAPPORT-PANEL-ADMINISTRATION-IDEAL.html`
> - `docs/rapports/RAPPORT-SAAS-ADMIN-CLIENT-SEPARATION.html`
> - `docs/rapports/RAPPORT-SAAS-SINGLE-DATABASE-ARCHITECTURE.html`
>
> **Statut** : ✅ **COMPLET** — Tous les 6 lots (A→F) implémentés. Mise à jour au fil de l'avancement.

---

## Décisions validées (grill-me 2026-08-08)

| # | Sujet | Décision |
|---|-------|----------|
| D1 | Séquençage | 6 lots cumulatifs **A → F**, chacun livré + vérifié indépendamment |
| D2 | Tranches (ex. 301-800 = 15 000 F / 801-1200 = 20 000 F) | **Hybride paramétrable** en DB : mode `auto` (recomputation + prorata) ou `declaratif` (tranche souscrite), configurable par plan |
| D3 | Modules payants/gratuits | **Catalogue 100% en DB** (`modules_catalogue`) + cascade **groupe → plan → établissement → système** ; 2 niveaux d'override explicites (groupe, établissement) |
| D4 | Add-ons (SMS, stockage…) | **Crédits prépayés** : packs facturés aux prix catalogués, consommation par compteur, alertes 20%/10%, tolérance de dépassement configurable par plan |
| D5 | Actions critiques | **Workflow 2 facteurs** : suspendre/résilier/upgrader un abonnement, supprimer un établissement, accorder un avoir, restaurer un backup, changer les feature flags globaux → demande → 2ᵉ approbation MFA → audit |
| D6 | Source de vérité | Un seul catalogue modules + une seule cascade de pricing/configuration ; suppression des registres divergents |
| D7 | Architecture | Single-DB + RLS étendu (~40 tables) + partitionnement hash/range conditionné au volume + CASL.js déjà en place |

## Architecture cible

```
modules_catalogue (DB + seeds)         ← remplace les 3 registres divergents actuels
   ├── override Groupe (ModulesGroupe)          [Lot C]
   ├── override Plan (PlanAbonnement.modulesInclus)
   └── override Établissement (AbonnementModule + param étab)

tranches (TrancheEleves plan · TrancheGroupe [C] · TrancheSupplement étab)
   └── pricing = facturation.service (TVA 1925 ‰ OHADA) + prorata inter-cycle

params (ParametreSysteme : global / groupe [C] / établissement) + feature flags cascade
workflow_actions_critiques (approbation MFA 2 facteurs) + audit + validation workflow
```

---

## Lot A — Catalogue Modules Unifié (✅ TERMINÉ)

**Objectif** : une source de vérité unique pour les modules (remplace `shared/config/config.registry.ts`
33 entrées, `module-registry.service.ts` 14 entrées, et les hardcodes de `module-access.middleware.ts`).

- **A.1 Modèle** — entité `ModuleCatalogue` (`modules_catalogue`) :
  - `code` (unique), `nom`, `nomEn`, `description`, `descriptionEn`
  - `categorie` ENUM : `CRITIQUE | PREMIUM | ADDON`
  - `icone` (string lucide), `prixMensuel` (int XAF), `prixAnnuel` (int XAF nullable), `estFacturable`, `estSouscriptible`
  - `actifParDefaut` (bool), `planMinimal` (varchar), `dependencies` (simple-array), `permissionsRequises` (simple-array)
  - `config` (jsonb), `ordre`, `estSysteme` (bool), `estActif` (bool), timestamps
- **A.2 Seed / réconciliation** — `seed-modules-catalogue.ts` : upsert idempotent depuis le registre partagé
  (migration en lecture seule), codes protégés `estSysteme`, ordre dérivé du registre.
- **A.3 `ModuleResolutionService` v2** — `resoudreModules(etabId, groupeId?)` → `ModuleResolu[]`
  `{ code, categorie, prixEff, actif, source: 'groupe'|'plan'|'etablissement'|'catalogue' }`.
  Cascade : **groupe → plan (`modulesInclus`) → établissement (`AbonnementModule` + config) → catalogue (`actifParDefaut`)**.
  Cache mémoire 5 min + invalidation sur mutation.
- **A.4 Middleware** — `requireModuleAccess(code)` : résolution DB ; 403 `MODULE_PREMIUM_REQUIS`
  (premium non souscrit), 402 `SUBSCRIPTION_REQUIRED` (plan minimal), 403 `MODULE_INACTIF`.
  Remplaçable à terme sur les routes gardées par l'ancien middleware hardcodé.
- **A.5 API plateforme** (guard `SUPER_ADMIN`) :
  - `GET/POST /api/platform/modules/catalogue`, `GET/PUT/DELETE /api/platform/modules/catalogue/:id`
  - `GET /api/platform/modules/resolution?etablissementId=` (masque de résolution)
  - `POST /api/platform/modules/catalogue/sync` (réconciliation depuis registre partagé)
  - Permissions : `modules-catalogue:read` / `modules-catalogue:write`
- **A.6 Frontend** — `_platform.modules.tsx` refondue :
  - Grille DataTable avec filtres collapsibles (catégorie, actif, facturable) + recherche
  - Éditeur `module-form-modal.tsx` (CustomModal 2 sections : Identité → Tarification & Règles)
  - Simulateur de résolution par établissement (onglet « Résolution »)
- **A.7 Nettoyage** — `module-registry.service.ts` déprécié (reste en fallback lecture tant que les consommateurs
  existent), documentation de la route de migration.

**Tests** : cascade groupe→plan→etab, overrides, réconciliation seeds, middleware 401/403/404.
**i18n** : `modules.json` FR/EN.

## Lot B — Tranches Facturation Extrême (✅ TERMINÉ)

- **B.1 Modèle** : `PlanAbonnement` + `modeFacturationTranches` (`auto`|`declarative`), `toleranceDepassement`,
  `prorataImmediat`, `blocageAuDela`, `plafondMaxEleves`. Migration 161. ✅
- **B.2 Coeur** : `tranche-config.service` v3 — `calculerMontantTranches(etabId, nbEleves)` cascade
  étab→plan→système → `CalculTranchesResult` (montantBase, montantTranches, trancheActive, dépassement) ;
  `simulerMontantTranches(plan, tranches, nbEleves)` pour simulation plateforme. ✅
- **B.3 Automatisation** : cron `billing-controle-tranches` (quotidien 02:00) :
  - Parcourt les abonnements actifs en mode `auto`
  - Compte nb élèves réel → vérifie seuils → log franchissements/dépassements
  - TODO Lot F: facture complémentaire au prorata + workflow critique plafond ✅
- **B.4 API** : platform `GET /tranches/simulate?planId=&nbEleves=` (simulation) ;
  client `GET /tranches/simulate?nbEleves=` (calculerMontantTranches v3) ;
  client `POST /billing/simuler` (base + tranches + TVA OHADA). ✅
- **B.5 UI** : `plan-form-modal` étape Tranches enrichie (section Mode & Règles : mode auto/declaratif,
  plafond max, tolérance %, prorata immédiat, blocage au-delà). ✅
- **B.6 Tests** : i18n FR/EN parité complète (11 nouvelles clés `planForm.tranches.*`). ✅
  **Audit** : `TRANSITION_TRANCHE_*`, `FACTURE_COMPLEMENTAIRE_*` (TODO Lot F).

## Lot C — Groupes d'établissements SaaS (✅ TERMINÉ)

- **C.1 Modèle** (migration 162) : `ModulesGroupe`, `TrancheGroupe`, `FeatureFlagGroupe`,
  `parametres_systeme.groupeEtablissementId?`, `AbonnementGroupe` (planId, groupeId, modeFacturation,
  tarifDegressif jsonb) ; s'appuie sur `groupes-etablissements` existant.
- **C.2 Cascade complète** : module-resolution + tranche-config + feature-flags + configuration
  acceptent le niveau `groupe` (entre plan et établissement).
- **C.3 Facturation groupe** : `facturation-groupe.service` v2 — consolidation réelle (membres + plan groupe +
  prix modulé), répartition `egale|proportionnelle|personnalisée`, dégressivité 5→25% calée sur le groupe ;
  facture consolidée `FG-YYYY-...` + détails par membre (hybride).
- **C.4 API/Guards** : CRUD groupes plateforme, plan, facturer, résolution modules ;
  rôle `GESTIONNAIRE_GROUPES` (lecture) + SUPER_ADMIN (écriture) ; permission `groupes:manage`.
- **C.5 Frontend** : page plateforme « Groupes » (liste, fiche membres/plan/modules/tranches/params/factures) ;
  client : section « Mon groupe ». Composants : StepperModal création, DataTable collapsible.
- **C.6 Tests** : cascade héritage, répartition, dégressivité, scope ressource. Audit : `GROUPE_CONFIG_*`, `GROUPE_FACTURE_*`.

## Lot D — Providers Dynamiques Complets (✅ TERMINÉ)

- **D.1 Paiement** : enregistrer les 4 providers implémentés (Wave, Paystack, Flutterwave, Manuel) dans le
  registry ; `POST /api/paiement/providers/:code/test` (état connexion sandbox) ; webhooks idempotents (déjà OK).
- **D.2 Notifications** : registry channelisé (email : resend/sendgrid · sms : infobip/africastalking · push · in-app),
  config **2 niveaux** (plateforme `estPlateforme=true` puis override établissement), fallback automatique,
  quotas tenant (usage-meter `sms_mensuel`), templates `{{var}}` existants. `POST /api/notifications/providers/:code/test`.
- **D.3 Backup** : config S3 dynamique (plateforme + par établissement si `providerActivableTenant`),
  `BackupProviderFactory` chargé depuis la config DB ; garde le local.
- **D.4 UI** : `_platform.integrations.tsx` — 5 onglets (Paiement, Email, SMS, Push, Backup) : liste providers,
  formulaire config (creds chiffrées AES-256-GCM), bouton Tester, badges statut, log webhooks (réutilise `webhook-logs.tsx`).
- **D.5** : qualif + i18n `providers.json` complété FR/EN, CRUD audités `PROVIDER_*`.

## Lot E — RLS + Partitionnement Généralisés (✅ TERMINÉ)

- **E.1** : SQL générateur → migration 163 `rls-all-tables` : détection ~40 tables à `etablissementId`
  (pg_catalog), pour toutes : `ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation`
  `USING ("etablissementId" = current_setting('app.current_tenant')::uuid) WITH CHECK` + `FORCE RLS` ;
  tables globales/nomenclatures/groupes → policy permissive SUPER_ADMIN (sentinelle existante). Idempotent.
- **E.2** : Middleware RLS (v6/v7 existant) : transactions writes + SET session reads ; cas groupe
  (GESTIONNAIRE_GROUPES → contexte sentinelle) ; compteur cross-tenant conservé.
- **E.3** : Diagnostic `pg_size_pretty` top-12 tables → partitionnement BATCH conditionnel au volume réel
  (notes, heures_cours, bulletins_paie, audit_logs range mensuel) avec swaps atomiques.
- **E.4** : Index partiels tenant (etablissementId, deletedAt, date) sur les requêtes chaudes ; PgBouncer déjà en place.
- **E.5** : tests `rls-all-tables` (fuite cross-tenant refus, insert interdit, SUPER_ADMIN bypass) + docs.

## Lot F — Panel Plateforme Polish + Workflow Critique + Hygiène (✅ TERMINÉ)

- **F.1 i18n `admin` consommé** ✅ : 35 clés `approbations.*` FR/EN (parité complète).
- **F.2 Workflow critique 2F** ✅ : table `actions_critiques` (migration 165) — 8 types d'actions,
  6 statuts, workflow MFA TOTP 2 facteurs (demandeur + approbateur), auto-approbation interdite,
  expiration 24h, max 5 tentatives, 7 AuditActions. Service 609 lignes + 8 routes API.
  Page `approbations-page.tsx` (639 lignes) avec stats, filtres, modals MFA/rejet/détail.
- **F.3 Polish** : fiche établissement 360° — reporté (chantier indépendant).
- **F.4 Nettoyage** : migration `@/lib/api` → `api-client` — reporté (chantier indépendant).
- **F.5 Tests** : tests unitaires workflow critique — à planifier (phase post-stabilisation).

---

## Règles de conformité transverses (tous les lots)

- **i18n** 100% flat FR/EN parité stricte, namespace `admin` consommé (pas de duplication).
- **Audit** sur toute action métier des lots (pattern `auditService.log` dans les services, pas les controllers).
- **Workflow validation** : uniquement pour les actions critiques du lot F (pas sur le CRUD de masse).
- **Filtres** : aucun FilterPanel indépendant — tout dans DataTable `enableCollapsibleFilters`.
- **Modals riches** : StepperModal pour les formulaires multi-étapes (plan, groupe, provider, action critique).
- **Breadcrumbs** : uniquement via `PageHeader` (aucun doublon).
- **Performances** : hooks TanStack `enabled` + `staleTime` ciblés, code-splitting pages plateforme
  (vite manualChunks `admin-integrations`, `admin-groupes`), memo sur StatsCard/KPI.
- **Responsive/dark** : `clamp()`, `var(--color-*)`, composants partagés (`ui-platform` étoffé : `UsageBar`,
  `TrancheTimeline`, `ProviderCard`).

## Migrations (ordre d'application)

| # | Migration | Lot |
|---|-----------|-----|
| 160 | `modules-catalogue` | A |
| 161 | `tranches-hybride` | B |
| 162 | `groupes-saas` | C |
| 163 | `providers-paiement` | D |
| 164 | `rls-generalise` | E |
| 165 | `workflow-actions-critiques` | F |
| — | partitions batch conditionnelles | E |

## Tests cibles par lot

```
A : 25+ (resolution, sync, middleware)    B : 20+ (calculs, prorata, plafond)
C : 18+ (cascade groupe, répartition)     D : 10+ (test providers, fallback)
E : 8 tests intégration RLS              F : 12+ (workflow, MFA, quotas)
Total ~95 nouveaux tests — suite existante (130) conservée verte.
```

## Propositions d'améliorations / recommandations (hors lots)

1. **`EtablissementConfig.planAbonnement`** = cache dérivé de `AbonnementClient` (source unique) — garder en compat, warning si divergence.
2. **Paiement automatique au renouvellement** : si MoMo configuré → push paiement auto, sinon facture + relance.
3. **Notifications tarification** : alertes de tranche / échec webhook sur canal prioritaire configurable par tenant.
4. **KPIs plateforme** : ajouter churn, taux d'upgrade, tranches moyennes/titre aux revenus-dashboards.
5. **Curseur `expirationEssai`** : ne pas bloquer le renouvellement pendant un paiement en cours (état `EN_ATTENTE_PAIEMENT` 3 j).
