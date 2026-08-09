/**
 * ==================================
 * eLISAschool - Abonnement Info Component
 * ==================================
 * [Phase 3.4] Composant réutilisable affichant les informations
 * de l'abonnement courant d'un établissement.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CreditCard, Loader2 } from 'lucide-react';

// =============================================
// Types
// =============================================

interface AbonnementData {
    plan?: { nom?: string };
    statut?: string;
    montantMensuel?: number;
    dateDebut?: string;
    dateFin?: string;
}

interface AbonnementInfoProps {
    etablissementId?: string;
    compact?: boolean;
}

// =============================================
// Composant
// =============================================

export function AbonnementInfo({ etablissementId, compact = false }: AbonnementInfoProps) {
    const { data, isLoading } = useQuery<AbonnementData | undefined>({
        queryKey: ['billing', 'abonnement', etablissementId],
        queryFn: async () => {
            const url = etablissementId
                ? `/api/billing/abonnement/${etablissementId}`
                : '/api/billing/abonnement';
            const res = await apiClient.get<AbonnementData>(url);
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-[var(--color-dominante)]" />
                <h2 className="text-lg font-semibold">Abonnement courant</h2>
            </div>

            {data ? (
                <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                    <InfoItem label="Plan" value={data.plan?.nom || '—'} />
                    <InfoItem label="Statut" value={data.statut || '—'} />
                    <InfoItem
                        label="Montant mensuel"
                        value={`${data.montantMensuel?.toLocaleString() || 0} XAF`}
                    />
                    <InfoItem
                        label="Début"
                        value={data.dateDebut ? new Date(data.dateDebut).toLocaleDateString('fr-FR') : '—'}
                    />
                </div>
            ) : (
                <p className="text-sm text-[var(--color-texte-muted)]">Aucun abonnement actif</p>
            )}
        </div>
    );
}

// =============================================
// Helpers
// =============================================

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-[var(--color-texte-muted)]">{label}</div>
            <div className="text-sm font-semibold mt-0.5">{value}</div>
        </div>
    );
}

export default AbonnementInfo;
