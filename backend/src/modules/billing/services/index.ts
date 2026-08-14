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
export { DunningService } from './dunning.service';
export { LedgerService } from './ledger.service';
export { FacturePdfService } from './facture-pdf.service';
export type { FacturePdfData } from './facture-pdf.service';
export { FacturationGroupeService } from './facturation-groupe.service';
export type { FacturationGroupeResult, ConsommationMembre } from './facturation-groupe.service';
export { ModeleFacturationGroupe } from './facturation-groupe.service';
// Phase 3.1 — Refonte SaaS v5
export { TrancheConfigService } from './tranche-config.service';
export type { ResolvedTranche } from './tranche-config.service';
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
