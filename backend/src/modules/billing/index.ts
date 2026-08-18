/**
 * ==================================
 * eLISAschool - Module Billing
 * ==================================
 * 
 * Framework Abonnements & Facturation pour la plateforme SaaS.
 * 
 * Phase 4 — Refonte SaaS | Refonte v3 (migration 213) : plans JSONB,
 * catégorisation GRATUIT/PAYANT, commerce configurable (remises, packs, cycles).
 * 
 * Entités:
 * - PlanAbonnement: plans tarifaires pilotés par JSONB (tarification, quotas, entitlements)
 * - AbonnementClient: souscription d'un établissement
 * - Facture / LigneFacture: facturation détaillée
 * - ModuleCatalogue / AbonnementModule: catalogue unique + modules en supplément
 * - PaiementAbonnement: paiements reçus
 * - UsageUnifie: suivi consommation quotas et compteurs (fusion quota_utilisation + usage_meters)
 * - CycleFacturationConfig / RemiseAbonnement / PackQuota / StrategieExpiration: commerce v3
 * - FeatureFlagTenant: overrides feature flags par tenant
 * 
 * Services:
 * - FacturationService: formule v3 (prixBase + prix/élève × coefCycle − remises + packs)
 * - EntitlementService: cascade d'accès v3 (critique → phase expiration → plan+packs → override)
 * - FeatureFlagService: résolution cascade (plan → tenant → global)
 * - QuotaService: vérification/enforcement quotas (usage_unifie + packs) + middleware
 * - DunningService: relances automatiques (3/7/15/30 jours)
 * - LedgerService: journal comptable OHADA double entrée
 * - FacturePdfService: préparation données export PDF
 * - FacturationGroupeService: facturation groupes (3 modèles)
 * 
 * Cron Jobs:
 * - Renouvellement auto (quotidien 00h00)
 * - Génération factures mensuelles (1er du mois)
 * - Dunning check (quotidien 06h00)
 * - Alerte quota (toutes les 6h)
 * - Contrôle quotas unifiés (quotidien 02h00)
 * - Expiration essai (quotidien 08h00)
 * 
 * Routes:
 * - /api/platform/facturation/* (SUPER_ADMIN)
 * - /api/billing/* (client établissement)
 */

export { platformBillingRouter, clientBillingRouter } from './controllers/billing.controller';
export { platformPromotionRouter, clientPromotionRouter } from './controllers/promotions.controller';
export * from './entities';
export * from './services';
export { initBillingCronJobs } from './cron-jobs';
