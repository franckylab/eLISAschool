/**
 * ==================================
 * eLISAschool - Module Billing — Index des entités
 * ==================================
 * Phase 4.1 — Refonte SaaS
 * Phase B.1 — Refonte SaaS v2 (UsageMeter, TransactionLedger, CreditNote)
 */

export { PlanAbonnement, StatutPlan, ModeFacturationTranches } from './plan-abonnement.entity';
export { TrancheEleves } from './tranche-eleves.entity';
export { TrancheSupplement } from './tranche-supplement.entity';
export { AbonnementClient, StatutAbonnement, CycleFacturation } from './abonnement-client.entity';
export { Facture, StatutFacture } from './facture.entity';
export { LigneFacture, TypeLigneFacture } from './ligne-facture.entity';
export { ModuleOptionnel } from './module-optionnel.entity';
export { AbonnementModule } from './abonnement-module.entity';
export { PaiementAbonnement, StatutPaiementAbonnement } from './paiement-abonnement.entity';
export { QuotaUtilisation } from './quota-utilisation.entity';
export { FeatureFlagTenant } from './feature-flag-tenant.entity';
// Phase B — Refonte SaaS v2
export { UsageMeter } from './usage-meter.entity';
export { TransactionLedger, TypeTransactionLedger, SensEcriture } from './transaction-ledger.entity';
export { CreditNote, StatutCreditNote } from './credit-note.entity';
// Phase 7 Lot A — Refonte SaaS v7 (catalogue modules unifié)
export { ModuleCatalogue, CategorieModule } from './module-catalogue.entity';
// Phase 7 Lot C — Refonte SaaS v7 (groupes SaaS)
export { ModulesGroupe } from './modules-groupe.entity';
export { TrancheGroupe } from './tranche-groupe.entity';
export { AbonnementGroupe, StatutAbonnementGroupe, ModeFacturationGroupe, RepartitionFacturation } from './abonnement-groupe.entity';
// Phase 7 Lot D — Refonte SaaS v7 (providers paiement dynamiques)
export { ProviderPaiement, TypeProviderPaiement } from './provider-paiement.entity';
export { ProviderAssignment, ScopeAssignment } from './provider-assignment.entity';
// Phase 7 Lot F — Refonte SaaS v7 (workflow actions critiques)
export { ActionCritique, TypeActionCritique, StatutActionCritique, ACTION_CRITIQUE_EXPIRATION_HEURES, ACTION_CRITIQUE_MAX_TENTATIVES } from './action-critique.entity';
// Migration 210 — Refonte Feature Flags (registre centralisé + audit)
export { FeatureFlagDefinition, CategorieFlag, TypeFlag } from './feature-flag-definition.entity';
export { FeatureFlagHistory, ActionFeatureFlag } from './feature-flag-history.entity';
