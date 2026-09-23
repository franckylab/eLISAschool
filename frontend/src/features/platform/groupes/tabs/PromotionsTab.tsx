/**
 * ==================================
 * eLISAschool — Platform Groupes · Onglet Promotions
 * ==================================
 * Promotions scope=GROUPE assignées au groupe (via conditions.groupeIds
 * multi-groupes, non destructif) + aperçu global. Appliquées en ligne
 * REMISE sur chaque facture individuelle des membres (Q23-A).
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePercent, ArrowRight, Info, Plus, X } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { GroupeSaaS } from '../types';

interface PromotionGroupe {
    id: string;
    code: string;
    nom: string;
    typePromotion: 'POURCENTAGE' | 'MONTANT_FIXE' | 'GRATUITE';
    valeur: number;
    scope: string;
    cibleId?: string | null;
    conditions?: { groupeIds?: string[]; nombreMembresMin?: number } | null;
    actif: boolean;
}

function formaterValeur(p: { typePromotion: string; valeur: number }): string {
    if (p.typePromotion === 'POURCENTAGE') return `${p.valeur}%`;
    if (p.typePromotion === 'GRATUITE') return 'Gratuité';
    return `${Number(p.valeur).toLocaleString('fr-FR')} XAF`;
}

function usePromotionsGroupe() {
    return useQuery({
        queryKey: ['promotions', { scope: 'GROUPE', actif: true }],
        queryFn: async (): Promise<PromotionGroupe[]> => {
            const res = await apiClient.get<unknown>(
                '/api/platform/facturation/promotions',
                { scope: 'GROUPE', actif: true, limit: 100 },
            );
            const payload = res.data as unknown;
            if (Array.isArray(payload)) return payload as PromotionGroupe[];
            if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
                return (payload as { data: PromotionGroupe[] }).data;
            }
            return [];
        },
        staleTime: 30_000,
        retry: 1,
    });
}

export function PromotionsTab({ groupe }: { groupe: GroupeSaaS }) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { data: promotions = [], isLoading, isError, refetch } = usePromotionsGroupe();

    const { assignees, disponibles } = useMemo(() => {
        const assignees: PromotionGroupe[] = [];
        const disponibles: PromotionGroupe[] = [];
        for (const p of promotions) {
            const viaCible = p.cibleId === groupe.id;
            const viaListe = p.conditions?.groupeIds?.includes(groupe.id) ?? false;
            if (viaCible || viaListe) assignees.push(p);
            else if (!p.cibleId) disponibles.push(p);
        }
        return { assignees, disponibles };
    }, [promotions, groupe.id]);

    const assigner = useMutation({
        mutationFn: async (promo: PromotionGroupe) => {
            const groupeIds = [...(promo.conditions?.groupeIds ?? [])];
            if (!groupeIds.includes(groupe.id)) groupeIds.push(groupe.id);
            await apiClient.patch(`/api/platform/facturation/promotions/${promo.id}`, {
                conditions: { ...(promo.conditions ?? {}), groupeIds },
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
            toast.success(t('groupes.toast.promoAssignee'));
        },
        onError: () => toast.error(t('groupes.toast.erreurPromo')),
    });

    const retirer = useMutation({
        mutationFn: async (promo: PromotionGroupe) => {
            // Exclusif via cibleId : ne pas modifier ici (édition dans /platform/promotions)
            if (promo.cibleId === groupe.id) {
                await apiClient.patch(`/api/platform/facturation/promotions/${promo.id}`, { cibleId: null });
                return;
            }
            const groupeIds = (promo.conditions?.groupeIds ?? []).filter((id) => id !== groupe.id);
            await apiClient.patch(`/api/platform/facturation/promotions/${promo.id}`, {
                conditions: { ...(promo.conditions ?? {}), groupeIds },
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['promotions'] });
            toast.success(t('groupes.toast.promoRetiree'));
        },
        onError: () => toast.error(t('groupes.toast.erreurPromo')),
    });

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div
                className="flex items-start gap-[var(--gap-sm)] rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-[var(--space-md)] py-[var(--space-sm)]"
                role="note"
            >
                <Info
                    className="mt-0.5 h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0 text-[var(--color-accent)]"
                    aria-hidden
                />
                <p className="text-[clamp(0.78rem,0.75rem+0.2vw,0.875rem)] text-[var(--color-texte-secondaire)]">
                    {t('groupes.promotions.notePerimetre')}
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <SchoolLoading variant="compact" />
                </div>
            ) : isError ? (
                <ErrorMessage
                    title={t('groupes.promotions.erreurChargement')}
                    message={t('groupes.promotions.erreurChargementDetail')}
                    onRetry={() => refetch()}
                    retryLabel={t('groupes.reessayer')}
                />
            ) : (
                <>
                    {/* Assignées */}
                    <section aria-label={t('groupes.promotions.assignees')}>
                        <h4 className="mb-[var(--space-xs)] text-sm font-semibold text-[var(--color-texte)]">
                            {t('groupes.promotions.assignees')} ({assignees.length})
                        </h4>
                        {!assignees.length ? (
                            <p className="rounded-xl border border-dashed border-[var(--color-bordure)] py-6 text-center text-sm text-[var(--color-texte-secondaire)]">
                                {t('groupes.aucunePromotion')}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-[var(--space-xs)]">
                                {assignees.map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)]"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-[var(--color-texte)]">
                                                {p.nom}
                                            </span>
                                            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                <code className="font-mono text-xs text-[var(--color-texte-muted)]">
                                                    {p.code}
                                                </code>
                                                <Badge variant="default" size="xs">
                                                    {formaterValeur(p)}
                                                </Badge>
                                                {p.cibleId === groupe.id && (
                                                    <Badge variant="secondary" size="xs">
                                                        {t('groupes.promotions.exclusif')}
                                                    </Badge>
                                                )}
                                            </span>
                                        </span>
                                        <ElisaButton
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => retirer.mutate(p)}
                                            isLoading={retirer.isPending}
                                            icon={<X className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                            aria-label={t('groupes.promotions.retirer', { nom: p.nom })}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Disponibles */}
                    {disponibles.length > 0 && (
                        <section aria-label={t('groupes.promotions.disponibles')}>
                            <h4 className="mb-[var(--space-xs)] text-sm font-semibold text-[var(--color-texte)]">
                                {t('groupes.promotions.disponibles')} ({disponibles.length})
                            </h4>
                            <ul className="flex flex-col gap-[var(--space-xs)]">
                                {disponibles.map((p) => (
                                    <li
                                        key={p.id}
                                        className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)]"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm text-[var(--color-texte-secondaire)]">
                                                {p.nom}
                                            </span>
                                            <code className="font-mono text-xs text-[var(--color-texte-muted)]">
                                                {p.code} · {formaterValeur(p)}
                                            </code>
                                        </span>
                                        <ElisaButton
                                            variant="outline"
                                            size="xs"
                                            onClick={() => assigner.mutate(p)}
                                            isLoading={assigner.isPending}
                                            icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                        >
                                            {t('groupes.promotions.assigner')}
                                        </ElisaButton>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}

            <div className="flex justify-end">
                <ElisaButton
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: '/platform/promotions' })}
                    icon={<ArrowRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('groupes.promotions.gerer')}
                </ElisaButton>
            </div>

            {!isLoading && !isError && !promotions.length && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-bordure)] py-8 text-center">
                    <BadgePercent
                        className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]"
                        aria-hidden
                    />
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {t('groupes.promotions.aucuneGroupe')}
                    </p>
                </div>
            )}
        </div>
    );
}
