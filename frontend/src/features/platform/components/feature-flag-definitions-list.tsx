/**
 * ==================================
 * eLISAschool - Liste des définitions de Feature Flags
 * ==================================
 * Composant partagé pour afficher la liste des définitions de feature flags.
 * Extrait de platform.fonctionnalites.tsx pour éliminer la redondance.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// =============================================
// Types
// =============================================

export interface FeatureFlagDefinition {
    id: string;
    cle: string;
    label: string;
    description: string | null;
    categorie: string;
    type: string;
    valeurDefaut: boolean;
    planMinimal: string | null;
    rolloutPercentage: number;
    segments: Array<{ champ: string; operateur: string; valeur: string }>;
    estSysteme: boolean;
    estActif: boolean;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FeatureFlagDefinitionsListProps {
    definitions: FeatureFlagDefinition[];
    isLoading: boolean;
    onEdit: (def: FeatureFlagDefinition) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, estActif: boolean) => void;
}

// =============================================
// Catégorie badge colors (CSS vars)
// =============================================

const categorieColors: Record<string, string> = {
    general: 'bg-[color-mix(in_srgb,var(--color-info-500)_10%,transparent)] text-[var(--color-info-600)]',
    billing: 'bg-[color-mix(in_srgb,var(--color-success-500)_10%,transparent)] text-[var(--color-success-600)]',
    integration: 'bg-[color-mix(in_srgb,var(--color-accent-500)_10%,transparent)] text-[var(--color-accent-600)]',
    security: 'bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)] text-[var(--color-warning-600)]',
    ux: 'bg-[color-mix(in_srgb,var(--color-accent-500)_10%,transparent)] text-[var(--color-accent-600)]',
    pedagogie: 'bg-[color-mix(in_srgb,var(--color-dominant-500)_10%,transparent)] text-[var(--color-dominant-600)]',
};

const FALLBACK_BADGE = 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]';

// =============================================
// Composant
// =============================================

export function FeatureFlagDefinitionsList({
    definitions,
    isLoading,
    onEdit,
    onDelete,
    onToggleActive,
}: FeatureFlagDefinitionsListProps) {
    const { t } = useTranslation('admin');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-dominant-600)]" />
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {(definitions ?? []).map((def) => (
                <div
                    key={def.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Status indicator */}
                        <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                def.estActif
                                    ? 'bg-[var(--color-success-500)]'
                                    : 'bg-[var(--color-danger-500)]'
                            }`}
                        />

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{def.label}</span>
                                <code className="text-xs px-1.5 py-0.5 bg-[var(--color-surface-hover)] rounded font-mono">
                                    {def.cle}
                                </code>
                                {def.estSysteme && (
                                    <span className="text-xs px-1.5 py-0.5 bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)] text-[var(--color-warning-600)] rounded">
                                        {t('featureFlags.systeme', 'Système')}
                                    </span>
                                )}
                            </div>
                            {def.description && (
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                                    {def.description}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                        categorieColors[def.categorie] || FALLBACK_BADGE
                                    }`}
                                >
                                    {def.categorie}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {def.type}
                                </span>
                                {def.rolloutPercentage < 100 && (
                                    <span className="text-xs text-[var(--color-info-600)]">
                                        Rollout: {def.rolloutPercentage}%
                                    </span>
                                )}
                                {def.expiresAt && (
                                    <span
                                        className={`text-xs ${
                                            new Date(def.expiresAt) < new Date()
                                                ? 'text-[var(--color-danger-600)]'
                                                : 'text-[var(--color-text-muted)]'
                                        }`}
                                    >
                                        Expire:{' '}
                                        {new Date(def.expiresAt).toLocaleDateString('fr-FR')}
                                    </span>
                                )}
                                {def.planMinimal && (
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        Plan min: {def.planMinimal}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            type="button"
                            onClick={() => onToggleActive(def.id, def.estActif)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                def.estActif
                                    ? 'border-[var(--color-success-300)] text-[var(--color-success-600)] hover:bg-[color-mix(in_srgb,var(--color-success-500)_5%,transparent)]'
                                    : 'border-[var(--color-danger-300)] text-[var(--color-danger-600)] hover:bg-[color-mix(in_srgb,var(--color-danger-500)_5%,transparent)]'
                            }`}
                        >
                            {def.estActif
                                ? t('common.active', 'Actif')
                                : t('common.inactive', 'Inactif')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(def)}
                            className="px-3 py-1.5 text-xs rounded-lg border hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                            {t('common.edit', 'Modifier')}
                        </button>
                        {!def.estSysteme && (
                            <button
                                type="button"
                                onClick={() => onDelete(def.id)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-danger-300)] text-[var(--color-danger-600)] hover:bg-[color-mix(in_srgb,var(--color-danger-500)_5%,transparent)] transition-colors"
                            >
                                {t('common.delete', 'Supprimer')}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
