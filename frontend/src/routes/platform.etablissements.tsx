/**
 * eLISAschool - Platform Etablissements
 * CRUD propriétaire — gestion des établissements clients
 * Phase 1.2
 * Phase E.1 — Refonte SaaS v2 (stats, santé, actions rapides)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EtablissementsPage } from '@/features/etablissements/components/etablissements-page';
import { EtablissementFormModal } from '@/features/admin/components/etablissement-form-modal';
import {
    Building2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Users,
    GraduationCap,
    Activity,
    Plus,
    type LucideIcon,
} from 'lucide-react';

interface EtablissementStats {
    total: number;
    actifs: number;
    suspendus: number;
    enEssai: number;
    totalEleves: number;
    totalUtilisateurs: number;
    sante: {
        sains: number;
        attention: number;
        critiques: number;
    };
}

function useEtablissementStats() {
    return useQuery<EtablissementStats | undefined>({
        queryKey: ['platform-etablissements-stats'],
        queryFn: async () => {
            const res = await apiClient.get<EtablissementStats>('/api/platform/etablissements/stats');
            return res.data;
        },
        staleTime: 60_000,
    });
}

function PlatformEtablissementsPage() {
    const { t } = useTranslation('admin');
    const { data: stats, isLoading } = useEtablissementStats();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('etablissements.titre')}</h1>
                    <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.sousTitrePlateforme')}
                    </p>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                    >
                        <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.creer')}
                    </button>
                </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-[var(--gap-sm)]">
                <MiniStat
                    icon={Building2}
                    label={t('etablissements.stats.total')}
                    value={stats?.total ?? '-'}
                    color="var(--color-info-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={CheckCircle2}
                    label={t('etablissements.stats.actifs')}
                    value={stats?.actifs ?? '-'}
                    color="var(--color-success-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={AlertTriangle}
                    label={t('etablissements.stats.enEssai')}
                    value={stats?.enEssai ?? '-'}
                    color="var(--color-warning-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={XCircle}
                    label={t('etablissements.stats.suspendus')}
                    value={stats?.suspendus ?? '-'}
                    color="var(--color-danger-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={GraduationCap}
                    label={t('etablissements.stats.eleves')}
                    value={stats?.totalEleves?.toLocaleString('fr-FR') ?? '-'}
                    color="var(--color-accent-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={Users}
                    label={t('etablissements.stats.utilisateurs')}
                    value={stats?.totalUtilisateurs?.toLocaleString('fr-FR') ?? '-'}
                    color="var(--color-info-600)"
                    loading={isLoading}
                />
                <MiniStat
                    icon={Activity}
                    label={t('etablissements.stats.santeOk')}
                    value={stats?.sante ? `${stats.sante.sains}/${stats?.total ?? '-'}` : '-'}
                    color="var(--color-success-600)"
                    loading={isLoading}
                />
            </div>

            {/* Santé des établissements */}
            {stats?.sante && (
                <div className="flex items-center gap-[var(--gap-md)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                    <span style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.sante.label')} :</span>
                    <span className="flex items-center gap-[var(--gap-xs)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
                        {stats.sante.sains} {t('etablissements.sante.sains')}
                    </span>
                    <span className="flex items-center gap-[var(--gap-xs)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-warning-500)' }} />
                        {stats.sante.attention} {t('etablissements.sante.attention')}
                    </span>
                    <span className="flex items-center gap-[var(--gap-xs)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-danger-500)' }} />
                        {stats.sante.critiques} {t('etablissements.sante.critiques')}
                    </span>
                </div>
            )}

            {/* Liste des établissements (composant existant) */}
            <EtablissementsPage />

            {/* Modal création établissement */}
            <EtablissementFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode="create"
            />
        </div>
    );
}

function MiniStat({
    icon: Icon,
    label,
    value,
    color,
    loading,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)] space-y-[var(--space-xs)]">
            <div className="flex items-center gap-[var(--gap-xs)]">
                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color }} />
                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{label}</span>
            </div>
            <div className="font-bold" style={{ fontSize: 'clamp(1rem, 0.85rem + 0.5vw, 1.25rem)' }}>{loading ? '...' : value}</div>
        </div>
    );
}

export const Route = createFileRoute('/platform/etablissements')({
    component: PlatformEtablissementsPage,
});
