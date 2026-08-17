/**
 * ==================================
 * eLISAschool - Platform UI — Barrel Export
 * ==================================
 * Composants partagés pour le panel admin plateforme.
 * Pattern canonique : CSS vars eLISAschool (pas de tokens shadcn).
 *
 * Phase P1 — Restructuration Panel Admin v3
 */

// Cartes
export { PlatformCard, PlatformCardHeader, PlatformCardGrid } from './PlatformCard';
export type { PlatformCardProps, PlatformCardHeaderProps, PlatformCardGridProps, CardVariant, CardSize } from './PlatformCard';

// Statistiques
export { PlatformStatCard } from './PlatformStatCard';
export type { PlatformStatCardProps, StatTone, StatTrend } from './PlatformStatCard';

// Layout page détail
export { DetailPageLayout, useDetailPage } from './DetailPageLayout';
export type { DetailPageLayoutProps, DetailTab, UseDetailPageOptions } from './DetailPageLayout';

// Sections & clés-valeurs
export { PlatformSection, PlatformKeyValue } from './PlatformSection';
export type { PlatformSectionProps, PlatformKeyValueProps, PlatformKeyValueItem } from './PlatformSection';

// Feedback (badges, confirmation, état vide)
export { StatusBadge, ConfirmAction, EmptyState } from './PlatformFeedback';
export type { StatusBadgeProps, ConfirmActionProps, EmptyStateProps } from './PlatformFeedback';
