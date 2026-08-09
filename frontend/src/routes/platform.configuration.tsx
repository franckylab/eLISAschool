/**
 * ==================================
 * eLISAschool - Platform Configuration
 * ==================================
 * Configuration applicative globale (portée plateforme)
 * Phase 1.2 — Refonte SaaS
 * Phase E.1 — Refonte SaaS v2 (interface complète)
 * Phase v6 — Migration CSS vars + i18n complet
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureFlagsManager } from '@/features/admin/components/feature-flags-manager';
import {
    Settings,
    Globe,
    Shield,
    Bell,
    Database,
    Save,
    RefreshCw,
    Server,
    ToggleLeft,
} from 'lucide-react';

interface Parametre {
    id: string;
    cle: string;
    valeur: string;
    typeValeur: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    categorie: string;
    module?: string;
    description?: string;
    modifiableRuntime: boolean;
}

function PlatformConfigurationPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState('SYSTEME');
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [showFeatureFlags, setShowFeatureFlags] = useState(false);

    const categories = [
        { key: 'SYSTEME', label: t('configuration.categories.systeme'), icon: Server, color: 'var(--color-info-600)' },
        { key: 'SECURITE', label: t('configuration.categories.securite'), icon: Shield, color: 'var(--color-danger-600)' },
        { key: 'NOTIFICATION', label: t('configuration.categories.notifications'), icon: Bell, color: 'var(--color-warning-600)' },
        { key: 'REGIONAL', label: t('configuration.categories.regional'), icon: Globe, color: 'var(--color-success-600)' },
        { key: 'MODULE', label: t('configuration.categories.modules'), icon: Database, color: '#9333ea' },
        { key: 'CUSTOM', label: t('configuration.categories.personnalise'), icon: Settings, color: 'var(--color-texte-muted)' },
    ];

    const { data: parametres, isLoading } = useQuery<Parametre[]>({
        queryKey: ['platform-config', selectedCategory],
        queryFn: async () => {
            const res = await apiClient.get<Parametre[]>(
                `/api/platform/configuration/parametres/categorie/${selectedCategory}`
            );
            return res.data ?? [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async ({ cle, valeur }: { cle: string; valeur: string }) => {
            await apiClient.put(`/api/platform/configuration/parametres/${cle}`, { valeur });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-config'] });
        },
    });

    const handleSave = (cle: string) => {
        const valeur = editValues[cle];
        if (valeur !== undefined) {
            saveMutation.mutate({ cle, valeur });
        }
    };

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info-100)' }}>
                        <Settings className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-info-600)' }} />
                    </div>
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('configuration.titre')}</h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {t('configuration.sousTitre')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-config'] })}
                    className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] border border-[var(--color-bordure)] rounded-lg transition-colors bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-texte)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                >
                    <RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                    {t('configuration.actualiser')}
                </button>
            </div>

            {/* Toggle Feature Flags */}
            <div className="flex items-center gap-[var(--gap-sm)]">
                <button
                    onClick={() => setShowFeatureFlags(v => !v)}
                    className={`flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg font-medium transition-colors ${
                        showFeatureFlags ? '' : 'border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', ...(showFeatureFlags
                        ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' }
                        : { color: 'var(--color-texte)' }
                    ) }}
                    aria-pressed={showFeatureFlags}
                >
                    <ToggleLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                    {t('configuration.featureFlags')}
                </button>
            </div>

            {/* Feature Flags — section dédiée (Phase 3.3) */}
            {showFeatureFlags && <FeatureFlagsManager />}

            {/* Categories tabs */}
            {!showFeatureFlags && (
            <div className="flex gap-[var(--gap-sm)] overflow-x-auto pb-2">
                {categories.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg font-medium transition-colors whitespace-nowrap ${
                                isActive ? '' : 'border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', ...(isActive
                                ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' }
                                : { color: 'var(--color-texte)' }
                            ) }}
                        >
                            <cat.icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: isActive ? '#fff' : cat.color }} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>
            )}

            {/* Parameters list */}
            {!showFeatureFlags && (
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                {isLoading ? (
                    <div className="p-8 text-center text-[var(--color-texte-muted)]">{t('configuration.chargement')}</div>
                ) : !parametres?.length ? (
                    <div className="p-8 text-center text-[var(--color-texte-muted)]">
                        {t('configuration.aucunParametre')}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-bordure)]">
                        {parametres.map((param) => (
                            <div key={param.id} className="p-[var(--space-md)] space-y-[var(--space-sm)]">
                                <div className="flex items-start justify-between gap-[var(--gap-md)]">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-[var(--gap-sm)]">
                                            <code className="font-mono font-semibold text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>{param.cle}</code>
                                            <span className="text-xs px-2 py-0.5 rounded text-[var(--color-texte-muted)]" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                                                {param.typeValeur}
                                            </span>
                                            {param.module && (
                                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-info-50)', color: '#7c3aed' }}>
                                                    {param.module}
                                                </span>
                                            )}
                                        </div>
                                        {param.description && (
                                            <p className="text-[var(--color-texte-muted)] mt-1" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{param.description}</p>
                                        )}
                                    </div>
                                </div>
                                {param.modifiableRuntime && (
                                    <div className="flex items-center gap-[var(--gap-sm)]">
                                        {param.typeValeur === 'BOOLEAN' ? (
                                            <select
                                                value={editValues[param.cle] ?? param.valeur}
                                                onChange={(e) => setEditValues({ ...editValues, [param.cle]: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] text-[var(--color-texte)]"
                                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                            >
                                                <option value="true">{t('configuration.oui', 'Oui')}</option>
                                                <option value="false">{t('configuration.non', 'Non')}</option>
                                            </select>
                                        ) : param.typeValeur === 'JSON' ? (
                                            <textarea
                                                value={editValues[param.cle] ?? param.valeur}
                                                onChange={(e) => setEditValues({ ...editValues, [param.cle]: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border border-[var(--color-bordure)] rounded-md font-mono min-h-[80px] bg-[var(--color-surface)] text-[var(--color-texte)]"
                                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                type={param.typeValeur === 'NUMBER' ? 'number' : 'text'}
                                                value={editValues[param.cle] ?? param.valeur}
                                                onChange={(e) => setEditValues({ ...editValues, [param.cle]: e.target.value })}
                                                className="flex-1 px-3 py-1.5 border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] text-[var(--color-texte)]"
                                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                            />
                                        )}
                                        <button
                                            onClick={() => handleSave(param.cle)}
                                            disabled={saveMutation.isPending}
                                            className="flex items-center gap-[var(--gap-xs)] px-[var(--space-md)] py-[var(--space-xs)] rounded-md hover:opacity-90 disabled:opacity-50"
                                            style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                        >
                                            <Save className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                            {t('configuration.sauver')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}

export const Route = createFileRoute('/platform/configuration')({
    component: PlatformConfigurationPage,
});
