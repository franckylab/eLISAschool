/**
 * ==================================
 * eLISAschool - Plans d'Abonnement (Tenant)
 * ==================================
 * Catalogue des plans disponibles avec détails, comparaison
 * et simulateur tarifaire intégré.
 * Refonte v3.1 — Hero + Plans + Packs + Promo + FAQ + Trust
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Calculator,
    Shield,
    ArrowRight,
    Check,
    X,
} from 'lucide-react';
import { PlanSimulator } from '@/features/billing/components/plan-simulator';
import { TarifsPreview } from '@/features/billing/components/tarifs-preview';
import { PacksSection } from '@/features/billing/components/packs-section';
import { CodePromoInput } from '@/features/billing/components/code-promo-input';
import { FAQSection } from '@/features/billing/components/faq-section';
import { TrustBadges } from '@/features/billing/components/trust-badges';
import { ElisaButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Plan } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';
import { usePlans, useAbonnementActuel, useUpgradePlan } from '@/features/billing/hooks/use-billing';

export const Route = createFileRoute('/_auth/plans')({
    component: PlansPage,
});

// =============================================
// Types
// =============================================

type ViewMode = 'cards' | 'compare' | 'simulator';

// =============================================
// Main Page
// =============================================

function PlansPage() {
    const { t } = useTranslation('billing');
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const { data: plans, isLoading } = usePlans();
    const { data: abonnement } = useAbonnementActuel();
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const views: { key: ViewMode; label: string; icon: typeof Package }[] = [
        { key: 'cards', label: t('plans.cards', 'Plans'), icon: Package },
        { key: 'compare', label: t('plans.compare', 'Comparer'), icon: Shield },
        { key: 'simulator', label: t('plans.simulator', 'Simuler'), icon: Calculator },
    ];

    return (
        <div className="space-y-0">
            {/* ─── Sticky Header ─── */}
            <header className="sticky top-0 z-30 border-b border-[var(--color-bordure)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-[var(--color-texte)]">
                            {t('plans.pageTitle', 'Nos Plans')}
                        </h1>
                        {abonnement?.plan && (
                            <span className="hidden items-center gap-2 rounded-full bg-[var(--color-dominante)]/10 px-3 py-1 text-xs font-medium text-[var(--color-dominante)] sm:flex">
                                {abonnement.plan.nom}
                                <span className="text-[var(--color-texte-secondaire)]">•</span>
                                <span className="text-[var(--color-texte-secondaire)]">{abonnement.statut}</span>
                            </span>
                        )}
                    </div>

                    {/* View mode switcher */}
                    <div className="flex gap-1 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/30 p-1">
                        {views.map((v) => {
                            const Icon = v.icon;
                            return (
                                <ElisaButton
                                    key={v.key}
                                    variant={viewMode === v.key ? 'primary' : 'ghost'}
                                    size="xs"
                                    onClick={() => setViewMode(v.key)}
                                    icon={<Icon className="h-4 w-4" />}
                                >
                                    <span className="hidden sm:inline">{v.label}</span>
                                </ElisaButton>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ─── Hero Section ─── */}
            <motion.section
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-gradient-to-b from-[var(--color-dominante)]/5 to-transparent py-12 text-center"
            >
                <div className="mx-auto max-w-3xl px-4">
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--color-texte)] sm:text-4xl">
                        {t('plans.hero.titre')}
                    </h2>
                    <p className="mt-3 text-lg text-[var(--color-texte-secondaire)]">
                        {t('plans.hero.sousTitre')}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-success-600)]">
                        ✓ {t('plans.sansEngagement')}
                    </p>
                </div>
            </motion.section>

            {/* ─── Main Content ─── */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                {/* Loading */}
                {isLoading && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse space-y-4 rounded-xl border border-[var(--color-bordure)] p-6">
                                <div className="h-6 w-1/3 rounded bg-[var(--color-surface-hover)]" />
                                <div className="h-10 w-1/2 rounded bg-[var(--color-surface-hover)]" />
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((j) => (
                                        <div key={j} className="h-4 rounded bg-[var(--color-surface-hover)]" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {!isLoading && (
                    <AnimatePresence mode="wait">
                        {viewMode === 'cards' && (
                            <motion.div
                                key="cards"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-12"
                            >
                                {/* Plans Grid */}
                                <TarifsPreview
                                    plans={plans || []}
                                    mode="tenant"
                                    selectedPlanId={selectedPlanId}
                                    onPlanSelect={setSelectedPlanId}
                                    showComparison={false}
                                />

                                {/* Upgrade CTA */}
                                {selectedPlanId && (
                                    <PlanUpgradeCTA
                                        planId={selectedPlanId}
                                        plans={plans || []}
                                        currentPlanId={abonnement?.plan?.id}
                                    />
                                )}

                                {/* Packs Quota */}
                                <PacksSection />

                                {/* Code Promo */}
                                <div className="mx-auto max-w-md">
                                    <CodePromoInput
                                        onCodeApplique={(code, remise) => {
                                            toast.success(`Code ${code} appliqué !`);
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                        {viewMode === 'compare' && (
                            <motion.div
                                key="compare"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ComparisonTable plans={plans || []} />
                            </motion.div>
                        )}
                        {viewMode === 'simulator' && (
                            <motion.div
                                key="simulator"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <PlanSimulator />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

            {/* ─── FAQ Section ─── */}
            <section className="border-t border-[var(--color-bordure)] bg-[var(--color-surface)]/50 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <FAQSection />
                </div>
            </section>

            {/* ─── Trust Badges ─── */}
            <section className="border-t border-[var(--color-bordure)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <TrustBadges />
                </div>
            </section>
        </div>
    );
}

// =============================================
// Plan Upgrade CTA
// =============================================

function PlanUpgradeCTA({ planId, plans, currentPlanId }: { planId: string; plans: Plan[]; currentPlanId?: string }) {
    const { t } = useTranslation('billing');
    const plan = plans.find(p => p.id === planId);
    const isCurrentPlan = planId === currentPlanId;

    const upgradeMutation = useUpgradePlan();

    const handleUpgrade = () => {
        upgradeMutation.mutate(planId, {
            onSuccess: () => toast.success(t('plans.upgradeSucces', 'Plan mis à jour avec succès')),
            onError: () => toast.error(t('plans.upgradeErreur', 'Erreur lors du changement de plan')),
        });
    };

    if (!plan) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="sticky bottom-4 rounded-xl border border-[var(--color-dominante)]/30 bg-[var(--color-surface)] p-6 shadow-lg"
        >
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div>
                    <h3 className="text-lg font-bold text-[var(--color-texte)]">
                        {plan.nom}
                    </h3>
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {plan.entitlements?.modules?.length ?? 0} {t('plans.modulesInclus', 'modules inclus')}
                        {plan.essai?.autorise && ` — ${t('plans.essaiJours', { count: plan.essai.dureeJours })}`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <ElisaButton
                        onClick={handleUpgrade}
                        disabled={isCurrentPlan || upgradeMutation.isPending}
                        isLoading={upgradeMutation.isPending}
                        variant={isCurrentPlan ? 'outline' : 'primary'}
                        icon={!isCurrentPlan && !upgradeMutation.isPending ? <ArrowRight className="h-4 w-4" /> : undefined}
                    >
                        {isCurrentPlan ? t('plans.planActuel') : t('plans.choisirCePlan', 'Choisir ce plan')}
                    </ElisaButton>
                </div>
            </div>
        </motion.div>
    );
}

export default PlansPage;

// =============================================
// Tableau comparatif avancé
// =============================================

function ComparisonTable({ plans }: { plans: Plan[] }) {
    const { t } = useTranslation('billing');

    const features = [
        { key: 'eleves', label: t('plans.compare.eleves', 'Élèves inclus'), format: (p: Plan) => p.quotas?.eleves === 0 ? '∞' : String(p.quotas?.eleves ?? 0) },
        { key: 'utilisateurs', label: t('plans.compare.utilisateurs', 'Utilisateurs'), format: (p: Plan) => p.quotas?.utilisateurs === 0 ? '∞' : String(p.quotas?.utilisateurs ?? 0) },
        { key: 'classes', label: t('plans.compare.classes', 'Classes'), format: (p: Plan) => p.quotas?.classes === 0 ? '∞' : String(p.quotas?.classes ?? 0) },
        { key: 'stockage', label: t('plans.compare.stockage', 'Stockage (Go)'), format: (p: Plan) => p.quotas?.stockageGo === 0 ? '∞' : String(p.quotas?.stockageGo ?? 0) },
        { key: 'sms', label: t('plans.compare.sms', 'SMS/mois'), format: (p: Plan) => p.quotas?.sms === 0 ? '∞' : String(p.quotas?.sms ?? 0) },
        { key: 'modules', label: t('plans.compare.modules', 'Modules inclus'), format: (p: Plan) => String(p.entitlements?.modules?.length ?? 0) },
        { key: 'fonctionnalites', label: t('plans.compare.fonctionnalites', 'Fonctionnalités'), format: (p: Plan) => String(p.entitlements?.fonctionnalites?.length ?? 0) },
        { key: 'prixEleve', label: t('plans.compare.prixEleve', 'Prix / élève sup.'), format: (p: Plan) => Number(p.tarification?.prixParEleve) > 0 ? `${formatPrix(Number(p.tarification?.prixParEleve))} F` : '—' },
        { key: 'essai', label: t('plans.compare.essai', 'Essai gratuit'), format: (p: Plan) => p.essai?.autorise ? `${p.essai.dureeJours}j` : '—' },
        { key: 'cycles', label: t('plans.compare.cycles', 'Cycles autorisés'), format: (p: Plan) => (p.cyclesAutorises ?? []).map((c: string) => c === 'MENSUEL' ? 'M' : c === 'TRIMESTRIEL' ? 'T' : c === 'SEMESTRIEL' ? 'S' : 'A').join('/') },
    ];

    const plansSorted = [...plans].sort((a, b) => (a.rang ?? 0) - (b.rang ?? 0));

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--color-bordure)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--color-texte-secondaire)]">
                            {t('plans.compare.caracteristique', 'Caractéristique')}
                        </th>
                        {plansSorted.map((p) => (
                            <th key={p.id} className="px-4 py-3 text-center">
                                <div className="font-bold text-[var(--color-texte)]">{p.nom}</div>
                                <div className="text-xs font-normal text-[var(--color-texte-secondaire)]">
                                    {formatPrix(Number(p.prixBase))} F/mois
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {features.map((f) => (
                        <tr key={f.key} className="border-b border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)]">
                            <td className="px-4 py-3 font-medium text-[var(--color-texte)]">{f.label}</td>
                            {plansSorted.map((p) => {
                                const val = f.format(p);
                                const isInfinity = val === '∞';
                                const isDash = val === '—';
                                return (
                                    <td key={p.id} className="px-4 py-3 text-center">
                                        <span className={cn(
                                            'text-sm',
                                            isInfinity && 'font-semibold text-[var(--color-success-600)]',
                                            isDash && 'text-[var(--color-texte-muted)]',
                                            !isInfinity && !isDash && 'font-medium text-[var(--color-texte)]',
                                        )}>
                                            {val}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {/* Ligne modules détaillés */}
                    <tr className="border-b border-[var(--color-bordure)]/50">
                        <td className="px-4 py-3 font-medium text-[var(--color-texte)]">
                            {t('plans.compare.exportPdf', 'Export PDF')}
                        </td>
                        {plansSorted.map((p) => (
                            <td key={p.id} className="px-4 py-3 text-center">
                                {p.entitlements?.fonctionnalites?.includes('export_pdf')
                                    ? <Check className="mx-auto h-4 w-4 text-[var(--color-success-600)]" />
                                    : <X className="mx-auto h-4 w-4 text-[var(--color-texte-muted)]" />}
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-[var(--color-bordure)]/50">
                        <td className="px-4 py-3 font-medium text-[var(--color-texte)]">
                            {t('plans.compare.apiRest', 'API REST')}
                        </td>
                        {plansSorted.map((p) => (
                            <td key={p.id} className="px-4 py-3 text-center">
                                {p.entitlements?.fonctionnalites?.includes('api_rest')
                                    ? <Check className="mx-auto h-4 w-4 text-[var(--color-success-600)]" />
                                    : <X className="mx-auto h-4 w-4 text-[var(--color-texte-muted)]" />}
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-[var(--color-bordure)]/50">
                        <td className="px-4 py-3 font-medium text-[var(--color-texte)]">
                            {t('plans.compare.sso', 'SSO / White Label')}
                        </td>
                        {plansSorted.map((p) => (
                            <td key={p.id} className="px-4 py-3 text-center">
                                {p.entitlements?.fonctionnalites?.includes('sso')
                                    ? <Check className="mx-auto h-4 w-4 text-[var(--color-success-600)]" />
                                    : <X className="mx-auto h-4 w-4 text-[var(--color-texte-muted)]" />}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
