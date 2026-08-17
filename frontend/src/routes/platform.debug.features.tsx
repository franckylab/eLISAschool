/**
 * ==================================
 * eLISAschool - Debug Feature Toggles
 * ==================================
 * Page de debug pour visualiser et tester les feature toggles
 * par établissement. Refonte v3 — migration 213.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { FlaskConical, Search, Loader2, CheckCircle2, XCircle, ToggleRight, ToggleLeft } from 'lucide-react';

export const Route = createFileRoute('/platform/debug/features')({
    component: DebugFeaturesPage,
});

interface FeatureFlagDefinition {
    id: string;
    cle: string;
    label: string;
    description: string | null;
    categorie: string;
    categorieCommerciale?: string;
    type: string;
    valeurDefaut: boolean;
    planMinimal: string | null;
    rolloutPercentage: number;
    estSysteme: boolean;
    estActif: boolean;
}

interface FeatureResolution {
    flag: FeatureFlagDefinition;
    resolved: boolean;
    reason: string;
}

function DebugFeaturesPage() {
    const { t } = useTranslation('admin');
    const [etablissementId, setEtablissementId] = useState('');
    const [searched, setSearched] = useState(false);

    // Charger toutes les définitions de feature flags
    const { data: flagsData, isLoading: flagsLoading } = useQuery<{ success: boolean; data: FeatureFlagDefinition[] }>({
        queryKey: ['debug-flags-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<any>('/api/platform/feature-flags');
            return (res as any).data ?? res;
        },
    });

    // Charger la résolution pour un établissement donné
    const { data: resolvedData, isLoading: resolvedLoading } = useQuery<{ success: boolean; data: FeatureResolution[] }>({
        queryKey: ['debug-flags-resolved', etablissementId],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (etablissementId.trim()) params.etablissementId = etablissementId.trim();
            const res = await apiClient.get('/api/platform/feature-flags/resolve', params);
            return (res as any).data ?? res;
        },
        enabled: searched && !!etablissementId,
        retry: false,
    });

    const flags = flagsData?.data ?? [];
    const resolved = resolvedData?.data ?? [];

    const handleSearch = () => {
        if (etablissementId.trim()) setSearched(true);
    };

    return (
        <div className="space-y-[var(--space-md)]">
            {/* Search */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-5 h-5 text-[var(--color-danger-500)]" />
                    <h2 className="font-semibold" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        Debug Feature Toggles
                    </h2>
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={etablissementId}
                        onChange={(e) => { setEtablissementId(e.target.value); setSearched(false); }}
                        placeholder="Établissement ID pour résoudre les toggles"
                        className="flex-1 px-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!etablissementId.trim() || resolvedLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-danger-600)] rounded-md hover:bg-[var(--color-danger-700)] disabled:opacity-50"
                    >
                        {resolvedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Résoudre
                    </button>
                </div>
            </div>

            {/* Flags table */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                        Définitions ({flags.length})
                    </h3>
                    {flagsLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--color-texte-muted)]" />}
                </div>

                {flags.length === 0 && !flagsLoading ? (
                    <div className="p-8 text-center text-sm text-[var(--color-texte-muted)]">
                        Aucune définition de feature flag trouvée
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Clé</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Label</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Catégorie</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Défaut</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Rollout</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Plan min.</th>
                                    {searched && <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Résolu</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-bordure)]">
                                {flags.map((flag) => {
                                    const resolution = resolved.find((r) => r.flag.cle === flag.cle);
                                    return (
                                        <tr key={flag.id} className="hover:bg-[var(--color-surface-hover)]">
                                            <td className="px-4 py-2 font-mono text-xs">{flag.cle}</td>
                                            <td className="px-4 py-2">{flag.label}</td>
                                            <td className="px-4 py-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]">
                                                    {flag.categorieCommerciale ?? flag.categorie}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {flag.valeurDefaut
                                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                    : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                                            </td>
                                            <td className="px-4 py-2 text-center text-xs">{flag.rolloutPercentage}%</td>
                                            <td className="px-4 py-2 text-center text-xs font-mono">{flag.planMinimal ?? '—'}</td>
                                            {searched && (
                                                <td className="px-4 py-2 text-center">
                                                    {resolution ? (
                                                        resolution.resolved
                                                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                            : <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-xs text-[var(--color-texte-muted)]">—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Resolution details */}
            {searched && resolved.length > 0 && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                        <h3 className="text-sm font-semibold">Détail résolution — {etablissementId.slice(0, 8)}…</h3>
                    </div>
                    <div className="divide-y divide-[var(--color-bordure)]">
                        {resolved.map((r) => (
                            <div key={r.flag.cle} className="px-4 py-2 flex items-center gap-3">
                                {r.resolved
                                    ? <ToggleRight className="w-5 h-5 text-green-500" />
                                    : <ToggleLeft className="w-5 h-5 text-red-400" />}
                                <div className="flex-1">
                                    <span className="text-sm font-medium">{r.flag.label}</span>
                                    <span className="text-xs text-[var(--color-texte-muted)] ml-2">({r.flag.cle})</span>
                                </div>
                                <span className="text-xs text-[var(--color-texte-muted)]">{r.reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!searched && (
                <div className="text-center py-12 text-[var(--color-texte-muted)]">
                    <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Saisissez un établissement ID pour voir la résolution des toggles</p>
                </div>
            )}
        </div>
    );
}
