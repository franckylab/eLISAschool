/**
 * ==================================
 * eLISAschool - Platform Abonnements
 * ==================================
 * Page dédiée à la gestion des abonnements clients.
 * Extraite de platform.facturation.tsx — Refonte Panel Admin v3.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@shared/types/api.types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AbonnementDetail } from '@/features/platform/components/abonnement-detail';
import {
    CreditCard,
    CheckCircle,
    XCircle,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface Plan {
    id: string;
    nom: string;
    slug: string;
    prixBase: number;
    devise: string;
}

interface Abonnement {
    id: string;
    etablissementId: string;
    planId: string;
    statut: string;
    montantMensuel: number;
    nombreElevesActuel: number;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    plan?: Plan;
    etablissement?: { id: string; nom: string; code: string };
}

// =============================================
// Hook data fetching
// =============================================

function useAbonnements() {
    return useQuery<{ data: Abonnement[]; total: number }>({
        queryKey: ['platform-abonnements'],
        queryFn: async () => {
            const res = (await apiClient.get<Abonnement[]>('/api/platform/facturation/abonnements')) as ApiResponse<Abonnement[]> & { total?: number };
            return { data: res.data ?? [], total: res.total ?? res.data?.length ?? 0 };
        },
    });
}

// =============================================
// Page
// =============================================

function PlatformAbonnementsPage() {
    const { t } = useTranslation('admin');
    const { data, isLoading } = useAbonnements();
    const [selectedAboId, setSelectedAboId] = useState<string | null>(null);

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'ACTIF': return { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
            case 'SUSPENDU': return { bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)' };
            case 'EXPIRE': return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
            case 'ANNULE': return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
            default: return { bg: 'var(--color-info-100)', text: 'var(--color-info-700)' };
        }
    };

    // Vue détail abonnement
    if (selectedAboId) {
        return (
            <div className="p-[var(--space-lg)] space-y-[var(--space-md)]">
                <button
                    onClick={() => setSelectedAboId(null)}
                    className="hover:underline flex items-center gap-[var(--gap-xs)]"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-dominant-600)' }}
                >
                    ← {t('facturation.abonnements.retour')}
                </button>
                <AbonnementDetail abonnementId={selectedAboId} onClose={() => setSelectedAboId(null)} />
            </div>
        );
    }

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <CreditCard className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                            {t('facturation.onglets.abonnements')}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {data?.total ?? 0} abonnement{data?.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>}

            {/* Tableau abonnements */}
            <div className="border border-[var(--color-bordure)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
                <table className="w-full" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.etablissement')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.plan')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.statut')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.eleves')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.montantMois')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.fin')}</th>
                            <th className="text-center p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.abonnements.auto')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-bordure)]">
                        {data?.data?.map((abo) => {
                            const sc = statutColor(abo.statut);
                            return (
                                <tr
                                    key={abo.id}
                                    className="cursor-pointer transition-colors"
                                    onClick={() => setSelectedAboId(abo.id)}
                                    style={{ backgroundColor: 'transparent' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td className="p-[var(--space-sm)] font-medium text-[var(--color-texte)]">
                                        {abo.etablissement?.nom || abo.etablissementId.slice(0, 8)}
                                    </td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{abo.plan?.nom || '-'}</td>
                                    <td className="p-[var(--space-sm)]">
                                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                                            {abo.statut}
                                        </span>
                                    </td>
                                    <td className="p-[var(--space-sm)] text-right text-[var(--color-texte)]">{abo.nombreElevesActuel}</td>
                                    <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                        {new Intl.NumberFormat('fr-FR').format(Number(abo.montantMensuel))} XAF
                                    </td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                        {new Date(abo.dateFin).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-[var(--space-sm)] text-center">
                                        {abo.autoRenouvellement
                                            ? <CheckCircle className="w-[var(--icon-sm)] h-[var(--icon-sm)] mx-auto" style={{ color: 'var(--color-success-600)' }} />
                                            : <XCircle className="w-[var(--icon-sm)] h-[var(--icon-sm)] mx-auto text-[var(--color-texte-muted)]" />}
                                    </td>
                                </tr>
                            );
                        })}
                        {(!data?.data || data.data.length === 0) && !isLoading && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-[var(--color-texte-muted)]">
                                    {t('facturation.abonnements.aucun')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/abonnements')({
    component: PlatformAbonnementsPage,
});

export default PlatformAbonnementsPage;
