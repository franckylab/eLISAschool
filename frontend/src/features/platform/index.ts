/**
 * ==================================
 * eLISAschool - Platform Feature Barrel Export
 * ==================================
 * Point d'entrée unique pour les composants, hooks et utils
 * du Control Plane (plateforme SUPER_ADMIN).
 *
 * Version: 1.0.0 — Refonte Platform Audit V3
 * Auteur: franck arlos chendjou
 */

// =============================================
// Composants — Dashboard
// =============================================
export { PlatformHealth } from './components/platform-health';
export { TenantActivity } from './components/tenant-activity';
export { PlatformDashboardSkeleton, SkeletonBlock, SkeletonKpiCard, SkeletonTableRow, SkeletonSection } from './components/platform-skeleton';

// =============================================
// Composants — Établissements
// =============================================
export { PlatformEtablissementDetailPage } from './components/platform-etablissement-detail-page';
export { SanteEtablissement } from './components/sante-etablissement';
export { EtablissementFormModal } from './components/etablissement-form-modal';
export type { SanteEtablissementResult, CategorieSante, SanteEtablissementProps } from './components/sante-etablissement';

// =============================================
// Composants — Établissement Detail (tabs)
// =============================================
export { IdentiteTab, SanteTab, ActiviteTab, FinancesTab, ConfigurationTab, UtilisateursTab, JournalTab } from './components/etablissement-detail';
export { SectionCard, InfoGrid, InfoField, ActionButton, ConfigBadge, TabSkeleton, getScoreColor, getTauxColor, formatRelativeTime } from './components/etablissement-detail';

// =============================================
// Composants — Billing & Facturation
// =============================================
export { PlanFormModal } from './components/plan-form-modal';
export { CycleFormModal } from './components/cycle-form-modal';
export { StrategieFormModal } from './components/strategie-form-modal';
export { PackFormModal } from './components/pack-form-modal';
export { AbonnementDetail } from './components/abonnement-detail';
export { UsageMetersDashboard } from './components/usage-meters-dashboard';
export { RevenusDashboard } from './components/revenus-dashboard';

// =============================================
// Composants — Groupes SaaS
// =============================================
export { default as GroupesSaaSPage } from './components/groupes-saas-page';

// =============================================
// Composants — Approbations
// =============================================
export { default as ApprobationsPage } from './components/approbations-page';

// =============================================
// Composants — Monitoring
// =============================================
export {
    HealthChecksSection,
    MetricsCards,
    GoldenSignalsSection,
    AlertesSection,
    AlertRulesSection,
    NoisyNeighborSection,
    RealtimeSection,
    ExportButton,
} from './components/monitoring-sections';
export type {
    HealthCheck,
    AggregatedMetrics,
    Alert,
    GoldenSignals,
} from './components/monitoring-sections';
export { ModuleAnalyticsDashboard } from './components/module-analytics-dashboard';

// =============================================
// Composants — Feature Flags
// =============================================
export { FeatureFlagDefinitionForm } from './components/feature-flag-definition-form';
export { FeatureFlagsMatrix } from './components/feature-flags-matrix';
export { FeatureFlagsAuditLog } from './components/feature-flags-audit-log';

// =============================================
// Composants — Cascade & Providers
// =============================================
export { ParametresCascadePage } from './components/parametres-cascade-page';
export { default as ProvidersPaiementPage } from './components/providers-paiement-page';

// =============================================
// Composants — Rôles & Utilisateurs platform
// =============================================
export { PlatformRolesPage } from './components/platform-roles-page';
export { PlatformRoleDetailPage } from './components/platform-role-detail-page';
export { PlatformUsersPage } from './components/platform-users-page';
export { PlatformUserDetailPage } from './components/platform-user-detail-page';
export { RoleEditModal } from './components/role-edit-modal';

// =============================================
// Hooks
// =============================================
export {
    useEtablissementDetail,
    useDesactiverEtablissement,
    useActiverEtablissement,
    useUploadLogo,
    useSupprimerLogo,
    useChangerPlan,
    useRecalculerSante,
} from './hooks/use-etablissement-detail';

export {
    usePlatformRoles,
    usePlatformRoleDetail,
    useCreatePlatformRole,
    useUpdatePlatformRole,
    useDeletePlatformRole,
} from './hooks/use-platform-roles';

export {
    usePlatformUsers,
    usePlatformUserDetail,
} from './hooks/use-platform-users';

export {
    usePlans,
    useAbonnements,
    useFactures,
    useAcknowledgeAlert,
} from './hooks/use-billing';

export type {
    Plan,
    Abonnement,
    AbonnementPlan,
    Facture,
} from './hooks/use-billing';

export {
    useListerActionsCritiques,
    useGetActionCritique,
    useStatistiquesActionsCritiques,
    useDemanderActionCritique,
    useApprouverActionCritique,
    useRejeterActionCritique,
} from './hooks/use-actions-critiques';

export type {
    TypeActionCritique,
    StatutActionCritique,
    ActionCritique,
} from './hooks/use-actions-critiques';

// =============================================
// Utils
// =============================================
export {
    genererPdfTableau,
    exportEtablissementsPdf,
    exportUtilisateursPdf,
    exportFacturationPdf,
} from './utils/export-pdf-platforme';

// =============================================
// Configuration
// =============================================
export {
    useParametresPlatforme,
} from './configuration/hooks/useParametresPlatforme';
