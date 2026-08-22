/**
 * ==================================
 * eLISAschool - Module Billing — Index des entités
 * ==================================
 * Phase 4.1 — Refonte SaaS
 * Phase B.1 — Refonte SaaS v2 (TransactionLedger, CreditNote)
 * Migration 213 — Refonte Entitlements v3 (plans JSONB, GRATUIT/PAYANT,
 * remises, packs quota, cycles, stratégies expiration, usage unifié)
 */

export { PlanAbonnement, StatutPlan } from './plan-abonnement.entity';
export type { TarificationPlan, QuotasPlan, EntitlementsPlan, EssaiPlan, PalierTarification } from './plan-abonnement.entity';
export { AbonnementClient, StatutAbonnement, CycleFacturation } from './abonnement-client.entity';
export { Facture, StatutFacture } from './facture.entity';
export { LigneFacture, TypeLigneFacture } from './ligne-facture.entity';
export { AbonnementModule } from './abonnement-module.entity';
export { PaiementAbonnement, StatutPaiementAbonnement } from './paiement-abonnement.entity';
export { FeatureFlagTenant } from './feature-flag-tenant.entity';
// Phase B — Refonte SaaS v2
export { TransactionLedger, TypeTransactionLedger, SensEcriture } from './transaction-ledger.entity';
export { CreditNote, StatutCreditNote } from './credit-note.entity';
// Phase 7 Lot A — Refonte SaaS v7 (catalogue modules unifié)
export { ModuleCatalogue, CategorieModule } from './module-catalogue.entity';
// Phase 7 Lot C — Refonte SaaS v7 (groupes SaaS)
export { ModulesGroupe } from './modules-groupe.entity';
export { AbonnementGroupe, StatutAbonnementGroupe, ModeFacturationGroupe, RepartitionFacturation } from './abonnement-groupe.entity';
// Phase 7 Lot D — Refonte SaaS v7 (providers paiement dynamiques)
export { ProviderPaiement, TypeProviderPaiement } from './provider-paiement.entity';
export { ProviderAssignment, ScopeAssignment } from './provider-assignment.entity';
// Phase 7 Lot F — Refonte SaaS v7 (workflow actions critiques)
export { ActionCritique, TypeActionCritique, StatutActionCritique, ACTION_CRITIQUE_EXPIRATION_HEURES, ACTION_CRITIQUE_MAX_TENTATIVES } from './action-critique.entity';
// Migration 210 — Refonte Feature Flags (registre centralisé + audit)
export { FeatureFlagDefinition, CategorieFlag, TypeFlag } from './feature-flag-definition.entity';
export { FeatureFlagHistory, ActionFeatureFlag } from './feature-flag-history.entity';
// Migration 213 — Refonte Entitlements v3
export { CycleFacturationConfig } from './cycle-facturation-config.entity';
export { RemiseAbonnement, TypeRemise, DureeApplicationRemise, CibleRemise } from './remise-abonnement.entity';
// Migration 215 — Refonte Promotions v4 (scope multi-cible, packages, gratuités)
export { Promotion, TypePromotion, ScopePromotion, DureeApplicationPromotion } from './promotion.entity';
export type { ConditionsPromotion, ConfigPromotion } from './promotion.entity';
export { PackagePromotion, TypeRemisePackage } from './package-promotion.entity';
export { PromotionUtilisee } from './promotion-utilisee.entity';
export { PackQuota, DureeValiditePack } from './pack-quota.entity';
export { AbonnementPack } from './abonnement-pack.entity';
export { StrategieExpiration, ComportementPhase } from './strategie-expiration.entity';
export type { PhaseExpiration } from './strategie-expiration.entity';
export { UsageUnifie, SourceUsage } from './usage-unifie.entity';
