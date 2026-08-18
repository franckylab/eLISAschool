/**
 * ==================================
 * eLISAschool - Mon Abonnement (Client)
 * ==================================
 * Page établissement — abonnement actuel, factures, quotas, simulateur.
 * Phase 4.7 — Refonte SaaS
 * Phase K.1 — Enrichissement : upgrade/downgrade, graphique consommation,
 * historique des plans, simulateur intégré.
 * v9 — Consolidation : onglet "Modules actifs" supprimé (→ marketplace).
 */

import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    Users,
    Package,
    ArrowUpCircle,
    History,
    Sparkles,
    Tag,
    Percent,
    Clock,
    TrendingDown,
    Gift,
} from 'lucide-react';
import { CodePromoInput } from '@/features/billing/components/code-promo-input';
import { FactureBreakdown } from '@/features/billing/components/facture-breakdown';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    SCOPE_LABELS,
    formaterValeurPromotion,
    type Promotion,
    type ResultatCascadePromotions,
} from '@/features/billing/types/promotion.types';
import { usePreviewCascade, useHistoriquePromotionsClient } from '@/features/billing/hooks/use-promotions';

// =============================================
// Types
// =============================================

interface Quota {
    typeQuota: string;
    utilisationActuelle: number;
    limiteMax: number;
    alerte80pourcent: boolean;
    bloquer: boolean;
}

interface Plan {
    id: string;
    nom: string;
    slug: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
    modulesInclus: string[];
    badge?: string;
}

interface Abonnement {
    id: string;
    statut: string;
    montantMensuel: number;
    nombreElevesActuel: number;
    dateDebut: string;
    dateFin: string;
    cycleFacturation: string;
    autoRenouvellement: boolean;
    prochaineFacturation?: string;
    plan?: Plan;
    quotas?: Quota[];
}

// =============================================
// Hooks
// =============================================

function useMonAbonnement() {
    return useQuery<Abonnement | null | undefined>({
        queryKey: ['mon-abonnement'],
        queryFn: async () => {
            const res = await apiClient.get<Abonnement | null>('/api/billing/mon-abonnement');
            return res.data;
        },
    });
}

function useMonAbonnementDetail() {
    return useQuery<{ promotionsEligibles: Promotion[] } | null>({
        queryKey: ['mon-abonnement-detail'],
        queryFn: async () => {
            const res = await apiClient.get('/api/billing/mon-abonnement/detail');
            return (res.data as any)?.data ?? res.data ?? null;
        },
    });
}

// =============================================
// Main Page
// =============================================

type TabKey = 'abonnement' | 'quotas' | 'historique';

function MonAbonnementSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5">
                    {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-5 flex-1 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function MonAbonnementPage() {
    const { t } = useTranslation('billing');
    const [activeTab, setActiveTab] = useState<TabKey>('abonnement');

    const tabs: { key: TabKey; label: string; icon: typeof CreditCard }[] = [
        { key: 'abonnement', label: t('monAbonnement.tabs.abonnement'), icon: Package },
        { key: 'quotas', label: t('monAbonnement.tabs.quotas'), icon: BarChart3 },
        { key: 'historique', label: t('monAbonnement.tabs.historique'), icon: History },
    ];

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            <div>
                <h1 className="text-xl font-bold text-[var(--color-texte)]">{t('monAbonnement.titre')}</h1>
                <p className="text-sm text-[var(--color-texte-secondaire)]">{t('monAbonnement.description')}</p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                    : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {activeTab === 'abonnement' && <AbonnementTab />}
            {activeTab === 'quotas' && <QuotasTab />}
            {activeTab === 'historique' && <HistoriqueTab />}
        </div>
    );
}

// =============================================
// Abonnement Tab
// =============================================

