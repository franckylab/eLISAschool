/**
 * ==================================
 * eLISAschool - Module Billing — Index des services
 * ==================================
 * Phase 4 — Refonte SaaS
 */

export { FacturationService } from './facturation.service';
export type { CalculFactureResult } from './facturation.service';
export { FeatureFlagService } from './feature-flags.service';
export { QuotaService, requireQuota } from './quota.service';
export type { EtatQuota } from './quota.service';
export { DunningService } from './dunning.service';
export { LedgerService } from './ledger.service';
export { FacturePdfService } from './facture-pdf.service';
export type { FacturePdfData } from './facture-pdf.service';
export { FacturationGroupeService } from './facturation-groupe.service';
export type { FacturationGroupeResult, ConsommationMembre } from './facturation-groupe.service';
export { ModeleFacturationGroupe } from './facturation-groupe.service';
// TrancheConfigService supprimé (Refonte v3 — tarification prix/élève + franchise)
// ModuleResolutionService supprimé (fusion P0.1) — utiliser EntitlementService
// Refonte SaaS — Unification Modules (migration 200)
export { EntitlementService, entitlementService } from './entitlement.service';
export type { EntitlementResult, EntitlementBatchResult, EntitlementSource, EntitlementRaison } from './entitlement.service';
// Phase 4.2 — Alertes quotas
export { QuotaAlertService, quotaAlertService } from './quota-alert.service';
// Phase 7 Lot F — Refonte SaaS v7 (workflow actions critiques)
export { ActionCritiqueService, actionCritiqueService } from './action-critique.service';
export type {
    DemanderActionCritiqueDTO,
    ApprouverActionCritiqueDTO,
    RejeterActionCritiqueDTO,
    ListerActionsCritiquesFilters,
    ActionsCritiquesListeResult,
} from './action-critique.service';
// Migration 210 — Refonte Feature Flags (registre centralisé)
export { FeatureFlagDefinitionService, featureFlagDefinitionService } from './feature-flag-definition.service';
export type { CreerDefinitionDto, ModifierDefinitionDto, DefinitionAvecMetadata } from './feature-flag-definition.service';
// Migration 213 — Refonte Entitlements v3 (commerce configurable)
export { RemiseService, remiseService } from './remise.service';
export type { ContexteApplicationRemise, ResultatApplicationRemise } from './remise.service';
export { PackQuotaService, packQuotaService } from './pack-quota.service';
export type { QuotaEffectifResult } from './pack-quota.service';
export { CycleFacturationService, cycleFacturationService } from './cycle-facturation.service';
export { StrategieExpirationService, strategieExpirationService } from './strategie-expiration.service';
// Migration 216 — Refonte Promotions v4 (multi-scopes, bundles, gratuités)
export { PromotionService, promotionService } from './promotion.service';
export type { ContextePromotion, ResultatCascadePromotions } from './promotion.service';
