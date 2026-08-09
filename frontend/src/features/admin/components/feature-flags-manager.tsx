/**
 * ==================================
 * eLISAschool - Feature Flags Manager
 * ==================================
 * [Phase 3.3] UI de gestion des feature flags par tenant.
 * Permet de visualiser et override les flags pour un établissement.
 * 
 * Endpoints platform : /api/platform/facturation/feature-flags/*
 * - GET  /:etablissementId — liste tous les flags d'un établissement
 * - PUT  /                 — toggle un flag (body: { etablissementId, flagName, enabled })
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import {
    ToggleLeft,
    ToggleRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    Search,
    Building2,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================
// Types
// =============================================

interface FeatureFlag {
    name: string;
    label: string;
    enabled: boolean;
    source: 'plan' | 'tenant_override' | 'default';
    description?: string;
}

interface Etablissement {
    id: string;
    nom: string;
}

interface FeatureFlagsManagerProps {
    etablissementId?: string;
}

// =============================================
// Composant principal
// =============================================

export function FeatureFlagsManager({ etablissementId: propEtabId }: FeatureFlagsManagerProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState<'all' | 'plan' | 'tenant_override' | 'default'>('all');
    const [selectedEtabId, setSelectedEtabId] = useState<string | undefined>(propEtabId);

    // Charger la liste des établissements (pour le sélecteur si pas de prop)
    const { data: etablissements } = useQuery<Etablissement[]>({
        queryKey: ['platform-etablissements-select'],
        queryFn: async () => {
            const res = await apiClient.get<Etablissement[]>('/api/platform/etablissements');
            return res.data ?? [];
        },
        enabled: !propEtabId, // seulement si pas fourni en prop
    });

    const effectiveEtabId = propEtabId || selectedEtabId;

    const { data: flags, isLoading } = useQuery<FeatureFlag[] | undefined>({
        queryKey: ['feature-flags', effectiveEtabId],
        queryFn: async () => {
            if (!effectiveEtabId) return [];
            const res = await apiClient.get<FeatureFlag[]>(
                `/api/platform/facturation/feature-flags/${effectiveEtabId}`
            );
            return res.data ?? [];
        },
        enabled: !!effectiveEtabId,
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ flagName, enabled }: { flagName: string; enabled: boolean }) => {
            if (!effectiveEtabId) throw new Error('etablissementId requis');
            await apiClient.put('/api/platform/facturation/feature-flags', {
                etablissementId: effectiveEtabId,
                flagName,
                enabled,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            toast.success(t('featureFlags.toastToggleSuccess', 'Flag mis à jour'));
        },
        onError: () => {
            toast.error(t('featureFlags.toastToggleError', 'Erreur lors de la mise à jour du flag'));
        },
    });

    const filteredFlags = flags?.filter((f) => {
        const matchSearch = !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.name.toLowerCase().includes(search.toLowerCase());
        const matchSource = filterSource === 'all' || f.source === filterSource;
        return matchSearch && matchSource;
    });

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5" style={{ color: 'var(--color-dominant-600)' }} />
                    {t('featureFlags.titre', 'Feature Flags')}
                    {effectiveEtabId && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-600)' }}>
                            {t('featureFlags.overrideTenant', 'Override tenant')}
                        </span>
                    )}
                </h2>
            </div>

            {/* Sélecteur d'établissement (si pas fourni en prop) */}
            {!propEtabId && (
                <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-[var(--color-texte-muted)]" />
                    <select
                        value={selectedEtabId || ''}
                        onChange={(e) => setSelectedEtabId(e.target.value || undefined)}
                        className="flex-1 max-w-xs px-3 py-2 text-sm rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                    >
                        <option value="">{t('featureFlags.selectionnerEtab', 'Sélectionner un établissement')}</option>
                        {etablissements?.map((etab) => (
                            <option key={etab.id} value={etab.id}>{etab.nom}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-texte-muted)]" />
                    <input
                        type="text"
                        placeholder={t('featureFlags.rechercher', 'Rechercher un flag...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                    />
                </div>
                <div className="flex gap-1">
                    {(['all', 'plan', 'tenant_override', 'default'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterSource(s)}
                            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                filterSource === s
                                    ? 'text-white'
                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)]/80'
                            }`}
                            style={filterSource === s ? { backgroundColor: 'var(--color-dominant-600)' } : undefined}
                        >
                            {s === 'all' ? t('featureFlags.tous', 'Tous') : s === 'plan' ? t('featureFlags.plan', 'Plan') : s === 'tenant_override' ? t('featureFlags.override', 'Override') : t('featureFlags.defaut', 'Défaut')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste des flags */}
            {!effectiveEtabId ? (
                <div className="text-center py-8 text-[var(--color-texte-muted)] text-sm flex flex-col items-center gap-2">
                    <Building2 className="w-8 h-8 opacity-40" />
                    {t('featureFlags.selectionnerEtabMessage', 'Sélectionnez un établissement pour voir ses feature flags')}
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : !filteredFlags?.length ? (
                <div className="text-center py-8 text-[var(--color-texte-muted)] text-sm">
                    {t('featureFlags.aucunFlag', 'Aucun feature flag trouvé')}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredFlags.map((flag) => (
                        <div
                            key={flag.name}
                            className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                        >
                            <div className="flex items-center gap-3">
                                {/* Toggle */}
                                <button
                                    onClick={() =>
                                        toggleMutation.mutate({
                                            flagName: flag.name,
                                            enabled: !flag.enabled,
                                        })
                                    }
                                    disabled={toggleMutation.isPending}
                                    className="flex-shrink-0"
                                >
                                    {flag.enabled ? (
                                        <ToggleRight className="w-8 h-8 text-[var(--color-success-500)]" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-[var(--color-texte-muted)]" />
                                    )}
                                </button>

                                {/* Info */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{flag.label}</span>
                                        <SourceBadge source={flag.source} />
                                    </div>
                                    {flag.description && (
                                        <p className="text-xs text-[var(--color-texte-muted)] mt-0.5">
                                            {flag.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-[var(--color-texte-muted)] font-mono">
                                        {flag.name}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {flag.enabled ? (
                                    <CheckCircle className="w-4 h-4 text-[var(--color-success-500)]" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-[var(--color-texte-muted)]" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================
// Helpers
// =============================================

function SourceBadge({ source }: { source: string }) {
    const styles: Record<string, string> = {
        plan: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        tenant_override: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };
    const labels: Record<string, string> = {
        plan: 'Plan',
        tenant_override: 'Override',
        default: 'Défaut',
    };

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[source] || styles.default}`}>
            {labels[source] || source}
        </span>
    );
}

export default FeatureFlagsManager;