function AbonnementTab() {
    const { t } = useTranslation('billing');
    const queryClient = useQueryClient();
    const { data: abonnement, isLoading } = useMonAbonnement();
    const { data: plansDisponibles } = useQuery<Plan[] | undefined>({
        queryKey: ['plans-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<Plan[]>('/api/billing/plans');
            return res.data;
        },
    });

    // Confirmation modal state
    const [planToUpgrade, setPlanToUpgrade] = useState<Plan | null>(null);

    const upgradeMutation = useMutation({
        mutationFn: async (nouveauPlanId: string) => {
            const res = await apiClient.patch('/api/billing/abonnement/upgrade', { nouveauPlanId });
            return res.data;
        },
    });

    const handleUpgradeConfirm = () => {
        if (!planToUpgrade) return;
        upgradeMutation.mutate(planToUpgrade.id, {
            onSuccess: () => {
                toast.success(t('monAbonnement.upgradeSucces'));
                queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
                setPlanToUpgrade(null);
            },
            onError: () => toast.error(t('monAbonnement.upgradeErreur')),
        });
    };

    if (isLoading) return <MonAbonnementSkeleton />;

    if (!abonnement) {
        return (
            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] py-12">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <h2 className="mt-4 text-lg font-semibold text-[var(--color-texte)]">{t('monAbonnement.aucunAbonnement')}</h2>
                <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">
                    {t('monAbonnement.contacterAdmin')}
                </p>
            </div>
        );
    }

    const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price);
    const joursRestants = Math.max(0, Math.ceil((new Date(abonnement.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
        <div className="space-y-[var(--space-lg)]">
            {/* Plan actuel */}
            <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                            <Package className="h-5 w-5 text-[var(--color-dominante)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-texte)]">{abonnement.plan?.nom || t('monAbonnement.planActuel')}</h2>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                abonnement.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}>
                                {abonnement.statut}
                            </span>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <div className="text-2xl font-bold text-[var(--color-texte)]">{formatPrice(Number(abonnement.montantMensuel))} XAF</div>
                        <div className="text-xs text-[var(--color-texte-muted)]">{t('monAbonnement.mois')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[var(--color-bordure)]">
                    <div>
                        <div className="text-xs text-[var(--color-texte-muted)]">{t('monAbonnement.cycle')}</div>
                        <div className="text-sm font-medium text-[var(--color-texte)]">{abonnement.cycleFacturation === 'MENSUEL' ? t('monAbonnement.mensuel') : t('monAbonnement.annuel')}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-texte-muted)]">{t('monAbonnement.debut')}</div>
                        <div className="text-sm font-medium text-[var(--color-texte)]">{new Date(abonnement.dateDebut).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-texte-muted)]">{t('monAbonnement.fin')}</div>
                        <div className="text-sm font-medium text-[var(--color-texte)]">{new Date(abonnement.dateFin).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--color-texte-muted)]">{t('monAbonnement.joursRestants')}</div>
                        <div className={`text-sm font-medium ${joursRestants < 7 ? 'text-red-500' : 'text-[var(--color-texte)]'}`}>
                            {joursRestants} {joursRestants > 1 ? t('monAbonnement.jours') : t('monAbonnement.jour')}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                    <span className="text-sm text-[var(--color-texte-muted)]">{t('monAbonnement.autoRenouvellement')}</span>
                    {abonnement.autoRenouvellement ? (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" /> {t('monAbonnement.active')}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-sm text-[var(--color-texte-muted)]">
                            <XCircle className="h-4 w-4" /> {t('monAbonnement.desactive')}
                        </span>
                    )}
                    {abonnement.prochaineFacturation && (
                        <span className="flex items-center gap-1.5 text-sm text-[var(--color-texte-secondaire)] sm:ml-auto">
                            <Calendar className="h-4 w-4" />
                            {t('monAbonnement.prochaineFacturation')} {new Date(abonnement.prochaineFacturation).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                </div>
            </div>

            {/* Élèves */}
            <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(1rem,0.8rem+0.5vw,1.5rem)]">
                <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-[var(--color-texte-muted)]" />
                    <h3 className="font-semibold text-[var(--color-texte)]">{t('monAbonnement.elevesInscrits')}</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[var(--color-texte)]">{abonnement.nombreElevesActuel}</span>
                    <span className="text-sm text-[var(--color-texte-muted)]">/ {abonnement.plan?.maxEleves ?? '∞'} {t('monAbonnement.max')}</span>
                </div>
                {abonnement.plan && (
                    <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    abonnement.nombreElevesActuel / abonnement.plan.maxEleves > 0.8 ? 'bg-red-500' : 'bg-[var(--color-dominante)]'
                                }`}
                                style={{ width: `${Math.min(100, (abonnement.nombreElevesActuel / abonnement.plan.maxEleves) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Promotions & Code promo */}
            <PromotionsSection />

            {/* Upgrade / Downgrade */}
            {plansDisponibles && plansDisponibles.length > 0 && (
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-4">
                    <div className="flex items-center gap-3">
                        <ArrowUpCircle className="h-5 w-5 text-[var(--color-dominante)]" />
                        <h3 className="font-semibold text-[var(--color-texte)]">{t('monAbonnement.changerPlan')}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {plansDisponibles
                            .filter(p => p.id !== abonnement.plan?.id)
                            .slice(0, 6)
                            .map(plan => {
                                const isUpgrade = plan.prixBase > (abonnement.plan?.prixBase || 0);
                                return (
                                    <div key={plan.id} className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/30 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-[var(--color-texte)]">{plan.nom}</span>
                                            {plan.badge && (
                                                <span className="rounded-full bg-[var(--color-dominante)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-dominante)]">{plan.badge}</span>
                                            )}
                                        </div>
                                        <div className="text-lg font-bold text-[var(--color-texte)]">
                                            {new Intl.NumberFormat('fr-FR').format(plan.prixBase)} {plan.devise}{t('monAbonnement.mois')}
                                        </div>
                                        <div className="text-xs text-[var(--color-texte-muted)]">
                                            {t('monAbonnement.elevesMax', { count: plan.maxEleves })}
                                        </div>
                                        <button
                                            onClick={() => setPlanToUpgrade(plan)}
                                            disabled={upgradeMutation.isPending}
                                            className={`w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                                                isUpgrade
                                                    ? 'bg-[var(--color-dominante)] text-white hover:opacity-90'
                                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]/80'
                                            }`}
                                        >
                                            {isUpgrade ? t('monAbonnement.upgrader') : t('monAbonnement.downgrader')}
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Confirmation modal upgrade */}
            <ConfirmationModal
                isOpen={!!planToUpgrade}
                title={t('monAbonnement.confirmerUpgrade')}
                message={t('monAbonnement.confirmerMsg', { plan: planToUpgrade?.nom ?? '' })}
                confirmLabel={t('monAbonnement.confirmer')}
                cancelLabel={t('monAbonnement.annuler')}
                variant="info"
                onConfirm={handleUpgradeConfirm}
                onCancel={() => setPlanToUpgrade(null)}
            />
        </div>
    );
}

// =============================================
// Quotas Tab
// =============================================

function QuotasTab() {
    const { t } = useTranslation('billing');
    const { data: abonnement } = useMonAbonnement();
    const quotas = abonnement?.quotas || [];

    if (quotas.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] py-8">
                <BarChart3 className="h-8 w-8 text-[var(--color-texte-muted)] opacity-50" />
                <p className="mt-2 text-sm text-[var(--color-texte-muted)]">{t('monAbonnement.aucunQuota')}</p>
            </div>
        );
    }

    const quotaLabels: Record<string, string> = {
        eleves: t('billing:consommation.eleves'),
        utilisateurs: t('billing:consommation.utilisateurs'),
        classes: 'Classes',
        stockage_go: t('billing:consommation.stockage'),
        sms_mensuel: 'SMS / mois',
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-texte)] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--color-dominante)]" />
                {t('monAbonnement.consommation')}
            </h3>
            {quotas.map((q) => {
                const pourcentage = q.limiteMax > 0 ? (q.utilisationActuelle / q.limiteMax) * 100 : 0;
                const label = quotaLabels[q.typeQuota] || q.typeQuota;
                const estAlerte = pourcentage >= 80;
                const estBloque = pourcentage >= 100;

                return (
                    <div key={q.typeQuota} className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--color-texte)]">{label}</span>
                            <span className="text-xs text-[var(--color-texte-muted)]">
                                {q.utilisationActuelle} / {q.limiteMax || '∞'}
                            </span>
                        </div>
                        {q.limiteMax > 0 && (
                            <>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            estBloque ? 'bg-red-500' : estAlerte ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${Math.min(100, pourcentage)}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[var(--color-texte-muted)]">{pourcentage.toFixed(0)}%</span>
                                    {q.alerte80pourcent && (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <AlertTriangle className="h-3 w-3" /> {t('monAbonnement.alerte80')}
                                        </span>
                                    )}
                                    {q.bloquer && (
                                        <span className="flex items-center gap-1 text-red-500">
                                            <XCircle className="h-3 w-3" /> {t('monAbonnement.bloque')}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// =============================================
// Historique Tab
// =============================================

interface HistoriqueEntry {
    id: string;
    planNom: string;
    statut: string;
    montantMensuel: number;
    dateDebut: string;
    dateFin: string;
    createdAt: string;
}

function HistoriqueTab() {
    const { t } = useTranslation('billing');
    const { data: historique, isLoading } = useQuery<HistoriqueEntry[] | undefined>({
        queryKey: ['historique-plans'],
        queryFn: async () => {
            const res = await apiClient.get<HistoriqueEntry[]>('/api/billing/historique-plans');
            return res.data;
        },
    });

    if (isLoading) return <MonAbonnementSkeleton />;

    return (
        <div className="space-y-4">
            {!historique || historique.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] py-8">
                    <History className="h-8 w-8 text-[var(--color-texte-muted)] opacity-50" />
                    <p className="mt-2 text-sm text-[var(--color-texte-muted)]">{t('monAbonnement.aucunHistorique')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                                <th className="px-4 py-3 font-medium">{t('monAbonnement.colonnes.plan')}</th>
                                <th className="px-4 py-3 font-medium">{t('monAbonnement.colonnes.periode')}</th>
                                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">{t('monAbonnement.colonnes.montant')}</th>
                                <th className="px-4 py-3 font-medium">{t('monAbonnement.colonnes.statut')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historique.map((entry) => (
                                <tr key={entry.id} className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]/50 transition-colors">
                                    <td className="px-4 py-3 font-medium">{entry.planNom}</td>
                                    <td className="px-4 py-3 text-[var(--color-texte-secondaire)]">
                                        {new Date(entry.dateDebut).toLocaleDateString('fr-FR')}
                                        {' → '}
                                        {entry.dateFin ? new Date(entry.dateFin).toLocaleDateString('fr-FR') : t('monAbonnement.enCours')}
                                    </td>
                                    <td className="hidden px-4 py-3 text-right font-mono sm:table-cell">
                                        {new Intl.NumberFormat('fr-FR').format(Number(entry.montantMensuel))} XAF/{t('monAbonnement.mois')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            entry.statut === 'ACTIF' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            entry.statut === 'SUSPENDU' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                            'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'
                                        }`}>
                                            {entry.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// =============================================
// Promotions Section — avec aperçu cascade
// =============================================

function PromotionsSection() {
    const { t } = useTranslation('promotions');
    const { data: detail } = useMonAbonnementDetail();
    const previewCascade = usePreviewCascade();
    const { data: historique } = useHistoriquePromotionsClient(1, 50);
    const [showCascade, setShowCascade] = useState(false);
    const [cascadeResult, setCascadeResult] = useState<ResultatCascadePromotions | null>(null);

    const handlePreviewCascade = async () => {
        try {
            const result = await previewCascade.mutateAsync(undefined);
            setCascadeResult(result?.cascade ?? null);
            setShowCascade(true);
        } catch {
            toast.error('Erreur lors de la simulation');
        }
    };

    // Calculer le total des économies réalisées
    const economiesTotal = (historique?.historique ?? []).reduce(
        (sum: number, h: any) => sum + Number(h.montantDeduit || 0), 0
    );
    const nbUtilisations = (historique?.historique ?? []).length;

    // Promotions expirant bientôt (dans les 14 jours)
    const maintenant = new Date();
    const dans14Jours = new Date(maintenant.getTime() + 14 * 24 * 60 * 60 * 1000);
    const promotionsExpirantBientot = (detail?.promotionsEligibles ?? []).filter(
        (p: Promotion) => p.dateFin && new Date(p.dateFin) <= dans14Jours && new Date(p.dateFin) > maintenant
    );

    return (
        <div className="border rounded-xl p-[clamp(0.75rem,0.6rem+0.5vw,1.5rem)] space-y-[var(--space-md)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Percent className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">{t('client.titre')}</h3>
                </div>
                <button
                    onClick={handlePreviewCascade}
                    disabled={previewCascade.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium disabled:opacity-50"
                >
                    {previewCascade.isPending ? t('client.calcul') : t('client.aperçuFacture')}
                </button>
            </div>

            {/* Dashboard résumé — économies + utilisations */}
            {(economiesTotal > 0 || nbUtilisations > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                    <div className="rounded-lg border border-[var(--color-success-200)] bg-[var(--color-success-50)] p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-[var(--color-success-600)]" />
                            <span className="text-xs font-medium text-[var(--color-success-700)]">Économies réalisées</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--color-success-700)]">
                            {economiesTotal.toLocaleString('fr-FR')} F
                        </p>
                    </div>
                    <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Gift className="h-4 w-4 text-[var(--color-dominante)]" />
                            <span className="text-xs font-medium text-muted-foreground">Promotions utilisées</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--color-texte)]">{nbUtilisations}</p>
                    </div>
                    <div className="hidden sm:block rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">Éligibles actuellement</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--color-texte)]">
                            {detail?.promotionsEligibles?.length ?? 0}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Alerte promotions expirant bientôt */}
            {promotionsExpirantBientot.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
                >
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                        {promotionsExpirantBientot.length} promotion{promotionsExpirantBientot.length > 1 ? 's' : ''} expire{promotionsExpirantBientot.length > 1 ? 'nt' : ''} bientôt
                    </span>
                </motion.div>
            )}

            {/* Code promo */}
            <CodePromoInput className="max-w-md" />

            {/* Promotions éligibles */}
            {detail?.promotionsEligibles && detail.promotionsEligibles.length > 0 ? (
                <div className="space-y-2 pt-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {t('client.promotionsAppliquees')}
                    </p>
                    <div className="grid gap-2">
                        <AnimatePresence mode="popLayout">
                            {detail.promotionsEligibles.map((promo: Promotion, index: number) => {
                                const estExpirantBientot = promotionsExpirantBientot.some((p: Promotion) => p.id === promo.id);
                                return (
                                    <motion.div
                                        key={promo.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 12 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.01 }}
                                        className={`flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors ${
                                            estExpirantBientot
                                                ? 'border-amber-200 bg-amber-50/50'
                                                : 'border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Tag className="h-4 w-4 text-[var(--color-dominante)]" />
                                            <div>
                                                <span className="text-sm font-medium">{promo.nom}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {SCOPE_LABELS[promo.scope]}
                                                </span>
                                                {estExpirantBientot && (
                                                    <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                                                        <Clock className="h-3 w-3" />
                                                        Expire bientôt
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--color-success-600)]">
                                            {formaterValeurPromotion(promo.typePromotion, Number(promo.valeur))}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground pt-2">
                    {t('client.aucunePromotion')}
                </p>
            )}

            {/* Aperçu cascade */}
            <AnimatePresence>
                {showCascade && cascadeResult && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 overflow-hidden"
                    >
                        <FactureBreakdown resultat={cascadeResult} />
                        <button
                            onClick={() => setShowCascade(false)}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('client.masquerDetail')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================
// Route definition
// =============================================

export const Route = createFileRoute('/_auth/mon-abonnement')({
    component: MonAbonnementPage,
});

export default MonAbonnementPage;
