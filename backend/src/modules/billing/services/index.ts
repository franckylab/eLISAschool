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
export { ModuleResolutionService, moduleResolutionService } from './module-resolution.service';
export type { ModuleResolu, SourceModule } from './module-resolution.service';
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
