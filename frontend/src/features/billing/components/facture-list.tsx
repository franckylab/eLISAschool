/**
 * ==================================
 * eLISAschool - Facture List Component
 * ==================================
 * [Phase 3.4] Liste des factures d'un établissement.
 * Composant réutilisable avec pagination et filtres.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FileText, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

// =============================================
// Types
// =============================================

interface Facture {
    id: string;
    numero?: string;
    dateEmission?: string;
    montantTotal?: number;
    montantPaye?: number;
    statut?: string;
}

interface FactureListProps {
    etablissementId?: string;
    maxItems?: number;
    showPagination?: boolean;
}

// =============================================
// Composant
// =============================================

export function FactureList({ etablissementId, maxItems, showPagination = false }: FactureListProps) {
    const [page, setPage] = useState(0);
    const pageSize = maxItems || 10;

    const { data, isLoading } = useQuery<Facture[] | undefined>({
        queryKey: ['billing', 'factures', etablissementId, page, pageSize],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
            });
            if (etablissementId) params.set('etablissementId', etablissementId);

            const res = await apiClient.get<Facture[]>(`/api/billing/factures?${params}`);
            return res.data;
        },
    });

    const statutColors: Record<string, string> = {
        payee: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
        en_attente: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
        en_retard: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
        annulee: 'bg-[var(--color-texte-muted)] text-[var(--color-texte)]',
    };

    const statutLabel: Record<string, string> = {
        payee: 'Payée',
        en_attente: 'En attente',
        en_retard: 'En retard',
        annulee: 'Annulée',
    };

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[var(--color-dominante)]" />
                    <h2 className="text-lg font-semibold">Factures</h2>
                </div>
                {data && data.length > 0 && (
                    <button className="text-xs text-[var(--color-dominante)] hover:underline flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        Exporter
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : !data?.length ? (
                <p className="text-sm text-[var(--color-texte-muted)] text-center py-4">
                    Aucune facture
                </p>
            ) : (
                <div className="space-y-2">
                    {data.map((f) => (
                        <div
                            key={f.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)] hover:opacity-80 transition-opacity"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                        {f.numero || f.id.slice(0, 8)}
                                    </span>
                                    {f.statut && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statutColors[f.statut] || 'bg-[var(--color-texte-muted)] text-[var(--color-texte)]'}`}>
                                            {statutLabel[f.statut] || f.statut}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-[var(--color-texte-muted)]">
                                    {f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : ''}
                                </span>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-sm font-semibold">
                                    {f.montantTotal?.toLocaleString() || 0} XAF
                                </div>
                                {f.montantPaye !== undefined && f.montantPaye > 0 && f.montantPaye < (f.montantTotal || 0) && (
                                    <div className="text-[10px] text-[var(--color-success-500)]">
                                        Payé: {f.montantPaye.toLocaleString()} XAF
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {showPagination && data && data.length >= pageSize && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-bordure)]">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-bordure)] disabled:opacity-40 hover:bg-[var(--color-surface-hover)]"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Précédent
                    </button>
                    <span className="text-xs text-[var(--color-texte-muted)]">Page {page + 1}</span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]"
                    >
                        Suivant
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default FactureList;
