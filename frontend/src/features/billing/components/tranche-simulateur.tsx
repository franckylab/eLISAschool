/**
 * ==================================
 * eLISAschool - Tranche Simulateur Component
 * ==================================
 * [Phase 3.4] Simulateur de coût selon le nombre d'élèves.
 * Calcule le supplément tranches en temps réel.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Calculator, Loader2 } from 'lucide-react';

// =============================================
// Types
// =============================================

interface SimulateurResult {
    trancheActuelle?: string;
    trancheSimulee?: string;
    totalSupplement?: number;
    detailParTranche?: Array<{
        tranche: string;
        nbEleves: number;
        prixUnitaire: number;
        sousTotal: number;
    }>;
}

interface TrancheSimulateurProps {
    etablissementId?: string;
}

// =============================================
// Composant
// =============================================

export function TrancheSimulateur({ etablissementId }: TrancheSimulateurProps) {
    const [nbEleves, setNbEleves] = useState(100);

    const { data, isLoading } = useQuery<SimulateurResult | undefined>({
        queryKey: ['billing', 'tranches', 'simulate', nbEleves, etablissementId],
        queryFn: async () => {
            const params = new URLSearchParams({ nbEleves: String(nbEleves) });
            if (etablissementId) params.set('etablissementId', etablissementId);

            const res = await apiClient.get<SimulateurResult>(`/api/billing/tranches/simulate?${params}`);
            return res.data;
        },
        enabled: nbEleves > 0,
    });

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-5 h-5 text-[var(--color-dominante)]" />
                <h2 className="text-lg font-semibold">Simulateur de tranches</h2>
            </div>

            <p className="text-sm text-[var(--color-texte-muted)] mb-4">
                Simulez le coût selon votre nombre d'élèves
            </p>

            {/* Slider */}
            <div className="mb-6">
                <label className="text-xs text-[var(--color-texte-muted)] font-medium">
                    Nombre d'élèves
                </label>
                <input
                    type="range"
                    min={1}
                    max={2000}
                    step={10}
                    value={nbEleves}
                    onChange={(e) => setNbEleves(Number(e.target.value))}
                    className="w-full mt-2 accent-[var(--color-dominante)]"
                />
                <div className="text-center text-xl font-bold mt-2 text-[var(--color-dominante)]">
                    {nbEleves} élèves
                </div>
            </div>

            {/* Résultat */}
            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            ) : data ? (
                <div className="space-y-4">
                    {/* Montant total */}
                    <div className="text-center p-4 rounded-lg bg-[var(--color-dominante-bg)]">
                        <div className="text-2xl font-bold text-[var(--color-dominante)]">
                            +{data.totalSupplement?.toLocaleString() || 0} XAF/mois
                        </div>
                        <div className="text-xs text-[var(--color-texte-muted)] mt-1">
                            supplément tranches
                        </div>
                    </div>

                    {/* Détail par tranche */}
                    {data.detailParTranche && data.detailParTranche.length > 0 && (
                        <div className="space-y-1.5">
                            <h3 className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wide">
                                Détail par tranche
                            </h3>
                            {data.detailParTranche.map((t, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-xs p-2 rounded bg-[var(--color-surface-hover)]"
                                >
                                    <span className="font-medium">{t.tranche}</span>
                                    <span className="text-[var(--color-texte-muted)]">
                                        {t.nbEleves} × {t.prixUnitaire.toLocaleString()} = {t.sousTotal.toLocaleString()} XAF
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-[var(--color-texte-muted)] text-center py-2">
                    Aucune donnée de simulation
                </p>
            )}
        </div>
    );
}

export default TrancheSimulateur;
