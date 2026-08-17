/**
 * ==================================
 * eLISAschool - Platform Factures
 * ==================================
 * Page dédiée à la gestion des factures.
 * Extraite de platform.facturation.tsx — Refonte Panel Admin v3.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@shared/types/api.types';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

// =============================================
// Types
// =============================================

interface Facture {
    id: string;
    numero: string;
    etablissementId: string;
    dateEmission: string;
    dateEcheance: string;
    montantTotal: number;
    montantPaye: number;
    statut: string;
    devise: string;
}

// =============================================
// Hook data fetching
// =============================================

function useFactures() {
    return useQuery<{ data: Facture[]; total: number }>({
        queryKey: ['platform-factures'],
        queryFn: async () => {
            const res = (await apiClient.get<Facture[]>('/api/platform/facturation/factures')) as ApiResponse<Facture[]> & { total?: number };
            return { data: res.data ?? [], total: res.total ?? res.data?.length ?? 0 };
        },
    });
}

// =============================================
// Page
// =============================================

function PlatformFacturesPage() {
    const { t } = useTranslation('admin');
    const { data, isLoading } = useFactures();

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'PAYEE': return { bg: 'var(--color-success-100)', text: 'var(--color-success-700)' };
            case 'EMISE': return { bg: 'var(--color-info-100)', text: 'var(--color-info-700)' };
            case 'EN_RETARD': return { bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' };
            case 'BROUILLON': return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
            default: return { bg: 'var(--color-surface-hover)', text: 'var(--color-texte-muted)' };
        }
    };

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <FileText className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                    <div>
                        <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                            {t('facturation.onglets.factures')}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                            {data?.total ?? 0} facture{data?.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && <div className="animate-pulse text-[var(--color-texte-muted)]">{t('facturation.chargement')}</div>}

            {/* Tableau factures */}
            <div className="border border-[var(--color-bordure)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
                <table className="w-full" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.numero')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.dateEmission')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.echeance')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.montantTotal')}</th>
                            <th className="text-right p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.paye')}</th>
                            <th className="text-left p-[var(--space-sm)] font-medium text-[var(--color-texte)]">{t('facturation.facturesPage.statut')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-bordure)]">
                        {data?.data?.map((f) => {
                            const sc = statutColor(f.statut);
                            return (
                                <tr
                                    key={f.id}
                                    className="transition-colors"
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td className="p-[var(--space-sm)] font-mono font-medium text-[var(--color-texte)]">{f.numero}</td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{new Date(f.dateEmission).toLocaleDateString('fr-FR')}</td>
                                    <td className="p-[var(--space-sm)] text-[var(--color-texte)]">{new Date(f.dateEcheance).toLocaleDateString('fr-FR')}</td>
                                    <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                        {new Intl.NumberFormat('fr-FR').format(Number(f.montantTotal))} {f.devise}
                                    </td>
                                    <td className="p-[var(--space-sm)] text-right font-mono text-[var(--color-texte)]">
                                        {new Intl.NumberFormat('fr-FR').format(Number(f.montantPaye))} {f.devise}
                                    </td>
                                    <td className="p-[var(--space-sm)]">
                                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                                            {f.statut}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!data?.data || data.data.length === 0) && !isLoading && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-[var(--color-texte-muted)]">
                                    {t('facturation.facturesPage.aucune')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/factures')({
    component: PlatformFacturesPage,
});

export default PlatformFacturesPage;
