# eLISAschool — Session Context

## Refonte SaaS v4 — Plan d'Implémentation

### Phase P1 — Fondations Backend (✅ COMPLET)
- **P1.1 Cron Jobs Billing** — `backend/src/modules/billing/cron-jobs.ts` (524 lignes)
  - 5 cron jobs : renouvellementAuto, generationFactures, dunning, alerteQuota, expirationEssai
  - `initBillingCronJobs()` enregistré dans `index.ts` (node-cron, timezone Africa/Douala)
- **P1.2 Facturation Groupes** — `backend/src/modules/billing/services/facturation-groupe.service.ts` (507 lignes)
  - 3 modèles : INDIVIDUELLE, CONSOLIDÉE, HYBRIDE
  - Dégressivité progressive (5% → 25% selon nombre membres)
- **P1.3 Intégrations Notifications** — `dunning.service.ts` + `quota.service.ts` modifiés
  - NotificationOrchestrator intégré (non-bloquant, try/catch)
- **P1.4 Export PDF Factures** — `backend/src/modules/billing/services/facture-pdf.service.ts` (237 lignes)
  - Endpoint `GET /api/platform/facturation/factures/:id/pdf-data`
  - Données structurées conformes OHADA pour génération jsPDF frontend

### Phase P2 — Panel Admin Complet (✅ COMPLET)
- **P2.1 CRUD Plans + Tranches** — `frontend/src/features/admin/components/plan-form-modal.tsx` (716 lignes)
  - Modal multi-étapes (6 étapes) : Infos → Quotas → Modules → Tranches → Feature Flags → Résumé
  - Intégré dans `_platform.facturation.tsx` (boutons Créer/Éditer)
- **P2.2 Gestion Établissements** — `frontend/src/features/admin/components/etablissement-form-modal.tsx` (416 lignes)
  - Modal multi-étapes (4 étapes) : Infos → Plan → Options → Résumé
  - Intégré dans `_platform.etablissements.tsx`
- **P2.3 Config Providers Paiement** — `frontend/src/features/admin/components/provider-config-modal.tsx` (334 lignes)
  - 7 providers (MTN, OM, Wave, Paystack, Flutterwave, Stripe, Manuel)
  - Credentials masqués, mode sandbox/production, sélection canal
- **P2.4 Dashboard Usage Meters** — `frontend/src/features/admin/components/usage-meters-dashboard.tsx` (281 lignes)
  - Indicateurs quota (jauge), alertes visuelles (vert/jaune/rouge), export CSV
- **P2.5 Dashboard Revenus** — `frontend/src/features/admin/components/revenus-dashboard.tsx` (397 lignes)
  - KPIs SaaS : MRR, ARR, Churn, LTV, ARPU, répartition par plan, top 10 établissements
- **P2.6 Détail Abonnement** — `frontend/src/features/admin/components/abonnement-detail.tsx` (422 lignes)
  - Infos, factures, actions (suspendre/réactiver/changer plan/résilier), export PDF

### Phase P3 — Sécurité Frontend (✅ COMPLET)
- **P3.1 CASL Guards** — `frontend/src/components/guards/RequireAbility.tsx` (48 lignes)
  - Composant guard basé sur `useAbility()` existant (`lib/casl.ts`)
  - Fallback personnalisable, message accès non autorisé
- **P3.1b Hook useAbility** — `frontend/src/hooks/use-ability.ts` (21 lignes)
  - Ré-export depuis `lib/casl` pour cohérence barrel hooks
  - Exporté dans `frontend/src/hooks/index.ts`
- **P3.2 Audit Trail** — `frontend/src/features/admin/components/audit-page.tsx` (988 lignes)
  - Déjà connecté aux vraies données API (`/api/audit/logs`, `/api/audit/logs/statistics`)
  - Filtres : module, sévérité, statut, date, action, utilisateur
  - Export CSV/JSON, detail view avec diff (avant/après)
  - Backend monté sur `/api/platform/audit` via `platform.routes.ts`

### Phase P4 — Intégrations (✅ COMPLET)
- **P4.2 Webhook Logs** — `frontend/src/features/admin/components/webhook-logs.tsx` (218 lignes)
  - Liste webhooks par provider, filtres, payload/réponse, retry manuel
- **P4.3 Notifications Config** — `frontend/src/routes/_platform.notifications-config.tsx` (316 lignes)
  - 3 onglets : Providers, Templates, Test d'envoi

### Phase P5 — Polish & Performance (✅ P5.3 + P5.4 COMPLET)
- **P5.3 i18n** — `frontend/src/locales/fr/admin.json` (429 lignes) + `frontend/src/locales/en/admin.json` (429 lignes)
  - Namespace `admin` avec toutes les clés pour les pages platform
  - Couvre : plans, établissements, providers, usage, revenus, abonnements, factures, webhooks, notifications, audit, composants
  - Parité FR/EN complète, enregistré dans `lib/i18n.ts`
- **P5.4 Composants réutilisables** — `frontend/src/features/admin/components/ui-platform.tsx` (198 lignes)
  - `StatCard` : carte statistique (label, value, icon, trend, loading)
  - `StatusBadge` : badge coloré avec mapping auto statut→variant
  - `ConfirmAction` : modal confirmation avec variants (danger, warning, default)
  - `EmptyState` : état vide avec icône, titre, description, CTA

### Phase P6 — Tests & Documentation (✅ COMPLET)
- **P6.1 Tests unitaires billing** :
  - `backend/test/unit/facturation.service.spec.ts` (330 lignes)
    - TVA OHADA (19.25% centièmes), calcul montant mensuel (base + tranches + options), numérotation factures, création avoir
  - `backend/test/unit/facturation-groupe.service.spec.ts` (255 lignes)
    - Dégressivité progressive (barème 0-25%), application dégressivité, modèle individuelle, calcul consommation membres
- **P6.2 Documentation** — AGENTS.md mis à jour avec toutes les phases v4

### Fichiers créés/modifiés v4
| Fichier | Lignes | Phase |
|---------|--------|-------|
| `backend/src/modules/billing/cron-jobs.ts` | 524 | P1.1 |
| `backend/src/modules/billing/services/facturation-groupe.service.ts` | 507 | P1.2 |
| `backend/src/modules/billing/services/facture-pdf.service.ts` | 237 | P1.4 |
| `backend/src/modules/billing/services/dunning.service.ts` | modifié | P1.3 |
| `backend/src/modules/billing/services/quota.service.ts` | modifié | P1.3 |
| `backend/src/modules/billing/controllers/billing.controller.ts` | modifié | P1.4 |
| `backend/src/modules/billing/index.ts` | modifié | P1 |
| `backend/src/index.ts` | modifié | P1.1 |
| `frontend/src/features/admin/components/plan-form-modal.tsx` | 716 | P2.1 |
| `frontend/src/features/admin/components/etablissement-form-modal.tsx` | 416 | P2.2 |
| `frontend/src/features/admin/components/provider-config-modal.tsx` | 334 | P2.3 |
| `frontend/src/features/admin/components/usage-meters-dashboard.tsx` | 281 | P2.4 |
| `frontend/src/features/admin/components/revenus-dashboard.tsx` | 397 | P2.5 |
| `frontend/src/features/admin/components/abonnement-detail.tsx` | 422 | P2.6 |
| `frontend/src/features/admin/components/webhook-logs.tsx` | 218 | P4.2 |
| `frontend/src/routes/_platform.notifications-config.tsx` | 316 | P4.3 |
| `frontend/src/routes/_platform.facturation.tsx` | modifié | P2 |
| `frontend/src/routes/_platform.etablissements.tsx` | modifié | P2.2 |
| `frontend/src/components/guards/RequireAbility.tsx` | 48 | P3.1 |
| `frontend/src/hooks/use-ability.ts` | 21 | P3.1b |
| `frontend/src/features/admin/components/ui-platform.tsx` | 198 | P5.4 |
| `frontend/src/locales/fr/admin.json` | 429 | P5.3 |
| `frontend/src/locales/en/admin.json` | 429 | P5.3 |
| `frontend/src/lib/i18n.ts` | modifié | P5.3 |
| `backend/test/unit/facturation.service.spec.ts` | 330 | P6.1 |
| `backend/test/unit/facturation-groupe.service.spec.ts` | 255 | P6.1 |

---

## Refonte SaaS v5 — Plan d'Implémentation (✅ TERMINÉ)

> Plan complet : `/home/franck/.config/Qoder/SharedClientCache/cache/plans/Refonte_SaaS_v5_eLISAschool_task-e1b.md`

### Décisions architecturales validées
- **CASL.js complet** : `@casl/ability` + `@casl/typeorm` via `shared/`, remplacement total du custom
- **RLS étendu** : Toutes les tables avec `etablissementId` (~40+ tables)
- **Billing configurable** : Tranches, modules, feature flags avant les providers paiement
- **Single-DB + RLS** : Pas de partitionnement immédiat (optionnel Phase 6+)
- **3 plans de gestion** : Control Plane (`_platform/`), Data Plane Tenant (`_auth/`), Data Plane User

### Phase 0 — Corrections Sécurité Immédiates (✅ COMPLET)
- **RBAC-1** : GROUPES_ETABLISSEMENTS_* déjà retiré du rôle DIRECTEUR (v5.1)
- **RBAC-2** : Permissions config déjà splitées `config:etablissement:*` + `config:plateforme:*`
- **RBAC-3** : NETWORK_VIEW/NETWORK_DETAILS/NETWORK_ADMIN retiré de Role.ADMIN → SUPER_ADMIN uniquement
- **FE-1** : Bypass SUPER_ADMIN déjà supprimé (v3.0) dans `permission-guards.ts`
- **FE-2** : Guards `beforeLoad` déjà en place sur finances, transport, bibliotheque
- **FE-5** : PermissionGate sans hook conditionnel — OK
- **CFG-1/2** : Endpoints configuration protégés (authMiddleware + canViewConfigApp/canViewParams)
- **0.2** : `GET /etablissements/:id/stats` — vérification d'appartenance ajoutée

### Phase 1 — CASL.js Complet (✅ COMPLET)
- **1.1** : `shared/src/casl/abilities.ts` (360 lignes) — `defineAbility()`, types `AppAbility`, `Action`, `Subject`
- **1.2** : `backend/src/casl/casl.middleware.ts` (95 lignes) — `caslMiddleware` + `requireCasl()`
- **1.3** : `frontend/src/lib/casl/index.tsx` (125 lignes) — migré vers shared `defineAbility()`
- **1.4** : Migration progressive des controllers (continu — modules cœur métier prioritaires)
- Suppression de `frontend/src/lib/casl.ts` (doublon) — types `CaslAbilityInterface` remplacés par `AppAbility`
- `AbilityProvider` ajouté dans `frontend/src/app/providers.tsx`

### Phase 2 — Row-Level Security (✅ COMPLET)
- **152** : RLS sur 8 tables critiques (eleves, notes, bulletins, membres_personnel, heures_cours, creneaux_horaires, absences_personnel, parametres_systeme)
- **153** : RLS sur 6 tables non-critiques (paiements, factures, sondages, factures_fournisseur, depenses, budgets)
- **155** : Partitionnement hash 16 partitions sur tables à fort volume
- Middleware RLS : `backend/src/common/middlewares/rls.middleware.ts`
- AsyncLocalStorage : `backend/src/common/subscribers/tenant-isolation.subscriber.ts`

### Phase 3 — Billing Configurable (✅ COMPLET)
- **3.1** : `tranche-supplement.entity.ts` créé, `estCustomisable` ajouté à TrancheEleves, `tranchesConfigurables` ajouté à PlanAbonnement
- **3.1** : `tranche-config.service.ts` (202 lignes) — cascade établissement → plan → système
- **3.2** : `module-resolution.service.ts` (112 lignes) — résolution modules plan + suppléments
- **3.3** : `feature-flags.service.ts` déjà en place avec cascade (plan → tenant override → global)
- **3.4** : `frontend/src/routes/_auth.facturation.tsx` (287 lignes) — page facturation client avec abonnement, modules, factures, usage, simulateur
- Migration 156 : `156-billing-configurable-avance.sql` créée
- Endpoints ajoutés : `GET/PUT/DELETE /api/billing/tranches/*`, `GET /api/billing/modules/resolved|catalogue`

### Phase 4 — Quotas & Enforcement (✅ COMPLET)
- `requireQuota()` middleware déjà en place dans `quota.service.ts`
- Alertes quota (80%, 90%, 100%) dans `cron-jobs.ts` + `quota.service.ts`
- Notification orchestrator intégré

### Phase 5 — Providers d'Intégration (✅ COMPLET)
- **Paiement** : 7 providers (MTN MoMo, Orange Money, Wave, Paystack, Flutterwave, Stripe, Manuel)
- **Notifications** : Provider registry avec fallback automatique
- **Backup** : Local + S3 providers
- **Storage** : Database storage provider

### Phase 6 — Monitoring & Observabilité (✅ COMPLET — existait)
- **6.1** : `metrics-collector.service.ts` (521 lignes) — Golden Signals (p50/p95/p99, saturation CPU/mémoire/DB)
- **6.2** : `_platform.monitoring.tsx` (741 lignes) — Dashboard monitoring avec health checks, charts, noisy neighbor detection
- **6.3** : `alerting.service.ts` (439 lignes) — Règles d'alertes (erreur >5%, latence >5s, quota >80%, DB >90%)
- **Noisy Neighbor** : `noisy-neighbor.service.ts` (361 lignes) — Détection tenants gourmands
- **WebSocket** : `monitoring.gateway.ts` (251 lignes) — Events temps réel

### Phase 7 — Polish UX/UI & i18n (✅ COMPLET)
- **7.1** : `_platform.tsx` — Layout dédié avec bannière + guard SUPER_ADMIN
- **7.2** : i18n billing/providers créé :
  - `frontend/src/locales/fr/billing.json` (88 lignes)
  - `frontend/src/locales/en/billing.json` (88 lignes)
  - `frontend/src/locales/fr/providers.json` (77 lignes)
  - `frontend/src/locales/en/providers.json` (77 lignes)
- **7.3** : `ui-platform.tsx` (249 lignes) — PlatformStatCard, StatusBadge, ConfirmAction, EmptyState

### Phase 8 — Tests & Documentation (✅ COMPLET)
- **8.1** Tests unitaires :
  - `backend/test/unit/casl-abilities.spec.ts` (261 lignes) — Définitions CASL par rôle
  - `backend/test/unit/quota-guard.spec.ts` (193 lignes) — Middleware quotas
  - `backend/test/unit/feature-flags.spec.ts` (179 lignes) — Cascade feature flags
  - `backend/test/unit/tranche-config.spec.ts` (211 lignes) — Cascade tranches pricing
- **8.2** Tests E2E :
  - `backend/test/e2e/billing-flow.spec.ts` (240 lignes) — Flow billing complet
  - `backend/test/e2e/multi-tenant-isolation-v5.spec.ts` (258 lignes) — Isolation multi-tenant v5
- **8.3** Documentation :
  - `docs/guides/GUIDE-SAAS-V5.md` (224 lignes) — Architecture globale v5
  - `docs/guides/GUIDE-CONFIGURATION-TRANCHES.md` (97 lignes) — Configuration tranches billing
  - `docs/guides/GUIDE-PROVIDERS.md` (131 lignes) — Intégration providers

### Fichiers créés/modifiés v5 (complet)
| Fichier | Phase | Action |
|---------|-------|--------|
| `shared/src/enums/roles.enum.ts` | 0.1 | RBAC-3 : NETWORK_* retiré de ADMIN |
| `backend/src/modules/etablissement/controllers/etablissement.controller.ts` | 0.2 | Appartenance vérifiée sur /:id/stats |
| `shared/src/index.ts` | 1.1 | Export CASL ajouté |
| `shared/package.json` | 1.1 | @casl/ability ajouté |
| `frontend/src/lib/casl.ts` | 1.3 | Supprimé (doublon avec casl/index.tsx) |
| `frontend/src/lib/casl/index.tsx` | 1.3 | Déjà OK (shared defineAbility) |
| `frontend/src/app/providers.tsx` | 1.3 | AbilityProvider ajouté |
| `frontend/src/components/guards/RequireAbility.tsx` | 1.3 | Types migrés vers Action/Subject |
| `frontend/src/hooks/use-ability.ts` | 1.3 | CaslAbilityInterface → AppAbility |
| `backend/src/modules/billing/entities/tranche-eleves.entity.ts` | 3.1 | estCustomisable ajouté |
| `backend/src/modules/billing/entities/plan-abonnement.entity.ts` | 3.1 | tranchesConfigurables ajouté |
| `backend/src/modules/billing/entities/tranche-supplement.entity.ts` | 3.1 | NOUVEAU |
| `backend/src/modules/billing/entities/index.ts` | 3.1 | Export TrancheSupplement |
| `backend/src/modules/billing/services/tranche-config.service.ts` | 3.1 | NOUVEAU (202 lignes) |
| `backend/src/modules/billing/services/module-resolution.service.ts` | 3.2 | NOUVEAU (112 lignes) |
| `backend/src/modules/billing/services/index.ts` | 3.2 | Exports ajoutés |
| `backend/src/modules/billing/controllers/billing.controller.ts` | 3.1 | Endpoints tranches/modules ajoutés |
| `backend/database/migrations/156-billing-configurable-avance.sql` | 3.1 | NOUVEAU |
| `frontend/src/locales/fr/billing.json` | 7.2 | NOUVEAU (88 lignes) |
| `frontend/src/locales/en/billing.json` | 7.2 | NOUVEAU (88 lignes) |
| `frontend/src/locales/fr/providers.json` | 7.2 | NOUVEAU (77 lignes) |
| `frontend/src/locales/en/providers.json` | 7.2 | NOUVEAU (77 lignes) |
| `backend/test/unit/casl-abilities.spec.ts` | 8.1 | NOUVEAU (261 lignes) |
| `backend/test/unit/quota-guard.spec.ts` | 8.1 | NOUVEAU (193 lignes) |
| `backend/test/unit/feature-flags.spec.ts` | 8.1 | NOUVEAU (179 lignes) |
| `backend/test/unit/tranche-config.spec.ts` | 8.1 | NOUVEAU (211 lignes) |
| `backend/test/e2e/billing-flow.spec.ts` | 8.2 | NOUVEAU (240 lignes) |
| `backend/test/e2e/multi-tenant-isolation-v5.spec.ts` | 8.2 | NOUVEAU (258 lignes) |
| `docs/guides/GUIDE-SAAS-V5.md` | 8.3 | NOUVEAU (224 lignes) |
| `docs/guides/GUIDE-CONFIGURATION-TRANCHES.md` | 8.3 | NOUVEAU (97 lignes) |
| `docs/guides/GUIDE-PROVIDERS.md` | 8.3 | NOUVEAU (131 lignes) |

---

## Refonte SaaS v6 — Consolidation & Optimisation (✅ TERMINÉ)

> Contexte : Correction des failles d'audit v5, optimisation performances, intégration MFA, backups et polish plateforme.

### Phase P0 — Correction RLS Middleware (✅ COMPLET)
- **P0.1 Transaction conditionnelle** — `backend/src/common/middlewares/rls.middleware.ts`
  - Transaction ouverte uniquement sur les requêtes write (POST/PUT/PATCH/DELETE)
  - Pour les GET : SET LOCAL sans transaction (plus léger)
  - Listener `res.on('finish')` au lieu de monkey-patch res.end
- **P0.2 Event listener** — `res.on('finish', ...)` pour commit/rollback
- **P0.3 Compteur cluster-safe** — Suppression variable globale `crossTenantAttempts`, logger directement

### Phase P1 — Intégration MFA (✅ COMPLET)
- **P1.1 Backend MFA** :
  - `backend/database/migrations/157-mfa-config.sql` (45 lignes) — Table mfa_configs
  - `backend/src/modules/auth/entities/mfa-config.entity.ts` (60 lignes) — Entité MfaConfig
  - `backend/src/modules/auth/services/mfa.service.ts` (329 lignes) — Service MFA v2 avec AES-256-GCM
  - `backend/src/modules/auth/services/auth.service.ts` — Check MFA dans login(), completeLoginAfterMFA()
  - `backend/src/modules/auth/controllers/auth.controller.ts` — 6 endpoints MFA (verify, setup, activate, status, disable, regenerate-backup-codes)
- **P1.2 Frontend MFA** :
  - `frontend/src/features/auth/MFAVerifyPage.tsx` (222 lignes) — Page vérification TOTP (6 inputs)
  - `frontend/src/features/auth/components/MFASettings.tsx` (443 lignes) — Setup/disable MFA dans settings
  - `frontend/src/stores/auth.store.ts` — mfaToken/mfaRequired state, verifyMFA action
  - `frontend/src/lib/api-client.ts` — Méthodes MFA API
  - `frontend/src/routes/mfa-verify.tsx` — Route /mfa-verify

### Phase P2 — Backup API Unifiée (✅ COMPLET)
- **P2.1 Controller backup** — `backend/src/modules/configuration/controllers/backup.controller.ts`
  - 3 endpoints ajoutés : GET /schedule, POST /schedule, POST /trigger
- **P2.2 Frontend backup** — `frontend/src/features/configuration/components/BackupManagement.tsx` (346 lignes)
  - 3 onglets : Vue d'ensemble, Planification, Historique

### Phase P3 — Performance & Connection Pool (✅ COMPLET)
- **P3.1 TypeORM pool** — `backend/src/config/database.config.ts`
  - poolSize dynamique via env var (20 prod, 5 dev)
  - extra.maxUses pour recyclage connexions (1000 utilisations)
- **P3.2 Cache Redis tenant-aware** — `backend/src/common/services/redis.service.ts`
  - Méthodes tenant-aware : getTenant, setTenant, getTenantJSON, setTenantJSON, delTenant
  - invalidateTenant(tenantId) via SCAN + DEL
- **P3.3 Batch queries monitoring** — `backend/src/modules/monitoring/services/metrics-collector.service.ts`
  - FLUSH_INTERVAL réduit de 30s à 10s
  - Stockage Redis time-series (sorted sets) pour durées HTTP
  - Agrégation par fenêtre de 10s stockée en Redis (TTL 24h)
  - Restauration des durées depuis Redis au démarrage

### Phase P4 — Polish UX Plateforme (✅ COMPLET)
- **P4.1 ErrorBoundary** — `frontend/src/routes/_platform.tsx`
  - PlatformErrorBoundary (class component) wrappant `<Outlet/>`
  - Fallback UI avec détails techniques, boutons réessayer/recharger
- **P4.2 Loading states** — `frontend/src/routes/_platform.tsx`
  - PlatformSkeleton : header, stats cards, table, loader
  - Suspense wrappant `<Outlet/>` avec fallback skeleton
- **P4.3 Command Palette** — `frontend/src/routes/_platform.tsx`
  - `<CommandPalette/>` intégré dans le layout plateforme
  - Navigation rapide Cmd+K vers toutes les sections

### Phase P5 — Sécurité Renforcée (✅ COMPLET)
- **P5.1 Audit routes platform** — `backend/src/routes/platform.routes.ts`
  - Audit complet : 11 groupes de routes tous protégés par guard global SUPER_ADMIN
  - Documentation des routes auditables inline
- **P5.2 Rate limiting par plan** — `backend/src/common/middlewares/rate-limit.middleware.ts`
  - Résolution du plan tenant via Redis cache → DB (AbonnementClient)
  - Limites : Gratuit 100, Standard 500, Premium 2000, Enterprise 3000 req/min
  - Cache local 5 min + Redis 15 min pour les plans
- **P5.3 Chiffrement credentials** — `backend/src/common/utils/encryption.util.ts` (135 lignes)
  - Utilitaire centralisé AES-256-GCM (encrypt, decrypt, encryptJSON, decryptJSON)
  - Intégré dans `paiement.service.ts` avec compatibilité ascendante (ancien format CBC supporté)
  - Format : iv:authTag:encrypted (base64)

### Fichiers créés/modifiés v6
| Fichier | Phase | Action |
|---------|-------|--------|
| `backend/src/common/middlewares/rls.middleware.ts` | P0.1 | Transaction conditionnelle + event listener |
| `backend/src/common/middlewares/rls.middleware.ts` | P0.3 | Compteur cluster-safe |
| `backend/database/migrations/157-mfa-config.sql` | P1.1 | NOUVEAU (45 lignes) |
| `backend/src/modules/auth/entities/mfa-config.entity.ts` | P1.1 | NOUVEAU (60 lignes) |
| `backend/src/modules/auth/services/mfa.service.ts` | P1.1 | Réécriture v2 (329 lignes) |
| `backend/src/modules/auth/services/auth.service.ts` | P1.1 | Check MFA + completeLoginAfterMFA |
| `backend/src/modules/auth/controllers/auth.controller.ts` | P1.1 | 6 endpoints MFA |
| `backend/src/modules/auth/dto/auth.dto.ts` | P1.1 | LoginResponseDto MFA fields |
| `frontend/src/features/auth/MFAVerifyPage.tsx` | P1.2 | NOUVEAU (222 lignes) |
| `frontend/src/features/auth/components/MFASettings.tsx` | P1.2 | NOUVEAU (443 lignes) |
| `frontend/src/routes/mfa-verify.tsx` | P1.2 | NOUVEAU |
| `frontend/src/stores/auth.store.ts` | P1.2 | mfaToken/mfaRequired/verifyMFA |
| `frontend/src/lib/api-client.ts` | P1.2 | Méthodes MFA API |
| `frontend/src/features/auth/LoginPage.tsx` | P1.2 | Redirection MFA |
| `backend/src/modules/configuration/controllers/backup.controller.ts` | P2.1 | 3 endpoints (schedule, trigger) |
| `frontend/src/features/configuration/components/BackupManagement.tsx` | P2.2 | NOUVEAU (346 lignes) |
| `backend/src/config/database.config.ts` | P3.1 | poolSize dynamique + maxUses |
| `backend/src/common/services/redis.service.ts` | P3.2 | Méthodes tenant-aware |
| `backend/src/modules/monitoring/services/metrics-collector.service.ts` | P3.3 | Redis time-series + batch 10s |
| `frontend/src/routes/_platform.tsx` | P4.1-4.3 | ErrorBoundary + Skeleton + CommandPalette |
| `backend/src/routes/platform.routes.ts` | P5.1 | Audit documentation |
| `backend/src/common/middlewares/rate-limit.middleware.ts` | P5.2 | Rate limit par plan (Redis+DB) |
| `backend/src/common/utils/encryption.util.ts` | P5.3 | NOUVEAU (135 lignes) |
| `backend/src/modules/paiement/services/paiement.service.ts` | P5.3 | Chiffrement centralisé + compat |

---

## Audit Configuration v7.1 — Améliorations Système (✅ TERMINÉ)

> Contexte : Rapport d'audit `docs/rapports/RAPPORT-AUDIT-CONFIGURATION-SYSTEME.html` (score 9.5/10). 3 recommandations + 3 correctifs.

### R1 — Suppression ConfigurationApp (✅ COMPLET)
- **Entity supprimée** : `configuration-app.entity.ts` (legacy monolithique dépréciée depuis v2.0)
- **6 fichiers nettoyés** : `entities/index.ts`, `tenant-isolation.subscriber.ts`, `etablissement.service.ts`, `config-backup.service.ts`, `configuration-history.service.ts`
- `CibleConfiguration.APP` conservé dans l'enum → throw `LEGACY_NOT_SUPPORTED` si restauration tentée
- `ParametreSysteme` = source unique de vérité pour TOUS les paramètres runtime

### R2 — Cache Redis Pub/Sub (✅ COMPLET)
- **Fichier** : `backend/src/modules/configuration/services/configuration.service.ts`
- Invalidation cross-instance via canal `config:cache:invalidate`
- `initPubSub()` dans constructor + `redisService.publish()` dans `invalidateCache()`
- Fonctionnel en mode single-instance sans Redis (silencieux en cas d'échec)

### R3 — Type ENCRYPTED pour Paramètres Sensibles (✅ COMPLET)
- **Entity** : `TypeValeurParametre.ENCRYPTED` ajouté dans `parametre-systeme.entity.ts`
- **Service** : chiffrement AES-256-GCM automatique dans `createParametre()` et `setParametre()`
- **Déchiffrement** : `parseParametreValue()` détecte ENCRYPTED et déchiffre automatiquement
- **Sérialisation** : `serializeParametreValue()` — chiffrement si ENCRYPTED, JSON.stringify sinon
- **Migration** : `178-type-encrypted-parametres.sql` — ajoute ENCRYPTED à l'enum PostgreSQL

### FIX-1 — Cohérence sidebar + i18n (✅ COMPLET)
- Suppression clés i18n orphelines : `descPermissions`, `descSessionsActivite`, `sousGroupeIdentite`, `sousGroupeSurveillance`
- Fichiers : `frontend/src/locales/fr/admin.json` + `en/admin.json`

### FIX-2 — Nettoyage commentaires ConfigurationApp (✅ COMPLET)
- `etablissement.entity.ts` : 3 commentaires "ConfigurationApp" → "valeur défaut"

### FIX-3 — Mise à jour règles/skills (✅ COMPLET)
- `.qoder/rules/elisaschool-conventions.md` : section 26 ajoutée (R1, R2, R3 documentés)
- `AGENTS.md` : section v7.1 ajoutée (celle-ci)

### Vérification Anti-patterns (✅ AUDITÉ)

5 anti-patterns critiques vérifiés dans le code :

| Anti-pattern | Statut | Protection en place |
|--------------|--------|---------------------|
| Bypass middleware RLS | ✅ Respecté | `rls.middleware.ts` — rejet explicite 403 si aucun tenant, guard cross-plane |
| Paramètres dans .env | ✅ Respecté | `.env` = secrets infrastructure uniquement. Runtime → `ParametreSysteme` |
| Modifier ConfigurationApp | ✅ Respecté | Entité supprimée (v3.0). Seuls commentaires historiques + erreur LEGACY_NOT_SUPPORTED |
| Cache sans TTL | ✅ Respecté | Tous les caches ont TTL : 60s (config), 5 min (feature flags), 5 min (IP allowlist), 5 min (WebAuthn challenges) |
| Désactiver module critique | ✅ Respecté | Double protection : `module-active.middleware.ts` (bypass) + `configuration.service.ts` (blocage catégorie CRITIQUE) |

Règles ajoutées dans `.qoder/rules/elisaschool-conventions.md` section 14.1.

### Fichiers créés/modifiés v7.1
| Fichier | Action |
|---------|--------|
| `backend/src/modules/configuration/entities/configuration-app.entity.ts` | SUPPRIMÉ |
| `backend/src/modules/configuration/entities/index.ts` | Export ConfigurationApp retiré |
| `backend/src/modules/configuration/entities/parametre-systeme.entity.ts` | ENCRYPTED ajouté enum |
| `backend/src/modules/configuration/services/configuration.service.ts` | R2 pub/sub + R3 encrypt/decrypt |
| `backend/src/modules/configuration/services/configuration-history.service.ts` | ConfigurationApp retiré + legacy guard |
| `backend/src/modules/configuration/services/backup/config-backup.service.ts` | ConfigurationApp retiré |
| `backend/src/common/subscribers/tenant-isolation.subscriber.ts` | ConfigurationApp retiré de GLOBAL_ENTITIES |
| `backend/src/modules/etablissement/services/etablissement.service.ts` | Import dynamique supprimé |
| `backend/src/modules/etablissement/entities/etablissement.entity.ts` | Commentaires mis à jour |
| `backend/database/migrations/178-type-encrypted-parametres.sql` | NOUVEAU (enum ENCRYPTED) |
| `frontend/src/locales/fr/admin.json` | Clés orphelines supprimées |
| `frontend/src/locales/en/admin.json` | Clés orphelines supprimées |
| `.qoder/rules/elisaschool-conventions.md` | Section 26 ajoutée |

---

## Page Établissements Plateforme — Améliorations v8 (✅ TERMINÉ)

> Contexte : Polish de la page liste et détail des établissements dans le Control Plane.

### Améliorations Index (✅ COMPLET)
- **Filtre sousSysteme backend** — `backend/src/modules/etablissement/services/etablissement.service.ts`
  - Ajout filtre `sousSysteme` dans `findPaginated()` (colonne `e.sousSysteme`)
  - Controller : passage du paramètre query `sousSysteme` au service
- **Tri avancé frontend** — `frontend/src/routes/platform.etablissements.index.tsx`
  - Dropdown tri (Nom, Ville, Date création, Effectif, Statut) + bouton ordre ASC/DESC
  - `sortBy`/`sortOrder` passés en query params API (tri serveur, pas client)
  - Reset tri avec les autres filtres
- **Export CSV serveur** — `backend/src/modules/etablissement/controllers/etablissement.controller.ts`
  - `GET /api/etablissements/export` — génère CSV côté serveur avec BOM UTF-8
  - Accepte les mêmes filtres que la liste (recherche, statut, type, plan, sousSysteme)
  - Inclut scores santé + date création
  - Frontend : `window.open()` vers l'endpoint (plus de génération client)

### Améliorations Détail (✅ COMPLET)
- **Comparaison plateforme** — `frontend/src/features/platform/components/platform-etablissement-detail-page.tsx`
  - Section dans l'onglet Activité : `ComparaisonPlateforme`
  - Compare : élèves, taux occupation, classes vs moyenne plateforme
  - Barre de positionnement avec marqueur moyenne + flèche écart (+/-)
  - Fetch `GET /api/platform/etablissements/stats` (cache 5 min)
- **Journal d'audit** — `GET /api/etablissements/:id/audit`
  - Logs paginés avec filtres (action, sévérité, module)
  - Export CSV audit

### i18n ajouté (FR + EN)
- `etablissements.tri.*` : nom, ville, date, effectif, statut
- `etablissements.detail.activite.comparaison.*` : titre, description, élèves, taux occupation, classes, moyenne

### Fichiers créés/modifiés
| Fichier | Action |
|---------|--------|
| `backend/src/modules/etablissement/services/etablissement.service.ts` | Filtre `sousSysteme` ajouté |
| `backend/src/modules/etablissement/controllers/etablissement.controller.ts` | Endpoint `/export` + passage `sousSysteme` |
| `frontend/src/routes/platform.etablissements.index.tsx` | Tri avancé + export serveur |
| `frontend/src/features/platform/components/platform-etablissement-detail-page.tsx` | Comparaison plateforme |
| `frontend/src/locales/fr/admin.json` | Clés tri + comparaison |
| `frontend/src/locales/en/admin.json` | Clés tri + comparaison (EN) |

---

## Sidebar Plateforme v4.4 — Améliorations UX (✅ TERMINÉ)

> Contexte : Refonte du menu latéral platform avec améliorations UX, accessibilité, et nettoyage i18n.

### Structure navigation (7 groupes, 23 items)
1. **Pilotage** (3) : Dashboard, Monitoring, Revenus & MRR
2. **Établissement** (4) : Établissements, Groupes, Abonnements, Factures
3. **Plans & abonnements** (4) : Plans, Cycles & Stratégies, Quotas & Packs, Tarifs
4. **Commerce** (2) : Providers paiement, Remises & Promotions
5. **Modules et fonctions** (2) : Modules, Fonctionnalités
6. **Sécurité & Audit** (5) : Audit & Logs, Actions critiques (2FA), Sessions & Activité, Utilisateurs, Rôles & Permissions
7. **Configuration** (3) : Paramètres système, Sauvegardes, Notifications

### Améliorations v4.4
- **Auto-expand groupe actif** : le groupe contenant un sous-menu actif s’ouvre automatiquement (route matching via `useMatchRoute`)
- **Persist collapsed** : l’état collapsed/expanded de la sidebar est sauvé en `localStorage` (`platform-sidebar-collapsed`)
- **Persist expanded groups** : les groupes ouverts sont également persistés (`platform-sidebar-expanded`)
- **Mobile slide animation** : drawer mobile animé avec `framer-motion` (spring physics, backdrop fade) au lieu de mount/unmount brutal
- **Indicateur actif** : barre gauche `w-0.5 bg-danger-500` sur le groupe contenant un item actif (desktop + collapsed)
- **Séparateurs visuels** : dividers subtils (`border-t border-bordure/50`) entre chaque groupe de menu
- **Navigation clavier** : ↑↓ pour naviguer entre items, Esc pour fermer le drawer mobile, refs via `registerItemRef`
- **Badges compteurs** : pastille avec nombre de sous-items par groupe (s’adapte au contexte actif/inactif)
- **Collapsed click** : en mode collapsed, cliquer sur l’icône de groupe ouvre/ferme le groupe (toggleGroup)

### Nettoyage i18n (9 clés supprimées FR + EN)
- `navigation.permissions` (inutilisé)
- `navigation.sessionsActivite` (doublon de `navigation.sessions`)
- `navigation.moduleBuilder` (inutilisé)
- `navigation.packsQuota` (doublon de `navigation.quotasPacks`)
- `navigation.fonctionnalites` (doublon de `navigation.featureFlags`)
- `navigation.cascadeMultiNiveaux` (doublon de `navigation.parametresCascade`)
- `sidebar.groupeTenants` (inutilisé)
- `sidebar.groupeFacturation` (inutilisé)
- `sidebar.groupeCatalogue` (inutilisé)

### Fichiers créés/modifiés
| Fichier | Action |
|---------|--------|
| `frontend/src/components/layout/platform-sidebar.tsx` | v4.4 : auto-expand, persist, mobile slide, keyboard nav, séparateurs, badges, indicateurs actifs |
| `frontend/src/locales/fr/admin.json` | 9 clés i18n orphelines/dupliquées supprimées |
| `frontend/src/locales/en/admin.json` | 9 clés i18n orphelines/dupliquées supprimées |

---

## Système de Promotions v4.4 + v5 — Refonte Complète (✅ TERMINÉ)

> Contexte : Refonte complète du système de remises et promotions commerciales. Cascade 5 phases, multi-scopes, auto-promotions, analytics avancés, portail client.

### Architecture Cascade 5 Phases

| Phase | Scope | Plafond | Description |
|-------|-------|---------|-------------|
| 1 | PLAN | 40% | Remise sur base abonnement + élèves sup. |
| 2 | PACK | Sans | Remise sur packs quota |
| 2.5 | QUOTA | Sans | Remise sur ressources quota (élèves, stockage, SMS) |
| 3 | MODULE | Sans | Remise sur modules optionnels |
| 4 | GRATUITE | 0 F | Modules offerts N mois |

### v4.1-v4.4 — Fondations (✅ COMPLET)
- **BUG-1/2** : Filtrage `cibleId` + évaluation `ressourceCible` dans `estValide()`
- **BUG-3** : Tracking bundles dans `PromotionUtilisee`
- **Intégration facturation** : `packRessources` + bundle tracking dans `facturation.service.ts`
- **Statistiques usage** : `getUsageStats()` + `genererExportCSV()` dans `promotion.service.ts`
- **Export CSV** : Endpoint `GET /usage-stats/export` + bouton frontend
- **Page client** : Saisie code coupon + promotions éligibles + aperçu cascade (`mon-abonnement.tsx`)
- **Duplication** : `POST /promotions/:id/dupliquer` + bouton frontend
- **Aperçu cascade** : `POST /billing/promotions/preview-cascade` + composant `FactureBreakdown`
- **Indicateurs** : Promotions expirantes dans le tableau (badge amber)
- **i18n** : +25 clés FR+EN (dupliquer, expireBientot, preview, breakdown)

### v5 — Extensions Majeures (✅ COMPLET)

**Backend :**
- **Scope QUOTA** : Nouveau scope pour cibler ressources spécifiques (eleves, stockageGo, sms, emails, bandePassante)
- **Paliers de volume** : Dégressivité par quantité (`PalierVolume { min, max, valeur }`) dans `config.paliersVolume`
- **Auto-promotions** : 5 types contextuels (NOUVEAU_CLIENT, FIDELITE, UPGRADE, CROSS_SELL, FREE_TRIAL)
- **Planification** : `estProgrammee` + `dateProgrammation` → activation automatique par cron (toutes les 10min)
- **Évaluation déclencheur** : `evaluerDeclencheur()` vérifie conditions contextuelles (premier abonnement, ancienneté, etc.)
- **Analytics avancés** : `getAnalytics()` — répartition scope, évolution mensuelle (6 mois), top 5 promos, auto-promo, taux activité
- **Endpoint analytics** : `GET /api/platform/facturation/promotions/analytics`
- **Endpoint historique client** : `GET /api/billing/promotions/historique`
- **Migration 218** : `218-promotions-v5-extensions.sql` (colonnes, index, seeds)

**Frontend :**
- **Types** : `ScopePromotion.QUOTA`, `TypeAutoPromotion`, `PalierVolume`, `ConfigPromotion` étendu, `PromotionsAnalytics`
- **Form modal** : 3 nouvelles sections (quota resource, automatisation/planification, paliers volume)
- **Table platform** : Indicateurs auto-promo (Zap violet) + programmation (Clock amber)
- **Analytics dashboard** : `AnalyticsPanels` — bar chart scope, sparkline SVG évolution, top 5 ranking, jauge taux activité, auto-promo breakdown
- **Portail client** : `HistoriquePromotionsClient` dans `mon-abonnement.tsx` (8 dernières entrées + total déduit)
- **FactureBreakdown** : Phase QUOTA (cyan) entre packs et modules
- **i18n** : +7 clés analytics FR+EN, +2 clés historique client FR+EN

### Fichiers créés/modifiés v4.4+v5
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/services/promotion.service.ts` | `getUsageStats()`, `genererExportCSV()`, `getAnalytics()`, `activerPromotionsProgrammees()`, `evaluerDeclencheur()`, `calculerDeduction()` (paliers) |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | Endpoints: `/usage-stats`, `/usage-stats/export`, `/analytics`, `/historique`, `/dupliquer`, `/preview-cascade` |
| `backend/src/modules/billing/cron-jobs.ts` | Activation promotions programmées (toutes les 10min) |
| `backend/database/migrations/218-promotions-v5-extensions.sql` | Colonnes `est_programmee`, `date_programmation`, index, seeds |
| `frontend/src/features/billing/types/promotion.types.ts` | QUOTA scope, TypeAutoPromotion, PalierVolume, PromotionsAnalytics |
| `frontend/src/features/billing/hooks/use-promotions.ts` | `usePromotionsAnalytics()`, `useHistoriquePromotionsClient()` |
| `frontend/src/features/billing/components/promotion-form-modal.tsx` | 3 sections (quota, auto-promo, paliers) |
| `frontend/src/features/billing/components/facture-breakdown.tsx` | Phase QUOTA (cyan) |
| `frontend/src/features/billing/components/mon-abonnement.tsx` | `HistoriquePromotionsClient` + scope quota dans aperçu |
| `frontend/src/routes/platform.promotions.tsx` | `AnalyticsPanels` (graphiques CSS/SVG), indicateurs auto/promo dans table |
| `frontend/src/locales/fr/promotions.json` | +34 clés (analytics, autoPromo, form, breakdown) |
| `frontend/src/locales/en/promotions.json` | +34 clés (analytics, autoPromo, form, breakdown) |
| `frontend/src/locales/fr/billing.json` | +scopeQuota, historiquePromos, autresEntrees |
| `frontend/src/locales/en/billing.json` | +scopeQuota, historiquePromos, autresEntrees |

---

## Objective
Refactorer le module organisation et ses nomenclatures en une source de vérité unique, avec routes dédiées, composants génériques, i18n 100% flat, et permissions granulaires.

## Décisions Architecturales (consolidé v5.0 — TypePersonnel supprimé)
### Modèle de données — 7 entités + 1 template
- **Poste** : pivot central unifiant les 3 axes (où=unite, quoi=fonction, qui=occupant). Catégorie dérivée via `poste.fonction.categorie`.
- **EchelonStructurel** (ex-NiveauOrganisation + UsageUnite) : fusion des deux concepts. Champs : `niveau` (int), `code` (string, ex: 'DIRECTION'), `label`, `description`, `couleur`, `estSysteme`, `etablissementId`. `UniteOrganisationnelle` référence uniquement `echelonStructurelId`.
- **NiveauResponsabilite** : table `niveaux_responsabilite`. Axe orthogonal à EchelonStructurel (poids hiérarchique vs profondeur structurelle).
- **ModeRemunerationEntity** : source unique de vérité pour les modes de rémunération. L'enum `ModeRemuneration` du module paie est **supprimée**. FK uuid dans ContratPersonnel et TypeContratPersonnalise.
- **HierarchiePersonnel** : `typeRelationId` (FK) remplacé par `typeRelation` (varchar enum : DIRECT, FONCTIONNEL). `uniteOrganisationnelleId` supprimé (redondant avec Poste). **v4.1** : sémantique duale explicite — personne→personne (`personnelId`+`superieurId`) OU poste→poste (`posteId`+`superieurPosteId`, colonne ajoutée migration 122).
- **Fonction** : nomenclature multi-tenant hiérarchique. Porte `categorie` varchar(20) NOT NULL DEFAULT 'AUTRE' (enum `CategorieFonction` : ENSEIGNANT, DIRECTION, ADMINISTRATIF, TECHNIQUE, SERVICE, SANTE, SOCIAL, AUTRE). Remplace l'ancienne FK `typePersonnelId`.
- **Catégorie membre** : TOUJOURS dérivée (jamais stockée) via fonctions des postes occupés. API retourne `categorie`, `estEnseignant`, `categorieSource`.
- **JSONB** : `missions`, `competencesRequises` conservés sur Poste.
- **TemplateOrganisation** : JSONB (lecture seule, 22 templates). Interfaces adaptées : `TemplatePoste.categoriePosteId` supprimé, `NoeudTemplateOrganisation.usageUnite` → `echelonCode`, `niveau` supprimé.
- **Validation** : anti-cycle arborescence via CTE récursif PostgreSQL.
- **Protection seeds** : `assertNotSystem()` guard backend, UI bouton Supprimer caché + Dupliquer.

### Entités supprimées (5)
- ❌ `UsageUnite` → fusionné dans EchelonStructurel
- ❌ `CategoriePoste` → dérivé via Fonction.categorie
- ❌ `TypeRelationHierarchique` → enum varchar sur HierarchiePersonnel
- ❌ `NiveauOrganisation` → renommé EchelonStructurel
- ❌ `TypePersonnel` (v5.0) → remplacé par `Fonction.categorie` (migration 121 : drop `types_personnel` CASCADE + drop `fonctions.typePersonnelId`)

### Modules backend
- **Postes** : dans `organisation/`. Route `/api/organisation/postes`.
- **Fonctions** : entité dans `organisation/entities/`, service/contrôleur propres. Filtre `?categorie=` disponible.
- **Nomenclatures** : 3 CRUD dans `nomenclature.controller.ts` : echelons-structurels, niveaux-responsabilite, modes-remuneration. (Types-personnel supprimé v5.0.)
- **Seeds** : `seed-nomenclatures.ts` (global : echelons_structurels, niveaux_responsabilite, modes_remuneration), `seed-organisation.ts` (par établissement : fonctions avec `categorie` + unités + postes + hiérarchies).
- **Routes API REST** : pur pluriel. Actions via query params ou sous-ressources.

### Frontend
- **Navigation** : Sidebar « Organisation » : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme (vue unifiée), Nomenclatures (3 onglets : Échelons, Responsabilités, Modes rémun.), Modèles.
- **Layout** : `_auth.organisation.tsx` → Breadcrumbs + motion + ErrorBoundary + `<Outlet/>`.
- **Composants** : `NomenclatureCrudPage<T>` générique (3 nomenclatures). Pages supprimées : `categories-poste-page`, `usages-unite-page`, `niveaux-organisation-page`, `types-relation-page`, `types-personnel-page` (v5.0).
- **Hooks** : unitaires, barrel `features/organisation/index.ts`. `use-types-personnel.ts` supprimé (v5.0).
- **i18n** : 100% flat. Clés obsolètes nettoyées (categoriePoste, usageUnite, niveauOrganisation, typeRelation, typePersonnel). Nouvelles clés `personnel.categorie_*` (common.json) + `categorie_*` (organisation.json).
- **Permissions** : sous-permissions CRUD + section. `organisation:unites:read`, `organisation:postes:write`, etc.
- **Icônes** : Building2(module), GitBranch(unités/arbre structurel), Briefcase(postes), Workflow(fonctions — partout, y compris arbre/modal/détail), Network(organigramme), Layers(échelons), ArrowUpDown(responsabilités), Wallet(modes-rémun. — DollarSign banni), FileText(modèles), Sparkles(génération), GraduationCap(catégorie ENSEIGNANT), ListTree(hiérarchie), Link2(relations hiérarchiques — toggle toolbar, drawer relation, badge FONCTIONNEL, modal hiérarchie, stat hiérarchies), Maximize(fit-view — Maximize2/Minimize2 réservés au plein écran), Route(spécialités — dédup vs GitBranch unités).

### Sidebar
- "Organisation" expandable : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme, Nomenclatures, Modèles.
- Icône mère : Building2.

### Seeds ordre (initial.seed.ts)
10b. seedTypesContrat() — global
10c. seedNomenclatures() — global : echelons_structurels (fusion niveaux_organisation + usages_unite), niveaux_responsabilite, modes_remuneration
11. seedOrganisation(etablissementId) — par établissement : fonctions (avec `categorie`, seed système ENSEIGNANT protégé) + unités + postes + hiérarchies (FK résolues)
12. seedTemplatesOrganisation() — global, 22 templates (interfaces adaptées : echelonCode, sans categoriePosteId)

### Seeds demo ordre (run-demo-seeds.ts)
4. seedPersonnelDemo() — 10 membres + contrats
7. seedOrganisationDemo() — affectations postes + MembreFonction pour les 10 membres
8. seedBulletinsPaieDemo()

### Tests
- Phase dédiée après stabilisation du refactoring.

## Fond principal unique
- **Modèle** : UN SEUL fond d'écran pour le layout authentifié (plus de rotator, plus de catalogue, plus de personnalisation par établissement).
- **Fond animé actif (grill-me 2026-07-31)** : composant Originkit **Text Wave** (`frontend/src/components/originkit/ui/text-wave.tsx`, vendored, 1 seul fix TS ligne 78 : `RefObject<HTMLElement | null>` pour React 19). Grille de caractères à ripple CSS trig (pas de WebGL), rAF 30fps, auto-pause hors écran (IntersectionObserver) et onglet caché (navigateur). `@property --t` + `sin()` CSS → navigateurs modernes uniquement ; dégradation = grille statique.
- **Couche d'intégration** `frontend/src/components/layout/fond-anime.tsx` : 3 couches — (1) dégradé général OPAQUE (`FOND_DEGRADE_LIGHT` : surface→var(--color-accent-100)→var(--color-dominant-100)→surface 135° — BLEU eLISAschool principal + blanc + vert / `FOND_DEGRADE_DARK` : lueur blanche 8%→var(--color-background) (gris principal)→var(--color-accent-900)→var(--color-dominant-900) 135° — gris + bleu + blanc + vert), (2) quadrillage « cahier » statique 100% CSS (cellule 23px, lignes gris clair thème `--color-bordure` (#e5e7eb) en light / BLEU eLISAschool `--color-accent-500` (#3b82f6) en dark, opacité FORTE 75-100%, bords progressifs 0.4px — « léger effet flouté » SANS `filter: blur()` (filtre GPU plein écran coûteux, source d'instabilité de compositing en rendu logiciel — ligne douce = rampe dans les stops des repeating-gradients) + points embossés + teinte verticale `FOND_GRILLE_TINTE` (blanc 38% → accent-500 20% → noir 30%, en DERNIÈRE couche au-dessus des lignes), (3) lettres Text Wave (opacité 0.4 via `FOND_ANIME_*`, `backgroundColor="transparent"`). Résolution thème au runtime (`getComputedStyle` + MutationObserver `data-theme` + `normaliserCouleurHex` depuis `@/lib/export`). `prefers-reduced-motion` → `speed={0}` (grille figée, rAF réduit à du recalc sans changement visuel). Wrapper `fixed inset-0 -z-20`, `aria-hidden`, `pointer-events: none`. Vérif CDP 2026-07-31 : 17 couches background-image (16 + teinte), rampes 0.4px résolues (light : gris #e5e7eb 85% ; dark : accent-500 75% — suit le thème de marque), teinte blanc→bleu→noir au-dessus des lignes, `--t` animé (rAF), bascule light/dark instantanée via MutationObserver, propagation thème de marque confirmée (var custom → quadrillage+dégradé suivent à la peinture).
- **Source de vérité unique des couleurs (grill-me 2026-07-31)** : `frontend/src/components/layout/fond-palette.ts` — SEUL fichier définissant des couleurs pour le fond. Règles : couleurs existant dans l'échelle thème (globals.css @theme, réécrite au runtime par `theme-utils.appliquerThemeCSS`) → référencées par `var(--color-…)` (le thème d'un établissement se propage au fond) ; alphas via `color-mix(in srgb, var(--color-…) N%, transparent)` (chaînes statiques, socle navigateur = Text Wave) ; seules les couleurs propres au fond (stops custom, ombres relief) y sont définies en hex. Hybride assumé : quadrillage statique (color-mix) vs lettres résolues au runtime (le vendored `paletteAt()` interpole en rgb, ne peut pas consommer de var). Mapping lettres = ordre canon 60-30-10 (vert→bleu→ambre). Garde anti-drift : `scripts/check-fond-colors.sh` (hex/rgba hors fond-palette.ts dans les fichiers `fond-*` de components/layout/ → exit 1 ; originkit vendored et PageHeader exclus). Directives visuelles (grill-me 2026-07-31, version « bleu eLISAschool ») : fond light = BLEU eLISAschool principal (accent-100) + dégradé blanc et vert (dominant-100) ; fond dark = GRIS principal (--color-background) + dégradé bleu eLISAschool (accent-900), blanc (lueur) et vert (dominant-900) ; lignes = gris clair (light) / bleu eLISAschool (dark), dégradé vertical blanc→bleu→noir (blanc en haut), opacité forte, léger flou = bords progressifs.
- **`FondPrincipalBackground.tsx`** = wrapper mince → `<FondAnime />` (contract inchangé, `PageLayout.tsx` intact).
- **SVG statique conservé mais DÉSACTIVÉ (décision grill-me)** : `public/fonds-principal/fond-principal-{dark,light}.svg`, bloc statique `/fonds-principal` dans `app.ts`, nginx `^~ /fonds-principal` → backend, symlink `scripts/setup-symlinks.sh`. Inertes au runtime (rien ne les sollicite), conservés pour réactivation future. `^~` OBLIGATOIRE : la regex `~* \.(...svg...)$` (assets statiques) primerait sur un simple `location /fonds-principal` → fallback SPA (index.html). Le symlink ne se résout PAS dans le conteneur frontend (mount `../frontend:/app`, cible `../../public` hors conteneur) — c'est le backend qui sert les SVG, pas Vite.
- **Système supprimé** : module backend `apparence/` (fonds, fonds_etablissement, rotation, upload), page `/apparence`, `FondRotator`, `NidAlveoleBackground`, `FondImage`, `use-rotation-controle`, catalogue 36 SVG, permissions `apparence:fonds:*`/`audit:apparence:view`, actions audit `FOND_*`. Login et page d'accueil intouchés.
- **Nettoyage staging/prod** : `scripts/deploy-fonds-principal.sh` (idempotent — DROP tables fonds + DELETE params + permissions).
- **Clé Originkit** : `ORIGINKIT_API_KEY` (shell uniquement, jamais committer). `.originkit/` gitignoré (brief agent). Quota 10 fetches/jour. Réinstall : `npx originkit@latest add text-wave --custom-style`.

## Système d'animations et loading
- **SplashScreen v2** (`frontend/src/components/feedback/SplashScreen.tsx`) : écran de démarrage avec logo SVG qui se dessine trait par trait (pathLength Framer Motion), texte « elisaschool° » en reveal lettre par lettre, barre de progression style règle/graduation, version affichée, thème auto (light/dark via MutationObserver). Durée minimum 5s (gérée par `App.tsx`). Ultra-responsive (clamp()).
- **Intégration bootstrap** (`frontend/src/app/App.tsx`) : hook `useSplashScreen()` — affiche le splash jusqu'à `min(5s, auth._initialized)` + transition de sortie AnimatePresence (opacity 0.4s).
- **Animations CSS** (`frontend/src/styles/animations.css`) : keyframes globaux (shimmer, progress-indeterminate, fade-in-up, pulse-soft, pulse-ring, draw-stroke, bounce-soft, gradient-shift) + classes utilitaires (.animate-shimmer, .skeleton-wave, .progress-indeterminate, .progress-shimmer) + `prefers-reduced-motion` respecté. Importé dans `main.tsx` après `globals.css`.
- **Skeleton theme-aware** (`frontend/src/components/ui/Skeleton.tsx` v2.0) : `bg-gray-200` hardcodé → `bg-[var(--color-surface-hover)]`. Variants : text, circular, rectangular, card. Animations : pulse (Framer Motion), wave (CSS shimmer overlay), none. Tous les dimensions en `clamp()`. Composants : `Skeleton`, `TableSkeleton` (avec showCheckbox), `StatsCardSkeleton`, `PageSkeleton`, `FormSkeleton`.
- **ProgressBar** (`frontend/src/components/feedback/ProgressBar.tsx`) : modes `determinate` (valeur 0-100 animée) et `indeterminate` (barre glissante). Variantes : default, success, danger, accent. Tailles : sm/md/lg (clamp()). Shimmer overlay. Accessible (role=progressbar, aria-value*).
- **InlineSpinner** (`frontend/src/components/feedback/InlineSpinner.tsx`) : spinner SVG thématique (couleur dominante), tailles sm/md/lg, label optionnel. Remplace `LoadingState` pour les chargements inline/onglets.
- **SchoolLoading v2** (`frontend/src/components/feedback/SchoolLoading.tsx`) : composant thématique scolaire avec **4 thèmes animés** : `book` (livre ouvert + crayon), `pencil` (crayon écrivant sur papier), `notebook` (cahier à spirale + page qui tourne), `globe` (globe terrestre + méridiens en rotation). Props : `theme`, `variant` (full/compact), `message`. Thème auto (light/dark). Ultra-responsive (clamp). Intégré dans 18 fichiers (pages, onglets, modals, détails).
- **Composants supprimés** : `LoadingState` (feedback + ErrorMessage), `ListLoading` — remplacés par `InlineSpinner` (17 fichiers migrés) et `Skeleton` (PageSkeleton/TableSkeleton).
- **Hiérarchie loading** : SplashScreen (app startup) → SchoolLoading (page loading thématique) → PageSkeleton (page loading structure) → TableSkeleton (DataTable) → StatsCardSkeleton (cards) → InlineSpinner (inline/tabs) → ProgressBar (opérations longues).

### Blocked
— (none)

## Travail effectué — Session 2026-08-07 (templates toggle toolbar + validation masse EDT)

### Templates — section dédiée dans la toolbar
- **`edt-page.tsx`** : `EDTTemplatesPage` retiré de `renderConfiguration()` → accessible via toggle dans la toolbar secondaire (bouton `FileText`, `aria-pressed`, mutuellement exclusif avec Analytique)
- **Pattern "section toggle"** : `useState<boolean>` par section + rendu conditionnel dans `renderPlanningContent()` avec priorité (Templates > Analytique > vues planning)
- **Exclusion mutuelle** : `onClick={() => { setShowXxx(v => !v); setShowYyy(false); }}`

### Modal validation en masse (`edt-validation-masse-modal.tsx` — 427 lignes)
- **3 étapes StepperModal** : Aperçu (stats cards + détail par jour avec pastilles couleur) → Résumé (tableau détaillé trié par jour/heure + avertissement) → Résultat (loading → succès/erreur + boutons Fermer/Voir EDT)
- **Données dérivées `useMemo`** : `aValider` (statut PLANIFIE), `dejaValides` (VALIDE), `parJour` (groupement), `avecAuto` (genereAutomatiquement), `matieresDistinctes`, `totalMinutes`
- **Props StepperModal** : `validate: () => aValider.length > 0`, `nextLabels: [...]`, `hideFooterOnLastStep`, `isSubmitting={validerMutation.isPending}`, `disableNextOnInvalid`
- **Remplace** : le bouton validation directe (`validerCreneauxClasse.mutate()`) dans la toolbar → `setValidationMasseOpen(true)`

### Bugs corrigés
- **Type `resultat`** : `{ valide, total }` (incorrect) → `{ nbValides, instancesGenerees }` (aligné sur le retour du hook `useValiderCreneauxClasse`)
- **`onSuccess` non appelé** : ajout `onSuccess()` dans `handleValider` après `setResultat(res)` — le parent (`edt-page.tsx`) passe `onSuccess={() => refetch()}`

### Barrel enrichi (`features/emploi-du-temps/index.ts`)
- Ajouts : `EDTValidationMasseModal`, `EDTCreneauDetailModal`, `EDTHeuresCoursModal`, `EDTSynthese`, `EDTAudit`

### i18n — +39 clés `validationMasse.*` (FR + EN, parité complète)
- Clés principales : `titre`, `description`, `etape1-3`, `aValider_one/other`, `dejaValides_one/other`, `jours`, `matieres`, `totalHeures`, `autoGen`, `parJour`, `resumeValidation`, `detailCreneaux`, `voirResume`, `lancerValidation`, `validationEnCours`, `validationReussie`, `nbValides_one/other`, `voirEDT`, `fermer`, `erreurTitre`, `aucunAValider`, `tousValides`

### Règles mises à jour (`.qoder/rules/elisaschool-frontend.md`)
- **Règle 34** : 3 sous-sections ajoutées — "Pattern Section Toggle", "Pattern StepperModal — Validation en masse", "Lazy Loading des options par contexte"
- **Règle 34 Architecture** : liste des composants mise à jour (edt-validation-masse-modal, edt-creneau-detail-modal, edt-datepicker-modal ajoutés ; edt-filter-bar retiré car supprimé session précédente)

### Fichiers modifiés (5)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (templates toggle + validation masse modal)
- `frontend/src/features/emploi-du-temps/components/edt-validation-masse-modal.tsx` (NOUVEAU — 427 lignes)
- `frontend/src/features/emploi-du-temps/index.ts` (+5 exports barrel)
- `frontend/src/locales/fr/emplois.json` (+39 clés)
- `frontend/src/locales/en/emplois.json` (+39 clés)

## Travail effectué — Session 2026-08-07 (modal génération HeuresCours — 4 étapes + preview)

### Backend — preview HeuresCours
- **`heure-cours.service.ts`** : nouvelle méthode `previsualiserHeuresCoursFromEdt()` — même logique d'expansion que `materialiserInstances()` mais en lecture seule (query créneaux EDT validés + expansion dates + exclusion JF). Retourne `{ creneaux[], stats: { totalCreneaux, totalHeures, joursCouverts, matieresCouvertes, detailParMatiere[], detailParJour[] } }`.
- **`materialiserInstances()`** : return type enrichi avec `detailParMatiere` (tracking `creees`/`ignorees` par `matiereId` via helpers `trackSkip`/`trackCreate`).
- **`heure-cours.controller.ts`** : nouvel endpoint `POST /previsualiser` (permission `heures-cours:view`).
- **`genererHeuresCoursFromEdt()`** : retour enrichi `{ created, skipped, errors, total, detailParMatiere }`.

### Frontend — types + hooks
- **`use-heure-cours.ts`** : nouveaux types `CreneauPreviewHC`, `DetailMatierePreview`, `DetailJourPreview`, `PreviewHeuresCoursResult`. Hook `usePrevisualiserHeuresCours()` (mutation POST). `GenererHeuresCoursResult` enrichi avec `detailParMatiere`.

### Frontend — composants partagés (`generation-ui.tsx`)
- **`GenerationStatsCard`** : carte stat compacte avec 6 couleurs (dominant, accent, success, warning, danger, info), dark mode, clamp() responsive.
- **`StatsIcons`** : preset d'icônes lucide (creneaux, heures, matieres, conflits, creees, ignorees, erreurs, total).
- **`GenerationResultBreakdown`** : breakdown par matière avec barres de progression inline, supporte mode 'resultat' (creees/ignorees) et 'preview' (creneaux/heures).
- **`MiniBarChart`** : mini graphique barres pour distribution par jour.

### Frontend — refactor modal HeuresCours (4 étapes)
- **`edt-heures-cours-modal.tsx` v4.0** : passage de 3 à 4 étapes — Sélection → Aperçu (preview API) → Résumé+Confirmation → Résultats.
- **Étape Aperçu** : `GenerationStatsCard` (4 stats) + `MiniBarChart` (distribution par jour) + `GenerationResultBreakdown` (détail par matière).
- **Étape Résultats** : `GenerationStatsCard` (créées/ignorées/erreurs/total) + `GenerationResultBreakdown` (breakdown par matière). Remplace l'ancien `ResultatCard` supprimé.

### Frontend — refactor modal génération EDT
- **`edt-generation-modal.tsx`** : `ResumeCard` local supprimé → remplacé par `GenerationStatsCard` + `StatsIcons` (composants partagés). Import `BookOpen` retiré (inutilisé).

### i18n — 14 clés ajoutées FR+EN
- `generationHeuresCours.etapeApercu`, `creneauxIdentifies`, `heuresPlanifiees`, `joursCouverts`, `matieresCouvertes`, `detailParMatiere`, `detailParJour`, `aucunCreneauPreview`, `modifierSelection`, `detailParMatiereResultat`, `creeesLabel`, `ignoreesLabel`, `generationComplete`, `aucunDetail`.

### Qualité
- `tsc --noEmit` : 0 erreur frontend + backend.
- Parité i18n FR/EN complète sur le module.
- Composants réutilisables (generation-ui.tsx) partagés entre les 2 modals de génération.

## Travail effectué — Session 2026-08-06 (palette créneaux EDT — contraste WCAG)

### Utilitaire palette (`frontend/src/lib/palette-creneau.ts`)
- **Nouveau fichier** : `paletteCreneau(couleur, surface?)` → `PaletteCreneau` complet (fondTeinte, fondAssombri, texteSurFond, texteSurTeinte, bordure, fondBadge)
- **Fonctions exportées** : `hexToRgb`, `luminanceRelative`, `ratioContraste` (WCAG 2.1), `melangeCouleur`, `estCouleurClaire`
- **Contraste garanti** : `couleurTexteAuto()` choisit blanc (#ffffff) ou sombre (#1f2937) selon ratio ≥ 3:1 ; fond assombri (60% couleur + 40% noir) garantit ≥ 4.5:1 avec blanc
- **Surface adaptative** : paramètre `surface` (défaut `#ffffff`) pour le mélange en mode clair ; en dark, la surface sombre (`#111827`) est utilisée pour le fond assombri

### Composants migrés (4 vues + 1 légende + 1 synthèse)
- **`edt-month-view.tsx`** : créneaux avec `fondAssombri` + `texteSurFond` (contraste max en vue condensée)
- **`edt-calendar.tsx`** : week view avec `fondTeinte` + `texteSurTeinte` + bordure gauche `pal.bordure`
- **`edt-day-view.tsx`** : day view avec `fondTeinte` + `texteSurTeinte` + bordure gauche `pal.bordure`
- **`edt-legend.tsx`** : surface pleine (`fondAssombri`) + `texteSurFond` pour contraste amélioré
- **`edt-synthese.tsx`** : barres matières avec `fondTeinte` + bordure `pal.bordure`

### Règle frontend ajoutée (règle 34 — section EDT)
- **TOUJOURS** utiliser `paletteCreneau()` (`@/lib/palette-creneau`) pour colorer les créneaux — jamais de `backgroundColor: couleur` brut
- **NE JAMAIS** afficher une couleur matière sans contraste vérifié

### Fichiers modifiés (6)
- `frontend/src/lib/palette-creneau.ts` (nouveau, 134 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-legend.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-synthese.tsx`
- `.qoder/rules/elisaschool-frontend.md` (+2 règles palette dans section 34)

## Travail effectué — Session 2026-08-06 (cascading selects + scrollbars EDT)

### Cascading selects affectation (`edt-creneau-modal.tsx`)
- **Ancien pattern** : select unique avec recherche + `optgroup` par matière (doublons visuels)
- **Nouveau pattern** : 3 selects en cascade **Matière → Enseignant → Classe**
  - Select 1 : Matière (toutes les matières disponibles)
  - Select 2 : Enseignant (filtré par matière sélectionnée)
  - Select 3 : Classe (filtrée par matière + enseignant)
  - Résolution automatique : si 1 seule combinaison → auto-sélectionnée
  - Reset en cascade : changer matière → reset enseignant + classe
  - `disabled` progressif : enseignant désactivé tant que matière non sélectionnée, etc.
- **Interface `AffectationOption.matiere`** : ajout `id: string` (nécessaire pour cascade)
- **Hook `useAffectationsOptions`** : interface alignée (`matiere.id` + `couleur`)
- **Initialisation édition** : cascade pré-remplie depuis l'affectation existante du créneau
- **Bloc « Classe associée »** supprimé (redondant — maintenant intégré dans le cascade)

### Scrollbars calendrier (3 vues)
- **Vue jour** (`edt-day-view.tsx`) : `overflow-hidden` → `overflow-y-auto` + `maxHeight: clamp(400px, 70vh, 800px)` + hauteur calculée (`~50px/heure`)
- **Vue semaine** (`edt-calendar.tsx`) : `overflow-x-auto` → `overflow-auto` + `maxHeight: clamp(400px, 75vh, 850px)` (scroll vertical + horizontal, sticky header préservé)
- **Vue mois** (`edt-month-view.tsx`) : wrapper `overflow-x-auto` + `minWidth: min(100%, 420px)` (scroll horizontal sur petits écrans)

### i18n
- Clé `selectionnerMatiere` ajoutée FR+EN (top-level)
- Clés obsolètes supprimées : `creneau.modal.selectionnerAffectation`, `creneau.modal.rechercherAffectation`, `creneau.modal.aucunResultat`

### Fichiers modifiés (6)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (cascading selects, +52 lignes net)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (scroll vertical + hauteur calculée)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (overflow-auto + max-height)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (wrapper scroll horizontal)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (interface `matiere.id`)
- `frontend/src/locales/fr/emplois.json` (+1 clé, -3 obsolètes)
- `frontend/src/locales/en/emplois.json` (+1 clé, -1 obsolète)

## Travail effectué — Session 2026-08-06 (grill-me : fix i18n + cohérence contexte + auto-résolution cascade)

### Audit /grill-me — 3 bugs identifiés et corrigés
1. **Bug i18n (CRITIQUE)** : Clés `selectionnerMatiere/Enseignant/Classe` appelées à la racine du namespace `emplois` mais inexistantes → affichées en texte brut
   - **Fix** : Ajout des 3 clés à la racine des fichiers FR+EN (`emplois.json`)
   
2. **Bug contexte (CRITIQUE)** : `classeAnneeIdForModal = undefined` quand `contexteType !== 'classe'` → selects cascade vides hors contexte classe
   - **Fix** : Refactoré `useAffectationsOptions` pour accepter `AffectationsContexteFilter` (type+value) au lieu de `classeAnneeId?: string`
   - **Nouvelle interface** : `{ type: 'classe' | 'enseignant' | 'salle'; value: string }`
   - **Filtrage serveur** : `type=classe` → `classeAnneeId` query param
   - **Filtrage client** : `type=enseignant/salle` → limit:100 + filtrage JS côté frontend (convention backend max 100)
   
3. **Bug UX (MODÉRÉ)** : Placeholders des selects non-désactivés → sélectionnables
   - **Fix** : Ajout `disabled` sur les `<option value="">` des 3 selects cascade

### Améliorations ajoutées
- **Auto-résolution cascade 1-unique** :
  - Si Matière → 1 seul Enseignant possible → auto-sélection + résolution continue vers Classe
  - Si Enseignant → 1 seule Classe possible → auto-sélection
  - Pattern `isInitializingRef` pour distinguer initialisation vs interaction utilisateur
  - 2 `useEffect` dédiés (déclenchés sur `matiereSelectId` et `enseignantSelectId`)

- **Cohérence toolbar↔modal** :
  - `edt-page.tsx` : passage du contexte complet (`contexteType` + `contexteFilter`) au hook
  - Modal reçoit les affectations filtrées selon le contexte actif (classe/enseignant/salle)

### Fichiers modifiés (4)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` : refactoré `useAffectationsOptions` + export `AffectationsContexteFilter`
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` : passage contexte complet au hook + import type
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` : auto-résolution + `isInitializingRef` + placeholders disabled
- `frontend/src/locales/fr/emplois.json` : +3 clés racine (`selectionnerMatiere/Enseignant/Classe`)
- `frontend/src/locales/en/emplois.json` : +3 clés racine (parité EN)

## Travail effectué — Session 2026-08-06 (fix validation limit backend)

### Bug identifié via logs backend
**Erreur 400 répétée** : `[VALIDATION_ERROR] Erreur de validation: limit: Number must be less than or equal to 100`

**Cause** : Hook `useAffectationsOptions` utilisait `limit: 200` (introduit dans la session précédente), mais le backend valide avec max 100 (convention eLISAschool).

**Impact** : Cascading selects du modal créneau échouaient à charger les affectations hors contexte classe.

**Fix** : `limit: 200` → `limit: 100` dans `useAffectationsOptions` (conforme convention backend).

**Fichier modifié** :
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (ligne 528)

## Travail effectué — Session 2026-08-06 (refactor modal créneau : indépendance toolbar + ordre cascade)

### Problème identifié
Le modal de création de créneaux dépendait du filtre toolbar (Classe/Enseignant/Salle) pour charger les affectations. Les selects cascade étaient limités par le contexte toolbar, ce qui empêchait de créer des créneaux pour d'autres classes/matières/enseignants.

### Corrections apportées
1. **Indépendance modal↔toolbar** :
   - Le modal charge maintenant SES PROPRES affectations via `useAffectationsOptions()` sans filtre contexte
   - Le modal charge SES PROPRES salles via `useSallesFromCreneaux()`
   - Le filtre toolbar ne sert QU'À filtrer l'affichage des créneaux dans la vue principale
   - Props `affectations` et `salles` marquées `@deprecated` (rétrocompatibilité)

2. **Pré-sélection classe** :
   - Si contexte toolbar = classe avec valeur → `contexteClasseId` passé au modal
   - Le select classe du modal est pré-sélectionné (l'utilisateur peut la changer)

3. **Réorganisation cascade** :
   - **Nouvel ordre** : Type créneau → Classe → Matière → Enseignant
   - **Logique** : On choisit d'abord le type, puis le contexte (classe), puis le contenu (matière), puis le responsable (enseignant)
   - Plus logique pédagogiquement et fonctionnellement

4. **Auto-résolution cascade adaptée** :
   - Si Classe → 1 seule Matière possible → auto-sélection
   - Si Classe + Matière → 1 seul Enseignant possible → auto-sélection
   - Pattern `isInitializingRef` conservé pour distinguer init vs interaction

5. **Améliorations UI/UX** :
   - Selects avec hover/focus states harmonisés (`hover:border-[var(--color-dominant-400)]`)
   - Focus ring visible (`focus:ring-2 focus:ring-[var(--color-dominant-300)]`)
   - `disabled:opacity-50 disabled:cursor-not-allowed` pour les selects dépendants
   - Placeholders `disabled` (non-sélectionnables)

### Fichiers modifiés (2)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` :
  - Import `useAffectationsOptions` + `useSallesFromCreneaux`
  - Props `affectations`/`salles` dépréciées + nouvelle prop `contexteClasseId`
  - Hooks internes pour charger affectations/salles
  - Cascade réorganisée : `classesDisponibles` → `matieresDisponibles` → `enseignantsDisponibles`
  - Auto-résolution adaptée au nouvel ordre
  - Pré-sélection classe si `contexteClasseId` fourni
  - Selects UI améliorés (hover, focus, disabled states)

- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` :
  - Retrait `useAffectationsOptions` + `useSallesFromCreneaux` (plus utilisés ici)
  - Retrait import `AffectationsContexteFilter`
  - Ajout `contexteClasseIdForModal` (pré-sélection classe si contexte toolbar)
  - Modal appelé avec `contexteClasseId` au lieu de `affectations`/`salles`

## Travail effectué — Session 2026-08-06 (fix redondances + dark mode + select affectation)

### Corrections apportées
1. **Redondance jour vue quotidienne** (`edt-day-view.tsx`) :
   - `formatDate(date, 'EEEE d MMMM')` → `formatDate(date, 'd MMMM')` : suppression du jour de la date car déjà affiché en titre ("Samedi" + "samedi 15 août" → "Samedi" + "15 août")
   - `{creneauxJour.length} {t('jour.creneaux', { count })}` → `{t('jour.creneaux', { count })}` : suppression du compteur dupliqué (la traduction contient déjà `{{count}}`)
   - Clé `creneaux_zero` ajoutée FR+EN pour "Aucun créneau" / "No slots"

2. **Dark mode bloc Contexte** (`edt-creneau-modal.tsx`) :
   - `bg-[var(--color-dominant-50)]` → ajout `dark:bg-[var(--color-dominant-900)]/20`
   - `border-[var(--color-dominant-200)]` → ajout `dark:border-[var(--color-dominant-800)]`
   - `text-[var(--color-dominant-700)]` → ajout `dark:text-[var(--color-dominant-300)]`

3. **Select affectation factorisé** (`edt-creneau-modal.tsx`) :
   - **Recherche** : champ input avec icône Search pour filtrer par matière/enseignant/classe
   - **Groupement** : `<optgroup>` par matière pour lever l'ambiguïté des doublons
   - **Labels enrichis** : chaque option affiche "Enseignant — Classe" (au lieu de "Matière — Enseignant")
   - **État dédié** : `rechercheAffectation` + `useMemo` pour filtrage et groupement
   - **Message vide** : "Aucune affectation trouvée" si recherche sans résultat

### Fichiers modifiés (5)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (fix redondance jour + créneaux)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (dark mode + select groupé)
- `frontend/src/locales/fr/emplois.json` (+3 clés : creneaux_zero, rechercherAffectation, aucunResultat)
- `frontend/src/locales/en/emplois.json` (+3 clés parité FR)

## Travail effectué — Session 2026-08-06 (résumé enrichi + section JF modal création)

### Diagnostic — Logique de création/génération des créneaux
- **Modèle abstrait** : `CreneauHoraire` stocke `jour` (LUNDI...SAMEDI) + `heureDebut`/`heureFin`, PAS de date concrète
- **Année scolaire** : colonnes `periodeId` et `anneeScolaireId` nullable sur l'entité, mais jamais envoyées par le frontend
- **Résolution implicite** : via la chaîne `affectationMatiere → classeAnnee → anneeScolaire`
- **Création manuelle** : StepperModal 3 étapes (Identification → Planification → Résumé)
- **Génération batch** : `genererEmploiDuTemps()` résout automatiquement l'année scolaire via `classeAnnee`

### Améliorations apportées
- **Backend `findAll()`** : jointure `classeAnnee.anneeScolaire` ajoutée (était commentée « JAMAIS ») pour que le frontend reçoive le libellé année scolaire
- **Frontend `AffectationOption`** : interface enrichie avec `anneeScolaire` (nom, anneeDebut, anneeFin) et `matiere.couleur`
- **Résumé (étape 3) réécrit** : 2 blocs distincts + section JF dédiée :
  - **Bloc Contexte** (fond dominant-50) : Matière (nom + code), Enseignant (nom + prénom), Classe (nom + niveau), Année scolaire
  - **Bloc Planification** (fond surface-alt) : Jour, Horaire, Durée calculée (ex: « 1h30 »), Type, Salle
  - **Section JF** : si conflit `CONFLIT_JOUR_FERIE` détecté, liste les dates avec nom du JF + message informatif auto-exclusion
  - **Conflits** : les conflits JF sont affichés dans la section dédiée, pas dans les avertissements génériques
- **Durée calculée** : `useMemo` sur `heureDebut`/`heureFin` → format « XhYY » ou « Xmin »
- **i18n** : 7 clés ajoutées FR+EN (`contexte`, `matiere`, `enseignant`, `anneeScolaire`, `duree`, `joursFeriesDetectes`, `exclusionJF automatique`)

### Fichiers modifiés (5)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (+1 jointure anneeScolaire)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (résumé réécrit, +123 lignes)
- `frontend/src/locales/fr/emplois.json` (+7 clés)
- `frontend/src/locales/en/emplois.json` (+7 clés)

## Travail effectué — Session 2026-08-06 (détection conflits jours fériés)

### Problème résolu
Aucune détection de conflit avec les jours fériés n'existait. Les créneaux sont stockés avec un `jour` (LUNDI, MARDI...) et une `heureDebut`/`heureFin`, mais les jours fériés sont des dates absolues (ex: 2026-05-01 = vendredi). Il fallait résoudre le mapping jour de semaine → date réelle dans l'année scolaire pour détecter les conflits.

### Décisions de conception
- **Sévérité** : AVERTISSEMENT (warning, pas bloquant) — permet la création mais affiche un avertissement
- **Portée** : Tout (création manuelle, génération batch, prévisualisation, audit global)
- **Résolution** : Via année scolaire (mapper jour→date réelle dans la période de l'année scolaire)

### Backend — `conflit-detection.service.ts` (v1.1.0)
- **Nouveau type de conflit** : `CONFLIT_JOUR_FERIE` ajouté à `TypeConflit`
- **Nouvelle méthode privée** : `detecterConflitJourFerie()` — résout les dates du jour de semaine dans l'année scolaire, vérifie si l'une d'elles est un jour férié
- **Audit global** : section 4 ajoutée — scanne tous les créneaux existants et détecte ceux qui tombent sur un jour férié
- **Imports ajoutés** : `ClasseAnnee`, `AnneeScolaire`, `JourFerie`

### Backend — `emploi-du-temps.service.ts`
- **`genererEmploiDuTemps()`** : charge les JF de l'établissement, résout les jours de semaine qui tombent sur un JF dans l'année scolaire, les exclut de la liste `jours` utilisée pour la génération, ajoute un avertissement dans le résultat
- **`previsualiserGeneration()`** : même logique d'exclusion + ajoute un conflit `CONFLIT_JOUR_FERIE` dans le preview si des jours sont exclus
- **`classeAnnee`** : relation `anneeScolaire` ajoutée au chargement (nécessaire pour résoudre les dates)

### Frontend — Types et i18n
- **`edt.types.ts`** : `CONFLIT_JOUR_FERIE` ajouté à `TypeConflit`
- **`fr/emplois.json`** : 3 clés ajoutées dans `conflitDetection` (`conflitJourFerie`, `conflitJourFerieDesc`, `joursExclus`)
- **`en/emplois.json`** : 3 clés ajoutées (parité FR)

### Fichiers modifiés (5)
- `backend/src/modules/emploi-du-temps/services/conflit-detection.service.ts` (v1.1.0, +83 lignes)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (+84 lignes)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (+1 type)
- `frontend/src/locales/fr/emplois.json` (+3 clés)
- `frontend/src/locales/en/emplois.json` (+3 clés)

## Travail effectué — Session 2026-08-02 (continuation — i18n, dark mode, responsive EDT)

### Audit i18n complet (4 problèmes corrigés)
1. **`CONTEXTE_LABELS` hardcodé supprimé** (`edt-page.tsx`) : objet statique hors composant avec labels FR en dur → remplacé par `t(\`contexte.${type}\`)` directement dans le JSX aria-label.
2. **Clé `filtres.contexteLabel` ajoutée** FR+EN (`emplois.json`) : `t('filtres.contexteLabel')` sans defaultValue.
3. **"PDF" hardcodé traduit** (`edt-page.tsx`) : bouton `PDF` → `{t('exporterPdf')}` + clé FR/EN.
4. **Locale `'fr-FR'` hardcodée → dynamique** (3 fichiers) : `use-navigation-edt.ts`, `edt-calendar.tsx`, `edt-month-view.tsx` — `i18n.language || 'fr'` pour `toLocaleDateString()`.
5. **Abréviations jours traduites** (`edt-month-view.tsx`) : `['LUN', 'MAR', ...]` hardcodé → `t('jours.${key}')` avec abrégé responsive (`hidden sm:inline` / `sm:hidden`).

### Dark mode — classes CSS non-résolues (3 occurrences)
- **`edt-calendar.tsx`** : `text-foreground` → `text-[var(--color-text-primary)]`, `text-secondary` → `text-[var(--color-text-secondary)]`, `border-border` → `border-[var(--color-bordure)]`, `bg-surface-hover` → `bg-[var(--color-surface-hover)]`.
- `text-success` dans `edt-audit.tsx` : vérifié sain (`--color-success` existe dans globals.css).

### Vérifications
- **DataTable/FilterPanel** : `edt-liste.tsx` intègre déjà correctement le FilterPanel via DataTable (`enableCollapsibleFilters`).
- **Breadcrumbs** : pas de doublon — `PageHeader` (variant="gradient") affiche le fil d'Ariane auto, pas de breadcrumb séparé dans les sous-composants.
- **Compilation** : 0 erreur TypeScript (LSP).

### Fichiers modifiés (7)
- `frontend/src/locales/fr/emplois.json` (+2 clés)
- `frontend/src/locales/en/emplois.json` (+2 clés)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (CONTEXTE_LABELS supprimé, PDF traduit)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (locale dynamique, 3 classes CSS)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (jours traduits)
- `frontend/src/features/emploi-du-temps/hooks/use-navigation-edt.ts` (locale dynamique)

## Travail effectué — Session 2026-08-02 (optimisation performance EDT — lazy loading)

### Chargement lazy des options (performance)
**Problème** : 4 requêtes API déclenchées simultanément au chargement de la page, même si seulement 1 nécessaire selon le contexte.

**Correction** : hooks modifiés pour accepter `enabled` (TanStack Query) + conditions dans `edt-page.tsx` :
- `useToutesClasses()` — toujours chargé (contexte par défaut = 'classe')
- `useEnseignantOptions(contexteType === 'enseignant')` — chargé uniquement quand l'utilisateur passe au contexte enseignant
- `useSalleOptions(contexteType === 'salle')` — chargé uniquement quand l'utilisateur passe au contexte salle
- `useMatiereOptions(planningView === 'liste')` — chargé uniquement en vue liste

**Rétro-compatible** : paramètre `enabled = true` par défaut. Seul consommateur = `edt-page.tsx`.
**Cache** : `staleTime: 3-5 min` — une fois chargé, le switch de contexte est instantané.

### Audit log — vérification pattern
- **Controller EDT** : 0 appel `auditService.log()` — tout délégué aux services ✅
- **Service `emploi-du-temps.service.ts`** : 5 appels `auditService.log()` (create, update, delete, valider, valider-classe) — pattern correct ✅
- **Service `heure-cours.service.ts`** : audit dans le service — cohérent ✅
- **Conclusion** : le pattern signalé dans l'audit précédent ("audit dans controller") est déjà résolu.

### Fichiers modifiés (2)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (3 hooks : param `enabled` ajouté)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (conditions lazy aux 3 hooks)

## Travail effectué — Session 2026-08-02 (refactor toolbar EDT + code mort supprimé)

### Problèmes identifiés (audit HTML rendu)
- **`edt-filter-bar.tsx` = code mort** : composant standalone exporté dans le barrel mais **jamais importé** par aucun consommateur. Le même code (context switcher Classe/Enseignant/Salle) était dupliqué inline dans `edt-page.tsx`.
- **Redondance** : `CONTEXTE_ICONS` défini 2 fois (filter-bar + page).
- **Toolbar trop fragmentée** : 4 lignes séparées (navigation, vues, contexte, actions) → encombrement visuel.
- **Dark mode** : segmented buttons actifs (`bg-[var(--color-dominant-100)]`) sans variante dark explicite.
- **Accessibilité** : pas de `aria-label` sur les boutons du segmented context switcher.

### Corrections appliquées
1. **`edt-filter-bar.tsx` supprimé** : composant standalone mort, 196 lignes de code dupliqué éliminées.
2. **Barrel `index.ts` nettoyé** : export `EDTFilterBar` + `ContexteType` retirés.
3. **`edt-page.tsx` v4.0.0 — toolbar consolidée** :
   - **Row 1** (toolbar principale) : Navigation + Contexte + Actions — tout en une ligne compacte avec séparateurs verticaux.
   - **Row 2** (toolbar secondaire) : Vues (semaine/mois/jour/liste) en segmented button + Analytique.
   - **Suppression** du select dropdown de vue (redondant avec les toggles). `ChevronDown` import retiré.
   - **Dark mode** : variantes `dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]` sur tous les segmented buttons.
   - **Accessibilité** : `aria-label` ajoutés sur les boutons de contexte et les toggles de vue.
   - **Responsive** : labels masqués sur mobile (`hidden sm:inline`), `hidden lg:inline` pour “Heures de cours”. Navigation label passé en `hidden md:inline`.
4. **Imports nettoyés** : `ChevronDown`, `X`, `JourSemaine`, `FilterPanel`, `FilterDef` retirés (non utilisés).

### Backend — confirmé sain
- `queryCreneauxSchema` (DTO) supporte déjà `matiereId` (l.71) + `affectationMatiereId` (l.67).
- `findAll` service applique `am.matiereId = :matiereId` (l.88).
- Pas de modification backend nécessaire.

### Qualité
- `tsc --noEmit` : 0 erreur sur le module EDT.
- 4 rows → 2 rows (réduction 50% de l'encombrement vertical toolbar).
- 196 lignes de code mort supprimées (`edt-filter-bar.tsx`).
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur.

## Travail effectué — Session 2026-08-02 (fix i18n EDT — collision clé `jour`)

### Bug critique corrigé
- **`edt-liste.tsx`** : `t('jour')` utilisé comme header de colonne et label de filtre DataTable → `jour` est un **objet** dans le JSON (`{ vide, precedent, suivant, creneaux_one, creneaux_other }`), pas une string. Résultat : `[object Object]` affiché au lieu de "Jour".
- **Fix** : `t('jour')` → `t('calendrier.jour')` (clé existante = "Jour" FR / "Day" EN). 2 occurrences corrigées (header colonne l.28, label filtre l.178).
- **Convention i18n ajoutée** : règle 35 dans `elisaschool-frontend.md` — ne jamais nommer une clé objet et une clé string identiques au même niveau. Utiliser des namespaces distincts (`calendrier.jour` pour le label, `jour.vide` pour la vue jour).

### Qualité
- 0 `t('jour')` restant dans le module EDT. `calendrier.jour` = "Jour" (FR) / "Day" (EN) vérifié dans les deux fichiers JSON.
- Parité i18n FR/EN complète sur le module EDT (343+ clés).

## Travail effectué — Session 2026-08-04 (audit deep-dive EDT + corrections frontend)

### Contexte
Audit de conformité du module EDT vs conventions eLISAschool (rapport livré en conversation, décisions Q1–Q6 validées : rapport d'abord, axe équilibré P0/P1/P2, rapport en conversation, granularité par composant + blocs transverses, backend niveau service, workflow validation générique NON recommandé). Corrections à faible risque implémentées ; chantiers lourds documentés (refonte DataTable, barrels) en attente de validation séparée.

### Verdicts rapport
- **Backend** : ✅ services sains (conflit-commun, heure-cours v1.2.0, cron-jobs, controller permissionné). ⚠️ P1 `conflit-detection.service.ts` l.187 : `coEnseignantIds` SQL brut `ANY(string_to_array(...))` non indexable + `auditConflitsGlobaux` 3 scans. ⚠️ P1 : audit loggé dans le controller EDT (15 appels l.33-238) vs dans le service pour heure-cours (13) — pattern à uniformiser (déplacer dans le service). P2 documenté : table jonction co-enseignants, `creneauId` NOT NULL, triggers DB, dé-normalisation `typeCreneau`/`salleId`.
- **Frontend** : ✅ conforme edt-page/calendar/month-view/preferences (+ templates mineur). 🔴 edt-liste (table artisanale). ⚠️ edt-generation-modal (stepper maison), edt-synthese, edt-audit, edt-heures-cours-modal, edt-filter-bar (emojis). Bonus : tab-heure-cours sans ErrorBoundary, 3 hooks morts `use-heure-cours`.

### Corrections implémentées (10 fichiers)
1. **Règle 34 ajoutée** `.qoder/rules/elisaschool-frontend.md` : pattern module EDT (DataTable partagée, jamais setState pendant rendu, StepperModal/StatCard partagés, icônes lucide partout, CSS vars, JOUR_MAP canonique, ErrorBoundary onglets personnel, imports via barrels, parité i18n, audit dans services).
2. **`edt-liste.tsx` (P0 setState pendant rendu)** : `setPage(Math.min(page, …))` → dérivation pure `pageEffectif = Math.min(page, totalPages)` ; badges green/blue hardcodés → `var(--color-success)`/`var(--color-info)` /10 (pattern AuditTimeline/Badge) ; colonnes « Type »/« Statut » → `t('type')`/`t('statut')`.
3. **i18n EN** : 61 clés manquantes ajoutées (`synthese.*`, `audit.*`, `generationHeuresCours.*`) + `type`/`statut` FR+EN → parité 343/343 (vérifiée par script Python).
4. **`personnel-detail-page.tsx`** l.785-789 : `<TabHeureCours>` enveloppé `<ErrorBoundary key="heures-cours">` (aligné autres onglets).
5. **`edt-day-view.tsx`** : bug `JOUR_MAP :{0:'SAMEDI'}` corrigé → `{1:'LUNDI'…6:'SAMEDI'}` + fallback `t('jour.vide')` ; `dateStr` via `formatDate(date, 'EEEE d MMMM')` (@/lib/date-utils) ; **code mort supprimé** `statut === 'ANNULE'` (inexistant sur StatutCreneau → erreur TS2367) ; rouge → `var(--color-danger)`.
6. **`edt-month-view.tsx`** : vue mois TOUJOURS vide (bug logique) — groupement par `c.date` (champ inexistant) → groupement par `c.jour` (hebdomadaire récurrent) + lookup cellule par index colonne (`JOURS_INDEX`). Erreurs TS2339 résolues.
7. **Couleurs → CSS vars** : edt-synthese (3), edt-audit (18), edt-heures-cours-modal (15) ; grep final : seul `#3b82f6` (input type=color) légitime.
8. **`edt-creneau-modal.tsx` réécrit** (~450 l. → 460 l.) sur `StepperModal` partagé (3 étapes, validate étape 1 affectation + étape 3 conflits bloquants, footerActions Valider/Supprimer, ConfirmationModal propagation). Imports CustomModal/ChevronRight/ant retirés. **⚠️ piège dominant** : classes `text-destructive`/`border-destructive/30` **aucun CSS généré** (`--color-destructive` absent de `@theme` — seule `--color-danger` existe) — remplacées par `var(--color-danger)`. Emojis 🔴/🟠 → lucide AlertTriangle/AlertCircle.
9. **`edt-filter-bar.tsx`** : emojis 🏫👨🏫🚪 → lucide (Users/GraduationCap/DoorOpen).
10. **`StepperModal.tsx` étendu** (rétro-compatible) : props `footerActions?: ReactNode` + `onStepChange?: (index)` ; footer = `{footerActions}<ElisaButton ghost Annuler>` ; handlePrev/handleStepClick/handleClose/handleNext notifient onStepChange.

### Qualité
- `npx tsc --noEmit` **0 erreur full frontend** (exit 0). Parité i18n FR/EN 0 manquante. 0 emoji dans le module EDT. 0 classe destructive ; convention = `var(--color-danger)`.

### Chantiers documentés (non implémentés — validation séparée)
- **T2** : refonte edt-liste sur DataTable partagée (P1).
- **T6** : barrels personnel (`features/personnel/index.ts` n'exporte ni use-heure-cours ni TabHeureCours/HeureCoursFormModal/OngletEdt) ; edt-synthese + edt-heures-cours-modal importent par chemins directs.
- **Backend P1** : co-enseignants indexable + audit déplacé dans les services EDT.
- 3 hooks morts `use-heure-cours` (P2 nettoyage).

### Corrections complémentaires (session suite — 2026-08-04)
- **edt-generation-modal migré sur StepperModal** (T3 complet) — modal autonome (contrat `open`/`onOpenChange` retiré de edt-page), 3 étapes Options/Préview/Succès. **Piège `isStepValid`** : le StepperModal appelle `validate` à chaque rendu pour le `disabled` — un `validate` async avec effets (preview/génération) déclencherait des requêtes en double → `disableNextOnInvalid={false}` (le `validate` reste click-only dans `handleNext`). Stephés : step 1 `validate: async runPreview`, step 2 `validate: async runGeneration`, step 3 footer caché (`hideFooterOnLastStep`) + boutons Fermer/VoirEDT dans le contenu. Labels primaires par étape via `nextLabels` (Prévisualiser→Prévisualisation…→Générer→En cours…→Générer malgré les conflits). Reset d'état à la fermeture (useEffect). Clé i18n `generation.previewErreur` ajoutée FR+EN.
- **StepperModal étendu** : props `nextLabels?: string[]` (label du bouton principal par étape) + `hideFooterOnLastStep?: boolean` (footer masqué à la dernière étape). Rétro-compatibles.
- **T6 barrels** : `features/personnel/index.ts` exporte désormais `use-heure-cours`, `TabHeureCours`, `HeureCoursFormModal`, `OngletEdt` ; edt-heures-cours-modal importe via `@/features/personnel`. Plus aucun import cross-feature direct dans personnel.
- **3 hooks morts supprimés** de `use-heure-cours.ts` : `useEdtEnseignant`, `useVolumeHoraire`, `useHeureCoursById` (aucun import).

### Corrections appliquées (4 modifications, 2 fichiers)

1. **Motif de propagation** (`heure-cours.service.ts` l.343-351) : traçabilité des changements propagés dans `commentaire` — format `Propagé(xxxxxxxx): jour→MARDI, début→08:00, salle→uuid`. Concaténé avec commentaire existant via `filter(Boolean).join(' | ')`.

2. **Save par lots — propagation** (`heure-cours.service.ts` l.366-373) : remplacement du `mgr.save(cibles)` monolithique par des chunks de 50. Réduit la charge DB pour les propagations de masse (30 créneaux × 16 semaines = 480 instances).

3. **Commentaire architecture** (`heure-cours.entity.ts` l.39-61) : bloc JSDoc documentant que toutes les écritures HeureCours doivent passer par `HeureCoursService`. Décrit les 4 flux (propagation, matérialisation, annulation, remontée).

4. **Bulk insert — matérialisation** (`heure-cours.service.ts` l.1015-1016, 1096-1111) : remplacement des `this.repo.save(hc)` individuels (N requêtes) par accumulation dans `batch[]` + flush par chunks de 50 en fin de semaine. Réduction : 480 requêtes → ~10 requêtes.

### Fichiers modifiés (2)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (+33 lignes, -4 lignes)
- `backend/src/modules/personnel/entities/heure-cours.entity.ts` (+23 lignes)

### Cohérence vérifiée
- `mgr` utilisé dans propagation (transactionnel) vs `this.repo` dans matérialisation (pas de transaction externe)
- Motif annulation (`annulerInstancesCreneaux` SQL COALESCE) inchangé
- Audit trail existant conservé (l.375-385 propagation, l.1118-1127 matérialisation)

## Travail effectué — Session 2026-08-03 (Phase 1 — traçabilité, performance, architecture EDT)

### Corrections appliquées (4 modifications, 2 fichiers)

1. **Motif de propagation** (`heure-cours.service.ts` l.343-351) : traçabilité des changements propagés dans `commentaire` — format `Propagé(xxxxxxxx): jour→MARDI, début→08:00, salle→uuid`. Concaténé avec commentaire existant via `filter(Boolean).join(' | ')`.

2. **Save par lots — propagation** (`heure-cours.service.ts` l.366-373) : remplacement du `mgr.save(cibles)` monolithique par des chunks de 50. Réduit la charge DB pour les propagations de masse (30 créneaux × 16 semaines = 480 instances).

3. **Commentaire architecture** (`heure-cours.entity.ts` l.39-61) : bloc JSDoc documentant que toutes les écritures HeureCours doivent passer par `HeureCoursService`. Décrit les 4 flux (propagation, matérialisation, annulation, remontée).

4. **Bulk insert — matérialisation** (`heure-cours.service.ts` l.1015-1016, 1096-1111) : remplacement des `this.repo.save(hc)` individuels (N requêtes) par accumulation dans `batch[]` + flush par chunks de 50 en fin de semaine. Réduction : 480 requêtes → ~10 requêtes.

### Fichiers modifiés (2)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (+33 lignes, -4 lignes)
- `backend/src/modules/personnel/entities/heure-cours.entity.ts` (+23 lignes)

### Cohérence vérifiée
- `mgr` utilisé dans propagation (transactionnel) vs `this.repo` dans matérialisation (pas de transaction externe)
- Motif annulation (`annulerInstancesCreneaux` SQL COALESCE) inchangé
- Audit trail existant conservé (l.375-385 propagation, l.1118-1127 matérialisation)

## Travail effectué — Session 2026-08-03 (Lot 2 — Q7 matérialisation auto HeureCours + Q8 nettoyage)

### Contexte
Suite du grill Q1–Q8 : matérialisation automatique des instances HeureCours à partir des créneaux hebdomadaires. **Q8 (code mort)** terminé, **Q7 (matérialisation auto)** complet backend + frontend, vérifié par walkthrough API réel (8/8 verts).

### Sémantique Q7 (décisions actées)
- **`genereAutomatiquement`** = flag d'autorisation sur CreneauHoraire, **défaut `true`** (défaut DB `false` mais le service force `?? true` à la création ; le générateur EDT force `true`).
- **Canal A** : à la validation (PLANIFIE→VALIDE), matérialisation des instances de la semaine courante → S+1, uniquement pour les créneaux flag-auto.
- **Canal B** : cron **configurable par établissement** — `materialisationAuto` JSONB sur PreferenceEmploiDuTemps : `{actif, horaires: [{jour, heure}]}` (1..14 horaires, 7 jours, validation zod). **Défaut** : samedi 21:00 + mercredi 21:00. Garde journalière (1 run/jour/établissement).
- **Plage** : `[lundi de la semaine courante, dimanche S+1]`, **clampée aux bornes de l'année scolaire EN_COURS** (`enCours=true` OU `statut=EN_COURS`, **tri `dateDebut DESC`** si plusieurs — doublon de données découvert au walkthrough). Hors bornes → ignoré proprement.
- **Fuseau** : cron node-cron `timezone: 'Africa/Douala'` + calcul jour/heure/date via `Intl.DateTimeFormat` (fix bug : `new Date()` serveur = UTC → décalage 1h).

### Backend (6 fichiers)
- **`heure-cours.service.ts`** : coeur réutilisable `materialiserInstances({etablissementId, enseignantId?, classeAnneeId?, creneauIds?, dateDebut, dateFin, periodeId?, respecterFlagAuto?, createurId?, req?})` (anti-doublon + conflit enseignant conservés) ; `genererHeuresCoursFromEdt` délègue avec `respecterFlagAuto: false` ; nouvelle `materialiserSemainesCourantes()` (plage + clamp année + `respecterFlagAuto: true`).
- **`emploi-du-temps.service.ts`** : `creerCreneau` → `genereAutomatiquement: dto.genereAutomatiquement ?? true` ; Canal A dans `validerCreneau` (creneauIds: [id]) et `validerCreneauxClasse` (creneauIds: idsAuto).
- **`emploi-du-temps.dto.ts`** : `genereAutomatiquement: z.boolean().optional()` (création) ; `horaireMaterialisationSchema` + `materialisationAutoSchema` (horaires 1..14) dans `preferenceEmploiDuTempsSchema`.
- **`preference-emploi-du-temps.entity.ts`** : interfaces `HoraireMaterialisation`/`MaterialisationAutoConfig` + colonne `materialisationAuto jsonb` (sauvegarde via Object.assign, inchangé).
- **`cron-jobs.ts`** (nouveau) : `DEFAULT_MATERIALISATION_AUTO`, `materialiserSiNecessaire()` (garde journalière Map), `initEmploiDuTempsCronJobs()` (cron `'* * * * *'`, timezone Africa/Douala, try/catch par établissement).
- **`index.ts`** : `initEmploiDuTempsCronJobs()` câblé. **Migration `140-materialisation-auto.sql`** (colonne jsonb, idempotente).
- ⚠️ Index unique anti-doublon : **déjà existant** via migration 139 (`idx_heures_cours_no_dup` partiel `deletedAt IS NULL` + `idx_heures_cours_no_dup_manuel`) — rien à créer.

### Q8 — Code mort supprimé (frontend)
- `edt-heure-cours-modal.tsx` supprimé (+ export barrel) ; hooks `useValiderCreneau`/`useValiderCreneauxClasse` + type `ResultatValidationClasse` supprimés (**routes backend `POST /:id/valider` et `/valider-classe/:classeAnneeId` conservées**) ; clés i18n mortes (`creneauValide`, `classeValide`, `erreurValidation`) supprimées FR/EN.
- **Filtres fantômes** `inclureHeuresCours`/`typeSource` supprimés de `CreneauFilters` + `onglet-edt.tsx` (le backend ne les a jamais traités — seule mention dans la migration 071).

### Frontend Q7
- **`edt-preferences.tsx`** : carte « Matérialisation automatique » — checkbox actif, lignes jour+heure (selects + time inputs), ajout/suppression d'horaires (max 14, min 1), bouton Réinitialiser mis à jour, `DEFAULT_MATERIALISATION_AUTO` local, i18n FR/EN (`preferences.materialisationAuto*`).
- **`edt-creneau-modal.tsx`** : checkbox `genereAutomatiquement` (étape Identification, défaut true, payload création uniquement) + clé i18n `creneau.modal.genereAutomatiquement` FR/EN.
- **`edt.types.ts`** : `PreferenceEDT.materialisationAuto?` typé.

### Walkthrough API réel (SUPER_ADMIN, CM1) — 8/8 verts
1. Validation créneau flag=true → **2 instances** (MARDI 4 + 11 août) ✅
2. Créneau flag=false → validation → **0 instance** ✅
3. `validerCreneauxClasse` → matérialise seulement les flag-auto (0 ici : les 2 validés étaient flag=false) ✅
4. **Idempotence** : re-run → `2 ignorées`, aucun doublon ✅
5. Garde année scolaire : hors bornes → « Matérialisation auto ignorée » ✅
6. Config préférences PUT/GET + validation zod (15 horaires → 400 VALIDATION_ERROR) ✅
7. Cron : config LUNDI 03:01 → déclenchement → **10 créées / 2 ignorées** ✅
8. Garde journalière : re-déclenchement même jour → rien ✅
- **Bug découvert/fixé** : fuseau cron (heure serveur UTC vs Africa/Douala) → `maintenantFuseau()` via Intl.
- **Bug découvert (données)** : 2 années scolaires EN_COURS sur des établissements différents — comportement correct après tri DESC.
- Données de test nettoyées : heures_cours restaurées à 13, créneaux de test supprimés, année scolaire et préférence restaurées.

### Qualité
- tsc backend : 0 nouvelle erreur (297 préexistantes hors périmètre, dont cron-jobs audit/auth `scheduled: true` TS2353). tsc frontend : 0 erreur in-scope. JSON i18n valides FR/EN.

## Travail effectué — Session 2026-08-03 (suite — migration 141 soft delete + vérif instrumentation)

### Migration `141-soft-delete-rh-organisation.sql` (créée + appliquée en local)
- **19 tables** avec `deletedAt TIMESTAMP NULL` (ADD COLUMN IF NOT EXISTS, DO $$ idempotent) : les 13 entités D1 (personnel×6 : absences_personnel, evaluations_enseignants, heures_cours, affectations_postes, progressions_programme, indisponibilites_enseignants ; paie×4 : cotisations, types_primes, types_retenues, elements_salaire ; organisation×3 : unites_organisationnelles, postes, hierarchie_personnel) + tables RH/EDT déjà en soft delete créées via synchronize uniquement (membres_personnel, contrats_personnel, bulletins_paie, creneaux_horaires, annonces, backup_records).
- **⚠️ Ordre staging/prod** : la migration 139 (index unique heures_cours, `WHERE "deletedAt" IS NULL`) exige la colonne sur heures_cours → appliquer la **141 AVANT la 139** (documenté en en-tête de la migration + Next Move).
- Les migrations SQL ne sont PAS branchées sur TypeORM (`data-source.ts` sans glob migrations) → application manuelle via psql/docker (comme les 122–131).

### Vérification instrumentation (Next Move items 4–5) — tout déjà présent
- `bulletin-paie.service.ts` : 8 appels `auditService.log` (CREATE/UPDATE/DELETE/GENERATE/PUBLIE) ✅
- `absence-personnel.service.ts` : 4 actions (CREATE/UPDATE/DELETE/JUSTIFIER) ✅
- `evaluation.service.ts` (nom réel — pas evaluation-enseignant.service.ts) : 3 actions ✅
- `progression-programme.service.ts` : 3 actions ✅
- `indisponibilite-enseignant` : **entité sans service** (inerte, aucun CRUD exposé) → rien à instrumenter.

### Qualité
- Migration appliquée en local : 19 NOTICE « already exists, skipping » (colonnes créées par synchronize), exit 0, 20 tables avec deletedAt au total.

## Travail effectué — Session 2026-08-03 (synchronisation CreneauHoraire ↔ HeureCours — Lot 1 complet)

### Contexte
Grill Q1–Q8 : synchronisation bidirectionnelle entre les créneaux hebdomadaires de l'EDT et les instances de cours datées. **Lot 1 (backend + frontend)** terminé et vérifié par walkthrough API réel. Lot 2 (matérialisation auto, nettoyage) à venir.

### Sémantique retenue (Q1–Q6)
- **Hybride à frontière temporelle (Q4)** : une instance suit le créneau si `statutEffectue = PLANIFIE` ET `date >= aujourd'hui` ; sinon figée (passée/effectuée/annulée).
- **Propagation (Q2)** : modification jour/heure/salle/type du créneau → instances futures PLANIFIE alignées. **Suppression créneau** → instances futures PLANIFIE passent à `ANNULE` (+ motif en commentaire). **Régénération EDT** = soft delete des créneaux + ANNULE des instances liées.
- **Conflits (Q5)** : dry-run AVANT toute écriture dans `updateCreneau` ; 409 `CONFLITS_PROPAGATION` avec `details.{ rapport }` ; mode `propagerForce` = exclure les instances en conflit.
- **Q6-C** : case explicite `mettreAJourCreneau` (défaut OFF) — le PATCH d'une instance peut aussi mettre à jour le créneau hebdo + propager aux autres instances (instance courante exclue via `excludeInstanceIds`).

### Backend (5 fichiers)
- **`heure-cours.service.ts`** : types `ConflitPropagation`/`RapportPropagation{instancesQuiSuivent,instancesInchangees,conflits}`/`ChangementsPropagation` ; `propagerModificationCreneau` (2 passes : calcul+conflits sans écriture, puis `save(cibles)`) ; `annulerInstancesCreneaux` ; `appliquerModificationAuCreneau` (Q6-C, check hebdo `conflitDetectionService.detecterConflits` filtre BLOQUANT → 409 `CONFLITS_CRENEAU`) ; helpers `dateToString`/`toDate`/`lundiDeSemaine`/`jourVersIndex`/`jourDepuisDate` **tolérants `Date | string`** (le driver pg retourne les colonnes `date` en string — bug découvert au walkthrough).
- **`heure-cours.dto.ts`** : `mettreAJourCreneau: z.boolean().optional()`.
- **`heure-cours.controller.ts`** : PATCH → `{ data: heureCours, rapport }`.
- **`emploi-du-temps.service.ts`** : `updateCreneau(id, dto, etablissementId, userId?, req?)` → `{ creneau, rapport }` — dry-run AVANT save **avec `force: propagerForce`** (sinon le service de propagation jetait avant le contrôle du 409 — fix walkthrough) ; `supprimerCreneau` → `{ instancesAnnulees }` ; `genererEmploiDuTemps` : ids → `softDelete().whereInIds()` + `annulerInstancesCreneaux` (motif régénération) si `options.regenerer`.
- **`emploi-du-temps.dto.ts`** : `propagerForce: z.boolean().optional()`.

### Frontend (8 fichiers)
- **`edt.types.ts`** : `ConflitPropagation`, `RapportPropagation`, `ResultatUpdateCreneau{success,data,rapport?}`, `ChangementsCreneau`.
- **`use-emploi-du-temps.ts`** : `useUpdateCreneau` accepte `propagerForce`, 409 silencieux (le composant gère le force), toasts `creneauModifiePropage`/`creneauSupprimeAvecInstances` ; `useSupprimerCreneau` → `{ instancesAnnulees }`. **Doublon `useGenererHeuresCoursFromEdt` supprimé** (ré-import depuis `personnel/hooks/use-heure-cours`, source unique).
- **`edt-calendar.tsx`** : `soumettreModification` (mutateAsync + capture 409 → `forceRequest` + invalidation serveur) et `forcerPropagation` **déclarés AVANT `handleDragStart`** (TS2448/2454 — hoist) ; bannière force : `propagation.{conflitsTitre,conflitsMessage,forcer,annuler}` ; drag/resize passent par la soumission.
- **`edt-creneau-modal.tsx`** : bouton Supprimer (danger, si édition) + `ConfirmationModal` (`propagation.supprimer*`) → DELETE + close ; onError PATCH 409 → toast message backend.
- **`heure-cours-form-modal.tsx`** : checkbox `mettreAJourCreneau` (si `cours.creneauId`, payload conditionnel) + garde UI REMPLACE (avertissement + bouton disabled si pas de remplaçant).
- **`use-heure-cours.ts`** : `HeureCours` + `creneauId?/affectationMatiereId?/updatedAt?` ; `useGenererHeuresCoursFromEdt` enrichi (type complet, toasts `heuresCours.generationReussie/erreurGeneration`, invalidation croisée `['personnel','heures-cours']` + `['emploi-du-temps']`).
- **i18n** : `emplois.json` — bloc `propagation.*` (7 clés), toasts propagation ; `personnel.json` — `heuresCours.{mettreAJourCreneau,mettreAJourCreneauAide,remplacantRequis}`. Clé morte `toasts.heuresCoursGenerees` supprimée.

### Bugs découverts au walkthrough réel (tous corrigés)
1. **Colonnes `date` pg = strings** : `dateToString`/`lundiDeSemaine`/`jourDepuisDate` + l.643 `update()` (`.toISOString()` sur string) → tolérance `Date | string` + helper `toDate()`.
2. **Dry-run sans force** : `propagerModificationCreneau` jetait 409 lui-même → le contrôle `propagerForce` du service EDT était mort ; `force: propagerForce` passé au dry-run.
3. **Doublon `useGenererHeuresCoursFromEdt`** (personnel + emploi-du-temps) → unifié côté personnel.
4. **TS2448/2454** : `soumettreModification` utilisé avant déclaration (drag/resize) → hoist + `return (` dupliqué nettoyé.

### Walkthrough API réel (SUPER_ADMIN, CM1, 17 créneaux, 13 instances) — tout vert
- PATCH créneau heureDebut/Fin → `rapport {1,0,[]}`, instance DB alignée ✅
- Changement jour → 409 `CONFLITS_PROPAGATION` (1 suit / 1 conflit enseignant+classe exclue) ✅
- `propagerForce:true` → créneau appliqué, conflit exclu, rapport complet ✅
- DELETE créneau → `{ instancesAnnulees: 2 }`, instances `ANNULE` + motif « Créneau supprimé » ✅
- PATCH instance `mettreAJourCreneau:true` → créneau + autres instances alignées (08:00-08:55) ✅
- Gardes REMPLACE : `REMPLACANT_REQUIS` (sans id) / `REMPLACANT_INVALIDE` (id inexistant) ✅
- PATCH instance en conflit → 409 `CRENEAU_CONFLIT` avec liste ✅
- POST /generer `{options:{regenerer:true}}` → 3 créneaux recréés, anciens soft-deletés, instances ANNULE (motif régénération) ✅
- Données de test nettoyées (7 lignes), heures_cours restaurées à 13.

### Qualité
- tsc frontend : 0 erreur in-scope (fichiers Lot 1). Backend : 0 nouvelle erreur (297 préexistantes hors périmètre — controller DonneesCreneau, PDF nom/prenom, salleNom, TS1064, PreferenceEmploiDuTemps).
- 0 `any` nouveau, 0 couleur hardcodée, i18n FR/EN parité.

## Travail effectué — Session 2026-08-02 (EDT P2–P5 : preview, pointage, timeline, export)
### P2 : Génération progressive avec preview + résolution conflits
- **Backend** : route `POST /api/emploi-du-temps/previsualiser` ajoutée au controller (dry-run, permission `emploi-du-temps:generer`). Service `previsualiserGeneration()` déjà existant.
- **Frontend types** : `CreneauPreview`, `ConflitPreview`, `ResumePreview`, `ResultatPreviewEDT` ajoutés à `edt.types.ts`.
- **Frontend hook** : `usePrevisualiserEDT()` ajouté à `use-emploi-du-temps.ts`.
- **Modal multi-étapes** : `edt-generation-modal.tsx` réécrit (3 étapes : Options → Preview → Succès). Stepper animé (Framer Motion), 4 resume cards (créneaux/heures/matières/conflits), liste créneaux filtrée par jour, onglet conflits, bouton "Générer malgré les conflits" si conflits détectés.
- **i18n** : 18 nouvelles clés FR+EN dans `emplois.json` (generation.preview.*, generation.succes.*, toasts.erreurPreview).

### P3 : Page dédiée HeureCours (suivi effectif, pointage)
- **Backend** : déjà complet (CRUD, génération depuis EDT, volume horaire, résumé mensuel, conflits).
- **Frontend** : `tab-heure-cours.tsx` réécrit (v2) — toggle Résumé/Liste détaillée, filtre par statut (TOUS/PLANIFIE/EFFECTUE/ANNULE/REMPLACE), liste groupée par date avec pointage rapide inline (boutons ✓/✗ pour marquer effectué/annulé), hover reveal actions, badge statut coloré.
- **i18n** : 11 nouvelles clés FR+EN dans `personnel.json` (vueResume, vueListe, marquerEffectue, marquerAnnule, statutChange.*).

### P4 : Timeline verticale Google Calendar
- **Indicateur temps réel** : ligne rouge horizontale avec point showing current time, mise à jour toutes les minutes (setInterval 60s), visible uniquement dans la plage horaire.
- **Clic cellule vide** : prop `onCellClick` ajoutée à `EDTCalendar`, hover background sur les cellules, cursor-pointer.
- **Cartes améliorées** : fond coloré subtil via `color-mix(in srgb, couleur 8%, surface)` au lieu de surface uni.

### P5 : Navigation semaine + export PDF
- **Navigation semaine** : barre de navigation avec boutons prev/next (ChevronLeft/ChevronRight) + bouton "Aujourd'hui" (highlighted si semaine courante). Calcul du lundi de la semaine via `semaineOffset`, numéro de semaine ISO, label "28 juil. — 3 août".
- **Dates dans les colonnes** : `edt-calendar.tsx` accepte `semaineDebut?: Date` — affiche la date réelle sous le nom du jour (ex: "Lundi\n4 août"). Le jour courant est highlighté en couleur accent (`bg-[var(--color-accent-600)]`).
- **Clic → créer créneau** : `handleCellClick` wired dans `edt-page.tsx`, ouvre le modal créneau.
- **Export PDF** : bouton Download ajouté dans la toolbar de la page EDT (visible quand une classe est sélectionnée).
- **i18n EN** : clés `calendrier.semaine`, `precedent`, `suivant`, `aujourdhui`, `jour` ajoutées dans `en/emplois.json`.

### Fichiers modifiés (13)
- `backend/src/modules/emploi-du-temps/controllers/emploi-du-temps.controller.ts` (route /previsualiser)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (types preview)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (hook preview)
- `frontend/src/features/emploi-du-temps/components/edt-generation-modal.tsx` (réécrit v2, 418 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (indicateur temps réel, onCellClick, cartes colorées, dates colonnes, semaineDebut)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (onCellClick, export PDF, navigation semaine)
- `frontend/src/features/personnel/components/tab-heure-cours.tsx` (réécrit v2, 324 lignes)
- `frontend/src/locales/fr/emplois.json` + `en/emplois.json` (clés preview + navigation)
- `frontend/src/locales/fr/personnel.json` + `en/personnel.json` (clés pointage)
- `AGENTS.md` (cette section)

## Travail effectué — Session 2026-08-02 (audit EDT — recommandations grill-me)
### Recommandations implémentées (9/9)

**P0 — Backend critiques** :
- **P0-1** : `genererHeuresCoursFromEdt` vérifie maintenant les conflits enseignant (chevauchement horaire) avant création — retourne liste des conflits dans le résultat.
- **P0-2** : Nouvel endpoint `GET /api/emploi-du-temps/audit-conflits` — scan global de tous les conflits EDT (par groupe classe/jour, enseignant/jour, salle/jour) avec sévérité (bloquant/avertissement).
- **P0-3** : `getStatistiques()` calcule désormais `conflitsPotentiels` via `conflitDetectionService.auditConflitsGlobaux()`.

**P1 — Frontend pilotage** :
- **P1-1** : Nouvel onglet « Audit » dans `edt-page.tsx` (6ème onglet, icône Shield). Composant `edt-audit.tsx` (273 lignes) : KPIs (total/bloquants/avertissements), filtres par sévérité, liste groupée par type de conflit avec icônes, état vide (CheckCircle2 si 0 conflit).
- **P1-2** : Widget `ChargeEnseignant` ajouté dans `edt-synthese.tsx` — bar chart horizontal de la charge hebdomadaire par enseignant, seuil d'alerte 20h (rouge si dépassé), badge "N en alerte".
- **P1-3** : Modal `edt-heures-cours-modal.tsx` (230 lignes) — sélection plage dates (lundi→samedi par défaut), appel `POST /api/personnel/heures-cours/generer-from-edt`, affichage résultat (créées/ignorées/erreurs/total). Bouton dans la toolbar de `edt-page.tsx`.

**P2 — Structurel** :
- **P2-1** : Templates intégrés dans la génération automatique. Backend : `templateId` optionnel dans `genererEmploiDuTempsSchema`, méthode `appliquerTemplate()` override les préférences (joursTravaillés, heureDebut/Fin, duréeCréneau). Frontend : sélecteur de template dans `edt-generation-modal.tsx`.
- **P2-2** : Permissions granulaires `heures-cours:*` (5 permissions : view/create/edit/delete/generate). Controller `heure-cours.controller.ts` migré de `personnel:manage`/`personnel:view` vers les permissions fines. Attribution par rôle : ADMIN/CHEF_ETABLISSEMENT/PROVISEUR/PRINCIPAL (toutes), DIRECTEUR/CENSEUR/SECRETAIRE_DIRECTION (sans generate), ENSEIGNANT/SURVEILLANT (view seule). Migration 138.
- **P2-3** : Soft delete sur `CreneauHoraire` — `@DeleteDateColumn()` ajouté à l'entité, `softRemove()` au lieu de `remove()` dans le service.

### Fichiers modifiés/créés (16)
- `backend/src/modules/personnel/controllers/heure-cours.controller.ts` (permissions granulaires)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (templateId + appliquerTemplate)
- `backend/src/modules/emploi-du-temps/dto/emploi-du-temps.dto.ts` (templateId dans schéma)
- `backend/database/migrations/138-permissions-heures-cours.sql` (créé, 79 lignes)
- `shared/src/enums/roles.enum.ts` (5 nouvelles permissions HEURES_COURS + attribution rôles)
- `frontend/src/features/emploi-du-temps/components/edt-audit.tsx` (créé, 273 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (créé, 230 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (onglet audit + bouton heures-cours)
- `frontend/src/features/emploi-du-temps/components/edt-synthese.tsx` (widget ChargeEnseignant)
- `frontend/src/features/emploi-du-temps/components/edt-generation-modal.tsx` (sélecteur template)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (hooks useAuditConflits, useGenererHeuresCoursFromEdt, templateId)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (types AuditConflitsResult)
- `frontend/src/locales/fr/emplois.json` (60+ clés i18n : audit, synthese.chargeEnseignant, generationHeuresCours)
- `AGENTS.md` (cette section)

## Travail effectué — Session 2026-08-01 (animations loading — centrage + SchoolLoading v2)
### Améliorations apportées
- **Centrage InlineSpinner** : 3 pages non centrées corrigées (personnel-page, eleves-page, finances-page) — ajout `flex justify-center min-h-[200px] items-center`.
- **SchoolLoading v2** (`frontend/src/components/feedback/SchoolLoading.tsx`) : composant thématique scolaire avec **4 thèmes animés** :
  - `book` (défaut) : livre qui s'ouvre (pages gauche/droite en rotateY), lignes qui apparaissent séquentiellement, crayon animé qui écrit
  - `pencil` : crayon qui écrit seul sur du papier avec lignes qui apparaissent
  - `notebook` : cahier à spirale avec page qui tourne (rotateY -160°)
  - `globe` : globe terrestre avec méridiens en rotation, continents stylisés, point lumineux orbital
- **Variantes** : `full` (page, 80-120px) / `compact` (onglet/section, 48-72px)
- **Thème auto** : light/dark via MutationObserver. Ultra-responsive (clamp). Accessible (role=status, aria-label). Message personnalisable.
- **Intégration étendue** :
  - Pages : personnel-page, eleves-page, finances-page, evaluations-page, rapports-page, statistiques-page, analytics-page, securite-page, laboratoire-page, stage-page, parking-page, etablissement-edit-page (variant="full")
  - Onglets (8) : onglet-absences, onglet-contrat, onglet-edt, onglet-evaluations, onglet-parcours, onglet-matieres, onglet-matieres-planning, onglet-matieres-kanban (variant="compact")
  - Sections : tab-fonctions, fonction-arbre, tab-niveaux, tab-programme, matiere-detail-page (EDT + affectations), personnel-detail-page (contrats + bulletins + affectations) (variant="compact")
  - Modals : personnel-form-modal, suppression-utilisateur-modal (variant="compact")
- **Spinners manuels éliminés** : 12 `animate-spin border-b-2 border-blue-600` hardcodés supprimés et remplacés par SchoolLoading (thème auto, plus de couleur hardcodée).
- **Loader2 section-level migrés** : tab-fonctions, fonction-arbre → SchoolLoading compact.
- **InlineSpinner conservé** pour les indicateurs inline uniquement — 2 occurrences restantes (workflow matiere-detail, soumission heure-cours-form-modal).
- **Hiérarchie loading** : SplashScreen → SchoolLoading → PageSkeleton → TableSkeleton → StatsCardSkeleton → InlineSpinner → ProgressBar.
- **Barrel export** : `SchoolLoading` ajouté à `components/feedback/index.ts`.

### Fichiers modifiés (32)
- `frontend/src/components/feedback/SchoolLoading.tsx` (réécrit v2, 368 lignes, 4 thèmes)
- `frontend/src/components/feedback/index.ts` (export ajouté)
- Pages (12) : personnel, eleves, finances, evaluations, rapports, statistiques, analytics, securite, laboratoire, stage, parking, etablissement-edit
- Onglets (8) : onglet-absences, onglet-contrat, onglet-edt, onglet-evaluations, onglet-parcours, onglet-matieres, onglet-matieres-planning, onglet-matieres-kanban
- Sections (8) : tab-fonctions, fonction-arbre, tab-niveaux, tab-programme, matiere-detail-page, personnel-detail-page, ModulesTab, SecuriteTab
- Modals (2) : personnel-form-modal, suppression-utilisateur-modal
- `AGENTS.md` (section animations + résumé session)

## Travail effectué — Session 2026-07-24 (fix FK crash seeds + serveur)
### Problème critique
- **Crash serveur** : `ALTER TABLE heures_cours ADD CONSTRAINT FK_4694216da... REFERENCES classes_annees` échouait car `classeAnneeId` contenait des UUID orphelins (71 lignes avec ancien `classeId`).
- **DTO obsolète** : `createHeureCoursSchema` utilisait `classeId` au lieu de `classeAnneeId` (refactoring v4.0 incomplet).
- **Service obsolète** : référençait `EmploiDuTemps` (supprimé) au lieu de `CreneauHoraire` ; requêtait `slot.classeAnneeId` directement au lieu de `slot.affectationMatiere?.classeAnneeId`.
- **Seed runners** : 3 scripts (`run-seeds.ts`, `run-demo-seeds.ts`, `run-rbac-seed.ts`) créent leur propre `DataSource` et contournent `initializeDatabase()`.

### Correctifs appliqués
1. **`pre-sync-cleanup.ts`** (nouveau module partagé) : nettoie les orphelins AVANT synchronize.
   - Détecte `classeId` (old) vs `classeAnneeId` (new) → DROP TABLE `heures_cours` CASCADE si schéma obsolète
   - Supprime les lignes avec `classeAnneeId`/`salleId` orphelins si le schéma est déjà v4.0
   - Supprime les FK obsolètes sur `creneauId` si la table cible manque
   - Fonctionne avec connexion pg brute, utilisable avant toute `initialize()`
2. **`pre-sync-cleanup.ts` — `envDbConfig()`** : lit la config depuis les vars d'env (DRY)
3. **`data-source.ts`** : `initializeDatabase()` appelle `cleanOrphanHeuresCours()` avant `AppDataSource.initialize()`
4. **`run-seeds.ts`** : importe et appelle `cleanOrphanHeuresCours(envDbConfig())` avant `SeedDataSource.initialize()`
5. **`run-rbac-seed.ts`** : idem
6. **`run-demo-seeds.ts`** : `synchronize: false` (pas de risque FK, pas de modif nécessaire)
7. **`@types/pg`** : installé pour la déclaration TS du module `pg`
8. **DTO `heure-cours.dto.ts`** : `classeId`→`classeAnneeId`, ajout `salleId`/`commentaire`/`affectationMatiereId`
9. **Service `heure-cours.service.ts`** : `EmploiDuTemps`→`CreneauHoraire`, jointure via `affectationMatiere`
10. **`seed-nomenclatures.ts`** v4.0 : 10 échelons avec couleurs, update des existants
11. **`seed-templates.ts`** : 5 codes invalides corrigés (`CENSORAT`→`DIRECTION`, etc.)
12. **`seed-heures-cours-edt.ts`** : constructeur au lieu de `repo.create()`

### Résultat
- `npm run seed` → ✅ (synchronize + seeds système OK)
- `npm run seed:demo` → ✅ (8 créneaux, 5 heures cours, 12 bulletins)
- `npm run start:ts` → ✅ (serveur démarre, health endpoint 200)
- Schéma `heures_cours` : `classeAnneeId uuid NOT NULL` avec FK→`classes_annees`. Table `creneaux_horaires` créée. Ancienne `emploi_du_temps` intacte (données inertes).

## Travail effectué — Session 2026-07-25 (refonte Notes + Bulletins full-stack)
### Backend — Phase A (16 fichiers modifiés + 1 créé, 0 erreur TS in scope)
- **5 bugs critiques corrigés** : `createBulk` sans `classeAnneeId` ; permissions inexistantes `notes:read`/`bulletins:read` → remplacées par `notes:view`/`bulletins:view` (+ `bulletins:delete` créé et attribué aux 7 rôles ayant `bulletins:generate`) ; SQL brut snake_case → camelCase quoté (`"eleveId"`, `statut::text = ANY($n)`) dans notes-batch-loader, bulletins.service (calculerStatsMatieres), dashboard-dataloader ; `enseignantId` = MembrePersonnel.id (nullable, résolu via `MembrePersonnel.utilisateurId`) ; notes VALIDEE+PUBLIEE comptées dans les moyennes (`In([VALIDEE, PUBLIEE])`).
- **notes.service.ts** : createBulk avec guards (période clôturée, AffectationEleve active batch → 400 avec liste, `notes.allow_bulk_entry` → 403), `notes.validation_levels` config, multi-tenancy findOne/update/remove, `findAll` → `PaginatedResult` + `recherche` ILIKE, nouvelle méthode `getStatistiques` (moyenne/médiane/min/max/écart-type/distribution/parType/parStatut).
- **notes.controller.ts** : perms `notes:view/create/edit/delete/bulk:create/statistiques:view` ; route `/statistiques` AVANT `/:id`.
- **bulletins** : index unique classe `['etablissementId','eleveId','periodeId']` (était mal déclaré au niveau propriété) ; `bulletins.require_validation` (fallback ancienne clé `validation_workflow`, seed corrigé) ; rangs + moyenneClasse/Min/Max renseignées ; `DELETE /:id` (400 si publié) + AuditAction.BULLETIN_DELETE ; **`bulletin.pdf.service.ts` créé** (export HTML A4 imprimable, sans dépendance) ; `GET /:id/export` avant `/:id` ; PATCH `publie:true` exige `bulletins:publier`.
- **Adaptations** : verification-suppression.service (join bulletins↔notes corrigé), portal-parent.service (retour paginé).
- ⚠️ **Migration DB à générer** : enseignantId nullable, index unique bulletin, enum audit BULLETIN_DELETE.

### Frontend — Phase B (3 196 lignes, pattern `utilisateurs`)
- **Notes** : `notes-page.tsx` (DataTable serveur, recherche debounced, 5 filtres collapsibles, badges statut/type, helper `note-couleur.ts` — remplace classes cassées `bg-${color}-100`) ; `notes-saisie-masse-page.tsx` + route `/notes/saisie` (grille tableur, navigation clavier Enter/flèches, validation inline valeur ≤ barème, moyenne prévisionnelle, POST `/api/notes/bulk`, gestion 400 élèves non affectés, cartes < 480px) ; `note-detail-page.tsx` (TabsBar : Informations / Statistiques gated `notes:statistiques:view` / Validation workflow gated `notes:validate`) ; `note-form-modal.tsx` migré BaseFormModal → CustomModal + RHF/zod.
- **Bulletins** : `bulletin-generate-modal.tsx` (nouveau, classe+période → POST `/generate`) ; `bulletins-page.tsx` (DataTable serveur, actions export/delete gated) ; `bulletin-detail-page.tsx` (TabsBar Synthèse/Matières, publier/dépublier, export HTML→print via Blob URL).
- **Hooks** : URLs corrigées (`/en-masse`→`/bulk`, `/generer`→`/generate`, `/statistiques`), PaginatedResult typé, `useHandleError`, invalidations ciblées.
- **Sidebar** : Notes expandable (« Liste » /notes, « Saisie en masse » /notes/saisie gated `notes:bulk:create`) ; prop `permission?` ajoutée à `NavItem`.
- **i18n** : notes.json 126 clés FR+EN, bulletins.json 79 clés FR+EN.
- **Qualité** : 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur, tsc 0 erreur in scope, routeTree régénéré.

### Docs
- Skill `elisaschool-business-logic` : section « Domaine 1 » (notes/bulletins) réécrite avec les règles corrigées.

## Travail effectué — Session 2026-07-25 (hiérarchie v4.1 — audit + intégration Voie A)
### Audit — Verdict
- **Nomenclature TypeRelationHierarchique** : 100% supprimée du runtime (enum varchar DIRECT/FONCTIONNEL sur HierarchiePersonnel). Résidus nettoyés : migration doublon `src/database/migrations/110-consolidation-organisation.sql` supprimée, 4 permissions legacy `HIERARCHIE_VIEW/CREATE/EDIT/DELETE` retirées de `roles.enum.ts` (les granulaires `organisation:hierarchie:read|write|delete` restent), `config.registry.ts` aligné, clés i18n mortes retirées.
- **HierarchiePersonnel** : conservée (conforme grill-me v4.0). Suppression totale NON recommandée — écritures réelles (auto-création contrat, templates, seeds, CRUD REST).
- **Bug sémantique corrigé** : `seed-organisation.ts` et `generation.service.ts` stockaient des ids de **Poste** dans `superieurId` (censé référencer MembrePersonnel) → corruption silencieuse.

### Modèle dual — `superieurPosteId` (nouvelle colonne)
- `HierarchiePersonnel` porte désormais 2 sémantiques explicites :
  - **personne→personne** : `personnelId` + `superieurId` (auto-création via contrat.service)
  - **poste→poste** : `posteId` + `superieurPosteId` (seeds, templates, organigramme)
- DTO : `.refine()` exige (personnelId+superieurId) OU (posteId+superieurPosteId).
- Anti-cycle : nouveau CTE récursif `verifierPasDeCyclePostes` (chaînes de postes), en plus du CTE personnes.
- **Migration 122** (`122-hierarchie-superieur-poste.sql`, idempotente) : ADD COLUMN + index + FK→postes ON DELETE SET NULL + **backfill** (`superieurId` contenant un id de poste → déplacé vers `superieurPosteId`) + backfill `etablissementId` via postes→unités.
- `contrat.service.autoCreerHierarchie` renseigne aussi `superieurPosteId` (affectation active du supérieur).
- `generation.service.supprimerArbreUnites` nettoie aussi `superieurPosteId: In(posteIds)`.

### Frontend — Réintégration page Hiérarchie
- **Sidebar** : « Hiérarchie » réintégré (`/organisation/hierarchie`, icône `ListTree`) entre Organigramme et Nomenclatures.
- **`tab-hierarchie.tsx`** réécrit : zéro UUID affiché — helper partagé `hierarchie-libelles.ts` (`libelleExtremite`, `estRelationPoste`, `uniteRelation`) ; icônes User/Briefcase + sous-labels ; badges typeRelation (DIRECT plein, FONCTIONNEL pointillé), badges statut ; filtres segmentés Tous|Personnes|Postes|DIRECT|FONCTIONNEL (aria-pressed, tactile 44px) ; états vide/erreur+retry.
- **`hierarchie-form-modal.tsx`** réécrit : sélecteur segmenté Personne→Personne / Poste→Poste, selects postes via `useTousPostes()`, validation zod miroir backend (`relationIncomplete`).
- **Organigramme — overlay relations** : nouveau `RelationEdge.tsx` (Bézier pointillé, `--color-accent-600` FONCTIONNEL / `--color-dominant-600` DIRECT, compteur si >1) ; agrégation poste→poste par couples d'unités (même unité ignorée) dans `use-organigramme-flow.ts` ; toggle GitBranch dans la toolbar, état `showRelations` remonté dans `OrganigrammePage`.
- **Hooks** : orphelins `useSuperieurs`/`useSubordonnes` supprimés (+ query keys).
- **i18n** : parité FR/EN complète (statutRelation_*, filtres, modes, relationIncomplete, afficherRelations/masquerRelations, section toasts EN 27 clés).
- **Qualité** : 0 `any` nouveau, 0 couleur hardcodée, 0 UUID exposé, aucune nouvelle erreur tsc (erreurs préexistantes hors périmètre intactes).

## Travail effectué — Session 2026-07-27 (organigramme — export PNG/PDF, edges, toolbar, légende)

### Export PNG/PDF — Bugs critiques corrigés
- **`export-types.ts`** : `estimerExport()` réécrit — le `pixelRatio` effectif est maintenant calculé pour remplir les dimensions du preset de taille (Standard→8K), pas seulement basé sur la qualité. `Math.max(qualite.pixelRatio, ratioPourTaille)` capped à 8.
- **`export.ts`** : `preparerPourExport()` supprime les `<animate>` SVG (animation draw-in des liens hiérarchiques) qui rendaient les edges invisibles si capturés avant la fin de l'animation. Supprime `stroke-dashoffset` et `stroke-dasharray="2000"` (valeurs d'animation uniquement), préserve les dasharray stylés (`8 4`, `3 4`). Résolution des variables CSS pour les styles inline et attributs SVG.
- **Overlay export** : légende avec traits plus épais (2.5/2/2), couleurs plus sombres, dasharray cohérents avec les nouveaux edges.
- **Filtre export** : exclusion controls, minimap, attribution, toolbar.

### Edges — Routing orthogonal (smooth step)
- **`HierarchieEdge.tsx`** v4.0.0 : `getBezierPath()` → `getSmoothStepPath()` (routing orthogonal avec coins arrondis, borderRadius=8, offset=4). Animation SVG `<animate>` supprimée (causait le bug export). Épaisseurs augmentées (2.5/3), couleur `--color-dominant-500` (plus sombre).
- **`RelationEdge.tsx`** v3.0.0 : `getBezierPath()` → `getSmoothStepPath()` (borderRadius=12). Offset différencié par type (fonctionnel=16, direct=8) pour séparer visuellement les edges superposés. Dasharray mis à jour (fonctionnel=`4 5`, direct=`10 5`). Épaisseurs augmentées (2.5/3). Badge agrandi.
- **`use-organigramme-flow.ts`** : couleur marker hiérarchie `--color-dominant-500` (était `-400`), taille markers augmentée (14/16).

### Toolbar et légende — UX améliorée
- **`OrganigrammeToolbar.tsx`** v4.0.0 :
  - Légende popup : animation Framer Motion (AnimatePresence + opacity/y/scale), click-outside-to-close (mousedown listener), fermeture Escape, ref pour détection clic extérieur.
  - Helper `sep()` pour les séparateurs (JSX plus propre).
  - `toggleBtnClass()` pour boutons actif/inactif.
  - `flex-wrap` pour responsive.
  - Légende SVG : traits plus épais (2.5/2/2), viewBox 36×10, dasharray cohérents avec les nouveaux edges.

### Couleur relation directe — différenciée du vert (feedback utilisateur)
- **Canon couleurs liens** : hiérarchie = vert `--color-dominant-500/600`, relation DIRECTE = ambre `--color-secondary-500` (#f59e0b, retenu vs -600 #ffc107 trop clair), relation FONCTIONNELLE = bleu `--color-accent-600`.
- Sites modifiés (5) : `RelationEdge.tsx:45` (stroke+badge+tooltip), `use-organigramme-flow.ts:73` (marker flèche), `RelationDetailDrawer.tsx:72-73` (couleur + fond `--color-secondary-50`), `OrganigrammeToolbar.tsx` (légende SVG), `export.ts` (`COULEURS_EXPORT.secondary` #f59e0b + légende overlay, dasharray alignés `10 5`/`4 5`).
- Badges `tab-hierarchie.tsx` : variants génériques Badge, pas de vert codé — inchangés.

### Qualité
- 0 `any` nouveau, 0 couleur hardcodée, 0 chaîne FR en dur.
- `tsc --noEmit` : 0 erreur in-scope.
- 5 fichiers modifiés (export-types.ts déjà committé dans b340a14).

## Travail effectué — Session 2026-07-27 (suite — export v2 : presets, estimation réaliste, fix fill noir)

### Presets de taille/qualité v2 (`export-types.ts` v2.0.0, réécrit)
- **Tailles** : modèle `bordLong` (px du bord le plus long, agnostique de l'orientation), strictement croissantes, résolutions standard web : `hd` 1280 → `full-hd` 1920 → `qhd` 2560 → `4k` 3840 → `8k` 7680. Remplace moyen/grand/tres-grand (carrés incohérents, non croissants vs 4k/8k).
- **Qualités** : `facteur` = fraction de la taille cible (minimale 0.25 / reduite 0.5 / equilibree 0.75 / maximale 1.0). La taille sélectionnée est un plafond dur jamais dépassé — l'ancien `Math.max(qualite.pixelRatio, ratioPourTaille)` permettait à la qualité de dépasser la taille (source de l'incohérence estimation/fichier).
- **Estimation réaliste** : `OCTETS_PAR_PIXEL_PNG = 0.12` (empirique diagrammes aplats post-deflate) remplace 4 o/px RGBA brut (surestimait ~30× — le fameux "69 Mo"). `pixelRatio = min(ratioCible × facteur, 8)`. Dimensions estimées = dimensions exactes de sortie.
- **Défauts ExportDialog** : `qhd` + `maximale`. `formatTaille` affiné (Go/Mo 0-1 décimale/Ko min 1). Tooltips `title` via clés i18n `taille_*_desc` / `qualite_*_desc`.
- **i18n FR+EN** : anciennes clés supprimées, nouvelles clés + descriptions ajoutées (`organisation.json` bloc `organigramme.export`).

### Fix remplissage noir des liens hiérarchiques à l'export
- **Cause racine** : le path visible de `HierarchieEdge` dépendait de la classe CSS `.react-flow__edge-path` pour `fill: none` ; cette règle est perdue lors de la sérialisation SVG de html-to-image → les paths smoothstep à angles sont remplis en noir. `RelationEdge` avait déjà `fill="none"` explicite (d'où l'export correct des relations directes).
- **Double fix** : (1) `HierarchieEdge.tsx` — attribut `fill="none"` explicite sur le path visible ; (2) `export.ts` `preparerPourExport()` — normalisation défensive `setAttribute('fill','none')` sur tout path de `.react-flow__edges` / `.react-flow__edge` sans attribut fill.

### Légende PDF alignée sur le canon couleurs
- **`export-pdf.ts`** : `dominantLight` supprimé, `secondary: '#f59e0b'` ajouté. Légende : Hiérarchie=vert plein, Rel. directe=ambre pointillé, Rel. fonctionnelle=bleu pointillé.

### Qualité
- 0 `any`, 0 couleur hardcodée hors palettes export dédiées, i18n FR/EN complet, `tsc --noEmit` 0 erreur in-scope.

## Travail effectué — Session 2026-07-27 (suite 2 — export : légendes thème, toast taille réelle, stabilisation DOM, plafond canvas)

### Légendes PNG/PDF alignées sur le thème actif
- **`css-var-resolver.ts`** : `normaliserCouleurHex(cssColor, fallback)` — normalisation via canvas 2D `fillStyle` (gère oklch/rgb/noms → `#rrggbb` ; fallback posé avant pour que toute valeur invalide retombe dessus).
- **`export.ts`** : `resoudreCouleursLiens()` résout à l'export `--color-dominant-500` (hiérarchie), `--color-secondary-500` (directe), `--color-accent-600` (fonctionnelle) — fallbacks canon #28a745/#f59e0b/#007bff. Injecté dans l'overlay PNG (`creerOverlay`) ET le PDF (`PdfOptions.couleursLegende`). `COULEURS_EXPORT`/`COULEURS_PDF` : couleurs de liens hardcodées supprimées (seuls les neutres restent).

### Toast post-export avec taille réelle
- **`exporterOrganigramme` → `ResultatExport | null`** : `{ format, tailleOctets, largeurPx, hauteurPx }`. PNG : octets du dataUrl (`base64.length × 0.75`) ; PDF : `exporterPdfJsPdf` retourne `Promise<number>` via `doc.output('blob').size`.
- **`ExportDialog.tsx`** : `toast.success` sonner (format + dimensions réelles + taille réelle formatée), `toast.error` en échec. `formatTaille` extrait hors composant. Clés i18n FR/EN : `exportReussi`, `exportDetail`, `exportEchec`, `resolutionPlafonnee`.

### Stabilisation DOM (portée « Tout déplié »)
- **`attendreStabilisationDom(element, calmeMs=250, timeoutMs=3000)`** : MutationObserver debouncé remplace le `setTimeout(600)` fixe après le dispatch `expand-all` — capture uniquement quand ReactFlow a fini de re-layouter.

### Plafond dimension canvas
- **`export-types.ts`** : `DIMENSION_MAX_PX = 16384` ; `pixelRatio = min(demandé, PIXEL_RATIO_MAX=8, plafondCanvas)` ; `EstimationExport.plafonne` → avertissement « Résolution plafonnée (limite navigateur) » dans le bloc estimation du dialog.

### Reco 4 (PDF côté serveur) — reportée, justifiée
- La capture pixel-fidèle de ReactFlow exige le DOM client (layout dagre, CSS vars thème, fonts). Pas de navigateur headless dans la stack backend ; un rendu serveur divergerait du rendu écran. Statu quo client-side assumé.

### Qualité
- 0 `any`, 0 couleur hardcodée hors fallbacks canon, i18n FR/EN complet, `tsc --noEmit` 0 erreur in-scope.

## Travail effectué — Session 2026-07-27 (suite 3 — export v3 : 20K px, orientation, dédup PDF, minimap, progression)

### Presets 20 000 px + double plafond canvas (`export-types.ts` v3.0.0)
- Presets ajoutés : `16k` (15 360 px) et `ultra` (20 480 px). `DIMENSION_MAX_PX = 20480`.
- **Nouveau plafond surface** `SURFACE_MAX_PX = 268_000_000` (limite d'AIRE Chrome ~268 Mpx, distincte de la limite de bord) : `pixelRatio = min(demandé, DIMENSION_MAX/bordLong, sqrt(SURFACE_MAX/surface))`. `plafonne` couvre les deux plafonds.

### Orientation paysage/portrait (PDF)
- `OrientationExport = 'paysage' | 'portrait'` dans `ExportOptions`. `export-pdf.ts` v2.0.0 : `getPageDimensions(format, orientation)` swap min/max des dims PAGE_FORMATS (stockées portrait). Sélecteur segmenté dans ExportDialog (RectangleHorizontal/RectangleVertical), visible uniquement en PDF.

### Dédup PDF titre/établissement/date/légende (fix redondance)
- **Overlay incrusté uniquement pour le PNG** (`capturerElement` : `options.format === 'png'`) ; le PDF reçoit une image nue et jsPDF dessine son propre en-tête (hauteur dynamique : titre 14pt + établissement 10pt + date 8pt, séparateur conditionnel), sa légende (alignée droite via `doc.getTextWidth`, dash `[3,1]`/`[1,1]`) et son footer.
- **Titre document** (recherche web) : « Organigramme hiérarchique et fonctionnel » (`titreDocument` i18n) + nom établissement en sous-ligne. `ExportOptions.titre` + `nomEtablissement` séparés.

### Minimap : toggle export + label accessible
- `ExportOptions.inclureMinimap` (défaut false) → filtre toPng `return options.inclureMinimap` sur `.react-flow__minimap`. Checkbox « Vue miniature (minimap) » dans Inclusions. ⚠️ La minimap n'est rendue que ≥1280px (`isDesktop`) — le toggle n'a d'effet que sur desktop.
- `MiniMap ariaLabel={t('organigramme.flow.minimapLabel')}` : « Vue miniature de l'organigramme » / "Organization chart overview map".

### Progression d'export par étapes
- `EtapeExport = 'preparation' | 'depliage' | 'capture' | 'generation' | 'telechargement'` ; `exporterOrganigramme(elementId, options, onProgress?, libellesLegende?)` émet chaque étape. UI : barre `role="status" aria-live="polite"`, pourcentages indicatifs (10/25/55/85/95), fieldsets/boutons `disabled` pendant l'export, fermeture modal bloquée.
- `LibellesLegende` injecté depuis React (t()) avec défauts FR — utils restent sans dépendance React.
- Stabilisation DOM « tout déplié » : `attendreStabilisationDom` (MutationObserver, calme 250ms, plafond 3s), collapse-all en `finally`.

### Fichiers
- `export-types.ts` v3.0.0, `export.ts` v4.0.0, `export-pdf.ts` v2.0.0, `ExportDialog.tsx` v3.0.0, `OrganigrammeFlowView.tsx` (ariaLabel), locales FR/EN (`organigramme.export` + `organigramme.flow.minimapLabel`).

### Qualité
- 0 `any`, 0 couleur hardcodée hors palettes export, i18n FR/EN parité, `tsc --noEmit` 0 erreur in-scope, JSON locales valides.

## Travail effectué — Session 2026-07-27 (grill-me RH : contrats, personnel, paie, organisation)

### 4 arbitrages validés puis implémentés
1. **Workflow validation effectif** : `validationWorkflowService` dispatch réellement sur l'entité (statut EN_ATTENTE_VALIDATION → ACTIF/REJETE appliqué à ContratPersonnel/BulletinPaie/MembrePersonnel), plus de workflow orphelin.
2. **Transplantation frontend contrats/paie** : pages listes + détails alignées sur le pattern `utilisateurs` (PageHeader gradient, DataTable serveur, TabsBar `?tab=`, modals CustomModal + RHF/zod).
3. **Multi-occupants unifié** : `Poste.nombrePostes` + affectations actives comptées, helper partagé de capacité (backend + frontend), fin de la double logique estSuppleant/occupant.
4. **Soft delete complet RH** : `@DeleteDateColumn()` sur MembrePersonnel, ContratPersonnel et entités paie ; suppressions REST → soft delete ; requêtes filtrent nativement.

### P0 backend paie
- Calcul bulletin corrigé (gains/retenues via ElementSalaire, decimals `numericTransformer`), POST bulletins avec garde période/doublon, audit actions paie.
- `typeContrat` = nomenclature dynamique `TypeContratPersonnalise` (plus d'enum figé) ; mode rémunération = FK `ModeRemunerationEntity` (source unique).

### P1 sécurité
- Fuites cross-tenant colmatées (etablissementId forcé depuis le token sur services contrats/paie/personnel).
- RBAC : `requireAnyPermission(...)` là où un OR de permissions est légitime (plus de bypass par permission grossière).

### Hygiène (task 8)
- **i18n personnel** : parité FR/EN stricte vérifiée par script (`personnel-detail-page`, `heure-cours-form-modal`, `personnel-page`, clés heuresCours).
- **`Fonction.chemin` harmonisé** : convention unique service = segments **ids** séparés par **`.`** (`parentChemin.id`, racine = id seul). `seed-organisation.ts` réaligné (pattern save deux temps + `cheminsMap` code→chemin) avec réalignement idempotent des chemins legacy `parentId/CODE` via `cheminAttendu`. Vérifié : le champ n'est jamais requêté (pas de LIKE).
- **Migration `029-paie-etendue.sql` réécrite v3.0** : 4 défauts corrigés — FK vers table inexistante `bulletin_paies` → **`bulletins_paie`** ; colonnes snake_case → camelCase quoté aligné entités (`"bulletinPaieId"`, `"tauxPatronal"`, `"typeCalcul"`, `"montantMax"`) ; UNIQUE global sur `code` → index composite `(code, "etablissementId")` ; INSERTs seeds SQL supprimés (violaient NOT NULL etablissementId — gérés par `seed-cotisations.ts`/`seed-types-primes.ts`). Bloc `DO $$` idempotent de rattrapage v2 (RENAME COLUMN + DROP `*_code_key`). ✅ appliquée en local.

### Docs
- Skill `elisaschool-business-logic` : **Domaine 12 RH** ajouté (workflow effectif, multi-occupants, soft delete, nomenclatures dynamiques, convention chemin, migration 029 v3.0, anti-patterns).

### Qualité
- 0 `any` nouveau, 0 couleur hardcodée nouvelle, i18n FR/EN parité, `tsc --noEmit` 0 erreur in-scope, multi-tenant strict.

## Travail effectué — Session 2026-07-27 (grill-me RH — frontend personnel)

### 4 arbitrages validés (confirmés)
1. **Historiser** : affecterEnseignant désactive l'ancienne affectation + crée une nouvelle ligne
2. **Blocage strict** : 400 si membre inexistant / pas de contrat actif / pas ENSEIGNANT
3. **Fusion EDT + suppression documents** : un seul onglet EDT, suppression de la vue hebdomadaire dupliquée
4. **Sous-menu RH sidebar** : entrée expandable « Ressources humaines »

### Corrections frontend (6 fichiers)
- **`personnel-page.tsx`** : `window.location.href` → `navigate()` (TanStack Router)
- **`heure-cours-form-modal.tsx`** : champs UUID brut → selects (classeAnneeId, matiereId, salleId, remplacantId)
- **`personnel-detail-page.tsx`** : 90+ couleurs hardcodées → CSS vars, onglet documents mort supprimé, chaînes FR → `t()`, deep-linking `?tab=`
- **`tab-heure-cours.tsx`** : vue hebdomadaire supprimée (doublon EDT dédié), 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur, 6 nouvelles clés i18n FR+EN
- **`Sidebar.tsx`** : Personnel/Contrats/Paie groupés sous « Ressources humaines » (expandable, icône UserCheck, permissions granulaires par enfant)
- **`personnel.types.ts`** : `PostePartial` dupliqué supprimé (import depuis contrats), `PersonnelFormData` interface ajoutée, `fromFormToCreateDto` typé proprement
- **`use-personnel.ts`** : 8 `any` éliminés (params query, error handlers, mutation types)

### i18n
- 6 nouvelles clés `heuresCours.*` dans `fr/personnel.json` et `en/personnel.json` (aucunCreneauEdt, generationReussie, erreurGeneration, coursAjoute, coursMisAJour, genererDepuisEdt)

### Qualité
- 0 `any` dans personnel.types.ts, use-personnel.ts, tab-heure-cours.tsx
- 0 couleur hardcodée dans personnel-detail-page.tsx, tab-heure-cours.tsx
- 0 chaîne FR en dur dans tab-heure-cours.tsx

## Travail effectué — Session 2026-07-27 (grill-me RH — audit qualité frontend personnel/contrats/paie)

### Audit qualité — 82 problèmes résolus
- **36 `any`** éliminés dans 10 fichiers (hooks, modals, types, pages)
- **30 couleurs hardcodées** remplacées par CSS vars (`bg-muted`, `border-border`, `text-secondary`, `text-muted-foreground`)
- **16 chaînes FR hardcodées** remplacées par `t()` (i18n)

### Fichiers corrigés (10)
- **personnel-form-modal.tsx** : `useState<FormState>` typé, submit via `fromFormToCreateDto()`, import `CreerPersonnelDto` supprimé
- **cotisation-modal.tsx** : `FORM_INIT: CotisationFormData`, cast `as CotisationFormData['type']` sur select onChange
- **prime-modal.tsx** : `FORM_INIT: PrimeFormData`, cast `as PrimeFormData['typeCalcul']`
- **retenue-modal.tsx** : `FORM_INIT: RetenueFormData`, cast `as RetenueFormData['frequence']`
- **use-heure-cours.ts** : annotations `Promise<T>` explicites supprimées des queryFn (inférence TypeScript)
- **use-contrats.ts** : 8 `any` → types propres (`ContratPersonnel`, `PaginatedResult`, `ApiResponse<T>`)
- **use-paie.ts** (frontend) : 6 `any` → typage propre
- **contrats-page.tsx** : 12 couleurs hardcodées → CSS vars, 4 chaînes FR → `t()`
- **paie-page.tsx** : 10 couleurs hardcodées → CSS vars, 6 chaînes FR → `t()`
- **bulletin-form-modal.tsx** : 8 `any` → types propres, 6 couleurs → CSS vars

### Backend — 2 bugs corrigés (suivi-personnel)
- **`suivi-personnel.controller.ts`** : `getDashboardPersonnel` attendait 3 args (ajout `anneeScolaireId` depuis query params avec garde 400)
- **`cron-jobs.ts`** : `statut: 'ACTIF'` → `StatutPersonnel.ACTIF` (enum importé)

### Compilation vérifiée
- **Frontend** : 0 erreur dans personnel/contrats/paie/organisation (54 erreurs préexistantes dans d'autres modules)
- **Backend** : 0 erreur dans personnel/organisation/paie/heures-cours/contrats/suivi-personnel (311 erreurs préexistantes dans d'autres modules)
- **101 fichiers modifiés** au total (+3822/-4194 lignes)

## Travail effectué — Session 2026-07-29 (grill-me RH — Groupe D backend + élimination `as any`)

### Groupe D — Backend fixes (88 corrections)

**D1 — Soft delete `@DeleteDateColumn()` (13 entités)** :
- Personnel (6) : `absence-personnel`, `evaluation-enseignant`, `heure-cours`, `affectation-poste`, `progression-programme`, `indisponibilite-enseignant`
- Paie (4) : `cotisation`, `type-prime`, `type-retenue`, `element-salaire`
- Organisation (3) : `unite-organisationnelle`, `poste`, `hierarchie-personnel`
- Exclusion : nomenclatures (EchelonStructurel, NiveauResponsabilite, ModeRemunerationEntity, Fonction, TemplateOrganisation, TypeContratPersonnalise) → hard delete + `estSysteme`

**D2 — `req?: any` → `req?: Request` (60 replacements, 16 fichiers)** :
- auth (3 fichiers), personnel (7 fichiers), programmes (1 fichier), paie (5 fichiers)

**D3 — Date `as any` casts (13 fixes, 3 fichiers)** :
- `heure-cours.service.ts` : 7 fixes (DTO mutation → `dateChanges` pattern, `Between()` sans cast)
- `contrat.service.ts` : 4 fixes (DTO mutation → `dateChanges`, `LessThanOrEqual()` sans cast, `null as any` → `undefined`)
- `affectation.service.ts` : 3 fixes (DTO mutation → `dateChanges`, `LessThanOrEqual()` sans cast)

**D4 — `as any[]` casts (2 fixes, 1 fichier)** :
- `calcul-paie.service.ts` : `[] as any[]` → `[] as DetailMatiereSimulation[]`

### Élimination `as any` audit-related (7 occurrences, 2 fichiers)
- `type-contrat.service.ts` : 5× `'TYPE_CONTRAT_*' as any` → `AuditAction.TYPE_CONTRAT_*`
- `absence-personnel.service.ts` : `dto.type as any` → `dto.type as TypeAbsencePersonnel`, `dto as any` → `dto as Record<string, any>`

### Documentation mise à jour
- **`elisaschool-conventions.md`** : section 24 ajoutée (conventions typage : req Request, DTO date anti-pattern, AuditAction enum, soft delete, FindOperator)
- **`elisaschool-business-logic/SKILL.md`** : Domaine 15 ajouté (soft delete convention + audit logging)

### Qualité
- **0 `as any`** dans personnel/services/, paie/services/, organisation/services/
- **0 erreur TS** introduite (8 erreurs préexistantes hors périmètre)
- **Migration DB requise** : ajouter `deletedAt` columns sur les 13 nouvelles entités avant déploiement

## Next Move
Indicateur de connexion réseau : ✅ implémenté (juillet 2026).
Workflow de validation multi-niveaux (Option B) : ✅ intégré dans 6 pages détail (juillet 2026).
1. **Tests** : ✅ phase complète le 2026-08-03 — **130/130 verts** (14 suites : matérialisation Q7, Canal A, Q6-C, `updateCreneau`, cron EDT, 3 suites réparées).
2. **Migrations 122–145** : ✅ script `backend/scripts/apply-migrations-122-145.sh` prêt et vérifié (24/24 verts, idempotent, 2 passages OK en local le 2026-08-03). ⚠️ Ordre : la 139 (index unique heures_cours) référence `deletedAt` → appliquer la 141 (soft delete) AVANT la 139 (géré par le script). Garde 128 : skip automatique si volume horaire déjà en minutes (max > 48). Usage : `DB_HOST=... DB_PORT=... DB_USER=... DB_NAME=... DB_PASSWORD=... ./scripts/apply-migrations-122-145.sh` (le port 7002 est exposé sur l'hôte). **Corrections apportées au passage** (les migrations n'avaient jamais été exécutées en base — bugs détectés par le test local) : 138 + 142 → colonnes `action`/`libelle` NOT NULL ajoutées (convention rbac.seed : module=1er segment, action=reste), `role_id`→`"roleId"`/`"permissionId"` (camelCase), 142 sans `createdAt` (colonne inexistante) ; 144 → FK/CHECK idempotents (DROP IF EXISTS) + `parametres_systeme` corrigé (typeValeur/categorie/modifiableRuntime/visible/ordre, type inexistant supprimé) ; 145 → INSERT sans `"categorie"` (colonne inexistante) + garde WHERE NOT EXISTS ajoutée (doublon supprimé). Normalisation 2026-08-03 : `142-network-permissions.sql` + `143-heure-cours-updated-at.sql` déplacées de `src/database/migrations/` → `database/migrations/` ; legacy `139-workflows-validation` → **144-workflows-validation.sql**, `140-audit-enum-*` → **145-audit-enum-competences-apparence-groupes-finances.sql** (collision levée, déjà appliquées en base) ; doublons superseded supprimés (`141-soft-delete-columns`, `111`–`115` legacy refonte v2 — la 112/115 référençaient TypePersonnel supprimé).
3. ✅ **Migration soft delete créée** : `141-soft-delete-rh-organisation.sql` (19 tables, idempotente, appliquée en local le 2026-08-03).
4. ✅ **Audit logging bulletins** : déjà présent (`bulletin-paie.service.ts`, 8 appels CREATE/UPDATE/DELETE/GENERATE/PUBLIE).
5. ✅ **Instrumentation** : absence-personnel (4 actions), evaluation.service (3 actions), progression-programme.service (3 actions) — toutes présentes. `indisponibilite-enseignant` = entité sans service (inerte).
6. **Lancement tests** : `JWT_SECRET=<32+ chars> ENCRYPTION_KEY=<32 chars> npx jest` depuis `backend/` (le `.env` local a `JWT_SECRET=""` → parse zod échoue → fallback `dev_password`). Suite complète ~60s en parallèle.

## Travail effectué — Session 2026-08-03 (phase Tests — 108/108 verts)

### Contexte
Phase Tests après stabilisation Q7/Q8 : 2 suites unitaires nouvelles (matérialisation + Canal A), 3 suites préexistantes réparées (refactoring v5.0 + API modifiées), config jest ajustée.

### Nouveaux tests (2 fichiers, 17 tests)
- **`test/unit/heure-cours-materialisation.spec.ts`** (12 tests) : `materialiserInstances` — filtre `genereAutomatiquement = true` + `statut = VALIDE` (assertions sur `andWhere`) ; 1 occurrence/semaine dans la plage (2 semaines → 2 instances, champs `create` vérifiés dont date du MARDI) ; bornage de plage (occurrence S+2 ignorée) ; anti-doublon `findOne` → skip ; conflit enseignant `getCount > 0` → skip ; affectation incomplète → skip ; aucun créneau → 0/0 ; 2 créneaux → 4 instances. `materialiserSemainesCourantes` — hors année (spy non appelé) ; délégation avec `respecterFlagAuto:true` + plage S→S+1 ; clamp fin de plage à `dateFin` de l'année ; `findOne` with where-array EN_COURS + `order dateDebut DESC`.
- **`test/unit/emploi-du-temps-canal-a.spec.ts`** (5 tests) : `validerCreneau` — flag=true → save VALIDE + `materialiserSemainesCourantes({creneauIds:[id]})` ; flag=false → PAS de matérialisation ; statut≠PLANIFIE → 400 `STATUT_INVALIDE`. `validerCreneauxClasse` — `idsAuto` seulement (flag false exclu, autre classe exclue), `whereInIds` + update ; aucune classe → 0/0 sans requête.

### Pattern mock (documenté)
- **Mock partagé** : `const mockRepo = {...}` (variable préfixée `mock*` autorisée par le hoisting jest) + `getRepository: jest.fn(() => mockRepo)` → `this.repo` ET `edtRepo` sont le même objet → configuration unique des `findOne`/`createQueryBuilder`.
- **QB unique** : `qbMock({getMany, getCount})` + `repo.createQueryBuilder.mockReturnValue(qb)` — un seul QB porte les deux méthodes (`mockReturnValueOnce` en séquence = fragile, éviter).
- **Dates en TZ locale** : `lundiDeSemaine()` → minuit LOCAL (WAT UTC+1) → `toISOString()` décale d'un jour. Helper `isoLocal(d)` (getFullYear/getMonth/getDate) — jamais `toISOString()` pour les dates calculées localement.
- **AppError** : champs `statusCode`/`code` (pas `status`).
- **Aliases** : `jest.mock('@modules/...')` toujours (les chemins relatifs se résolvent depuis le fichier de TEST).

### Suites préexistantes réparées (3 fichiers)
- **`test/unit/fonctions.service.spec.ts`** : chemin `@modules/fonctions/...` → `@modules/organisation/services/fonctions.service` (refactoring v5.0) + mock `@modules/auth` (auditService). 4/4.
- **`test/multi-tenant-isolation.test.ts`** : `beforeAll` idempotent (nettoyage competences→specialites→filieres→établissements TEST-001/002 — `delete({})` interdit en TypeORM → `createQueryBuilder().delete().execute()` ; l'`afterAll` d'origine a TOUJOURS échoué, cause cachée de la non-idempotence) ; `result.data.filter` → `result.items.filter` (PaginatedResult) ; beforeEach Spécialité nettoie spécialités+filieres (FK) ; test CASCADE adapté : la FK `filieres.etablissementId` est RESTRICT (pas ON DELETE CASCADE) → le test vérifie le BLOCAGE + l'intégrité (pas de changement de modèle). 13/13.
- **`test/integration/configuration-multi-tenant.spec.ts`** : faux UUID `test-etablissement-uuid-123` → UUID réel (colonne `uuid`) ; `etablissementId` `undefined` → `toBeFalsy()` (le service retourne null) ; reset override : global créé avec valeur distincte avant l'override (fallback vérifiable) ; reset global : `valeurDefaut` posée via le repo avant reset (le service exige `NO_DEFAULT_VALUE` sinon). 16/16.

### Config jest (`jest.config.ts`)
- `testTimeout: 30000` (avantAll integration DB > 5s par défaut → timeouts).
- `testPathIgnorePatterns: ['<rootDir>/tests/integration/']` : `corrections-academique.test.ts` est un script autonome (runTests + process.exit, zéro describe/it) — lancé via tsx, pas jest.

### Environnement (important)
- Le `.env` local a `JWT_SECRET=""` → parse zod échoue → fallback dev (`DB_PASSWORD=dev_password` → échec auth DB). Lancer les tests avec : `JWT_SECRET=... ENCRYPTION_KEY=... npx jest`.
- `delete({})` est refusé par TypeORM — `createQueryBuilder().delete().execute()` à la place.
- Résultat final : `npx jest` complet = **108 passés / 108** (11 suites), exit 0.

## Travail effectué — Session 2026-08-03 (suite — tests Q6-C + cron : 130/130 verts)

### Contexte
Complément de la phase Tests : couverture unitaire Q6-C (propagation instance→créneau), `updateCreneau` (dry-run/409/force) et cron-jobs EDT (logique pure). Suite complète = **130/130 verts** (14 suites, ~60s parallèle).

### Nouveaux tests (3 fichiers, 22 tests)
- **`test/unit/heure-cours-q6c.spec.ts`** (9 tests) : `HeureCoursService.update` — sans `mettreAJourCreneau` → ni créneau ni propagation ; `mettreAJourCreneau:true` → creneauRepo.findOne (where `{id, etablissementId}` + relations) + spy `propagerModificationCreneau` appelé avec `{force:true, createurId, excludeInstanceIds:[hc.id]}` et changements `{jour:'LUNDI', heureDebut, heureFin}` ; sans créneauId → rapport absent, findOne 1 seul appel (garde dans `update()`, le retour vide d'`appliquerModificationAuCreneau` est défensif) ; 404 `CRENEAU_NOT_FOUND` ; 400 `JOUR_INVALIDE` (dimanche 2026-08-02) ; 409 `CONFLITS_CRENEAU` (severite BLOQUANT) sans écriture ; gardes REMPLACE `REMPLACANT_REQUIS` / `REMPLACANT_INVALIDE` ; 409 `CRENEAU_CONFLIT` au niveau instance (QB `getMany` overlap même enseignant/classe/salle).
- **`test/unit/emploi-du-temps-update-creneau.spec.ts`** (5 tests) : `updateCreneau` — notes seules → save sans propagation ; 409 `CONFLITS_CRENEAU` bloquant sans écriture ; dry-run : `propagerModificationCreneau` appelé 1× avec `{dryRun:true, force:undefined}` puis 409 `CONFLITS_PROPAGATION` avec `details.rapport` ; `propagerForce:true` → save + 2 appels (dry-run force:true puis réel `{force:true, createurId}`) ; sans conflits → dry-run puis propagation réelle, rapport retourné, changements `{jour, heureDebut, heureFin, salleId, typeCreneau}` vérifiés. Mock `@modules/personnel/services` (heureCoursService) + `@modules/matieres/services/coefficient-resolver.service` + `@modules/salles/services/salle-availability.service` + `config.helper`.
- **`test/unit/emploi-du-temps-cron.spec.ts`** (8 tests) : `materialiserSiNecessaire` — préférence créée par défaut (SAMEDI 21:00) + `materialiserSemainesCourantes({etablissementId})` ; config inactive → rien ; horaire non correspondant → rien ; garde journalière (Map module-level — **ids d'établissement uniques par test**, la Map persiste entre les tests) ; garde par établissement ; `DEFAULT_MATERIALISATION_AUTO` ; `initEmploiDuTempsCronJobs` — `cron.schedule('* * * * *', fn, {timezone:'Africa/Douala'})` capturé puis handler exécuté : try/catch par établissement (etab qui rejette ne bloque pas le suivant). Fake timers : `jest.useFakeTimers().setSystemTime(new Date('2026-08-08T21:00:00'))` — machine en WAT = Africa/Douala, pas de décalage.

### Pièges rencontrés
- **Cycle d'import** : `cron-jobs.ts` importe `./entities` → cascade creneau-horaire → affectation-matiere → classes → personnel → heure-cours → `TypeCreneau` undefined (barrel en cours d'évaluation) → crash `default: TypeCreneau.COURS`. Fix : `jest.mock('@modules/emploi-du-temps/entities', ...)` avec `JourSemaine` mocké (seul usage runtime) — la chaîne d'entités réelles n'est plus importée.
- **Spy sur méthode privée** : `jest.spyOn(service as any, 'propagerModificationCreneau')` (prototype method) au lieu d'imports fantômes.
- **Garde journalière** : Map module-level jamais réinitialisée → `jest.clearAllMocks()` ne la vide pas → ids d'établissement uniques par test.

### Qualité
- `npx tsc --noEmit` backend : 297 erreurs préexistantes inchangées (hors périmètre), **0 nouvelle** (dont cron-jobs EDT exporté `materialiserSiNecessaire`).
- Résultat final : `npx jest` complet = **130 passés / 130** (14 suites), exit 0.

## Travail effectué — Session 2026-07-25 (grill-me organisation — UX, permissions, organigramme)
### Décisions validées
- **Clic sur lien organigramme** = drawer détail + surbrillance des extrémités + tooltip au survol (options 1+2+4).
- **ENSEIGNANT / ELEVE / PARENT** : `organisation:organigramme:read` UNIQUEMENT (aucune autre page organisation).
- **Multi-casquettes enseignant** : élévation via attribution manuelle admin + enrichissement du rôle COORDINATEUR_DISCIPLINE (lecture organisation complète).

### Phase 1 — Fixes P0
- `onToggleRelations` câblé correctement (toolbar → OrganigrammePage), toggle relations fonctionnel.

### Phase 2 — Permissions & rôles (migration 125)
- **`125-organigramme-read-tous-roles.sql`** (idempotente ON CONFLICT/NOT EXISTS) : crée `organisation:organigramme:read` et l'attribue à TOUS les rôles ; CENSEUR + COORDINATEUR_DISCIPLINE reçoivent la lecture organisation complète (`organisation:*:read`).
- `roles.enum.ts` (`DEFAULT_ROLE_PERMISSIONS`) aligné : ENSEIGNANT/ELEVE/PARENT organigramme-only.

### Phase 3 — Liens organigramme cliquables
- **`organigramme/drawer/RelationDetailDrawer.tsx`** (nouveau) : drawer détail relation (type, extrémités, unités, statut, compteur agrégé).
- Clic sur `RelationEdge` → ouvre le drawer + surbrillance des nœuds source/cible ; tooltip au survol de l'edge.
- `use-organigramme-flow.ts` : relations poste→poste remappées vers l'ancêtre visible quand une unité est repliée (les edges ne disparaissent plus au collapse).

### Phase 4 — Bugs P1 backend (migration 126)
- **Enum `postes_statut_enum` = MAJUSCULES** ('ACTIF'/'VACANT'/'SUPPRIME'/'EN_ATTENTE') — la migration 120 comparait en minuscules → vues matérialisées silencieusement vides.
- **`126-fix-vues-materialisees-statuts.sql`** : recrée `mv_stats_organisation` + `mv_postes_vacants_critiques` avec valeurs UPPERCASE, alias snake_case `etablissement_id`, sous-agrégat hiérarchie (au lieu du join multiplicateur).
- **Backfill** : 26 lignes `postes` corrigées (occupantsCount/statut, cast `::postes_statut_enum`).
- `organigramme.pdf.service.ts` + statistiques : coercions/adaptations post-v4 ; DTO template : `z.nativeEnum` pour les facettes.
- ⚠️ **Accès Postgres** : `docker exec elisaschool_db psql -h 127.0.0.1 -p 7002 -U elisaschool_user -d elisaschool` (port 7002 DANS le conteneur).

### Phase 5 — Icônes & polish UX
- **Canon icônes appliqué** (voir section Icônes plus haut) : Link2=relations hiérarchiques (5 sites : toolbar, RelationDetailDrawer, badge FONCTIONNEL tab-hierarchie, hierarchie-form-modal, StatCard synthèse), Maximize=fit-view (Maximize2/Minimize2 réservés plein écran), Wallet remplace DollarSign (3 sites), Workflow remplace Briefcase pour les fonctions (6 sites), Route=Spécialités sidebar (dédup GitBranch). GitBranch conservé pour les contextes structurels (Sidebar Unités, UniteDetailDrawer).
- **Deep-linking `?tab=`** ajouté aux 3 pages détail organisation (fonction/unite/poste) — pattern utilisateurs : `useSearch({ from: routeId }) as { tab?: string }` + `navigate({ search: { tab } as never })` (`as never`, jamais `as any`).
- **`use-templates.ts` corrigé** (2 bugs) : `apiClient.get(url, params)` — le 2e argument EST le record de params (pas `{ params }`) ; générique = type interne (ApiResponse wrappe déjà dans `.data`, ne pas double-wrapper `{ data: X }`).
- `#fff` explicitement accepté (pas de var `--color-text-inverse` — ne pas inventer de CSS vars).

### Qualité
- **0 erreur tsc in-scope** (features/organisation, fonctions, postes, Sidebar, organigramme). Erreurs préexistantes hors périmètre intactes (ex : `unauthorized-page.tsx` route `/communication`).
- 0 `any` nouveau, 0 couleur hardcodée nouvelle, i18n complet.
- Migrations 125 + 126 appliquées en local. Reste : staging/prod.

## Travail effectué — Session 2026-07-25 (fix 431 + walkthrough API notes/bulletins)
### Bug HTTP 431 — permissions retirées du JWT
- **Cause** : claim `permissions` (~12KB pour SUPER_ADMIN) → token 16 453 octets > limite header Node 16KB.
- **Fix** : permissions supprimées des 4 sites de construction JWT (`auth.service.ts` login+refresh, `etablissement-selection.service.ts` completeLogin+temp). `authMiddleware`/`optionalAuthMiddleware` résolvent désormais les permissions côté serveur (`permissionResolverService.resolvePermissions(sub, etablissementId)`, caché) et les attachent à `req.utilisateur.permissions` → tous les consommateurs (check-permission, permission.guard, controllers) inchangés. `JwtPayload.permissions` supprimé du DTO. Corps de réponse login/getCurrentUser conservent `permissions`.
- **Résultat** : token temp 685 o, token complet 829 o (vs 16 453).
- **Route sélection établissement** : `POST /api/auth/complete-login` (pas select-etablissement), body `{etablissementId}`, Bearer token temporaire.

### Permissions ADMIN notes/bulletins
- `DEFAULT_ROLE_PERMISSIONS[Role.ADMIN]` (roles.enum.ts) : 17 permissions notes:*/bulletins:* ajoutées + INSERT role_permissions en DB (17 lignes).

### Walkthrough API réel (SUPER_ADMIN, établissement ETAB-001) — tout vert
- GET /api/notes (paginé) → 200 ; GET /api/notes/statistiques → 200 (moyenne/mediane/distribution)
- POST /api/notes/bulk → 201 (⚠️ `typeEvaluation` attend l'enum MAJUSCULE : `DEVOIR`)
- PATCH /api/notes/:id `{statut:"VALIDEE"}` → 200
- POST /api/bulletins/generate → 200 (moyennes pondérées via matieres_niveaux, rangs, moyClasse/min/max, bulletinMatieres recréées)
- GET /api/bulletins/:id → 200 (relation `bulletinMatieres` chargée) ; GET /:id/export → 200 text/html A4 (10,7 Ko)
- PATCH publie:true → 200 ; DELETE bulletin publié → 400 BULLETIN_PUBLIE (garde OK) ; dépublication → 200
- Frontend :7001 → 200. Données de test Quatrième nettoyées.

## Travail effectué — Session 2026-07-24 (grill-me audit + corrections)
### Backend — Bugs critiques corrigés
- **`organisation.service.ts`** : Bug 1 — `creerUniteAvecPostes` supprimé `estSuppleant` et `etablissementId` (champs inexistants sur Poste). Bug 2 — `getImpactUnite` utilisait `uniteOrganisationnelleId` sur HierarchiePersonnel (inexistant) → corrigé pour `posteId: In(postes.map(p => p.id))`.
- **`mode-remuneration.entity.ts` + `niveau-responsabilite.entity.ts`** : Contraintes `unique: true` sur `code` supprimées → index composites partiels multi-tenant `['code', 'etablissementId'] WHERE "etablissementId" IS NOT NULL`.

### Backend — Normalisation échelons structurels
- **13 → 10 échelons** : suppression redondances (DIRECTION_GENERAL, DEPARTEMENT, SOUS_SERVICE), rename BIBLIOTHEQUE → CDI.
- **Couleurs ajoutées** : chaque échelon a une couleur distinctive (#2563eb, #7c3aed, #059669, etc.).
- **Config registry** : `typesUnitesActifs` aligné avec 10 codes normalisés.
- **Migration 113** : Drop contraintes unique globales + recréation index composites partiels.
- **Migration 119** (renommée depuis 114) : SQL idempotent (rename BIBLIOTHEQUE→CDI, delete redondants, update couleurs).

### Backend — Organigramme enrichi
- **`buildArborescence`** : ajout `relations: ['echelonStructurel']` + `echelonStructurelLabel` et `echelonCouleur` dans les noeuds.

### Frontend — Organigramme amélioré
- **UniteNode.tsx** : Badge échelon coloré dans header + badge niveau responsabilité sous chaque poste. i18n complet (6 chaînes FR hardcodées → `t()`). CSS vars (`text-destructive`, `text-[var(--color-warning)]`).
- **OrganigrammeFlowView.tsx** : i18n "Quitter" → `t('quitterPleinEcran')`. Height responsive `clamp(300px, calc(100vh - 320px), 800px)`.

### Frontend — Qualité code
- **`use-handle-error.ts`** : Hook partagé `useHandleError()` extrait, remplace 6 duplications dans les hooks.
- **12 usages `any` résorbés** : `use-postes.ts` (CreatePosteDto), `use-unites.ts` (UniteOrganisationnelle[]), `use-hierarchies.ts` (type retour validate), `types-personnel-page.tsx` (Column<TypePersonnel>), `nomenclature-crud-page.tsx` (unknown), `personnel-search-field.tsx` (MembrePersonnel), `modeles-page.tsx` (NoeudTemplate/TemplateStructure), `unites-page.tsx` (n.enfants), `OrganigrammeFlowView.tsx` (React.MouseEvent/Node).
- **Anti-pattern hooks inline** : 4 pages nomenclatures → composant `FormWrapper` dédié avec hooks au niveau supérieur.
- **Couleurs hardcodées restantes** : `UniteDetailDrawer.tsx` fallbacks → CSS vars. `#fff` et fallbacks CSS vars acceptés.

### Frontend — Sidebar
- **Lien Organigramme** : `/organisation/organigramme` → `/organisation` (route index).

### Sécurité multi-tenant (P0 — failles CRITICAL corrigées)
- **`unites.controller.ts`** : `etablissementId` forcé depuis le token sur POST create, POST avec-postes, PATCH update, DELETE, reordonner, chemin hiérarchique.
- **`organisation.service.ts`** : `updateUnite`, `deleteUnite`, `reordonnerUnite`, `getCheminHierarchique`, `updateHierarchie`, `deleteHierarchie` filtrent désormais par `etablissementId`.
- **`organigramme.controller.ts`** : `requirePermission('organisation:organigramme:read')` ajouté sur les 4 routes.
- **`nomenclature.controller.ts`** : `etablissementId` passé à `findById`, `update`, `delete` pour les 4 nomenclatures (échelons, niveaux, templates, modes).
- **4 services nomenclature** : `findById/update/delete` acceptent `etablissementId` et filtrent les requêtes.
- **`postes.controller.ts`** : `etablissementId` passé à `create`, `update`, `delete`.
- **`postes.service.ts`** : `create` vérifie que l'unité cible appartient à l'établissement. `update/delete` filtrent via `findById(id, etablissementId)`.

### Entités — Contraintes multi-tenant corrigées
- **`niveau-responsabilite.entity.ts`** : `unique: true` retiré de `@Column` sur `code`. Index composé avec `where: '"etablissementId" IS NOT NULL'`.
- **`mode-remuneration.entity.ts`** : idem.

### Frontend — Qualité code (suite)
- **`OrganigrammePage.tsx`** : gestion erreur avec bouton Réessayer. `OrganigrammeFlowView` rendu conditionnel (lazy). `handleConfirmMove` avec `toast.error`.
- **`nomenclature-crud-page.tsx`** : suppression wrappée dans try/catch (dialog ne se ferme que si succès).
- **`use-unites.ts`** : `staleTime: 30_000` sur useUnites et useArborescence. `useCreerUniteAvecPostes` invalide aussi l'organigramme.
- **`UniteNode.tsx`** : `aria-expanded`, `aria-haspopup="menu"` sur boutons menu et collapse. Dernières chaînes FR hardcodées → `t()`.

### Frontend — i18n et types (session 2026-07-24 suite)
- **`UniteNode.tsx`** : 5 chaînes FR hardcodées → `t()` (`autres`, `aucunPosteCourt`, `vacants_count`, `deplier`, `replier`).
- **Locales FR/EN** : 6 clés ajoutées à la racine (`ajouterEnfant`, `autres`, `aucunPosteCourt`, `vacants_count`, `deplier`, `replier`).
- **`generation-wizard.tsx`** : `as any` → `as 'ERROR' | 'SKIP' | 'OVERWRITE'` (type littéral).
- **`use-types-personnel.ts`** : 7 `any` → typage propre avec `TypePersonnel`, `ApiResponse<T>`, `Omit<>`, `Partial<>`.
- **Module organisation** : 0 `any` restants (vérifié par grep).

### Frontend — UX et qualité (session 2026-07-24 — suite 2)
- **`use-fonctions.ts`** : 10 `any` supprimés, typage propre avec `Fonction`, `PaginatedResult`, `ApiResponse<T>`. Toasts succès/erreur ajoutés via `useHandleError`.
- **`use-postes.ts`** : 8 `any` supprimés, typage propre avec `Poste`, `AffectationPoste`. Migration vers `useHandleError`. Invalidations organigramme ajoutées dans les mutations.
- **`fonctions-page.tsx`** : Skeleton loading (`PageSkeleton`), état erreur avec bouton Réessayer, 10 chaînes FR hardcodées → `t()`, type `handleSave` propre.
- **`unites-page.tsx`** : État erreur avec bouton Réessayer ajouté.
- **Locales FR/EN** : 5 clés ajoutées (`voirDetails`, `rechercherNomCode`, `aucuneFonctionTrouvee`, `supprimerFonction`, `confirmerSuppressionFonction`).

### Backend — Bugs organisation.service.ts (corrigés session 2026-07-24 tour 4)
- **`creerUniteAvecPostes`** : `estSuppleant` supprimé (champ inexistant sur `Poste`). `etablissementId` supprimé (inexistant sur `Poste`).
- **`getImpactUnite`** : `uniteOrganisationnelleId: In(familleIds)` → `posteId: In(postes.map(p => p.id))` (HierarchiePersonnel n'a plus de `uniteOrganisationnelleId`).
- **Migration 119** : commentaire en-tête corrigé (114 → 119).

### Frontend — Composants fonctions/postes (any résorbés)
- **`fonction-form-modal.tsx`** : `onSave: (data: any)` → `(data: CreerFonctionDto | ModifierFonctionDto)`.
- **`fonction-detail-page.tsx`** : `handleSave`, `membresList.map` typés.
- **`poste-form-modal.tsx`** : 10 `any` → types propres (`Fonction`, `UniteOrganisationnelle`, `NiveauResponsabilite`, `React.ChangeEvent`, etc.).
- **`poste-detail-page.tsx`** : `(a: any)` → `(a: AffectationPoste)`.
- **`postes-page.tsx`** : `filtres as any` → `filtres as PosteFiltres`.
- **Modules fonctions + postes** : 0 `any` restants.

## Travail effectué — Session 2026-07-23
### Frontend — Nettoyage `any` types
- **`organisation.types.ts`** : `ModifierPosteDto` index signature `[key: string]: any` supprimée, champs explicites ajoutés (`intitule`, `code`, `description`, `nombrePostes`, `statut`, `fonctionId`, `categoriePosteId`, `categoriePosteCode`, `niveauResponsabiliteId`, `missions`, `competencesRequises`, `estSuppleant`). `TemplateOrganisation.structure` → `TemplateStructure` typé. `GenererOrganisationDto.structure` → `TemplateStructure`. `ResultatGeneration.arborescence` → `Record<string, unknown>`.
- **10 hooks** (`use-usages-unite`, `use-niveaux-responsabilite`, `use-categories-poste`, `use-templates`, `use-types-relation`, `use-unites`, `use-hierarchies`, `use-niveaux-organisation`, `use-postes`) : `handleError(e: any, msg)` → `handleError(e: unknown, msg)` + cast interne. `onError: (e: any)` → `(e: unknown)`. `queryParams: any` → `Record<string, string>`.
- **6 composants nomenclature-page** (`categories-poste-page`, `niveaux-organisation-page`, `niveaux-responsabilite-page`, `types-relation-page`, `usages-unite-page`, `types-personnel-page`) : paramètres implicites `v`, `values` typés.
- **`nomenclature-form-modal.tsx`** : générique `T extends Record<string, any>` supprimé. `Props` non-générique avec `initialData?: unknown`. `catch (e: any)` → `(e: unknown)`. Callbacks `.map(f =>` → `.map((f: FieldConfig) =>`.
- **`nomenclature-crud-page.tsx`** : `error?: any` → `Error | null`. `useCreate` variables type → `Partial<T>`.
- **`hierarchie-form-modal.tsx`** : `data: any` → `Record<string, string | undefined>`. `err: any` → `err: unknown`. `tr: any` → `{ id: string; label: string }`. `CreerHierarchieDto.etablissementId` → `string | null | undefined`.
- **`generation-wizard.tsx`** : `noeud: any` → `ApercuNode` interface. `(e: any)` → `(e: ApercuNode)`. Import `OrganigrammeNode` inutilisé supprimé. `noeud.count` / `noeud.postes` null-safety.
- **`unites-page.tsx`** : `flattenTree(nodes: any[]): any[]` → `UniteOrganisationnelle[]`.
- **`unite-detail-page.tsx`** : `(unite as any)` → cast local. `(e: any)` → `OrganigrammeNode`. `(p: any)` → `OrganigrammePoste`.
- **`tab-hierarchie.tsx`** : `postes: any[]` → `OrganigrammePoste[]`. `TreeNode<any>[]` → `TreeNode<OrganigrammeNode>[]`. `p: any` → `p: OrganigrammePoste`.
- **`OrganigrammeFlowView.tsx`** : paramètres implicites `_event`, `node` → `unknown`, `Record<string, unknown>`.
- **`personnel-search-field.tsx`** : `Record<string, any>` → `Record<string, string | number>`.

### Frontend — Couleurs hardcodées → CSS vars
- **`base-form-modal.tsx`** : colorMap retiré `bg-*`, `text-*` → `wrapper` + `iconColor`. `text-gray-900` → `text-foreground`. `bg-red-50` → `bg-destructive/10`. `text-red-500` → `text-destructive`. `Loader2 text-blue-500` → `text-primary`.
- **`personnel-search-field.tsx`** : toutes les couleurs `text-gray-*`, `bg-gray-*`, `bg-blue-*`, `text-blue-*`, `text-red-*`, `border-gray-*`, `border-red-*` → CSS vars (`text-secondary`, `bg-muted`, `bg-primary/10`, `text-primary`, `text-destructive`, `border-border`, `border-destructive`, `bg-card`, `text-muted-foreground`, `bg-accent`, `hover:bg-accent`).
- **`tab-hierarchie.tsx`** : `text-gray-400` → `text-muted-foreground`. `text-blue-500` → `text-primary`. `text-gray-900` → `text-foreground`. `text-gray-600` → `text-secondary`. `bg-white dark:bg-gray-900 border-gray-200` → `bg-card border-border`.
- **`unites-page.tsx`** : `text-gray-900/500/600/400` → `text-foreground`/`text-muted-foreground`/`text-secondary`. `bg-white dark:bg-gray-900 border-gray-200` → `bg-card border-border`. `hover:text-blue/green/red-600` → `hover:text-primary/success/destructive`.
- **`modeles-page.tsx`** : `text-blue-600 hover:bg-blue-50` → `text-primary hover:bg-primary/10`. `text-red-600/500 hover:bg-red-50` → `text-destructive hover:bg-destructive/10`.
- **`nomenclature-form-modal.tsx`** : `text-red-500` → `text-destructive`.
- **`generation-wizard.tsx`** : `text-blue/purple/green-600` → `text-primary`/`text-secondary-foreground`/`text-success`.
- **`UniteFormModal.tsx`, `PosteFormModal.tsx`, `UniteDetailDrawer.tsx`** : `text-red-500` → `text-destructive`. `hover:bg-red-50` → `hover:bg-destructive/10`.

### Frontend — Fusion organigramme
- `OrganigrammeVertical.tsx` et `OrganigrammeHorizontal.tsx` supprimés, remplacés par `OrganigrammeFlowView.tsx` avec prop `direction: 'TB' | 'LR'`.
- `OrganigrammePage.tsx` mis à jour pour utiliser le composant fusionné.

## Notes de conception
- `FilterPanel` retiré quand redondant avec les filtres DataTable intégrés (`enableCollapsibleFilters` + `filtres` prop).
- Toutes les modales de formulaire suivent le pattern : `CustomModal`, `FORM_INIT` constante, `SectionSeparator`, `hasUnsavedChanges`, reset à la fermeture par `useEffect`.
- Pas de glass container system-wide — uniquement dans les actions du PageHeader.
- `TextLabel` (composant réutilisable `components/ui/TextLabel.tsx`) pour les labels importants : utilise `--color-text-strong` (contrat plus élevé), `font-weight: 600`, tooltip natif `title` lors du troncage.
- Hierarchie de contraste : `--color-text-strong` > `--color-text-primary` > `--color-text-secondary` > `--color-text-muted`.
- **Sources de vérité** : EchelonStructurel (table, fusion NiveauOrg+UsageUnite), NiveauResponsabilite (table), TypePersonnel (table globale), ModeRemunerationEntity (table, remplace enum paie). CategoriePoste, TypeRelationHierarchique supprimés.
- **Protection seeds** : `assertNotSystem()` dans shared/helpers. UI : Supprimer caché si estSysteme, Dupliquer ajouté.
- **Composants génériques** : `NomenclatureCrudPage<T>` (4 nomenclatures), `TreeView<T>` (unités, fonctions, organigramme).
- **i18n** : 100% flat. Helper `useEnumOptions(ns, enumValues, prefix)` pour listes déroulantes.
- **Routes API** : pur pluriel REST. `/api/organisation/*`. Actions via sous-ressources ou query params.
- **Helper handleError** : `useHandleError()` dans `hooks/use-handle-error.ts` — pattern partagé dans tous les hooks du module (remplace duplication locale).
- **Anti-pattern hooks** : JAMAIS appeler un hook dans le JSX. Toujours extraire un composant dédié avec hooks au niveau supérieur (voir `FormWrapper` dans les pages nomenclatures).
- **Contraintes multi-tenant** : `unique: true` sur `@Column` interdit pour les nomenclatures multi-tenant. Utiliser `@Index(['code', 'etablissementId'], { unique: true, where: '"etablissementId" IS NOT NULL' })`.
- **10 échelons structurels système** : ETABLISSEMENT(0), DIRECTION(1), DEPARTEMENT_PEDA(2), SERVICE(2), COMMISSION(3), EQUIPE(3), BUREAU(3), ATELIER(3), LABORATOIRE(3), CDI(3).


## Travail effectué — Session 2026-07-23 (grill-me organisation v4.0)
### Consolidation du modèle (8 décisions validées)
1. **ModeRemunerationEntity** = source unique, enum `ModeRemuneration` (paie) supprimée
2. **NiveauOrganisation** → renommé `EchelonStructurel`
3. **UsageUnite** → fusionné dans `EchelonStructurel` (ajout champ `code`)
4. **TypeRelationHierarchique** (table) → enum varchar `DIRECT/FONCTIONNEL` sur HierarchiePersonnel
5. **CategoriePoste** → supprimé, dérivé via `Fonction.typePersonnel`
6. **TypePersonnel.modeRemunerationDefaut** → supprimé
7. **TemplateOrganisation** → interfaces adaptées (echelonCode, sans categoriePosteId)
8. **Frontend** → sidebar simplifiée, Nomenclatures 4 onglets, Organigramme unifié

### Architecture & Modèle (session précédente)
- **TypePersonnel codes** : préfixe `TYPE_` pour disambiguer de CategoriePoste. `personnel.constants.ts`, `seed-type-personnel.ts`, `seed-organisation.ts` mis à jour. Migration seed auto : renommage des anciens codes (ex. `ENSEIGNANT` → `TYPE_ENSEIGNANT`).
- **TemplatePoste.fonctionId** : champ optionnel ajouté à l'interface. `generation.service.ts` priorise `fonctionId` sur `fonctionRef`. Validation croisée seed-templates : vérifie que chaque `fonctionRef` existe dans la base.
- **CTE anti-cycle HierarchiePersonnel** : remplacement du DFS applicatif par une `WITH RECURSIVE` PostgreSQL dans `organisation.service.ts`.
- **Progression niveaux unités** : validation stricte `enfant.niveau === parent.niveau + 1` ajoutée à `createUnite` et `updateUnite`.
- **Permissions GET** : `requirePermission('organisation:*:read')` ajouté à toutes les routes GET (unites, fonctions, hierarchie, nomenclatures, templates) qui étaient sans guard.
- **Sidebar filtrage** : `organisation:view`/`organisation:manage` ajouté aux `permsMap` du Sidebar via `useModulePermissions('organisation')`.

### Frontend
- **UniteDetailPage** : permission guard (`beforeLoad`), boutons Edit/Delete, modal d'édition (`UniteFormModal`), confirmation suppression. Typage propre (`UniteDetail` extends `UniteOrganisationnelle`). Cast `(unite as any)` supprimé.
- **reactflow + dagre** : `npm install` exécuté. Composant `OrganigrammeFlowView.tsx` fonctionnel sans erreur TS.

### AGENTS.md
- Décisions grill-me documentées (prefix TYPE_, fonctionId, CTE, progression niveaux, permissions GET, sidebar).

### Frontend — base-form-modal colorMap
- **`base-form-modal.tsx`** : couleurs indigo/purple/green/orange/amber remplacées par CSS vars (`var(--color-info)`, `accent`, `var(--color-success)`, `var(--color-warning)`). Plus de classes hardcodées dark/light.

## Refonte Emploi du Temps — Session 2026-07-24 (grill-me 10 décisions)
### Décisions validées (D1–D9)
| # | Décision | Impact |
|---|----------|--------|
| D1 | `MatiereNiveau.volumeHoraire` = source unique et absolue | Supprimé `volumeHoraire` de ProgrammeMatiere, ConfigurationMatiereClasse |
| D2 | Fusion `EmploiDuTemps` + `RepartitionHoraire` → `CreneauHoraire` | Nouvelle entité, référencée par `affectationMatiereId` |
| D3 | `HeureCours` ancré sur `classeAnneeId` (pas `classeId`) | Migration FK, remplacement classeId → classeAnneeId |
| D4 | `ProgrammePedagogique` = curriculum intemporel + historisation | Supprimé periodeId, dateDebut/Fin, anneeScolaireId, nbHeuresHebdo. Table `programmes_versions` |
| D5 | Supprimer `ConfigurationMatiereClasse` | `obligatoire` et `statutValidation` absorbés par AffectationMatiere |
| D6 | Édition manuelle complète : modal + drag & drop + resize | Nouveau frontend |
| D7 | `PreferenceEmploiDuTemps` enrichi : pauses + `creneauxImposables` JSONB | Migration + nouveaux champs |
| D8 | Frontend 5 onglets : Calendrier, Liste, Synthèse, Préférences, Templates | Refonte page |
| D9 | `ConflitDetectionService` : 5 types (3 bloquants, 2 avertissements) | Nouveau service backend |

### Entités supprimées (3)
- `ConfigurationMatiereClasse` → champs absorbés par AffectationMatiere
- `RepartitionHoraire` → fusionnée dans CreneauHoraire
- `EmploiDuTemps` → fusionnée dans CreneauHoraire

### Entités créées (2)
- `CreneauHoraire` (table `creneaux_horaires`)
- `ProgrammeVersion` (table `programmes_versions` — historisation)

### Modèle cible
```
MatiereNiveau (source vérité volume horaire)
    ├── ProgrammePedagogique (curriculum intemporel)
    │       └── ProgrammeMatiere (bridge, SANS volumeHoraire)
    ├── ClasseAnnee.programmeId → ProgrammePedagogique
    └── AffectationMatiere (pivot contextuel: +obligatoire, +statutValidation, -configurationId)
            └── CreneauHoraire (fusion EDT+Repartition)
                    └── HeureCours (matérialisation datée: +classeAnneeId, +creneauId)
```

### Permissions RBAC ajoutées
- `emploi-du-temps:verifier-conflits` (lecture)
- `programmes:historiser` (écriture)

### Fichiers backend modifiés
- Entités : creneau-horaire.entity.ts, programme-version.entity.ts, affectation-matiere.entity.ts, heure-cours.entity.ts, programme-pedagogique.entity.ts, programme-matiere.entity.ts, preference-emploi-du-temps.entity.ts
- Services : emploi-du-temps.service.ts (réécrit), conflit-detection.service.ts (nouveau), programme-pedagogique.service.ts (historisation), matieres.service.ts (nettoyé), notes.service.ts, programme-matiere.service.ts
- Controllers : emploi-du-temps.controller.ts, matieres.controller.ts
- DTOs : emploi-du-temps.dto.ts, matieres.dto.ts, programme-pedagogique.dto.ts, programme-matiere.dto.ts

### Fichiers frontend modifiés
- Types : use-emploi-du-temps.ts (CreneauHoraire, Conflit, types), matiere.types.ts, programme.types.ts
- Hooks : use-emploi-du-temps.ts (useVerifierConflits), use-matieres.ts (nettoyé)
- Composants : edt-calendar.tsx, matiere-detail-page.tsx
- i18n : emplois.json (FR+EN: conflitDetection, synthese)

## Travail effectué — Session 2026-07-24 (grill-me suite)
### Frontend — Couleurs hardcodées → CSS vars (5 fichiers)
- **`PosteCapaciteIndicator.tsx`** : `bg-red-500/amber-500/green-500` → `bg-destructive/warning/success`, `bg-gray-200 dark:bg-gray-700` → `bg-muted`
- **`fonction-form-modal.tsx`** : `text-red-500` (required markers) → `text-destructive`
- **`fonction-arbre.tsx`** : `bg-blue-100` → `bg-primary/10`, `bg-green/red` → `bg-success/destructive`, `hover:bg-red` → `hover:bg-destructive/10`
- **`fonctions-page.tsx`** : status badges `bg-green/red` → `bg-success/destructive`
- **`postes-page.tsx`** : `text-gray-*` → `text-foreground/secondary/muted-foreground`
- **`poste-form-modal.tsx`** : `text-gray-700` → `text-foreground`, `bg-gray-100` → `bg-muted`, `hover:bg-red` → `hover:bg-destructive/10`

### Frontend — i18n : 22 chaînes FR hardcodées → t()
- **`fonction-arbre.tsx`** : `useTranslation` ajouté, 5 chaînes traduites (Actif/Inactif, Modifier, Supprimer, aucuneFonctionIndication)
- **`hierarchie-form-modal.tsx`** : `TYPES_RELATION_OPTIONS` déplacé dans le composant, labels → `t('typeRelation_DIRECT/FONCTIONNEL')`
- **`nomenclature-form-modal.tsx`** : fallback `'Erreur'` → `t('erreurGenerique')`
- **`generation-wizard.tsx`** : `StructureApercu` avec `useTranslation`, `'poste(s)'` → `t('postes')`
- **`modeles-page.tsx`** : `StructurePreview` avec `useTranslation`, `'poste(s)'` → `t('postes')`
- **`unites-page.tsx`** : `header: 'Actions'` → `t('colActions')`
- **`postes-page.tsx`** : `header: 'Actions'` → `t('colActions')`
- **`fonctions-page.tsx`** : `'— Racine —'` → `t('racine')`
- **`poste-form-modal.tsx`** : `'Une erreur est survenue'` → `t('erreurGenerique')`, placeholders missions/compétences → `t()`
- **`poste.zod.ts`** : `STATUT_POSTE_OPTIONS` converti `label` → `labelKey` (i18n keys), consommateurs mis à jour
- **3 clés i18n ajoutées** FR+EN : `ajouterMission`, `ajouterCompetence`, `aucuneFonctionIndication`

### Backend — 21 types `any` éliminés dans `organisation.service.ts`
- **Interfaces ajoutées** : `ArborescenceNode` (extends `Partial<UniteOrganisationnelle>` avec enfants récursif) + `PosteOrganigramme` (extends `Partial<Poste>` avec labels enrichis)
- **`FindOptionsWhere<T>`** : 7 `const where: any` → `FindOptionsWhere<UniteOrganisationnelle>` ou `FindOptionsWhere<HierarchiePersonnel>`
- **Résultats SQL bruts** : `(r: any) => r.id` → `(r: { id: string }) => r.id`
- **Arborescence/Organigramme** : `Promise<any[]>` → `Promise<ArborescenceNode[]>`, `Map<string, any>` → `Map<string, ArborescenceNode>`, callbacks reduce/filtre typés
- **Statistiques** : `statistiques: any` → `Record<string, unknown>`

### Bilan qualité — Module Organisation
- **`any` frontend** : 0 dans organisation/, fonctions/, postes/
- **`any` backend** : 0 dans TOUT le module organisation (services + entities)
- **Couleurs hardcodées** : 0 dans les 3 modules
- **Chaînes FR hardcodées** : 0 dans les 3 modules
- **Cohérence backend** : aucune référence aux entités supprimées (UsageUnite, CategoriePoste, NiveauOrganisation, TypeRelationHierarchique)

## Travail effectué — Session 2026-07-24 (grill-me tour final)
### Backend — Élimination `any` dans 4 services secondaires
- **`postes-vacants.service.ts`** : Interfaces `PosteVacantInfo` et `StatistiquesVacance` ajoutées. 4 `any` → 0 (`critiques: any[]`, `avertissements: any[]`, `Promise<any>`)
- **`statistiques-optimisees.service.ts`** : `params: any[]` → `(string | number)[]`, `(row: any)` → `Record<string, string | number | null>`, `(u: any)` → `{ id: string }`
- **`organigramme.pdf.service.ts`** : Interfaces `NoeudOrganigramme` et `PosteOrganigrammePDF` ajoutées. 13 `any` → 0 (paramètres méthodes + callbacks)
- **`generation.service.ts`** : `templatePoste as any` supprimé. Interface `TemplatePoste` étendue avec `intitulé?` et `niveauResponsabilite?` (champs optionnels utilisés par les templates JSON)
- **4 services nomenclature** (déjà fait tour précédent) : `FindOptionsWhere<T>` dans mode-remuneration, niveau-responsabilite, echelon-structurel, template-organisation

### Bilan final — Zéro `any` module Organisation
- **Backend services** : 0 `any` dans les 8 fichiers de service
- **Backend entities** : 0 `any` dans les interfaces template
- **Frontend** : 0 `any` dans les hooks, composants, types, pages
- **Routes** : 60/60 protégées par `authMiddleware` + `requirePermission`
- **UX** : Toutes les pages ont des états loading/error avec retry

## Travail effectué — Session 2026-07-24 (audit final + corrections)
### Backend — Bugs corrigés
- **`unites.controller.ts`** : Route `POST /unites/avec-postes` déplacée avant `GET /unites/:id` (sinon le `:id` matchait "avec-postes")
- **`statistiques-optimisees.service.ts`** : Strings `'actif'`/`'vacant'` → `StatutPoste.ACTIF`/`StatutPoste.VACANT` (enum)
- **`fonctions.service.ts`** : Chemin matérialisé corrigé (`parent.chemin + '.' + id`) + mise à jour dans `update()`
- **`organisation.service.ts`** : Ajout `destroy()` pour cleanup du `setInterval` Redis
- **`generation.service.ts`** : `superieurId` corrigé (ne reçoit plus un UUID de Poste)

### Frontend — Hooks, pages, types
- **`use-fonctions.ts`** : Ajout `enabled: isAuthenticated` sur tous les hooks (évite requêtes quand non connecté)
- **`fonction-detail-page.tsx`** : Handlers `onEdit`/`onDelete` fonctionnels + `ConfirmDialog` pour suppression sous-fonctions
- **`unite-detail-page.tsx`** : Clé i18n `supprimerUniteConfirmation` → `confirmerSuppressionUnite`
- **`fonctions-page.tsx`** : Clé i18n `actions` → `colActions`
- **`organisation.types.ts`** : Types `Fonction`/`CreerFonctionDto`/`ModifierFonctionDto` dupliqués supprimés

### i18n — Clés dupliquées nettoyées
- **`fr/organisation.json`** : Clé `organigramme` (string) renommée `vueOrganigramme` (conflit avec l'objet imbriqué). Doublon `ajouterSousUnite` supprimé.
- **`en/organisation.json`** : Idem. Clé renommée + doublon supprimé.
- **`tab-hierarchie.tsx`** : `t('organigramme')` → `t('vueOrganigramme')`

### Bilan qualité final
- **0 `any`** dans tout le module (backend + frontend)
- **0 clé i18n dupliquée** dans les JSON
- **0 route sans guard**
- **157 clés i18n** vérifiées dans les 24 fichiers composants
- **Cohérence backend** : entités, services, controllers alignés

## Travail effectué — Session 2026-07-24 (migration 120 — vues matérialisées)
### Migration 120 — Correction vues matérialisées organisation
- **`120-correction-vues-materialisees-organisation.sql`** : Migration corrective pour les vues matérialisées cassées depuis la refonte v4.
- **`mv_stats_organisation`** : DROP + RECREATE. Ne référence plus la table inexistante `organisations`. Agrège par `etablissementId` directement depuis `unites_organisationnelles`. Colonnes aliasées en snake_case pour cohérence avec le service (`etablissement_id`, `total_unites`, etc.)
- **`mv_postes_vacants_critiques`** : DROP + RECREATE. `p.intitulé` → `p.intitule`, suppression de `organisations o` / `u.organisationId` / `organisation_nom`. Ajout filtre `p.actif = true`.
- **`refresh_mv_organisation()`** : Fonction simplifiée (suppression INSERT dans logs_systeme obsolète).
- **Index ajoutés** : `idx_templates_org_actif`, `idx_templates_org_etablissement` sur `templates_organisation`.
- **Index obsolètes supprimés** : `idx_postes_couvrant_stats` (référençait `occupantId` supprimé), `idx_mv_stats_organisation_id` (référençait `organisation_id` supprimé).

### Service backend — Cohérence vues
- **`statistiques-optimisees.service.ts`** : `organisationNom` supprimé de l'interface `PosteVacantCritique` et du mapping (la table `organisations` n'existe plus).

### Bilan migrations
- **12 migrations** pour le module organisation (044, 045, 046, 109, 110, 112, 120 + anciennes)
- **Migration 120** : corrige les vues matérialisées cassées par les refontes 109-112
- **Cohérence vérifiée** : entités ↔ migrations ↔ service ↔ vues matérialisées

## Travail effectué — Session 2026-07-25 (refonte complète des modèles d'organisation)

### Contexte
Les 22 templates existants manquaient de cohérence, de logique et de contextualisation. Aucun metadata (nature juridique, système éducatif, langue, niveaux, complexité). Pas de filtrage dans la galerie. Fonctions non adaptées au système anglophone/bilingue.

### Analyse et recherche
- **Inspection approfondie** du code actuel (entités, seeds, templates, services, frontend)
- **Recherche web** sur les modèles réels d'établissements scolaires :
  - Système éducatif camerounais (MINESEC, MINEDUB) : lycées, collèges, écoles primaires
  - Système anglophone (British/American) : Head Teacher, Deputy Head, Head of Year, Form Tutor, SENCO
  - Système bilingue (Cameroun) : Coordinateur linguistique, Directeurs de section
  - Enseignement technique : Chef des travaux, Chefs d'atelier, Moniteurs
  - Centres de formation professionnelle : Coordinateurs de filière, Formateurs, Tuteurs entreprise

### Décisions architecturales (v6.0 — Templates catégorisés)

#### 5 axes de classification ajoutés à `TemplateOrganisation`
1. **Nature juridique** (`NatureJuridique`) : PUBLIC_ETATIQUE, PUBLIC_COMMUNAL, PRIVE_LAIC, PRIVE_CONFESSIONNEL, PRIVE_ASSOCIATIF, COMPLEXE
2. **Système éducatif** (`SystemeEducatif`) : GENERAL, TECHNIQUE, PROFESSIONNEL, NORMAL, SUPERIEUR
3. **Langue d'enseignement** (`LangueEnseignement`) : FRANCOPHONE, ANGLOPHONE, BILINGUE
4. **Niveaux** (`NiveauEnseignement[]`) : MATERNEL, PRIMAIRE, COLLEGE, LYCEE, POST_BAC
5. **Complexité structurelle** (`ComplexiteStructurelle`) : STANDARD, AVANCE

#### Colonnes ajoutées à l'entité
- `nature`, `systeme`, `langue`, `niveaux` (simple-array), `complexite`, `categorie`, `ordre`, `icone`, `metadata` (jsonb), `nomEn`
- 5 index partiels pour optimiser les filtres

#### 4 nouveaux échelons structurels
- SECTION_LINGUISTIQUE (niveau 2, #8b5cf6)
- CYCLE (niveau 2, #06b6d4)
- FILIERE (niveau 2, #f59e0b)
- POLE_FORMATION (niveau 2, #10b981)

#### 10 nouvelles fonctions (anglophone + bilingue)
- Anglophone : HEAD-TEACHER, DEPUTY-HEAD, HEAD-OF-YEAR, FORM-TUTOR, SENCO, BUSINESS-MGR, EXAMS-OFF
- Bilingue : COORD-LING, DIR-SECTION-FR, DIR-SECTION-EN

#### 25 templates catégorisés (remplacent les 22 anciens)
- T01-T02 : Lycée général public (standard + avancé)
- T03-T04 : Collège public (standard + avancé)
- T05-T07 : Lycée/Collège technique public
- T08-T09 : École primaire publique (standard + avancé)
- T10 : École maternelle publique
- T11-T12 : Complexes scolaires privés (bilingue + francophone)
- T13 : Collège-Lycée privé confessionnel
- T14-T15 : British schools (secondary + primary)
- T16 : Bilingual school (avancé)
- T17-T19 : CFP / Institut / Grande école
- T20-T21 : ENIEG / Université
- T22-T24 : Écoles bilingues/communales
- T25 : Organisation standard (générique)

#### Matrice de combinaisons valides
- 25 combinaisons logiques documentées
- Incompatibilités exclues : MATERNEL+TECHNIQUE, NORMAL+PRIMAIRE, CFP+MATERNEL/PRIMAIRE, COMPLEXE+un_seul_niveau

### Backend — Fichiers modifiés (7)
1. **`template-organisation.entity.ts`** : 5 enums + 9 colonnes + 6 index partiels
2. **`127-templates-organisation-categorisation.sql`** : Migration (ALTER TABLE + index + échelons)
3. **`seed-nomenclatures.ts`** : 4 nouveaux échelons structurels
4. **`seed-organisation.ts`** : 10 nouvelles fonctions anglophone/bilingue
5. **`seed-templates.ts`** : 25 templates catégorisés (remplace les 22 anciens)
6. **`template-organisation.service.ts`** : 3 nouvelles méthodes (`findAllFiltered`, `getCombinaisonsValides`, `clonerTemplate`)
7. **`nomenclature.controller.ts`** : 3 nouvelles routes (GET /templates avec filtres, GET /templates/combinaisons, POST /templates/:id/cloner)

### Frontend — Fichiers modifiés (6)
1. **`organisation.types.ts`** : 5 enums miroir + `TemplateFiltres` + `CombinaisonsValides`
2. **`query-keys.ts`** : Clés de cache `filtered()` et `combinaisons`
3. **`use-templates.ts`** : 3 hooks (filtres, combinaisons, clonage)
4. **`modeles-page.tsx`** : FacetFilters (5 groupes) + TemplateBadges + SearchInput + grille responsive 1→4 cols
5. **`fr/organisation.json`** : Traductions FR (natures, systemes, langues, niveaux, complexites, filtres)
6. **`en/organisation.json`** : Traductions EN (mêmes clés)

### API REST — Nouvelles routes
- `GET /api/organisation/templates?nature=&systeme=&langue=&niveaux=&complexite=&search=` (filtrage par facets)
- `GET /api/organisation/templates/combinaisons` (matrice des combinaisons valides + compteurs)
- `POST /api/organisation/templates/:id/cloner` (clonage avec nom optionnel)

### Qualité code
- **0 `any`** (sauf 1 contournement TypeORM mineur dans le seed)
- **0 couleurs hardcodées** — toutes via CSS variables
- **0 chaînes FR en dur** — toutes via `t()`
- **Responsive** — grille 1→4 colonnes, `clamp()` partout
- **Multi-tenant** — isolation par `etablissementId`
- **RBAC** — permissions granulaires sur toutes les routes

### Résultats
- Migration 127 appliquée : ✅ (10 colonnes, 5 index, 4 échelons)
- Seeds exécutés : ✅ (13 templates créés, 12 mis à jour, 10 fonctions par établissement)
- Compilation TS : ✅ (0 erreur après correction `intitulé` → `intitule`)
- Vérification 10/10 points : ✅

### Prochaines étapes recommandées
1. Tester la galerie avec filtres dans le frontend
2. Tester le clonage de templates
3. Tester la génération avec les nouveaux templates
4. Valider la cohérence des fonctionRef dans chaque template
5. Ajouter des tests unitaires pour `findAllFiltered()` et `clonerTemplate()`

## Travail effectué — Session 2026-07-27 (export v4 : lib/ réutilisable, minimap mobile, PDF tuiles multi-pages)

### Arbitrages grill-me (6 sujets analysés)

| # | Sujet | Décision | Justification |
|---|-------|----------|---------------|
| 1 | Minimap desktop-only (export mobile) | **Implémenté** | Force-mount temporaire via événement `force-minimap` avant capture, cleanup en `finally` |
| 2 | Web Worker encodage PNG géant | **Différé** | html-to-image exige le DOM (SVG foreignObject) ; le coût principal = sérialisation SVG + rastérisation, non déplaçable. Gain limité au ré-encodage final. À reconsidérer si gels constatés en usage réel |
| 3 | PDF multi-pages (tuiles) | **Implémenté** | Mode `tuiles` : page assemblage + grille numérotée + tuiles avec repères de découpe, chevauchement 10mm, DPI 150 |
| 4 | Rendu PDF côté serveur | **Différé** | Fidélité pixel exige le DOM client (dagre layout, CSS vars thème, fonts, ReactFlow). Pas de navigateur headless dans la stack Express+TypeORM |
| 5 | Rendu PNG côté serveur | **Différé** | Même contrainte que #4 — la capture pixel-fidèle nécessite le DOM complet |
| 6 | Réutilisabilité (lib/export/) | **Implémenté** | `css-var-resolver.ts` + `dom-stabilisation.ts` extraits dans `frontend/src/lib/export/` |

### A — Extraction lib/export/ (réutilisabilité)
- **`frontend/src/lib/export/css-var-resolver.ts`** : `resolveCssVar`, `resolveColor`, `clearResolverCache`, `normaliserCouleurHex` (move depuis `utils/`)
- **`frontend/src/lib/export/dom-stabilisation.ts`** : `attendreStabilisationDom` (MutationObserver debouncé)
- **`frontend/src/lib/export/index.ts`** : barrel export
- **4 imports mis à jour** : `export.ts`, `RelationEdge.tsx`, `HierarchieEdge.tsx`, `use-organigramme-flow.ts` → `@/lib/export`
- **Ancien fichier supprimé** : `utils/css-var-resolver.ts` (pas de shim de compat)

### B — Minimap mobile force-mount
- **`OrganigrammeFlowView.tsx`** : state `forceMinimap` + case `force-minimap` dans le listener `organigramme:toolbar-command` + rendu `{(isDesktop || forceMinimap) && <MiniMap/>}`
- **`export.ts`** : dispatch `force-minimap` visible=true avant capture si `options.inclureMinimap` + `attendreStabilisationDom` + cleanup visible=false en `finally`
- La minimap n'est rendue que ≥1280px en usage normal ; l'export la monte temporairement si demandée

### C — PDF multi-pages tuiles (`export-pdf.ts` v3.0.0, `export-types.ts` v3.1.0)
- **`ModePagination = 'ajuster' | 'tuiles'`** dans `ExportOptions.pagination`
- **`calculerGrilleTuiles(largeurImgMm, hauteurImgMm, pageFormat, orientation, chevauchementMm=10)`** : calcul grille colonnes×lignes, exporté depuis `export-types.ts`
- **Mode 'ajuster'** : comportement historique (image entière sur 1 page)
- **Mode 'tuiles'** :
  - Page 1 = assemblage : en-tête + vue d'ensemble réduite + grille numérotée (L×C) + légende + footer
  - Pages 2+ = 1 tuile/page : label `Lx·Cy — n/N`, corner marks 4 coins, chevauchement 10mm
  - DPI cible 150 pour impression (`PX_PAR_MM = 150/25.4`)
  - Découpe via offscreen canvas (`decouperTuile`)
  - Repères de découpe (`dessinerMarks`) aux 4 coins de chaque tuile
- **`ExportDialog.tsx`** : fieldset Pagination (PDF only) avec segments Ajuster/Tuiles + description ; estimation tuiles affichée dans le bloc estimation (`≈ N pages (C × R)`)

### Fichiers modifiés (8)
1. `lib/export/css-var-resolver.ts` (créé)
2. `lib/export/dom-stabilisation.ts` (créé)
3. `lib/export/index.ts` (créé)
4. `utils/css-var-resolver.ts` (supprimé)
5. `utils/export-types.ts` v3.1.0 (+ModePagination, +GrilleTuiles, +calculerGrilleTuiles)
6. `utils/export-pdf.ts` v3.0.0 (mode tuiles, DPI 150, découpe canvas, marks)
7. `utils/export.ts` v4.1.0 (import lib/, pagination, minimap force-mount)
8. `OrganigrammeFlowView.tsx` (forceMinimap state + commande)
9. `ExportDialog.tsx` v3.1.0 (fieldset pagination, estimation tuiles)
10. `edges/RelationEdge.tsx`, `edges/HierarchieEdge.tsx`, `hooks/use-organigramme-flow.ts` (imports → lib/)
11. `locales/fr/organisation.json`, `locales/en/organisation.json` (+6 clés pagination/tuiles)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité, JSON valides
- `tsc --noEmit` : 0 erreur in-scope
- Conventions eLISAschool : bannières, CSS vars, clamp(), CustomModal

## Travail effectué — Session 2026-07-27 (export v5 : lib/export/ générique, aperçu PDF)

### A — Extraction utilitaires génériques dans lib/export/
- **`lib/export/telecharger.ts`** (nouveau) : `telecharger()`, `genererNomFichier(nom, suffixe, format)` (généralisé avec paramètre `suffixe`), `tailleDataUrlOctets()`, `formaterTaille()` (nouveau, formatage Ko/Mo/Go)
- **`lib/export/tuiles.ts`** (nouveau) : `PAGE_FORMATS_MM` (sans `label`, `as const`), `calculerGrilleTuiles()`, `chargerImage()`, `decouperTuile()`, types `GrilleTuiles` et `OrientationPage`
- **`lib/export/index.ts`** : barrel mis à jour — ré-exporte `telecharger`, `genererNomFichier`, `tailleDataUrlOctets`, `formaterTaille`, `PAGE_FORMATS_MM`, `calculerGrilleTuiles`, `chargerImage`, `decouperTuile`, types `GrilleTuiles` et `OrientationPage`
- **Déduplication** : `GrilleTuiles` et `calculerGrilleTuiles` supprimés de `export-types.ts` (maintenant dans `lib/export/tuiles.ts`). `PAGE_FORMATS` conservé dans `export-types.ts` (champ `label` pour l'UI) — distinct de `PAGE_FORMATS_MM` (calcul)
- **`export.ts`** : `telecharger`, `genererNomFichier`, `tailleDataUrlOctets` locaux supprimés → importés depuis `@/lib/export`. Appel `genererNomFichier` mis à jour (ajout `'organigramme'` comme suffixe)
- **`export-pdf.ts`** : `chargerImage`, `decouperTuile` locaux supprimés → importés depuis `@/lib/export`. `calculerGrilleTuiles` importé depuis `@/lib/export`. `getPageDimensions` utilise `PAGE_FORMATS_MM` au lieu de `PAGE_FORMATS`
- **`ExportDialog.tsx`** : `calculerGrilleTuiles` importé depuis `@/lib/export`

### B — Aperçu visuel PDF dans ExportDialog
- **`ApercuExport`** (composant interne) : SVG inline montrant la page (format + orientation), l'image estimée ajustée dans la zone utile, et la grille de tuiles en mode pagination 'tuiles' (rectangles pointillés bleu + labels `C×L`)
- Affiché uniquement pour le format PDF (condition `format === 'pdf'`)
- Dimensions SVG adaptatives : max 200×120px, scale proportionnel au format de page
- CSS vars pour toutes les couleurs (fond page, bordure, image, tuiles, texte)
- Accessible : `role="img"` + `aria-label` traduit

### Fichiers modifiés (7)
1. `lib/export/telecharger.ts` (créé)
2. `lib/export/tuiles.ts` (créé)
3. `lib/export/index.ts` (mis à jour — barrel)
4. `utils/export.ts` v4.1.0 (imports lib/, locaux supprimés)
5. `utils/export-pdf.ts` v3.0.0 (imports lib/, locaux supprimés)
6. `utils/export-types.ts` v3.0.0 (GrilleTuiles/calculerGrilleTuiles supprimés)
7. `modals/ExportDialog.tsx` v3.1.0 (import lib/, composant ApercuExport)
8. `locales/fr/organisation.json`, `locales/en/organisation.json` (+2 clés apercu/apercuLabel)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité, JSON valides
- `tsc --noEmit` : 0 erreur in-scope (205 erreurs préexistantes hors périmètre)
- Zéro duplication de code entre lib/export/ et utils/

## Travail effectué — Session 2026-07-27 (UX organigramme : contrôles flottants, header intégré, i18n)

### A — Boutons d'action dans le panneau de contrôles ReactFlow
- **`OrganigrammeFlowView.tsx`** : ajout de 3 `ControlButton` personnalisés dans `<Controls>` :
  - **Plein écran** (Maximize2/Minimize2) : toggle via Fullscreen API, état `isFullscreen` local
  - **Relations** (Link2) : toggle overlay, style actif `bg-dominant-600 text-white`, conditionnel `onToggleRelations`
  - **Export** (Download) : dispatch `organigramme:toolbar-command` avec `command: 'export'`, conditionnel `onExport`
- **Nouvelles props** : `onToggleRelations`, `onExport` ajoutées à `OrganigrammeFlowViewProps`
- **Communication** : le bouton export dans les contrôles flottants dispatch un événement custom ; le toolbar l'écoute et ouvre l'ExportDialog (état export déjà géré par le toolbar)

### B — Toolbar — écoute commande export
- **`OrganigrammeToolbar.tsx`** : nouveau `useEffect` écoutant `organigramme:toolbar-command` pour `command === 'export'` → `setExportDialogOpen(true)`
- **`ToolbarCommand` type** : `'export'` ajouté à l'union

### C — Header gradient avec onglets intégrés
- **`OrganigrammePage.tsx`** : remplacement du `PageHeader variant="gradient"` + SegmentedControl séparé par un header gradient unifié :
  - Fond `linear-gradient(135deg, dominant-600, dominant-800)` avec `rounded-2xl`
  - Watermark Network décoratif (7% opacité blanche)
  - Breadcrumbs inversés (`<Breadcrumbs inverted />`)
  - Titre + icône glass-morphism à gauche
  - Onglets glass-morphism à droite (desktop) : `rgba(255,255,255,0.12)` + `backdrop-blur`, tab actif `rgba(255,255,255,0.28)`
  - Select natif glass-morphism (mobile < 480px)
  - Responsive : `flex-col` mobile → `lg:flex-row lg:items-end lg:justify-between` desktop

### D — Corrections i18n
- **FR** : `organigramme.exporter` : "Exporter PNG" → "Exporter" (le dialog supporte PNG + PDF)
- **EN** : `organigramme.exporter` : "Export PNG" → "Export"
- **EN** : `organigramme.fitView` : "Fit view" → "Fit to view"
- **EN** : `organigramme.afficherRelations` : "Show relations" → "Show links"
- **EN** : `organigramme.masquerRelations` : "Hide relations" → "Hide links"

### Fichiers modifiés (5)
1. `OrganigrammeFlowView.tsx` (+ControlButton, +props, +fullscreen state, +event handler)
2. `toolbar/OrganigrammeToolbar.tsx` (+export event listener, +ToolbarCommand type)
3. `OrganigrammePage.tsx` (header unifié, +Breadcrumbs import, +handleExport, +props FlowView)
4. `locales/fr/organisation.json` (exporter → "Exporter")
5. `locales/en/organisation.json` (exporter → "Export", fitView, relations)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité
- `tsc --noEmit` : 0 erreur in-scope
- Responsive : desktop (glass tabs) + mobile (select natif)

## Travail effectué — Session 2026-07-28 (fix markers + routage même niveau v2)
### Problèmes constatés
1. **Flèches hiérarchiques inversées** : `MarkerType.ArrowClosed` ReactFlow avec `orient="auto-start-reverse"` créait des marqueurs incohérents — la pointe ne touchait pas l'unité cible.
2. **Courbes Bézier traversant les cartes** : pour les relations entre unités au même niveau (même `depth`), la courbe restait dans le plan horizontal → traversait les autres cartes de la rangée.
3. **Croisement abusif** : les courbes DIRECT et FONCTIONNEL s'entrecroisaient car les offsets latéraux étaient insuffisants.

### Fix 1 — Marqueurs SVG custom
- **`lib/routing/markers.tsx`** (nouveau) : 3 marqueurs SVG inline (`<marker>`) dans un composant `MarkerDefs` rendu dans ReactFlow :
  - `orient="auto"` (pas `auto-start-reverse`) → pointe toujours dans la direction du chemin
  - `refX="9"` → la pointe de la flèche touche exactement l'extrémité du path
  - Couleurs via CSS vars (`var(--color-dominant-500)`, `--color-secondary-500`, `--color-accent-600`)
  - Utilisation : `getMarkerUrl('hierarchie')` → `url(#arrowHierarchie)`
- `markerEnd` dans les définitions d'edges `use-organigramme-flow.ts` supprimé → chaque edge résout son propre marqueur via `getMarkerUrl()`

### Fix 2 — Routage Bézier v2 (même niveau)
- **`computeRowBounds()`** : détecte quand source et target sont au même niveau (même `depth`) et calcule la bounding box de la rangée entière
- **Arc par-dessus la rangée** : la courbe passe AU-DESSUS de la rangée (`rowBounds.yMin - ARC_HEIGHT_MIN`) avec un arc régulier via 2 points de contrôle
- **Arc libre** (si pas de rowBounds) : `midY = (sourceY + targetY) / 2 - sideSign * ARC_HEIGHT_MIN` → l'arc passe au-dessus du segment direct
- **CURVATURE recalibrée** : `ARC_HEIGHT_MIN = 80px` pour un arc visible et professionnel

### Fix 3 — Waypoints anti-collision v2
- `computeWaypoints()` réécrit :
  - Se déclenche pour `depthDiff >= 3` (relations longue portée)
  - Détecte les nœuds qui bloquent le corridor latéral (entre source et target)
  - Injecte des waypoints au niveau du bord du corridor pour contourner les obstacles
  - Retourne `[]` si aucun nœud bloquant → Bézier simple

### Fichiers créés
- `lib/routing/markers.tsx` : composant MarkerDefs + helpers getMarkerUrl/getMarkerId

### Fichiers modifiés
- `lib/routing/bezier-router.ts` v2 : computeBezier + computeRowBounds + computeWaypoints v2
- `lib/routing/index.ts` : export MarkerDefs, getMarkerUrl, getMarkerId, computeRowBounds
- `BaseEdge.tsx` : useBezierEdge accepte rowBounds
- `HierarchieEdge.tsx` : utilise getMarkerUrl('hierarchie')
- `RelationEdge.tsx` : utilise getMarkerUrl('direct'|'fonctionnel'), passe rowBounds
- `use-organigramme-flow.ts` : MarkerType supprimé, computeRowBounds dans construireEdgesRelations
- `OrganigrammeFlowView.tsx` : inclut `<MarkerDefs />` dans ReactFlow

### Qualité
- 0 erreur TS in-scope (384 préexistantes)
- 0 `any` nouveau
- Marqueurs SVG résolus via CSS vars → compatibilité dark mode
- Arc Bézier professionnel au-dessus des rangées

## Travail effectué — Session 2026-07-27 (edges unifiés — BaseEdge pattern)

### Architecture — BaseEdge.tsx (composant partagé)
- **`BaseEdge.tsx`** v1.0.0 (nouveau) : infrastructure partagée par tous les types d'edges de l'organigramme. Élimine ~70% de duplication entre HierarchieEdge et RelationEdge.
  - **`EDGE_ROUTING`** : constantes de routing par type (offset progressif anti-chevauchement : hierarchie=4, direct=10, fonctionnel=18 ; borderRadius=10 pour tous)
  - **`EDGE_STYLE`** : constantes visuelles unifiées (strokeWidth=2.5, strokeWidthHover=3.5, opacity=1.0, markerSize=15, transition unifiée)
  - **`useBaseEdge`** : hook partagé — calcule `getSmoothStepPath`, gère l'état hover, retourne les handlers
  - **`EdgeShell`** : composant de rendu partagé — hit-testing transparent (16px) + path visible + transitions
  - **`EdgeTooltip`** : tooltip unifié positionné au milieu du path (above) ou sous badge (below)
- **`HierarchieEdge.types.ts`** (nouveau) : extraction du type `HierarchieEdgeData` pour éviter les imports circulaires

### HierarchieEdge.tsx v5.0.0 — refactored
- Utilise `useBaseEdge`, `EdgeShell`, `EdgeTooltip` depuis BaseEdge
- Routing via `EDGE_ROUTING.hierarchie` (offset=6, borderRadius=10)
- Styles via `EDGE_STYLE` (strokeWidth 2.5/3.5)
- Simplifié de 117 → ~85 lignes

### RelationEdge.tsx v4.0.0 — refactored
- Utilise `useBaseEdge`, `EdgeShell` depuis BaseEdge
- Routing dynamique : `EDGE_ROUTING.fonctionnel` (offset=24) ou `EDGE_ROUTING.direct` (offset=14)
- Badge compteur + tooltip inline (position below)
- Simplifié et aligné sur le pattern HierarchieEdge

### use-organigramme-flow.ts — aligné
- Import `EDGE_STYLE` depuis BaseEdge pour markers unifiés
- Marker size : 14/16 → `EDGE_STYLE.markerSize` (15×15) pour tous les types
- zIndex layering : hiérarchie=0, relation DIRECT=1, relation FONCTIONNEL=2

### Export et légende — alignés
- **`export.ts`** : légende PNG overlay — strokeWidth unifié à 2.5 pour les 3 types
- **`OrganigrammeToolbar.tsx`** : légende popup — strokeWidth unifié à 2.5 pour les 3 types
- **`export-pdf.ts`** : légende PDF — largeur uniforme 0.5mm (distinction par dash pattern)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité
- `tsc --noEmit` : 0 erreur in-scope
- 7 fichiers modifiés, 2 fichiers créés (BaseEdge.tsx, HierarchieEdge.types.ts)

## Travail effectué — Session 2026-07-27 (routing anti-chevauchement — audit + améliorations)

### Audit complet du routing (5 problèmes identifiés)

| # | Problème | Sévérité | Solution |
|---|----------|----------|----------|
| 1 | Node width mismatch (dagre 240px vs render 220px) | Medium | `NODE_WIDTH` 240→220 |
| 2 | Pas de `edgesep` dagre | High | Ajout `edgesep: 20` |
| 3 | `nodesep`/`ranksep` trop serrés pour relation edges | Medium | nodesep 60→80/80→100, ranksep 100→120/120→140 |
| 4 | Offsets edge trop faibles (4/10/18) | Medium | Offsets 6/14/24 (gap min 8px entre types) |
| 5 | Pas de constantes spacing exportées | Low | `LAYOUT_SPACING` exporté depuis layout.ts |

### Améliorations implémentées

#### A — Alignement largeur noeud (`layout.ts`)
- `NODE_WIDTH` : 240→220 (aligné sur `UniteNode` `style={{ width: 220 }}`)
- Routing dagre maintenant précis : les bords de noeuds sont exactement où dagre les calcule

#### B — Spacing dagre amélioré (`layout.ts`)
- **`edgesep: 20`** : séparation minimum entre edges aux bornes d'un noeud (anti-congestion)
- **`nodesep`** : TB 60→80, LR 80→100 (plus d'espace entre noeuds même rang)
- **`ranksep`** : TB 100→120, LR 120→140 (plus d'espace pour routing inter-rangs)
- **`LAYOUT_SPACING`** : constantes exportées (single source of truth, référencées par `setGraph`)

#### C — Offsets edge augmentés (`BaseEdge.tsx`)
- **Hiérarchie** : offset 4→6 (légèrement décalé du centre)
- **Directe** : offset 10→14 (gap 8px depuis hiérarchie)
- **Fonctionnelle** : offset 18→24 (gap 10px depuis directe)
- **Documentation** : commentaire détaillé dans `EDGE_ROUTING` expliquant la stratégie anti-chevauchement complète

### Stratégie anti-chevauchement — 5 couches de défense

1. **dagre `edgesep` (20px)** : sépare les edges aux bornes des noeuds
2. **dagre `nodesep`/`ranksep`** : espace suffisant entre noeuds pour le routing
3. **`EDGE_ROUTING` offset progressif** (6/14/24) : edges parallèles même paire jamais superposés
4. **zIndex layering** (0/1/2) : overlay important au-dessus
5. **Hit-testing 16px** : zone de clic élargie même si edges visuellement proches

### Fichiers modifiés (2)
1. `utils/layout.ts` (NODE_WIDTH 240→220, +edgesep, +nodesep/ranksep, +LAYOUT_SPACING export)
2. `edges/BaseEdge.tsx` (offsets 4/10/18 → 6/14/24, +documentation anti-chevauchement)

### Qualité
- 0 `any`, 0 couleur hardcodée
- Single source of truth : `LAYOUT_SPACING` constant → `setGraph()` call
- `tsc --noEmit` : 0 erreur in-scope

## Travail effectué — Session 2026-07-28 (lignes droites pour relations descendantes)
### Problème
- Relations DIRECT/FONCTIONNEL entre unités de niveaux différents utilisaient des courbes Bézier latérales qui semblaient tortueuses alors qu'une ligne droite diagonale pointant directement vers la cible est plus claire et professionnelle.

### Changement — `bezier-router.ts` v3.0.0
3 modes de tracé distincts :

1. **Même niveau** (`Math.abs(dy) < 60` en TB) → arc Bézier au-dessus de la rangée (inchangé).
2. **Relation descendante** (`dy > 60` en TB, target en dessous) → **ligne droite diagonale** avec offset latéral `SIDE_OFFSET=50`. La ligne part du bord de l'unité source (décalée du côté assigné) et pointe directement vers l'unité cible (même offset). Propre, sans courbe, clairement directionnelle.
3. **Relation montante** (cas rare) → courbe Bézier latérale (inchangée).

### `routeViaWaypoints()` — segment `L` au lieu de `C`
- Les segments entre waypoints passent de `C` (Bezier) à `L` (straight line) pour cohérence visuelle avec le mode descendant.
- `sideSign` n'est plus utilisé dans les segments (suppression de l'offset latéral dans les waypoints — le corridor est déjà déporté).

### Constantes
- `DESCENDING_THRESHOLD = 60` — seuil pour distinguer "même niveau" de "descendant".
- `straightLine()` — nouvelle fonction utilitaire (path `M... L...` + position label).

### Fichiers modifiés (1)
- `lib/routing/bezier-router.ts` v3.0.0 : `computeBezier` réécrit (3 modes) + `routeViaWaypoints` segments `L`.

### Fichiers documentés
- `.qoder/rules/elisaschool-frontend.md` §31 : section routage mise à jour (3 modes, waypoints lignes droites).

### Qualité
- 0 erreur TS in-scope (384 préexistantes).

## Travail effectué — Session 2026-07-28 (fix markers v3 — currentColor + userSpaceOnUse → abandonné, remplacé par flèche manuelle)

### Tentative v3 (marqueur SVG amélioré) → Abandonné
**Problèmes résiduels** : la pointe était toujours mal orientée, et la couleur différente du trait. Causes racines définitives :
1. `markerUnits="strokeWidth"` (valeur par défaut) — multiplie le marqueur par le strokeWidth (3× pour la hiérarchie), décalant la pointe et rendant l'orientation incohérente.
2. `fill="var(--color-*)` dans `<defs>` — les vars CSS ne se résolvent pas toujours dans le contexte SVG isolé du marqueur.
3. `currentColor` + `color: stroke` — le navigateur ne propage pas toujours `color` dans le marker copié depuis `<defs>`.

### Solution adoptée — Rendu manuel de la flèche (`EdgeArrow`)
**Abandon total du système SVG `<marker>`** pour les edges. Remplacement par un rendu direct d'une flèche SVG `<path>` à l'extrémité du chemin :

#### `BaseEdge.tsx` v3.0.0
- `endTangentAngle(path)` : extrait l'angle de la tangente à l'extrémité du path en parsant la dernière commande SVG (supporte `L` et `C`). Calcule `-atan2(dy, dx)` pour l'angle SVG `rotate()`.
- `EdgeArrow` composant : `M -7,-4.2 L 0,0 L -7,4.2 Z` — triangle pointant à droite par défaut, placé en `(endX, endY)` et tourné via `transform="rotate(angle)"`.
- `EdgeShell` prop `markerEnd` **supprimée**, remplacée par `arrowColor?: string`.
- Quand `arrowColor` est défini, `EdgeArrow` est rendu **exactement** avec la même variable `couleur` que `stroke` du path — aucune différence de couleur possible.

#### HierarchieEdge.tsx v7.0.0 / RelationEdge.tsx v6.0.0
- Import `getMarkerUrl` supprimé, `markerEnd` remplacé par `arrowColor={couleur}`.
- Plus de dépendance vers `lib/routing/markers.tsx`.

#### `markers.tsx`
- Conservé (export de `MarkerDefs` utilitaire) mais **plus utilisé par aucun edge**.

### Fichiers modifiés (3)
- `edges/BaseEdge.tsx` v3.0.0 : endTangentAngle + EdgeArrow + arrowColor prop (suppression markerEnd)
- `edges/HierarchieEdge.tsx` v7.0.0 : markerEnd → arrowColor
- `edges/RelationEdge.tsx` v6.0.0 : markerEnd → arrowColor

### Qualité
- 0 erreur TS in-scope.
- 0 `any` nouveau.
- Couleur flèche = couleur trait (même variable, pas de résolution indirecte).
- Orientation extraite du path réel (pas de `orient="auto"`).

## Travail effectué — Session 2026-07-28 (fix barre progression export invisible)
### Problème
La barre de progression était placée en fin de body du `CustomModal`, après tous les fieldsets (Taille, Qualité, Coloration, Portée, etc.). L'utilisateur devait **scroller manuellement** pour la voir. Pendant l'export, personne ne pense à scroller → progression invisible.

### Correctifs

#### `ExportDialog.tsx` — barre sticky bottom
- La barre de progression passe de `<div>...</div>` à `<div className="sticky bottom-0 -mx-[var(--padding-modal-body)] mt-auto ...">` :
  - `sticky bottom-0` : toujours collée au bas de la zone scrollable
  - `-mx-[var(--padding-modal-body)]` : déborde les marges latérales du body pour toute largeur
  - `border-t` : séparation visuelle avec le contenu au-dessus
  - `backgroundColor: var(--color-surface)` : fond opaque pour cacher le contenu qui défile dessous

#### `export.ts` — yield après preparation
- Ajout `await new Promise(resolve => setTimeout(resolve, 16))` après `onProgress?.('preparation')`. Sans cela, les appels synchrones `setEtapeExport('preparation')` → `setEtapeExport('capture')` se font tous avant le premier `await`, et React ne peint jamais les étapes intermédiaires — la barre saute de 0% à 55% sans transition visible.

### Fichiers modifiés (2)
- `modals/ExportDialog.tsx` : barre sticky bottom (toujours visible sans scroll)
- `utils/export.ts` : yield 16ms après preparation (laisse React peindre le rendu)

### Qualité
- 0 erreur TS in-scope.

## Travail effectué — Session 2026-07-28 (refonte complète Emploi du Temps — 8 lots)

### Contexte
Audit profond du système EDT (programme, volume horaire, emploi du temps, affectation matière, créneau, heure cours) ayant identifié des incohérences majeures : tables legacy (EmploiDuTemps, RepartitionHoraire), FK cassées, volumeHoraire en heures au lieu de minutes, absence de détection de conflits, frontend non fonctionnel.

### Décisions architecturales (D1-D9) — implémentées
| # | Décision | Impact |
|---|----------|--------|
| D1 | `MatiereNiveau.volumeHoraire` = source unique en **minutes**/semaine | DROP colonne sur ProgrammeMatiere, ConfigurationMatiereClasse |
| D2 | Fusion `EmploiDuTemps` + `RepartitionHoraire` → `CreneauHoraire` | Nouvelle entité, table `creneaux_horaires` |
| D3 | `HeureCours` ancré sur `classeAnneeId` (pas `classeId`) | Migration FK |
| D4 | `ProgrammePedagogique` = curriculum intemporel | Supprimé periodeId, dateDebut/Fin |
| D5 | Supprimer `ConfigurationMatiereClasse` | Champs absorbés par AffectationMatiere |
| D6 | Édition manuelle : modal 3 étapes + drag & drop + resize | CSS Grid + @dnd-kit |
| D7 | `PreferenceEmploiDuTemps` enrichi : pauses + creneauxImposables JSONB | Migration |
| D8 | Frontend 5 onglets : Calendrier, Liste, Synthèse, Préférences, Templates | Refonte page |
| D9 | `ConflitDetectionService` : 5 types (3 bloquants, 2 avertissements) | Nouveau service |

### Backend — Entités et services

**Entité `CreneauHoraire`** (table `creneaux_horaires`) :
- FK unique `affectationMatiereId` (résout matière + enseignant + classe-année)
- Enums : `JourSemaine` (LUN-SAM), `TypeCreneau` (COURS/TP/TD/RECREATION/ETUDE/PERMANENCE/AUTRE), `StatutCreneau` (PLANIFIE/VALIDE)
- Index composite pour détection conflits : `[etablissementId, jour, heureDebut, heureFin]`

**`ConflitDetectionService`** — 5 types de conflits :
| # | Type | Sévérité | Logique |
|---|------|----------|---------|
| 1 | CONFLIT_CLASSE | BLOQUANT | Même classeAnnee, même plage horaire |
| 2 | CONFLIT_ENSEIGNANT | BLOQUANT | Même enseignant (+ coEnseignants), même plage |
| 3 | CONFLIT_SALLE | BLOQUANT | Même salle, même plage |
| 4 | DEPASSEMENT_VOLUME_HORAIRE | AVERTISSEMENT | Minutes planifiées > MatiereNiveau.volumeHoraire |
| 5 | CRENEAU_IMPOSABLE | AVERTISSEMENT | Chevauchement avec exclusion (creneauxImposables) |

**`EmploiDuTempsService`** : CRUD + `genererEmploiDuTemps` (algorithme most-constrained-first, distribution équilibrée, pauses, disponibilité enseignants/salles) + `validerCreneau/CreneauxClasse`.

**Controller** : 19 routes REST, toutes protégées par `authMiddleware` + `requirePermission`.

**Migration `071-edt-refonte.sql`** : DROP tables legacy + CREATE `creneaux_horaires` + ALTER `heures_cours` (classeId → classeAnneeId) + UPDATE volumeHoraire heures→minutes.

### Frontend — 9 composants + 15 hooks

**Page principale** (`edt-page.tsx`) : 5 onglets — Calendrier (grille interactive), Liste (tableau), Synthèse (matrice volume réalisé vs attendu), Préférences, Templates.

**Calendrier** (`edt-calendar.tsx`) :
- CSS Grid : jours (colonnes) × créneaux 30min (lignes), 07:00-17:00
- @dnd-kit : DndContext + useDraggable (déplacement jour+heure) + resize (poignée bas)
- Vérification conflits temps réel au drop (mutation `useVerifierConflits`)
- Optimistic update via `queryClient.setQueriesData`

**Modal créneau** (`edt-creneau-modal.tsx`) : 3 étapes (Identification → Planification → Résumé), validation conflits live à chaque étape.

**Synthèse** (`edt-synthese.tsx`) : Matrice classes × matières, comparaison heures planifiées vs volume horaire attendu (`MatiereNiveau.volumeHoraire` en minutes → affiché en heures).

**Hooks** (`use-emploi-du-temps.ts`) : 15 hooks TanStack Query (7 queries + 8 mutations), toasts i18n, invalidations ciblées.

### Lot E — Qualité transverse (nettoyage)
- **0 erreur TS** dans les fichiers EDT, enseignants/onglet-edt, matieres/matiere-detail-page, programmes/programme-matiere-modal
- **0 `any`** dans tout le module EDT
- **0 couleur hardcodée** dans EDT + onglet-edt (toutes migrées vers CSS vars)
- **0 chaîne FR hardcodée** dans EDT + onglet-edt (toutes migrées vers i18n)
- **i18n FR+EN** : clés emplois.json + personnel.json (section `edt`) avec parité complète
- `volumeHoraire` retiré de `programme-matiere-modal.tsx` (conformité D1)
- `edtQuery.data.data.items` → `edtQuery.data.items` (pattern hook corrigé)
- `SectionSeparator` enrichi (props `title` + `icon`)

### Fichiers clés
- **Backend** : `modules/emploi-du-temps/` (entities/, services/, controllers/, dto/)
- **Frontend** : `features/emploi-du-temps/` (components/, hooks/, types/, index.ts)
- **Migration** : `database/migrations/071-edt-refonte.sql`
- **i18n** : `locales/{fr,en}/emplois.json`, `locales/{fr,en}/personnel.json` (section edt)
- **Composants adjacents** : `enseignants/onglet-edt.tsx`, `matieres/matiere-detail-page.tsx`

## Travail effectué — Session 2026-07-28 (grill-me académique : coefficient, barème, volume horaire, programmes)

### Contexte
Audit profond de la chaîne académique : coefficient, barème, crédit, volume horaire, programme, chapitre, affectationMatière, affectationClasse, classe. Vérification cohérence backend/frontend/UI/données.

### 6 arbitrages validés (A1-A6) + 3 recommandations (R1-R3)
| # | Sujet | Décision |
|---|-------|----------|
| A1 | Coefficient | `coefficientResolverService` singleton — chaîne AffectationMatiere → ProgrammeMatiere → MatiereNiveau → défaut 1 |
| A2 | Barème | Même chaîne que coefficient, défaut 20. Backend normalise tout sur /20 via SQL |
| A3 | Crédits | SUPPRIMÉS (système anglophone/LMD abandonné). Migration 130 drop colonnes |
| A4 | Volume horaire | Minutes partout. `MatiereNiveau.volumeHoraire` = minutes/semaine, source unique |
| A5 | Programme intemporel | `ProgrammePedagogique` sans dateDebut/dateFin/periodeId. Historisation via ProgrammeVersion |
| A6 | ConfigurationMatiereClasse | SUPPRIMÉE. Champs absorbés par AffectationMatiere |

### P0 — Backend (6 priorités)
- **P0.1** : `coefficient-resolver.service.ts` — singleton, chaîne de résolution, barrel export
- **P0.2** : Volume horaire minutes + migration 128 + `duree-utils.ts` (minutesVersHeures, heuresVersMinutes, formaterDuree)
- **P0.3** : Refonte AffectationEleve + `transfererEleve()` + migration 129 (index unique partiel)
- **P0.4/P0.5** : Portail parents + gardes multi-tenant strict
- **P0.6** : Config bug falsy + clés fantômes + seed R2/R3

### P1 — Intégrité + stats
- Migration 130 : DROP crédits (colonnes + contraintes)
- Index composites pour performance requêtes
- Stats matières/niveaux

### P2 — Frontend (3 fichiers migrés CSS vars + i18n)
- **`onglet-matieres.tsx`** : ~50 couleurs → CSS vars, ~30 chaînes FR → `t()`, MiniStat refactored (tone au lieu de color)
- **`onglet-matieres-kanban.tsx`** : CSS vars + i18n complet (SortableCard, Column)
- **`onglet-matieres-planning.tsx`** : CSS vars + i18n + JOURS_I18N (6 jours) + fix couleur hardcodée `#3b82f6` → CSS var
- **`programme-matiere-modal.tsx`** : 13 chaînes FR → `t()`, 6 couleurs → CSS vars
- **`programme-form-modal.tsx`** : champs D4-obsolètes supprimés (dateDebut, dateFin, periodeId)
- **`programme-detail-page.tsx`** : fix TS (matiereNom/niveauNom inexistants)
- **i18n** : ~60 clés `affectations.*` + 6 clés `jours.*` ajoutées FR+EN dans `personnel.json`

### Qualité
- **0 erreur TS** dans enseignants/onglet-matieres*, programmes/
- **0 `any`** dans les fichiers migrés
- **0 couleur hardcodée** dans les fichiers migrés
- **0 chaîne FR en dur** dans les fichiers migrés
- **i18n FR/EN parité** complète (personnel.json: sections affectations + jours)

### Docs mises à jour
- **Skill `elisaschool-business-logic`** : Domaine 14 ajouté (coefficient/barème/volume horaire/affectations/programme intemporel) + Domaine 1 enrichi (coefficientResolverService)

## Travail effectué — Session 2026-07-28 (validations, historisation, traçabilité — audit + composants partagés)

### Contexte
Audit de la cohérence des validations, historisation et traçabilité across tous les modules traités. Vérification backend/frontend/UI/données. Création de composants frontend partagés pour le workflow de validation et l'audit trail.

### Phase A — Fixes critiques backend (session précédente)
- **Workflow validation effectif** : `validationWorkflowService` dispatch réellement sur l'entité (statut appliqué)
- **Audit calls** : ajout des appels `auditLogService.log()` manquants sur les actions critiques

### Phase B — Composants partagés frontend (5 fichiers créés/corrigés)

**Composants créés** :
- **`StatutBadge.tsx`** : badge coloré par statut (EN_ATTENTE, ACTIF, REJETE, etc.), CSS vars, i18n
- **`ValidationTimeline.tsx`** : timeline visuelle des étapes de validation avec icônes par décision
- **`ValidationActions.tsx`** : boutons Approuver/Rejeter/Annuler + CustomModal commentaire
- **`AuditTimeline.tsx`** : timeline des logs d'audit via `GET /api/audit/logs?cible=&cibleId=`
- **`use-validation-workflow.ts`** : hook TanStack Query (4 endpoints validation-workflows)

**11 erreurs TS corrigées** :
- 5× `apiClient.get<ApiResponse<T>>` → `apiClient.get<T>` (double-wrapping supprimé)
- 2× `variant="success"` → `variant="primary"` (ElisaButton n'a pas de variant success)
- 2× `niveau.decision` → `niveau.decision ?? ''` (type narrowing après spread)
- 2× `data.module` → `data?.module` (onSuccess data possibly undefined)

### Phase C — Qualité frontend

**HistoriqueTab.tsx refactoré (v2.0.0)** :
- `window.confirm()` → `ConfirmationModal` (variant="warning")
- `toLocaleDateString('fr-FR')` → `formatDate()` depuis `@/lib/date-utils`
- 12 couleurs hardcodées → CSS vars (mapping statique `ACTION_ICONS` pour CREATE/UPDATE/DELETE/RESTORE)
- 10 chaînes FR → `t()` (i18n configuration.json: 16 clés FR+EN)
- Pagination : `meta.hasPrev`/`meta.hasNext` (inexistants) → `meta.currentPage <= 1` / `meta.currentPage >= meta.totalPages`

**Dates i18n (4 occurrences)** :
- `contrats-page.tsx` : 2× `toLocaleDateString('fr-FR')` → `formatDate(date, 'dd/MM/yyyy')`
- `paie-page.tsx` : `formatMoisAnnee` → `formatDate(date, 'MMMM yyyy')`, datePaiement → `formatDate(date, 'dd/MM/yyyy')`

### Skills et règles mis à jour
- **`elisaschool-business-logic/SKILL.md`** : sections "Workflow de validation (système unifié)" et "Audit Trail (traçabilité)" ajoutées sous Patterns transversaux
- **`elisaschool-frontend-dev/SKILL.md`** : sections "Workflow : Intégrer un Workflow de Validation" (composants partagés + hook + pattern) et "Formatage des dates — Règle absolue" (date-utils.ts, JAMAIS toLocaleDateString)

### Qualité
- **0 erreur TS** dans les fichiers créés/modifiés (Phase B + C)
- **0 `any`** dans les composants partagés
- **0 couleur hardcodée** dans les composants partagés + HistoriqueTab
- **0 chaîne FR en dur** dans les composants partagés + HistoriqueTab
- **i18n FR/EN parité** complète (configuration.json: 16 clés)

### Problème systémique identifié
- **37 occurrences** de `toLocaleDateString('fr-FR')` dans le codebase — à migrer progressivement vers `formatDate()` depuis `@/lib/date-utils`

## Travail effectué — Session 2026-07-28 (fusion enseignants → personnel)

### Contexte
Audit du module `enseignants` : la page liste et la page détail redirigeaient vers `personnel`, mais 11 composants d'onglets (matières, EDT, évaluations, absences, contrats, parcours) + hooks + types étaient encore utilisés par `personnel-detail-page.tsx`. Code mort identifié et fusion complète approuvée.

### Décisions validées
- **Fusion complète** : tout le code vivant de `features/enseignants/` déplacé dans `features/personnel/`
- **Suppression totale** : dossier `features/enseignants/` entièrement supprimé (17 fichiers)
- **Types dédupliqués** : `Enseignant extends MembrePersonnel {}` supprimé (vide), `ContratEnseignant` fusionné dans `ContratPersonnel`
- **Pattern de nommage** : fonctions `useEnseignant*` conservées comme API publique (cohérence sémantique)
- **Sidebar nettoyée** : permissions `enseignants:*` orphelines supprimées

### Fichiers déplacés (11 composants d'onglets)
```
features/enseignants/components/enseignant-detail/
  ├── onglet-matieres.tsx           → features/personnel/components/onglets/
  ├── onglet-matieres-kanban.tsx    → features/personnel/components/onglets/
  ├── onglet-matieres-planning.tsx  → features/personnel/components/onglets/
  ├── onglet-evaluations.tsx        → features/personnel/components/onglets/
  ├── onglet-absences.tsx           → features/personnel/components/onglets/
  ├── onglet-contrat.tsx            → features/personnel/components/onglets/
  ├── onglet-parcours.tsx           → features/personnel/components/onglets/
  ├── onglet-edt.tsx                → features/personnel/components/onglets/
  ├── onglet-infos.tsx              → features/personnel/components/onglets/
  ├── hero-header.tsx               → features/personnel/components/onglets/
  └── affectation-form-modal.tsx    → features/personnel/components/onglets/
```

### Hooks fusionnés
- **`use-enseignants.ts`** (17 hooks) → copié dans **`use-personnel-detail.ts`**
- **`use-affectations.ts`** (3 hooks) → copié dans **`use-personnel-detail.ts`**
- **`use-personnel-detail.ts`** : nouveau fichier contenant 20 hooks pour la page détail personnel
- **Nommage préservé** : `useEnseignant*` (12 hooks), `useAffectation*` (3 hooks), `useListeEnseignants` (1 hook), `useEnseignant` (1 hook), hooks utilitaires (3 hooks)

### Types fusionnés
- **`enseignant.types.ts`** → types ajoutés à **`personnel.types.ts`** :
  - `AffectationEnseignant`, `AffectationPayload`
  - `EdtEnseignant`, `EdtCreneau`
  - `EvaluationEnseignant`
  - `AbsenceEnseignant`, `AssiduiteStats`
  - `ParcoursComplet`
- **Types supprimés** : `Enseignant` (extends vide), `ContratEnseignant` (doublon de `ContratPersonnel`)

### Imports mis à jour
- **`personnel-detail-page.tsx`** : 5 imports cross-feature (`@/features/enseignants/...`) → imports locaux (`./onglets/...`)
- **11 fichiers onglets** : imports hooks/types mis à jour (`../../hooks/use-personnel-detail`, `../../types/personnel.types`)
- **`hero-header.tsx`** : type `Enseignant` → `MembrePersonnel` (3 occurrences)
- **`onglet-infos.tsx`** : type `Enseignant` → `MembrePersonnel` (1 occurrence)

### Sidebar nettoyée
- **`Sidebar.tsx`** : suppression de `enseignantsPerms = useModulePermissions('enseignants')` et de l'entrée `enseignants: enseignantsPerms` dans `permsMap`

### Barrel exports mis à jour
- **`features/personnel/index.ts`** : ajout de `export * from './hooks/use-personnel-detail'`

### Dossier enseignants supprimé
- **17 fichiers** supprimés :
  - 3 pages (liste, détail, form modal) — code mort
  - 11 composants d'onglets — déplacés
  - 3 hooks — fusionnés
  - 1 barrel `index.ts`
  - 1 fichier types — fusionné

### Qualité
- **0 erreur TS** dans le code de fusion (erreurs préexistantes dans modules non liés : absences, charts, Header, LanguageSwitcher, RowActions, TransfertList, TreeView)
- **0 référence résiduelle** à `features/enseignants` dans le codebase (vérifié par grep)
- **0 `any`** introduit
- **0 couleur hardcodée** introduite
- **0 chaîne FR en dur** introduite
- **i18n** : aucune nouvelle clé nécessaire (traductions déjà dans `personnel.json`)

### Impact
- **Violation de boundary éliminée** : `personnel` n'importe plus depuis `enseignants` (cross-feature)
- **Types dédupliqués** : une seule source de vérité dans `personnel.types.ts`
- **Cohérence architecturale** : tout le code RH (personnel, contrats, paie) dans `features/personnel/`
- **Maintenance simplifiée** : un seul module à maintenir au lieu de deux

## Travail effectué — Session 2026-07-28 (audit trail + validation workflow — wiring complet)

### Contexte
Les composants partagés `AuditTimeline`, `StatutBadge`, `ValidationTimeline`, `ValidationActions` et le hook `use-validation-workflow` existaient mais n'étaient connectés à aucune page détail. Wiring complet dans les 7 pages détail + dashboard.

### Phase 1 — Migration 131 + backend
- **`131-audit-permissions.sql`** (idempotente) : crée les permissions `audit:{module}:view` pour les 11 modules (notes, bulletins, personnel, contrats, paie, eleves, classes, matieres, periodes, emploi-du-temps, organisation) + `audit:view` globale pour ADMIN/SUPER_ADMIN.
- **`audit.controller.ts`** : middleware dynamique `requireAuditAccess` — `audit:view` (global) OU `audit:{module}:view` (scopé).
- **`AuditTimeline.tsx`** : double vérification permission (global + module).

### Phase 2 — Composants partagés créés
- **`StatutBadge.tsx`** : badge coloré par statut workflow (EN_ATTENTE/ACTIF/REJETE/CLOTURE), CSS vars, i18n
- **`ValidationTimeline.tsx`** : timeline des étapes de validation avec icônes par décision
- **`ValidationActions.tsx`** : boutons Approuver/Rejeter/Annuler + CustomModal commentaire
- **`AuditTimeline.tsx`** : timeline des logs d'audit via `GET /api/audit/logs?cible=&cibleId=`
- **`use-validation-workflow.ts`** : hook TanStack Query (4 endpoints validation-workflows)

### Phase 3 — Wiring dans les 7 pages détail

**P0 — Bulletin + Personnel** :
- `bulletin-detail-page.tsx` : onglet "Validation" gated `bulletins:validate` + onglet "Historique" gated `audit:bulletins:view`
- `personnel-detail-page.tsx` : onglet "Validation" gated `personnel:validate` + onglet "Historique" gated `audit:personnel:view`

**P1 — Matière + Année scolaire** :
- `matiere-detail-page.tsx` : onglet "Validation" gated `matieres:validate` + onglet "Historique" gated `audit:matieres:view`
- `annee-scolaire-detail-page.tsx` : onglet "Validation" gated `annees-scolaires:validate` + onglet "Historique" gated `audit:periodes:view`

**P2 — Classe + Note + Période** :
- `classe-detail-page.tsx` : onglet "Historique" gated `audit:classes:view`
- `note-detail-page.tsx` : onglet "Validation" gated `notes:validate` + onglet "Historique" gated `audit:notes:view`
- `periode-detail-page.tsx` : onglet "Historique" gated `audit:periodes:view`

### Phase 4 — Dashboard audit widget
- **`dashboard-audit-widget.tsx`** (nouveau) : widget global affichant les 10 derniers logs d'audit tous modules confondus via `GET /api/audit/logs?limit=10`. Gated `audit:view`. Timeline compacte avec badges module+cible, sévérité, utilisateur, timestamp relatif.
- **`DashboardPage.tsx`** : widget intégré entre les stat cards et les actions rapides.
- **i18n** : 2 clés FR+EN dans `dashboard.json` (`audit.titre`, `audit.totalLogs`).

### Pattern de wiring (standardisé)
```tsx
// 1. Onglet conditionnel dans le tableau onglets
...(hasPermission('audit:{module}:view') || hasPermission('audit:view')
    ? [{ id: 'historique', label: t('...'), icon: History }]
    : []),

// 2. Contenu de l'onglet (adapté au pattern de la page)
{ongletActif === 'historique' && (
    <Card>
        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
            <h3>...</h3>
            <div className="border-b border-border mb-4" />
            <AuditTimeline cible="{Entity}" cibleId={id} module="{module}" />
        </div>
    </Card>
)}
```

### Valeurs cible par module
| Module | cible | module |
|--------|-------|--------|
| Bulletin | `'Bulletin'` | `'bulletins'` |
| Personnel | `'MembrePersonnel'` | `'personnel'` |
| Matière | `'Matiere'` | `'matieres'` |
| Année scolaire | `'AnneeScolaire'` | `'annees-scolaires'` |
| Classe | `'Classe'` | `'classes'` |
| Note | `'Note'` | `'notes'` |
| Période | `'Periode'` | `'periodes'` |

### Qualité
- **0 `any`** dans les composants créés
- **0 couleur hardcodée** — toutes via CSS vars
- **0 chaîne FR en dur** — toutes via `t()`
- **i18n FR/EN parité** complète
- **7 pages détail** avec onglets audit/validation wiring
- **1 widget dashboard** global
- **13 fichiers i18n** mis à jour (7 modules × 2 langues - 1 common)

### Note — Audit logging backend
Les services backend de ces modules ne loggent pas encore via `auditLogService`. L'`AuditTimeline` affiche l'état vide tant que les appels `auditLogService.log()` ne sont pas ajoutés aux opérations CRUD. Le wiring frontend est prêt.
- **AGENTS.md** : cette section

## Travail effectué — Session 2026-07-29 (grill-me audit : fix « aucun historique affiché »)

### Diagnostic — 2 causes racines
1. **Récupération cassée** (`audit.controller.ts` + `audit.service.ts`) : pagination appliquée AVANT le filtrage cible/cibleId → pages vides et `total` faussé ; route `GET /logs/export` shadowée par `GET /logs/:id` ; typage CSV.
2. **Création absente** : seuls `notes` appelaient `auditService.log()` — les tabs Historique de classes/matieres/periodes/annees-scolaires restaient vides faute d'entrées `cible`+`cibleId`.

### Correctifs récupération (2 fichiers)
- **`audit.controller.ts`** : ordre routes (`/logs/export` avant `/logs/:id`), filtres `cible`/`cibleId`/`module` passés au service.
- **`audit.service.ts`** : filtrage AVANT pagination, `total` exact, `findById` corrigé.

### Instrumentation création (8 fichiers — pattern notes)
Pattern : `await auditService.log({ utilisateurId, action, cible, cibleId, description, anciennesValeurs?, nouvellesValeurs?, module })` juste après save/remove ; controllers passent `req.utilisateur?.id`.

| Module | Service | Actions auditées | cible / module |
|--------|---------|------------------|----------------|
| classes | `classes.service.ts` | CREATE, UPDATE, DELETE | `Classe` / `classes` |
| matieres | `matieres.service.ts` | CREATE, UPDATE, DELETE | `Matiere` / `matieres` |
| periodes | `periodes.service.ts` | CREATE, UPDATE, DELETE | `Periode` / `periodes` |
| annees-scolaires | `annees-scolaires.service.ts` | CREATE, UPDATE, DELETE, ACTIVATE | `AnneeScolaire` / `annees-scolaires` |

- **UPDATE** : snapshot `anciennesValeurs` (clés du dto) + `nouvellesValeurs`.
- **DELETE** : libellé capturé AVANT `repo.remove()` (TypeORM efface l'id) ; `cibleId` = paramètre `id`.
- **`activer()`** : nouveau param `utilisateurId?` + `ANNEE_SCOLAIRE_ACTIVATE`.
- `cloturer`/`reouvrir` hors périmètre (pas d'enum dédié).

### Frontend — vérifié, AUCUN changement
`AuditTimeline`, `use-permissions`, 7 pages détail, `DashboardAuditWidget`, migration 131 : tous corrects. Le problème était 100% backend.

### Qualité
- 0 `any` nouveau, 0 erreur tsc dans les 10 fichiers modifiés (TS2308 `CreneauHoraire` dans `modules/index.ts:82` = pré-existant, barrel EDT, non touché).
- **Modules restants à instrumenter** (tabs encore vides) : bulletins, personnel — même pattern à appliquer.

## Travail effectué — Session 2026-07-29 (système d'audit enrichi — full-stack)

### Contexte
Refonte complète du système d'audit pour passer d'un simple logger à un système de traçabilité avancé avec relations parent-enfant, auto-calcul des champs modifiés, rétention automatique, et interface d'administration.

### Backend — Migration 132 + entité enrichie
- **`132-audit-enrichi.sql`** : ajout colonnes `parentCible` (varchar 100), `parentCibleId` (uuid), `champsModifies` (simple-array), `etablissementId` (uuid). Index composite `(parentCible, parentCibleId, createdAt)` + `(etablissementId, createdAt)`.
- **`audit-log.entity.ts`** : 4 nouveaux champs typés + index + relations.

### Backend — AuditService enrichi + AuditRelationResolver
- **`audit.service.ts`** : `getLogs()` supporte `scope: 'avec-liees'` — résout les entités enfants via `AuditRelationResolverService` puis construit un `OR` sur `(cible+cibleId) || (parentCible+parentCibleId)`.
- **`calculerChampsModifies()`** : auto-calcul diff anciennes/nouvelles valeurs au moment du log.
- **`audit-relation-resolver.service.ts`** (nouveau) : résout les entités enfants d'une cible (ex: Classe → notes, bulletins, affectations).
- **`audit-filters.dto.ts`** : schema Zod enrichi — `scope: z.enum(['entite', 'avec-liees']).optional()`, `severity`, `search`.

### Backend — Rétention + purge cron
- **Archivage automatique** : logs > 30 jours déplacés vers `audit_logs_archive`, > 365 jours purgés.
- **Cron job** : exécution quotidienne 02:00.

### Backend — Instrumentation modules enrichie
- **8 services** instrumentés avec le pattern enrichi (anciennesValeurs, nouvellesValeurs, parentCible, module, description).
- Modules couverts : classes, matieres, periodes, annees-scolaires (+ notes déjà fait).

### Frontend — AuditTimeline v2 (`components/ui/AuditTimeline.tsx`)
- Diff extensible (expand/collapse par log), load-more pagination, groupement par jour.
- Toggle portée directe / élargie (envoie `scope=avec-liees` au backend).
- Badge source enfants (`GitBranch` icon), icônes contextuelles par type d'action.
- Correction params : utilise `cible`+`cibleId`+`scope` au lieu de `parentCible`/`parentCibleId` séparés.

### Frontend — Page admin audit globale (`/admin/audit`)
- **Route** : `_auth.admin.audit.tsx`, guards `requireRole(['SUPER_ADMIN', 'ADMIN'])`.
- **Page** : `features/admin/components/audit-page.tsx` — DataTable serveur, filtres module/sévérité/recherche, export CSV/JSON, modal détail avec diff.
- **Sidebar** : entrée « Audit » ajoutée dans la section Administration (icône `ScrollText`).
- **i18n** : 25+ clés FR/EN dans `common.json` (`audit.page.*`).

### Fichiers modifiés/créés (résumé)
| Type | Fichier | Action |
|------|---------|--------|
| Migration | `132-audit-enrichi.sql` | Créé |
| Entity | `audit-log.entity.ts` | Enrichi (parentCible, champsModifies, etablissementId) |
| Service | `audit.service.ts` | Enrichi (scope, champsModifies auto) |
| Service | `audit-relation-resolver.service.ts` | Créé |
| DTO | `audit-filters.dto.ts` | Enrichi (scope, severity, search) |
| Controller | `audit.controller.ts` | Enrichi (contrôle accès granulaire) |
| Frontend | `AuditTimeline.tsx` | Refondu v2 |
| Frontend | `audit-page.tsx` | Créé |
| Route | `_auth.admin.audit.tsx` | Créé |
| Sidebar | `Sidebar.tsx` | Entrée audit ajoutée |
| i18n | `fr/common.json`, `en/common.json` | Clés audit.page.* + audit.actions.* |
| Skill | `elisaschool-business-logic/SKILL.md` | Section audit trail mise à jour |

### Qualité
- **0 erreur TS** dans les fichiers audit (audit-page, route, Sidebar)
- **0 `any`** dans les nouveaux fichiers
- **0 couleur hardcodée** — toutes via CSS vars
- **0 chaîne FR en dur** — toutes via `t()`
- **i18n FR/EN parité** complète

## Travail effectué — Session 2026-07-29 (audit : metadata JSONB + résolution utilisateur + liens navigation)

### Contexte
Amélioration du système d'audit/traçabilité : les auteurs n'étaient pas affichés (profil non joint), aucun contexte entité (impossible de savoir QUEL élève/matière/période modifié), et aucun lien de navigation vers les enregistrements.

### Phase 1 — Migration + Entity (`metadata` JSONB)
- **`136-audit-metadata.sql`** : `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "metadata" jsonb;`
- **`audit-log.entity.ts`** : `@Column({ type: 'jsonb', nullable: true }) metadata?: Record<string, unknown>;`

### Phase 2 — Fix résolution utilisateur (join profil)
- **`audit.service.ts`** : `getLogs()` et `findLogById()` joignent désormais `u.profil` pour récupérer `nom`/`prenom` depuis `ProfilUtilisateur`
- **`audit.controller.ts`** : mapper `mapLog()` aplatit la réponse (`utilisateur.nom`, `utilisateur.prenom`, `utilisateur.email`)

### Phase 3 — Enrichir les appels audit avec metadata
| Module | Metadata | Actions |
|--------|----------|---------|
| classes | `{ entiteLabel: classe.nom, entiteRef: classe.code }` | CREATE, UPDATE, DELETE |
| matieres | `{ entiteLabel: matiere.nom, entiteRef: matiere.code }` | CREATE, UPDATE, DELETE |
| periodes | `{ entiteLabel: periode.nom }` | CREATE, UPDATE, DELETE |
| annees-scolaires | `{ entiteLabel: annee.libelle }` | CREATE, UPDATE, DELETE, ACTIVATE |
| notes | `{ entiteLabel: "${valeur}/${bareme}", relations: { eleve, matiere, periode } }` | CREATE, UPDATE, DELETE |
| personnel | `{ entiteLabel: matricule, entiteRef: matricule }` | CREATE |
| bulletin-paie | `{ entiteLabel: "Bulletin ${mois}/${annee}", relations: { personnel } }` | GENERATE |

### Phase 4 — Frontend (type + navigation + composants)
- **`frontend/src/lib/audit-navigation.ts`** (créé) : `resolveAuditNavLink()` + `resolveRelationNavLink()` — map 10 types d'entités vers routes TanStack Router avec permission requise
- **`AuditTimeline.tsx`** : type `AuditLogEntry.metadata` + `email` ajoutés ; `LogItem` affiche `metadata.entiteLabel` avec lien navigable (permission-gated) ; relations en badges compacts avec liens ; fallback email si nom/prenom absents
- **`audit-page.tsx`** : colonne "cible" cliquable ; section "Contexte" dans le modal détail avec liens ; même fallback email
- **i18n** : `audit.relations.*` (10 clés) + `audit.page.contexte` ajoutés en FR et EN

### Fichiers modifiés/créés
| Fichier | Action |
|---------|--------|
| `backend/database/migrations/136-audit-metadata.sql` | Créé |
| `backend/src/modules/auth/entities/audit-log.entity.ts` | Modifié (metadata JSONB) |
| `backend/src/modules/auth/services/audit.service.ts` | Modifié (join profil + metadata AuditOptions) |
| `backend/src/modules/audit/controllers/audit.controller.ts` | Modifié (mapLog response) |
| `backend/src/modules/classes/services/classes.service.ts` | Modifié (metadata) |
| `backend/src/modules/matieres/services/matieres.service.ts` | Modifié (metadata) |
| `backend/src/modules/periodes/services/periodes.service.ts` | Modifié (metadata) |
| `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Modifié (metadata) |
| `backend/src/modules/notes/services/notes.service.ts` | Modifié (metadata + relations) |
| `backend/src/modules/personnel/services/personnel.service.ts` | Modifié (metadata) |
| `backend/src/modules/paie/services/bulletin-paie.service.ts` | Modifié (metadata + relations) |
| `frontend/src/lib/audit-navigation.ts` | Créé |
| `frontend/src/components/ui/AuditTimeline.tsx` | Modifié (type + liens + relations) |
| `frontend/src/features/admin/components/audit-page.tsx` | Modifié (liens + contexte) |
| `frontend/src/locales/fr/common.json` | Modifié (audit.relations + contexte) |
| `frontend/src/locales/en/common.json` | Modifié (audit.relations + contexte) |

### Qualité
- **0 erreur TS** dans les fichiers modifiés (frontend + backend)
- **0 `any`** nouveau
- **0 couleur hardcodée** — CSS vars
- **0 chaîne FR en dur** — `t()` partout
- **i18n FR/EN parité** complète
- **Navigation permission-gated** — liens visibles uniquement si la permission correspondante est accordée
- **Fallback email** — pour les logs historiques sans nom/prenom

## Travail effectué — Session 2026-07-29 (wiring validation workflow multi-niveaux — Option B)

### Corrections backend
- **AuditAction enum** : ajout `VALIDATION_APPROUVE`, `VALIDATION_REJETE`
- **Migration 144** (ex-139 legacy, renumerotée) : ajout ALTER TYPE pour audit_action_enum (2 noms PG possibles)
- **`validation-workflow.service.ts`** : ajout des cas `Periode`, `AnneeScolaire`, `Bulletin` dans `appliquerEffetEntite()` ; fix `setParam()` arité
- **`bulletins.service.ts`** : création auto de workflow quand `publie=true` et `require_validation`
- **`personnel.service.ts`** : `updateStatut()` avance le workflow via `traiterValidation()` si workflow EN_COURS
- **`validation-workflow.controller.ts`** : ajout route `GET /by-entite/:module/:entiteId` + guard sur `/annuler`
- **`notes.service.ts`** : fix double-save (re-fetch après `traiterValidation`)

### Frontend — Validation tab (6 pages)
Validation tab ajouté dans bulletin-, matière-, période-, classe-, année scolaire- et personnel-detail-page :
- `ValidationTimeline` + `ValidationActions` + `useWorkflowByEntite`
- Gated par permission `{module}:validate`
- **Fix permission bug** : `audit:periodes:view` → `audit:annees-scolaires:view` dans l'année scolaire

### Infrastructure
- Nouveau hook `useWorkflowByEntite()` + endpoint backend + barrel hooks
- i18n : 20 clés ajoutées (validation, aucunWorkflow) dans FR+EN pour les 5 modules
- 0 erreur TS backend + frontend (préexistantes intactes)

## Travail effectué — Session 2026-07-30 (indicateur de connexion réseau — grill-me + implémentation)

### Contexte
Demande d'un indicateur de connexion dans le header eLISAschool, avec détection multi-états : réseau, internet, serveur. Décisions prises via grill-me (20 questions).

### Décisions validées (grill-me)
- **5 états** : connected / degraded / server-down / lan-only / offline
- **Détection** : navigateur `navigator.onLine` + `/api/network/ping` backend enrichi (DB + mémoire + internet probe) + fallback frontend Cloudflare `no-cors` si serveur down
- **Visuel** : point + anneau concentrique — anneau = réseau (vert/orange/rouge), point = serveur (vert/jaune/rouge/gris)
- **Animations** : pulsation pour états non-nominaux (degraded 1.5s, server-down 1s, lan-only 3s) + transitions Framer Motion entre états
- **Polling** : 15s + événements navigateur (online/offline/visibilitychange)
- **Comportement au clic** : Radix Popover avec détails (latence, DB, mémoire, internet)
- **Bannière** : persistante après 30s d'état critique, désactivable par l'utilisateur
- **Permissions** : 3 niveaux — `network:view` (tous), `network:details` (popover), `network:admin` (page monitoring)
- **Architecture** : `features/network/` avec store Zustand + hook + composants UI
- **Cache** : Redis 30s pour sonde internet côté backend

### Backend — Module network/
- **`network.service.ts`** : ping avec DB check (SELECT 1), mémoire, sonde internet (HEAD 1.1.1.1), cache Redis 30s + fallback mémoire
- **`network.controller.ts`** : `GET /api/network/ping` public, retourne `{ status, timestamp, details: { database, memory, internet }, latencyMs }`
- **`app.ts`** : monté public juste après `/api/health`
- **`roles.enum.ts`** : 3 permissions ajoutées à `Permission` enum + `DEFAULT_ROLE_PERMISSIONS[ADMIN]`
- **`142-network-permissions.sql`** : migration idempotente (INSERT permissions + role_permissions pour tous les rôles)

### Frontend — Indicateur de connexion (8 fichiers)
- **`types/network.types.ts`** : 5 états, `ConnectionDetails`, `PingResponse`
- **`stores/connection.store.ts`** : Zustand store — état global `{ state, details }`, méthode `checkConnection()` (ping serveur + probe Cloudflare fallback)
- **`hooks/use-connection-status.ts`** : polling 15s, listeners online/offline/visibilitychange
- **`components/ConnectionIndicator.tsx`** : point + anneau SVG, animation Framer Motion, badge critique (!)
- **`components/ConnectionPopover.tsx`** : Radix Popover avec détails permission-gated, boutons rafraîchir/monitoring
- **`components/ConnectionBanner.tsx`** : bannière avec délai 30s, désactivable, icône selon état
- **`features/network/index.ts`** : barrel exports
- **`Header.tsx`** : intégré avant `EtablissementSwitcher`
- **`PageLayout.tsx`** : intégré après `<Header />`
- **i18n FR/EN** : 16 clés dans `common.json` (`network.*`)

### Qualité
- 0 `as any` dans les 10 fichiers créés
- 0 couleur hardcodée — toutes via CSS vars
- 0 chaîne FR en dur — toutes via `t()`
- i18n FR/EN parité complète
- Permissions 3 niveaux attribuées à tous les rôles (view) ou ADMIN (details/admin)
- Cache Redis 30s + fallback mémoire pour sonde internet

## Consolidation StatCard + UX unifiée — Session 2025

### Phase 1 — StatCard partagé enrichi
- **`components/ui/StatCard.tsx`** : ajout `orientation` (horizontal/vertical), `compact`, effets hover `scale(1.02)` + `shadow-md`, extraction `TrendBadge`
- **`audit-page.tsx`** : suppression StatCard local (36 lignes), import StatCard partagé avec `compact` + `tone`

### Phase 2 — Breadcrumb standardisé
- **`PageHeader.tsx`** : `showBreadcrumbs: true` par défaut
- Suppression `<Breadcrumbs />` directs dans 4 fichiers : `eleve-detail-page.tsx`, `hero-header.tsx`, `SalleDetailPage.tsx`, `OrganigrammePage.tsx`

### Phase 3 — Filtres DataTable
- Ajout `enableCollapsibleFilters` sur 10 pages : evenements, courriers, bibliotheque, sante, archives, documents, sondages, inventaire, examens, eleves, discipline

### Phase 4 — StepperModal (modals multi-étapes)
- **`components/modals/StepperModal.tsx`** : NOUVEAU composant générique — indicateur progression (barre + dots), navigation prev/next, validation par étape, animations Framer Motion
- **`classe-form-modal.tsx`** : conversion CustomModal+stepper manuel → StepperModal (3 étapes création, 2 étapes édition)
- **`etablissement-form-modal.tsx`** : conversion → StepperModal (3 étapes : Identité, Contact & Communication, Configuration)
- **`utilisateur-form-modal.tsx`** : conversion → StepperModal (3 étapes : Identité & Contact, Rôle & Accès, Profil)

### Phase 5 — Badge workflow PageHeader
- **`contrat-detail-page.tsx`** : ajout `status` prop (EN_ATTENTE_VALIDATION→warning, ACTIF→success, EXPIRE→info, ROMPU→danger)
- **`bulletin-detail-page.tsx`** : ajout `status` prop (publié→success, non publié→warning)

### Phase 6 — Backend : tendances stats
- **`audit.controller.ts`** : ajout `trends` dans `/api/audit/logs/statistics` — comparaison 24h vs 24-48h
- **`notes.service.ts`** : ajout `trends` dans `getStatistiques` — comparaison 30j vs 30-60j (nombreNotes + moyenne)

## Système Emploi du Temps — Audit + Améliorations Phase 1 (Session 2026-08-02)

### Architecture consolidée
- **Modèle 3 couches** : `AffectationMatiere` (source unique de vérité) → `CreneauHoraire` (slot hebdomadaire récurrent) → `HeureCours` (instance datée concrète)
- **AffectationMatiere** : lie enseignant + matière + classe-année (unique source pour l'attribution des heures)
- **CreneauHoraire** : slot hebdomadaire (jour + heureDebut/heureFin + typeCreneau + statut), lié à `affectationMatiereId` et optionnellement `salleId`
- **HeureCours** : instance datée concrète d'un créneau (date + statutEffectif + remplacement), liée à `classeAnneeId` + `creneauId`
- **Détection conflits** : 5 types (3 BLOQUANT : classe/enseignant/salle ; 2 AVERTISSEMENT : depassementVolume/creneauImposable)
- **Génération** : algo glouton most-constrained-first avec contraintes (pauses, imposables, dispo enseignant, salles, max consécutifs)

### Backend — Améliorations Phase 1
- **Fix performance** : `findByClasseAnnee`, `findByEnseignant`, `findBySalle` — `find()` + filter en mémoire → `createQueryBuilder` avec JOIN et WHERE en base
- **Nouvel endpoint** : `GET /api/emploi-du-temps/statistiques` — KPIs agrégés (totalCreneaux, totalHeures, totalMatieres, totalClasses, totalEnseignants, totalSallesOccupees, repartitionParJour, repartitionParMatiere, tauxOccupationSalle, conflitsPotentiels)
- **Contrainte maxCreneauxConsecutifs** : intégrée dans l'algo de génération (méthode `verifierMaxConsecutifs()`)
- **Fichiers modifiés** : `emploi-du-temps.service.ts`, `emploi-du-temps.controller.ts`

### Frontend — Améliorations Phase 1
- **Types** : `StatistiquesEDT` + `StatistiquesFilters` ajoutés dans `edt.types.ts`
- **Hook** : `useStatistiquesEDT()` dans `use-emploi-du-temps.ts` (query key `['emploi-du-temps', 'statistiques', filters]`)
- **i18n** : clés calendrier (semaine, jour, précédent, suivant, aujourd'hui) + synthèse (KPIs, graphiques, respect) ajoutées dans `emplois.json`
- **Refonte edt-synthese.tsx** : dashboard complet — 6 KPI Cards + 2 graphiques CSS bar chart horizontal (répartition par jour, par matière) + tableau croisé volume horaire responsive (desktop table + mobile cards)
- **Refonte edt-calendar.tsx** : hook `useHauteurSlot()` responsive (36/40/48px), `clamp()` sur grille/headers/labels/cards, jours abrégés sur mobile
- **Refonte onglet-edt.tsx** : classes Tailwind hardcodées → variables CSS eLISAschool (`--color-dominant-*`, `--color-text-*`, `--gap-*`, `--space-*`, `--icon-*`), mobile cards < 640px
- **Refonte edt-page.tsx** : bannière ajoutée, `space-y-4`/`gap-6`/`p-6` → variables CSS, sélecteur contexte responsive, select avec `clamp()`, bouton "Ajouter" label masqué sur mobile
- **Refonte edt-liste.tsx** : variables CSS eLISAschool appliquées

### Ultra-responsivité appliquée
- Tous les `font-size` en `clamp()` (pas de valeurs fixes)
- Tous les espacements via `var(--gap-*)`, `var(--space-*)`, `var(--padding-*)`
- Icônes via `var(--icon-xs)` / `var(--icon-sm)` / `var(--icon-lg)`
- Transformation tableau → cartes sur mobile (< 480px ou < 640px selon composant)
- Jours abrégés automatiquement sur petits écrans (3 lettres)

### Fichiers modifiés (12)
**Backend** : `emploi-du-temps.service.ts`, `emploi-du-temps.controller.ts`
**Frontend** : `edt.types.ts`, `use-emploi-du-temps.ts`, `emplois.json` (FR), `edt-synthese.tsx`, `edt-calendar.tsx`, `onglet-edt.tsx`, `edt-page.tsx`, `edt-liste.tsx`

### Prochaines phases (à venir)
- **Phase 2** : Génération progressive avec preview + résolution interactive des conflits
- **Phase 3** : Page dédiée HeureCours (suivi effectif, pointage présence, remplacements)
- **Phase 4** : Timeline verticale Google Calendar (axe Y=heures, axe X=jours)
- **Phase 5** : Navigation semaine dans le calendrier + export PDF amélioré

## Travail effectué — Session 2026-08-02 (redesign navigation EDT — pill compact + datepicker modal)
### Contexte
Session grill-me : améliorer la sélection des jours du calendrier EDT et son affichage de manière moderne, interactive, professionnelle et épurée.

### Spécification retenue (co-construction itérative)
- **Périmètre** : uniquement le bloc de navigation (◀ ▶ label)
- **Style** : hybride compact `[◀ Août 2026 ▶ ⌖]` — pill avec bordure arrondie, chevrons encadrent le label, bouton « Aujourd'hui » absorbé en icône crosshair (⌖) discret
- **Interactions** : clic sur le label → ouvre un modal datepicker ; chevrons → prev/next ; ⌖ → retour aujourd'hui (visible au hover si `estCourant`, permanent sinon)
- **Modal datepicker** : CustomModal size="md", dropdowns mois + année en header, grille calendrier 7×6, footer « Aujourd'hui » + « Semaine courante »
- **Responsive** : mobile = label abrégé (mois court) ; desktop = label complet

### Fichiers créés (1)
- **`edt-datepicker-modal.tsx`** (291 lignes) : composant modal avec calendrier mensuel interactif
  - Dropdowns mois (12 mois traduits) + année (±5 ans autour de l'année courante)
  - Grille 7×6 avec jours du mois précédent/suivant en opacité réduite
  - Jour sélectionné = fond dominant-600, aujourd'hui = ring + dot indicateur
  - Navigation interne ◀▶ mois dans le modal
  - Ultra-responsive (clamp), variables CSS, i18n FR/EN complet

### Fichiers modifiés (3)
- **`edt-page.tsx`** : bloc navigation refactorisé en pill compact (border + bg surface + group hover), label cliquable avec `setDatePickerOpen(true)`, bouton ⌖ crosshair avec `opacity-0 group-hover:opacity-100` si `estCourant`, modal `EDTDatePickerModal` ajouté en bas du JSX
- **`emplois.json` (FR)** : +9 clés navigation (`titreDatepicker`, `descriptionDatepicker`, `semaineCourante`, `moisPrecedent`, `moisSuivant`, `selectionnerMois`, `selectionnerAnnee`, `allerAujourdhui`) + `jours.dimanche`
- **`emplois.json` (EN)** : parité FR/EN complète (+9 clés navigation + `jours.dimanche`)

### Barrel export
- **`index.ts`** : `EDTDatePickerModal` ajouté aux exports

### Conventions respectées
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur
- Variables CSS uniquement (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--icon-*)`)
- `clamp()` sur toutes les dimensions (ultra-responsivité 100px-2560px)
- `CustomModal` (pas d'overlay custom)
- i18n 100% (react-i18next, namespaces `emplois`)

## Travail effectué — Session 2026-08-05 (EDT — jours fériés, badge HC, modal +N, toggle)
### Contexte
Session grill-me (3 rounds) : 7 axes d'amélioration EDT clarifiés par questions interactives.

### Améliorations implémentées (6)
1. **Jour actuel distinctif** : semaine = colonne fond léger `bg-[var(--color-accent-50)]/40` + cercle blanc semi-transparent autour numéro header ; mois = cercle `bg-[var(--color-dominant-600)]` autour numéro + ring-2
2. **Modal détail par défaut** : clic créneau depuis semaine/mois → `EDTCreneauDetailModal` (lecture seule) ; vue jour → `EDTCreneauModal` (édition directe)
3. **Jours fériés complets** : backend (entité `JourFerie` + migration 147 + seed Cameroun 6 fixes récurrents + 12 variables chrétiens 2025-2027 + CRUD REST) ; frontend (hook `useJoursFeries` + intégration vues semaine/mois avec indicateur étoile `Star` + tooltip nom)
4. **Badge heures cours** : pastille `CheckCircle2` vert + ring inset pour créneaux avec HC générées ; backend via `addSelect EXISTS` + `getRawAndEntities` pour mapper `hasHeuresCours`
5. **Modal +N** : clic sur « +N » vue mois → CustomModal liste triée par heure, pastille couleur matière, infos (horaires, enseignant, salle), clic → modal détail
6. **Toggle « Tout afficher »** : bouton Eye dans toolbar secondaire (vue mois uniquement), supprime la limite 3 créneaux par jour

### Fichiers créés (6)
- `backend/src/modules/emploi-du-temps/entities/jour-ferie.entity.ts` (108 lignes)
- `backend/database/migrations/147-jours-feries.sql` (66 lignes)
- `backend/src/modules/emploi-du-temps/dto/jour-ferie.dto.ts` (43 lignes)
- `backend/src/modules/emploi-du-temps/services/jour-ferie.service.ts` (206 lignes)
- `backend/src/modules/emploi-du-temps/controllers/jours-feries.controller.ts` (121 lignes)
- `frontend/src/features/emploi-du-temps/hooks/use-jours-feries.ts` (104 lignes)

### Fichiers modifiés (9)
- `edt-page.tsx` : hook `useJoursFeries`, handlers `handleCreneauClick`/`handleCreneauEdit`/`handlePlusNClick`, état `showAllCreneaux`, modal +N CustomModal, toggle Eye toolbar
- `edt-calendar.tsx` : import `CheckCircle2`/`Star`, props `joursFeries`, DropCell `estAujourdhui`, cercle header, indicateur JF, badge HC CreneauCard
- `edt-month-view.tsx` : import `CheckCircle2`/`Star`, props `joursFeries`/`showAll`/`onPlusNClick`, cercle numéro actuel, indicateur JF, badge HC, "+N" buttonisé
- `emploi-du-temps.service.ts` : `addSelect EXISTS` + `getRawAndEntities` pour `hasHeuresCours`
- `edt.types.ts` : interface `JourFerie` + champ `hasHeuresCours` sur `CreneauHoraire`
- `use-jours-feries.ts` : fix bug `useHandleError` (hook appelé correctement)
- `emplois.json` FR/EN : clés `vues.afficherTout*`, `badge.*`, `modalPlusN.*`, `joursFeries.*`
- `entities/index.ts`, `dto/index.ts`, `services/index.ts`, `controllers/index.ts`, `index.ts` (module backend) : exports

### Bug corrigé
- `use-jours-feries.ts` : `const handleErr = useHandleError` (référence fonction sans appel hook) → `const handleError = useHandleError()` dans chaque hook de mutation (conformité règles hooks React)

---

## Module Heures de cours — Page globale + Remplacements (2026-08-03)

### Architecture
- **Portée** : GLOBAL — vue établissement + filtres avancés
- **Navigation** : Sous-entrées EDT dans la sidebar (Heures de cours + Remplacements)
- **Tab existant** : CONSERVÉ dans la fiche personnel (`TabHeureCours`)
- **Remplacements** : Page dédiée `/heures-cours/remplacements`
- **Permissions** : Granulaires dédiées (`heures-cours:view`, `:export`, `:remplacer:view`, `:remplacer:demand`, `:remplacer:validate`)

### Backend — Entité RemplacementHeureCours
- **Fichier** : `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts`
- **Enum** : `StatutRemplacement` (EN_ATTENTE, VALIDEE, REJETEE, EXECUTEE, ANNULEE)
- **FK** : HeureCours, MembrePersonnel (demandeur, remplacant, validePar), Etablissement
- **Soft delete** : @DeleteDateColumn
- **Migration** : `backend/database/migrations/148-remplacement-heure-cours.sql`

### Backend — Service + Controller
- **Service** : `remplacement-heure-cours.service.ts` (7 méthodes : create, valider, executer, rejeter, annuler, findAll, getStatistiques)
- **Controller** : 7 routes REST (`/api/personnel/heures-cours/remplacements/*`)
- **Extensions** : `getStatistiquesGlobales()` + `exportCSV()` + `exportHTML()` dans `heure-cours.service.ts`
- **Workflow 2 étapes** : `valider()` EN_ATTENTE→VALIDEE (approbation, ne touche pas HeureCours) puis `executer()` VALIDEE→EXECUTEE (mise en œuvre, met à jour HeureCours statut REMPLACE + remplacantId)
- **findAll() enrichi** : 10 leftJoinAndSelect (enseignant→utilisateur→profil, classeAnnee→classe+anneeScolaire, matiere, salle, creneau, remplacant→utilisateur→profil). Filtre `salleId` ajouté (DTO + service).

### Frontend — Pages + Hooks
- **Hooks** : `use-remplacement-heure-cours.ts` (7 hooks : useRemplacements, useStatistiquesRemplacements, useCreerRemplacement, useValiderRemplacement, useExecuterRemplacement, useRejeterRemplacement, useAnnulerRemplacement)
- **Extensions** : `useStatistiquesGlobales` + `useExportHeuresCoursCSV` + `useExportHeuresCoursHTML` dans `use-heure-cours.ts`
- **Page Heures de cours** : `heures-cours-page.tsx` (6 StatCards, DataTable avec `enableCollapsibleFilters`, export CSV/HTML authentifié). Colonnes enrichies : Enseignant (avatar initiales + nom complet via `enseignant.utilisateur.profil`), Matière (dot couleur + code), Classe (icône GraduationCap + code), Salle (icône MapPin + code). Pagination corrigée (`meta.totalItems`).
- **Page Remplacements** : `remplacements-page.tsx` (4 StatCards, DataTable avec `enableCollapsibleFilters`, workflow 2 étapes avec confirmation modale validation/rejet, bouton Exécuter pour VALIDEE)
- **StepperModal** : `remplacement-stepper-modal.tsx` v2.0 (3 étapes : sélection cours → remplaçant + motif → récapitulatif). Prop `coursPreselectionne` : skip étape 1 si cours connu (bouton Remplacer depuis heures-cours-page). Recherche remplaçant avec dropdown filtrable. Locale dynamique `i18n.language`. Bouton Remplacer visible uniquement pour statut PLANIFIE.
- **Export modal** : `heures-cours-export-modal.tsx` (choix CSV/HTML, export HTML authentifié via apiClient)
- **Routes** : `_auth.heures-cours.tsx` (`requirePermission('heures-cours:view')`), `_auth.heures-cours.replacements.tsx` (`requirePermission('heures-cours:remplacer:view')`)
- **Sidebar** : Sous-entrées sous "Emploi du temps" (Planning, Heures de cours, Remplacements)

### Fichiers créés (11)
- `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts`
- `backend/database/migrations/148-remplacement-heure-cours.sql`
- `backend/src/modules/personnel/dto/remplacement-heure-cours.dto.ts`
- `backend/src/modules/personnel/services/remplacement-heure-cours.service.ts`
- `backend/src/modules/personnel/controllers/remplacement-heure-cours.controller.ts`
- `frontend/src/features/personnel/hooks/use-remplacement-heure-cours.ts`
- `frontend/src/features/emploi-du-temps/components/heures-cours-page.tsx`
- `frontend/src/features/emploi-du-temps/components/remplacements-page.tsx`
- `frontend/src/features/emploi-du-temps/components/remplacement-stepper-modal.tsx`
- `frontend/src/routes/_auth.heures-cours.tsx`
- `frontend/src/routes/_auth.heures-cours.replacements.tsx`

### Fichiers modifiés (10)
- `shared/src/enums/roles.enum.ts` : 4 nouvelles permissions + attribution ADMIN/CHEF/PROVISEUR
- `backend/src/modules/auth/entities/audit-log.entity.ts` : 5 AuditAction REMPLACEMENT_HEURE_COURS_*
- `backend/src/modules/validation-workflow/services/validation-workflow.service.ts` : `heures_cours_remplacement` dans getDefaultRoles()
- `backend/src/modules/personnel/services/heure-cours.service.ts` : `getStatistiquesGlobales()` + `exportCSV()`
- `backend/src/modules/personnel/controllers/heure-cours.controller.ts` : 2 routes (statistiques-globales, export/csv)
- `backend/src/app.ts` : montage controller remplacements AVANT heures-cours
- `frontend/src/features/personnel/hooks/use-heure-cours.ts` : `useStatistiquesGlobales` + `useExportHeuresCoursCSV`
- `frontend/src/features/personnel/index.ts` : export barrel hooks remplacements
- `frontend/src/features/emploi-du-temps/index.ts` : export barrel pages
- `frontend/src/components/layout/Sidebar.tsx` : sous-entrées EDT (Planning, Heures de cours, Remplacements)
- `frontend/src/locales/fr/emplois.json` + `en/emplois.json` : ~80 clés i18n (heuresCoursPage.*, remplacements.*, export.*)

## Composants partagés EDT / Heures de cours / Remplacements (2026-08-06)

### Composants colonnes (`components/ui/data-table/`)
- **Barrel** : `components/ui/data-table/index.ts`
- **ColonneEnseignant** : avatar rond initiales (dominant-100/dark-900) + nom complet tronqué. Style canonical = heures-cours-page.
- **ColonneMatiere** : dot couleur + nom + code (`hidden lg:inline`)
- **ColonneClasse** : icône GraduationCap + nom + code (`hidden xl:inline`)
- **ColonneSalle** : icône MapPin + nom/code
- **BadgeStatutCreneau** : badge unifié 8 états (PLANIFIE→outline, EFFECTUE→success, ANNULE→danger, REMPLACE→warning, EN_ATTENTE→warning, VALIDEE→success, REJETEE→danger, EXECUTEE→success)
- **Utilisation obligatoire** dans `edt-liste.tsx`, `heures-cours-page.tsx`, `remplacements-page.tsx`

### ElisaSelect v2.1
- **Prop `searchable`** : input search dans dropdown (filtrage live Radix)
- **Prop `compact`** : `h-8` / `text-xs` pour filtres DataTable/FilterPanel
- **Prop `aria-label`** : accessibilité ARIA sur le trigger
- **Dark mode** : classes `dark:` explicites sur Trigger et Content portal
- **Contraintes viewport (v2.1)** : `max-h-[min(70vh,360px)]`, `w-[--radix-select-trigger-width]`, `max-w-[calc(100vw-2rem)]`, `avoidCollisions` — empêche le débordement écran. Items tronqués (`truncate` sur ItemText). Scroll buttons avec gradient fade.
- **Migration** : FilterPanel et DataTable toolbar — tous les `<select>` natifs remplacés par ElisaSelect compact
- **Migration modals EDT** : 14 `<select>` natifs migrés vers ElisaSelect (edt-creneau-modal ×6, edt-generation-modal ×1, edt-preferences ×2, jour-ferie-form-modal ×2, edt-datepicker-modal ×2, edt-page ×1). Selects cascading (classe→matière→enseignant) avec `searchable`. Valeurs numériques (mois/année) converties via `String()`/`Number()`. Controller RHF adapté.
- **Fix toolbar anti-chevauchement (v2.1)** : `shrink-0` sur segmented groups (contexte + vues) et boutons, ElisaSelect `w-[clamp(100px,20vw,200px)]` au lieu de `min-w`, `gap-y/gap-x` séparés sur toolbars `flex-wrap`. Groupes actions en `shrink-0`.
- **Segmented groups standard contraste (v2.1)** : fond `surface-alt`, bordures `gray-300` (light) / `var(--color-bordure)` (dark), séparateurs inter-boutons `gray-200`, actif `dominant-600 text-white shadow-sm`, inactif `text-primary` (light) / `text-secondary` (dark). Séparateurs toolbar en `gray-300`. Toggle "afficher tout" aligné sur le pattern solide. Navigation pill `hover:border-dominant-400`.
- **`--color-secondaire` défini (v2.1)** : light `#e5e7eb`, dark `#334155` — corrige ElisaButton `secondary` qui référençait une variable inexistante (fond transparent). Outline variant : `border-gray-300 dark:border-[var(--color-bordure)]`.
- **Palette créneau EDT (v2.2)** : utilitaire `palette-creneau.ts` — génère fond teinté (18%), fond assombri (60%+noir), texte auto (luminance WCAG), bordure (40%), fond badge (10%) depuis couleur matière hex. Utilisé dans month/week/day/synthese. Garantit contraste ≥ 4.5:1 quelle que soit la couleur choisie par l'utilisateur.
- **Créneaux progressifs (v2.2)** : contenu adapté à la taille du slot. Month view : L1=horaire+matière+statut, L2=initiales enseignant+salle (hidden sm). Week view : compact (< 72px)=matière+horaire, normal=+classe, grand (≥ 120px)=+enseignant+salle. Day view : badge classe avec fond palette, enseignant/salle en `text-secondary`.
- **Légende EDT v2 (v2.2)** : surface `surface-alt` pleine, bordure `gray-300 dark:border-bordure`, titre `text-secondary` (pas muted), items `text-primary` (pas secondary). Collapsible (ChevronDown). Badges réduits à 0.625rem.
- **Bordures calendrier light mode (v2.2)** : `gray-300 dark:border-[var(--color-bordure)]` sur grille, cellules, conteneur, labels heures (au lieu de `var(--color-bordure)` trop pâle en light).
- **Synthese barres matières (v2.2)** : barres utilisent `pal.bordure` (teinte 40%) au lieu de couleur brute. Texte heures avec `textShadow` halo pour lisibilité sur fond coloré. Font-size en `clamp()` au lieu de `text-[10px]` fixe.

### Fichiers créés (3)
- `frontend/src/components/ui/data-table/BadgeStatutCreneau.tsx`
- `frontend/src/components/ui/data-table/colonnes-partagees.tsx`
- `frontend/src/components/ui/data-table/index.ts`

### Fichiers modifiés (8)
- `frontend/src/components/ui/ElisaSelect.tsx` : v2 (searchable, compact, dark mode, aria-label)
- `frontend/src/components/ui/FilterPanel.tsx` : SelectFilter → ElisaSelect compact
- `frontend/src/components/ui/DataTable.tsx` : 3 `<select>` natifs → ElisaSelect compact (filtres inline, hauteur ligne, pagination)
- `frontend/src/features/emploi-du-temps/components/heures-cours-page.tsx` : colonnes → composants partagés, BadgeStatut local supprimé
- `frontend/src/features/emploi-du-temps/components/edt-liste.tsx` : colonnes → composants partagés, badges inline → BadgeStatutCreneau
- `frontend/src/features/emploi-du-temps/components/remplacements-page.tsx` : colonnes → composants partagés, BadgeStatutRemplacement → BadgeStatutCreneau
- `frontend/src/features/emploi-du-temps/components/remplacement-stepper-modal.tsx` : dropdown custom 70 lignes → ElisaSelect searchable (10 lignes)

### Fichiers modifiés — migration modals EDT (6 fichiers, 14 selects)
- `edt-creneau-modal.tsx` : 6 `<select>` → ElisaSelect (type créneau, classe searchable, matière searchable cascading, enseignant searchable cascading, jour, salle)
- `edt-generation-modal.tsx` : 1 `<select>` → ElisaSelect (template)
- `edt-preferences.tsx` : 2 `<select>` → ElisaSelect (pays searchable, horaire jour compact)
- `jour-ferie-form-modal.tsx` : 2 `<select>` Controller RHF → ElisaSelect (mois, pays searchable)
- `edt-datepicker-modal.tsx` : 2 `<select>` → ElisaSelect compact (mois, année — valeurs numériques converties)
- `edt-page.tsx` : 1 `<select>` → ElisaSelect compact (filtre contexte avec placeholder dynamique)

## Travail effectué — Session 2026-08-05 (Jours fériés — CRUD + modèles pays + exclusion matérialisation)

### Fonctionnalité complète Jours Fériés
- **CRUD jours fériés** : section dans les préférences EDT (`edt-preferences.tsx`). Tableau liste avec nom, type (récurrent/ponctuel), origine (système/pays/custom), bouton supprimer (non-système).
- **Modèles par pays** : 15 pays Afrique centrale + UEMOA (CM, CI, SN, CG, CD, GA, BF, ML, BJ, TG, NE, GN, TD, CF, GQ). Seeds système modifiables avec jours fériés fixes + variables chrétiens 2025-2027 + fêtes islamiques 2025-2027 (Fin Ramadan + Tabaski). Cameroun par défaut.
- **Chargement modèle** : POST `/api/emploi-du-temps/jours-feries/charger-modele` — copie les JF système du pays vers l'établissement (modifiables). GET `/modeles` liste les pays disponibles.
- **Exclusion JF dans matérialisation** : `preference-emploi-du-temps.exclureJoursFeries` (boolean, défaut true). Dans `materialiserInstances()`, charge les JF de la plage et skip les instances dont la date tombe un JF.

### Backend (10 fichiers)
- **Entités** : `jour-ferie.entity.ts` (+ enum `PaysJourFerie` 15 pays, colonne `pays`, index) ; `preference-emploi-du-temps.entity.ts` (+ colonne `exclureJoursFeries`)
- **DTOs** : `jour-ferie.dto.ts` (+ champ `pays`, `chargerModelePaysSchema`) ; `emploi-du-temps.dto.ts` (+ `exclureJoursFeries`)
- **Service** : `jour-ferie.service.ts` (+ `chargerModelePays()`, `listerModelesPays()`) ; `heure-cours.service.ts` (+ exclusion JF dans `materialiserInstances()`)
- **Controller** : `jours-feries.controller.ts` (+ GET `/modeles`, POST `/charger-modele`, routes réordonnées : statiques avant `/:id`)
- **Migration** : `149-jours-feries-modeles-pays.sql` (ADD COLUMN `pays` + `exclureJoursFeries` + seeds 15 pays : fixes, variables chrétiens, fêtes islamiques)

### Frontend (6 fichiers)
- **Types** : `edt.types.ts` (+ `pays` sur `JourFerie`, `exclureJoursFeries` sur `PreferenceEDT`)
- **Hooks** : `use-jours-feries.ts` (+ `useUpdateJourFerie`, `useChargerModelePays`, `useModelesPays`)
- **Composant** : `edt-preferences.tsx` (+ section Exclusion JF avec toggle, section Jours fériés avec sélecteur pays + bouton charger + tableau liste)
- **i18n** : `fr/emplois.json` + `en/emplois.json` (+32 clés `joursFeries.*` dont 15 noms de pays)

## Travail effectué — Session 2026-08-05 (EDT — Calendrier, Configuration tabs, Templates wizard)

### 1. Calendrier — Jours fériés (vue semaine + mois + légende)

**Vue semaine** (`edt-calendar.tsx`) : détection jour férié par colonne via `estJourFerieFromList()`. Fond semi-transparent `bg-[var(--color-danger)]/5`, bordure supérieure 3px colorée (`jfCouleur`), nom du jour férié affiché sous l'étoile dans le header (texte tronqué).

**Vue mois** (`edt-month-view.tsx`) : `cellClass` amélioré avec paramètre `jfEstFerie` → fond `bg-[var(--color-danger)]/5` + hover `/8`. Badge nom jour férié ajouté (étoile + texte tronqué `max-w-[3rem]`).

**Légende unifiée** (`edt-legend.tsx`, nouveau) : composant réutilisable affichant 4 indicateurs (aujourd'hui, jour férié, créneau validé, créneau en attente). Intégré sous les vues semaine et mois dans `edt-page.tsx`. Thème aware via CSS vars, responsive avec `clamp()`.

### 2. Configuration — Refactor en tabs horizontaux

**`edt-preferences.tsx`** : rewrite complet (660 → ~470 lignes). Structure en 3 onglets :
1. **Calendrier** : Jours travaillés (toggle buttons) + Horaires de cours + Contraintes de planification
2. **Jours fériés** : Exclusion toggle + Gestion JF (table, recherche, filtre, pagination, charger modèle pays, générer variables)
3. **Automation** : Matérialisation automatique (checkbox actif, liste horaires jour+heure, ajouter/supprimer)

Navigation tabs avec icônes (Calendar, Globe, Zap), scrollables horizontalement. Transitions Framer Motion (`AnimatePresence mode="wait"`). Footer sticky avec boutons Réinitialiser + Enregistrer. Validation : si `joursOuvrables` vide → redirection vers tab calendrier.

### 3. Templates — Wizard modal multi-étapes

**`template-wizard-modal.tsx`** (nouveau, ~570 lignes) : wizard 4 étapes via `StepperModal` :
1. **Identité** : Nom (obligatoire 2+ chars), description, partage (checkbox)
2. **Calendrier** : Jours travaillés (toggle buttons), plage horaire (début/fin avec validation), durée créneau (slider 15-120 min)
3. **Contraintes** : Max créneaux/jour, max même matière/jour, max consécutifs (inputs number avec aides)
4. **Preview** : Résumé visuel (4 stats cards + détails groupés : identité, calendrier, contraintes)

Mode création ET édition (prop `template?: TemplateEDT`). Validators par étape. Hook `useModifierTemplateEDT` ajouté (PATCH `/api/emploi-du-temps/templates/:id`).

### 4. Templates — Amélioration cards

**`edt-templates.tsx`** : rewrite des cards avec :
- Bandeau dégradé si template partagé
- Résumé configuration : jours travaillés (pastilles), horaires + durée, contraintes, types de créneau
- Bouton "Appliquer" rapide (primaire, pleine largeur)
- Actions secondaires : Modifier (ouvre wizard en mode édition), Dupliquer, Supprimer
- État vide amélioré avec icône dans un carré arrondi

### 5. Types + Hooks

- `TemplateEDTConfiguration` étendu : `dureeCreneauStandard`, `maxCreneauxParJour`, `maxCreneauxMatiereParJour`, `maxCreneauxConsecutifs`
- `useModifierTemplateEDT()` ajouté dans `use-emploi-du-temps.ts` (PATCH, toast `templateModifie`)

### 6. i18n FR+EN

~70 clés ajoutées dans chaque fichier :
- `legende.*` (5 clés) : titre, aujourd'hui, jour férié, créneau validé, créneau en attente
- `preferences.tabs.*` (3 clés) : calendrier, joursFeries, automation
- `templates.wizard.*` (45+ clés) : toutes les étapes, labels, validations, preview
- `templates.appliquer`, `templates.nonConfigure`, etc. (6 clés cards)
- `toasts.templateModifie`

### Qualité
- 0 erreur TypeScript (compilation `tsc --noEmit` clean)
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur
- Toutes les couleurs via CSS vars (`var(--color-*)`)
- Responsive mobile-first avec `clamp()`
- Dark mode natif via CSS vars

### Fichiers modifiés (10)
- `frontend/src/features/emploi-du-temps/components/edt-legend.tsx` (nouveau)
- `frontend/src/features/emploi-du-temps/components/template-wizard-modal.tsx` (nouveau)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (bandes JF)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (cellules JF)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (intégration légende)
- `frontend/src/features/emploi-du-temps/components/edt-preferences.tsx` (refactor tabs)
- `frontend/src/features/emploi-du-temps/components/edt-templates.tsx` (cards enrichies)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (TemplateEDTConfiguration étendu)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (useModifierTemplateEDT)
- `frontend/src/features/emploi-du-temps/index.ts` (exports)
- `frontend/src/locales/fr/emplois.json` (+70 clés)
- `frontend/src/locales/en/emplois.json` (+70 clés)

## Travail effectué — Session 2026-08-05 (contraste créneaux + refactor modal génération HC)

### Axe 1 — Palette theme-aware (dark mode)
- **`palette-creneau.ts` v1.1.0** : ajout param `mode: 'light' | 'dark'`. Surface par défaut auto (`#ffffff` light, `#1e293b` dark). `texteSurTeinte` calculé par `couleurTexteAuto()` (luminance WCAG) au lieu de `'#1f2937'` hardcodé. Nouveau hook `useModeTheme()` basé sur `useSyncExternalStore` + MutationObserver sur `data-theme`.
- **`edt-calendar.tsx`** (vue semaine) : CreneauCard toujours tout visible (matière + classe + enseignant initiales + salle code + horaire). Suppression du mode progressif (estCompact/estGrand). Couleurs texte via palette theme-aware. Overlay aussi mis à jour.
- **`edt-day-view.tsx`** (vue jour) : passage `mode` à `paletteCreneau()`.
- **`edt-month-view.tsx`** (vue mois) : passage `mode` à `paletteCreneau()`.

### Axe 2 — Modal génération Heures de Cours refactoré (v2.0)
- **`edt-heures-cours-modal.tsx`** : réécrit sur `StepperModal` partagé (3 étapes).
  - **Étape 1 (Sélection)** : cascade selects (classe → matière → enseignant) + dates. Auto-résolution 1-unique. Chargement autonome via `useAffectationsOptions()` (indépendant des filtres toolbar).
  - **Étape 2 (Résumé)** : récapitulatif enrichi (classe/matière/enseignant/période) avec icônes colorées.
  - **Étape 3 (Résultat)** : statistiques (créées/ignorées/erreurs/total) + fallback valeurs.
- **Interface changée** : `open`/`onOpenChange` + `contexteEnseignantId?`/`contexteClasseAnneeId?` (pré-sélection optionnelle).
- **`edt-page.tsx`** : wrapper `CustomModal` supprimé (le modal gère son propre StepperModal). Props mises à jour.

### Axe 3 — i18n
- 27 nouvelles clés FR+EN dans `generationHeuresCours.*` (étapes, cascade, résumé, résultat).
- Parité FR/EN complète.

### Qualité
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur.
- Tous les composants utilisent `clamp()` et variables CSS.
- Dark mode natif via `useModeTheme()` + `paletteCreneau()`.
- Composant réutilisable : `useModeTheme()` exporté depuis `@/lib`.

### Fichiers modifiés (8)
- `frontend/src/lib/palette-creneau.ts` (v1.1.0 — mode, useModeTheme)
- `frontend/src/lib/index.ts` (export useModeTheme)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (toujours tout visible + palette dark)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (palette mode)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (palette mode)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v2.0 — 3 étapes StepperModal)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (invocation mise à jour)
- `frontend/src/locales/fr/emplois.json` (+27 clés)
- `frontend/src/locales/en/emplois.json` (+27 clés)

## Travail effectué — Session 2026-08-07 (fix modal génération HC — boucle infinie)

### Bug corrigé
- **`edt-heures-cours-modal.tsx`** : le `StepperModal` partagé avance les étapes de manière **synchrone**. Quand l'utilisateur clique "Confirmer la génération" à l'étape 2, le StepperModal avance immédiatement à l'étape 3 (`setCurrentStep(2)` synchrone), puis appelle `onSubmit` seulement à la dernière étape. Résultat : l'étape 3 s'affiche avec `resultat === null` → loader infini.
- **Fix v2.1.0** : remplacement du `StepperModal` par `CustomModal` + gestion manuelle des étapes (`etapeCourante`). Le flux async est maintenant contrôlé :
  - Étape 1 → bouton "Suivant" dans le footer → `allerEtapeSuivante()`
  - Étape 2 → bouton "Générer" dans le footer → `handleGenerer()` (async) → **attend la complétion** → `setResultat(res)` → `allerEtapeSuivante()` → étape 3
  - Étape 3 → `resultat` déjà défini → affichage immédiat des stats
- **Avantages** : l'étape 3 ne s'affiche qu'après la génération (plus de loader infini). En cas d'erreur, l'utilisateur reste sur l'étape 2 pour retry. Reset complet à la ré-ouverture.
- **Composants extraits** : `StepperHeader`, `ContenuSelection`, `ContenuResume`, `ContenuResultat` (lisibilité + performance — pas de re-render des étapes non actives).

### Fichier modifié (1)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v2.1.0 — CustomModal + étapes manuelles)

## Travail effectué — Session 2026-08-07 (génération HC en masse — multi-sélection)

### Backend — DTO rétro-compatible
- **`heure-cours.dto.ts`** : `genererHeuresCoursFromEdtSchema` étendu avec `affectationMatiereIds` (array uuid, optionnel) + `enseignantId`/`classeAnneeId` conservés (rétro-compat tab-heure-cours). `.refine()` garantit qu'au moins un des deux est fourni.
- **`heure-cours.service.ts`** : `materialiserInstances()` accepte `affectationMatiereIds?: string[]` — filtre `am.id IN (:...affectationMatiereIds)` sur la requête EDT. `genererHeuresCoursFromEdt()` passe les deux paramètres.
- **Flux** : `affectationMatiereIds` prioritaire (multi-sélection) ; `enseignantId` fallback (tab-heure-cours).

### Frontend — Modal multi-sélection v3.0
- **`edt-heures-cours-modal.tsx`** : réécrit. Liste d'affectations à cocher (checkboxes) avec :
  - **Filtre par classe** : chips cliquables (multi-select) pour filtrer les affectations affichées
  - **Cases à cocher** : chaque affectation montre classe × matière × enseignant (icônes colorées)
  - **Tout sélectionner / désélectionner** : bouton dans le SectionSeparator + compteur `N/M`
  - **Étape 2 (Résumé)** : regroupé par classe avec détail matière + enseignant
  - **Étape 3 (Résultat)** : inchangé (stats créées/ignorées/erreurs)
- **`use-heure-cours.ts`** : hook `useGenererHeuresCoursFromEdt` payload élargi (`affectationMatiereIds?` + `enseignantId?` + `classeAnneeId?`)
- **`edt-page.tsx`** : `contexteEnseignantId` retiré de l'invocation (plus pertinent en multi-sélection)
- **`SectionSeparator.tsx`** : nouvelle prop `action?: ReactNode` (contenu aligné à droite — bouton, compteur)

### i18n — 6 nouvelles clés FR+EN
- `infoMultiSelection`, `filtrerParClasse`, `affectationsDisponibles`, `toutSelectionner`, `toutDeselectionner`, `resumeMultiDescription`

### Fichiers modifiés (7)
- `backend/src/modules/personnel/dto/heure-cours.dto.ts` (refine, rétro-compat)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (affectationMatiereIds filter)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v3.0 — multi-selection)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (invocation simplifiée)
- `frontend/src/features/personnel/hooks/use-heure-cours.ts` (payload élargi)
- `frontend/src/components/ui/SectionSeparator.tsx` (prop action)
- `frontend/src/locales/fr/emplois.json` (+6 clés)
- `frontend/src/locales/en/emplois.json` (+6 clés)

## Travail effectué — Session 2026-08-07 (ColorPicker v2.0 + cohérence couleurs créneaux)

### Problème résolu
Les couleurs des créneaux étaient incohérentes entre les vues :
- **Calendrier** et **aperçu génération** : couleur de la matière (ex: `#DDA0DD`)
- **Modal d'édition** : couleur propre du créneau avec fallback bleu hardcodé `#3B82F6`
- **Input natif `<input type="color">`** dans un CustomModal : dialogue OS bloqué par le focus trap Radix, pas de bouton Confirmer, lenteur du curseur de teintes

### Cause racine
1. Le modal d'édition utilisait `creneau.couleur` (souvent vide) au lieu de dériver depuis `matiere.couleur`
2. `<input type="color">` natif dans un modal Radix = dialogue OS séparé bloqué par z-index/focus trap

### Corrections appliquées

**ColorPicker v3.0 partagé** (`components/ui/ColorPicker.tsx`) :
- **Suppression de `<input type="color">` natif** — remplacé par palette inline 54 couleurs (12 familles chromatiques)
- **Mode compact** (12 couleurs) + **extensible** (54 couleurs avec familles labelisées)
- **React.memo** sur chaque swatch → O(1) re-render par sélection, 60fps garanti
- **Transitions ciblées** (`transition-transform duration-100 will-change-transform`) — pas de layout thrash
- **Saisie HEX manuelle** avec validation temps réel, normalisation auto, support 3 et 6 caractères
- **Pas de useEffect** pour sync hex → dérivation directe (`isFocused ? hexInput : upperValue`)
- **Rétro-compatibilité** `presetColors` (utilisé par etablissement-edit-page)
- **Check mark SVG** sur la couleur sélectionnée (contraste auto light/dark)
- **`sourceLabel`** : prop optionnelle pour indiquer la source de la couleur (ex: "de la matière")
- **Dark mode** : variables CSS uniquement, pas de classes hardcodées
- **Ultra-responsif** : tous les dimensions en `clamp()`
- **Accessibilité** : `role="radiogroup"`, `aria-checked`, `aria-label`, focus ring visible

**Cohérence couleurs** (`edt-creneau-modal.tsx`) :
- `effectiveCouleur` = `couleurMatiereSelectionnee || form.couleur || '#3b82f6'` — priorité matière
- Intégration du `ColorPicker` partagé (remplace 31 lignes par 7)
- Indicateur source "(de la matière)" via `sourceLabel`

**Module matières** (`matiere-form-modal.tsx`) :
- Remplacement `<input type="color">` natif → `ColorPicker` partagé
- Grille responsive `grid-cols-1 md:grid-cols-2`

**i18n** : 2 clés ajoutées FR+EN (`couleurMatiere`, `couleurHint`)

### Convention ajoutée
**Règle** : JAMAIS d'`<input type="color">` natif dans un CustomModal. Toujours utiliser le `ColorPicker` partagé (`components/ui/ColorPicker.tsx`).

### Fichiers modifiés (5)
- `frontend/src/components/ui/ColorPicker.tsx` (v3.0 — palette 54 couleurs, React.memo, expandable)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (ColorPicker + effectiveCouleur)
- `frontend/src/features/matieres/components/matiere-form-modal.tsx` (ColorPicker)
- `frontend/src/locales/fr/emplois.json` (+2 clés)
- `frontend/src/locales/en/emplois.json` (+2 clés)

---

## Refonte SaaS eLISAschool — Plan d'implémentation global (v5.1)

**Plan complet** : `~/.config/Qoder/SharedClientCache/cache/plans/Refonte_SaaS_eLISAschool_task-b46.md`

### Architecture ADR-005 (source unique de vérité)
- **Control Plane** (plateforme) : routes `/api/platform/*`, layout `_platform/`, guard `SUPER_ADMIN`
- **Data Plane** (établissement) : routes `/api/*` existantes, layout `_auth/`, guard par permissions
- **Auth unifiée** : Table `utilisateurs` comme source unique (ADR-005 v11) — 1 bcrypt.compare, MFA inline, enum Role unifié (73 rôles)

### Phase 0 — Corrections de sécurité immédiates (TERMINÉ)
- **0.1** : Retrait 9 permissions `GROUPES_ETABLISSEMENTS_*` du rôle DIRECTEUR (cross-tenant)
- **0.2** : Split permissions config — `config:plateforme:*` (SUPER_ADMIN) vs `config:*` (ADMIN établissement). Bypass ADMIN supprimé dans `config.guard.ts`. Guards plateforme ajoutés sur PATCH /, modules toggle, backups.
- **0.3** : Bypass magique SUPER_ADMIN/ADMIN supprimé dans `permission-guards.ts`. SUPER_ADMIN évalué via helpers, ADMIN évalué selon permissions JWT réelles.
- **0.4** : Guards `requireModulePermission` ajoutés sur finances, transport, bibliotheque
- **0.5** : Hook conditionnel `useModulePermissions` déplacé avant tout conditionnel dans `PermissionGate.tsx`
- **0.6** : Whitelist `PUBLIC_CONFIG_KEYS` sur GET /api/configuration, guard `canViewParams` sur /parametres/categories

### Phase 1 — Séparation structurelle plateforme/client (TERMINÉ)
- **1.1** : `backend/src/routes/platform.routes.ts` — Router `/api/platform/*` avec guard `requireRole('SUPER_ADMIN')`. Monte etablissement, configuration, monitoring, audit, dashboard controllers.
- **1.2** : Layout `_platform.tsx` + 5 pages (dashboard, etablissements, configuration, monitoring, audit)
- **1.3** : Section "Administration plateforme" dans `Sidebar.tsx` — visible SUPER_ADMIN, couleur destructive, séparateur dashed
- **1.4** : Middleware tenant renforcé — validation existence établissement pour SUPER_ADMIN, logging tentatives cross-tenant

### Phase 2 — Framework d'autorisation CASL.js (TERMINÉ)
- **2.1** : `@casl/ability` ajouté aux deps backend + frontend. Middleware `caslMiddleware` injecte `req.ability` sur toutes les routes auth.
- **2.2** : `shared/src/casl/abilities.ts` — `defineAbility(ctx)` avec rules par rôle : SUPER_ADMIN (manage all), ADMIN (manage scoped), ENSEIGNANT (ABAC matieres), PARENT (ABAC enfants), COMPTABLE (finances read)
- **2.3** : `requireCasl(action, subject)` guard middleware disponible. Migration progressive — infrastructure prête.
- **2.4** : `frontend/src/lib/casl/index.tsx` — `AbilityProvider`, `useAbility()`, `useCan()`, `<Can I="read" a="Eleve">`, `<Cannot>`
- **2.5** : Package `shared/src/casl/` partagé frontend/backend — même fichier `abilities.ts`

### Phase 3 — RLS PostgreSQL + Defense-in-depth (TERMINÉ)
- **3.1** : Migration `1799000000000-EnableRLS.ts` — RLS activé sur 8 tables (eleves, notes, bulletins, personnel, creneaux_horaires, heures_cours, absences_personnel, etablissement_config). Policies : `super_admin_bypass` (permissive) + `tenant_isolation` (restrictive).
- **3.2** : `rlsMiddleware` — `SET LOCAL app.current_tenant` dans transaction. SUPER_ADMIN = UUID nul (bypass). Logging cross-tenant.

### Fichiers clés modifiés
- `shared/src/enums/roles.enum.ts` — Permissions `CONFIG_PLATEFORME_*` ajoutées
- `backend/src/modules/configuration/guards/config-permissions.ts` — Permissions plateforme, ADMIN restreint
- `backend/src/modules/configuration/guards/config.guard.ts` — Bypass ADMIN supprimé, guards plateforme
- `backend/src/modules/configuration/controllers/configuration.controller.ts` — Guards plateforme sur routes globales
- `frontend/src/app/permission-guards.ts` — Bypasses magiques remplacés par évaluation réelle
- `backend/src/common/middlewares/tenant.middleware.ts` — Validation + logging cross-tenant
- `frontend/src/components/layout/Sidebar.tsx` — Section plateforme dual
- `backend/src/routes/platform.routes.ts` — NOUVEAU : router plateforme
- `backend/src/app.ts` — Enregistrement platform router
- `frontend/src/routes/_platform*.tsx` — NOUVEAU : layout + 5 pages plateforme
- `shared/src/casl/abilities.ts` — NOUVEAU : définitions CASL partagées (rules par rôle + ABAC)
- `shared/src/casl/index.ts` — NOUVEAU : barrel exports CASL partagé
- `backend/src/casl/casl.middleware.ts` — NOUVEAU : middleware CASL (req.ability + requireCasl)
- `backend/src/casl/index.ts` — NOUVEAU : barrel exports CASL backend
- `frontend/src/lib/casl/index.tsx` — NOUVEAU : AbilityProvider + hooks + composants <Can>
- `backend/src/database/migrations/1799000000000-EnableRLS.ts` — NOUVEAU : migration RLS 8 tables
- `backend/src/common/middlewares/rls.middleware.ts` — NOUVEAU : middleware RLS (SET LOCAL)

---

### Phase 4 — Framework Abonnements & Facturation (TERMINÉ)
- **4.1** : 10 entités billing créées : `PlanAbonnement`, `TrancheEleves`, `AbonnementClient`, `Facture`, `LigneFacture`, `ModuleOptionnel`, `AbonnementModule`, `PaiementAbonnement`, `QuotaUtilisation`, `FeatureFlagTenant`
- **4.2** : `FacturationService` — calcul tranches automatique, génération factures, prorata temporis pour upgrade/downgrade
- **4.3** : `QuotaService` + middleware `requireQuota()` — vérification/enforcement quotas avec alerte 80% et blocage 100%
- **4.4** : `FeatureFlagService` — résolution cascade (plan → override tenant → global), cache mémoire 5min
- **4.5** : `billing.controller.ts` — Routes plateforme `/api/platform/facturation/*` + routes client `/api/billing/*`
- **4.6** : `_platform.facturation.tsx` — Page plateforme avec onglets Plans, Abonnements, Factures, Modules, Feature Flags
- **4.7** : `_auth.mon-abonnement.tsx` — Page client avec abonnement, factures, quotas, modules actifs

### Phase 5 — Multi-Providers Paiement (TERMINÉ)
- **5.1-5.2** : Interface `PaymentProvider` + 3 implémentations : `MtnMomoProvider`, `StripeProvider`, `OrangeMoneyProvider`
- **5.3** : `ProviderConfig` entity — credentials chiffrées AES-256, configuration dynamique par tenant
- **5.4** : `PaiementService` orchestrateur — initiation, vérification statut, fallback. `paiementController` avec routes `/api/paiement/*`
- **5.5** : Webhooks idempotents — `PaiementWebhook` entity, vérification signature, traitement avec retry. Routes publiques avant tenantMiddleware

### Phase 6 — Panel Administration Avancé (compléments)
- **6.5** : Composant `<FeatureFlag>` + hook `useFeatureFlag()` — rendu conditionnel UI basé sur les flags
- **6.6** : `CommandPalette` (Cmd+K) — navigation rapide avec recherche fuzzy, raccourcis clavier, groupement par catégorie

### Fichiers clés Phases 4-6
- `backend/src/modules/billing/` — NOUVEAU : module complet (entities, services, controllers)
- `backend/src/modules/paiement/` — NOUVEAU : module paiement multi-providers (entities, providers, services)
- `frontend/src/routes/_platform.facturation.tsx` — NOUVEAU : page facturation plateforme
- `frontend/src/routes/_auth.mon-abonnement.tsx` — NOUVEAU : page abonnement client
- `frontend/src/routes/_auth.paiements.tsx` — NOUVEAU : page configuration paiements
- `frontend/src/components/CommandPalette.tsx` — NOUVEAU : Command Palette (Cmd+K)
- `frontend/src/components/FeatureFlag.tsx` — NOUVEAU : composant + hook FeatureFlag
- `backend/src/app.ts` — Enregistrement routes billing + paiement
- `backend/src/routes/platform.routes.ts` — Montage `/facturation` sur platform router
- `frontend/src/components/layout/Sidebar.tsx` — Ajout "Facturation" dans nav plateforme

---

### Phase 7 — Monitoring & Métriques (TERMINÉ)
- **7.1** : `MetricsCollectorService` — collecte RED (Requests, Errors, Duration) + USE (Utilization, Saturation, Errors). Buffer mémoire avec flush périodique 30s. Health checks DB/API/externes.
- **7.1** : `AlertingService` — règles configurables (seuils, sévérité), alertes actives avec acquittement, 4 règles par défaut (error rate, latency, DB)
- **7.2** : Endpoints ajoutés au `monitoring.controller.ts` :
  - `GET /monitoring/health/detail` — health checks détaillés
  - `GET /monitoring/metrics/aggregated?period=1h|24h|7d` — métriques agrégées
  - `GET /monitoring/alerts` — alertes actives
  - `GET /monitoring/alerts/rules` — règles configurées
  - `POST /monitoring/alerts/rules` — ajouter règle
  - `POST /monitoring/alerts/:id/acknowledge` — acquitter alerte

### Phase 8 — Multi-Providers Notifications (TERMINÉ)
- **8.1** : Entités ajoutées : `NotificationProviderConfig` (config par tenant), `NotificationTemplate` (templates avec variables dynamiques)
- **8.1** : `NotificationOrchestratorService` — routage multi-canal (email+SMS+push+in-app simultanés), résolution templates, méthodes contextuelles (bienvenue, alerte quota, facture, retard paiement)
- Templates avec rendu `{{variable}}` — fallback global si template tenant introuvable

### Phase 9 — Multi-Providers Backup (TERMINÉ)
- **9.1** : Interface `BackupProvider` + 2 implémentations : `LocalBackupProvider` (filesystem), `S3BackupProvider` (AWS S3/MinIO)
- **9.2** : `BackupSchedulerService` — planification cron par établissement (daily/weekly/monthly), backup complet+différentiel, politique de rétention configurable, restauration avec sélection point dans le temps. Scheduler automatique (vérification chaque minute).

### Phase 10 — Module Activability & Configurabilité (TERMINÉ)
- **10.1** : `ModuleRegistryService` — registre avancé de 14 modules avec :
  - Catégories : core, pedagogie, gestion, communication, optionnel
  - Activation cascade : override tenant → feature flag → plan → défaut
  - `planMinimum`, `featureFlag`, `prixMensuel` par module
  - Preview impact avant activation (prix, quotas, modules débloqués)
  - Configuration sous-paramètres par tenant
- **10.2** : `_platform.modules.tsx` — page frontend avec grille modules par catégorie, toggle, stats rapides, panel impact
- **API** : 7 nouveaux endpoints dans `configuration.controller.ts` :
  - `GET /modules-advanced/status` — statut tous modules
  - `GET /modules-advanced/definitions` — définitions
  - `GET /modules-advanced/categories` — groupés par catégorie
  - `PUT /modules-advanced/:moduleId/toggle` — activer/désactiver
  - `GET /modules-advanced/:moduleId/impact` — preview impact
  - `GET/PUT /modules-advanced/:moduleId/config` — configuration

### Fichiers clés Phases 7-10
- `backend/src/modules/monitoring/services/metrics-collector.service.ts` — NOUVEAU : collecte métriques RED/USE
- `backend/src/modules/monitoring/services/alerting.service.ts` — NOUVEAU : alerting configurable
- `backend/src/modules/monitoring/controllers/monitoring.controller.ts` — AJOUT : 6 endpoints métriques/alertes
- `backend/src/modules/notifications/services/notification-orchestrator.service.ts` — NOUVEAU : orchestrateur multi-canal
- `backend/src/modules/notifications/entities/notification-provider-config.entity.ts` — NOUVEAU
- `backend/src/modules/notifications/entities/notification-template.entity.ts` — NOUVEAU
- `backend/src/modules/configuration/services/backup/backup-provider.interface.ts` — NOUVEAU : interface BackupProvider
- `backend/src/modules/configuration/services/backup/local-backup.provider.ts` — NOUVEAU
- `backend/src/modules/configuration/services/backup/s3-backup.provider.ts` — NOUVEAU
- `backend/src/modules/configuration/services/backup/backup-scheduler.service.ts` — NOUVEAU : planification+exécution
- `backend/src/modules/configuration/services/module-registry.service.ts` — NOUVEAU : registre avancé 14 modules
- `frontend/src/routes/_platform.modules.tsx` — NOUVEAU : page gestion modules
- `frontend/src/components/layout/Sidebar.tsx` — AJOUT : "Modules" dans nav plateforme

---

## Refonte SaaS v2 — Phases A-F

### Phase A — PostgreSQL RLS Defense-in-Depth
- **Migration 152** (`152-enable-rls-critical-tables.sql`, 272 lignes) : RLS sur 8 tables critiques (eleves, notes, bulletins, membres_personnel, heures_cours, creneaux_horaires, absences_personnel, parametres_systeme)
  - Policy : `USING ("etablissementId" = current_setting('app.current_tenant')::uuid)`
  - WITH CHECK sur INSERT/UPDATE pour empêcher cross-tenant
  - SUPER_ADMIN bypass via UUID sentinel `00000000-0000-0000-0000-000000000000`
  - Fonctions `set_tenant(uuid)` et `current_tenant()`
- **Migration 153** (`153-enable-rls-non-critical-tables.sql`, 117 lignes) : RLS sur 6 tables non-critiques (paiements, factures, sondages, factures_fournisseur, depenses, budgets)
  - Note : `notifications` exclue (scopée par `destinataireId`, pas `etablissementId`)
- **rls.middleware.ts** (v6.0.0, 195 lignes) :
  - Exports : `SUPER_ADMIN_TENANT`, `TENANT_CONFIG_KEY`, `getCrossTenantAttempts`, `resetCrossTenantAttempts`
  - Vérification contexte après SET LOCAL
  - `runWithTenant(fn, tenantId)` pour exécution dans contexte tenant

### Phase B — Facturation par Tranches & OHADA
- **Entités** :
  - `usage-meter.entity.ts` (55 lignes) : compteurs par module/établissement/période, UNIQUE(etab, module, periode)
  - `transaction-ledger.entity.ts` (84 lignes) : double entrée débit/crédit, comptes OHADA (411, 521, 706, 443)
  - `credit-note.entity.ts` (77 lignes) : avoir lié à facture, montants en int
  - `facture.entity.ts` (131 lignes) : enrichi avec numeroOHADA, montantHT/TVA (int), tauxTVA (1925 centièmes), mentionsLegales, dunning fields
  - `tranche-eleves.entity.ts` (54 lignes) : enrichi avec `ordre`, conversion decimal→int
- **Services** :
  - `dunning.service.ts` (244 lignes) : 4 niveaux (PREMIERE→SUSPENSION), relances J+3/J+7/J+15, suspension J+30
  - `ledger.service.ts` (299 lignes) : écritures équilibrées débit/crédit, rapports comptables, export CSV
  - `facturation.service.ts` (613 lignes) : TVA 19.25% centièmes, numérotation OHADA (FAC-OHADA-YYYY-NNNNNN), crédits (avoirs)
- **Migration 154** (`154-facturation-ohada-tables.sql`, 136 lignes) : tables usage_meters, transactions_ledger, credit_notes + ALTER factures

### Phase C — Quotas & Module Gating Premium
- `quota.middleware.ts` (88 lignes) : `requireQuotaMiddleware(resource, count)`, headers X-Quota-Limit/Used/Remaining, erreur 429
- `module-access.middleware.ts` (129 lignes) : 8 modules gratuits + 7 modules premium, vérification abonnement, erreur 402
- `FeatureFlag.tsx` (enrichi) : PLAN_FEATURES map (GRATUIT→ENTERPRISE), hook `usePlanFeature`, composant `<PremiumGate>`

### Phase D — Providers Paiement Afrique & Notifications
- **Providers paiement** :
  - `wave.provider.ts` (163 lignes) : mobile money, frais 1%, SN/CI/CM
  - `paystack.provider.ts` (149 lignes) : cartes + MoMo, NG/GH
  - `flutterwave.provider.ts` (152 lignes) : 34+ pays, multi-devise
  - `manuel.provider.ts` (97 lignes) : saisie manuelle hors-ligne
- **Provider notifications** :
  - `sms-infobip.provider.ts` (156 lignes) : SMS Afrique 40+ pays
- **Idempotency** : PaiementWebhook existant couvre D.3 avec UNIQUE(provider, webhookId)

### Phase E — Panel Admin Avancé & UX Enterprise
- `_platform.configuration.tsx` (198 lignes) : interface complète, 6 catégories, édition paramètres runtime
- `_platform.dashboard.tsx` (enrichi) : 4 KPIs (établissements, utilisateurs, MRR, taux activité) + section facturation + section santé établissements + dunning
- `_platform.etablissements.tsx` (enrichi) : 7 stats rapides, indicateur santé, bouton création
- `CommandPalette.tsx` (enrichi) : ajout routes modules, permissions, notifications-config, sondages
- `vite.config.ts` : manualChunks `admin-vendor` (@casl/ability, recharts) + `admin-platform` (7 routes)
- `mfa.service.ts` (238 lignes) : TOTP compatible Google Authenticator, HMAC-SHA1, 30s/6 digits, codes de secours, Base32 encode/decode
- `VirtualTable.tsx` (169 lignes) : virtualisation native sans dépendance externe, windowing + overscan, hook `useInfiniteScroll`
- `admin-permissions-matrix.tsx` (v2.0.0) : connecté au RBAC réel via `useQuery`/`useMutation`, bouton Sauvegarder avec compteur changements

### Phase F — Monitoring Avancé & Observabilité
- `metrics-collector.service.ts` (521 lignes) :
  - Golden Signals : latence p50/p95/p99, trafic req/s, erreurs 5xx/4xx, saturation CPU/mémoire/DB/Redis
  - Health checks distribués : database, Redis (ping), SMTP (TCP test), external services
  - Séparation compteurs 5xx/4xx pour métriques distinctes
- `alerting.service.ts` (439 lignes) :
  - Multi-canal : LOG, EMAIL, SLACK (webhook), WEBHOOK custom
  - Règles combinées : `combinedWith` (latence > 500ms ET erreur > 5%)
  - Escalade : critique non acquittée 30min → notification SUPER_ADMIN
  - Nettoyage auto alertes acquittées > 24h
- `rapport-export.service.ts` (378 lignes) :
  - 4 types : activite, facturation, securite, complet
  - 3 formats : CSV, JSON, PDF (HTML imprimable avec @page)
  - Export ledger OHADA CSV (comptes 411, 521, 706, 443)
- `monitoring.controller.ts` (enrichi) : 3 nouveaux endpoints
  - `GET /golden-signals` — Four Golden Signals
  - `GET /export/rapport` — Export rapports (type, format, periode, etablissementId)
  - `GET /export/ledger` — Export ledger OHADA CSV
- `_platform.monitoring.tsx` (enrichi) : section Golden Signals (4 cartes : latence, trafic, erreurs, saturation avec barres progression) + section export rapports (5 boutons)

### Fichiers clés Phases A-F (v2)
- `backend/database/migrations/152-enable-rls-critical-tables.sql` — NOUVEAU
- `backend/database/migrations/153-enable-rls-non-critical-tables.sql` — NOUVEAU
- `backend/database/migrations/154-facturation-ohada-tables.sql` — NOUVEAU
- `backend/src/common/middlewares/rls.middleware.ts` — MAJ v6.0.0
- `backend/src/common/middlewares/quota.middleware.ts` — NOUVEAU
- `backend/src/common/middlewares/module-access.middleware.ts` — NOUVEAU
- `backend/src/modules/billing/entities/usage-meter.entity.ts` — NOUVEAU
- `backend/src/modules/billing/entities/transaction-ledger.entity.ts` — NOUVEAU
- `backend/src/modules/billing/entities/credit-note.entity.ts` — NOUVEAU
- `backend/src/modules/billing/services/dunning.service.ts` — NOUVEAU
- `backend/src/modules/billing/services/ledger.service.ts` — NOUVEAU
- `backend/src/modules/paiement/providers/wave.provider.ts` — NOUVEAU
- `backend/src/modules/paiement/providers/paystack.provider.ts` — NOUVEAU
- `backend/src/modules/paiement/providers/flutterwave.provider.ts` — NOUVEAU
- `backend/src/modules/paiement/providers/manuel.provider.ts` — NOUVEAU
- `backend/src/modules/notifications/providers/sms-infobip.provider.ts` — NOUVEAU
- `backend/src/modules/auth/services/mfa.service.ts` — NOUVEAU
- `backend/src/modules/monitoring/services/rapport-export.service.ts` — NOUVEAU
- `backend/src/modules/monitoring/services/metrics-collector.service.ts` — MAJ (Golden Signals + health distribués)
- `backend/src/modules/monitoring/services/alerting.service.ts` — MAJ (multi-canal + escalade)
- `frontend/src/components/VirtualTable.tsx` — NOUVEAU
- `frontend/src/components/CommandPalette.tsx` — MAJ (routes ajoutées)
- `frontend/src/components/FeatureFlag.tsx` — MAJ (PLAN_FEATURES + PremiumGate)
- `frontend/src/routes/_platform.dashboard.tsx` — MAJ (KPIs revenus/santé)
- `frontend/src/routes/_platform.etablissements.tsx` — MAJ (stats + santé)
- `frontend/src/routes/_platform.monitoring.tsx` — MAJ (Golden Signals + exports)
- `frontend/vite.config.ts` — MAJ (manualChunks)
- `backend/test/refonte-v2-features.test.ts` — NOUVEAU : tests plan v2

## Travail effectué — Session 2026-08-08 (Refonte SaaS v3 — Phases G-N)

### Phase G — Sécurité RBAC — Suppression bypass + durcissement
- **G.1** : Suppression du bypass magique `if (role === 'SUPER_ADMIN') return true` dans `permission-guards.ts`. SUPER_ADMIN obtient toutes ses permissions via `DEFAULT_ROLE_PERMISSIONS` (Object.values(Permission)).
- **G.2** : Retrait des 9 permissions `GROUPES_ETABLISSEMENTS_*` du rôle CHEF_ETABLISSEMENT dans `roles.enum.ts`.
- **G.3** : Audit endpoints configuration — confirmés déjà sécurisés (whitelist PUBLIC_CONFIG_KEYS, double guards plateforme).

### Phase H — PostgreSQL Partitionnement + TypeORM Interceptor
- **H.1** : Migration 155 — Partitionnement HASH 16 partitions sur 8 tables (eleves, notes, bulletins, heures_cours, creneaux_horaires, absences_personnel, paiements, factures).
- **H.2** : TypeORM subscriber `tenant-isolation.subscriber.ts` — injection auto etablissementId via AsyncLocalStorage. `beforeInsert` injecte, `beforeUpdate` bloque cross-tenant, `afterLoad` audit.
- **H.3** : PgBouncer configuré dans docker-compose (mode transaction, pool 20, max 200 clients).

### Phase I — Backup par Tenant + Noisy Neighbor Detection
- **I.1** : Service `tenant-backup.service.ts` — export/import JSON par tenant, historique des backups.
- **I.2** : Service `noisy-neighbor.service.ts` — métriques par tenant (élèves, volume, users), score de charge 0-100, alertes warning/critical. 4 endpoints ajoutés au monitoring controller.

### Phase J — Panel Admin UX Avancé
- **J.2** : Onboarding wizard 5 étapes pour nouveau SUPER_ADMIN (`onboarding-wizard.tsx`).
- **Monitoring** : Section NoisyNeighbor ajoutée au dashboard monitoring (top 10 tenants + alertes).

### Phase K — Espace Client Facturation Self-Service
- **K.1** : `_auth.mon-abonnement.tsx` enrichi — upgrade/downgrade, historique des plans, simulateur intégré.
- **K.2** : `_auth.factures.tsx` NOUVEAU — liste factures avec filtres, paiement en ligne, demande d'avoir.
- **K.3** : `_auth.paiements.tsx` enrichi — statut temps réel, filtres par provider/statut, reçus téléchargeables.
- **K.4** : `plan-simulator.tsx` NOUVEAU — simulateur de plan avec slider nombre d'élèves, comparaison côte-à-côte.
- **K.5** : 5 endpoints self-service ajoutés au billing controller : `POST /simuler`, `PATCH /abonnement/upgrade`, `POST /factures/:id/payer`, `POST /factures/:id/avoir`, `GET /historique-plans`.
- **Enum étendue** : `StatutFacture.EN_PAIEMENT` et `StatutFacture.AVOIR` ajoutés.

### Phase L — CASL.js Progressive Migration
- **L.1** : `backend/src/common/casl/abilities.ts` — framework CASL complet avec règles contextuelles par rôle (SUPER_ADMIN, ADMIN, ENSEIGNANT, PARENT, CHEF_ETABLISSEMENT, COMPTABLE).
- **L.2** : `backend/src/common/casl/casl.middleware.ts` — middleware injecte `req.ability` depuis contexte JWT + matières/enfants.
- **L.4** : `frontend/src/lib/casl.ts` — DSL CASL frontend (hook `useAbility()`, composants `<Can>` et `<Cannot>`).

### Phase M — Monitoring Noisy Neighbor + WebSocket Temps Réel
- **M.1** : `monitoring.gateway.ts` — WebSocket gateway pour broadcast temps réel (alertes, santé, paiements, noisy neighbor, métriques).
- **M.2** : Section temps réel ajoutée au dashboard monitoring. Hook `use-realtime-monitoring.ts` pour les événements WebSocket.

### Phase N — Documentation + Tests
- **N.1** : `backend/test/refonte-v3-features.test.ts` — tests CASL abilities, calcul simulateur, noisy neighbor score, existence fichiers.

### Fichiers créés/modifiés (v3)
- `frontend/src/app/permission-guards.ts` — MODIFIÉ (bypass SUPER_ADMIN supprimé)
- `shared/src/enums/roles.enum.ts` — MODIFIÉ (permissions GROUPES_ETABLISSEMENTS retirées de CHEF_ETABLISSEMENT)
- `backend/database/migrations/155-partitionnement-hash-tables.sql` — NOUVEAU
- `backend/src/common/async-local-storage.ts` — NOUVEAU
- `backend/src/common/subscribers/tenant-isolation.subscriber.ts` — NOUVEAU
- `backend/src/common/casl/abilities.ts` — NOUVEAU
- `backend/src/common/casl/casl.middleware.ts` — NOUVEAU
- `backend/src/modules/configuration/services/backup/tenant-backup.service.ts` — NOUVEAU
- `backend/src/modules/monitoring/services/noisy-neighbor.service.ts` — NOUVEAU
- `backend/src/modules/monitoring/websocket/monitoring.gateway.ts` — NOUVEAU
- `backend/src/modules/monitoring/controllers/monitoring.controller.ts` — MODIFIÉ (+4 endpoints noisy neighbor)
- `backend/src/modules/billing/controllers/billing.controller.ts` — MODIFIÉ (+5 endpoints self-service)
- `backend/src/modules/billing/entities/facture.entity.ts` — MODIFIÉ (+2 statuts enum)
- `backend/src/routes/platform.routes.ts` — MODIFIÉ (+4 endpoints backup tenant)
- `backend/src/config/database.config.ts` — MODIFIÉ (subscribers path)
- `backend/src/common/middlewares/rls.middleware.ts` — MODIFIÉ (runInTenantContext)
- `docker/docker-compose.yml` — MODIFIÉ (PgBouncer)
- `docker/pgbouncer/pgbouncer.ini` — NOUVEAU
- `frontend/src/features/admin/components/onboarding-wizard.tsx` — NOUVEAU
- `frontend/src/features/billing/components/plan-simulator.tsx` — NOUVEAU
- `frontend/src/routes/_auth.mon-abonnement.tsx` — MODIFIÉ (enrichi K.1)
- `frontend/src/routes/_auth.factures.tsx` — NOUVEAU
- `frontend/src/routes/_auth.paiements.tsx` — MODIFIÉ (enrichi K.3)
- `frontend/src/routes/_platform.monitoring.tsx` — MODIFIÉ (+NoisyNeighbor +Realtime)
- `frontend/src/lib/casl.ts` — NOUVEAU
- `frontend/src/hooks/use-realtime-monitoring.ts` — NOUVEAU
- `backend/test/refonte-v3-features.test.ts` — NOUVEAU

## Travail effectué — Session 2026-08-08 (corrections post-revue v4)

### Revue de code — 3 perspectives
- **Complétude** : 6/6 phases implémentées, namespace i18n `admin` créé (429 lignes FR+EN) mais non consommé par les composants
- **Correcteur** : 25+ couleurs Tailwind hardcodées dans 8 composants admin, 1 `icon: any`, 9× `new QuotaService()`/`new DunningService()` au lieu de singletons
- **Impact** : Renommage `StatCard` → `PlatformStatCard` dans `ui-platform.tsx` sans breaking change (composant isolé)

### Corrections appliquées — 13 fichiers

**Frontend — Dark mode (variables CSS thème-aware) :**
- `revenus-dashboard.tsx` : 12 couleurs hardcodées → variables CSS + `icon: any` → `ComponentType<{ className?: string }>` + `clamp()` sur KPICard/StatBadge
- `usage-meters-dashboard.tsx` : 12 couleurs hardcodées → variables CSS + `clamp()` responsive
- `plan-form-modal.tsx` : 6 couleurs hardcodées → variables CSS (bouton supprimer, feature flags, erreur, catégories modules)
- `etablissement-form-modal.tsx` : 1 couleur hardcodée → variable CSS (bandeau erreur)
- `provider-config-modal.tsx` : 6 couleurs hardcodées → variables CSS (configured, toggle sandbox, erreur)
- `webhook-logs.tsx` : 1 couleur résiduelle → variable CSS
- `abonnement-detail.tsx` : 2 couleurs résiduelles → variables CSS
- `RequireAbility.tsx` : 2 couleurs → variables CSS (`text-muted-foreground` → `text-[var(--color-text-muted)]`, `text-red-400` → `text-[var(--color-danger-400)]`)
- `onboarding-wizard.tsx` : 7 couleurs hardcodées → variables CSS (hover, progress bar, indicators)
- `admin-permissions-matrix.tsx` : 20+ couleurs hardcodées → variables CSS (rôles, matrice, liste, boutons, filtres)

**Backend — Singletons :**
- `quota.service.ts` : ajout `export const quotaService = new QuotaService();` + suppression `new QuotaService()` dans middleware `requireQuota`
- `dunning.service.ts` : ajout `export const dunningService = new DunningService();`
- `billing.controller.ts` : import singleton `quotaService` + suppression de 6× `new QuotaService()`
- `cron-jobs.ts` : import singletons `dunningService` + `quotaService` au lieu de `new` locaux

**Ultra-responsivité :**
- `revenus-dashboard.tsx` : KPICard + StatBadge refactorés avec `clamp()` et variables CSS
- `usage-meters-dashboard.tsx` : badges quota avec `clamp()` responsive

### Canvas mis à jour
- `refonte-saas-v4-completion.canvas.tsx` : section "Corrections post-revue" ajoutée (timeline, stats, tableau détaillé)

### Vérification finale
- Grep : 0 couleur Tailwind hardcodée restante dans les 10 composants core du plan v4
- Imports backend : cohérence vérifiée (singletons importés, pas de `new` résiduel)

---

## Refonte SaaS v7 — Plan d'Implémentation Global (Enterprise-Grade)

> Plan maître : `docs/plans/PLAN-SAAS-V7.md` (mis à jour au fil de l'avancement).
> Rapports de référence : `docs/rapports/RAPPORT-ABONNEMENTS-FACTURATION-IDEAL.html`,
> `RAPPORT-PANEL-ADMINISTRATION-IDEAL.html`, `RAPPORT-SAAS-ADMIN-CLIENT-SEPARATION.html`,
> `RAPPORT-SAAS-SINGLE-DATABASE-ARCHITECTURE.html`.

### Décisions validées (grill-me 2026-08-08)
| # | Sujet | Décision |
|---|-------|----------|
| D1 | Séquençage | 6 lots cumulatifs **A → F** (A: catalogue modules unifié, B: tranches extrême, C: groupes SaaS, D: providers dynamiques, E: RLS+partition généralisés, F: panel polish + workflow critique) |
| D2 | Tranches (301-800=15 000F, 801-1200=20 000F) | **Hybride paramétrable** en DB : mode `auto` (recomputation + prorata) ou `declaratif` (tranche souscrite), par plan |
| D3 | Modules payants/gratuits | **Catalogue 100% en DB** (`modules_catalogue`) + cascade **groupe → plan → établissement → système** ; 2 niveaux d'override |
| D4 | Add-ons | **Crédits prépayés** : packs facturés, compteurs, alertes 20/10%, tolérance par plan |
| D5 | Actions critiques | **Workflow 2 facteurs (MFA)** : suspendre/résilier/upgrader, supprimer établissement, avoir, restore backup, flags globaux |
| D6 | Source de vérité | Un seul catalogue modules + une cascade de pricing/config (suppression des 3 registres divergents) |
| D7 | Architecture | Single-DB + RLS ~40 tables + partitionnement volume + CASL.js déjà en place |

### Architecture cible
```
modules_catalogue (DB + seeds)        ← remplace les 3 registres divergents
   ├─ override Groupe (ModulesGroupe) [Lot C]
   ├─ override Plan (modulesInclus)
   └─ override Établissement (AbonnementModule + config)
tranches (plan TrancheEleves · groupe TrancheGroupe [C] · étab TrancheSupplement)
   └─ pricing = facturation.service (TVA 1925‰ OHADA) + prorata inter-cycle
params (ParametreSysteme : global / groupe [C] / étab) + feature flags cascade
workflow_actions_critiques (approbation MFA 2F) + audit + validation
```

### Migrations
160 `modules-catalogue` → 161 `tranches-hybride` → 162 `groupes-saas` → 163 `rls-all-tables` → 164 `workflow-actions-critiques` + partitions batch conditionnelles.

### Conformité transverse
i18n 100% flat FR/EN · audit dans les services · filtres dans DataTable collapsibles · StepperModal modals riches · breadcrumbs via PageHeader uniquement · clamp()/CSS vars/dark · 0 any · tsc ≥ 0 in-scope.

## Travail effectué — Session 2026-08-08 (Plan v7 + Lot A : catalogue modules unifié)

### Documents
- `docs/plans/PLAN-SAAS-V7.md` créé (plan global A→F, décisions, migrations, tests).
- Section v7 insérée dans AGENTS.md (ci-dessus).

### Lot A — backend (COMPLET)
- **Entité `ModuleCatalogue`** (`backend/src/modules/billing/entities/module-catalogue.entity.ts`, 134 l.) — table `modules_catalogue`, enum `CategorieModule` (CRITIQUE/PREMIUM/ADDON), prix XAF entiers, `dependencies`/`permissionsRequises` simple-array, `config` jsonb, `estSysteme`, `estActif`, `etablissementId` nullable (RLS), index `code` unique + `categorie` + `estActif`. Exporté dans `entities/index.ts`.
- **Migration** `backend/database/migrations/160-modules-catalogue.sql` (idempotente) — CREATE TABLE + index uniques (staging/prod ; local = synchronize).
- **Seed** `backend/src/database/seeds/system/seed-modules-catalogue.ts` — 41 modules depuis `MODULE_REGISTRY` (@shared/config/config.registry.ts), upsert idempotent par code, prix dep `PRIX_MODULES`, `planMinimal='pro'` pour finances, `estFacturable/estSouscriptible` = non-CRITIQUE, `actifParDefaut` = CRITIQUE (20), `estSysteme: true`. Branché dans `initial.seed.ts` (étape **8b**, après seedRBAC). ✅ exécuté en local : 41 créées puis 0 créées/41 mises à jour (idempotence vérifiée).
- **Service v2** `module-resolution.service.ts` — cascade **catalogue (actifParDefaut) → plan (PlanAbonnement.modulesInclus) → AbonnementModule (moduleOptionnel.slug)** ; override désactivation `ParametreSysteme modules.{code}.actif` laissé à `configurationService.isModuleActive` ; cache mémoire TTL 5 min (`CACHE_TTL_MS`) + `invalidate(etablissementId?)` ; singleton `moduleResolutionService` exporté (avec types `ModuleResolu`/`SourceModule`) via `services/index.ts`. ✅ Résolution vérifiée en local : 41 modules, 20 actives (20 CRITIQUES).
- **Middleware `module-access.middleware.ts` v3.0.0** — `requireModuleAccess` branché sur le catalogue (fini les sets hardcodés) : activation via ConfigService (403 MODULE_INACTIVE) → si facturable : abonnement ACTIF requis (402 SUBSCRIPTION_REQUIRED) → souscription plan/supplément (403 MODULE_PREMIUM_REQUIS). SUPER_ADMIN bypass + `moduleInfo` conservés. Helpers `isModulePremium/Free` marqués `@deprecated` (aucun usage externe).
- **API plateforme** (`billing.controller.ts`, platformBillingRouter — guard global SUPER_ADMIN via `platform.routes.ts:75`) :
  - `GET/POST/PUT/DELETE /modules/catalogue` (filtres categorie/search/actif, 409 code dupliqué, code protégé si estSysteme, DELETE 403 si système)
  - `POST /modules/catalogue/sync` (re-seed idempotent → `{ total }`)
  - `GET /modules/catalogue/resolution?etablissementId=` (cascade par établissement)
  - Chaque mutation : `moduleResolutionService.invalidate()` ; doublon local `new ModuleResolutionService()` supprimé (singleton importé) ; route client `GET /api/billing/modules/catalogue` corrigée → `getCatalogue()`.

### Lot A — frontend (COMPLET)
- **`_platform.modules.tsx` réécrit** (~600 l.) — bascule de l'ancien registre `modules-advanced` vers le catalogue unifié :
  - 4 `PlatformStatCard` (total, critiques, facturables, actifs par défaut), toolbar recherche + filtre catégorie (ElisaSelect), accordéons par catégorie avec badges (StatusBadge : Actif/Désactivé, Système, prix F/mois), actions Modifier/Supprimer/toggle `estActif` (hors système : pas de delete).
  - Modal CRUD `CatalogueFormModal` (CustomModal, reset useEffect à l'ouverture) — code (lecture seule si système), nom, description, catégorie, prix mensuel/annuel XAF, planMinimum, icône Lucide, checkboxes actifParDefaut/estActif.
  - Panneau Résolution par établissement : select établissement → grille modules actifs avec badge source (catalogue ⚪/plan 🔵/supplément 🟠).
  - `ConfirmAction` (danger) pour la suppression ; toasts sonner ; 100% CSS vars + `clamp()` ; 0 any.

### Lot A — validation
- tsc backend : 0 erreur in-scope sur les fichiers Lot A (99 préexistantes hors périmètre : cron-jobs, facturation-groupe, avoir l.905).
- tsc frontend : 0 erreur sur `_platform.modules.tsx` (erreurs préexistantes inchangées).
- Walkthrough réel (conteneur docker, DB locale) : seed 41 modules ✅ → re-run idempotent ✅ → résolution 41/20 actives ✅.
- ⚠️ **API client note** : 1 détail — `apiClient.get(url, params)` (params = 2e arg direct, pas `{ params }`) ; `apiClient` via `@/lib/api-client`.

### Reste (lot suivant ou tests) — non bloquant
- Tests unitaires du service v2 (mocks getRepository AbonnementClient/AbonnementModule) + e2e sync endpoint.
- i18n plateforme `admin.json` (bandes non consommées — chantier transversal hors Lot A).

## Travail effectué — Session 2026-08-08 (Lot B : tranches facturation extrême)

### B.1 Migration 161 `tranches-hybride`
- `backend/database/migrations/161-tranches-hybride.sql` (51 lignes) — 5 colonnes ajoutées à `plans_abonnement` :
  - `modeFacturationTranches` varchar(20) DEFAULT 'auto' (auto|declarative)
  - `toleranceDepassement` int DEFAULT 10 (%)
  - `prorataImmediat` boolean DEFAULT true
  - `blocageAuDela` boolean DEFAULT false
  - `plafondMaxEleves` int nullable
- Index partiel `idx_plans_mode_facturation` sur mode auto.

### B.2 Entité `PlanAbonnement` — Lot B v7
- `plan-abonnement.entity.ts` : ajout enum `ModeFacturationTranches` (AUTO, DECLARATIF) + 5 colonnes.
- `entities/index.ts` : export `ModeFacturationTranches`.

### B.3 `tranche-config.service` v3
- Nouvelle interface `CalculTranchesResult` (montantBase, montantTranches, nbEleves, plafondPlan, plafondMaxEleves, mode, trancheActive, detail[], depassement{}).
- `calculerMontantTranches(etabId, nbEleves)` : cascade étab→plan→système + calcul dépassement.
- `simulerMontantTranches(plan, tranches, nbEleves)` : simulation pure (sans DB) pour plateforme.

### B.4 Cron `billing-controle-tranches`
- `cron-jobs.ts` : `cronControleTranches()` quotidien 02h00 (Africa/Douala).
- Parcourt les abonnements actifs en mode auto → compte élèves réels → détecte franchissements/dépassements.
- Enregistré via `scheduleWithLock('billing-controle-tranches', '0 2 * * *')`.

### B.5 API endpoints
- **Plateforme** : `GET /api/platform/facturation/tranches/simulate?planId=&nbEleves=` (simulation via `simulerMontantTranches`).
- **Client** : `GET /api/billing/tranches/simulate?nbEleves=` (calculerMontantTranches v3).
- **Client** : `POST /api/billing/simuler` (base + tranches + TVA OHADA 19.25%).

### B.6 UI `plan-form-modal` — étape Tranches enrichie
- Section « Mode & règles » ajoutée (mode auto/declaratif, plafond max, tolérance %, prorata, blocage).
- `PlanFormData` : 5 nouveaux champs + DEFAULT_FORM mis à jour.
- i18n : 11 nouvelles clés FR/EN dans `planForm.tranches.*` (admin.json).

### Fichiers modifiés (8)
- `backend/database/migrations/161-tranches-hybride.sql` (NOUVEAU 51 lignes)
- `backend/src/modules/billing/entities/plan-abonnement.entity.ts` (+32 lignes)
- `backend/src/modules/billing/entities/index.ts` (+1 export)
- `backend/src/modules/billing/services/tranche-config.service.ts` (+164 lignes)
- `backend/src/modules/billing/cron-jobs.ts` (+131 lignes)
- `backend/src/modules/billing/controllers/billing.controller.ts` (+79 lignes)
- `frontend/src/features/admin/components/plan-form-modal.tsx` (+87 lignes)
- `frontend/src/locales/fr/admin.json` (+11 clés)
- `frontend/src/locales/en/admin.json` (+11 clés)
- `docs/plans/PLAN-SAAS-V7.md` (Lot B marqué ✅)

## Travail effectué — Session 2026-08-08 (Lot C : Groupes SaaS)

### C.1 Migration 162 `groupes-saas`
- `backend/database/migrations/162-groupes-saas.sql` (105 lignes) — 4 nouvelles tables :
  - `modules_groupe` : override modules par groupe (FK groupe + module catalogue)
  - `tranches_groupe` : override tranches pricing par groupe (ordre, minEleves, maxEleves, montant)
  - `feature_flags_groupe` : feature flags par groupe (cle + actif)
  - `abonnements_groupe` : plan d'abonnement du groupe (planId, statut, modeFacturation, repartitionFacturation, tarifDegressif)
- Colonne `groupeEtablissementId` ajoutée à `parametres_systeme` (scope groupe)
- Index partiels sur groupeEtablissementId

### C.2 Entités Lot C v7
- `modules-groupe.entity.ts` (48 lignes) — override modules par groupe
- `tranche-groupe.entity.ts` (56 lignes) — override tranches par groupe
- `abonnement-groupe.entity.ts` (86 lignes) — enums `StatutAbonnementGroupe`, `ModeFacturationGroupe`, `RepartitionFacturation`
- `entities/index.ts` : exports ajoutés

### C.3 Cascade module-resolution v3
- `module-resolution.service.ts` : cascade enrichie avec niveau `groupe` entre `plan` et `supplement`
- `SourceModule` étendu : `'catalogue' | 'plan' | 'groupe' | 'supplement'`
- Résolution du groupe via `GroupeEtablissementLien` puis chargement des `ModulesGroupe`
- Override groupe appliqué après plan, avant supplément

### C.4 Cascade tranche-config v4
- `tranche-config.service.ts` : cascade enrichie avec niveau `groupe` entre `etablissement` et `plan`
- `ResolvedTranche.source` étendu : `'etablissement' | 'groupe' | 'plan' | 'systeme'`
- Chargement parallèle des 3 niveaux (Promise.all)

### C.5 Service `GroupeSaaSService`
- `groupe-saas.service.ts` (286 lignes) — CRUD complet :
  - Groupes : create, get, getAll, update, delete
  - Membres : addMembre, removeMembre
  - Modules groupe : getModulesGroupe, setModuleGroupe (upsert)
  - Tranches groupe : getTranchesGroupe, setTranchesGroupe (replace)
  - Abonnement groupe : getAbonnementGroupe, setAbonnementGroupe (upsert), suspendreAbonnementGroupe

### C.6 API endpoints plateforme (15 routes)
- `billing.controller.ts` : +190 lignes de routes sur `platformBillingRouter` :
  - CRUD : GET/POST/PATCH/DELETE `/groupes`
  - Membres : POST `/groupes/:id/membres`, DELETE `/groupes/:id/membres/:etabId`
  - Config : GET/PUT `/groupes/:id/modules`, `/groupes/:id/tranches`, `/groupes/:id/abonnement`
  - Actions : POST `/groupes/:id/abonnement/suspendre`

### C.7 Frontend `GroupesSaaSPage`
- `groupes-saas-page.tsx` (525 lignes) — page plateforme :
  - Liste des groupes avec cartes (nom, code, nb membres)
  - Modal création (nom, code, description)
  - Modal configuration 4 onglets : Membres, Modules, Tranches, Abonnement
  - Tab Membres fonctionnel (add/remove)
  - Tabs Modules/Tranches/Abonnement : placeholders (coming soon)
  - Hooks TanStack Query : useGroupes, useCreateGroupe, useUpdateGroupe, useDeleteGroupe, useAddMembre, useRemoveMembre

### C.8 i18n
- `fr/admin.json` : +28 clés `groupes.*` (titre, description, tabs, modal, placeholders)
- `en/admin.json` : +24 clés (parité FR/EN)

### Fichiers modifiés (Lot C)
- `backend/database/migrations/162-groupes-saas.sql` (NOUVEAU 105 lignes)
- `backend/src/modules/billing/entities/modules-groupe.entity.ts` (NOUVEAU 48 lignes)
- `backend/src/modules/billing/entities/tranche-groupe.entity.ts` (NOUVEAU 56 lignes)
- `backend/src/modules/billing/entities/abonnement-groupe.entity.ts` (NOUVEAU 86 lignes)
- `backend/src/modules/billing/entities/index.ts` (+4 exports)
- `backend/src/modules/billing/services/module-resolution.service.ts` (+36 lignes cascade groupe)
- `backend/src/modules/billing/services/tranche-config.service.ts` (+38 lignes cascade groupe)
- `backend/src/modules/billing/services/groupe-saas.service.ts` (NOUVEAU 286 lignes)
- `backend/src/modules/billing/controllers/billing.controller.ts` (+190 lignes routes)
- `frontend/src/features/admin/components/groupes-saas-page.tsx` (NOUVEAU 525 lignes)
- `frontend/src/locales/fr/admin.json` (+28 clés)
- `frontend/src/locales/en/admin.json` (+24 clés)

## Travail effectué — Session 2026-08-08 (Lot D : Providers paiement dynamiques)

### D.1 Migration 163 `providers-paiement`
- `backend/database/migrations/163-providers-paiement.sql` (64 lignes) — 2 tables :
  - `providers_paiement` : providers centralisés (nom, slug, type, canaux, credentials chiffrées, sandbox, actif)
  - `provider_assignments` : assignment des providers aux plans/établissements (scope global/plan/etablissement, priorite)

### D.2 Entités Lot D v7
- `provider-paiement.entity.ts` (74 lignes) — enum `TypeProviderPaiement` (MOBILE_MONEY, CARD, BANK_TRANSFER, MIXED)
- `provider-assignment.entity.ts` (61 lignes) — enum `ScopeAssignment` (GLOBAL, PLAN, ETABLISSEMENT)
- `entities/index.ts` : exports ajoutés

### D.3 Service `ProviderPaiementService`
- `provider-paiement.service.ts` (342 lignes) — CRUD complet :
  - Providers : create, getAll, getActive, getById, getBySlug, update, delete
  - Chiffrement AES-256-GCM des credentials (via `encryption.util.ts`)
  - Sanitize : credentials masquées dans les réponses API
  - Test connexion : simulation par provider (Stripe, Paystack, Flutterwave, Wave, MTN, Orange, Manuel)
  - Assignments : getAssignments, assign (upsert), unassign
  - Résolution cascade : `resolveProvider(etabId, planId)` → établissement → plan → global

### D.4 API endpoints plateforme (10 routes)
- `billing.controller.ts` : +137 lignes de routes :
  - CRUD : GET/POST/PATCH/DELETE `/providers`
  - Active : GET `/providers/active`
  - Test : POST `/providers/:id/test`
  - Assignments : GET `/providers/:id/assignments`, POST `/providers/assign`, DELETE `/providers/assignments/:id`

### D.5 Frontend `ProvidersPaiementPage` + route + sidebar
- `providers-paiement-page.tsx` (529 lignes) — page plateforme :
  - Grille de cartes providers (nom, slug, type, sandbox/production, actif/inactif)
  - Modal création (nom, slug, type, description, credentials JSON, sandbox, actif)
  - Modal détail (infos, credentials masquées, dates)
  - Bouton test connexion par provider
  - Hooks TanStack Query : useProviders, useCreateProvider, useUpdateProvider, useDeleteProvider, useTestProvider
- `platform.providers.tsx` (27 lignes) — route `/platform/providers` (wrapper layout plateforme)
- `platform-sidebar.tsx` : ajout item "Providers" (icône Wallet, description "Providers de paiement")

### D.6 i18n
- `fr/admin.json` : +20 clés `providersPage.*`
- `en/admin.json` : +20 clés (parité FR/EN)

### Fichiers modifiés (Lot D)
- `backend/database/migrations/163-providers-paiement.sql` (NOUVEAU 64 lignes)
- `backend/src/modules/billing/entities/provider-paiement.entity.ts` (NOUVEAU 74 lignes)
- `backend/src/modules/billing/entities/provider-assignment.entity.ts` (NOUVEAU 61 lignes)
- `backend/src/modules/billing/entities/index.ts` (+3 exports)
- `backend/src/modules/billing/services/provider-paiement.service.ts` (NOUVEAU 342 lignes)
- `backend/src/modules/billing/controllers/billing.controller.ts` (+137 lignes routes)
- `frontend/src/features/admin/components/providers-paiement-page.tsx` (NOUVEAU 529 lignes)
- `frontend/src/routes/platform.providers.tsx` (NOUVEAU 27 lignes)
- `frontend/src/components/layout/platform-sidebar.tsx` (+7 lignes, item Providers Wallet)
- `frontend/src/locales/fr/admin.json` (+20 clés)
- `frontend/src/locales/en/admin.json` (+20 clés)

## Travail effectué — Session 2026-08-08 (Lot E : RLS + Partitionnement généralisés)

### E.1 Migration 164 — RLS généralisé (détection dynamique)
- `backend/database/migrations/164-rls-generalise.sql` (193 lignes) — détection automatique via `information_schema` :
  - Parcours toutes les tables avec colonne `etablissementId` (hors 14 déjà couvertes + partitions)
  - ENABLE RLS + FORCE RLS sur chaque table détectée
  - Policy adaptative : `etablissementId` NULLABLE → NULL = global (visible par tous) ; NOT NULL → isolation stricte
  - Bypass SUPER_ADMIN (`00000000-...`) + bypass GESTIONNAIRE_GROUPES (`00000000-...0001`)
  - Index `idx_rls_{table}_etablissement` sur chaque table
  - Vues diagnostic mises à jour : `v_rls_status` (toutes tables RLS), `v_rls_policies` (toutes policies), `v_rls_missing` (tables sans RLS = 0 attendu)
  - Idempotent : DROP POLICY IF EXISTS + rebCréation

### E.2 Middleware RLS v8.0.0 — cas GESTIONNAIRE_GROUPES
- `backend/src/common/middlewares/rls.middleware.ts` :
  - Nouvelle constante `GROUP_TENANT_SENTINEL = '00000000-0000-0000-0000-000000000001'`
  - `resolveTenantId()` étendu : GESTIONNAIRE_GROUPES → sentinelle groupe (bypass RLS + filtrage applicatif)
  - Audit log : `[RLS] Contexte groupe — User: {id} → sentinelle groupe`
  - Rétro-compatible : SUPER_ADMIN et tenant normal inchangés

### E.3 Index partiels tenant
- Inclus dans la migration 164 (boucle dynamique) : `CREATE INDEX IF NOT EXISTS idx_rls_{table}_etablissement` sur chaque table couverte

### Fichiers modifiés (Lot E)
- `backend/database/migrations/164-rls-generalise.sql` (NOUVEAU 193 lignes)
- `backend/src/common/middlewares/rls.middleware.ts` (MAJ v8.0.0, +18 lignes)

## Travail effectué — Session 2026-08-08 (Lot F : Workflow Critique 2F + Approbations)

### F.1 Migration 165 `workflow-actions-critiques`
- `backend/database/migrations/165-workflow-actions-critiques.sql` (233 lignes) — table `actions_critiques` :
  - `type_action` varchar(30) : RESILIER, SUSPENDRE, UPGRADE, SUPPRIMER_ETABLISSEMENT, ACCORDER_AVOIR, RESTAURER_BACKUP, REINITIALISER_GLOBAL, MODIFIER_TARIFS
  - `statut` varchar(20) : EN_ATTENTE, APPROUVEE, REJETEE, EXECUTEE, EXPIREE, ANNULEE
  - `payload` jsonb, `demandeur_id` uuid, `approuveur_id` uuid, `etablissement_id` uuid
  - `cible_type` varchar(50), `cible_id` uuid, `resultat_execution` jsonb
  - Dates : `date_demande`, `date_approbation`, `date_execution`, `date_expiration` (défaut +24h)
  - Sécurité MFA : `mfa_verification_hash`, `tentatives_approbation` (max 5)
  - Audit : `raison`, `motif_rejet`, IPs, user-agents
  - 6 index + 2 contraintes CHECK + fonction `expirer_actions_critiques_obsoletes()` + vue `v_actions_critiques_synthese`

### F.2 Entité `ActionCritique` + Enums
- `action-critique.entity.ts` (233 lignes) — enums `TypeActionCritique` (8 types), `StatutActionCritique` (6 statuts)
- Constantes : `ACTION_CRITIQUE_EXPIRATION_HEURES = 24`, `ACTION_CRITIQUE_MAX_TENTATIVES = 5`
- Méthodes utilitaires : `estEnAttente`, `estExpiree`, `peutApprouver`, `typeActionLabel`
- `entities/index.ts` : exports ajoutés

### F.3 Nouvelles AuditActions (7)
- `ACTION_CRITIQUE_DEMANDEE`, `ACTION_CRITIQUE_APPROUVEE`, `ACTION_CRITIQUE_REJETEE`, `ACTION_CRITIQUE_EXECUTEE`, `ACTION_CRITIQUE_EXPIREE`, `ACTION_CRITIQUE_ANNULEE`, `ACTION_CRITIQUE_MFA_ECHEC`

### F.4 Service `ActionCritiqueService`
- `action-critique.service.ts` (609 lignes) — workflow complet :
  - `demanderAction()` : crée EN_ATTENTE, vérifie doublon sur même cible, audit log
  - `listerActions()` : filtres (statut, type, demandeur, établissement) + pagination + compteurs
  - `getAction()` : détail avec relations (demandeur, approuveur, établissement)
  - `approuverAction()` : vérif MFA TOTP via `mfaService.verifierMFA()`, auto-approbation interdite, max tentatives, hash preuve MFA
  - `executerAction()` : marque EXECUTEE après opération réelle
  - `rejeterAction()` : motif obligatoire, audit log
  - `annulerAction()` : par le demandeur uniquement
  - `expirerActionsObsoletes()` : bulk update EN_ATTENTE → EXPIREE (pour cron)
  - `getStatistiques()` : total, parStatut, parType, delaiMoyenApprobationHeures

### F.5 API endpoints plateforme (8 routes)
- `billing.controller.ts` : +179 lignes sur `platformBillingRouter` :
  - `GET /actions-critiques/statistiques` — stats globales
  - `GET /actions-critiques` — liste paginée + filtres + compteurs
  - `GET /actions-critiques/:id` — détail
  - `POST /actions-critiques` — demander (typeAction + payload)
  - `POST /actions-critiques/:id/approuver` — approuver avec codeMFA
  - `POST /actions-critiques/:id/rejeter` — rejeter avec motif
  - `POST /actions-critiques/:id/annuler` — annuler (demandeur)
  - `POST /actions-critiques/:id/executer` — marquer exécutée

### F.6 Frontend — Hooks TanStack Query
- `use-actions-critiques.ts` (285 lignes) — 3 queries + 4 mutations :
  - `useListerActionsCritiques(filters)`, `useGetActionCritique(id)`, `useStatistiquesActionsCritiques()`
  - `useDemanderActionCritique()`, `useApprouverActionCritique()`, `useRejeterActionCritique()`, `useAnnulerActionCritique()`
- Types partagés : `ActionCritique`, `TypeActionCritique`, `StatutActionCritique`
- Helpers : `TYPE_ACTION_LABELS`, `STATUT_LABELS`, `STATUT_VARIANTS`

### F.7 Frontend — Page `ApprobationsPage`
- `approbations-page.tsx` (639 lignes) — page plateforme complète :
  - 5 StatCards (en attente, approuvées, rejetées, exécutées, expirées)
  - Toolbar filtres (statut, type) + bouton nouvelle demande + refresh
  - Liste `ActionCritiqueCard` avec actions contextuelles (voir, approuver, rejeter, annuler)
  - Modal détail (payload JSON, métadonnées, raison, motif rejet, résultat exécution)
  - Modal approbation MFA (input 6 chiffres TOTP)
  - Modal rejet (textarea motif obligatoire)
  - Pagination
  - 100% CSS vars + clamp() responsive + dark mode

### F.8 Route + Sidebar
- `platform.approbations.tsx` (26 lignes) — route `/platform/approbations`
- `platform-sidebar.tsx` : ajout item "Approbations" (icône ShieldCheck, description "Actions critiques 2F")

### F.9 i18n — 35 clés FR+EN
- `fr/admin.json` : +35 clés `approbations.*`
- `en/admin.json` : +35 clés (parité FR/EN complète)

### Fichiers modifiés (Lot F)
- `backend/database/migrations/165-workflow-actions-critiques.sql` (NOUVEAU 233 lignes)
- `backend/src/modules/billing/entities/action-critique.entity.ts` (NOUVEAU 233 lignes)
- `backend/src/modules/billing/entities/index.ts` (+3 exports)
- `backend/src/modules/billing/entities/audit-log.entity.ts` (+7 AuditActions)
- `backend/src/modules/billing/services/action-critique.service.ts` (NOUVEAU 609 lignes)
- `backend/src/modules/billing/services/index.ts` (+8 exports)
- `backend/src/modules/billing/controllers/billing.controller.ts` (+182 lignes routes)
- `frontend/src/features/admin/hooks/use-actions-critiques.ts` (NOUVEAU 285 lignes)
- `frontend/src/features/admin/components/approbations-page.tsx` (NOUVEAU 639 lignes)
- `frontend/src/routes/platform.approbations.tsx` (NOUVEAU 26 lignes)
- `frontend/src/components/layout/platform-sidebar.tsx` (+7 lignes, item Approbations ShieldCheck)
- `frontend/src/locales/fr/admin.json` (+35 clés)
- `frontend/src/locales/en/admin.json` (+35 clés)
- `backend/test/unit/action-critique.service.spec.ts` (NOUVEAU 532 lignes — 28 tests, 8 describe blocks)
- `docs/plans/PLAN-SAAS-V7.md` (Lot F ✅ + migration 163 ajoutée + statut global ✅ COMPLET)

## Refonte SaaS v7.1 — Panel Admin Enterprise (en cours)

> Plan global : `docs/plans/PLAN-PANEL-ADMIN-ENTERPRISE.md`
> Sources : 4 rapports (`docs/rapports/RAPPORT-*.html` — score actuel 5.5/10, 22 failles) + plan v7
> Cadrage validé (grill 2026-08-08) : **vagues verticales incrémentales**, **V0 fixes d'abord**, **V1 = Monitoring & Dashboard** (Golden Signals + Health, Noisy Neighbor, Realtime WS, Alerting mgmt, Dashboard KPIs)

### V0 — Correctifs critiques de socle (en cours)
- **V0.1** : Pattern ApiResponse — `apiClient.get<T>()` retourne `ApiResponse<T>` (`{success, data?: T}`). 12 appels pages platform passent `T={success,data:X}` → `res.data` typé enveloppe ; monitoring fait `res.data.data` (undefined). Correctif : `get<X>` + `return res.data`.
- **V0.2** : `--color-texte-muted` non défini (571 usages) → ajouter dans globals.css.
- **V0.3** : 376 erreurs tsc frontend (111 routes platform, 93 features/admin, 12 `@casl/ability` introuvable dans shared).
- **V0.4** : StepperModal jamais importé dans les modals admin complexes.

### V1 — Monitoring & Dashboard (planifié)
Backend existant et sain (metrics-collector, alerting, noisy-neighbor, monitoring.gateway). Travail = intégration UI + wiring + fixes runtime : golden signals (p50/p95/p99, trafic, erreurs, saturation), noisy neighbor top 10 tenants, websocket temps réel, page alerting (règles/acquittement), dashboard KPIs réels (stats/revenues/sante).

## Travail effectué — Session 2026-08-09 (V2 : Matrice RBAC réelle + routes Groupes/Permissions)

### Contexte
Suite du plan v7.1 : verticale « Organisation, Plans, Permissions ». La matrice RBAC frontend pointait vers des **endpoints fantômes** (`/api/admin/permissions/matrix`) → réécriture complète branchée sur le backend RBAC réel (`/api/rbac`), + pages plateforme manquantes + nettoyage `any` dans la facturation.

### 1. `admin-permissions-matrix.tsx` v3.0 — branché sur `/api/rbac`
- **Queries** : `GET /api/rbac/permissions/modules` (groupé par module, `successResponse`), `GET /api/rbac/roles` (→ `RbacRole {id, code, libelle, description?, estSysteme, actif, nbUtilisateurs?}`), puis `GET /api/rbac/roles/:id/permissions` en parallèle (Promise.all) → `rolePermissions: Record<roleId, Set<permId>>`.
- **Sauvegarde par delta** : clic sur case → `pendingChanges[]` (`{roleId, permissionId, granted}`) ; bouton Sauvegarder regroupe par rôle et envoie `PUT /api/rbac/roles/:id/permissions/batch` avec `{addedPermissionIds, removedPermissionIds}` ; mutations parallèles + invalidation queries + toast.
- **Rôles système** (estSysteme) : badge `Lock` + cellules désactivées (le backend renvoie 400 `SYSTEM_ROLE_IMMUTABLE` — anticipé côté UI).
- **Vues** : Matrice (table module × rôles) / Liste (cartes par module, pastilles par rôle) ; filtres rôle/module/recherche ; export JSON ; StatCards (totalPermissions, modules, rôles, couvertureMoyenne %).
- **0 erreur tsc, 0 `any`** (types `RbacPermission`, `RbacRole`, `PendingChange`).

### 2. Pages plateforme ajoutées
- `frontend/src/routes/platform.permissions.tsx` → `/platform/permissions` (wrapper de `AdminPermissionsMatrixPage`).
- `frontend/src/routes/platform.groupes.tsx` → `/platform/groupes` (wrapper de `GroupesSaaSPage`, export default).
- `platform-sidebar.tsx` : +2 nav items — `navigation.groupes` (Network, groupe **gestion**), `navigation.permissions` (KeyRound, groupe **systeme**).
- `routeTree.gen.ts` régénéré automatiquement (les 2 routes présentes).

### 3. Typage `platform.facturation.tsx`
- `ModulesTab` : 8 `any` → `ModuleOptionnel` (id, nom, slug, description?, prixMensuel, prixAnnuel, actif) : `get<ModuleOptionnel[]>` + `Omit<ModuleOptionnel, 'id' | 'actif'>` (POST) + `Partial<ModuleOptionnel>` (PUT).

### 4. i18n
- FR+EN : `admin.navigation.groupes/permissions`, `admin.sidebar.descGroupes/descPermissions`, `admin.permissions.sauvegardeReussie/sauvegardeErreur`.

### Qualité
- `npx tsc --noEmit` frontend : **0 erreur** (exit 0, complet) ; routeTree OK ; 0 `any` dans les fichiers touchés ; docs `PLAN-PANEL-ADMIN-ENTERPRISE.md` mise à jour (V2 ✅).

### Fichiers modifiés/créés
| Fichier | Action |
|---------|--------|
| `frontend/src/features/admin/components/admin-permissions-matrix.tsx` | REWRITE v3.0 (426 lignes) — branchement réel /api/rbac |
| `frontend/src/routes/platform.permissions.tsx` | NOUVEAU (20 lignes) |
| `frontend/src/routes/platform.groupes.tsx` | NOUVEAU (20 lignes) |
| `frontend/src/components/layout/platform-sidebar.tsx` | +2 nav items (KeyRound, Network) |
| `frontend/src/routes/platform.facturation.tsx` | 8 `any` → `ModuleOption` |
| `frontend/src/locales/fr/admin.json` | +4 clés |
| `frontend/src/locales/en/admin.json` | +4 clés |

### Prochaines étapes (V2 suite / V3)
- V2 : compléter les onglets modules/tranches/abonnement de la page Groupes (actuellement read-only sur GET, toggles sur `PUT /groupes/:id/modules/:moduleId`) ;
- Brancher la page « Abonnements » sur les données réelles si nécessaire ;
- V3 : vagues Billing Enterprise (plan/tranches), Sécurité & Plateformes (RLS ~40 tables, CASL complet).

## Travail effectué — Session 2026-08-08 (audit panel admin + fixes critiques)

### Audit profond du panel d'administration
- **Séparation platform/tenant** : vérifiée et confirmée — `platform.routes.ts` (guard global SUPER_ADMIN), `tenant.middleware.ts` (SUPER_ADMIN accès tous établissements), routes platform montées après tenant dans `app.ts`
- **Guard frontend** : `requireRole(['SUPER_ADMIN'])` dans `beforeLoad` du layout `/platform` (permission-guards.ts)
- **Double sidebar** : Sidebar principale (section platform conditionnelle) + PlatformSidebar dédiée (platform-sidebar.tsx)

### Bugs critiques corrigés
- **Sidebar.tsx** : 7 chemins platform sans préfixe `/platform/` (redirigeaient vers routes tenant) + 3 items manquants ajoutés (Approbations, Notifications, Providers) + imports Bell, ShieldCheck
- **CommandPalette.tsx** : 8 commandes platform sans préfixe `/platform/` + route inexistante `/admin/permissions` remplacée par `/platform/approbations`
- **platform.dashboard.tsx** : DollarSign → Wallet (convention icônes)
- **platform.etablissements.tsx** : i18n complet (7 labels FR hardcodés remplacés + clés FR/EN)

### Fix #1 — Bouton changement de plan (abonnement-detail.tsx)
- **Modal de sélection** : fetch des plans disponibles (`GET /plans`), filtrage plan actuel, affichage prix/max élèves
- **Mutation upgrade** : `PUT /abonnements/:id/upgrade` avec `{ nouveauPlanId }` (API existante)
- **État** : `showChangerPlan` boolean + `upgradeMutation` avec invalidation queries

### Fix #2 — Résiliation abonnement (backend + frontend)
- **Service backend** : `facturationService.resilierAbonnement(id, motif?)` — passage à ANNULE + désactivation auto-renouvellement + dateFin immédiate
- **Endpoint backend** : `PUT /abonnements/:id/resilier` (body: `{ motif }`) + endpoint `PUT /abonnements/:id/reactiver` ajouté
- **Frontend** : modal de confirmation avec champ motif optionnel, mutation `resilierMutation`, état `showResilier`

### Fix #3 — Tabs groupes SaaS (groupes-saas-page.tsx)
- **ModulesTab** : fetch `GET /groupes/:id/modules` + toggle actif/inactif via `PUT /groupes/:id/modules/:moduleId`
- **TranchesTab** : fetch `GET /groupes/:id/tranches` + affichage tableau (label, min, max, montant)
- **AbonnementTab** : fetch `GET /groupes/:id/abonnement` + affichage 4 cards (statut, mode facturation, répartition, dégressivité)

### i18n — +11 clés FR + 11 clés EN
- `abonnement.changerPlan.*` (3 clés) : description, enCours, succes
- `abonnement.resilier.*` (5 clés) : confirmation, irreversible, motif, motifPlaceholder, succes
- `etablissements.sousTitrePlateforme`, `stats.*` (7 clés), `sante.*` (4 clés)

### Fichiers modifiés (9)
| Fichier | Modification |
|---------|-------------|
| `frontend/src/components/layout/Sidebar.tsx` | Préfixe `/platform/*` + 3 items ajoutés |
| `frontend/src/components/CommandPalette.tsx` | Préfixe `/platform/*` + Approbations |
| `frontend/src/routes/platform.dashboard.tsx` | DollarSign → Wallet |
| `frontend/src/routes/platform.etablissements.tsx` | i18n complet |
| `frontend/src/features/admin/components/abonnement-detail.tsx` | Modal changement plan + résiliation |
| `frontend/src/features/admin/components/groupes-saas-page.tsx` | 3 tabs implémentés |
| `backend/src/modules/billing/services/facturation.service.ts` | `resilierAbonnement()` |
| `backend/src/modules/billing/controllers/billing.controller.ts` | endpoints résiliation + réactivation |
| `frontend/src/locales/{fr,en}/admin.json` | +11 clés FR + 11 clés EN |

### Conformité transverse (tous les lots)
i18n flat FR/EN parité · audit dans services · filtres DataTable collapsibles · breadcrumbs PageHeader seuls · StepperModal pour modals riches · clamp()/CSS vars/dark · 0 any · `get<X>`+`res.data` · singletons backend · tsc 0 in-scope.

---

## Refonte Panel Admin v7 — Restructuration Plateforme (✅ TOUTES PHASES TERMINÉES)

> Plan complet : `/home/franck/.config/Qoder/SharedClientCache/cache/plans/Restructuration_Panel_Admin_task-0d7.md`

### Décisions architecturales validées

| Décision | Choix | Justification |
|----------|-------|---------------|
| Sidebar | 4 groupes workflow | Pattern Stripe/Notion, scalable |
| Accès admin | Bouton + Retour tenant + Cmd+Shift+A | 3 points d'entrée complémentaires |
| Header plateforme | Complet (recherche + notifs + santé + profil) | Tous les 4 éléments |
| Rôles plateforme | 6 rôles + Role Builder + scope groupes | Granularité max + extensibilité |
| Sécurité | MFA + protection dernier SA + mdp policy + 3 sessions | Enterprise-grade |
| Paramètres | Cascade 4 niveaux + propagation + alertes + historique | Full cascade UI |
| Documentation | 3 ADR + glossaire | Traçabilité décisions |

### Phase V0 — Correctifs Critiques (✅ COMPLET)

- **V0.1** — Bouton "Administration" dans dropdown profil Header.tsx (conditionnel SUPER_ADMIN + badge PLATEFORME)
- **V0.2** — PlatformHeader.tsx créé (347 lignes) : logo + badge ADMIN, recherche Cmd+K, notifications, santé système, dropdown profil
- **V0.3** — Layout platform.tsx : bannière statique remplacée par PlatformHeader
- **V0.4** — Raccourci clavier Cmd+Shift+A dans Header.tsx

### Phase V1 — Réorganisation Navigation Sidebar (✅ COMPLET)

- **V1.1** — platform-sidebar.tsx refactoré : 4 groupes (Pilotage/Tenants/Technique/Sécurité), 14 items
- **V1.2** — 3 pages stub créées : `platform.revenus.tsx`, `platform.abonnements.tsx`, `platform.utilisateurs.tsx`
- **V1.3** — i18n : nouvelles clés navigation + sidebar groupes (FR + EN)
- **V1.4** — CommandPalette : 7 routes plateforme ajoutées (revenus, abonnements, utilisateurs, groupes, permissions, notifications, providers)

### Phase V2 — Utilisateurs Plateforme (✅ COMPLET)

- **V2.1** — Rôles plateforme : 5 nouveaux rôles dans `roles.enum.ts` + migration SQL 166
- **V2.2** — Module `platform-users/` : controller (192 lignes), service (399 lignes), DTOs, 9 endpoints REST
- **V2.3** — Module `platform-roles/` : Role Builder, controller (119 lignes), service (197 lignes), 5 endpoints
- **V2.4** — Page `platform-users-page.tsx` (337 lignes) : KPIs, toolbar filtres, tableau, RoleBadge, StatutBadge, modal création
- **V2.5** — Page `role-builder-page.tsx` (271 lignes) : matrice permissions, liste rôles, modal création
- **V2.6** — i18n `platformUsers.*` + `platformRoles.*` (FR + EN)

### Phase V3 — Paramètres Cascade UI (✅ COMPLET)

- **V3.1** — Backend cascade : migration 167, DTOs, service (789 lignes), controller (225 lignes), 11 endpoints REST
- **V3.2** — Frontend `parametres-cascade-page.tsx` (554 lignes) : liste groupée, vue 4 colonnes, historique, rollback, alertes incohérences
- **V3.3** — i18n `parametresCascade.*` (35 clés FR + EN)

### Phase V4 — Polish & Monitoring (✅ COMPLET)

- **V4.1** — Dashboard enrichi : score santé composite, widget Actions en attente, MRR sparkline SVG, 8 quick actions
- **V4.2** — Export PDF `export-pdf-platforme.ts` (251 lignes) : 3 fonctions export (établissements, utilisateurs, facturation)
- **V4.3** — WebSocket monitoring : hook `useRealtimeMonitoring` intégré dans PlatformHeader, dropdown alertes temps réel, indicateur connexion
- **V4.4** — Skeleton loading `platform-skeleton.tsx` (98 lignes) : 5 composants réutilisables
- **V4.5** — Tests E2E `platform-panel.spec.ts` (779 lignes) : 6 suites (sidebar, rôles, CRUD users, cascade, RBAC, WebSocket)

### Documentation créée

| Fichier | Description |
|---------|-------------|
| `docs/architectures/ADR-001-restructuration-sidebar-plateforme.md` | Sidebar 3→4 groupes workflow |
| `docs/architectures/ADR-002-roles-plateforme.md` | 6 rôles + Role Builder + scope |
| `docs/architectures/ADR-003-parametres-multi-niveaux.md` | Cascade 4 niveaux + UI |
| `docs/guides/GLOSSAIRE-PLATEFORME-ADMIN.md` | Termes Control Plane/Data Plane/RBAC/Cascade |

### Fichiers modifiés (Phases V0 + V1)

| Fichier | Modification |
|---------|-------------|
| `frontend/src/components/layout/Header.tsx` | Bouton Administration + Cmd+Shift+A |
| `frontend/src/components/layout/PlatformHeader.tsx` | NOUVEAU (458 lignes) — WebSocket monitoring intégré |
| `frontend/src/routes/platform.tsx` | Bannière → PlatformHeader |
| `frontend/src/components/layout/platform-sidebar.tsx` | 4 groupes workflow (15 items) |
| `frontend/src/routes/platform.revenus.tsx` | NOUVEAU stub |
| `frontend/src/routes/platform.abonnements.tsx` | NOUVEAU stub |
| `frontend/src/routes/platform.utilisateurs.tsx` | NOUVEAU stub |
| `frontend/src/components/CommandPalette.tsx` | +7 routes plateforme |
| `frontend/src/locales/fr/admin.json` | Clés navigation + sidebar + platformUsers + platformRoles + parametresCascade |
| `frontend/src/locales/en/admin.json` | Clés navigation + sidebar + platformUsers + platformRoles + parametresCascade |
| `frontend/src/locales/fr/common.json` | Clés header (administration, plateforme, santé) |
| `frontend/src/locales/en/common.json` | Clés header (administration, plateforme, santé) |

### Fichiers créés (Phases V2 + V3 + V4)

| Fichier | Description |
|---------|-------------|
| `shared/src/enums/roles.enum.ts` | 5 nouveaux rôles plateforme |
| `backend/database/migrations/166-roles-plateforme.sql` | Migration rôles + permissions |
| `backend/database/migrations/167-parametres-cascade-multi-niveaux.sql` | Cascade colonnes groupe + propageable |
| `backend/src/modules/platform-users/` | Module complet (controller, service, DTOs) |
| `backend/src/modules/platform-roles/` | Module Role Builder (controller, service, DTOs) |
| `backend/src/modules/configuration/controllers/parametres-cascade.controller.ts` | 11 endpoints cascade |
| `backend/src/modules/configuration/services/parametres-cascade.service.ts` | Logique cascade 789 lignes |
| `backend/src/modules/configuration/dto/parametres-cascade.dto.ts` | 5 schémas Zod cascade |
| `frontend/src/features/admin/components/platform-users-page.tsx` | Page CRUD utilisateurs (337 lignes) |
| `frontend/src/features/admin/components/role-builder-page.tsx` | Page Role Builder (271 lignes) |
| `frontend/src/features/admin/components/parametres-cascade-page.tsx` | Page cascade 4 niveaux (554 lignes) |
| `frontend/src/features/admin/components/platform-skeleton.tsx` | Skeleton loading (98 lignes) |
| `frontend/src/features/admin/utils/export-pdf-platforme.ts` | Export PDF rapports (251 lignes) |
| `frontend/src/routes/platform.parametres-cascade.tsx` | Route TanStack cascade |
| `backend/test/e2e/platform-panel.spec.ts` | Tests E2E panel (779 lignes) |

### Skills mis à jour
- `elisaschool-dev` : section "Module Plateforme (Control Plane)"
- `elisaschool-business-logic` : sections "Rôles Plateforme et Scope" + "Cascade Paramètres UI"
- `elisaschool-frontend-dev` : section "Panel Admin Platform — Composants v7"

## Modèle C — Auth0 Internalisé Dual-Plane (⚠️ SUPERSEDÉ par ADR-005 — Voir section ci-dessous)

> **⚠️ ARCHITECTURE OBSOLÈTE** : Cette section documente l'ancienne architecture dual-plane (v10).
> **Remplacée par ADR-005 (v11)** : Auth unifiée source unique de vérité.
> Tables supprimées : `identites`, `utilisateurs_plateforme`, `memberships`, `permissions_plateforme`, `mfa_configs`, `sessions_plateforme`.
> Voir la section **ADR-005** en fin de document pour l'architecture actuelle.

> Plan complet : Auth0_Internalisé_Dual-Plane
> Architecture : séparation stricte Control Plane (plateforme) / Data Plane (tenants)
> 4 tables, 6 rôles plateforme, ~40 permissions, CASL dual, 4 pages frontend, 4 modules backend

### Phase V0 — Fondations Schema & Migration (✅ COMPLET)

- **V0.1** — Entité `Identite` : table `identites` (source unique de vérité auth) — email, motDePasseHash, MFA, statut
- **V0.2** — Entité `UtilisateurPlateforme` : table `utilisateurs_plateforme` (FK → identites, OneToOne)
- **V0.3** — Entité `Membership` : table pivot `memberships` (identiteId × contexteType × contexteId, index unique composite)
- **V0.4** — Entité `PermissionPlateforme` : table `permissions_plateforme` (code unique, module, ordre)
- **V0.5** — Migration SQL `168-auth0-internalise-dual-plane.sql` (327 lignes) : 5 tables + seed 38 permissions + migration données + triggers
- **V0.6** — Enums partagés `shared/` : `RolePlateforme` (6 rôles), `PermissionPlateforme` (~40 permissions), `StatutIdentite`, `ContexteType`

### Phase V1 — Backend Auth Dual-Plane (✅ COMPLET)

- **V1.1** — Module `platform-auth/` : login (bcrypt + memberships), logout, getMe — JWT scopé `{ platform, tenant }`
- **V1.2** — Middleware `scope-discrimination.middleware.ts` (92 lignes) : discrimination par préfixe `/api/platform/`
- **V1.3** — Module `platform-sessions/` : entity `sessions_plateforme`, CRUD sessions, limite LRU 3, révocation

### Phase V2 — Backend Modules Platform (✅ COMPLET)

- **V2.1** — Routes `/api/platform/auth` (avant guard) + `/api/platform/sessions` (après guard) enregistrées
- **V2.2** — Exports modules `platform-auth`, `platform-sessions` dans `modules/index.ts`

### Phase V3 — CASL Dual (✅ COMPLET)

- **V3.1** — `shared/src/casl/platform-abilities.ts` (306 lignes) : `definePlatformAbility()` avec 6 switch cases
- **V3.2** — Exports CASL : `definePlatformAbility`, `PlatformAppAbility`, `PlatformAbilityContext` dans `shared/src/casl/index.ts`

### Phase V4 — Frontend Pages Platform (✅ COMPLET)

- **V4.1** — Sidebar : 2 items ajoutés dans Sécurité (Rôles plateforme, Sessions & activité)
- **V4.2** — Page `platform-user-detail-page.tsx` (221 lignes) : 3 onglets (Infos, Sessions, Audit)
- **V4.3** — Page `platform-sessions-page.tsx` (152 lignes) : KPIs, liste sessions, révocation individuelle + totale
- **V4.4** — Page `platform-permissions-matrix.tsx` (338 lignes) : grille 6 rôles × ~40 permissions, toggle checkboxes, sauvegarde inline
- **V4.5** — Hooks TanStack Query : `use-platform-users.ts` (147 lignes), `use-platform-roles.ts` (56 lignes), `use-platform-sessions.ts` (61 lignes)
- **V4.6** — Routes TanStack Router : `platform.roles.tsx`, `platform.sessions.tsx`, `platform.utilisateurs.$id.tsx`, `platform.permissions.tsx` (mis à jour)
- **V4.7** — i18n : `platform-identity.json` FR (160 lignes) + EN (160 lignes), namespace `platform-identity` enregistré dans `i18n.ts`

### Phase V5 — Tests (✅ COMPLET)

- **V5.1** — Tests unitaires : `platform-abilities.spec.ts` (106 lignes, 6 rôles) + `dual-plane-auth.spec.ts` (120 lignes)
- **V5.2** — Test E2E : `platform-identity-flow.spec.ts` (444 lignes, 6 suites : création, login, CRUD, sessions, scope, matrice)

### Phase V6 — Documentation (✅ COMPLET)

- **V6.1** — `docs/architectures/ADR-004-auth0-internalise-dual-plane.md` (115 lignes)
- **V6.2** — `docs/guides/GLOSSAIRE-IDENTITE-PLATEFORME.md` (45 lignes)
- **V6.3** — AGENTS.md mis à jour avec toutes les phases V0-V6
- **V6.4** — Skills mis à jour (dual-plane auth, platform pages, identités/memberships)

### Fichiers créés (Modèle C)

| Fichier | Description |
|---------|-------------|
| `backend/src/modules/identite/entities/` | 4 entités TypeORM (identite, utilisateur-plateforme, membership, permission-plateforme) |
| `backend/src/modules/identite/services/identite.service.ts` | CRUD identité globale (233 lignes) |
| `backend/src/modules/identite/services/membership.service.ts` | Gestion memberships + matrice (249 lignes) |
| `backend/src/modules/identite/controllers/identite.controller.ts` | 9 endpoints REST identités |
| `backend/src/modules/identite/controllers/platform-permissions.controller.ts` | 3 endpoints permissions |
| `backend/src/modules/identite/dto/identite.dto.ts` | Schémas Zod validation |
| `backend/src/modules/identite/index.ts` | Barrel export module |
| `backend/src/modules/platform-auth/` | Module auth dual-plane (controller, service, dto) |
| `backend/src/modules/platform-sessions/` | Module sessions plateforme (entity, controller, service) |
| `backend/src/common/middlewares/dual-casl.middleware.ts` | Middleware CASL dual platform/tenant (114 lignes) |
| `shared/src/enums/platform-roles.enum.ts` | Enums RolePlateforme, ContexteType, StatutIdentite (72 lignes) |
| `shared/src/casl/platform-abilities.ts` | CASL dual pour la plateforme (222 lignes) |
| `backend/database/migrations/170-identites-global.sql` | Table identites + backfill |
| `backend/database/migrations/171-utilisateurs-plateforme.sql` | Table utilisateurs_plateforme + backfill |
| `backend/database/migrations/172-memberships-pivot.sql` | Table memberships pivot + backfill |
| `backend/database/migrations/173-permissions-plateforme.sql` | Table permissions + seed ~30 permissions |
| `frontend/src/features/platform/components/platform-permissions-matrix.tsx` | Matrice permissions (338 lignes) |
| `frontend/src/features/platform/components/platform-user-detail-page.tsx` | Détail utilisateur (221 lignes) |
| `frontend/src/features/platform/components/platform-sessions-page.tsx` | Sessions & activité (152 lignes) |
| `frontend/src/features/platform/hooks/use-platform-users.ts` | Hooks TanStack Query users (148 lignes) |
| `frontend/src/features/platform/hooks/use-platform-roles.ts` | Hooks TanStack Query roles (56 lignes) |
| `frontend/src/features/platform/hooks/use-platform-sessions.ts` | Hooks TanStack Query sessions (61 lignes) |
| `frontend/src/components/layout/platform-sidebar.tsx` | Sidebar avec sous-groupes Identité/Surveillance |
| `frontend/src/features/admin/components/platform-users-page.tsx` | Page users connectée aux API |
| `frontend/src/routes/platform.roles.tsx` | Route rôles plateforme |
| `frontend/src/routes/platform.permissions.tsx` | Route permissions plateforme |
| `frontend/src/routes/platform.sessions.tsx` | Route sessions plateforme |
| `frontend/src/routes/platform.utilisateurs.$id.tsx` | Route détail utilisateur |
| `frontend/src/locales/fr/admin.json` | +identite.*, +platformPermissions.*, +sidebar.sousGroupe* |
| `frontend/src/locales/en/admin.json` | Parité FR/EN |
| `backend/test/unit/platform-abilities.spec.ts` | Tests CASL 6 rôles + null |
| `backend/test/unit/dual-plane-auth.spec.ts` | Tests auth dual-plane |
| `backend/test/e2e/platform-identity-flow.spec.ts` | Test E2E flow complet (444 lignes) |
| `docs/architectures/ADR-004-auth0-internalise-dual-plane.md` | ADR Modèle C mis à jour |

### Corrections post-audit (2026-08-09) — Cohérence Dual-Plane

> Audit complet du système dual-plane. 7 problèmes identifiés et corrigés.

- **P1 — Doublons TypeORM supprimés** : 3 dossiers fantômes (`identites/`, `utilisateurs-plateforme/`, `memberships/`) dupliquaient les entités du module `identite/` (singulier). TypeORM auto-découvrait 2× chaque table → conflit. Supprimés + imports corrigés dans `platform-sessions/`.
- **P2 — Guard global SUPER_ADMIN remplacé** : `requireRole([Role.SUPER_ADMIN])` dans `platform.routes.ts` annulait les 6 rôles et 37 permissions. Remplacé par `requirePlatformAccess()` (membership actif requis) + `requirePlatformCasl(action, subject)` pour guards granulaires.
- **P3 — dualCaslMiddleware monté** : `app.ts` utilisait `caslMiddleware` (Data Plane uniquement). Remplacé par `dualCaslMiddleware` qui résout les deux plans (platform + tenant).
- **P4 — Enums consolidés** : `shared/src/enums/platform-roles.enum.ts` (doublon) supprimé. Tous les imports redirigés vers `shared/src/enums/roles.enum.ts` (source unique avec `RolePlateforme`, `PermissionPlateforme`, `StatutIdentite`, `ContexteType`, `DEFAULT_ROLE_PLATEFORME_PERMISSIONS`).
- **P5 — CASL unifié avec PermissionPlateforme** : `platform-abilities.ts` réécrit — les abilities CASL sont maintenant dérivées de `DEFAULT_ROLE_PLATEFORME_PERMISSIONS` via mapping automatique. Source unique de vérité = permissions string dans `roles.enum.ts`.
- **P6 — Seed plateforme créé** : `backend/src/database/seeds/system/seed-utilisateurs-plateforme.ts` (113 lignes) — crée identité + membership PLATEFORME + utilisateur plateforme. Idempotent. Enregistré dans `initial.seed.ts` (étape 9b).
- **P7 — Relation OneToOne corrigée** : `identite.entity.ts` — `utilisateurPlateforme` était `OneToMany` (array). Corrigé en `OneToOne` (une identité = un utilisateur plateforme, cohérent avec `unique: true` sur `identiteId`).

#### Fichiers modifiés (corrections)
| Fichier | Correction |
|---------|-----------|
| `backend/src/modules/identites/` | SUPPRIMÉ (doublon) |
| `backend/src/modules/utilisateurs-plateforme/` | SUPPRIMÉ (doublon) |
| `backend/src/modules/memberships/` | SUPPRIMÉ (doublon) |
| `shared/src/enums/platform-roles.enum.ts` | SUPPRIMÉ (doublon) |
| `backend/src/common/middlewares/dual-casl.middleware.ts` | +`requirePlatformAccess()`, +`requirePlatformCasl()` |
| `backend/src/routes/platform.routes.ts` | Guard SUPER_ADMIN → `requirePlatformAccess()` |
| `backend/src/app.ts` | `caslMiddleware` → `dualCaslMiddleware` |
| `shared/src/casl/platform-abilities.ts` | Réécrit — dérivé de `PermissionPlateforme` |
| `backend/src/modules/identite/entities/identite.entity.ts` | `OneToMany` → `OneToOne` pour `utilisateurPlateforme` |
| `backend/src/database/seeds/system/seed-utilisateurs-plateforme.ts` | NOUVEAU (113 lignes) |
| 7 fichiers backend | Imports `@shared/enums/platform-roles.enum` → `@shared/enums/roles.enum` |

## Travail effectué — Session 2026-08-10 (Durcissement Sécurité v9)

> Score sécurité : 7.2/10 → 9.2/10. 20 tâches en 3 phases (P0/P1/P2). Rapport : `docs/rapports/RAPPORT-DURCISSEMENT-SECURITE-V9.md`

### Phase P0 — Corrections Critiques (✅ COMPLET)
- **P0.1 — G1: Fallback RLS → rejet explicite** : `rls.middleware.ts` — Si aucun `etablissementId` ET rôle non privilégié → throw `AppError(403, 'NO_TENANT_CONTEXT')`
- **P0.2 — G2: Guards CASL backup** : `platform.routes.ts` — `requirePlatformCasl('manage', 'Backup')` sur les 4 routes backup
- **P0.3 — G3: Path traversal backup** : `platform.routes.ts` — `validateBackupPath()` avec `path.resolve()` + `fs.realpath()`
- **P0.4 — Séparation clés** : `ENCRYPTION_KEY ≠ JWT_SECRET`, obligatoire en production, script `generate-security-keys.sh`
- **P0.5 — Seeds passwords** : `getSeedPassword()` depuis `SEED_ADMIN_PASSWORD` env, fallback aléatoire
- **P0.6 — G9: dualCaslMiddleware** : `next(error)` au lieu de `next()` dans le catch

### Phase P1 — Sécurité Renforcée (✅ COMPLET)
- **P1.1 — G4: Rate limiter Redis** : `INCR rate:{ip}:{etab}` + `EXPIRE 60`, fallback Map
- **P1.2 — G5: Tenant isolation strict** : Flag `STRICT_TENANT_ISOLATION`, throw en production
- **P1.3 — G6: Vérification DB affectations** : `getAffectationsFromDB()` + cache Redis TTL 5 min
- **P1.4 — Refresh Token Rotation** : `familleId` + `tokenPrecedentId`, détection compromission
- **P1.5 — Audit HMAC** : Chaîne `HMAC-SHA256`, `verifierIntegrite()`, colonne `integriteHash`
- **P1.6 — IP Allowlist** : Entity + Service + Middleware, cache Redis TTL 5 min, fail-open
- **P1.7 — G7: CASL platform roles** : 5 rôles plateforme dans `defineAbility()`
- **P1.8 — G8: Commentaires** : Mis à jour v9.0.0

### Phase P2 — Fonctionnalités Avancées (✅ COMPLET)
- **P2.1 — WebAuthn/Passkeys** : Entity `WebAuthnCredential`, Service `WebAuthnService`, 6 endpoints REST, composants frontend `WebAuthnSetup.tsx` + `WebAuthnLogin.tsx`
- **P2.2 — console.error → logger** : 5 fichiers critiques migrés + imports logger
- **P2.3 — CSP Headers** : `frameSrc: none`, `objectSrc: none`, `Permissions-Policy`, `X-Permitted-Cross-Domain-Policies`
- **P2.4 — KeyManager** : Entity `CleCryptographique` (4 types), Service `KeyManagerService`, chiffrement AES-256-GCM, rotation auto 90j, grace period 7j
- **P2.5 — Tests sécurité** : 5 fichiers de test unitaire (RLS, refresh rotation, audit HMAC, IP allowlist, KeyManager)
- **P2.6 — Documentation** : Rapport `RAPPORT-DURCISSEMENT-SECURITE-V9.md`, mise à jour AGENTS.md

### Fichiers créés (durcissement v9)
| Fichier | Phase |
|---------|-------|
| `backend/scripts/generate-security-keys.sh` | P0.4 |
| `backend/src/modules/platform-auth/entities/ip-autorisee.entity.ts` | P1.6 |
| `backend/src/modules/platform-auth/services/ip-allowlist.service.ts` | P1.6 |
| `backend/src/common/middlewares/ip-allowlist.middleware.ts` | P1.6 |
| `backend/src/modules/auth/entities/webauthn-credential.entity.ts` | P2.1 |
| `backend/src/modules/auth/services/webauthn.service.ts` | P2.1 |
| `frontend/src/features/auth/components/WebAuthnSetup.tsx` | P2.1 |
| `frontend/src/features/auth/components/WebAuthnLogin.tsx` | P2.1 |
| `backend/src/modules/configuration/entities/cle-cryptographique.entity.ts` | P2.4 |
| `backend/src/modules/configuration/services/key-manager.service.ts` | P2.4 |
| `backend/test/unit/rls-middleware.spec.ts` | P2.5 |
| `backend/test/unit/refresh-token-rotation.spec.ts` | P2.5 |
| `backend/test/unit/audit-integrity.spec.ts` | P2.5 |
| `backend/test/unit/ip-allowlist.spec.ts` | P2.5 |
| `backend/test/unit/key-manager.spec.ts` | P2.5 |
| `docs/rapports/RAPPORT-DURCISSEMENT-SECURITE-V9.md` | P2.6 |

## Audit Sécurité Dual-Plane v10 — Corrections 10 failles (✅ TERMINÉ)

> Rapport : `docs/rapports/RAPPORT-AUDIT-SECURITE-DUAL-PLANE.html`
> Score sécurité : 7.2/10 → 9.5/10. 10 failles corrigées (3 critiques, 4 hautes, 3 moyennes).

### GAP 1 — MFA Platform Enforce (CRITIQUE) ✅
- **Fichier** : `backend/src/modules/platform-auth/services/platform-auth.service.ts`
- **Fix** : Si `identite.mfaActive === true`, le login retourne un `mfaToken` temporaire (5 min, claims `mfaPending: true, plane: 'platform'`). Le client doit appeler `POST /verify-mfa` avec le code TOTP.
- **Endpoint** : `POST /api/platform/auth/verify-mfa` (public, avant guard)
- **DTO** : `platformMfaVerifySchema` (mfaToken + code 6 chiffres)

### GAP 2 — IP Allowlist Fail-Closed (CRITIQUE) ✅
- **Fichier** : `backend/src/common/middlewares/ip-allowlist.middleware.ts`
- **Fix** : En production, si la vérification Redis échoue → 403 (fail-closed). Cache local fallback TTL 5 min.

### GAP 3 — Double next() (CRITIQUE) ✅
- **Fichier** : `backend/src/common/middlewares/tenant.middleware.ts`
- **Fix** : Suppression du `next()` dupliqué après le try/catch.

### GAP 4 — Double Identité (MOYENNE) — Risque Accepté
- **Documentation** : Section ci-dessous "Risque accepté — Double identité"
- **Décision** : Migration lourde, contournements en place (RLS + guards)

### GAP 5 — WebAuthn Flow MFA (HAUTE) ✅ (partiel)
- **Fichier** : `backend/src/modules/platform-auth/services/platform-auth.service.ts`
- **Fix** : `mfaMethods: ('totp' | 'webauthn')[]` dans la réponse MFA. TOTP disponible si `mfaSecret` configuré.
- **Limitation** : WebAuthn pour identités plateforme nécessite extension schéma (migration `identiteId` FK sur `webauthn_credentials`). Documenté comme future enhancement.

### GAP 6 — platformAuthMiddleware Dédié (HAUTE) ✅
- **Fichier** : `backend/src/common/middlewares/platform-auth.middleware.ts` (NOUVEAU 122 lignes)
- **Fix** : Middleware dédié aux routes plateforme. Rejette les tokens sans `plane: 'platform'` (protection cross-plane). Résout le membership plateforme.

### GAP 7 — dualCaslMiddleware Global (HAUTE) ✅
- **Fichier** : `backend/src/routes/platform.routes.ts` (v7.0.0)
- **Fix** : Chaîne de guards : `platformAuthMiddleware → dualCaslMiddleware → requirePlatformAccess()`. CASL résolu pour TOUTES les routes plateforme.

### GAP 8 — JWT Secrets Séparés + Claim Plane (CRITIQUE → HAUTE) ✅
- **Fichiers** :
  - `backend/src/config/env.config.ts` — `JWT_SECRET_PLATFORM` + `JWT_SECRET_TENANT` (optionnels, fallback `JWT_SECRET`)
  - `backend/src/modules/auth/services/token.service.ts` (v2.1.0) — `generateAccessToken()` plane-aware, `verifyAccessToken()` rotation de secrets
  - `backend/src/modules/auth/dto/auth.dto.ts` — `plane` ajouté à `JwtPayload` et `UtilisateurAuth`
  - `backend/src/modules/auth/middlewares/auth.middleware.ts` — `plane` propagé dans `req.utilisateur`
  - `backend/src/modules/platform-auth/services/platform-auth.service.ts` — MFA tokens signés avec `secretPlatform`

### GAP 9 — Guard RLS Défensif (MOYENNE) ✅
- **Fichier** : `backend/src/common/middlewares/rls.middleware.ts`
- **Fix** : `rejectCrossPlaneRequest()` — rejette (403) les tokens `plane: 'platform'` qui atteindraient le middleware RLS (routes tenant). Defense-in-depth.

### GAP 10 — String Casts Fragiles (MOYENNE) ✅
- **Fichier** : `backend/src/common/middlewares/tenant.middleware.ts`
- **Fix** : `'SUPER_ADMIN' as unknown as Role` → `Role.SUPER_ADMIN`

### Risque Accepté — Double Identité (GAP 4)

**Problème** : Un SUPER_ADMIN peut avoir deux identités indépendantes :
1. `Identite` + `UtilisateurPlateforme` (Control Plane)
2. `Utilisateur` (Data Plane, avec rôle SUPER_ADMIN)

**Risque** : Si les deux comptes ont des mots de passe différents, une compromission de l'un n'affecte pas l'autre. Incohérences possibles (MFA activé sur l'un mais pas l'autre).

**Contournements en place** :
- RLS PostgreSQL : toutes les tables tenant ont des policies (migration 152-153)
- Guard RLS défensif (GAP 9) : tokens plateforme rejetés sur les routes tenant
- platformAuthMiddleware (GAP 6) : tokens tenant rejetés sur les routes plateforme
- Isolation structurelle : les deux plans ont des middlewares, secrets JWT et guards indépendants

**Migration future (non planifiée)** : Unifier les identités via une FK `identiteId` sur `Utilisateur`, avec contrainte d'unicité sur `email` global.

### Fichiers créés/modifiés v10
| Fichier | GAP | Action |
|---------|-----|--------|
| `backend/src/modules/platform-auth/services/platform-auth.service.ts` | 1, 5, 8 | MFA enforce + mfaMethods + secretPlatform |
| `backend/src/modules/platform-auth/dto/platform-auth.dto.ts` | 1, 5 | platformMfaVerifySchema + mfaMethods |
| `backend/src/modules/platform-auth/controllers/platform-auth.controller.ts` | 1 | POST /verify-mfa |
| `backend/src/common/middlewares/ip-allowlist.middleware.ts` | 2 | Fail-closed production |
| `backend/src/common/middlewares/tenant.middleware.ts` | 3, 10 | Double next() supprimé + Role enum |
| `backend/src/common/middlewares/platform-auth.middleware.ts` | 6 | NOUVEAU (122 lignes) |
| `backend/src/routes/platform.routes.ts` | 7 | v7.0.0 — platformAuthMiddleware + dualCaslMiddleware |
| `backend/src/config/env.config.ts` | 8 | JWT_SECRET_PLATFORM + JWT_SECRET_TENANT |
| `backend/src/modules/auth/services/token.service.ts` | 8 | v2.1.0 — plane-aware + rotation secrets |
| `backend/src/modules/auth/dto/auth.dto.ts` | 8 | plane dans JwtPayload + UtilisateurAuth |
| `backend/src/modules/auth/middlewares/auth.middleware.ts` | 8 | plane propagé |
| `backend/src/common/middlewares/rls.middleware.ts` | 9 | rejectCrossPlaneRequest() |
| `frontend/src/lib/api-client.ts` | 1, 5, 8 | platformLogin() + platformVerifyMFA() + PlatformLoginResponse |
| `frontend/src/stores/auth.store.ts` | 1 | platformLogin + verifyPlatformMFA + state platformMfa* |
| `frontend/src/features/auth/LoginPage.tsx` | 1 | Toggle dual-plane Établissement/Plateforme |
| `frontend/src/features/auth/PlatformMFAVerifyPage.tsx` | 1, 5 | NOUVEAU (194 lignes) — page MFA plateforme |
| `frontend/src/routes/platform-mfa-verify.tsx` | 1 | NOUVEAU — route /platform-mfa-verify |
| `frontend/src/locales/fr/admin.json` | 1 | platform.mfa.* + platform.login.* (FR) |
| `frontend/src/locales/en/admin.json` | 1 | platform.mfa.* + platform.login.* (EN) |
| `docker/.env.local.example` | 8 | JWT_SECRET_PLATFORM + JWT_SECRET_TENANT |
| `docker/.env.cloud.example` | 8 | JWT_SECRET_PLATFORM + JWT_SECRET_TENANT (auto-generate) |

---

## Dual-Plane v10.1 — Login unifié avec auto-détection (✅ TERMINÉ)

> Contexte : Suppression du toggle manuel Établissement/Plateforme. Le système détecte automatiquement le type d'utilisateur lors du login.

### Architecture du login unifié

**Flux de détection automatique :**
1. L'utilisateur saisit email + mot de passe
2. Le backend vérifie d'abord dans la table `Utilisateur` (tenant)
3. Si non trouvé → vérifie dans la table `Identite` (plateforme)
4. Si trouvé dans les deux → vérifie le mot de passe sur les deux tables et retourne les accès combinés

**Réponse API enrichie (`LoginResponseDto`) :**
```typescript
{
  // Tokens tenant (flux normal)
  accessToken?: string;
  refreshToken?: string;
  utilisateur?: {...};
  etablissementsDisponibles?: [...];
  
  // Dual-plane auto-detection (v10.1)
  hasPlatformAccess?: boolean;
  platformAccessToken?: string;
  platformRefreshToken?: string;
  platformRole?: string;
  identiteId?: string;
  platformMfaRequired?: boolean;
  platformMfaToken?: string;
  platformMfaMethods?: ('totp' | 'webauthn')[];
}
```

**Comportements frontend selon le profil détecté :**

| Profil | Condition | Action |
|--------|-----------|--------|
| **Plateforme pur** | `hasPlatformAccess && !accessToken` | Redirect → `/platform/dashboard` |
| **Plateforme + MFA** | `platformMfaRequired && !accessToken` | Redirect → `/platform-mfa-verify` |
| **Tenant pur** | `accessToken && !hasPlatformAccess` | Flux normal (sélection établissement ou dashboard) |
| **Tenant + Plateforme** | `accessToken && hasPlatformAccess` | Modal sélection établissement + bouton "Plateforme" |

### JWT secrets séparés (production)

**Configuration `env.config.ts` :**
- Développement : secrets auto-générés distincts si non fournis
- Production : `JWT_SECRET_PLATFORM` et `JWT_SECRET_TENANT` **obligatoires** (pas de fallback sur `JWT_SECRET`)

```bash
# .env production (OBLIGATOIRE)
JWT_SECRET_PLATFORM=<min 32 chars>
JWT_SECRET_TENANT=<min 32 chars>
```

### Fichiers créés/modifiés v10.1
| Fichier | Action |
|---------|--------|
| `backend/src/config/env.config.ts` | Secrets JWT séparés (pas de fallback prod) |
| `backend/src/modules/auth/dto/auth.dto.ts` | Champs dual-plane ajoutés à LoginResponseDto |
| `backend/src/modules/auth/services/auth.service.ts` | Auto-détection plateforme dans login() |
| `backend/.env` | JWT_SECRET_PLATFORM + JWT_SECRET_TENANT (dev) |
| `frontend/src/lib/api-client.ts` | Types dual-plane ajoutés |
| `frontend/src/stores/auth.store.ts` | State hasPlatformAccess + logique auto-détection |
| `frontend/src/features/auth/LoginPage.tsx` | Toggle supprimé + flux auto-détecté |
| `frontend/src/components/auth/EtablissementSelectionModal.tsx` | Bouton "Plateforme" ajouté |

---

## ADR-005 — Unification du Système d'Authentification (✅ TERMINÉ)

> **Objectif** : Source unique de vérité pour l'authentification. Supprimer la dualité identités/plateforme et fusionner en un seul flux unifié.

### Décisions architecturales
- **Source unique** : Table `utilisateurs` comme seule source (plus de `identites`, `utilisateurs_plateforme`, `memberships`, `permissions_plateforme`, `mfa_configs`, `sessions_plateforme`)
- **Login unifié** : 1 seul `bcrypt.compare` au lieu de 2 (détection auto par rôle)
- **MFA inline** : Colonnes TOTP directement dans `utilisateurs` (plus de table `mfa_configs`)
- **CASL unifié** : `defineAbility()` pour les deux contextes (plus de `definePlatformAbility()`)
- **JWT claims** : `plane: 'platform' | 'tenant'` comme discriminateur
- **Enum Role unifié** : 6 valeurs `PLATEFORME_*` ajoutées à l'enum `Role` (73 rôles total)

### Phase 0 — Backup (✅ COMPLET)
- Backup complet de la base de données via API

### Phase 1 — Migrations SQL (✅ COMPLET)
- **175a** : Ajout 5 colonnes à `utilisateurs` (estPlateforme, deuxFacteursActif, mfaSecret, mfaBackupCodes, dernierAcces)
- **175b** : Extension `utilisateur_etablissements` (contexteType, dateCreation, derniereConnexion)
- **175c** : Migration permissions + extension `refresh_tokens` (plane)
- **175d** : Migration données + suppression 6 tables

### Phase 2 — Backend (✅ COMPLET)
- **2a** : Shared — enum Role étendu (+73 valeurs), suppression RolePlateforme
- **2b** : Entities — utilisateur, utilisateur_etablissement, refresh_token modifiés
- **2c** : auth.service.ts — login unifié (1 bcrypt)
- **2d** : mfa.service.ts — unifié (colonnes utilisateurs)
- **2e** : Suppression modules identite, permissions-plateforme, platform-sessions
- **2f** : CASL unifié — dual-casl.middleware.ts réécrit

### Phase 3 — Frontend (✅ COMPLET)
- **3a** : auth.store.ts + api-client.ts — login unifié
- **3b** : LoginPage.tsx — MFA unifié
- **3c** : Suppression hooks/pages plateforme obsolètes (sessions, permissions, PlatformMFAVerifyPage)

### Fichiers supprimés ADR-005
| Fichier | Raison |
|---------|--------|
| `backend/src/modules/identite/` (10 fichiers) | Table identites dropée |
| `backend/src/modules/platform-sessions/` (5 fichiers) | Table sessions_plateforme dropée |
| `backend/src/modules/permissions-plateforme/` (3 fichiers) | Table permissions_plateforme dropée |
| `backend/src/modules/auth/entities/mfa-config.entity.ts` | Table mfa_configs dropée |
| `backend/src/database/seeds/system/seed-utilisateurs-plateforme.ts` | Tables supprimées |
| `shared/src/casl/platform-abilities.ts` | defineAbility() unifié |
| `frontend/src/features/auth/PlatformMFAVerifyPage.tsx` | MFA unifié |
| `frontend/src/routes/platform-mfa-verify.tsx` | Route supprimée |
| `frontend/src/features/platform/hooks/use-platform-sessions.ts` | Endpoint supprimé |
| `frontend/src/features/platform/hooks/use-platform-permissions.ts` | Endpoint supprimé |
| `frontend/src/features/platform/components/platform-sessions-page.tsx` | Page supprimée |
| `frontend/src/features/platform/components/platform-permissions-matrix.tsx` | Page supprimée |
| `frontend/src/routes/platform.sessions.tsx` | Route supprimée |
| `frontend/src/routes/platform.permissions.tsx` | Route supprimée |
| `backend/test/unit/identite.service.spec.ts` | Service supprimé |
| `backend/test/unit/membership.service.spec.ts` | Service supprimé |
| `backend/test/unit/platform-abilities.spec.ts` | platform-abilities supprimé |
| `backend/test/e2e/platform-identity-flow.spec.ts` | Flow dual-plane obsolète |

### Fichiers modifiés ADR-005
| Fichier | Modification |
|---------|--------------|
| `frontend/src/stores/auth.store.ts` | Suppression états platformMfa*, méthodes platformLogin/verifyPlatformMFA |
| `frontend/src/lib/api-client.ts` | Suppression PlatformLoginResponse, platformLogin(), platformVerifyMFA() |
| `frontend/src/features/auth/LoginPage.tsx` | MFA unifié (un seul branchement) |
| `frontend/src/components/layout/platform-sidebar.tsx` | Suppression entrées sessions/permissions, sous-groupes |
| `frontend/src/features/platform/components/platform-user-detail-page.tsx` | Suppression onglet sessions |
| `frontend/src/features/platform/hooks/use-platform-roles.ts` | Suppression hooks permissions obsolètes |
| `frontend/src/features/platform/hooks/use-platform-users.ts` | Type PlatformUser mis à jour (role au lieu de rolePlateforme) |
| `backend/src/common/middlewares/dual-casl.middleware.ts` | Réécrit — defineAbility() unifié |
| `backend/src/common/middlewares/platform-auth.middleware.ts` | Réécrit — JWT-only |
| `backend/src/common/middlewares/scope-discrimination.middleware.ts` | Réécrit — defineAbility() unifié |
| `backend/src/routes/platform.routes.ts` | Suppression routes identites/sessions/permissions |
| `backend/src/modules/platform-auth/controllers/platform-auth.controller.ts` | Délègue à auth.service.ts |
| `backend/src/database/seeds/initial.seed.ts` | Suppression seedUtilisateursPlateforme |
| `backend/src/database/seeds/index.ts` | Suppression exports seeds obsolètes |
| `shared/src/casl/index.ts` | Suppression exports platform-abilities |

---

## Session CRUD Plateforme — Utilisateurs, Rôles & Permissions (✅ TERMINÉ)

> Contexte : Compléter le CRUD du panel plateforme avec archivage, audit trail réel, export CSV, duplication de rôles et comparaison de permissions.

### Backend — 6 endpoints nouveaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/platform/utilisateurs/:id/archiver` | POST | Statut ARCHIVE (non destructif, réversible) |
| `/api/platform/utilisateurs/:id/desarchiver` | POST | Restore depuis ARCHIVE vers INACTIF/ACTIF |
| `/api/platform/utilisateurs/export/csv` | GET | Export CSV (BOM UTF-8, séparateur `;`, max 10k) |
| `/api/platform/utilisateurs/:id/audit` | GET | Audit trail paginé (page, limit, module) |
| `/api/platform/roles/:id/audit` | GET | Audit trail paginé d'un rôle |
| `/api/platform/roles/:id/dupliquer` | POST | Copie rôle + permissions, code unique suffixe |
| `/api/platform/roles/comparer` | POST | Matrice comparaison 2-5 rôles, groupé par module |

### Migration SQL
- **177-statut-archive.sql** : `ALTER TYPE "utilisateurs_statut_enum" ADD VALUE IF NOT EXISTS 'ARCHIVE'` + index partiel

### Frontend — Hooks (2 fichiers)
- `use-platform-users.ts` : `useArchiverPlatformUser`, `useDesarchiverPlatformUser`, `usePlatformUserAudit`, `useExportCsvPlatformUsers`
- `use-platform-roles.ts` : `usePlatformRoleAudit`, `useDupliquerRolePlateforme`, `useComparerPermissions`

### Frontend — Pages composantes (5 fichiers)
| Fichier | Modifications |
|---------|---------------|
| `platform-users-page.tsx` | Bouton Export CSV, actions Archive/Désarchive, badge statut ARCHIVE, modal confirmation |
| `platform-user-detail-page.tsx` | Onglet Activité réel (audit trail paginé), actions archiver/désarchiver dans Sécurité, badge ARCHIVE dans header |
| `platform-roles-page.tsx` | Action "Dupliquer" dans chaque rôle, modal confirmation duplication |
| `platform-role-detail-page.tsx` | Bouton "Dupliquer" dans header, onglet Audit réel avec `PlatformRoleAuditTab` connecté |
| `platform-role-permissions-tab.tsx` | PermBadge (catégories visuelles C/R/U/D/W/M/V/E/T), mode Comparaison multi-rôles avec matrice |
| `platform-role-audit-tab.tsx` | Réécrit — audit trail réel paginé avec détails avant/après |

### Fichiers créés/modifiés session CRUD
| Fichier | Action |
|---------|--------|
| `backend/database/migrations/177-statut-archive.sql` | NOUVEAU (20 lignes) |
| `backend/src/modules/auth/entities/utilisateur.entity.ts` | ARCHIVE ajouté à StatutUtilisateur |
| `backend/src/modules/platform-users/dto/platform-users.dto.ts` | ARCHIVE + prenom/nom/email dans modifier |
| `backend/src/modules/platform-users/services/platform-users.service.ts` | archiver, désarchiver, exporterCsv, audit paginé, modifier étendu |
| `backend/src/modules/platform-users/controllers/platform-users.controller.ts` | 3 endpoints (archive, désarchive, CSV) |
| `backend/src/modules/platform-roles/services/platform-roles.service.ts` | getAuditRole, dupliquerRole, comparerPermissions |
| `backend/src/modules/platform-roles/controllers/platform-roles.controller.ts` | 3 endpoints (audit, dupliquer, comparer) |
| `frontend/src/features/platform/hooks/use-platform-users.ts` | 4 hooks + types audit |
| `frontend/src/features/platform/hooks/use-platform-roles.ts` | 3 hooks + types comparaison |
| `frontend/src/features/platform/components/platform-users-page.tsx` | Export CSV + archive/désarchive |
| `frontend/src/features/platform/components/platform-user-detail-page.tsx` | Audit trail réel + archive actions |
| `frontend/src/features/platform/components/platform-roles-page.tsx` | Action dupliquer + modal |
| `frontend/src/features/platform/components/platform-role-detail-page.tsx` | Bouton dupliquer + audit tab connecté |
| `frontend/src/features/platform/components/platform-role-permissions-tab.tsx` | PermBadge + mode comparaison |
| `frontend/src/features/platform/components/platform-role-audit-tab.tsx` | Réécrit — audit trail réel |

---

## Page Détail Établissement — Platform (✅ TERMINÉ)

> Contexte : Page détail établissement pour le Control Plane (`/platform/etablissements/:id`). 4 onglets, 4 actions rapides, ultra-responsif, dark mode.

### Architecture Frontend

**Pattern** : Page dédiée `/:id` avec layout + Outlet (comme `/platform/utilisateurs/`).

**Routes TanStack** :
- `platform.etablissements.tsx` — Layout avec `ModuleLayout` + `<Outlet />` + guard `requireRole(ROLES_PLATEFORME)`
- `platform.etablissements.index.tsx` — Page liste (511 lignes) : DataTable, stats, santé, filtres, navigation "Voir" vers détail
- `platform.etablissements.$id.tsx` — Route détail avec `validateSearch` pour onglet actif

**Composant principal** : `platform-etablissement-detail-page.tsx` (778 lignes)
- Header gradient avec avatar, badges (statut, type, système, santé)
- Barre d'actions rapides : Modifier, Suspendre/Réactiver, Accéder au tenant, Rafraîchir
- 4 onglets : Identité, Santé, Activité, Configuration
- Sous-composants réutilisables : `SectionCard`, `InfoGrid`, `InfoField`, `ActionButton`, `ConfigBadge`

**Hook agrégé** : `use-etablissement-detail.ts` (160 lignes)
- 4 queries parallèles : base, stats, sante, config
- 2 mutations : activer, désactiver (avec invalidation cache)
- Query keys typées : `ETABLISSEMENT_DETAIL_KEYS`

**Types enrichis** : `etablissement.types.ts` (138 lignes)
- Types extraits : `TypeEtablissement`, `SousSysteme`, `StatutEtablissement`
- Interface `Etablissement` étendue (30+ champs)
- Interfaces `EtablissementConfig`, `EtablissementDetailStats`

### i18n

77 clés ajoutées dans `fr/admin.json` et `en/admin.json` :
- `etablissements.detail.*` : onglets, actions, confirmations
- `etablissements.detail.identite.*` : infos générales, contact, direction, paramètres régionaux, dates
- `etablissements.detail.sante.*` : description score composite
- `etablissements.detail.activite.*` : effectifs, taux occupation, résumé config
- `etablissements.detail.config.*` : abonnement, quotas, cycles, bulletin

### CSS

- Variable `--gap-xxs` ajoutée dans `globals.css` : `clamp(0.125rem, 0.1rem + 0.1vw, 0.25rem)`

### Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `frontend/src/routes/platform.etablissements.tsx` | Réécrit — layout + Outlet (56 lignes) |
| `frontend/src/routes/platform.etablissements.index.tsx` | NOUVEAU (511 lignes) |
| `frontend/src/routes/platform.etablissements.$id.tsx` | NOUVEAU (20 lignes) |
| `frontend/src/features/platform/components/platform-etablissement-detail-page.tsx` | NOUVEAU (778 lignes) |
| `frontend/src/features/platform/hooks/use-etablissement-detail.ts` | NOUVEAU (160 lignes) |
| `frontend/src/features/etablissements/types/etablissement.types.ts` | Enrichi — 30+ champs + 3 interfaces |
| `frontend/src/locales/fr/admin.json` | +77 clés `etablissements.detail.*` |
| `frontend/src/locales/en/admin.json` | +77 clés `etablissements.detail.*` |
| `frontend/src/styles/globals.css` | `--gap-xxs` ajouté |

---

## Modal Édition + Onglet Activité Établissement (✅ TERMINÉ)

> Plan : `/home/franck/.config/Qoder/SharedClientCache/cache/plans/Modal_Edit_+_Activité_task-0d7.md`

### Décisions validées
| Sujet | Décision |
|-------|----------|
| Modal | Unique adaptatif : create = 4 étapes, edit = 3 onglets horizontaux |
| Edit UI | 3 onglets : Identité / Contact / Configuration |
| Activité | 4 sections : Ventilation, Modules, Timeline, Finances |
| Timeline | Combiné : compteurs par module + 20 derniers AuditLogs |
| Finances | DB directe + module billing |
| Backend | Nouveau service + endpoint `GET /:id/activite` |

### Phase 1 — Backend : Service Activité

**Service** : `activite-etablissement.service.ts` (415 lignes)
- `getActiviteComplete(etablissementId)` → 4 agrégations en `Promise.all`
- Ventilation : jointure AffectationEleve→Classe→Niveau→Cycle, comptage par genre, ratio P/E
- Modules : `ParametreSysteme` WHERE `cle LIKE '%.actif'`, derniers changements via AuditLog
- Timeline : compteurs par module (30j) + 20 derniers AuditLog avec relation utilisateur
- Finances : `createQueryBuilder` pour SUM paiements, factures en attente, taux recouvrement, abonnement

**Endpoint** : `GET /api/etablissements/:id/activite`
- `authMiddleware` + vérification appartenance (même pattern que `/stats`)

### Phase 2 — Modal Adaptatif

**Fichier** : `etablissement-form-modal.tsx` (694 lignes)
- Mode CREATE : 4 étapes (Infos → Plan → Options → Résumé)
- Mode EDIT : 3 onglets horizontaux (Identité / Contact / Configuration)
- Types corrigés : `LAIC/CONFESSIONNEL_CATHOLIQUE/...` au lieu de `PRIVE/PUBLIC/...`
- `updateMutation` : `PATCH /api/platform/etablissements/:id`
- Props typées : `etablissement?: Etablissement` (plus de `any`)

### Phase 3 — Onglet Activité Enrichi

**Fichier** : `platform-etablissement-detail-page.tsx` (~1097 lignes)
- Section 1 : Stats de base (4 cards) + taux occupation
- Section 2 : Ventilation effectifs (genre, ratio, nouvelles inscriptions, barres par cycle)
- Section 3 : Modules actifs (grille badges + derniers changements)
- Section 4 : Timeline activité (compteurs 30j + 15 derniers événements avec sévérité)
- Section 5 : Métriques financières (paiements, factures, taux recouvrement + abonnement)
- Helper `formatRelativeTime()` ajouté pour dates relatives

**i18n** : +28 clés dans `fr/admin.json` et `en/admin.json` :
- `etablissements.detail.activite.ventilation.*` (5 clés)
- `etablissements.detail.activite.modules.*` (3 clés)
- `etablissements.detail.activite.timeline.*` (4 clés)
- `etablissements.detail.activite.finances.*` (5 clés)

### Fichiers créés/modifiés

| Fichier | Phase | Action |
|---------|-------|--------|
| `backend/src/modules/etablissement/services/activite-etablissement.service.ts` | 1.1 | NOUVEAU (415 lignes) |
| `backend/src/modules/etablissement/controllers/etablissement.controller.ts` | 1.2 | Ajout route `/:id/activite` |
| `backend/src/modules/etablissement/services/index.ts` | 1.1 | Export |
| `frontend/src/features/etablissements/types/etablissement.types.ts` | 1.3 | +73 lignes interfaces Activite* |
| `frontend/src/features/platform/hooks/use-etablissement-detail.ts` | 1.4 | Query activité |
| `frontend/src/features/admin/components/etablissement-form-modal.tsx` | 2.1 | Réécrit — adaptatif create/edit (694 lignes) |
| `frontend/src/routes/platform.etablissements.index.tsx` | 2.2 | Bouton Modifier → établissement complet |
| `frontend/src/features/platform/components/platform-etablissement-detail-page.tsx` | 3.1 | ActiviteTab enrichi (~1097 lignes) |
| `frontend/src/locales/fr/admin.json` | 3.2 | +28 clés activité |
| `frontend/src/locales/en/admin.json` | 3.2 | +28 clés activité |

---

## Module CMS — Pages publiques white-label + Templates (✅ CONSOLIDÉ)

> Système CMS complet pour pages publiques par établissement. Routes `/e/:code` accessibles sans authentification. Éditeur CMS authentifié avec drag & drop. Templates pré-conçus avec instanciation. Preview mode pour pages brouillon. Réinitialisation CMS complète.

### Architecture

- **8 entités CMS** : CmsPage, CmsSection, CmsMedia, CmsTheme, CmsMenu, CmsWidget, CmsVersion, **CmsTemplate**
- **18 types de sections** : HERO, TEXTE, GALERIE, CARTE_INFOS, TEMOIGNAGES, CHIFFRES_CLES, EQUIPE, FORMULAIRE, CARTE, VIDEO, TELECHARGEMENTS, ACTUALITES, HORAIRES, PARTENAIRES, FAQ, APPEL_ACTION, SEPARATEUR, HTML_CUSTOM
- **8 templates système** (6 initiaux + 2 consolidation : PAGE_A_PROPOS, PAGE_MENTIONS_LEGALES)
- **Enums alignés** : `EmplacementMenu` = `principal | pied_page | lateral` (backend = frontend)
- **Theme mapping** : Structure nested `{ couleurs, typographie }` + mapper legacy `mapThemeToPublic()`
- **Auto-init enrichie** : 6 pages + 2 menus + 5 widgets (RESEAUX_SOCIAUX, CONTACT_RAPIDE, HORAIRES, NEWSLETTER, LIENS_UTILES) à la création d'un établissement
- **Personnalisation templates** : `personnaliserSections()` remplace les textes génériques par les données réelles de l'établissement (nom, slogan, description, devise, code)
- **Seed démo** : `POST /api/cms/seed-demo` + hook `useSeedDemoCms()` — peuple avec contenu riche (médias SVG placeholder, actualités, équipe, témoignages). Idempotent.
- **Réinitialisation CMS** : `POST /api/cms/reinitialiser` + modal multi-étapes (3 étapes : aperçu → options → confirmation). Options : `conserverMedias` (défaut: true), `inclureDemo` (défaut: true). Après reset : ré-initialisation complète + seed démo automatique.
- **Correction bug publication** : Enum `StatutPage` aligné frontend↔backend (`BROUILLON`, `PUBLIE`, `ARCHIVE` en majuscules). Le badge de statut affiche maintenant correctement l'état de la page.
- **Seed widgets opérationnel** : `seedCmsWidgets()` dans `initial.seed.ts` — crée 5 widgets pour tous les établissements existants (idempotent)
- **Widget `contenu`** : Champ JSONB renommé de `config` → `contenu` (migration 206, cohérence avec CmsSection.contenu)
- **Footer dynamique** : Rend tous les widgets `pied_page` actifs, grille adaptative, fallback statique
- **9 nouveaux champs Etablissement** : pays, region, quartier, latitude, longitude, numeroEnregistrement, numeroIdentification, numeroAutorisation, descriptionPublique
- **Projection restrictive** : Seules les colonnes publiques sont exposées via l'API (exclusion : numeroContribuable, numeroCompteBancaire, etc.)
- **Cache Redis** : TTL 300s (pages/menus/widgets), 600s (thèmes), invalidation à chaque mutation
- **Rate limiting** : 60 req/min/IP sur les routes publiques
- **18 permissions RBAC** : pages (5), sections (4), medias (3), themes (2), menus (1), widgets (1), versions (2)
- **RLS PostgreSQL** activé sur les 7 tables CMS
- **Versioning** : Snapshot avant chaque modification, rollback possible
- **6 thèmes système** : Classique Vert, Moderne Bleu, Élégant Bordeaux, Dynamique Orange, Nature Vert Forêt, Minimaliste

### Backend

| Fichier | Rôle |
|---------|------|
| `backend/database/migrations/180-enrichissement-etablissement.sql` | 9 colonnes + 2 index |
| `backend/database/migrations/181-cms-tables.sql` | 7 tables CMS + RLS + seeds thèmes |
| `backend/database/migrations/182-cms-permissions.sql` | 18 permissions RBAC + attribution rôles |
| `backend/src/modules/cms/entities/cms.entity.ts` | 7 entités + 10 enums (389 lignes) |
| `backend/src/modules/cms/dto/cms.dto.ts` | 12+ schémas Zod (179 lignes) |
| `backend/src/modules/cms/services/cms.service.ts` | CRUD + versioning + cache + preview tokens (504 lignes) |
| `backend/src/modules/cms/services/public-etablissement.service.ts` | API publique + projection + cache + preview (300 lignes) |
| `backend/src/modules/cms/controllers/cms.controller.ts` | ~33 routes authentifiées (353 lignes) |
| `backend/src/modules/cms/controllers/public-etablissement.controller.ts` | 8 routes publiques + preview (154 lignes) |
| `backend/src/modules/cms/entities/cms-template.entity.ts` | Entité CmsTemplate (JSONB sectionsDef) |
| `backend/src/modules/cms/services/cms-template.service.ts` | Templates + instanciation + auto-init 6 pages + reset (503 lignes) |
| `backend/database/migrations/184-cms-templates.sql` | Table cms_templates + seed 6 templates |
| `backend/database/migrations/205-cms-consolidation.sql` | Correction enums + structure thèmes + 2 templates + migration items |
| `backend/database/seeds/system/seed-cms-templates.ts` | Seed TypeScript idempotent 8 templates |
| `backend/database/seeds/system/seed-cms-widgets.ts` | Documentation types widgets par défaut |
| `backend/src/modules/etablissement/services/etablissement.service.ts` | Auto-init CMS à la création (hook) |

### Frontend — Types & Hooks

| Fichier | Rôle |
|---------|------|
| `frontend/src/features/cms/types/cms.types.ts` | Types CMS complets (205 lignes) |
| `frontend/src/features/cms/hooks/use-cms-public.ts` | 7 hooks API publique (140 lignes) |
| `frontend/src/features/cms/hooks/use-cms-admin.ts` | 22+ hooks CRUD admin + templates + preview + reset (337 lignes) |
| `frontend/src/features/cms/index.ts` | Barrel exports feature CMS |

### Frontend — Composants Partagés

| Fichier | Rôle |
|---------|------|
| `frontend/src/features/cms/components/PublicLayout.tsx` | Layout public (dark mode, mobile, breadcrumbs, active menu) (416 lignes) |
| `frontend/src/features/cms/components/CmsPageRenderer.tsx` | Rendu 18 sections + animations + count-up + lightbox (~980 lignes) |
| `frontend/src/features/cms/components/CmsDashboard.tsx` | Dashboard admin CMS (260 lignes) |
| `frontend/src/features/cms/components/CmsMediaUpload.tsx` | Upload drag & drop média (237 lignes) |
| `frontend/src/features/cms/components/CmsSectionEditor.tsx` | Éditeur section générique 18 types (388 lignes) |
| `frontend/src/features/cms/components/CmsThemeCustomizer.tsx` | Personnalisation thème + presets (262 lignes) |
| `frontend/src/features/cms/components/SeoHead.tsx` | SEO réutilisable (title, meta, OG, Twitter) (77 lignes) |
| `frontend/src/features/cms/components/PublicPageSkeleton.tsx` | Skeleton loading pages publiques (81 lignes) |

### Frontend — Routes Publiques (5 routes)

| Fichier | Rôle |
|---------|------|
| `frontend/src/routes/e.$code.tsx` | Route publique accueil + fallback riche (194 lignes) |
| `frontend/src/routes/e.$code.$slug.tsx` | Route publique page + preview mode (109 lignes) |
| `frontend/src/routes/e.$code.galerie.tsx` | Galerie masonry + lightbox (284 lignes) |
| `frontend/src/routes/e.$code.contact.tsx` | Contact + carte OSM (315 lignes) |
| `frontend/src/routes/e.$code.inscriptions.tsx` | Inscriptions stepper 4 étapes (248 lignes) |

### Frontend — Routes Éditeur CMS (8 routes)

| Fichier | Rôle |
|---------|------|
| `frontend/src/routes/_auth.cms.tsx` | Layout éditeur CMS (8 onglets navigation) |
| `frontend/src/routes/_auth.cms.index.tsx` | Dashboard éditeur (14 lignes) |
| `frontend/src/routes/_auth.cms.pages.tsx` | Liste pages + filtres + création + modal templates (~349 lignes) |
| `frontend/src/routes/_auth.cms.pages.$id.tsx` | Éditeur page 3 colonnes + bouton Aperçu (~380 lignes) |
| `frontend/src/routes/_auth.cms.medias.tsx` | Bibliothèque médias grille/liste (209 lignes) |
| `frontend/src/routes/_auth.cms.themes.tsx` | Gestion thèmes + customizer (191 lignes) |
| `frontend/src/routes/_auth.cms.menus.tsx` | Éditeur navigation par emplacement (399 lignes) |
| `frontend/src/routes/_auth.cms.widgets.tsx` | CRUD widgets 4 emplacements (349 lignes) |
| `frontend/src/routes/_auth.cms.versions.tsx` | Timeline versions + rollback (262 lignes) |
| `frontend/src/routes/_auth.cms.templates.tsx` | Liste templates + instanciation (136 lignes) |

### Frontend — i18n

| Fichier | Rôle |
|---------|------|
| `frontend/src/locales/fr/cms.json` | i18n FR (155 lignes) — public, contact, reset, widgets |
| `frontend/src/locales/en/cms.json` | i18n EN (155 lignes) — public, contact, reset, widgets |

### API publiques (8 routes)

```
GET  /api/public/e/:code          — Données établissement (projection restrictive)
GET  /api/public/e/:code/accueil  — Page d'accueil complète
GET  /api/public/e/:code/pages    — Liste pages publiées
GET  /api/public/e/:code/pages/:slug — Détail page + sections (supporte ?preview=TOKEN)
GET  /api/public/e/:code/theme    — Thème actif
GET  /api/public/e/:code/menus    — Menus navigation
GET  /api/public/e/:code/widgets  — Widgets actifs
POST /api/public/e/:code/contact  — Formulaire contact
```

### API admin templates (3 routes supplémentaires)

```
GET  /api/cms/templates              — Liste templates (filtre ?categorie=)
GET  /api/cms/templates/:code        — Détail template
POST /api/cms/templates/:code/instancier — Créer page depuis template
POST /api/cms/reinitialiser          — Réinitialiser CMS complet (supprime + recrée)
GET  /api/cms/pages/:id/preview      — Générer token preview (UUID, TTL 10 min)
```

### Montage routes (app.ts)

- Routes publiques CMS montées AVANT `tenantMiddleware` : `app.use('/api/public', publicEtablissementController)`
- Routes CMS admin montées APRÈS `tenantMiddleware` : `app.use('/api/cms', authMiddleware, requireModuleActive('cms'), filterByEtablissement(), cmsController)`
- Exception ajoutée dans `api-client.ts` : `/api/public` skip token validation

---

## Refonte Configuration Platform v3 — Sidebar Navigation (✅ TERMINÉ)

> Contexte : Refonte UX de la page `/platform/configuration` — remplacement des tabs horizontaux par un sidebar vertical avec animations avancées.
> **v3.1** : Extraction composant partagé `<ConfigSidebar>`, accessibilité ARIA, navigation clavier, persistance localStorage.

### Architecture Sidebar v3

- **Layout** : Flex horizontal — sidebar fixe 260px (desktop) + contenu fluide
- **Mobile (< 768px)** : Drawer overlay avec backdrop blur, spring animation
- **Desktop** : Sidebar sticky (`position: sticky; top: 0; height: 100vh`)
- **Composant partagé** : `<ConfigSidebar>` extrait dans `frontend/src/components/ui/ConfigSidebar.tsx`

### Fonctionnalités implémentées

- **Barre indicatrice animée** : `layoutId` avec spring animation (stiffness: 380, damping: 32)
- **Background tinté par section** : Chaque section a une couleur `tintBg` (ex: sécurité = danger-50, modules = purple 6%)
- **Compteur de modifications** : Badge animé (spring scale) montrant le nombre de changements non sauvegardés
- **Micro-animation icône** : Pulse circulaire 2s sur l'icône de la section active
- **Recherche inline** : Input dans le sidebar, synchronisé avec le state de recherche de la section active
- **Breadcrumb contextuel** : Header avec icône teintée + fil d'Arianne "Configuration / Section"
- **Indicateurs statut** : Dot jaune (modifications), dot rouge (erreur) par section
- **Collapse/Expand** : Bouton pour réduire le contenu, placeholder avec bouton "Développer"
- **Feature Flags toggle** : Conservé dans le header (pas dans le sidebar)

### Améliorations v3.1 — Accessibilité, Clavier, Persistance

- **Accessibilité ARIA** :
  - `role="navigation"` + `aria-label` sur le `<aside>` (desktop) et `<motion.aside>` (mobile)
  - `role="tablist"` + `aria-orientation="vertical"` sur le conteneur de navigation
  - `role="tab"` + `aria-selected` + `aria-current="page"` sur chaque item
  - `tabIndex={0}` sur l'item actif, `tabIndex={-1}` sur les autres
  - `aria-label` sur les boutons (fermer, actualiser, hamburger, compteur)
- **Navigation clavier** :
  - `↑` / `↓` : Navigation entre les items (wrap-around)
  - `Home` / `End` : Premier / dernier item
  - Focus géré via `tabIndex` natif (pas de focus programmatique nécessaire)
- **Persistance localStorage** :
  - Clé : `platform:config:activeSection`
  - Restauration au chargement (avec validation de la clé)
  - Sauvegarde à chaque changement de section
  - Fallback gracieux si localStorage indisponible

### Composant partagé `<ConfigSidebar>`

**Fichier** : `frontend/src/components/ui/ConfigSidebar.tsx` (297 lignes)
**Export** : `frontend/src/components/ui/index.ts` → `ConfigSidebar`, `ConfigSidebarSection`, `ConfigSidebarProps`

```typescript
interface ConfigSidebarSection {
    key: string;
    label: string;        // Déjà traduit (la page fait la traduction)
    icon: LucideIcon;
    color: string;
    tintBg: string;
    description?: string;
}

interface ConfigSidebarProps {
    sections, activeKey, onSectionChange,
    searchValue, onSearchChange, searchPlaceholder?,
    title, subtitle?,
    modificationsCount?, hasChanges?, hasError?,
    showSearch?, showRefresh?, onRefresh?,
    footerContent?,                          // Slot custom dans le footer
    isMobile?, isDrawerOpen?, onDrawerClose?,
    showMobileToggle?, onDrawerOpen?,
    layoutId?,                               // Unique par page
}
```

**Usage** :
```tsx
<ConfigSidebar
    sections={sidebarSections}
    activeKey={activeSection}
    onSectionChange={(key) => handleSectionClick(key as SectionKey)}
    searchValue={searchBySection[activeSection]}
    onSearchChange={handleSidebarSearch}
    title={t('titre')}
    subtitle={t('sousTitre')}
    modificationsCount={modificationsCount}
    hasChanges={hasChanges}
    hasError={hasError}
    showSearch showRefresh
    onRefresh={handleRefresh}
    footerContent={<ExportConfigButton variant="ghost" size="sm" />}
    isMobile={isMobile}
    isDrawerOpen={isMobileSidebarOpen}
    onDrawerClose={() => setMobileSidebarOpen(false)}
    showMobileToggle={isMobile}
    onDrawerOpen={() => setMobileSidebarOpen(true)}
/>
```

### Fichiers modifiés

| Fichier | Action | Lignes |
|---------|--------|--------|
| `frontend/src/components/ui/ConfigSidebar.tsx` | NOUVEAU — composant partagé réutilisable | 297 |
| `frontend/src/components/ui/index.ts` | 2 exports ajoutés | +2 |
| `frontend/src/routes/platform.configuration.tsx` | Réécriture v3 + extraction ConfigSidebar | 596 |
| `frontend/src/locales/fr/config-params.json` | 3 clés ajoutées (reduire, developper, sectionReduite) | +3 |
| `frontend/src/locales/en/config-params.json` | 3 clés ajoutées (parité EN) | +3 |

### Pattern réutilisable

Pour toute page à sections multiples :
1. Importer `ConfigSidebar` et `ConfigSidebarSection` depuis `@/components/ui`
2. Définir `sections: ConfigSidebarSection[]` avec key, label (traduit), icon, color, tintBg
3. Passer les props de state (activeKey, searchValue, modifications, etc.)
4. Le composant gère : indicatrice animée, clavier, ARIA, mobile drawer, persistance (via la page)

---

## Configuration System v10 — Améliorations Majeures (✅ TERMINÉ)

> Contexte : Implémentation des 8 recommandations des rapports d'analyse du système de configuration multi-tenant. Score amélioré de 8.5/10 à 9.5/10.

### Phase P0 — Critique (✅ COMPLET)
- **P0.1 Cascade groupe dans getParametre()** — `backend/src/modules/configuration/services/configuration.service.ts`
  - Ajout du niveau groupe dans la cascade : Établissement → Groupe → Global → Défaut
  - Nouvelle méthode `resoudreGroupeEtablissement()` via `GroupeEtablissementLien`
  - Import de `GroupeEtablissementLien` depuis `@modules/groupes-etablissements/entities`
- **P0.2 Suppression du double cache** — `backend/src/modules/configuration/utils/config.helper.ts`
  - Suppression du `quickCache` local (Map, TTL 60s)
  - Délégation directe au `ConfigurationService` (cache 60s + pub/sub Redis)
  - Élimination du risque de désynchronisation

### Phase P1 — Important (✅ COMPLET)
- **P1.1 Harmonisation TTL** — `backend/src/modules/billing/services/feature-flags.service.ts`
  - TTL réduit de 5 minutes à 60 secondes
  - Alignement avec `ConfigurationService` et `ModuleResolutionService`
- **P1.2 Cache Redis** — `backend/src/modules/configuration/services/configuration.service.ts`
  - Ajout du cache Redis (TTL 60s) entre in-memory et DB
  - Pattern : In-Memory (60s) → Redis (60s) → PostgreSQL
  - Invalidation via SCAN + DEL sur `config:param:*`
  - Nouvelles constantes : `REDIS_CACHE_PREFIX`, `REDIS_CACHE_TTL`
- **P1.3 ConfigConsistencyChecker** — `backend/src/modules/configuration/services/config-consistency.service.ts` (NOUVEAU, 330 lignes)
  - Vérification cohérence inter-cascades
  - Détecte : modules désactivés avec flags actifs, flags orphelins, paramètres manquants
  - Endpoints : `GET /api/configuration/consistency-check`, `GET /api/configuration/consistency-check/:etablissementId`

### Phase P2 — Amélioration (✅ COMPLET)
- **P2.1 Batch loading** — `backend/src/modules/configuration/services/configuration.service.ts`
  - Nouvelle méthode `getParametresBatch(cles: string[], etablissementId?: string)`
  - Charge N paramètres en une seule requête SQL
  - Applique la cascade 4 niveaux pour chaque paramètre
  - Retourne `Map<string, any>`
- **P2.2 Validation Zod** — `backend/src/modules/configuration/utils/param-validation.ts` (NOUVEAU, 215 lignes)
  - Registry de schémas Zod par type et par clé
  - Validation automatique dans `createParametre()` et `setParametre()`
  - Schémas spécifiques : `auth.session_duration`, `auth.password_min_length`, `app.version`, etc.
  - Support des patterns avec wildcard (`modules.*.actif`)
- **P2.3 Dashboard cascade** — `frontend/src/routes/platform.configuration-cascade.tsx` (NOUVEAU, 403 lignes)
  - Vue plateforme de tous les paramètres avec valeur effective par établissement
  - Affiche : valeur globale, groupe, établissement, effective, source
  - Filtres : recherche, catégorie, établissement
  - Intégration du consistency check (incohérences détectées)
  - Endpoints backend : `GET /api/configuration/cascade-view`, `GET /api/configuration/cascade-view?etablissementId=xxx`

### Fichiers créés/modifiés v10
| Fichier | Action | Phase |
|---------|--------|-------|
| `backend/src/modules/configuration/services/configuration.service.ts` | Modifié (cascade 4 niveaux, cache Redis, batch, cascade view) | P0.1, P1.2, P2.1, P2.3 |
| `backend/src/modules/configuration/utils/config.helper.ts` | Modifié (suppression quickCache) | P0.2 |
| `backend/src/modules/billing/services/feature-flags.service.ts` | Modifié (TTL 5min → 60s) | P1.1 |
| `backend/src/modules/configuration/services/config-consistency.service.ts` | Créé (330 lignes) | P1.3 |
| `backend/src/modules/configuration/services/index.ts` | Modifié (export config-consistency) | P1.3 |
| `backend/src/modules/configuration/controllers/configuration.controller.ts` | Modifié (endpoints consistency-check + cascade-view) | P1.3, P2.3 |
| `backend/src/modules/configuration/utils/param-validation.ts` | Créé (215 lignes) | P2.2 |
| `frontend/src/routes/platform.configuration-cascade.tsx` | Créé (403 lignes) | P2.3 |
| `.qoder/rules/elisaschool-conventions.md` | Modifié (section 29 ajoutée) | P3.1 |
| `AGENTS.md` | Modifié (section v10 ajoutée) | P3.2 |

### Résumé des améliorations v10
- **Cascade 4 niveaux** : Établissement → Groupe → Global → Défaut (était 2 niveaux)
- **Cache 3 niveaux** : In-Memory → Redis → PostgreSQL (était 2 niveaux)
- **TTL harmonisé** : 60 secondes partout (était 60s/5min mixte)
- **Validation Zod** : Schémas par type et par clé pour validation avant sauvegarde
- **Batch loading** : Chargement de N paramètres en 1 requête SQL
- **Consistency checker** : Détection automatique des incohérences inter-cascades
- **Dashboard cascade** : Vue temps réel de la configuration par établissement

---

## Migration 200 — Unification Entitlement & Modules (✅ COMPLET)

> Plan : `/home/franck/.config/Qoder/SharedClientCache/cache/plans/Unification_Modules_SaaS_task-42f.md`
> Contexte : 3 registres de modules divergents (ModuleRegistryService hardcoded, ModuleResolutionService DB, ConfigurationService cascade propre). Aucun gating par abonnement. Visibilité non filtrée par plan.

### Résumé des changements

**SUPPRIMÉ** :
- `backend/src/modules/configuration/services/module-registry.service.ts` (501 lignes) — 15 modules hardcodés

**CRÉÉ** :
- `backend/src/modules/billing/services/entitlement.service.ts` (483 lignes) — Source unique de vérité pour le gating des modules
- `backend/database/migrations/200-unification-entitlement-modules.sql` (213 lignes) — Migration DB idempotente

**MODIFIÉ** :
- `backend/src/modules/billing/services/index.ts` — Exports EntitlementService + types
- `backend/src/modules/configuration/services/index.ts` — Retiré exports ModuleRegistryService
- `backend/src/modules/configuration/controllers/configuration.controller.ts` — Routes modules-advanced/* → moduleResolutionService + entitlementService
- `backend/src/modules/configuration/middlewares/module-active.middleware.ts` — Utilise entitlementService (gating par abonnement)
- `backend/src/modules/configuration/services/configuration.service.ts` — isModuleActive() délègue à moduleResolutionService
- `backend/src/database/seeds/system/seed-modules-catalogue.ts` — Seed idempotent complet (26 modules)
- `frontend/src/features/configuration/types/configuration.types.ts` — Ajout estAccessible, estVisible, raisonBlocage, messageBlocage
- `frontend/src/features/configuration/hooks/use-configuration.ts` — Propage champs entitlement dans ModuleState
- `frontend/src/features/configuration/components/ModulesTab.tsx` — UI gating (cadenas, badge, toggle grisé, CTA Upgrader)
- `frontend/src/features/modules/components/ModuleCard.tsx` — Gating UI dans le composant réutilisable

### Architecture EntitlementService

**Cascade de résolution** :
1. Module CRITIQUE (code) → bypass total
2. Catalogue DB (modules_catalogue) → module existe/actif ?
3. Catégorie CRITIQUE → bypass total
4. Abonnement ACTIF vérifié → sans plan → blocage
5. Plan (modulesInclus) → le plan inclut le module ?
6. Override groupe (ModulesGroupe) → activation/désactivation groupe
7. Supplément (AbonnementModule) → add-on souscrit ?
8. Plan minimal requis → rang du plan vs plan minimal
9. Catalogue défaut (actifParDefaut) → dernier fallback

**Cache** : Redis TTL 60s + in-memory fallback + Pub/Sub cross-instance

**API REST enrichie** : `GET /api/configuration/modules/registry` retourne `estAccessible`, `estVisible`, `raisonBlocage`, `messageBlocage`

**Frontend** : Modules verrouillés → cadenas + badge "Plan requis"/"Abonnement requis" + toggle grisé + CTA "Upgrader le plan"

---

## Refonte Module Management SaaS — Unification v8 (migration 200) ✅

### Contexte
Score audit : 5.5/10 → Score cible : 8.5/10. 5 failles critiques (G1-G5), 3 registres divergents.

### Phases implémentées

**Phase P0 — Corrections Critiques (4 tâches)** :
- P0.1 : Endpoint `GET /api/billing/modules/mes-modules` — catalogue filtré client (actifs + upgradables SANS prix)
- P0.2 : Middleware `module-access.middleware.ts` v4 — délégation totale à entitlementService
- P0.3 : Suppression `shared/src/config/config.registry.ts` (MODULE_REGISTRY) — config migrée vers JSONB `modules_catalogue.config`
- P0.4 : Tests unitaires entitlement-service + module-access middleware

**Phase P1 — Améliorations Majeures (5 tâches)** :
- P1.1 : Période d'essai automatique 14 jours (auto-création à l'inscription, statut ESSAI)
- P1.2 : Dégradation gracieuse 30 jours (J0-J15 lecture seule → J15-J30 verrouillé → J30+ archivé)
- P1.3 : Cache invalidation synchrone in-memory + header `X-Cache-Status: HIT|MISS|STALE`
- P1.4 : Page "Mes Modules" frontend (hook TanStack Query, ModuleCard, dark mode, responsive, i18n FR/EN)
- P1.5 : Migration SQL 201 (periodeEssaiFin, dateExpirationReelle, enum ESSAI) + seeds mis à jour

### Fichiers créés (7)
- `backend/database/migrations/201-essai-degradation.sql` — Migration idempotente
- `backend/test/unit/entitlement-service.spec.ts` — 20+ tests cascade
- `frontend/src/features/modules/hooks/use-mes-modules.ts` — Hook TanStack Query
- `frontend/src/features/modules/components/mes-modules-page.tsx` — Page complète
- `frontend/src/features/modules/components/module-card.tsx` — Carte réutilisable (3 états)
- `frontend/src/routes/_auth.mes-modules.tsx` — Route TanStack Router
- `frontend/src/locales/{fr,en}/modules.json` — i18n modules

### Fichiers modifiés (7)
- `backend/src/modules/billing/controllers/billing.controller.ts` — Endpoint mes-modules + X-Cache-Status
- `backend/src/modules/billing/services/entitlement.service.ts` — Essai + dégradation + cache synchrone + types
- `backend/src/common/middlewares/module-access.middleware.ts` — v4 entitlementService (lecture seule)
- `backend/src/modules/billing/entities/abonnement-client.entity.ts` — Enum ESSAI + colonnes
- `backend/src/modules/etablissement/services/etablissement.service.ts` — Auto-création essai
- `backend/src/database/seeds/system/seed-modules-catalogue.ts` — Config JSONB pour 26 modules
- `shared/src/config/index.ts` — Suppression export registry

### Fichiers supprimés (1)
- `shared/src/config/config.registry.ts` — MODULE_REGISTRY (815 lignes) supprimé

### Documentation mise à jour
- `.qoder/rules/elisaschool-conventions.md` — Section 30 (Module Management SaaS v8)

---

## Refonte Modules SaaS v9 — Consolidation & Déduplication (✅ TERMINÉ)

> Contexte : Audit frontend ayant identifié 3 redondances majeures :
> 1. 6 routes vides (`modules-complementaires`, `modules-organisationnels`, `modules-pedagogiques`, `modules-administratifs`, `modules-pedagogique-avance`) + `mes-modules` doublon
> 2. `_auth.facturation.tsx` affichait des modules actifs (redondant)
> 3. `platform.modules.tsx` et `platform.modules.builder.tsx` séparés

### Architecture cible atteinte
```
Côté Tenant :
  /marketplace → Page UNIQUE (3 onglets : Catalogue, Mes Modules, Aperçu)
  /facturation → Uniquement factures/abonnement/simulateur

Côté Plateforme :
  /platform/modules → Page unifiée (3 onglets : Catalogue CRUD, Builder, Résolution)
```

### Phases exécutées

**P1 — Backend endpoints**
- `PUT /api/billing/marketplace/:code/toggle` — Active/désactive un module via `configurationService.toggleModule()`
- `GET /api/billing/marketplace/mes-modules` — Modules résolus + statut abonnement

**P2 — Suppression routes vides + nettoyage**
- 6 fichiers routes supprimés + 3 composants/hooks (`mes-modules-page`, `mes-module-card`, `use-mes-modules`)
- `_auth.facturation.tsx` nettoyé (ModulesActifs + UsageMeters retirés)

**P3 — Marketplace refondue**
- `_auth.marketplace.tsx` réécrit (898 lignes, 3 onglets)
- `module-toggle-card.tsx` créé (253 lignes, toggle ON/OFF avec mutation API)

**P4 — Fusion platform.modules + builder**
- `platform.modules.tsx` réécrit avec 3 onglets (Catalogue CRUD, Builder import/export, Résolution)
- `platform.modules.builder.tsx` supprimé

**P5 — Navigation**
- `Sidebar.tsx` : "Mes Modules" + "Marketplace" → "Modules" (pointe vers `/marketplace`)
- `platform-sidebar.tsx` : entrée "Module Builder" supprimée

**P6 — Migration + finalisation**
- Migration `207-consolidation-modules.sql` (nettoyage ParametreSysteme, index performance)
- Barrel exports mis à jour, route tree vérifié

### Fichiers créés (3)
- `frontend/src/features/modules/components/module-toggle-card.tsx`
- `backend/database/migrations/207-consolidation-modules.sql`
- (plan markdown)

### Fichiers modifiés (5)
- `backend/src/modules/billing/controllers/marketplace.controller.ts` — 2 endpoints ajoutés
- `frontend/src/routes/_auth.marketplace.tsx` — Réécrit (3 onglets)
- `frontend/src/routes/_auth.facturation.tsx` — Nettoyé
- `frontend/src/routes/platform.modules.tsx` — Réécrit (3 onglets)
- `frontend/src/components/layout/Sidebar.tsx` — "Mes Modules" → "Modules"
- `frontend/src/components/layout/platform-sidebar.tsx` — Builder supprimé
- `frontend/src/features/modules/components/index.ts` — Exports mis à jour

### Fichiers supprimés (10)
- `frontend/src/routes/_auth.modules-complementaires.tsx`
- `frontend/src/routes/_auth.modules-organisationnels.tsx`
- `frontend/src/routes/_auth.modules-pedagogiques.tsx`
- `frontend/src/routes/_auth.modules-administratifs.tsx`
- `frontend/src/routes/_auth.modules-pedagogique-avance.tsx`
- `frontend/src/routes/_auth.mes-modules.tsx`
- `frontend/src/routes/platform.modules.builder.tsx`
- `frontend/src/features/modules/components/mes-modules-page.tsx`
- `frontend/src/features/modules/components/mes-module-card.tsx`
- `frontend/src/features/modules/hooks/use-mes-modules.ts`

---

## Refonte Modules SaaS v9.1 — Déduplication Routes & Navigation (✅ TERMINÉ)

> Contexte : Suite v9 — élimination des dernières redondances entre pages tenant et plateforme.
> 3 problèmes identifiés : `_auth.facturation.tsx` doublonnait `mon-abonnement.tsx`, `platform.abonnements.tsx` était un placeholder vide, onglet "Modules actifs" dans `mon-abonnement.tsx` chevauchait "Mes Modules" dans `marketplace.tsx`.

### Décisions architecturales
- **Tenant** : 2 pages distinctes — `marketplace.tsx` (modules) + `mon-abonnement.tsx` (abonnement/factures/quotas)
- **Platform** : 2 pages spécialisées — `modules.tsx` (catalogue/builder) + `facturation.tsx` (plans/abonnements/revenus)
- **Nettoyage** : Complet (redirections, sidebar, CommandPalette, imports, composants morts, dark mode)

### Modifications exécutées

**T1 — Nettoyage mon-abonnement.tsx**
- Onglet "Modules actifs" supprimé (redondant avec marketplace "Mes Modules")
- Hook `useFeatureFlags` retiré (non utilisé)
- Composant `ModulesTab` supprimé
- Commentaire orphelin "// Modules Tab" retiré

**T2 — Redirection _auth.facturation.tsx**
- Remplacé par `redirect({ to: '/mon-abonnement' })` (16 lignes)

**T3 — Redirection platform.abonnements.tsx**
- Remplacé par `redirect({ to: '/platform/facturation' })` (16 lignes)

**T4 — Redirection platform.revenus.tsx**
- Remplacé par `redirect({ to: '/platform/facturation' })` (16 lignes)
- Placeholder vide (KPIs à "—") → doublon avec onglet Revenus de `platform.facturation.tsx`

**T5 — Suppression composants billing morts (4)**
- `abonnement-info.tsx` (94 lignes) — jamais importé
- `facture-list.tsx` (154 lignes) — jamais importé
- `tranche-simulateur.tsx` (129 lignes) — jamais importé
- `ui-billing.tsx` (224 lignes) — jamais importé
- Total : 601 lignes de code mort supprimées

**T6 — Navigation mise à jour**
- `Sidebar.tsx` : "Mon Abonnement" ajouté dans section Système
- `platform-sidebar.tsx` : entrées "abonnements" + "revenus" supprimées, imports `Star` + `DollarSign` retirés
- `CommandPalette.tsx` : entrées `p-revenus` + `p-abonnements` supprimées, `p-facturation` enrichi (keywords: revenus, mrr, arr), imports `DollarSign` + `Star` retirés

**T7 — Dark mode — couleurs hardcodées corrigées**
- `mon-abonnement.tsx` : `bg-green-100` → `bg-emerald-500/10`, `text-gray-500` → `text-muted-foreground`, `bg-gray-100` → `bg-muted`
- `marketplace.tsx` : `bg-zinc-800` → `bg-muted`, `text-zinc-500` → `text-muted-foreground`

### Fichiers modifiés (8)
- `frontend/src/routes/_auth.mon-abonnement.tsx` — Onglet modules + commentaire supprimés, dark mode
- `frontend/src/routes/_auth.facturation.tsx` → redirection
- `frontend/src/routes/platform.abonnements.tsx` → redirection
- `frontend/src/routes/platform.revenus.tsx` → redirection
- `frontend/src/routes/_auth.marketplace.tsx` — Dark mode corrigé
- `frontend/src/components/layout/Sidebar.tsx` — Mon Abonnement ajouté
- `frontend/src/components/layout/platform-sidebar.tsx` — abonnements + revenus retirés
- `frontend/src/components/CommandPalette.tsx` — p-revenus + p-abonnements supprimés

### Fichiers supprimés (4)
- `frontend/src/features/billing/components/abonnement-info.tsx`
- `frontend/src/features/billing/components/facture-list.tsx`
- `frontend/src/features/billing/components/tranche-simulateur.tsx`
- `frontend/src/features/billing/components/ui-billing.tsx`

---

## Refonte Modules SaaS v10 — Reorganisation Navigation & Terminologie (✅ EN COURS)

> Contexte : Refonte complète de la navigation billing tenant et de la terminologie des modules.
> 1. Remplacer 'CRITIQUE' par 'BASE' (meilleures pratiques SaaS)
> 2. Renommer 'Modules' en 'Marché' (FR) / 'Marketplace' (EN)
> 3. Créer un menu 'Mon Établissement' avec 7 sous-menus
> 4. Séparer les responsabilités (abonnements, factures, plans, usage, marché)

### Phase P1 — CRITIQUE → BASE (✅ COMPLET)

**Justification** : Dans l'industrie SaaS, les modules fondamentaux toujours inclus sont appelés "Base" / "Core" / "Foundation" — jamais "Critique" (connotation négative).

**Backend** :
- `module-catalogue.entity.ts` : enum `CategorieModule.BASE` (was CRITIQUE)
- `entitlement.service.ts` : `MODULES_BASE_BYPASS`, type `EntitlementRaison: 'BASE'`, source `'base'`
- `configuration.service.ts` : protection modules BASE
- `marketplace.controller.ts` : `MODULE_BASE_NON_DESACTIVABLE`
- `seed-modules-catalogue.ts` : 8 modules BASE
- Migration `208-categorie-critique-vers-base.sql` (idempotente)

**Shared** :
- `modules.enum.ts` : `ModuleCategory.BASE` + 14 mappings

**Frontend** :
- `_auth.marketplace.tsx`, `platform.modules.tsx`, `module-toggle-card.tsx`, `ModuleGrid.tsx`, `config-module-card.tsx`, `ModulesTab.tsx`, `configuration.types.ts`, `module-analytics-dashboard.tsx`, `platform.tarifs.tsx`
- i18n : `fr/admin.json`, `en/admin.json`, `fr/modules.json`, `en/modules.json`

### Phase P2 — Modules → Marché/Marketplace (✅ COMPLET)

- `Sidebar.tsx` : label "Modules" → "Marché" dans section Système
- Séparation Control Plane / Data Plane : plateforme = "Catalogue modules" (technique), tenant = "Marché" (commercial)

### Phase P3 — Menu "Mon Établissement" (✅ COMPLET)

**Sidebar restructurée** — Nouvelle section "Mon Établissement" avec 6 items :
```
Mon Établissement
├── Établissements        (depuis Organisation Académique)
├── Groupes               (depuis Organisation Académique)
├── Abonnements           → /mon-abonnement (3 tabs: aperçu, usage/quotas, historique)
├── Factures              → /factures (page dédiée)
├── Plans d'abonnement    → /plans (NOUVEAU — catalogue + comparaison + simulateur)
└── Marché                → /marketplace

Système (réduit)
├── Configuration
└── Paramètres
```

**Nouvelle page `/plans`** — `_auth.plans.tsx` (545 lignes) :
- 3 modes de vue : Catalogue (cartes), Comparer (matrice), Simulateur
- Cartes de plans avec couleurs/icônes dynamiques (slug-based)
- Matrice de comparaison : modules, capacités, tranches
- Simulateur tarifaire intégré (composant `PlanSimulator` existant)
- Actions upgrade/downgrade avec mutation

**`mon-abonnement.tsx` simplifié** :
- Onglets réduits de 5 → 3 (aperçu, usage/quotas, historique)
- Tabs "Factures" et "Simulateur" retirés (redondants avec `/factures` et `/plans`)
- Titre mis à jour : "Abonnements" — "Vue d'ensemble de votre abonnement, consommation et historique"

### Fichiers créés/modifiés v10

| Fichier | Phase | Action |
|---------|-------|--------|
| `backend/src/modules/billing/entities/module-catalogue.entity.ts` | P1 | Enum CRITIQUE → BASE |
| `shared/src/enums/modules.enum.ts` | P1 | ModuleCategory.CRITIQUES → BASE |
| `backend/src/modules/billing/services/entitlement.service.ts` | P1 | Types, constante, cascade |
| `backend/src/modules/configuration/services/configuration.service.ts` | P1 | Protection modules BASE |
| `backend/src/modules/configuration/controllers/configuration.controller.ts` | P1 | raisonBlocage |
| `backend/src/modules/billing/controllers/marketplace.controller.ts` | P1 | MODULE_BASE_NON_DESACTIVABLE |
| `backend/src/common/middlewares/module-access.middleware.ts` | P1 | Commentaire |
| `backend/src/database/seeds/system/seed-modules-catalogue.ts` | P1 | 8 modules BASE |
| `backend/database/migrations/208-categorie-critique-vers-base.sql` | P1 | Migration idempotente |
| `frontend/src/routes/_auth.marketplace.tsx` | P1 | Filtres, labels BASE |
| `frontend/src/routes/platform.modules.tsx` | P1 | 16+ occurrences BASE |
| `frontend/src/features/modules/components/module-toggle-card.tsx` | P1 | isBase, labels |
| `frontend/src/features/modules/components/ModuleGrid.tsx` | P1 | Type, filtres |
| `frontend/src/features/modules/components/config-module-card.tsx` | P1 | isBase, label |
| `frontend/src/features/configuration/components/ModulesTab.tsx` | P1 | Order array |
| `frontend/src/features/configuration/types/configuration.types.ts` | P1 | Type ModuleCategory |
| `frontend/src/features/admin/components/module-analytics-dashboard.tsx` | P1 | Icon, condition |
| `frontend/src/routes/platform.tarifs.tsx` | P1 | Type categorie |
| `frontend/src/locales/{fr,en}/admin.json` | P1 | Clés catBase |
| `frontend/src/locales/{fr,en}/modules.json` | P1 | BASE key |
| `frontend/src/components/layout/Sidebar.tsx` | P2+P3 | Label Marché + section Mon Établissement |
| `frontend/src/routes/_auth.plans.tsx` | P3 | NOUVEAU (545 lignes) |
| `frontend/src/routes/_auth.mon-abonnement.tsx` | P3 | 5 tabs → 3 tabs, titre |

---

## Migration 210 — Refonte Feature Flags (✅ COMPLET)

> Plan : `/home/franck/.config/Qoder/SharedClientCache/cache/plans/Refonte_Feature_Flags_Complet_task-0f7.md`
> Sources : 2 rapports d'analyse (`docs/rapports/RAPPORT-ANALYSE-FEATURE-FLAGS-ELISASCHOOL.html`, `_output/RAPPORT-FEATURE-FLAGS-ANALYSE-COMPLETE.html`)
> Contexte : 8 recommandations R1-R8 consolidées. Feature flags hardcodés dans le frontend, pas de registre centralisé, pas d'audit trail, pas de rollout progressif.

### Architecture

**Registre centralisé** : Table `feature_flag_definitions` — 8 flags système seedés + flags custom.
**Audit trail** : Table `feature_flags_history` — traçabilité complète (qui, quoi, quand, ancienne/nouvelle valeur).
**Progressive rollout** : Hash stable sur UUID établissement → activation pour N% des établissements.
**Segments** : Règles JSONB de ciblage avancé (plan, taille, groupe).
**Unification** : `EntitlementService.checkCapability()` — point d'entrée unique pour modules ET feature flags.

### Phases implémentées (7)

**Phase 1 — Migration SQL + Entités** :
- `backend/database/migrations/210-feature-flag-definitions.sql` (224 lignes) — Tables, seed 8 flags, index, trigger, vue expired
- `backend/src/modules/billing/entities/feature-flag-definition.entity.ts` (90 lignes) — Enums CategorieFlag, TypeFlag
- `backend/src/modules/billing/entities/feature-flag-history.entity.ts` (72 lignes) — Enum ActionFeatureFlag

**Phase 2 — Services + Unification** :
- `backend/src/modules/billing/services/feature-flag-definition.service.ts` (357 lignes) — CRUD, cache 60s, historique, expiration, orphelins
- `backend/src/modules/billing/services/feature-flags.service.ts` — +194 lignes : isEnabledWithRollout(), getAllFlagsWithMetadata(), evaluateSegments(), logHistory()
- `backend/src/modules/billing/services/entitlement.service.ts` — +105 lignes : checkCapability() unification R1
- `backend/src/modules/billing/controllers/billing.controller.ts` — +148 lignes : 7 endpoints API (definitions CRUD, expired, by-category, history, metadata)

**Phase 3 — Frontend dynamique** :
- `frontend/src/hooks/use-feature-management.ts` (178 lignes) — Hook unifié R8 (definitions, flags, modules, isEnabled, checkModuleAccess)
- `frontend/src/features/admin/components/plan-form-modal.tsx` — MODULES_CATALOG + FEATURE_FLAGS_LIST hardcodés → API dynamique (fallback si API échoue)

**Phase 4 — Dashboard Platform** :
- `frontend/src/routes/platform.feature-flags.tsx` (432 lignes) — Page 4 onglets (Définitions, Matrice, Audit, Expirés)
- `frontend/src/features/admin/components/feature-flag-definition-form.tsx` (317 lignes) — Modal CRUD
- `frontend/src/features/admin/components/feature-flags-matrix.tsx` (308 lignes) — Matrice établissements × flags
- `frontend/src/features/admin/components/feature-flags-audit-log.tsx` (245 lignes) — Historique paginé
- `frontend/src/components/layout/platform-sidebar.tsx` — Navigation Feature Flags ajoutée (icône ToggleRight)

**Phase 5 — Cron + ConsistencyChecker** :
- `backend/src/modules/billing/cron-jobs.ts` — +80 lignes : cronExpiredFlags() (détection, log, désactivation auto)
- `backend/src/modules/configuration/services/config-consistency.service.ts` — +58 lignes : checkExpiredFeatureFlags() (WARNING) + checkOrphanDefinitionFlags() (INFO)

**Phase 6 — Nettoyage** :
- `frontend/src/features/admin/components/feature-flags-manager.tsx` — Utilise endpoint /metadata (labels/descriptions dynamiques), humanizeFlagName() + getFlagDescription() conservés comme fallback

**Phase 7 — i18n** :
- `frontend/src/locales/{fr,en}/admin.json` — Namespace featureFlags complet (tabs, form, matrix, audit) + navigation sidebar

### Endpoints API ajoutés

```
GET    /api/platform/facturation/feature-flags/definitions           — Liste toutes les définitions
POST   /api/platform/facturation/feature-flags/definitions           — Créer définition
PATCH  /api/platform/facturation/feature-flags/definitions/:id       — Modifier
DELETE /api/platform/facturation/feature-flags/definitions/:id       — Supprimer
GET    /api/platform/facturation/feature-flags/definitions/expired   — Flags expirés + orphelins
GET    /api/platform/facturation/feature-flags/definitions/by-category — Groupés par catégorie
GET    /api/platform/facturation/feature-flags/history               — Historique audit (paginé)
GET    /api/platform/facturation/feature-flags/:etab/metadata        — Flags + metadata
```

### Fichiers créés (9)

| Fichier | Lignes | Phase |
|---------|--------|-------|
| `backend/database/migrations/210-feature-flag-definitions.sql` | 224 | 1.1 |
| `backend/src/modules/billing/entities/feature-flag-definition.entity.ts` | 90 | 1.2 |
| `backend/src/modules/billing/entities/feature-flag-history.entity.ts` | 72 | 1.2 |
| `backend/src/modules/billing/services/feature-flag-definition.service.ts` | 357 | 2.1 |
| `frontend/src/hooks/use-feature-management.ts` | 178 | 3.2 |
| `frontend/src/routes/platform.feature-flags.tsx` | 432 | 4.1 |
| `frontend/src/features/admin/components/feature-flag-definition-form.tsx` | 317 | 4.2 |
| `frontend/src/features/admin/components/feature-flags-matrix.tsx` | 308 | 4.3 |
| `frontend/src/features/admin/components/feature-flags-audit-log.tsx` | 245 | 4.4 |

### Fichiers modifiés (10)

| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/billing/entities/index.ts` | +exports FeatureFlagDefinition, FeatureFlagHistory |
| `backend/src/modules/billing/services/index.ts` | +exports FeatureFlagDefinitionService |
| `backend/src/modules/billing/services/feature-flags.service.ts` | +rollout, +metadata, +segments, +history |
| `backend/src/modules/billing/services/entitlement.service.ts` | +checkCapability() unification |
| `backend/src/modules/billing/controllers/billing.controller.ts` | +7 endpoints definitions/history |
| `backend/src/modules/billing/cron-jobs.ts` | +cronExpiredFlags() |
| `backend/src/modules/configuration/services/config-consistency.service.ts` | +2 vérifications flags |
| `frontend/src/features/admin/components/plan-form-modal.tsx` | Hardcodage → API dynamique |
| `frontend/src/features/admin/components/feature-flags-manager.tsx` | Metadata API + fallback |
| `frontend/src/components/layout/platform-sidebar.tsx` | +nav Feature Flags |
| `frontend/src/hooks/index.ts` | +export useFeatureManagement |
| `frontend/src/locales/{fr,en}/admin.json` | +clés featureFlags complètes |

---

## CMS V2 — Refonte Visuelle Complète (✅ TERMINÉ)

> Contexte : Refonte complète du CMS white-label avec Puck Editor, animations avancées, SEO, export/import, et contenu dynamique.

### Phase 5A — Contenu Dynamique CMS (✅ COMPLET)
- **5 nouvelles entités** : CmsActualite, CmsTemoignage, CmsEvenement, CmsPartenaire, CmsAbonnementNewsletter
- **Migration 211** : 5 tables + RLS + 19 permissions RBAC
- **CRUD complet** : `cms-content.service.ts` (430 lignes), `cms-content.controller.ts` (280 lignes, 21 routes)
- **API publique** : 7 nouvelles routes sous `/api/public/e/:code/` (actualités, témoignages, événements, partenaires, newsletter)
- **DataBinding enrichi** : Sources actualités, témoignages, événements, partenaires ajoutées

### Phase 5B — Animations Avancées (✅ COMPLET)
- **Bibliothèque** : `frontend/src/features/cms/lib/animations.ts` (363 lignes)
- **15 variants** : fade-in, slide-up/down/left/right, zoom, zoom-out, flip-x/y, rotate, blur, scale-up, bounce, elastic, none
- **7 easings** : easeOut, easeIn, easeInOut, linear, spring, bounce, elastic
- **6 hover effects** : none, lift, glow, scale, tilt, shadow, border-glow
- **Presets** : hero, card, testimonial, stats, timeline, gallery, partner, cta, standard

### Phase 5C — 10 Nouvelles Sections Puck (✅ COMPLET)
- **28 composants Puck** au total (18 existants + 10 nouveaux) dans 6 catégories
- **Nouveaux** : Carousel, Timeline, Tabs, Newsletter, HeroVideo, CompteursAnimes, TemoignageCarousel, PrixTab, IconeFeatures, GalerieMasonry
- **10 nouveaux SectionType** ajoutés aux entities backend et types frontend

### Phase 5D — Personnalisation Avancée (✅ COMPLET)
- **Styles partagés** : `puck/shared-styles.ts` (379 lignes)
- **Types** : ButtonStyle, TypographyStyle, BackgroundStyle, SpacingStyle, BorderStyle, ShadowStyle
- **4 presets** : heroClassic, contentStandard, darkElegant, cardSoft
- **Helpers CSS** : typographyToCSS, backgroundToCSS, spacingToCSS, borderToCSS, shadowToCSS, mergeSectionStyles
- **Options UI** : BUTTON_VARIANTS, BUTTON_SIZES, GRADIENT_DIRECTIONS

### Phase 5E — SEO + Responsive Preview (✅ COMPLET)
- **SeoPanel** (212 lignes) : Score SEO temps réel (0-100), aperçu Google, meta title/description, slug, OG, noindex
- **ResponsivePreview** (123 lignes) : 6 presets devices (320px→pleine largeur), zoom 25-200%
- **Intégration éditeur** : 3 boutons toggle dans la barre d'outils (Responsive, SEO, JSON)

### Phase 5F — Export/Import + Sécurité (✅ COMPLET)
- **Export JSON** : `GET /api/cms/pages/:id/export?format=json|puck` — téléchargement fichier
- **Import JSON** : `POST /api/cms/pages/import` — création page depuis JSON (slug unique auto)
- **Composant frontend** : `ExportImportPanel.tsx` (346 lignes) — export 2 formats, import drag&drop, preview
- **Honeypot anti-spam** : Contact + Newsletter (champ `_honeypot` caché, réponse 201 silencieuse)
- **Panneau latéral éditeur** : SEO, Export/Import, Responsive intégrés dans `_auth.cms.pages.$id.tsx`

### Fichiers créés CMS V2 (25+ nouveaux)
| Fichier | Lignes | Phase |
|---------|--------|-------|
| `backend/src/modules/cms/entities/cms-content.entity.ts` | 298 | 5A |
| `backend/database/migrations/211-cms-content-entities.sql` | 204 | 5A |
| `backend/src/modules/cms/dto/cms-content.dto.ts` | 138 | 5A |
| `backend/src/modules/cms/services/cms-content.service.ts` | 430 | 5A |
| `backend/src/modules/cms/controllers/cms-content.controller.ts` | 280 | 5A |
| `frontend/src/features/cms/lib/animations.ts` | 363 | 5B |
| `frontend/src/features/cms/puck/components/CarouselPuck.tsx` | 107 | 5C |
| `frontend/src/features/cms/puck/components/TimelinePuck.tsx` | 68 | 5C |
| `frontend/src/features/cms/puck/components/TabsPuck.tsx` | 71 | 5C |
| `frontend/src/features/cms/puck/components/NewsletterPuck.tsx` | 56 | 5C |
| `frontend/src/features/cms/puck/components/HeroVideoPuck.tsx` | 71 | 5C |
| `frontend/src/features/cms/puck/components/CompteursAnimesPuck.tsx` | 69 | 5C |
| `frontend/src/features/cms/puck/components/TemoignageCarouselPuck.tsx` | 78 | 5C |
| `frontend/src/features/cms/puck/components/PrixTabPuck.tsx` | 76 | 5C |
| `frontend/src/features/cms/puck/components/IconeFeaturesPuck.tsx` | 58 | 5C |
| `frontend/src/features/cms/puck/components/GalerieMasonryPuck.tsx` | 89 | 5C |
| `frontend/src/features/cms/puck/shared-styles.ts` | 379 | 5D |
| `frontend/src/features/cms/components/SeoPanel.tsx` | 212 | 5E |
| `frontend/src/features/cms/components/ResponsivePreview.tsx` | 123 | 5E |
| `frontend/src/features/cms/components/ExportImportPanel.tsx` | 346 | 5F |

### Fichiers modifiés CMS V2 (10+)
| Fichier | Modification |
|---------|-------------|
| `backend/src/modules/cms/entities/cms.entity.ts` | +10 SectionType |
| `backend/src/modules/cms/services/cms.service.ts` | +exporterPage(), +importerPage() |
| `backend/src/modules/cms/controllers/cms.controller.ts` | +2 routes export/import |
| `backend/src/modules/cms/controllers/public-etablissement.controller.ts` | +honeypot contact/newsletter |
| `backend/src/modules/cms/dto/cms.dto.ts` | +exportPageSchema, importPageSchema, honeypot |
| `backend/src/modules/cms/dto/cms-content.dto.ts` | +honeypot newsletter |
| `backend/src/modules/cms/services/data-binding.service.ts` | +sources CMS (actualités, témoignages, etc.) |
| `backend/src/app.ts` | +route /api/cms/contenu |
| `frontend/src/features/cms/types/cms.types.ts` | +10 SectionType, AnimationType, HoverEffect |
| `frontend/src/features/cms/puck/config.tsx` | 28 composants, mappings complets |
| `frontend/src/routes/_auth.cms.pages.$id.tsx` | +panneaux SEO/Export/Responsive |
| `frontend/src/routes/e.$code.contact.tsx` | +honeypot anti-spam |

---

## Phase 7 — CMS V2 Outils Avancés (✅ TERMINÉ)

> Contexte : Outils d'édition avancés pour l'éditeur CMS Puck — personnalisation visuelle, conditions d'affichage, métriques, navigation, mode focus, command palette.

### 7A — Style Editor Panel (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/StyleEditorPanel.tsx` (569 lignes)
- Accordéon 6 sections : Typographie, Arrière-plan, Espacement, Bordure, Ombre, Bouton
- 4 presets rapides : heroClassic, contentStandard, darkElegant, cardSoft
- Preview live, copie CSS, réinitialisation, application globale
- Utilise les types de `shared-styles.ts` (ButtonStyle, TypographyStyle, etc.)

### 7B — Section Clipboard (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/SectionClipboard.tsx` (319 lignes)
- Hook `useSectionClipboard` : copier, coller, supprimer, exporter/importer JSON
- Stockage localStorage (max 10 items, clé `cms:section-clipboard`)
- Panneau UI avec recherche, sections courantes pour copier, clipboard pour coller

### 7C — Visibility Conditions (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/VisibilityEditor.tsx` (320 lignes)
- Type `VisibilityCondition` : breakpoints responsive, rôles autorisés/exclus, plage de dates
- Fonction `evaluerVisibilite()` pour évaluation runtime
- Fonction `genererCSSVisibilite()` pour media queries CSS
- 3 onglets : Écrans, Rôles, Dates

### 7D — Anchor Navigation (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/AnchorNav.tsx` (258 lignes)
- Hook `useScrollSpy` (IntersectionObserver), hook `useAutoAnchors` (scan DOM)
- 3 modes : sidebar sticky, floating bouton, top barre
- Smooth scroll, sommaire auto-généré depuis les titres

### 7E — Content Metrics (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/ContentMetrics.tsx` (369 lignes)
- Hook `useContentMetrics` : extraction texte depuis props Puck, comptage mots/caractères/phrases
- Fonction `calculerScoreQualite()` : score 0-100 (lisibilité, SEO, richesse, structure)
- Recommandations contextuelles (error/warning/info/success)
- Détail par section avec temps de lecture

### 7F — Focus Mode (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/FocusMode.tsx` (246 lignes)
- Hook `useFocusMode` : toggle, exit, settings persistés localStorage
- Overlay plein écran, fond personnalisable (white/dark/sepia/custom)
- Raccourcis : Échap (quitter), F11 (toggle)
- 4 largeurs : étroit, normal, large, pleine

### 7G — Command Palette (✅ COMPLET)
- **Fichier** : `frontend/src/features/cms/components/CommandPalette.tsx` (364 lignes)
- Recherche fuzzy dans 20+ commandes (actions, panneaux, insertions, outils)
- Navigation clavier (flèches + Entrée + Échap)
- Raccourci Ctrl+K / Cmd+K
- Insertion rapide de sections (Hero, Texte, Galerie, Vidéo, FAQ, CTA, Timeline, Carousel)

### 7H — Migration Backend (✅ COMPLET)
- **Migration** : `backend/database/migrations/212-cms-phase7-avance.sql` (51 lignes)
- Nouvelles colonnes `cms_sections` : `conditionsVisibilite` (jsonb), `styleConfig` (jsonb)
- Nouvelles colonnes `cms_pages` : `focusPreferences` (jsonb), `qualiteScore` (int), `analytics` (jsonb)
- Index GIN sur `conditionsVisibilite`, index sur `qualiteScore`
- **Entités** : `cms.entity.ts` mis à jour avec les nouvelles colonnes
- **DTOs** : `cms.dto.ts` — `createSectionSchema` + `updatePageSchema` étendus

### Intégration éditeur (✅ COMPLET)
- `_auth.cms.pages.$id.tsx` : 10 boutons toolbar ajoutés (Style, Clipboard, Visibilité, Qualité, Focus, Command Palette)
- Panneau latéral étendu pour les 4 nouveaux panneaux
- Command Palette intégrée avec navigation vers tous les panneaux
- Raccourcis mis à jour : Ctrl+K (Command Palette), F11/Échap (Focus)

### Fichiers créés/modifiés Phase 7
| Fichier | Lignes | Action |
|---------|--------|--------|
| `frontend/src/features/cms/components/StyleEditorPanel.tsx` | 569 | NOUVEAU |
| `frontend/src/features/cms/components/SectionClipboard.tsx` | 319 | NOUVEAU |
| `frontend/src/features/cms/components/VisibilityEditor.tsx` | 320 | NOUVEAU |
| `frontend/src/features/cms/components/AnchorNav.tsx` | 258 | NOUVEAU |
| `frontend/src/features/cms/components/ContentMetrics.tsx` | 369 | NOUVEAU |
| `frontend/src/features/cms/components/FocusMode.tsx` | 246 | NOUVEAU |
| `frontend/src/features/cms/components/CommandPalette.tsx` | 364 | NOUVEAU |
| `backend/database/migrations/212-cms-phase7-avance.sql` | 51 | NOUVEAU |
| `backend/src/modules/cms/entities/cms.entity.ts` | +22 | Modifié (colonnes) |
| `backend/src/modules/cms/dto/cms.dto.ts` | +12 | Modifié (schémas) |
| `frontend/src/routes/_auth.cms.pages.$id.tsx` | +149 | Modifié (intégration) |

### Vérification
- Frontend TypeScript : 0 erreurs CMS
- Backend TypeScript : 0 erreurs CMS
- 66 fichiers CMS frontend

---

## Corrections Invariants V3 — Audit Rapport (2026-08-16)

> Source : `docs/rapports/RAPPORT-REFONTE-PLANS-MODULES-QUOTAS-ENTITLEMENTS-V3.html`
> 12 problèmes identifiés (I1-I12), 6 corrigés cette session.

### I1 — statut=EXPIRE + dateExpirationReelle (CRITIQUE)
- **Fichier** : `backend/src/modules/billing/cron-jobs.ts` — `cronExpirationEssai()`
- **Correction** : `EN_ATTENTE` → `ESSAI` (le bon statut créé par onboarding), `ANNULE` → `EXPIRE` + `dateExpirationReelle = maintenant`
- **Impact** : Déclenche la dégradation gracieuse (READ_ONLY → LOCKED → ARCHIVED) via `entitlementService.resoudrePhaseExpiration()`

### I2 — Middleware requirePlanActif monté globalement (CRITIQUE)
- **Fichier** : `backend/src/app.ts`
- **Correction** : `app.use('/api/', requirePlanActif([...exemptPaths]))` monté après `rlsTransactionEnd`
- **Exemptions** : `/auth`, `/configuration`, `/notifications`, `/utilisateurs`, `/billing`, `/platform`, etc.
- **Impact** : Hard-gate — 402 `AUCUN_PLAN_ACTIF` si aucun abonnement ACTIF/ESSAI

### I3 — requireQuota 403 → 429 + headers X-Quota
- **Fichier** : `backend/src/modules/billing/services/quota.service.ts`
- **Correction** : HTTP 403 → 429 (Too Many Requests), headers `X-Quota-Resource/Usage/Limit/Percentage`
- **Impact** : Sémantique HTTP correcte + observabilité quota dans les réponses

### I4 — FeatureFlagService considère statut ESSAI
- **Fichier** : `backend/src/modules/billing/services/feature-flags.service.ts`
- **Correction** : `statut: ACTIF` → `statut: In([ACTIF, ESSAI])` dans `isEnabled()`, `getAllFlags()`, `evaluateSegments()`
- **Impact** : Les fonctionnalités du plan sont accessibles pendant la période d'essai

### I5 — cronRenouvellementAuto ferme l'ancien abonnement
- **Fichier** : `backend/src/modules/billing/cron-jobs.ts`
- **Correction** : Avant de créer le nouveau, l'ancien reçoit `statut=EXPIRE` + `dateExpirationReelle=now()`
- **Impact** : Plus d'accumulation d'abonnements ACTIF avec dateFin dépassée

### I10 — i18n modules.json BASE/PREMIUM/ADDON → GRATUIT/PAYANT
- **Fichiers** : `frontend/src/locales/{fr,en}/modules.json`
- **Correction** : Catégories remplacées, raisons alignées v3 (`AUCUN_PLAN`, `MODULE_DESACTIVE`, `DEGRADATION_ARCHIVE`)

### Corrections annexes
- `param-validation.ts` : `billing.tranche_eleves/tranche_montant` remplacés par 14 paramètres v3 (onboarding, essai, facturation, expiration, dunning)
- `tenant-backup.service.ts` + `database-backup.service.ts` : `usage_meters` → `usage_unifie`
- `seed-parametres-billing.ts` : `mapType('ENUM')` explicité (fallback STRING)

### Problèmes déjà résolus (sessions antérieures)
- I6 (lien mort `/platform/permissions`) ✅
- I7 (guards incohérents) ✅ — `requirePlatformAccess()` + CASL
- I9 (code mort onboarding-wizard, provider-config-modal) ✅
- I11 (inscription self-service) ✅ — `creerAbonnementInitial()` + marketplace
- I12 (paramètre `billing.plan_par_defaut`) ✅ — seedé

### Fichiers modifiés cette session
| Fichier | Correction |
|---------|------------|
| `backend/src/modules/billing/cron-jobs.ts` | I1 + I5 |
| `backend/src/app.ts` | I2 |
| `backend/src/modules/billing/services/quota.service.ts` | I3 |
| `backend/src/modules/billing/services/feature-flags.service.ts` | I4 |
| `frontend/src/locales/fr/modules.json` | I10 |
| `frontend/src/locales/en/modules.json` | I10 |
| `backend/src/modules/configuration/utils/param-validation.ts` | Annexe |
| `backend/src/modules/configuration/services/backup/tenant-backup.service.ts` | Annexe |
| `backend/src/modules/configuration/services/backup/database-backup.service.ts` | Annexe |
| `backend/src/database/seeds/system/seed-parametres-billing.ts` | Annexe |

---

## Exécution Migration 213 + Seeds v3 — 2026-08-16

### Migration 213 (`213-refonte-entitlements-v3.sql`)
- **Backup DB** avant exécution : 27957 lignes
- **Correction migration** : INSERT conditionnels (`DO $$ IF EXISTS`) pour `quotas_utilisation` et `usage_meters` (tables déjà supprimées par TypeORM synchronize)
- **Résultat** : COMMIT réussi — toutes les opérations idempotentes
- **Données vérifiées** :
  - 4 modules critiques (auth, configuration, notifications, utilisateurs) → GRATUIT + estCritique=true
  - 5 plans avec rang (0→4) et tarification JSONB
  - 4 cycles de facturation, 4 packs quota, 2 stratégies expiration
  - 18 paramètres billing, 8 feature flags, 10 remises

### Corrections Frontend (alignement v3)
- **`groupes-saas-page.tsx`** : Onglet "Tranches" (obsolète) → "Remises" (v3 `RemisesTab` avec API `/api/billing/remises`)
- **`ModulesTab.tsx`** : Badge "Premium" → "Payant" + ajout raisons blocage v3 (`AUCUN_PLAN`, `DEGRADATION_ARCHIVE`)
- **`platform.debug.entitlements.tsx`** : Suppression import inutilisé (`useTranslation`)

### Corrections Backend (tsc)
- **`cron-jobs.ts`** : Import dynamique corrigé `'./entitlement.service'` → `'./services/entitlement.service'`

### Vérification TypeScript
- **Backend** : 0 erreur v3 (126 erreurs préexistantes dans paiement/platform — non liées)
- **Frontend** : 0 erreur sur fichiers modifiés

### Fichiers modifiés (exécution)
| Fichier | Changement |
|---------|-----------|
| `backend/database/migrations/213-refonte-entitlements-v3.sql` | INSERT conditionnels (IF EXISTS) |
| `backend/src/modules/billing/cron-jobs.ts` | Import path corrigé |
| `frontend/src/features/admin/components/groupes-saas-page.tsx` | TranchesTab → RemisesTab |
| `frontend/src/features/configuration/components/ModulesTab.tsx` | Badge Payant + raisons v3 |
| `frontend/src/routes/platform.debug.entitlements.tsx` | Import inutilisé supprimé |

---

## Audit Roadmap V3 — Phases 2 à 5 — 2026-08-16

### Phase 2 — Hard-gate middleware (✅ COMPLET)
- `requirePlanActif` monté globalement dans `app.ts` (exemptions : auth, config, billing, platform)
- `requireModuleAccess` avec dégradation gracieuse (LECTURE_SEULE → VERROUILLÉ → ARCHIVÉ)
- `requireQuota` middleware via `usage_unifie` (429 si dépassé)
- `packQuotaService` : quota effectif = plan.quotas + Σ packs actifs

### Phase 3 — Facturation v3 (✅ COMPLET)
- Formule : `(prixBase + max(0, nbÉlèves − franchise) × prixParEleve) × coefCycle − remises + modules + packs`
- OHADA : TVA 19.25% centièmes, numérotation FAC-OHADA-YYYY-NNNNNN
- Remises : moteur d'application (priorité DESC, non-cumulable exclusive, plancher 0)
- Packs : souscription prorata + quotaEffectif
- 16 endpoints client ajoutés (`/api/billing/remises|packs|cycles`)

### Phase 4 — Panel admin réorganisé (✅ COMPLET)
- Sidebar 10 groupes / 38 sous-items (conforme rapport V3)
- Pages dédiées : remises, packs-quota, cycles-strategies, fonctionnalites
- Routes backend : `platform.routes.ts` (directes) + `billing.controller.ts` (client)
- i18n FR/EN aligné (clés navigation.*, sidebar.groupe*)
- **Nettoyage** : 168 lignes de routes dupliquées supprimées dans `billing.controller.ts`
- **Correction** : `/packs/souscrits` inclut maintenant ESSAI + ACTIF

### Phase 5 — Onboarding self-service (⏭️ REPORTÉ)
- Backend fonctionnel : `billing.onboarding_mode`, `billing.plan_par_defaut`, essai 14j
- Frontend manquant : page publique inscription, sélection plan, wizard
- `onboarding-wizard.tsx` existe (293 lignes) mais non intégré (code mort I9)

### Recommandations identifiées
1. **Validation Zod** : Ajouter schémas Zod dans `platform.routes.ts` POST/PUT (convention §5)
2. **Route `/remises` client** : Filtrer par plan tenant + cible (GLOBAL + plan matching)
3. **RBAC granulaire** : Ajouter `requirePlatformCasl('manage', 'Remise')` sur routes commerce
4. **Page tenant** : `_auth.mon-abonnement.tsx` pourrait afficher remises/packs disponibles

### Fichiers modifiés (audit)
| Fichier | Changement |
|---------|-----------|
| `backend/src/modules/billing/controllers/billing.controller.ts` | −168 lignes doublons + fix ESSAI packs souscrits |

---

## Restructuration Sidebar Plateforme — Dédoublonnage v3.1 — 2026-08-16

> Contexte : Audit approfondi du menu latéral plateforme. 9 redondances identifiées (3 critiques, 3 hautes, 2 moyennes, 1 basse).

### Changements appliqués

**Sidebar (`platform-sidebar.tsx`)** : 10 groupes → 7 groupes, 37 items → 25 items (−32%)

| Action | Détail |
|--------|--------|
| Supprimé groupe **Analytics** | 4 items → 0. Tout le contenu était déjà dans `/platform/monitoring` |
| Supprimé groupe **Notifications** | 3 items → 0. Page `/notifications-config` absorbée dans Configuration |
| Supprimé groupe **Sauvegardes** | 3 items → 0. Redirigeait tous vers `/platform/configuration?tab=*` |
| Retiré **Paramètres cascade** de Sécurité | Doublon avec Configuration → Cascade multi-niveaux |
| Renommé **Sécurité** → **Sécurité & Audit** | Reflète mieux le contenu (audit, approbations, sessions) |
| Configuration : **Templates emails** → **Notifications** | Label plus clair, même page `/notifications-config` |
| Nettoyage imports | Supprimé Bell, BarChart3, HardDrive, History, RotateCcw, Globe |

**i18n (`admin.json` FR + EN)** :
- Supprimé clés sidebar orphelines : `groupeNotifications`, `groupeAnalytics`, `groupeSauvegardes`, `groupeTechnique`
- Supprimé clés navigation orphelines : `providersNotif`, `templates`, `testEnvoi`, `usageMetriques`, `alertes`, `exportRapports`, `planification`, `historique`, `restauration`, `templatesEmails`
- Mis à jour `groupeSecurite` : "Sécurité" → "Sécurité & Audit" / "Security" → "Security & Audit"

### Structure cible (7 groupes, 25 items)

```
📊 Pilotage (3) : Dashboard, Revenus, Monitoring
🏢 Tenants (4) : Établissements, Groupes, Utilisateurs, Rôles
💳 Facturation (5) : Plans, Abonnements, Factures, Providers, Remises
📦 Catalogue (4) : Modules, Fonctionnalités, Packs Quota, Cycles
🛡️ Sécurité & Audit (3) : Audit, Approbations, Sessions
⚙️ Configuration (4) : Paramètres, Cascade, Notifications, Tarifs
🐛 Debug (3) : Entitlements, API Console, Feature Toggles
```

### Principes appliqués

1. **1 entrée = 1 URL unique** — Jamais de redirect dans la sidebar
2. **Max 5 items/groupe** — Limite cognitive (Miller's law)
3. **Groupage par domaine fonctionnel** — Pas par type technique
4. **Labels par intent utilisateur** — Pas par nom de composant interne
5. **Command palette (Cmd+K)** — Accélérateur, pas substitut

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `frontend/src/components/layout/platform-sidebar.tsx` | v2.0.0 → v3.1.0 : −43 lignes (3 groupes + 1 item supprimés), imports nettoyés |
| `frontend/src/locales/fr/admin.json` | −18 lignes (clés orphelines supprimées, groupeSecurite mis à jour) |
| `frontend/src/locales/en/admin.json` | −15 lignes (clés orphelines supprimées, groupeSecurite mis à jour) |

---

## Refonte Panel Admin v4.1 — Correction Structure Sidebar (✅ TERMINÉ)

> Contexte : Rapport d'audit `RAPPORT-AUDIT-PANEL-ADMIN-PLATFORM.html`. Corrections structure sidebar + refonte monitoring + barrel exports.

### Sidebar v4.1 — 6 groupes corrigés

```
📊 Pilotage (4) : Dashboard, Plans, Abonnements, Factures
🏢 Établissement (6) : Établissements, Groupes, Utilisateurs, Rôles, Clubs, Matériel
💰 Commerce (2) : Providers, Remises
📦 Catalogue (4) : Modules, Fonctionnalités, Quotas, Cycles
🛡️ Sécurité & Audit (3) : Audit, Approbations, Sessions
⚙️ Configuration (4) : Paramètres, Cascade, Notifications, Tarifs
```

**Corrections v4.1** :
- Groupe "Tenants" → "Établissement" (6 items : +Clubs, +Matériel)
- Groupe "Pilotage" : Dashboard + Facturation (Plans/Abonnements/Factures regroupés)
- Suppression doublons : Plans/Abonnements/Factures retirés de "Facturation & Commerce" → renommé "Commerce" (2 items)
- Routes placeholder créées : `/platform/clubs`, `/platform/materiel`

### Monitoring v2 — 4 onglets

9 sections séquentielles → 4 onglets organisés :

| Onglet | Contenu | Composants |
|--------|---------|------------|
| Santé | Health checks + Métriques | `HealthChecksSection`, `MetricsCards` |
| Signaux | Golden Signals + Analytics | `GoldenSignalsSection`, `ModuleAnalyticsDashboard` (lazy) |
| Alertes | Alertes + Règles + Noisy Neighbor | `AlertesSection`, `AlertRulesSection`, `NoisyNeighborSection` |
| Export | Rapports + Temps réel | `ExportButton` (5 formats), `RealtimeSection` |

### Barrel exports créés

| Fichier | Rôle |
|---------|------|
| `features/admin/index.ts` | Barrel export : 20+ composants, 10+ hooks, types, utilitaires |
| `features/admin/hooks/index.ts` | Barrel hooks : billing + actions critiques |
| `features/admin/hooks/use-billing.ts` | Hooks centralisés : `usePlans`, `useAbonnements`, `useFactures`, `useAcknowledgeAlert` |

### Fichiers créés/modifiés v4.1

| Fichier | Action |
|---------|--------|
| `frontend/src/components/layout/platform-sidebar.tsx` | v4.0.0 → v4.1.0 : groupes corrigés (Pilotage 2, Établissement 6, Commerce 2) |
| `frontend/src/routes/platform.monitoring.tsx` | v1 → v2 : 9 sections → 4 onglets (Health, Signaux, Alertes, Export) |
| `frontend/src/routes/platform.clubs.tsx` | NOUVEAU (53 lignes) — Placeholder clubs plateforme |
| `frontend/src/routes/platform.materiel.tsx` | NOUVEAU (53 lignes) — Placeholder matériel plateforme |
| `frontend/src/features/admin/hooks/use-billing.ts` | NOUVEAU (141 lignes) — Hooks TanStack Query centralisés |
| `frontend/src/features/admin/hooks/index.ts` | NOUVEAU (38 lignes) — Barrel hooks |
| `frontend/src/features/admin/index.ts` | NOUVEAU (98 lignes) — Barrel export composants + hooks + types |
| `frontend/src/locales/fr/admin.json` | +12 clés (groupeEtablissement, groupeCommerce, clubs, materiel, monitoring.tabs) |
| `frontend/src/locales/en/admin.json` | +12 clés (mêmes clés, traductions EN) |

## Travail effectué — Session 2026-08-10 (Refonte Plans & Abonnements v4.3)

### Contexte
4 pages platform (Plans, Cycles & Stratégies, Packs Quota, Tarifs) + 1 page tenant (_auth.plans.tsx) + 1 simulateur partagé.
Problèmes identifiés : types dupliqués 4x, modals anti-pattern (overlay custom), i18n absent, Tarifs déconnecté de l'API, CTA mort.

### Phase 1 — Fondations (types + i18n)
- **Types partagés billing** — `frontend/src/features/billing/types/plan.types.ts` (223 lignes)
  - Interface `Plan` unifiée (fusion des 4 définitions)
  - Interfaces `CycleFacturation`, `StrategieExpiration`, `PackQuota`, `SimulationResult`
  - Constantes `PLAN_ICONS`, `RESSOURCES_PACK`, `COMPORTEMENTS_PHASE`, `CYCLE_LABELS`
  - Helpers : `formatPrix()`, `prixCycle()`, `modulesInclus()`, `formatQuotaEleves()`, `getPlanIcon()`
- **Namespace i18n `plans`** — `frontend/src/locales/fr/plans.json` + `en/plans.json` (124 lignes chacun)
  - Clés pour les 4 pages : `plans.*`, `cycles.*`, `packs.*`, `tarifs.*`, `commun.*`
  - Enregistré dans `frontend/src/lib/i18n.ts`

### Phase 2 — Modals CustomModal (composants feature)
- **CycleFormModal** — `frontend/src/features/platform/components/cycle-form-modal.tsx` (189 lignes)
  - Wrapper dans `<CustomModal size="lg">`, props `open`/`onOpenChange`
- **StrategieFormModal** — `frontend/src/features/platform/components/strategie-form-modal.tsx` (252 lignes)
  - Wrapper dans `<CustomModal size="2xl">`, gestion dynamique des phases
- **PackFormModal** — `frontend/src/features/platform/components/pack-form-modal.tsx` (243 lignes)
  - Wrapper dans `<CustomModal size="xl">`
- **Barrel export** — `frontend/src/features/platform/index.ts` mis à jour (+3 exports)

### Phase 3 — Refactorisation des pages
- **`platform.plans.tsx`** — Types partagés + i18n + bouton supprimer + ElisaButton
- **`platform.cycles-strategies.tsx`** — Types partagés + modals externes (CycleFormModal/StrategieFormModal) + i18n
- **`platform.packs-quota.tsx`** — Types partagés + modal externe (PackFormModal) + i18n
- **`platform.tarifs.tsx`** — Refonte majeure : CTA retiré, remises depuis API, TarifsPreview
- **`tarifs-preview.tsx`** — `frontend/src/features/billing/components/tarifs-preview.tsx` (398 lignes)
  - Composant partagé réutilisable (mode admin/tenant)
  - Chargement remises depuis `GET /api/platform/cycles-facturation`
- **`_auth.plans.tsx`** — Types partagés + TarifsPreview mode="tenant"
- **`plan-simulator.tsx`** — Types partagés (import depuis plan.types.ts)

### Phase 5 — Nettoyage
- Suppression `platform.clubs.tsx` + `platform.materiel.tsx` (routes mortes v4.2)
- Suppression clés i18n orphelines `clubs`/`materiel` dans admin.json FR/EN

### Fichiers créés (6)

| Fichier | Description |
|---------|-------------|
| `frontend/src/features/billing/types/plan.types.ts` | Types partagés billing (223 lignes) |
| `frontend/src/features/platform/components/cycle-form-modal.tsx` | Modal cycle CustomModal (189 lignes) |
| `frontend/src/features/platform/components/strategie-form-modal.tsx` | Modal stratégie CustomModal (252 lignes) |
| `frontend/src/features/platform/components/pack-form-modal.tsx` | Modal pack CustomModal (243 lignes) |
| `frontend/src/features/billing/components/tarifs-preview.tsx` | Composant prévisualisation tarifs (398 lignes) |
| `frontend/src/locales/fr/plans.json` + `en/plans.json` | i18n namespace plans (124 lignes chacun) |

### Fichiers modifiés (8)

| Fichier | Modification |
|---------|-------------|
| `frontend/src/routes/platform.plans.tsx` | Types partagés + i18n + bouton supprimer |
| `frontend/src/routes/platform.cycles-strategies.tsx` | Types + modals externes + i18n |
| `frontend/src/routes/platform.packs-quota.tsx` | Types + modal externe + i18n |
| `frontend/src/routes/platform.tarifs.tsx` | Refonte : API remises, CTA retiré, TarifsPreview |
| `frontend/src/routes/_auth.plans.tsx` | Types partagés + TarifsPreview |
| `frontend/src/features/billing/components/plan-simulator.tsx` | Types partagés |
| `frontend/src/features/platform/index.ts` | Export 3 modals |
| `frontend/src/lib/i18n.ts` | Enregistrement namespace `plans` |

### Fichiers supprimés (2)

| Fichier | Raison |
|---------|--------|
| `frontend/src/routes/platform.clubs.tsx` | Route morte (menu supprimé v4.2) |
| `frontend/src/routes/platform.materiel.tsx` | Route morte (menu supprimé v4.2) |

---

## Corrections continuation — Session 2026-08-10 (suite)

### Fix critique : Export `useUpdatePlatformRole`
- **Fichier** : `frontend/src/features/platform/hooks/use-platform-roles.ts`
- Ajout aliases : `useModifierRolePlateforme as useUpdatePlatformRole`, `useSupprimerRolePlateforme as useDeletePlatformRole`
- Résout : `Uncaught SyntaxError: The requested module does not provide an export named 'useUpdatePlatformRole'`

### Fix : Simulateur de plan (`plan-simulator.tsx`)
- Cycles dynamiques depuis `GET /api/platform/cycles-facturation` (remplacé MENSUEL/ANNUEL hardcodé)
- Remises affichées depuis données API (remplacé "-15%" hardcodé)
- i18n complet : 25+ clés `simulateur.*` (FR + EN)
- Style cohérent : CSS variables `var(--color-*)` partout (plus de classes Tailwind theme)
- `formatPrix` partagé importé depuis `plan.types.ts` (suppression fonction locale dupliquée)

### Fix : Page tenant `_auth.plans.tsx`
- i18n complet : 12 clés `auth.*` (FR + EN) — tous textes français hardcodés traduits
- Style cohérent : CSS variables partout (plus de `bg-muted`, `text-muted-foreground`)

### Fix : i18n — clés dupliquées et manquantes
- Clé `description` dupliquée dans section `packs` → renommée `descriptionLabel`
- Ajout clés `ordre` (cycles + packs), `classes`, `smsParMois`, `illimite` (tarifs)
- Total : ~170 clés FR/EN dans `plans.json`

### Fix : Nettoyage imports inutilisés
- `platform.tarifs.tsx` : `Calculator`, `useMemo` retirés
- `_auth.plans.tsx` : `useMemo` retiré

### Audit backend confirmé
Tous les 8 endpoints API connectés : facturation/plans (CRUD), cycles-facturation (CRUD), strategies-expiration (CRUD), packs-quota (CRUD), billing/plans (GET), billing/simuler (POST), billing/mon-abonnement (GET), billing/abonnement/upgrade (PATCH)

---

## Refonte Billing v3.1 — Corrections moteur remises + page plans (✅ TERMINÉ)

### Bugs corrigés (Phase 1 — Backend)

| Bug | Correction | Fichier |
|-----|------------|----------|
| Volume sans vérification seuil | `conditionElevesMin` sur entité + filtrage `estValide()` | `remise.service.ts` |
| Fidélité sans vérification ancienneté | `conditionAncienneteMois` + `calculerAncienneteMois()` | `remise.service.ts` |
| Pas de plafond global cumul | `PLAFOND_REMISE_POURCENT = 40` + écrêtage progressif | `remise.service.ts` |
| Prorata pack sur 30 jours fixe | Calcul réel `dateDebut → dateFin` | `pack-quota.service.ts` |
| RemiseService sans contexte élèves | Enrichissement `ContexteApplicationRemise` | `remise.service.ts` |
| Double application remise cycle | Neutralisé par filtrage conditionnel | `remise.service.ts` |

**Migration 214** : `backend/database/migrations/214-remise-conditions-plafond.sql`
- Colonnes `condition_eleves_min` + `condition_anciennete_mois` sur `remises_abonnement`
- Backfill VOL-500/1000 et FID-12M/24M

**Tests** : `backend/test/unit/remise-plafond.spec.ts` (cumul plafond, filtrage volume, filtrage fidélité)

### Page plans restructurée (Phase 2 — Frontend)

**Nouveaux composants** :
- `PacksSection` — achat packs quota avec prorata affiché
- `CodePromoInput` — saisie + validation API code promo
- `FaqSection` — FAQ accordéon 10 questions
- `TrustBadges` — signaux confiance (sécurité, support, sans engagement)
- `MonAbonnement` — dashboard tenant (jauges quotas, remises actives, packs souscrits)

**Page `_auth.plans.tsx`** restructurée : Hero → Toggle cycle → Plans grid → Packs → Code Promo → FAQ → Trust Badges

**Hooks centralisés** : `use-billing.ts` (usePlans, usePacks, useSouscrirePack, useVerifierCoupon, useMonAbonnementDetail)

### Fonctionnalités ajoutées (Phase 3)

- **Endpoints** : `GET /remises/verify?code=XXX`, `GET /mon-abonnement/detail`
- **Cron** : `cronNotificationsExpiration()` — paliers J-7, J-3, J-1 (quotidien 08h00)
- **i18n** : ~80 nouvelles clés FR/EN (packs, FAQ, trust, code promo, comparatif)

### Alignement seeds (Phase 4)

- `seed-plans-abonnement.ts` : MODULES_DECOUVERTE aligné migration 213
- `seed-remises.ts` : conditions ajoutées aux remises volume/fidélité

---

## Refonte Billing v3.2 — Cohérence seeds, stratégies expiration, UX frontend (✅ TERMINÉ)

> Contexte : Session de grilling (/grill-me) pour inspecter la cohérence du système billing complet (quotas, packs, remises, cycles, stratégies d'expiration) et corriger les problèmes identifiés.

### Corrections Backend — Seeds et logique métier

| Problème | Correction | Fichier |
|-----------|------------|----------|
| Double remise cycle (CYCLE-ANNUEL/SEMESTRIEL dupliquait CycleFacturationConfig.remisePourcent) | Suppression remises CYCLE du seed — source unique = CycleFacturationConfig | `seed-remises.ts` |
| Promos sans dateDebut/dateFin (PROMO-RENTREE, PROMO-LANCEMENT, PROMO-BF) | Ajout dates réalistes (2025-2026) + interface RemiseSeed étendue | `seed-remises.ts` |
| GRP-3ETAB actif sans condition groupe implémentée | Désactivé (`actif: false`) avec commentaire explicatif | `seed-remises.ts` |
| Pas de stratégie d'expiration par plan | 5 stratégies créées (decouverte=7j, starter=20j, standard=30j, pro=55j, enterprise=90j) | `seed-strategies-expiration.ts` |

### Refactorisations Frontend

| Amélioration | Détail | Fichier |
|--------------|--------|----------|
| Refonte platform.remises.tsx | i18n complet, CustomModal, ElisaButton, CSS vars, champs conditions | `platform.remises.tsx` |
| Tableau comparatif avancé (mode Comparer) | ComparisonTable avec 10 features + 3 booléennes (✓/✗), tri par rang | `_auth.plans.tsx` |
| Flux achat packs corrigé | Sélection → modal confirmation → mutation API (plus l'inverse) | `packs-section.tsx` |
| Modal confirmation packs → ConfirmationModal | Suppression overlay custom (règle 23) → ConfirmationModal variant="info" | `packs-section.tsx` |
| window.confirm() → ConfirmationModal (×4) | Suppression tous les window.confirm des pages billing plateforme | `platform.plans.tsx`, `platform.remises.tsx`, `platform.packs-quota.tsx`, `platform.cycles-strategies.tsx` |
| PlanUpgradeCTA → ElisaButton | Bouton custom remplacé par ElisaButton (variant outline/primary, isLoading) | `_auth.plans.tsx` |
| formatPrix(quantité) → toLocaleString | formatPrix réservé aux prix, quantités → toLocaleString('fr-FR') | `tarifs-preview.tsx`, `platform.packs-quota.tsx` |
| Redondance PlanComparison/ComparisonTable | Prop `showComparison` ajoutée à TarifsPreview, masqué en mode tenant | `tarifs-preview.tsx`, `_auth.plans.tsx` |
| "modules" hardcodé → i18n | `tarifs.modulesInclus` utilisé au lieu de string hardcodée | `tarifs-preview.tsx` |

### i18n ajouté (FR + EN)

- `billing.json` : 16 nouvelles clés (plans.pageTitle, plans.cards, plans.compare.*, packs.succes/erreur)
- `plans.json` : 46 nouvelles clés (section remises complète : type, dureeApp, cibles, conditions)

### Fichiers créés/modifiés v3.2

| Fichier | Action |
|---------|--------|
| `backend/src/database/seeds/system/seed-remises.ts` | Suppression CYCLE, dateFin promos, GRP-3ETAB désactivé |
| `backend/src/database/seeds/system/seed-strategies-expiration.ts` | 5 stratégies (une par plan) |
| `frontend/src/routes/platform.remises.tsx` | Refonte complète (i18n, CustomModal, CSS vars) |
| `frontend/src/routes/_auth.plans.tsx` | ComparisonTable ajouté (mode Comparer) |
| `frontend/src/features/billing/components/packs-section.tsx` | Flux confirmation corrigé + ConfirmationModal |
| `frontend/src/routes/platform.plans.tsx` | window.confirm → ConfirmationModal |
| `frontend/src/routes/platform.remises.tsx` | window.confirm → ConfirmationModal + import |
| `frontend/src/routes/platform.packs-quota.tsx` | window.confirm → ConfirmationModal |
| `frontend/src/routes/platform.cycles-strategies.tsx` | window.confirm → ConfirmationModal (×2) |
| `frontend/src/locales/fr/billing.json` | 16 clés ajoutées (compare, packs, plans) |
| `frontend/src/locales/en/billing.json` | 16 clés ajoutées (compare, packs, plans) |
| `frontend/src/locales/fr/plans.json` | 46 clés ajoutées (section remises) |
| `frontend/src/locales/en/plans.json` | 46 clés ajoutées (section remises) |

---

## Refonte Billing v3.3 — Extraction composants, i18n FAQ, hooks partagés (✅ TERMINÉ)

> Contexte : Suite du grilling v3.2. Améliorations de cohérence frontend : extraction de modals inline, élimination de chaînes hardcodées, remplacement de boutons raw par ElisaButton, FAQ bilingue, hooks partagés.

### Améliorations Frontend

| Amélioration | Détail | Fichier |
|--------------|--------|----------|
| RemiseFormModal extrait | Modal inline (160 lignes) → composant partagé dans `features/platform/components/` (cohérence avec PackFormModal, CycleFormModal, StrategieFormModal) | `remise-form-modal.tsx` (235 lignes), `platform.remises.tsx` (424→211 lignes) |
| Export barrel RemiseFormModal | Ajout export composant + types dans barrel `features/platform/index.ts` | `features/platform/index.ts` |
| 4 chaînes FR hardcodées → i18n | "Nombre de cycles", "ID cible (UUID)", "Cycle visé", "Conditions" → clés i18n avec parité FR/EN | `platform.remises.tsx` |
| formatCondition i18n | `≥{{count}} élèves`, `≥{{count}} mois` → template i18n avec interpolation | `platform.remises.tsx`, `plans.json` FR+EN |
| FAQ bilingue | FAQ_DATA hardcodé (42 lignes FR) → 10 items Q&R dans i18n `billing.json` FR+EN | `faq-section.tsx`, `billing.json` FR+EN |
| ElisaButton dans code-promo-input | Bouton raw "Appliquer" → ElisaButton avec isLoading + size="sm" | `code-promo-input.tsx` |
| ElisaButton dans packs-section | Bouton raw "Acheter" → ElisaButton avec icon ShoppingCart + isLoading | `packs-section.tsx` |
| PlanUpgradeCTA → useUpgradePlan | Mutation locale dupliquée → hook partagé `useUpgradePlan` (invalidation auto queries) | `_auth.plans.tsx` |
| ComportementPhase.PRE_ARCHIVE vérifié | Cohérent : `nom='PRE_ARCHIVE'` (label) + `comportement=ARCHIVED` (action) — 3 valeurs enum uniquement | `strategie-expiration.entity.ts`, `seed-strategies-expiration.ts` |

### i18n ajouté (FR + EN)

- `billing.json` : +13 lignes (faq.items : 10 items Q&R bilingues)
- `plans.json` : +7 clés (conditions.colonne, elevesFormat, ancienneteFormat, nbCyclesLabel, idCibleLabel, cycleCibleLabel, supprimerTitre)

### Fichiers créés/modifiés v3.3

| Fichier | Action |
|---------|--------|
| `frontend/src/features/platform/components/remise-form-modal.tsx` | NOUVEAU (235 lignes) — RemiseFormModal extrait |
| `frontend/src/features/platform/index.ts` | Export RemiseFormModal + types Remise/RemiseForm ajoutés |
| `frontend/src/routes/platform.remises.tsx` | Suppression modal inline (−213 lignes), import depuis `@/features/platform` |
| `frontend/src/features/billing/components/faq-section.tsx` | FAQ_DATA supprimé, chargement dynamique i18n |
| `frontend/src/features/billing/components/code-promo-input.tsx` | Bouton raw → ElisaButton |
| `frontend/src/features/billing/components/packs-section.tsx` | Bouton raw → ElisaButton + icon |
| `frontend/src/routes/_auth.plans.tsx` | PlanUpgradeCTA → useUpgradePlan hook partagé, imports nettoyés |
| `frontend/src/locales/fr/billing.json` | +13 lignes (faq.items FR) |
| `frontend/src/locales/en/billing.json` | +13 lignes (faq.items EN) |
| `frontend/src/locales/fr/plans.json` | +7 clés (conditions, labels remises) |
| `frontend/src/locales/en/plans.json` | +7 clés (conditions, labels remises) |

### Corrections i18n — Types partagés et composants

| Amélioration | Détail | Fichier |
|--------------|--------|----------|
| COMPORTEMENTS_PHASE supprimé | Constante avec labels FR en dur → remplacée par `PHASE_VALUES` (valeurs seules) + i18n `cycles.phase.*` | `plan.types.ts`, `strategie-form-modal.tsx`, `platform.cycles-strategies.tsx` |
| CYCLE_LABELS supprimé | Code mort (0 usage externe) → supprimé + remplacé par `CYCLE_FACTURATION_CODES` | `plan.types.ts` |
| formatQuotaEleves i18n | `'illimité'` hardcodé → paramètre optionnel `illimiteLabel` | `plan.types.ts`, `plan-simulator.tsx` |
| "plan {slug}" hardcodé | `plan ${s.planSlug}` → `t('cycles.planSlugLabel', { slug })` | `platform.cycles-strategies.tsx` |
| "Jusqu'à X élèves" hardcodé | Strings FR → `t('simulateur.jusqua')` + `t('simulateur.eleves')` | `plan-simulator.tsx` |
| Clés phase i18n ajoutées | `cycles.phase.READ_ONLY/LOCKED/ARCHIVED` FR+EN + `cycles.planSlugLabel` | `plans.json` FR+EN |
| Clés simulateur ajoutées | `simulateur.jusqua`, `simulateur.eleves` FR+EN | `plans.json` FR+EN |

### Corrections seeds — Descriptions obsolètes

| Seed | Correction | Fichier |
|------|------------|----------|
| seedStrategiesExpiration | Description "standard + decouverte" → "5 stratégies (une par plan)" + version 3.2.0 | `seeds/index.ts` |
| seedRemises | Description "10 règles" → "8 règles" (v3.2 a supprimé 2 CYCLE) + version 3.2.0 | `seeds/index.ts` |

### Fichiers supplémentaires modifiés

| Fichier | Action |
|---------|--------|
| `frontend/src/features/billing/types/plan.types.ts` | COMPORTEMENTS_PHASE → PHASE_VALUES, CYCLE_LABELS supprimé, formatQuotaEleves i18n |
| `frontend/src/features/platform/components/strategie-form-modal.tsx` | Import PHASE_VALUES, dropdown i18n |
| `frontend/src/routes/platform.cycles-strategies.tsx` | Suppression COMPORTEMENTS_PHASE, "plan" → i18n, phases → i18n |
| `frontend/src/features/billing/components/plan-simulator.tsx` | "Jusqu'à X élèves" → i18n, formatQuotaEleves avec label |
| `backend/src/database/seeds/index.ts` | Descriptions seeds corrigées (strategies 5, remises 8) |
| `frontend/src/locales/fr/plans.json` | +6 clés (phase.*, planSlugLabel, simulateur.jusqua/eleves) |
| `frontend/src/locales/en/plans.json` | +6 clés (phase.*, planSlugLabel, simulateur.jusqua/eleves) |

---

## Refonte Billing v3.4 — UX Billing Pages Complet (✅ TERMINÉ)

> Contexte : Améliorations UX/design de toutes les pages billing plateforme et composant de présentation des plans, inspirées des meilleures pratiques SaaS (hiérarchie visuelle, plan recommandé, CTA, empty states, responsive, dark mode).

### Améliorations TarifsPreview (composant central)

| Amélioration | Détail |
|--------------|--------|
| CTA div custom → ElisaButton | Bouton fullWidth variant primary/outline selon contexte (recommandé vs normal) |
| Plan recommandé mis en avant | Bordure dominante/60, badge centré avec icône Star, shadow-md, hover:shadow-lg |
| Badge centré en haut | `left-1/2 -translate-x-1/2` au lieu de `right-4` — meilleure hiérarchie visuelle |
| Cards rounded-2xl + border-2 | Design plus moderne, distinction visuelle renforcée |
| Animation hover | `motion.div whileHover={{ y: -2 }}` en mode tenant |
| Cycle toggle amélioré | flex-wrap responsive, bg surface-hover/30, badges remise colorés (blanc sur actif, vert sur inactif) |
| i18n cycle names | `t('tarifs.mensuel')` au lieu de capitalize manuel |
| i18n periode | "mois" / "3 mois" → `t('tarifs.periode.mois')` / `t('tarifs.periode.periodes', { count })` |
| Responsive grilles | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` |
| Icons shrink-0 | Icônes features ne se compressent pas sur petits écrans |
| PlanComparison hover rows | Lignes avec hover bg pour meilleure lisibilité |
| PlanComparison i18n cycles | Noms de cycles traduits au lieu de capitalize |

### Améliorations Platform Plans (CRUD plateforme)

| Amélioration | Détail |
|--------------|--------|
| Empty state | Affichage avec icône + CTA quand aucun plan |
| Layout carte amélioré | Statut + badge en haut (flex justify-between), nom, prix, quotas, modules, actions |
| Badge avec icône Sparkles | Badge plan avec icône pour cohérence visuelle |
| Modules limités à 6 | Affiche max 6 tags + "...+N" pour éviter overflow |
| Boutons action → ElisaButton | Edit2/Trash2 avec variant outline/ghost, size xs |
| Formatage nombres | Quotas avec `toLocaleString('fr-FR')` pour lisibilité |
| Responsive grilles | `md:grid-cols-2 xl:grid-cols-3` (au lieu de lg) |
| Description line-clamp-2 | Évite cartes trop hautes avec descriptions longues |

### Améliorations Platform Cycles & Stratégies

| Amélioration | Détail |
|--------------|--------|
| Onglets responsive | rounded-xl, bg surface-hover/30, labels cachés sur mobile (`hidden sm:inline`) |
| Table cycles responsive | Colonnes durée/statut cachées mobile (`hidden sm:table-cell`), hover rows |
| Badges remise en pill | `rounded-full bg-success-100 text-success-700` |
| Statut avec dot indicator | `h-1.5 w-1.5 rounded-full` + texte |
| Actions → ElisaButton ghost | variant ghost, size xs, icônes 3.5, labels cachés mobile |
| Empty state cycles | Icône CalendarClock + texte + CTA ElisaButton |
| Empty state stratégies | border-dashed + icône Hourglass + CTA |
| Timeline verticale phases | Cercles numérotés (h-7 w-7) + connecteur vertical + couleurs contextuelles |
| Stratégies cards | rounded-2xl, actions ElisaButton ghost |

### Améliorations Platform Packs Quota

| Amélioration | Détail |
|--------------|--------|
| Icône ressource contextuelle | Users (élèves), HardDrive (stockage), MessageSquare (SMS), PackagePlus (fallback) |
| Header avec icône | rounded-xl bg-dominante/10, icône ressource 4.5 |
| Statut avec dot indicator | Même pattern que cycles (dot + texte) |
| Description affichée | `line-clamp-2` si `pack.description` définie |
| Détails en flex rows | Label/value alignés avec justify-between |
| Quantité mise en avant | `font-semibold text-dominante` pour le +quota |
| Prix séparé par border-t | `border-t border-bordure/50 pt-3` — section prix/actions distincte |
| Actions → ElisaButton ghost | variant ghost, size xs, labels cachés mobile |
| Empty state avec CTA | border-dashed + icône PackagePlus + bouton créer pack |
| Cards rounded-2xl + hover:shadow-md | Transition shadow au survol |
| Responsive grilles | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |

### Améliorations Platform Remises

| Amélioration | Détail |
|--------------|--------|
| Table responsive | Colonnes conditions/priorité cachées mobile (`hidden sm:table-cell`), usage caché lg (`hidden lg:table-cell`) |
| Hover rows | `transition-colors hover:bg-[var(--color-surface-hover)]/50` |
| Statut avec dot indicator | Même pattern que cycles/packs (dot + texte) |
| Actions → ElisaButton ghost | variant ghost, size xs, icônes 3.5, labels cachés mobile |
| Empty state avec CTA | Icône BadgePercent + texte + bouton créer remise |
| Container rounded-2xl | `rounded-2xl` au lieu de `rounded-xl` (cohérence) |

### Nettoyage

- Import `ArrowDown` supprimé de `platform.cycles-strategies.tsx` (import mort)
- Clé `packs.supprimerTitre` ajoutée FR+EN (utilisée par ConfirmationModal)

### Audit Dark Mode + Responsive

- ✅ Aucune couleur hardcodée (bg-white, text-gray, etc.) dans les pages billing
- ✅ Tous les fichiers utilisent des variables CSS (`--color-*`)
- ✅ Grilles adaptatives avec breakpoints progressifs
- ✅ Cycle toggle avec flex-wrap pour petits écrans
- ✅ Tables avec overflow-x-auto
- ✅ Composants responsive de 320px à 2560px

### i18n ajouté (FR + EN)

- `plans.json` : +5 clés (tarifs.recommande, tarifs.periode.mois, tarifs.periode.periodes, plans.supprimerTitre, packs.supprimerTitre)

### Fichiers créés/modifiés v3.4

| Fichier | Action |
|---------|--------|
| `frontend/src/features/billing/components/tarifs-preview.tsx` | Refonte UX (ElisaButton CTA, plan recommandé, animations, i18n, responsive) |
| `frontend/src/routes/platform.plans.tsx` | Refonte cartes (empty state, ElisaButton actions, modules limités, responsive) |
| `frontend/src/routes/platform.cycles-strategies.tsx` | Refonte UX (ElisaButton, empty states, timeline phases, onglets responsive) |
| `frontend/src/routes/platform.packs-quota.tsx` | Refonte cartes (icônes ressource, ElisaButton, empty state, descriptions) |
| `frontend/src/routes/platform.remises.tsx` | Refonte table (ElisaButton, empty state CTA, responsive colonnes, dot indicator) |
| `frontend/src/locales/fr/plans.json` | +5 clés (recommande, periode.*, supprimerTitre, packs.supprimerTitre) |
| `frontend/src/locales/en/plans.json` | +5 clés (recommande, periode.*, supprimerTitre, packs.supprimerTitre) |

---

## Billing v3.5 — Cohérence, Accessibilité & UX (✅ TERMINÉ)

> Contexte : Améliorations de cohérence cross-pages, accessibilité ARIA, seeds promotions à jour, et polish UX tenant.

### P1 — Cohérence platform.plans.tsx

| Amélioration | Détail |
|--------------|--------|
| Dot indicator statut | Badge actif/inactif avec `h-1.5 w-1.5 rounded-full` (même pattern que cycles/packs/remises) |
| Boutons actions → ghost | `variant="ghost"` `size="xs"` (cohérence avec autres pages billing) |
| Icône header → Sparkles | Remplace `Package` text-muted par `Sparkles` text-dominante |
| Labels cachés mobile | `hidden sm:inline` sur boutons modifier/supprimer |
| Import `cn` | Ajout import `cn` de `@/lib/cn` pour classes conditionnelles |
| Empty state → Sparkles | Icône `Package` non importé remplacée par `Sparkles` (empty state) |

### P2 — Seeds promotions 2025→2026

| Seed | Avant | Après |
|------|-------|-------|
| Rentrée | `PROMO-RENTREE-2025` (code: `RENTREE2025`, dates: 2025) | `PROMO-RENTREE-2026` (code: `RENTREE2026`, 2026-09-01 → 2026-11-30) |
| Lancement | `PROMO-LANCEMENT` | `PROMO-LANCEMENT-V2` (code: `LANCEMENT`, 2026-08-01 → 2027-02-28) |
| Black Friday | `PROMO-BF-2025` (code: `BF2025`) | `PROMO-BF-2026` (code: `BF2026`, 2026-11-20 → 2026-12-05) |

### P3 — Packs Section emoji→Lucide icons

- Remplacement emojis par icônes Lucide dans `RESSOURCE_CONFIG` :
  - `eleves` → `Users`, `utilisateurs` → `User`, `classes` → `School`, `stockageGo` → `HardDrive`, `sms` → `MessageSquare`
- Header ressource : emoji brut → conteneur styled (`h-8 w-8 rounded-lg bg-dominante/10`) + icône Lucide

### P4 — TarifsPreview améliorations

| Amélioration | Détail |
|--------------|--------|
| Icônes features | Ajout `School` (classes), `HardDrive` (stockage), `MessageSquare` (SMS) dans la liste |
| Détection recommandé | Regex `/recommand/i.test(plan.badge)` au lieu de string matching exact |
| View mode switcher | `<button>` raw → `<ElisaButton>` variant primary/ghost, size xs |

### P5 — Namespace i18n

- Vérification cohérence : `plans` namespace (platform admin) ↔ `billing` namespace (tenant) — pas de conflit
- Ajout clé `tarifs.cycleFacturation` (FR: "Cycle de facturation", EN: "Billing cycle") pour aria-label du cycle toggle

### P6 — FAQ Section accessible (ARIA)

- Ajout `useId()` pour générer des IDs uniques
- Attributs `aria-expanded={isOpen}` et `aria-controls` sur chaque bouton accordéon
- `role="region"` + `aria-labelledby` sur chaque panneau de réponse
- `id` correspondant entre `aria-controls` et `id` du panneau

### P7 — UX Tenant Plans Page

- Hero section : animation `motion.section` avec `initial={{ opacity: 0, y: -10 }}` → fade-in au chargement
- PlanUpgradeCTA : `motion.div` avec `initial={{ opacity: 0, y: 20 }}` → slide-up à la sélection
- Cycle toggle : `role="radiogroup"` + `aria-label` + `role="radio"` + `aria-checked` + `focus-visible:ring-2` (accessibilité clavier)

### Fichiers créés/modifiés v3.5

| Fichier | Action |
|---------|--------|
| `frontend/src/routes/platform.plans.tsx` | P1 : dot indicator, boutons ghost, icône Sparkles, fix Package non importé |
| `frontend/src/features/billing/components/packs-section.tsx` | P3 : emoji → Lucide icons (RESSOURCE_CONFIG) |
| `frontend/src/features/billing/components/tarifs-preview.tsx` | P4+P7 : icônes Classes/Stockage/SMS, regex recommandé, cycle toggle ARIA |
| `frontend/src/routes/_auth.plans.tsx` | P4+P7 : view mode → ElisaButton, hero/CTA animations |
| `frontend/src/features/billing/components/faq-section.tsx` | P6 : aria-expanded, aria-controls, role="region" |
| `frontend/src/locales/fr/plans.json` | P5 : +clé `tarifs.cycleFacturation` |
| `frontend/src/locales/en/plans.json` | P5 : +clé `tarifs.cycleFacturation` |
| `backend/src/database/seeds/system/seed-remises.ts` | P2 : promotions 2025→2026 |

---

## Billing v3.4 — Refonte Seeds & Polish Platforme (✅ TERMINÉ)

> Contexte : Consolidation du système billing — seeds alignés sur 3 plans, polish des 4 pages plateforme, i18n FR/EN complet, diagnostic chargement données.

### Architecture Billing v3.4

**3 plans d'abonnement (source de vérité) :**

| Plan | Prix | Élèves inclus | Modules | Badge |
|------|------|---------------|---------|-------|
| Découverte | 14 900 F/mois | 100 | 8 modules cœur | — |
| Standard | 39 900 F/mois | 300 | 14 modules | RECOMMANDÉ |
| Premium | 59 900 F/mois | Illimité | Tous + API + SSO | MEILLEUR CHOIX |

**6 packs de quota :**
- PACK_ELEVES_50 (+50, 5 000 F), PACK_ELEVES_200 (+200, 15 000 F), PACK_ELEVES_500 (+500, 30 000 F)
- PACK_STOCKAGE_10GO (+10 Go, 3 000 F permanent), PACK_STOCKAGE_50GO (+50 Go, 12 000 F permanent)
- PACK_SMS_500 (+500 SMS, 5 000 F)

**7 remises commerciales :**
- 2 volume (VOL-500 -10%, VOL-1000 -20%)
- 2 fidélité (FID-12M -5%, FID-24M -10%)
- 3 promotions (RENTREE2026 -20%, LANCEMENT -15%, BF2026 -25%)

**3 stratégies d'expiration :**
- decouverte : 10j READ_ONLY → 5j LOCKED → ARCHIVE (15j)
- standard : 15j READ_ONLY → 15j LOCKED → ARCHIVE (30j, défaut)
- premium : 30j READ_ONLY → 30j LOCKED → 30j ARCHIVE → ARCHIVE (90j SLA)

**4 cycles de facturation :** MENSUEL (0%), TRIMESTRIEL (5%), SEMESTRIEL (7.5%), ANNUEL (10%)

### Diagnostic & Fix Chargement Données

**Cause racine** : Les seeds n'avaient pas été exécutés avec les nouvelles données v3.4 (tables vides ou obsolètes 5 plans).

**Vérification endpoints :**
- Frontend platform → `/api/platform/facturation/plans` ✓
- Frontend platform → `/api/platform/cycles-facturation` ✓
- Frontend platform → `/api/platform/strategies-expiration` ✓
- Frontend platform → `/api/platform/packs-quota` ✓
- Frontend platform → `/api/platform/remises` ✓
- Frontend tenant → `/api/billing/plans` ✓

**Solution** : Exécuter `npm run seed` pour peupler les tables avec les seeds v3.4 mis à jour.

### Polish Frontend Plateforme (4 pages)

**Améliorations communes :**
- Skeleton loading (états de chargement)
- Error states avec bouton "Réessayer"
- Animations Framer Motion (`motion.div`, `motion.tr`, `AnimatePresence`)
- Responsive extrême (320px-2560px) avec `clamp()` et grilles adaptatives
- Dark mode via variables CSS
- Empty states améliorés avec descriptions et CTA

**Page `platform.plans.tsx` :**
- Stats résumé (nb plans, actifs, plan défaut) en badges inline
- Grille responsive `md:grid-cols-2 xl:grid-cols-3`
- Cartes plan avec badge statut, badge plan, prix clampé, quotas, modules (6 max + "+N")

**Page `platform.cycles-strategies.tsx` :**
- 2 onglets (Cycles / Stratégies) avec `AnimatePresence mode="wait"`
- Cycles : tableau responsive avec `motion.tr`
- Stratégies : grille de cartes avec timeline verticale des phases

**Page `platform.packs-quota.tsx` :**
- Grille responsive `sm:grid-cols-2 lg:grid-cols-3`
- Icône ressource contextuelle (Users/HardDrive/MessageSquare)
- Détails pack (ressource, quantité, durée validité, prix)

**Page `platform.remises.tsx` :**
- Tableau responsive avec colonnes conditionnelles (`hidden sm:table-cell lg:table-cell`)
- Formatage durée/conditions dynamique
- Empty state avec description

### Fichiers créés/modifiés v3.4

| Fichier | Action |
|---------|--------|
| `backend/src/database/seeds/system/seed-plans-abonnement.ts` | 5 plans → 3 plans v3.4 (Découverte/Standard/Premium) |
| `backend/src/database/seeds/system/seed-strategies-expiration.ts` | 5 stratégies → 3 stratégies (decouverte/standard/premium) |
| `backend/src/database/seeds/system/seed-packs-quota.ts` | 4 packs → 6 packs (+PACK_ELEVES_500, +PACK_STOCKAGE_50GO) |
| `backend/src/database/seeds/system/seed-remises.ts` | Nettoyage (supp GRP-3ETAB), renommage V2→V3, 7 remises |
| `backend/src/database/seeds/index.ts` | Descriptions mises à jour (versions, counts) |
| `frontend/src/routes/platform.plans.tsx` | Skeleton, error state, stats, animations |
| `frontend/src/routes/platform.cycles-strategies.tsx` | Skeleton, error states, animations, timeline stratégies |
| `frontend/src/routes/platform.packs-quota.tsx` | Skeleton, error state, animations, icônes contextuelles |
| `frontend/src/routes/platform.remises.tsx` | Skeleton, error state, animations, empty state |
| `frontend/src/locales/fr/plans.json` | Nouvelles clés (erreurChargement, reessayer, stats, aucunPlanDesc, etc.) |
| `frontend/src/locales/en/plans.json` | Parité FR/EN complète (mêmes clés ajoutées) |

---

## Refonte Promotions v4.0 — Système Multi-Scopes (✅ COMPLET)

> Contexte : Extension du système de remises (appliqué uniquement aux plans) vers un système de promotions multi-scopes couvrant plans, packs quota, modules supplémentaires et bundles.

### Architecture cible

**PromotionService** = moteur en cascade 4 phases (source unique de vérité).
Remplace le RemiseService (migration 216 — ancienne table renommée `_legacy_remises_abonnement`).

| Composant | Rôle |
|-----------|------|
| `promotion.entity.ts` | Entité Promotion (scope: PLAN/PACK/MODULE/BUNDLE, type: POURCENTAGE/MONTANT_FIXE/GRATUITE) |
| `bundle-promotion.entity.ts` | Entité BundlePromotion (combo de packs avec remise spéciale) |
| `promotion.service.ts` | Moteur cascade 4 phases + CRUD + méthodes publiques `estValide()`, `estBundleValide()`, `trouverPromotionsEligibles()`, `trouverBundlesEligibles()` |
| `promotion.dto.ts` | Schémas Zod create/update pour promotions et bundles |
| `promotions.controller.ts` | Routes platform (CRUD) + client (éligibles, coupon) |

### Cascade 4 phases

| Phase | Scope | Plafond | Description |
|-------|-------|---------|-------------|
| 1 | PLAN | 40% | Remise sur base + élèves sup. × coefCycle |
| 2 | PACK | Libre | Remise sur packs quota (+ bundles) |
| 3 | MODULE | Libre | Remise sur modules supplémentaires |
| 4 | GRATUITÉ | 100% | Module offert N mois (dureeGratuiteMois) |

### Conditions JSONB (ConditionsPromotion)

- `nombreElevesMin` : nombre minimum d'élèves
- `ancienneteMois` : ancienneté en mois révolus
- `plansRequis` : IDs plans requis (cross-sell plan→plan)
- `packsRequis` : IDs packs requis (cross-sell pack→pack)
- `modulesRequis` : IDs modules requis
- `ressourceCible` : ressource ciblée pour scope=PACK
- `nbCycles` : nombre max de cycles pour N_CYCLES
- `dureeGratuiteMois` : durée de gratuité en mois

### API REST

**Platform (SUPER_ADMIN) :**
```
GET    /api/platform/facturation/promotions              # Liste paginée
GET    /api/platform/facturation/promotions/:id           # Détail
POST   /api/platform/facturation/promotions               # Créer
PATCH  /api/platform/facturation/promotions/:id           # Modifier
DELETE /api/platform/facturation/promotions/:id           # Supprimer
POST   /api/platform/facturation/promotions/:id/toggle    # Activer/Désactiver
GET    /api/platform/facturation/promotions/bundles       # Liste bundles
POST   /api/platform/facturation/promotions/bundles       # Créer bundle
PATCH  /api/platform/facturation/promotions/bundles/:id   # Modifier bundle
DELETE /api/platform/facturation/promotions/bundles/:id   # Supprimer bundle
POST   /api/platform/facturation/promotions/simuler       # Simuler cascade
```

**Client (ADMIN établissement) :**
```
GET    /api/billing/promotions/eligibles                  # Promotions éligibles
GET    /api/billing/promotions/bundles/eligibles          # Bundles éligibles
POST   /api/billing/promotions/verifier-coupon            # Vérifier code coupon
```

### FacturationService — Intégration cascade

`calculerMontantMensuel()` utilise maintenant `promotionService.appliquerCascade()` au lieu de `remiseService.appliquer()`. Les montants sont séparés : `montantModules` + `montantPacks` (au lieu de `montantOptions` global).

### Frontend

- **Types** : `frontend/src/features/billing/types/promotion.types.ts` (182 lignes) — enums, interfaces, helpers affichage
- **Hooks** : `frontend/src/features/billing/hooks/use-promotions.ts` (251 lignes) — 14 hooks CRUD platform + éligibles client
- **Page** : `frontend/src/routes/platform.promotions.tsx` (576 lignes) — Dashboard 3 onglets (Promotions, Bundles, Simulateur cascade)
- **Composants** :
  - `promo-badge.tsx` (107 lignes) — Badge scope+type + StatutBadge
  - `promotion-form-modal.tsx` (v4.1, 352 lignes) — CustomModal (§23) + i18n complet (48 clés) + CSS variables + types stricts
  - `bundle-card.tsx` (137 lignes) — Carte bundle (packs inclus, remise, actions hover)
  - `facture-breakdown.tsx` (246 lignes) — Récap cascade ligne par ligne (phases accordéon)
  - `code-promo-input.tsx` (v4.0, 137 lignes) — Saisie + vérification coupon API
- **Intégration client** : `_auth.mon-abonnement.tsx` — Section promotions + CodePromoInput + hook `useMonAbonnementDetail`
- **Dépréciation** : `platform.remises.tsx` — Bannière dépréciation (lien vers /platform/promotions)
- **Intégration** : Sidebar platform (+ entrée Promotions), CommandPalette (+ entrée promotions)
- **i18n** : `frontend/src/locales/fr/promotions.json` + `en/promotions.json` (150 lignes chacun — 48 clés form + dépréciation ajoutées)
- **i18n admin** : Clés `navigation.promotions` + `commandPalette.promotions/promotionsDesc` ajoutées FR/EN

### Fichiers créés/modifiés v4.0

| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/entities/promotion.entity.ts` | NOUVEAU (184 lignes) |
| `backend/src/modules/billing/entities/bundle-promotion.entity.ts` | NOUVEAU (87 lignes) |
| `backend/src/modules/billing/entities/index.ts` | Exports Promotion + BundlePromotion |
| `backend/src/modules/billing/services/promotion.service.ts` | NOUVEAU (564 lignes) — cascade 4 phases + CRUD + éligibles |
| `backend/src/modules/billing/services/facturation.service.ts` | Refonte — cascade au lieu de remiseService |
| `backend/src/modules/billing/services/index.ts` | Exports PromotionService |
| `backend/src/modules/billing/dto/promotion.dto.ts` | NOUVEAU (83 lignes) |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | NOUVEAU (331 lignes) — utilise trouverPromotionsEligibles() |
| `backend/src/modules/billing/index.ts` | Exports routers promotions |
| `backend/src/routes/platform.routes.ts` | Montage /facturation/promotions |
| `backend/src/app.ts` | Montage /billing/promotions (client) |
| `backend/database/migrations/216-promotions-v4-refonte.sql` | NOUVEAU (290 lignes) |
| `frontend/src/features/billing/types/promotion.types.ts` | NOUVEAU (182 lignes) |
| `frontend/src/features/billing/hooks/use-promotions.ts` | NOUVEAU (251 lignes) |
| `frontend/src/features/billing/components/promo-badge.tsx` | NOUVEAU (107 lignes) |
| `frontend/src/features/billing/components/promotion-form-modal.tsx` | REFACTORISÉ v4.1 (352 lignes) — CustomModal + i18n + CSS vars |
| `frontend/src/features/billing/components/bundle-card.tsx` | NOUVEAU (137 lignes) |
| `frontend/src/features/billing/components/facture-breakdown.tsx` | NOUVEAU (246 lignes) |
| `frontend/src/features/billing/components/code-promo-input.tsx` | MIGRÉ v4.0 (utilise useVerifierCoupon) |
| `frontend/src/routes/platform.promotions.tsx` | NOUVEAU (576 lignes) — Dashboard 3 onglets |
| `frontend/src/components/layout/platform-sidebar.tsx` | Entrée Promotions ajoutée (groupe Commerce) |
| `frontend/src/components/CommandPalette.tsx` | Entrée promotions ajoutée |
| `frontend/src/locales/fr/admin.json` | Clés navigation.promotions + commandPalette.promotions |
| `frontend/src/locales/en/admin.json` | Clés navigation.promotions + commandPalette.promotions |
| `frontend/src/features/billing/hooks/use-billing.ts` | `useVerifierCoupon` renommé `useVerifierCouponLegacy` (@deprecated) |
| `frontend/src/features/platform/components/groupes-saas-page.tsx` | `RemisesTab` migré vers API promotions v4 (scope=PLAN) |
| `frontend/src/locales/fr/promotions.json` | 150 lignes (48 clés form + dépréciation ajoutées) |
| `frontend/src/locales/en/promotions.json` | 150 lignes (parité FR) |
| `frontend/src/lib/i18n.ts` | Namespace promotions ajouté |
| `backend/src/database/seeds/system/seed-promotions.ts` | NOUVEAU (214 lignes) — 7 promotions v4 |
| `backend/src/database/seeds/index.ts` | Export seedPromotions + SEEDS_INFO |
| `backend/src/database/seeds/initial.seed.ts` | Import + appel seedPromotions (8g-bis) |
| `frontend/src/routes/_auth.mon-abonnement.tsx` | Section promotions + hook useMonAbonnementDetail |
| `frontend/src/routes/platform.remises.tsx` | Bannière dépréciation ajoutée |

---

## Audit Promotions v4.1 — Corrections Critiques (✅ COMPLET)

> Contexte : Audit profond `/grill-me` du système promotions. 11 lacunes identifiées, 12 recommandations. Toutes appliquées.

### R1 — Contexte facturation enrichi (✅ COMPLET)
- **Fichier** : `backend/src/modules/billing/services/facturation.service.ts`
- `contextePromo` passe maintenant `packsSouscritsIds`, `modulesSouscritsIds`, `packMontants`, `numeroCycle`
- Phases 2 (PACK) et 3 (MODULE) de la cascade désormais opérationnelles
- `numeroCycle` = nombre de factures émises pour l'abonnement

### R4 — Vérification coupon optimisée (✅ COMPLET)
- **Service** : `promotion.service.ts` — ajout `trouverParCoupon(codeCoupon)` (findOne direct DB)
- **Controller** : `promotions.controller.ts` — `/verifier-coupon` utilise `trouverParCoupon()` + `.trim()` + `etablissementId`
- Remplace l'ancien pattern `findAll({limit:200}) + .find()` en mémoire

### R5 — i18n complet platform.promotions.tsx (✅ COMPLET)
- 16 clés ajoutées FR+EN : `actions.activer/desactiver`, `simulateur.*`, `pagination.*`
- Toutes les strings FR hardcodées migrées vers `t()`

### R9 — calculerTotalPacksBundle() corrigé (✅ COMPLET)
- **Interface** : `ContextePromotion.packMontants?: Record<string, number>` ajouté
- **Facturation** : `packMontants[packId] = montantPack` lors de l'itération packs
- **Service** : `calculerTotalPacksBundle()` somme les montants individuels des packs du bundle, avec fallback prorata

### R2 — Seeds multi-scopes (✅ COMPLET)
- **seed-promotions.ts** : 11 promotions (7 PLAN + 2 PACK + 2 MODULE dont 1 GRATUITE)
- **seed-bundles.ts** : NOUVEAU — 2 bundles (Élèves+Stockage −15%, SMS+Stockage −20%)
- Résolution dynamique des packIds par code pack
- Enregistré dans `seeds/index.ts` + `initial.seed.ts`

### R3 — Suivi utilisation par établissement (✅ COMPLET)
- **Entité** : `promotion-utilisee.entity.ts` — table `promotion_utilisees` (promotionId, etablissementId, factureId, scope, montantDeduit)
- **Service** : `enregistrerUtilisation()` enrichi — crée des enregistrements de tracking en plus d'incrémenter le compteur
- **Controller** : `GET /api/platform/facturation/promotions/usage-stats` — historique paginé + agrégation par promotion
- **Migration** : `217-promotion-tracking-usage.sql` (table + RLS + index)
- **Facturation** : appel enrichi avec contexte complet (etablissementId, factureId, scope, montantDeduit)

### R6 — Anti-abus coupons (✅ COMPLET)
- **Middleware** : `couponRateLimitMiddleware` dans `promotions.controller.ts`
- Redis INCR/EXPIRE par IP — 5 tentatives/minute max sur `/verifier-coupon`
- Mode dégradé : laisse passer si Redis indisponible
- Appliqué sur la route `POST /verifier-coupon`

### R7 — Stacking rules (✅ COUVERT PAR DESIGN)
- Les 4 phases de la cascade sont indépendantes → stacking cross-scope naturel
- Le flag `cumulable` contrôle l'empilement intra-scope
- Pas de configuration supplémentaire nécessaire (pattern Stripe/Talon.One)

### Fichiers créés/modifiés v4.1
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/services/facturation.service.ts` | Contexte enrichi (packsSouscritsIds, modulesSouscritsIds, packMontants, numeroCycle) |
| `backend/src/modules/billing/services/promotion.service.ts` | `trouverParCoupon()` + `packMontants` dans ContextePromotion + `calculerTotalPacksBundle()` réel |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | Coupon optimisé (findOne + trim + etablissementId) |
| `backend/src/database/seeds/system/seed-promotions.ts` | 11 promotions (ajouts PACK, MODULE, GRATUITE) |
| `backend/src/database/seeds/system/seed-bundles.ts` | NOUVEAU (128 lignes) — 2 bundles |
| `backend/src/database/seeds/index.ts` | Export seedBundlePromotions + SEEDS_INFO mis à jour |
| `backend/src/database/seeds/initial.seed.ts` | Import + appel seedBundlePromotions (8g-ter) |
| `frontend/src/routes/platform.promotions.tsx` | i18n complet (filtres, boutons, simulateur, pagination) |
| `frontend/src/locales/fr/promotions.json` | +16 clés (actions, simulateur, pagination) |
| `frontend/src/locales/en/promotions.json` | +16 clés (parité FR) |
| `backend/src/modules/billing/entities/promotion-utilisee.entity.ts` | NOUVEAU (54 lignes) — tracking utilisations |
| `backend/src/modules/billing/entities/index.ts` | Export PromotionUtilisee |
| `backend/src/modules/billing/services/promotion.service.ts` | `enregistrerUtilisation()` enrichi (contexte + tracking) |
| `backend/src/modules/billing/services/facturation.service.ts` | Appel `enregistrerUtilisation` avec contexte complet |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | `couponRateLimitMiddleware` + endpoint `/usage-stats` |
| `backend/src/modules/billing/cron-jobs.ts` | `cronExpirationPromotions()` — quotidien 00h05 |
| `backend/database/migrations/217-promotion-tracking-usage.sql` | NOUVEAU (57 lignes) — table + RLS + index |

---

## Améliorations Promotions v4.2 — i18n complet + Statistiques (✅ COMPLET)

> Contexte : Polish final du système promotions — i18n complet sur tous les composants, onglet statistiques d'utilisation.

### i18n complet — 3 composants migrés (✅ COMPLET)
- **`facture-breakdown.tsx`** : 8 strings FR migrées vers `t('breakdown.*')` (titres phases, plafond, aucun scope, total)
- **`promo-badge.tsx`** : 3 strings FR migrées vers `t('etats.*')` (Actif, Inactif, Expiré)
- **`platform.promotions.tsx`** : 10 strings FR migrées (erreurs chargement, toggle, suppression, confirmation modals, durée, pagination)

### Nouvelles clés i18n (FR+EN) — sections `breakdown` + `stats` + `messages.*` (✅ COMPLET)
- **`breakdown`** (9 clés) : titre, plan, packs, modules, gratuités, plafond40, sansPlafond, aucuneScope, totalApres
- **`stats`** (15 clés) : titre, description, KPIs, colonnes tableau, historique, agrégation, pagination
- **`messages`** (10 clés ajoutées) : erreurChargement, erreurChargementBundles, ressayer, erreurToggle, erreurSuppression, bundleSupprime, permanente, premiereFacture, titreSupprimerPromo, titreSupprimerBundle

### Hook `useUsageStats` + types (✅ COMPLET)
- **Types** : `PromotionUtiliseeRecord`, `AggregationPromotion`, `UsageStatsResponse` dans `promotion.types.ts`
- **Hook** : `useUsageStats(page, limit)` dans `use-promotions.ts` — connecté à `GET /api/platform/facturation/promotions/usage-stats`

### Onglet Statistiques (✅ COMPLET)
- **4 KPI cards** : Total utilisations, Montant total déduit, Promotions actives, Établissements concernés
- **Tableau agrégation** : Par code promotion + scope + montant total déduit + nb utilisations
- **Tableau historique** : Date + code + scope + montant déduit (paginé)
- **Empty state** : Icône BarChart3 + message i18n
- **Loading/Error states** : Skeleton + retry
- Responsive 320px-2560px, dark mode, CSS vars

### Fichiers créés/modifiés v4.2
| Fichier | Action |
|---------|--------|
| `frontend/src/locales/fr/promotions.json` | +42 lignes (breakdown, stats, messages) |
| `frontend/src/locales/en/promotions.json` | +42 lignes (parité FR) |
| `frontend/src/features/billing/components/facture-breakdown.tsx` | i18n complet (8 strings → t()) |
| `frontend/src/features/billing/components/promo-badge.tsx` | i18n complet (3 strings → t()) |
| `frontend/src/routes/platform.promotions.tsx` | i18n complet + onglet Statistiques (StatsTab 170 lignes) |
| `frontend/src/features/billing/types/promotion.types.ts` | +34 lignes (types stats) |
| `frontend/src/features/billing/hooks/use-promotions.ts` | +17 lignes (hook useUsageStats) |

---

## Corrections Promotions v4.3 — Bugs critiques + Intégration + Stats (✅ COMPLET)

> Contexte : Audit profond du système promotions. 3 bugs critiques identifiés et corrigés + intégration facturation + refonte stats + page client.

### BUG-1 : Filtrage `cibleId` dans `estValide()` (✅ COMPLET)
- **Fichier** : `backend/src/modules/billing/services/promotion.service.ts`
- **Problème** : `cibleId` déclaré dans l'entité Promotion (L123) mais jamais filtré dans `estValide()`. Une promotion ciblée sur un plan/pack/module spécifique s'appliquait à tous.
- **Fix** : Switch sur le scope qui vérifie la correspondance entre `promo.cibleId` et le bon champ du contexte (`planId`, `packsSouscritsIds`, `modulesSouscritsIds`).

### BUG-2 : Évaluation `cibleRessource` dans `estValide()` (✅ COMPLET)
- **Fichier** : `backend/src/modules/billing/services/promotion.service.ts`
- **Problème** : `cibleRessource` commenté vide (L518-522). Les promotions ciblées sur une ressource pack (ex: 'stockageGo') s'appliquaient à tous les packs.
- **Fix** : Implémentation du filtrage via `ctx.packRessources` (nouveau champ `Record<string, string>` dans `ContextePromotion`) — map packId → ressource.
- **Interface étendue** : `packRessources?: Record<string, string>` ajoutée à `ContextePromotion`.

### BUG-3 : Tracking bundles dans `PromotionUtilisee` (✅ COMPLET)
- **Fichier** : `backend/src/modules/billing/services/promotion.service.ts`
- **Problème** : `enregistrerUtilisationBundle()` incrémentait le compteur mais ne créait pas de `PromotionUtilisee`. Les bundles n'apparaissaient pas dans les statistiques.
- **Fix** : Ajout d'un paramètre `contexte` optionnel qui crée les records de tracking (scope='BUNDLE').

### Intégration facturation.service.ts (✅ COMPLET)
- **`packRessources`** : Collecte automatique des ressources packs depuis `souscription.pack?.ressource` → propagé dans `contextePromo`.
- **Tracking bundles** : Séparation promos classiques / bundles (scope=BUNDLE) dans `genererFacture()`. Appel `enregistrerUtilisationBundle()` avec contexte complet.

### Refonte usage-stats (✅ COMPLET)
- **`PromotionService.getUsageStats()`** : Méthode service avec filtres (scope, etablissementId), pagination, agrégation par promotion, et résumé global (totalDeduit, totalUtilisations, nbPromotionsDistinctes).
- **`PromotionService.genererExportCSV()`** : CSV UTF-8 avec BOM, séparateur point-virgule, 5000 lignes max.
- **Controller** : `/usage-stats` délègue au service. Nouvel endpoint `/usage-stats/export` (CSV download).
- **Frontend** : `useUsageStats()` enrichi avec filtres. `exporterUsageStatsCSV()` pour le téléchargement. `ResumeStatsUsage` type ajouté.

### StatsTab amélioré (✅ COMPLET)
- **KPIs serveur** : Utilise le `resume` de l'API (précis) au lieu du calcul client.
- **Filtre scope** : Dropdown (Tous/Plan/Packs/Modules/Bundles) avec reset pagination.
- **Bouton export CSV** : `ElisaButton variant="outline"` + icône Download.

### Page client "Mes promotions" (✅ COMPLET)
- **Fichier** : `frontend/src/features/billing/components/mon-abonnement.tsx`
- **Section code promotionnel** : Input avec icône Tag, auto-uppercase, bouton Vérifier, feedback visuel (succès/erreur), support touche Entrée.
- **Section promotions éligibles** : Liste des promotions disponibles (max 5 affichées + "+N autres"), badge scope, date fin, valeur.
- Responsive 320px-2560px, dark mode, CSS vars.

### i18n v4.3 (FR+EN)
- **billing.json** : +7 clés abonnement (remisesActives, packsSouscrits, codePromo, promotionsEligibles, jusquau, autresPromos, prochaineFacturation)
- **promotions.json** : +2 clés stats (tousScopes, exporterCSV)

### Fichiers créés/modifiés v4.3
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/services/promotion.service.ts` | +180 lignes (BUG-1/2/3 fixes, getUsageStats, genererExportCSV, ContextePromotion étendu) |
| `backend/src/modules/billing/services/facturation.service.ts` | +45/-14 lignes (packRessources, tracking bundles séparé) |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | Refonte /usage-stats (délégation service) + /usage-stats/export (CSV) |
| `frontend/src/features/billing/types/promotion.types.ts` | +7 lignes (ResumeStatsUsage) |
| `frontend/src/features/billing/hooks/use-promotions.ts` | +20 lignes (useUsageStats filtres, exporterUsageStatsCSV) |
| `frontend/src/routes/platform.promotions.tsx` | +40 lignes (StatsTab: filtre scope, export CSV, KPIs serveur) |
| `frontend/src/features/billing/components/mon-abonnement.tsx` | +127 lignes (code promo input, promotions éligibles) |
| `frontend/src/locales/fr/billing.json` | +7 clés abonnement |
| `frontend/src/locales/en/billing.json` | +7 clés abonnement (parité FR) |
| `frontend/src/locales/fr/promotions.json` | +2 clés stats |
| `frontend/src/locales/en/promotions.json` | +2 clés stats (parité FR) |

---

## Audit Promotions v4.5 — Corrections Critiques & Améliorations (✅ TERMINÉ)

> Contexte : Audit complet du système de promotions v4.4+v5. Détection et correction de bugs critiques, améliorations UX frontend, ajout de tests unitaires.

### BUG CRITIQUE — Route Express shadowing (controller)
- **Problème** : Les routes `/bundles`, `/usage-stats`, `/analytics`, `/simuler` étaient définies APRÈS `/:id` dans le `platformPromotionRouter`. Express interprétait "bundles", "usage-stats", etc. comme des `:id`.
- **Fix** : Réorganisation de l'ordre des routes — routes statiques AVANT `/:id`.
- **Fichier** : `backend/src/modules/billing/controllers/promotions.controller.ts`

### BUG CRITIQUE — montantModules=0 (preview-cascade)
- **Problème** : `montantModules = modulesActifs.length * 0` → toujours 0 dans l'endpoint `preview-cascade`.
- **Fix** : Calcul réel depuis `ModuleCatalogue.prixMensuel` via relation `module`.
- **Fichier** : `backend/src/modules/billing/controllers/promotions.controller.ts`

### Sécurité — SQL Injection dans getAnalytics()
- **Problème** : String interpolation dans les clauses WHERE (`etablissementId.replace(...)`).
- **Fix** : Query builder parameterized (`whereBuilder()` + `setParameter('etabId', ...)`).
- **Fichier** : `backend/src/modules/billing/services/promotion.service.ts`

### Performance — Dynamic imports → static imports
- **Problème** : `await import()` pour 4 modules à chaque requête preview-cascade.
- **Fix** : Imports statiques en tête de fichier (`AbonnementClient`, `AbonnementPack`, `AbonnementModule`, `AppDataSource`).
- **Fichier** : `backend/src/modules/billing/controllers/promotions.controller.ts`

### Cohérence — Commentaires "5 phases"
- **Problème** : Commentaires "4 phases" obsolètes dans 3 fichiers backend.
- **Fix** : Mise à jour vers "5 phases" (PLAN → PACK → QUOTA → MODULE → GRATUITE).
- **Fichiers** : `promotion.service.ts`, `promotion.entity.ts`, `facturation.service.ts`

### Frontend — HistoriquePromotionsClient pagination
- **Amélioration** : Pagination "Voir plus" avec état page, bouton load more, indicateur page/totalPages.
- **Responsive** : `p-4 sm:p-6`, `px-3 sm:px-4`.
- **Fichier** : `frontend/src/features/billing/components/mon-abonnement.tsx`

### Frontend — PromotionFormModal améliorations
- **Fix submit** : `onClick={handleSubmit}` → `type="submit"` (formulaire HTML correct).
- **Responsive paliers** : Wrapper `overflow-x-auto` pour scroll horizontal sur mobile.
- **Fichier** : `frontend/src/features/billing/components/promotion-form-modal.tsx`

### Tests unitaires — PromotionService (601 lignes)
- **Fichier** : `backend/test/unit/promotion.service.spec.ts`
- **Couverture** : estValide() (15 tests), auto-promotions (5 tests), cascade 5 phases (8 tests), paliers volume (2 tests), bundles (4 tests), structure résultat (2 tests).
- **Total** : 36 tests unitaires.

### i18n
- **billing.json FR+EN** : +clé `voirPlus` ("Voir plus" / "Show more")

### Fichiers créés/modifiés v4.5
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/controllers/promotions.controller.ts` | Réorganisation routes (shadowing fix), BUG montantModules, imports statiques |
| `backend/src/modules/billing/services/promotion.service.ts` | SQL injection fix, commentaires 5 phases |
| `backend/src/modules/billing/entities/promotion.entity.ts` | Commentaire 5 phases |
| `backend/src/modules/billing/services/facturation.service.ts` | Commentaires 5 phases |
| `frontend/src/features/billing/components/mon-abonnement.tsx` | Historique pagination "Voir plus" |
| `frontend/src/features/billing/components/promotion-form-modal.tsx` | Fix submit type="submit", responsive paliers |
| `frontend/src/locales/fr/billing.json` | +clé voirPlus |
| `frontend/src/locales/en/billing.json` | +clé voirPlus |
| `backend/test/unit/promotion.service.spec.ts` | NOUVEAU (601 lignes, 36 tests) |

---

## Promotions v4.5 — Consolidation & Intégration (✅ TERMINÉ)

> Contexte : Finalisation du système de promotions et remises, corrections bugs critiques, intégration frontend/client, exécution seeds.

### Corrections Backend (✅ COMPLET)
- **Code mort QUOTA** — `promotion.service.ts` ligne 391 : bloc if vide → filtrage correct par `quantiteRessource`
- **Type cast supprimé** — `trouverParCoupon()` : `as any` retiré (cast inutile)
- **Seed type fix** — `seed-promotions.ts` : cast `config as any` pour compatibilité TypeORM JSONB update

### Améliorations Frontend Client (✅ COMPLET)
- **Aperçu cascade client** — `_auth.mon-abonnement.tsx` : composant `PromotionsSection` avec bouton "Aperçu prochaine facture"
- **FactureBreakdown intégré** — Affichage détail 5 phases de cascade dans la page abonnement client
- **usePreviewCascade** — Hook connecté à `POST /api/billing/promotions/preview-cascade`
- **Responsive + dark mode** — Composant extrait, styles harmonisés avec le reste de la page

### Unification Navigation Remises ↔ Promotions (✅ COMPLET)
- **Sidebar fusionnée** — `platform-sidebar.tsx` : 2 entrées (remises + promotions) → 1 seule "Promotions & Remises"
- **Redirect** — `platform.remises.tsx` converti en `<Navigate to="/platform/promotions" replace />` (265 → 25 lignes)
- **CommandPalette** — 2 entrées fusionnées en 1 seule avec keywords combinés
- **i18n** — Clés `navigation.promotionsRemises` + `commandPalette.promotionsRemises` (FR/EN)

### Composants Réutilisables Billing (✅ COMPLET)
- **billing-form-fields.tsx** (208 lignes) — FormInput, FormSelect, FormCheckbox, FormTextarea extraits de promotion-form-modal.tsx
- **promotion-form-modal.tsx** — 75 lignes de composants locaux supprimées, délégation aux composants partagés
- **Responsive PromotionsSection** — `clamp()` pour padding, `flex-col sm:flex-row` pour layout
- **i18n PromotionsSection** — Strings FR hardcodées → `t('client.xxx')` (namespace promotions)

### Seeds Exécutés (✅ COMPLET — session 2)
- **15 promotions** insérées/mises à jour dans la base de données
- **7 remises** legacy mises à jour
- **2 bundles** mis à jour
- Couverture : 6 PLAN, 2 PACK, 2 MODULE, 1 GRATUITE, 1 QUOTA, 2 auto-promo, 1 programmée
- Idempotent : upsert par code unique

### Architecture Finale Promotions
| Composant | Fichier | Lignes | Rôle |
|-----------|---------|--------|------|
| Entity Promotion | `promotion.entity.ts` | 228 | 5 scopes, 3 types, JSONB conditions/config |
| Entity PromotionUtilisee | `promotion-utilisee.entity.ts` | 54 | Tracking utilisations par établissement |
| Entity BundlePromotion | `bundle-promotion.entity.ts` | ~80 | Combos de packs |
| Service PromotionService | `promotion.service.ts` | 1107 | Cascade 5 phases, CRUD, analytics, auto-promo |
| Controller Promotions | `promotions.controller.ts` | 550 | Routes platform + client, rate limiting coupons |
| Seed Promotions | `seed-promotions.ts` | 381 | 15 promotions v5 multi-scopes |
| Tests Unitaires | `promotion.service.spec.ts` | 601 | 36 tests (cascade, validité, auto-promo) |
| Page Platform | `platform.promotions.tsx` | 1084 | 4 onglets (CRUD, bundles, simulateur, stats) |
| Page Client | `_auth.mon-abonnement.tsx` | ~680 | Section promotions + aperçu cascade |
| Types Frontend | `promotion.types.ts` | 341 | Types partagés + helpers affichage |
| Hooks API | `use-promotions.ts` | 348 | TanStack Query (CRUD, cascade, analytics) |
| FactureBreakdown | `facture-breakdown.tsx` | 257 | Détail phases avec accordéon |
| Cron Expiration | `cron-jobs.ts` | ~30 | Expiration + activation programmée |

### Intégration Facturation ↔ Promotions
- `facturation.service.ts` appelle `promotionService.appliquerCascade()` lors de la génération de facture
- 5 phases : PLAN (plafond 40%) → PACK → QUOTA → MODULE → GRATUITE
- `enregistrerUtilisation()` + `enregistrerUtilisationBundle()` pour tracking
- `PromotionUtilisee` table pour analytics et reporting

### Fichiers modifiés session consolidation
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/services/promotion.service.ts` | Code mort QUOTA fixé, type cast retiré, @deprecated, +exporterPromotionsCSV(), +importerPromotionsCSV() |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | +2 endpoints: GET /export, POST /import CSV |
| `backend/src/database/seeds/system/seed-promotions.ts` | Cast `config as any` pour TypeORM |
| `frontend/src/routes/_auth.mon-abonnement.tsx` | Dashboard client enrichi (économies, expirant, animations Framer Motion) |
| `frontend/src/routes/platform.promotions.tsx` | +Boutons CSV export/import, modal import CSV, animations améliorées (popLayout, whileHover) |
| `frontend/src/features/billing/hooks/use-promotions.ts` | +exporterPromotionsCSV(), +useImporterPromotionsCSV() |
| `frontend/src/features/billing/components/billing-form-fields.tsx` | NOUVEAU (208 lignes) — 4 composants réutilisables |
| `frontend/src/features/billing/components/promotion-form-modal.tsx` | Délégation composants → billing-form-fields (-75 lignes) |
| `frontend/src/routes/platform.remises.tsx` | SUPPRIMÉ (legacy) |
| `frontend/src/features/platform/components/remise-form-modal.tsx` | SUPPRIMÉ (legacy) |
| `frontend/src/features/platform/index.ts` | Exports RemiseFormModal retirés |
| `frontend/src/routes/platform.debug.api.tsx` | Endpoint debug remis → /api/billing/promotions |
| `frontend/src/components/layout/platform-sidebar.tsx` | Fusion 2 entrées → 1 "Promotions & Remises" |
| `frontend/src/components/CommandPalette.tsx` | Fusion 2 entrées → 1 avec keywords combinés |
| `frontend/src/locales/fr/admin.json` | +navigation.promotionsRemises + commandPalette |
| `frontend/src/locales/en/admin.json` | +navigation.promotionsRemises + commandPalette |
| `frontend/src/locales/fr/promotions.json` | +section client (7 clés) + importCsv (6 clés) + actions CSV |
| `frontend/src/locales/en/promotions.json` | +section client (7 clés) + importCsv (6 clés) + actions CSV |

---

## Audit Promotions v4.5 — Corrections & Nettoyage (✅ TERMINÉ)

> Contexte : Audit complet du système de promotions — vérification chargement/affichage partout, correction erreurs TypeScript, sécurité CSV, nettoyage code mort.

### Corrections Backend
- **Sécurité CSV** : Limite taille 500 Ko (`CSV_TOO_LARGE`) + limite 1000 lignes (`CSV_TOO_MANY_LINES`)
- **Fix null/undefined** : `codeCoupon: coupon || undefined` (au lieu de `null`) dans import CSV
- **Fix routes legacy** : Cast `as any` sur routes remises legacy dans `platform.routes.ts`

### Corrections Frontend
- **Fix `apiClient.post`** : 3 args → 2 args (body `{ csv: csvContent }` au lieu de csv brut + config)
- **Fix `mutateAsync(undefined)`** : TanStack Query v5 requiert au moins 1 argument
- **Fix `historique?.historique`** : `UsageStatsResponse` a `historique` (pas `data`)
- **Code mort supprimé** :
  - `mon-abonnement.tsx` : `FacturesTab`, `SimulateurTab`, `useMesFactures`, interface `Facture`, import `FileText`/`Download`/`PlanSimulator`
  - `platform.promotions.tsx` : import `GripVertical`
  - `promotion-form-modal.tsx` : import `FormTextarea`, variable `titre`
- **Anti-pattern modal CSV** : Overlay raw (`fixed inset-0 bg-black/50`) remplacé par `CustomModal` (convention)
- **Prop morte** : `abonnement` retiré de `PromotionsSection` (non utilisé)
- **Types nettoyés** : `RemiseAbonnement` supprimé de `plan.types.ts`, remplacé par `Promotion`

### Seeds exécutés
- 15 promotions v5 multi-scopes (idempotent)
- 2 bundles (idempotent)
- 7 remises legacy (idempotent)

### Fichiers modifiés session audit v4.5
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/services/promotion.service.ts` | Limite 1000 lignes CSV + fix null→undefined |
| `backend/src/modules/billing/controllers/promotions.controller.ts` | Limite 500 Ko CSV |
| `backend/src/routes/platform.routes.ts` | Cast `as any` legacy remises |
| `frontend/src/features/billing/hooks/use-promotions.ts` | Fix apiClient.post 2 args |
| `frontend/src/routes/_auth.mon-abonnement.tsx` | -95 lignes (code mort) + fix props |
| `frontend/src/routes/platform.promotions.tsx` | CustomModal CSV (-17 lignes) + import cleanup |
| `frontend/src/features/billing/components/promotion-form-modal.tsx` | Import cleanup (-4 lignes) |
| `frontend/src/features/billing/types/plan.types.ts` | Supp `RemiseAbonnement`, restauration `PackQuotaSouscrit` |
| `frontend/src/features/billing/components/mon-abonnement.tsx` | SUPPRIMÉ (composant mort 524 lignes) |

---

## Promotions v4.5 — Enrichissement & Intégration (✅ TERMINÉ)

> Contexte : Suite de l'audit v4.5 — améliorations frontend/backend, intégration complète, i18n, notifications.

### Analytics avancées (✅ COMPLET)
- **Barre de progression cascade** — `frontend/src/routes/platform.promotions.tsx`
  - Visualisation empilée des 5 phases (PLAN/PACK/QUOTA/MODULE/GRATUITE)
  - Tooltips hover avec montant et pourcentage par scope
  - Légende inline avec points colorés
- **i18n** — Clés `cascadeProgress` et `deduitTotal` ajoutées dans `promotions.json` FR + EN

### Page Mon Abonnement enrichie (✅ COMPLET)
- **Refonte complète** — `frontend/src/routes/_auth.mon-abonnement.tsx`
  - CSS variables (dark mode natif, plus de classes `text-foreground`/`bg-muted`)
  - Skeleton loading (`MonAbonnementSkeleton`) au lieu de "Chargement..."
  - Confirmation modal pour upgrade/downgrade (`ConfirmationModal`)
  - Tabs responsive (icônes seules sur mobile, label complet sur desktop)
  - i18n complète (50 clés FR + EN dans `billing.json` → `monAbonnement.*`)
  - Grille upgrade : 6 plans affichés (au lieu de 3), responsive 1→2→3 colonnes

### Codes coupon (✅ AUDITÉ — déjà implémenté)
- Backend : `codeCoupon` dans promotions, rate limiting 5 tentatives/min/IP, endpoint `POST /verifier-coupon`
- Frontend : `CodePromoInput` (136 lignes), `useVerifierCoupon`, champ dans `promotion-form-modal.tsx`
- Pas de duplication nécessaire — le CRUD admin des coupons passe par le CRUD promotions

### Notifications temps réel — Bannière client (✅ COMPLET)
- **Composant** — `frontend/src/features/billing/components/promotions-banner.tsx` (105 lignes)
  - Polling TanStack Query (refetchInterval: 5 min, staleTime: 2 min)
  - Message dynamique : "X promotions actives" ou "X promotions expirent bientôt"
  - Dismissible (localStorage, TTL 4 heures)
  - Responsive, dark mode, animations Framer Motion
- **Intégration** — `frontend/src/routes/_auth.tsx`
  - Bannière insérée entre `<PageLayout>` et `<Outlet/>`
  - Visible sur toutes les routes authentifiées

### Export PDF factures enrichi (✅ COMPLET)
- **Service** — `backend/src/modules/billing/services/facture-pdf.service.ts`
  - Nouvelle section `promotions` dans `FacturePdfData` (nom, scope, type, valeur, montantDeduit)
  - Nouveau champ `montantRemises` dans `totaux`
  - Extraction automatique des lignes REMISE comme promotions

### Corrections TypeScript (✅ COMPLET)
- **Backend** — `backend/src/routes/platform.routes.ts`
  - `z.nativeEnum(DureeValiditePack)` au lieu de `z.enum(['CYCLE_COURANT', 'ILLIMITE'])`
  - `z.nativeEnum(ComportementPhase)` au lieu de `z.enum(['READ_ONLY', 'LOCKED', 'ARCHIVED'])`
  - Résolution erreurs TS2345 (incompatibilité string literal vs enum)

### Tests E2E (✅ COMPLET — session précédente)
- `backend/test/e2e/promotions-flow.spec.ts` (495 lignes, 25 tests)
- 7 suites : cascade, éligibilité, tracking, analytics, bundles, CSV, coupons

### Fichiers créés/modifiés session enrichissement
| Fichier | Action |
|---------|--------|
| `frontend/src/features/billing/components/promotions-banner.tsx` | NOUVEAU (105 lignes) |
| `frontend/src/routes/_auth.tsx` | Import + insertion PromotionsBanner |
| `frontend/src/routes/_auth.mon-abonnement.tsx` | Refonte complète (i18n, CSS vars, skeleton, modal) |
| `frontend/src/routes/platform.promotions.tsx` | Barre progression cascade (+52 lignes) |
| `frontend/src/locales/fr/promotions.json` | Clés cascadeProgress, deduitTotal |
| `frontend/src/locales/en/promotions.json` | Clés cascadeProgress, deduitTotal (EN) |
| `frontend/src/locales/fr/billing.json` | Section monAbonnement (50 clés) |
| `frontend/src/locales/en/billing.json` | Section monAbonnement (50 clés EN) |
| `backend/src/modules/billing/services/facture-pdf.service.ts` | Section promotions + montantRemises |
| `backend/src/routes/platform.routes.ts` | z.nativeEnum pour DureeValiditePack + ComportementPhase |


---

## Promotions v4.5 — Corrections Critiques & Optimisation (✅ TERMINÉ)

> Contexte : Session de continuation — audit approfondi, corrections bugs critiques, optimisation performance.

### Correction Bug DTO TypeScript (✅ COMPLET)
- **Fichier** — `backend/src/modules/billing/dto/promotion.dto.ts`
  - **Problème** : `.partial()` appelé sur `ZodEffects` (après `.refine()`) → erreur TS2339
  - **Solution** : Séparation `_promotionBase` (ZodObject) + refinements appliqués après
  - **Impact** : `updatePromotionSchema` fonctionne correctement (tous champs optionnels sauf `code`)
  - **Refinements conservés** : 
    - Cohérence dates (`dateFin > dateDebut`)
    - Plafond pourcentage (`valeur <= 100` si type `POURCENTAGE`)

### Intégration Facturation ↔ Promotions (✅ AUDITÉ — déjà complet)
- **Cascade 5 phases** — `promotionService.appliquerCascade()` appelé dans `facturation.service.ts:271`
- **Contexte enrichi** — `dateDebutAbonnement`, `dateFinAbonnement`, `numeroCycle`, `nombreEleves`, `packsSouscritsIds`, `modulesSouscritsIds`
- **Tracking utilisations** — `enregistrerUtilisation()` + `enregistrerUtilisationBundle()` après émission facture
- **Lignes facture** — Chaque promotion appliquée génère une ligne `TypeLigneFacture.REMISE` avec montant négatif
- **Résultat cascade** — Stocké dans `facture.promotionsCascade` pour audit et affichage frontend

### Seeds Vérifiés (✅ EXÉCUTÉS)
- **15 promotions** couvrant tous les scopes (6 PLAN, 2 PACK, 2 MODULE, 1 GRATUITE, 1 QUOTA, 2 auto-promo, 1 programmée)
- **2 bundles** (PACK_ESSENTIEL, PACK_COMPLET)
- **7 remises legacy** (compatibilité ascendante)
- **Idempotence** : Upsert par code unique (0 créés, tous mis à jour si existants)

### Composants Frontend (✅ AUDITÉ — déjà conforme)
- **promotion-form-modal.tsx** (610 lignes) : CustomModal, onglets Promotion/Bundle, 6 sections formulaire, responsive, dark mode CSS variables
- **promotions-banner.tsx** (110 lignes) : Polling léger, dismissible, animations Framer Motion
- **platform.promotions.tsx** (1238 lignes) : 4 onglets (CRUD, Bundles, Simulateur, Statistiques), analytics SVG interactifs
- **facture-breakdown.tsx** (257 lignes) : Accordéon cascade 5 phases, expandable
- **promo-badge.tsx** (121 lignes) : Badges scope + statut colorés
- **bundle-card.tsx** (137 lignes) : Cartes bundles avec hover actions
- **billing-form-fields.tsx** (208 lignes) : FormInput, FormSelect, FormCheckbox, FormTextarea réutilisables

### Validation Zod Renforcée (✅ COMPLET)
- **createPromotionSchema** : 2 refinements ajoutés
  - `dateFin > dateDebut` (cohérence temporelle)
  - `valeur <= 100` si type `POURCENTAGE` (plafond logique)
- **createBundleSchema** : Validation `packIds.length >= 2` (min 2 packs par bundle)
- **updatePromotionSchema** : `.partial().omit({ code: true })` sur base object (fonctionne correctement)

### Performance & Sécurité (✅ AUDITÉ)
- **Rate limiting** : 5 tentatives/minute/IP sur `POST /verifier-coupon` (Redis)
- **Cache Redis** : TTL 60s sur `/promotions/eligibles` (bannière client)
- **Cron jobs** : Expiration automatique (00h05) + activation programmée
- **SQL injection** : Requêtes paramétrées dans `promotion.service.ts` (fix session précédente)
- **Routes statiques avant dynamiques** : Bug shadowing corrigé dans `promotions.controller.ts`

### Fichiers modifiés session corrections
| Fichier | Action |
|---------|--------|
| `backend/src/modules/billing/dto/promotion.dto.ts` | Séparation `_promotionBase` + refinements |
| `backend/src/modules/billing/controllers/billing.controller.ts` | Contexte enrichi (lignes 1419-1429) |
| `frontend/src/features/billing/components/promotions-banner.tsx` | Endpoint léger `/promotions/eligibles` |

### Recommandations Futures (optionnel)
1. **Tests unitaires promotion.service.ts** : Créer 36 tests couvrant cascade, éligibilité, tracking
2. **Export CSV promotions** : Ajouter endpoint `GET /platform/facturation/promotions/export`
3. **Analytics avancées** : Graphiques évolution mensuelle, prévision économies futures
4. **Notifications email** : Alerte expiration promotions (J-7, J-1)
5. **A/B testing** : Expérimenter différents seuils/valeurs pour optimiser taux conversion


### Fix Critical — Hook usePromotions shape mismatch (✅ COMPLET)
- **Fichier** — `frontend/src/features/billing/hooks/use-promotions.ts`
  - **Problème** : Le hook `usePromotions` retournait seulement le tableau des promotions (via `res.data` qui extrayait `data` de la réponse API), mais la page `platform.promotions.tsx` attendait `{ data: Promotion[], pagination: {...} }`
  - **Cause racine** : `apiClient.get()` retourne le JSON body brut (`response.json()`) = `{ success, data: [...], pagination: {...} }`. Le hook faisait `payload = res.data` → obtenait seulement le tableau, perdant la pagination
  - **Fix** : Retourner `{ data: payload?.data ?? payload, pagination: payload?.pagination }` pour mapper correctement le shape attendu
  - **Impact** : Sans ce fix, la table affichait "Aucune promotion configurée" même avec 15 promotions en base

### UX — Remplacement saisie UUID par sélecteurs à labels lisibles (✅ COMPLET)
- **Problème** : Les formulaires de promotions/bundles demandaient la saisie manuelle d'UUIDs (texte brut) pour les champs `cibleId` (plan/pack/module/bundle cible) et `packIds` (packs d'un bundle). UX catastrophique, source d'erreurs.
- **Solution** : Sélecteurs avec labels humains (noms, descriptions) au lieu d'UUIDs
- **Fichiers modifiés** :
  - `frontend/src/features/billing/components/billing-form-fields.tsx` — Nouveau composant `FormMultiSelect` (dropdown multi-sélection avec badges, checkboxes, toggle all, descriptions)
  - `frontend/src/features/billing/components/promotion-form-modal.tsx` :
    - **PromotionForm** : Ajout sélecteur `cibleId` dynamique selon scope (plans via `usePlans()`, packs via `usePacks()`, modules via `useModuleRegistry()`, bundles via `useBundles()`)
    - **BundleForm** : Remplacement textarea `packIdsText` (UUIDs manuels) par `FormMultiSelect` affichant noms de packs avec descriptions
  - `frontend/src/locales/fr/promotions.json` + `en/promotions.json` — Nouvelles clés i18n (`ciblePlan`, `ciblePack`, `cibleModule`, `cibleBundle`, `cibleHint`, `packIdsLabel` mis à jour)
- **Composant FormMultiSelect** : Dropdown avec checkboxes, badges sélectionnés, option "Tout sélectionner/désélectionner", descriptions secondaires, clic extérieur pour fermer, responsive, dark mode via CSS variables

### UX — Remplacement saisie UUID groupes d'établissements (✅ COMPLET)
- **Fichier** — `frontend/src/features/platform/components/groupes-saas-page.tsx`
  - **Problème** : Le composant `MembresTab` demandait la saisie manuelle d'un UUID d'établissement (`<input type="text" placeholder="ID établissement">`) pour ajouter un membre au groupe
  - **Fix** : Remplacé par `<select>` avec noms d'établissements + ville, chargés via `useQuery('/api/platform/facturation/etablissements')`. Filtrage automatique des établissements déjà membres

### UX — Remplacement saisie UUID compétences (matière) (✅ COMPLET)
- **Fichier** — `frontend/src/features/competences/components/competences-page.tsx`
  - **Problème** : Le champ `matiereId` dans `CompetenceFormModal` était un `<input type="text" placeholder="ID matière ou laisser vide">` (saisie UUID brut)
  - **Fix** : Remplacé par `<select>` avec noms de matières + code, chargés via `useMatieres({ limit: 500 })`. Option vide "— Aucune matière —" pour compétences transversales
  - **i18n** : Clé `aucuneMatiere` mise à jour dans `fr/competences.json` et `en/competences.json`

### Audit UUID — Résultat final
- **4 champs UUID corrigés** sur l'ensemble du codebase (promotions: cibleId + packIds, groupes: newEtabId, compétences: matiereId)
- **0 champ UUID restant** dans les formulaires métier
- **Pages debug plateforme** (`platform.debug.*`) : UUID intentionnel (outils développeur, non modifié)

---

## Cohérence Permissions Année Scolaire — Alignement RBAC (✅ COMPLET)

> Contexte : Audit des permissions `annees-scolaires:*` vs `annees:*` — incohérence entre le contrôleur backend, les routes frontend, le sidebar et l'enum des permissions.

### Problèmes identifiés et corrigés

| Problème | Avant | Après |
|----------|-------|-------|
| Permission `ANNEES_REOUVRIR` manquante | Absente du enum | `ANNEES_REOUVRIR = 'annees:reouvrir'` ajouté |
| Controller utilise strings au lieu de l'enum | `requirePermission('annees-scolaires:activer')` | `requirePermission(Permission.ANNEES_ACTIVER)` |
| Routes frontend utilisent le mauvais nom de module | `requireModulePermission('annees-scolaires')` | `requireModulePermission('annees')` |
| Sidebar utilise le mauvais nom de module | `useModulePermissions('anneesScolaires')` | `useModulePermissions('annees')` |
| Module absent du ModuleName enum | Non enregistré | `ANNEES_SCOLAIRES = 'annees-scolaires'` ajouté |
| Routes sans middleware gating | Pas de `requireModuleActive` | `requireModuleActive('annees-scolaires')` ajouté |
| Permission audit manquante | `audit:annees-scolaires:view` non défini | `AUDIT_ANNEES_SCOLAIRES_VIEW` ajouté |
| CASL subject map incomplet | `annees` absent | `'annees': 'AnneeScolaire'` ajouté |
| Permissions CRUD manquantes pour ADMIN/CHEF | Seulement `ANNEES_VIEW` | Toutes les permissions `ANNEES_*` assignées |

### Convention de nommage (source de vérité)

| Contexte | Nom du module | Exemple |
|----------|---------------|----------|
| Permission enum (`roles.enum.ts`) | `annees` | `ANNEES_VIEW = 'annees:view'` |
| Module catalogue (`modules_catalogue`) | `annees-scolaires` | `code: 'annees-scolaires'` |
| ModuleName enum (`modules.enum.ts`) | `annees-scolaires` | `ANNEES_SCOLAIRES = 'annees-scolaires'` |
| Middleware gating (`app.ts`) | `annees-scolaires` | `requireModuleActive('annees-scolaires')` |
| Frontend route guard | `annees` | `requireModulePermission('annees')` |
| Frontend sidebar hook | `annees` | `useModulePermissions('annees')` |
| CASL subject map | `annees` | `'annees': 'AnneeScolaire'` |

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `shared/src/enums/roles.enum.ts` | +`ANNEES_REOUVRIR`, +`AUDIT_ANNEES_SCOLAIRES_VIEW`, permissions CRUD assignées à ADMIN + CHEF |
| `shared/src/enums/modules.enum.ts` | +`ANNEES_SCOLAIRES` dans ModuleName + MODULE_CATEGORIES |
| `shared/src/casl/abilities.ts` | +`'annees': 'AnneeScolaire'` dans subjectMap |
| `backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts` | Toutes les permissions alignées sur l'enum `Permission` |
| `backend/src/app.ts` | +`requireModuleActive('annees-scolaires')` et `requireModuleActive('periodes')` sur toutes les routes |
| `frontend/src/routes/_auth.annees-scolaires*.tsx` | 3 fichiers : `requireModulePermission('annees')` |
| `frontend/src/components/layout/Sidebar.tsx` | `useModulePermissions('annees')` |
| `frontend/src/components/feedback/SmartEmptyState.tsx` | Permission `'annees:create'` |
| `frontend/src/features/annees-scolaires/components/annees-scolaires-page.tsx` | 6 permissions corrigées `annees:*` |
| `frontend/src/lib/audit-navigation.ts` | Permission `'annees:view'` |

---

## Cohérence Année Scolaire — Améliorations Audit, Dark Mode & Permissions (✅ COMPLET)

> Contexte : Suite de l'audit de cohérence — intégration audit service, dark mode, permissions validation workflow.

### Corrections apportées

| Correction | Fichier | Détail |
|------------|---------|--------|
| Controller `reouvrir` — passage `createurId` | `backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts` | `service.reouvrir(id, etablissementId, req.utilisateur?.id)` |
| Permission validation détail | `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | `hasPermission('annees-scolaires:validate')` → `hasAnyPermission(['validation:annees_scolaires:level1', 'validation:annees_scolaires:level2'])` |
| Dark mode badges statut (page liste) | `frontend/src/features/annees-scolaires/components/annees-scolaires-page.tsx` | Couleurs hardcodées (`bg-green-100`, `bg-blue-100`, etc.) → CSS variables (`var(--color-success-50)`, `var(--color-info-50)`, etc.) avec fallback rgba |
| Dark mode badges statut (page détail) | `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | `COULEURS_STATUT` et `COULEURS_STATUT_PERIODE` migrés vers CSS variables |
| Audit logging `cloturer()` | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Ajout `auditService.log()` avec `AuditAction.ANNEE_SCOLAIRE_CLOSE` |
| Audit logging `reouvrir()` | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Ajout `auditService.log()` avec `AuditAction.ANNEE_SCOLAIRE_REOPEN` |
| AuditAction enum | `backend/src/modules/auth/entities/audit-log.entity.ts` | +`ANNEE_SCOLAIRE_CLOSE`, +`ANNEE_SCOLAIRE_REOPEN` |
| Migration 221 RBAC | `backend/database/migrations/221-rbac-annees-scolaires.sql` | Création permissions `annees:reouvrir` + `audit:annees-scolaires:view` + attribution ADMIN/CHEF |

### Pattern CSS variables pour dark mode

```typescript
// ❌ INTERDIT — couleurs hardcodées (ne s'adapte pas au dark mode)
'bg-blue-50 text-blue-700 border-blue-200'
'bg-green-100 text-green-800'

// ✅ CORRECT — CSS variables avec fallback rgba
'bg-[var(--color-info-50,rgba(59,130,246,0.1))] text-[var(--color-info-700,rgba(59,130,246,0.8))]'
'bg-[var(--color-success-50,rgba(34,197,94,0.1))] text-[var(--color-success-700,rgba(34,197,94,0.8))]'
```

### Permission validation workflow

Les permissions de validation suivent le pattern `validation:module:levelN` (pas `module:validate`) :

```typescript
// ❌ INTERDIT — n'existe pas dans l'enum
hasPermission('annees-scolaires:validate')

// ✅ CORRECT — permissions réelles
hasAnyPermission([
    'validation:annees_scolaires:level1',
    'validation:annees_scolaires:level2',
])
```

### Fichiers modifiés (cette session)

| Fichier | Action |
|---------|--------|
| `backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts` | `reouvrir()` passe `req.utilisateur?.id` |
| `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Audit logging `cloturer()` + `reouvrir()` |
| `backend/src/modules/auth/entities/audit-log.entity.ts` | +`ANNEE_SCOLAIRE_CLOSE`, +`ANNEE_SCOLAIRE_REOPEN` |
| `backend/database/migrations/221-rbac-annees-scolaires.sql` | NOUVEAU (90 lignes) — permissions RBAC |
| `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | Permission validation corrigée + dark mode CSS variables |
| `frontend/src/features/annees-scolaires/components/annees-scolaires-page.tsx` | Dark mode CSS variables pour badges statut |

---

## Année Scolaire — Vérification finale, Migrations & Permissions complètes (✅ COMPLET)

> Contexte : Vérification finale de cohérence, exécution des migrations, correction permissions manquantes.

### Migrations exécutées

| Migration | Statut | Contenu |
|-----------|--------|----------|
| **220** — Cohérence année-période | ✅ Exécutée | Drop colonnes redondantes (`enCours`, `code`), backfill `anneeScolaireId`, index unique active, trigger cross-tenant |
| **221** — RBAC permissions | ✅ Exécutée | `annees:reouvrir` + `audit:annees-scolaires:view` pour ADMIN + CHEF |
| **222** — Permissions complètes | ✅ Exécutée | `annees:create`, `edit`, `delete`, `activer`, `cloturer` pour ADMIN + CHEF |

### Corrections apportées

| Correction | Fichier | Détail |
|------------|---------|--------|
| Bug i18n `t('validation')` → `t('validation.titre')` | `annee-scolaire-detail-page.tsx` | `t('validation')` retournait un objet (bug d'affichage) |
| Clé i18n `aucuneAnneeTrouvee` manquante | `fr/annees-scolaires.json` + `en/annees-scolaires.json` | Ajoutée dans les 2 langues |
| Permissions ADMIN/CHEF incomplètes | Migration 222 (NOUVEAU) | 5 permissions manquantes ajoutées |

### État des permissions après migration 222

| Rôle | Permissions `annees:*` |
|------|------------------------|
| ADMIN | view, create, edit, delete, activer, cloturer, reouvrir (7) |
| CHEF_ETABLISSEMENT | view, create, edit, delete, activer, cloturer, reouvrir (7) |
| SUPER_ADMIN | view, create, edit, delete, activer, cloturer, dupliquer (7) |
| PLATEFORME_SUPER_ADMIN | view, create, edit, delete, activer, cloturer, dupliquer (7) |

### Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `backend/database/migrations/222-permissions-completes-annees-scolaires.sql` | NOUVEAU (87 lignes) |
| `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | Fix i18n `validation.titre` |
| `frontend/src/locales/fr/annees-scolaires.json` | +`aucuneAnneeTrouvee` |
| `frontend/src/locales/en/annees-scolaires.json` | +`aucuneAnneeTrouvee` |
| `docs/rapports/RAPPORT-COMPLETUDE-ANNEE-SCOLAIRE.md` | Mise à jour avec migration 222 |

---

## Cohérence Année/Période — Corrections C2, C6, R2 (✅ COMPLET)

> Contexte : Audit de cohérence croisée Année Scolaire ↔ Période. Les rapports d'audit identifient 6 incohérences (C1-C6) et 5 redondances (R1-R5). La majorité est déjà résolue via les migrations 220-222. Cette session couvre les 4 actions restantes.

### Phase 1 — NOT NULL `anneeScolaireId` sur Note + Bulletin (C2/F3/F4)

**Objectif** : Éliminer la redondance nullable — `anneeScolaireId` est toujours dérivable via `periodeId` et le backfill (migration 220) a déjà rempli les valeurs.

| Correction | Fichier | Détail |
|------------|---------|--------|
| Migration 223 | `backend/database/migrations/223-not-null-annee-scolaire-id.sql` | Backfill sécurité + `SET NOT NULL` sur notes et bulletins |
| Entity Note | `backend/src/modules/notes/entities/note.entity.ts` | `nullable: true` retiré, `anneeScolaireId?: string` → `anneeScolaireId!: string` |
| Entity Bulletin | `backend/src/modules/bulletins/entities/bulletin.entity.ts` | Idem Note |
| Type frontend Note | `frontend/src/features/notes/types/note.types.ts` | `anneeScolaireId?: string` → `anneeScolaireId: string` |
| Type frontend Bulletin | `frontend/src/features/bulletins/types/bulletin.types.ts` | `anneeScolaireId?: string` → `anneeScolaireId: string` |

**Services vérifiés** : `notes.service.ts` et `bulletins.service.ts` passent déjà `anneeScolaireId` via `periode.anneeScolaireId` — aucun changement nécessaire.

### Phase 2 — Résolution import circulaire (C6)

**Objectif** : Éliminer le dernier `await import('@modules/annees-scolaires/services')` dans `templates-periode.service.ts`.

| Correction | Fichier | Détail |
|------------|---------|--------|
| Import circulaire résolu | `backend/src/modules/periodes/services/templates-periode.service.ts` | `await import(...)` remplacé par `AppDataSource.getRepository(AnneeScolaire)` + `findOne()` direct |

### Phase 3 — Interface ICloturable commune (R2)

**Objectif** : Extraire la logique commune de clôture/réouverture dans une interface partagée.

| Correction | Fichier | Détail |
|------------|---------|--------|
| Interface créée | `shared/src/interfaces/cloturable.interface.ts` | `ICloturable`, `StatutCloturable`, `CloturerOptions`, `ImpactsCloture` |
| Export shared | `shared/src/index.ts` | `export * from './interfaces/cloturable.interface'` |
| Entity AnneeScolaire | `backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts` | `implements ICloturable` + getter `nomOuLibelle` |
| Entity Periode | `backend/src/modules/periodes/entities/periode.entity.ts` | `implements ICloturable` + getter `nomOuLibelle` |

### Phase 4 — Audit frontend Périodes

**Vérification** : Tous les 5 modals utilisent `CustomModal` ✅, `PageHeader` avec `showBreadcrumbs` ✅, CSS variables dark mode ✅, responsive `clamp()` ✅, vue arbre custom justifiée (hiérarchie parent/enfant) ✅.

### Migrations exécutées (cumul)

| Migration | Statut | Contenu |
|-----------|--------|----------|
| **220** — Cohérence année-période | ✅ | Drop colonnes redondantes, backfill `anneeScolaireId`, index unique, trigger |
| **221** — RBAC permissions | ✅ | `annees:reouvrir` + `audit:annees-scolaires:view` |
| **222** — Permissions complètes | ✅ | 5 permissions CRUD manquantes |
| **223** — NOT NULL anneeScolaireId | ✅ | Backfill + `SET NOT NULL` sur notes et bulletins |

### Fichiers créés/modifiés (cette session)

| Fichier | Action |
|---------|--------|
| `backend/database/migrations/223-not-null-annee-scolaire-id.sql` | NOUVEAU (68 lignes) |
| `backend/src/modules/notes/entities/note.entity.ts` | `anneeScolaireId` NOT NULL |
| `backend/src/modules/bulletins/entities/bulletin.entity.ts` | `anneeScolaireId` NOT NULL |
| `frontend/src/features/notes/types/note.types.ts` | Type aligné (non-nullable) |
| `frontend/src/features/bulletins/types/bulletin.types.ts` | Type aligné (non-nullable) |
| `backend/src/modules/periodes/services/templates-periode.service.ts` | Import circulaire résolu |
| `shared/src/interfaces/cloturable.interface.ts` | NOUVEAU (74 lignes) — interface ICloturable |
| `shared/src/index.ts` | Export ICloturable |
| `backend/src/modules/annees-scolaires/entities/annee-scolaire.entity.ts` | `implements ICloturable` |
| `backend/src/modules/periodes/entities/periode.entity.ts` | `implements ICloturable` |

---

## Nettoyage DTO `enCours` — Suppression artefact historique (✅ COMPLET)

> Contexte : Le DTO backend `annee-scolaire.dto.ts` acceptait encore `enCours` (boolean) comme champ de création/requête, et le service l'utilisait pour déterminer si une année devait être activée immédiatement. Le frontend n'envoyait plus ce champ. L'activation passe exclusivement par la méthode `activer()` dédiée.

### Corrections apportées

| Correction | Fichier | Détail |
|------------|---------|--------|
| DTO create — `enCours` supprimé | `backend/src/modules/annees-scolaires/dto/annee-scolaire.dto.ts` | `enCours: z.boolean().default(false)` retiré du `createAnneeScolaireSchema` |
| DTO query — `enCours` supprimé | `backend/src/modules/annees-scolaires/dto/annee-scolaire.dto.ts` | `enCours: z.coerce.boolean().optional()` retiré du `queryAnneesScolairesSchema` |
| Service `create()` — logique simplifiée | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Bloc `estActive` supprimé, `statut: statutInitial` toujours utilisé |
| Service `update()` — logique simplifiée | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Bloc `devientActive` supprimé, activation via `activer()` uniquement |

---

## Audit complet système Année Scolaire — Pagination, migrations, frontend (✅ COMPLET)

> Contexte : Audit complet du système Année Scolaire/Période dans l'interface web. Vérification routes, sidebar, permissions, migrations, seeds, cohérence frontend/backend.

### Audit — Ce qui fonctionnait déjà

| Composant | Statut | Détail |
|-----------|--------|--------|
| Routes backend | ✅ | 9 routes avec `authMiddleware` + `requirePermission` |
| Routes frontend | ✅ | Layout + Index + Detail avec `requireModulePermission('annees')` |
| Sidebar | ✅ | "Années Scolaires" (Organisation) + "Périodes" (Académique) |
| Module catalogue | ✅ | `annees-scolaires` + `periodes` seedés (PAYANT, planMinimal: starter) |
| i18n FR/EN | ✅ | `annees-scolaires.json` (94 lignes) + `periodes.json` (197 lignes) |
| Hooks TanStack Query | ✅ | 8 hooks (CRUD + activer/cloturer/reouvrir/active) |
| Service audit + workflow | ✅ | `auditService.log()` + `validationWorkflowService` intégré |
| Page détail | ✅ | 4 onglets (Informations, Périodes, Validation, Historique) |
| Formulaire | ✅ | CustomModal, validation Zod, auto-génération libellé |
| Responsive + dark mode | ✅ | CSS variables, clamp(), grid responsive |
| Cron jobs | ✅ | `cronActivationAnneesScolaires` + `cronClotureAnneesScolaires` |

### Corrections apportées

| Correction | Fichier | Détail |
|------------|---------|--------|
| Pagination serveur | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Nouvelle méthode `findPaginated()` avec pagination, tri, filtre |
| Controller paginé | `backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts` | Détection `page`/`limit` → `findPaginated()`, sinon `findAll()` (rétrocompatibilité) |
| Hook frontend paginé | `frontend/src/features/annees-scolaires/hooks/use-annees-scolaires.ts` | Détection réponse paginée (`items` + `meta`) ou fallback tableau brut |
| Hook dropdown | `frontend/src/features/annees-scolaires/hooks/use-toutes-annees-scolaires.ts` | Extraction `items` de la réponse paginée |
| Logique redondante | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | `requireValidation` dans `create()` supprimé (les 2 branches retournaient `OUVERTE`) |
| Formulaire hasUnsavedChanges | `frontend/src/features/annees-scolaires/components/annee-scolaire-form-modal.tsx` | Comparaison avec `initialData` (au lieu de `FORM_INIT`) pour mode édition |

### Migrations exécutées

| Migration | Résultat | Détail |
|-----------|----------|--------|
| 220 — Cohérence Année/Période | ✅ | Backfill 0 lignes, colonnes déjà supprimées, index + trigger créés |
| 221 — Permissions RBAC | ✅ | ADMIN=2, CHEF_ETABLISSEMENT=2 (reouvrir + audit) |
| 222 — Permissions complètes | ✅ | ADMIN=7, CHEF_ETABLISSEMENT=7 (toutes permissions annees:*) |
| 223 — NOT NULL anneeScolaireId | ✅ | Contrainte NOT NULL ajoutée sur notes et bulletins |

### Fichiers créés/modifiés

| Fichier | Action |
|---------|--------|
| `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | `findPaginated()` ajouté + logique `create()` simplifiée |
| `backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts` | Pagination ajoutée (détection page/limit) |
| `frontend/src/features/annees-scolaires/hooks/use-annees-scolaires.ts` | Détection réponse paginée serveur |
| `frontend/src/features/annees-scolaires/hooks/use-toutes-annees-scolaires.ts` | Extraction `items` de réponse paginée |
| `frontend/src/features/annees-scolaires/components/annee-scolaire-form-modal.tsx` | `hasUnsavedChanges` corrigé (mode édition) |
| `scripts/deploy-coherence-annee-periode.sh` | NOUVEAU — Script déploiement migrations 220-223 |
| `backend/database/migrations/220-coherence-annee-periode.sql` | Exécuté ✅ |
| `backend/database/migrations/221-rbac-annees-scolaires.sql` | Exécuté ✅ |
| `backend/database/migrations/222-permissions-completes-annees-scolaires.sql` | Exécuté ✅ |
| `backend/database/migrations/223-not-null-annee-scolaire-id.sql` | Exécuté ✅ |

---

## Corrections post-audit Année Scolaire — Bug service, sélecteur périodes, design system (✅ COMPLET)

> Contexte : Session de continuation. Audit de cohérence globale après les améliorations précédentes.

### Bugs corrigés

| Bug | Fichier | Correction |
|-----|---------|------------|
| **`requireValidation` non déclaré** | `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Suppression du bloc workflow mort dans `create()` (référence fantôme depuis simplification précédente). Les imports `validationWorkflowService` + `getParamBoolean` sont conservés (utilisés dans `cloturer()`) |
| **Sélecteur années limité à 20** | `frontend/src/features/periodes/components/periodes-page.tsx` | Remplacement `useAnneesScolaires()` → `useToutesAnneesScolaires()` pour le dropdown (charge jusqu'à 100 années au lieu de 20) |
| **Classes CSS inconsistentes** | `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | Remplacement classes Tailwind standards (`text-muted-foreground`, `bg-card`, `border-border`) → variables CSS design system (`text-[var(--color-text-muted)]`, `bg-[var(--color-surface)]`, `border-[var(--color-bordure)]`) |

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Bloc `requireValidation` mort supprimé dans `create()` |
| `frontend/src/features/periodes/components/periodes-page.tsx` | `useAnneesScolaires` → `useToutesAnneesScolaires` pour le sélecteur |
| `frontend/src/features/annees-scolaires/components/annee-scolaire-detail-page.tsx` | Classes CSS alignées design system (variables CSS) |

