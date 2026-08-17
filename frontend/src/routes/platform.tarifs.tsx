/**
 * ==================================
 * eLISAschool - Page Tarifs & Plans (Refonte v4.3)
 * ==================================
 * Page tarifs plateforme avec comparaison de plans pilotés par JSONB.
 *
 * Refonte v4.3 :
 *   - Suppression CTA "Souscrire" (page = prévisualisation admin)
 *   - Chargement remises depuis API (via TarifsPreview)
 *   - Types partagés + i18n complet
 *   - Composant TarifsPreview réutilisable
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { TarifsPreview } from '@/features/billing/components/tarifs-preview';
import { PlanSimulator } from '@/features/billing/components/plan-simulator';
import type { Plan } from '@/features/billing/types/plan.types';

// =============================================
// Hooks
// =============================================

function usePlansDisponibles() {
    return useQuery<Plan[]>({
        queryKey: ['plans-tarifs'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[] | { success: boolean; data: Plan[] }>('/api/billing/plans');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

// =============================================
// Page principale
// =============================================

function TarifsPage() {
    const { t } = useTranslation('plans');
    const { data: plans, isLoading } = usePlansDisponibles();
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-pulse text-[var(--color-texte-secondaire)]">
                    {t('tarifs.chargement')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-[var(--space-xl)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            {/* Header */}
            <div className="space-y-3 text-center">
                <h1 className="text-2xl font-bold text-[var(--color-texte)] md:text-3xl">
                    {t('tarifs.titre')}
                </h1>
                <p className="mx-auto max-w-2xl text-[var(--color-texte-secondaire)]">
                    {t('tarifs.choisissezPlan')}
                    {' '}{t('tarifs.tousPlansIncluent')}
                </p>
            </div>

            {/* Tarifs Preview (composant partagé) */}
            <TarifsPreview
                plans={plans ?? []}
                mode="admin"
                selectedPlanId={selectedPlanId}
                onPlanSelect={setSelectedPlanId}
            />

            {/* Simulateur */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                <PlanSimulator />
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/tarifs')({
    component: TarifsPage,
});
