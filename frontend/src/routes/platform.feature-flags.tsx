/**
 * ==================================
 * eLISAschool - Platform Feature Flags Dashboard
 * ==================================
 * 
 * Dashboard de gestion des feature flags :
 * - Onglet Définitions : CRUD des FeatureFlagDefinition
 * - Onglet Matrice : Établissements × Flags (toggle rapide)
 * - Onglet Audit : Historique des toggles
 * - Onglet Expirés : Flags avec expiration dépassée
 * 
 * Migration 210 — Refonte Feature Flags (R4)
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    ToggleRight,
    Plus,
    Clock,
    History,
    LayoutGrid,
    AlertTriangle,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { FeatureFlagDefinitionForm } from '@/features/admin/components/feature-flag-definition-form';
import { FeatureFlagsMatrix } from '@/features/admin/components/feature-flags-matrix';
import { FeatureFlagsAuditLog } from '@/features/admin/components/feature-flags-audit-log';

// =============================================
// Types
// =============================================

type TabKey = 'definitions' | 'matrix' | 'audit' | 'expired';

interface FeatureFlagDefinition {
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

// =============================================
// Route
// =============================================

export const Route = createFileRoute('/platform/feature-flags')({
    component: PlatformFeatureFlagsPage,
});

function PlatformFeatureFlagsPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabKey>('definitions');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<FeatureFlagDefinition | null>(null);

    // =============================================
    // Queries
    // =============================================

    const { data: definitions = [], isLoading, refetch } = useQuery<FeatureFlagDefinition[]>({
        queryKey: ['feature-flag-definitions'],
        queryFn: async () => {
            const res = await apiClient.get<FeatureFlagDefinition[]>(
                '/api/platform/facturation/feature-flags/definitions'
            );
            return res.data ?? [];
        },
        staleTime: 30 * 1000,
    });

    const { data: expiredData, isLoading: loadingExpired } = useQuery<{ expired: any[]; orphans: any[] } | undefined>({
        queryKey: ['feature-flags-expired'],
        queryFn: async () => {
            const res = await apiClient.get<{ expired: any[]; orphans: any[] }>(
                '/api/platform/facturation/feature-flags/definitions/expired'
            );
            return res.data;
        },
        staleTime: 60 * 1000,
        enabled: activeTab === 'expired',
    });

    // =============================================
    // Mutations
    // =============================================

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/platform/facturation/feature-flags/definitions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flag-definitions'] });
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, estActif }: { id: string; estActif: boolean }) => {
            await apiClient.patch(`/api/platform/facturation/feature-flags/definitions/${id}`, { estActif });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flag-definitions'] });
        },
    });

    // =============================================
    // Helpers
    // =============================================

    const handleEdit = (def: FeatureFlagDefinition) => {
        setEditingDefinition(def);
        setShowCreateForm(true);
    };

    const handleCreate = () => {
        setEditingDefinition(null);
        setShowCreateForm(true);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('featureFlags.confirmDelete', 'Supprimer cette définition ?'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = (id: string, estActif: boolean) => {
        toggleActiveMutation.mutate({ id, estActif: !estActif });
    };

    // =============================================
    // Tabs
    // =============================================

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: 'definitions', label: t('featureFlags.tabs.definitions', 'Définitions'), icon: <ToggleRight className="w-4 h-4" />, count: (definitions ?? []).length },
        { key: 'matrix', label: t('featureFlags.tabs.matrix', 'Matrice'), icon: <LayoutGrid className="w-4 h-4" /> },
        { key: 'audit', label: t('featureFlags.tabs.audit', 'Audit'), icon: <History className="w-4 h-4" /> },
        { key: 'expired', label: t('featureFlags.tabs.expired', 'Expirés'), icon: <Clock className="w-4 h-4" />, count: expiredData?.expired?.length ?? 0 },
    ];

    // =============================================
    // Categorie badge colors
    // =============================================

    const categorieColors: Record<string, string> = {
        general: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
        billing: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
        integration: 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]',
        security: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
        ux: 'bg-purple-100 text-purple-700',
        pedagogie: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
    };

    // =============================================
    // Render
    // =============================================

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <ToggleRight className="w-7 h-7 text-[var(--color-primary-600)]" />
                        {t('featureFlags.title', 'Feature Flags')}
                    </h1>
                    <p className="text-sm text-[var(--color-texte-muted)] mt-1">
                        {t('featureFlags.subtitle', 'Registre centralisé des feature flags — gestion, rollout et audit')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="p-2 rounded-lg border hover:bg-[var(--color-surface-hover)] transition-colors"
                        title={t('common.refresh', 'Actualiser')}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        {t('featureFlags.createDefinition', 'Nouveau flag')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === tab.key
                                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-b-2 border-[var(--color-primary-600)]'
                                : 'text-[var(--color-texte-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-surface-hover)]">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'definitions' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {(definitions ?? []).map((def: FeatureFlagDefinition) => (
                                <div
                                    key={def.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Status indicator */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${def.estActif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-danger-500)]'}`} />
                                        
                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{def.label}</span>
                                                <code className="text-xs px-1.5 py-0.5 bg-[var(--color-surface-hover)] rounded font-mono">
                                                    {def.cle}
                                                </code>
                                                {def.estSysteme && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-[var(--color-warning-100)] text-[var(--color-warning-700)] rounded">
                                                        {t('featureFlags.systeme', 'Système')}
                                                    </span>
                                                )}
                                            </div>
                                            {def.description && (
                                                <p className="text-xs text-[var(--color-texte-muted)] mt-0.5 truncate">{def.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${categorieColors[def.categorie] || 'bg-gray-100 text-gray-600'}`}>
                                                    {def.categorie}
                                                </span>
                                                <span className="text-xs text-[var(--color-texte-muted)]">
                                                    {def.type}
                                                </span>
                                                {def.rolloutPercentage < 100 && (
                                                    <span className="text-xs text-[var(--color-info-600)]">
                                                        Rollout: {def.rolloutPercentage}%
                                                    </span>
                                                )}
                                                {def.expiresAt && (
                                                    <span className={`text-xs ${new Date(def.expiresAt) < new Date() ? 'text-[var(--color-danger-600)]' : 'text-[var(--color-texte-muted)]'}`}>
                                                        Expire: {new Date(def.expiresAt).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                                {def.planMinimal && (
                                                    <span className="text-xs text-[var(--color-texte-muted)]">
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
                                            onClick={() => handleToggleActive(def.id, def.estActif)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                                def.estActif
                                                    ? 'border-[var(--color-success-300)] text-[var(--color-success-700)] hover:bg-[var(--color-success-50)]'
                                                    : 'border-[var(--color-danger-300)] text-[var(--color-danger-700)] hover:bg-[var(--color-danger-50)]'
                                            }`}
                                        >
                                            {def.estActif ? t('common.active', 'Actif') : t('common.inactive', 'Inactif')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(def)}
                                            className="px-3 py-1.5 text-xs rounded-lg border hover:bg-[var(--color-surface-hover)] transition-colors"
                                        >
                                            {t('common.edit', 'Modifier')}
                                        </button>
                                        {!def.estSysteme && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(def.id)}
                                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-danger-300)] text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)] transition-colors"
                                            >
                                                {t('common.delete', 'Supprimer')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'matrix' && (
                <FeatureFlagsMatrix />
            )}

            {activeTab === 'audit' && (
                <FeatureFlagsAuditLog />
            )}

            {activeTab === 'expired' && (
                <div className="space-y-4">
                    {loadingExpired ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
                        </div>
                    ) : (
                        <>
                            {/* Expired flags */}
                            {expiredData?.expired && expiredData.expired.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-danger-600)]">
                                        <AlertTriangle className="w-4 h-4" />
                                        {t('featureFlags.expiredFlags', 'Flags expirés')} ({expiredData.expired.length})
                                    </h3>
                                    {expiredData.expired.map((flag: any) => (
                                        <div key={flag.id} className="flex items-center justify-between p-3 border border-[var(--color-danger-200)] rounded-lg bg-[var(--color-danger-50)]">
                                            <div>
                                                <span className="font-medium text-sm">{flag.label}</span>
                                                <code className="text-xs ml-2 font-mono">{flag.cle}</code>
                                                <p className="text-xs text-[var(--color-texte-muted)] mt-0.5">
                                                    Expiré le {new Date(flag.expiresAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(flag.id, true)}
                                                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)]"
                                            >
                                                {t('featureFlags.deactivate', 'Désactiver')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-[var(--color-texte-muted)]">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>{t('featureFlags.noExpired', 'Aucun flag expiré')}</p>
                                </div>
                            )}

                            {/* Orphan flags */}
                            {expiredData?.orphans && expiredData.orphans.length > 0 && (
                                <div className="space-y-3 mt-6">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-warning-600)]">
                                        <AlertTriangle className="w-4 h-4" />
                                        {t('featureFlags.orphanFlags', 'Flags orphelins')} ({expiredData.orphans.length})
                                    </h3>
                                    <p className="text-xs text-[var(--color-texte-muted)]">
                                        {t('featureFlags.orphanDesc', 'Flags présents dans les overrides tenant mais sans définition centralisée')}
                                    </p>
                                    {expiredData.orphans.map((orphan: any) => (
                                        <div key={orphan.flagName} className="flex items-center justify-between p-3 border rounded-lg">
                                            <code className="text-sm font-mono">{orphan.flagName}</code>
                                            <span className="text-xs text-[var(--color-texte-muted)]">
                                                {orphan.count} override(s)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateForm && (
                <FeatureFlagDefinitionForm
                    definition={editingDefinition}
                    onClose={() => {
                        setShowCreateForm(false);
                        setEditingDefinition(null);
                    }}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        setEditingDefinition(null);
                        queryClient.invalidateQueries({ queryKey: ['feature-flag-definitions'] });
                    }}
                />
            )}
        </div>
    );
}
