/**
 * ==================================
 * eLISAschool - Module Billing
 * ==================================
 * 
 * Framework Abonnements & Facturation pour la plateforme SaaS.
 * 
 * Phase 4 — Refonte SaaS
 * 
 * Entités:
 * - PlanAbonnement: plans tarifaires (Starter, Pro, Enterprise)
 * - TrancheEleves: tranches de pricing par nombre d'élèves
 * - AbonnementClient: souscription d'un établissement
 * - Facture / LigneFacture: facturation détaillée
 * - ModuleOptionnel / AbonnementModule: modules payants en supplément
 * - PaiementAbonnement: paiements reçus
 * - QuotaUtilisation: suivi consommation quotas
 * - FeatureFlagTenant: overrides feature flags par tenant
 * 
 * Services:
 * - FacturationService: calcul tranches, génération factures, prorata
 * - FeatureFlagService: résolution cascade (plan → tenant → global)
 * - QuotaService: vérification/enforcement quotas + middleware
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
 * - Expiration essai (quotidien 08h00)
 * 
 * Routes:
 * - /api/platform/facturation/* (SUPER_ADMIN)
 * - /api/billing/* (client établissement)
 */

export { platformBillingRouter, clientBillingRouter } from './controllers/billing.controller';
export * from './entities';
export * from './services';
export { initBillingCronJobs } from './cron-jobs';
