/**
 * ==================================
 * eLISAschool - Route Facturation Client
 * ==================================
 * [Phase 3.4] Page billing côté établissement (ADMIN)
 * Affiche : abonnement courant, factures, tranches, modules, simulateur
 * Utilise les composants réutilisables: AbonnementInfo, FactureList, TrancheSimulateur
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { AbonnementInfo } from '@/features/billing/components/abonnement-info';
import { FactureList } from '@/features/billing/components/facture-list';
import { TrancheSimulateur } from '@/features/billing/components/tranche-simulateur';

interface QuotaInfo {
    typeQuota: string;
    utilisationActuelle: number;
    limiteMax: number;
}

export const Route = createFileRoute('/_auth/facturation')({
    beforeLoad: () => requireModulePermission('finances'),
    component: FacturationPage,
});

function FacturationPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-texte)]">
                        Facturation & Abonnement
                    </h1>
                    <p className="text-sm text-[var(--color-texte-muted)] mt-1">
                        Gérez votre abonnement, consultez vos factures et simulez les coûts
                    </p>
                </div>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne gauche : Abonnement + Modules + Factures */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <AbonnementInfo />
                    <ModulesActifs />
                    <FactureList maxItems={5} />
                </div>

                {/* Colonne droite : Simulateur + Usage */}
                <div className="flex flex-col gap-6">
                    <UsageMeters />
                    <TrancheSimulateur />
                </div>
            </div>
        </div>
    );
}

// =============================================
// Composants locaux (non extraits)
// =============================================

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    Package,
    TrendingUp,
} from 'lucide-react';

function ModulesActifs() {
    const { data, isLoading } = useQuery<Array<{ slug: string; nom: string; source: string }> | undefined>({
        queryKey: ['billing', 'modules', 'resolved'],
        queryFn: async () => {
            const res = await apiClient.get<Array<{ slug: string; nom: string; source: string }>>('/api/billing/modules/resolved');
            return res.data;
        },
    });

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-[var(--color-dominante)]" />
                <h2 className="text-lg font-semibold">Modules activés</h2>
            </div>
            {isLoading ? (
                <div className="animate-pulse h-16 bg-[var(--color-surface-hover)] rounded" />
            ) : data?.length ? (
                <div className="flex flex-wrap gap-2">
                    {data.map((m) => (
                        <span
                            key={m.slug}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-dominante-bg)] text-[var(--color-dominante)]"
                        >
                            {m.nom}
                            <span className="opacity-60">({m.source})</span>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[var(--color-texte-muted)]">Aucun module activé</p>
            )}
        </div>
    );
}

function UsageMeters() {
    const { data, isLoading } = useQuery<QuotaInfo[] | undefined>({
        queryKey: ['billing', 'quotas'],
        queryFn: async () => {
            const res = await apiClient.get<QuotaInfo[]>('/api/billing/quotas');
            return res.data;
        },
    });

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-[var(--color-dominante)]" />
                <h2 className="text-lg font-semibold">Consommation</h2>
            </div>
            {isLoading ? (
                <div className="animate-pulse h-20 bg-[var(--color-surface-hover)] rounded" />
            ) : data?.length ? (
                <div className="space-y-3">
                    {data?.map((q) => {
                        const pct = q.limiteMax > 0 ? Math.round((q.utilisationActuelle / q.limiteMax) * 100) : 0;
                        const color = pct >= 90 ? 'var(--color-danger-500)' : pct >= 80 ? 'var(--color-warning-500)' : 'var(--color-success-500)';
                        return (
                            <div key={q.typeQuota}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="capitalize">{q.typeQuota}</span>
                                    <span>{q.utilisationActuelle} / {q.limiteMax || '∞'}</span>
                                </div>
                                <div className="h-2 rounded-full bg-[var(--color-surface-hover)]">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-[var(--color-texte-muted)]">Aucun quota défini</p>
            )}
        </div>
    );
}


