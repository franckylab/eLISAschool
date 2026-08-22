/**
 * ==================================
 * eLISAschool - Plateforme — Promotions v4.0
 * ==================================
 *
 * Dashboard des promotions et packages (multi-scopes).
 * 3 onglets : Promotions (CRUD), Packages (CRUD), Simulateur cascade.
 * Responsive 320px-2560px, dark mode, animations.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Plus, Pencil, Trash2, AlertCircle, RefreshCw,
    Package, Layers, Calculator, Search, Filter, BarChart3,
    TrendingDown, Building2, Tag, Calendar, Download, Copy,
    Clock, Zap, Upload, FileSpreadsheet,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    type Promotion,
    type PackagePromotion,
    ScopePromotion,
    TypeAutoPromotion,
    SCOPE_LABELS,
    AUTO_PROMO_LABELS,
    formaterValeurPromotion,
} from '@/features/billing/types/promotion.types';
import {
    usePromotions,
    usePackages,
    useTogglePromotion,
    useDeletePromotion,
    useDeletePackage,
    useSimulerCascade,
    useUsageStats,
    exporterUsageStatsCSV,
    useDupliquerPromotion,
    usePromotionsAnalytics,
    exporterPromotionsCSV,
    useImporterPromotionsCSV,
} from '@/features/billing/hooks/use-promotions';
import { PromoBadge, StatutBadge } from '@/features/billing/components/promo-badge';
import { PackageCard } from '@/features/billing/components/package-card';
import { usePacks } from '@/features/billing/hooks/use-billing';
import { FactureBreakdown } from '@/features/billing/components/facture-breakdown';
import { PromotionFormModal } from '@/features/billing/components/promotion-form-modal';
import { CustomModal } from '@/components/modals/CustomModal';

// =============================================
// Types
// =============================================

type TabId = 'promotions' | 'packages' | 'simulateur' | 'statistiques';

// =============================================
// Skeleton
// =============================================

function PromotionsSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-4 flex-1 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// =============================================
// Page principale
// =============================================

function PromotionsPage() {
    const { t } = useTranslation('promotions');
    const [tab, setTab] = useState<TabId>('promotions');

    // Filtres
    const [scopeFilter, setScopeFilter] = useState<string>('');
    const [actifFilter, setActifFilter] = useState<boolean | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Modals
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [editPromo, setEditPromo] = useState<Promotion | null>(null);
    const [editPackage, setEditPackage] = useState<PackagePromotion | null>(null);
    const [packageModalOpen, setPackageModalOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
    const [packageToDelete, setPackageToDelete] = useState<PackagePromotion | null>(null);
    const [csvImportOpen, setCsvImportOpen] = useState(false);
    const [csvContent, setCsvContent] = useState('');

    // Hooks
    const { data: promosData, isLoading: isLoadingPromos, isError: isErrorPromos, refetch: refetchPromos } = usePromotions({
        scope: scopeFilter || undefined,
        actif: actifFilter,
        page,
        limit: 20,
    });
    const { data: packages, isLoading: isLoadingPackages, isError: isErrorPackages, refetch: refetchPackages } = usePackages();
    const { data: packs = [] } = usePacks();
    const packNames = Object.fromEntries(packs.map((p) => [p.id, p.nom]));
    const toggleMutation = useTogglePromotion();
    const deletePromoMutation = useDeletePromotion();
    const deletePackageMutation = useDeletePackage();
    const dupliquerMutation = useDupliquerPromotion();
    const simulerCascade = useSimulerCascade();
    const importerCSVMutation = useImporterPromotionsCSV();

    const promotions = promosData?.data ?? [];
    const pagination = promosData?.pagination;

    // Filtrage client-side pour la recherche
    const filteredPromotions = search
        ? promotions.filter(p =>
            p.nom.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            (p.codeCoupon && p.codeCoupon.toLowerCase().includes(search.toLowerCase()))
        )
        : promotions;

    // Handlers
    const handleTogglePromo = useCallback(async (id: string) => {
        try {
            await toggleMutation.mutateAsync(id);
            toast.success(t('messages.modifierSucces'));
        } catch {
            toast.error(t('messages.erreurToggle'));
        }
    }, [toggleMutation, t]);

    const handleDeletePromo = useCallback(async () => {
        if (!promoToDelete) return;
        try {
            await deletePromoMutation.mutateAsync(promoToDelete.id);
            toast.success(t('messages.supprimerSucces'));
            setPromoToDelete(null);
        } catch {
            toast.error(t('messages.erreurSuppression'));
        }
    }, [promoToDelete, deletePromoMutation, t]);

    const handleDeletePackage = useCallback(async () => {
        if (!packageToDelete) return;
        try {
            await deletePackageMutation.mutateAsync(packageToDelete.id);
            toast.success(t('messages.packageSupprime'));
            setPackageToDelete(null);
        } catch {
            toast.error(t('messages.erreurSuppression'));
        }
    }, [packageToDelete, deletePackageMutation, t]);

    const openEditPromo = (p: Promotion) => { setEditPromo(p); setPromoModalOpen(true); };
    const openCreatePromo = () => { setEditPromo(null); setPromoModalOpen(true); };
    const openEditPackage = (b: PackagePromotion) => { setEditPackage(b); setPackageModalOpen(true); };
    const openCreatePackage = () => { setEditPackage(null); setPackageModalOpen(true); };

    const handleDupliquer = useCallback(async (id: string) => {
        try {
            const copie = await dupliquerMutation.mutateAsync(id);
            toast.success(t('messages.dupliquerSucces'));
            if (copie) openEditPromo(copie);
        } catch {
            toast.error(t('messages.erreurDuplication'));
        }
    }, [dupliquerMutation, t]);

    // Simulateur
    const [simulParams, setSimulParams] = useState({ montantPlan: 50000, montantPacks: 15000, montantModules: 10000 });
    const [simulResult, setSimulResult] = useState<any>(null);

    const handleSimuler = async () => {
        try {
            const result = await simulerCascade.mutateAsync(simulParams);
            setSimulResult(result);
        } catch {
            toast.error('Erreur lors de la simulation');
        }
    };

    const TABS: { id: TabId; label: string; icon: any }[] = [
        { id: 'promotions', label: t('tabs.promotions'), icon: Layers },
        { id: 'packages', label: t('tabs.packages'), icon: Package },
        { id: 'simulateur', label: t('tabs.simulateur'), icon: Calculator },
        { id: 'statistiques', label: t('tabs.statistiques'), icon: BarChart3 },
    ];

    const scopes = Object.entries(SCOPE_LABELS);

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-texte)]">{t('titre')}</h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)]">{t('description')}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                    {tab === 'promotions' && (
                        <>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={() => exporterPromotionsCSV(scopeFilter || undefined, actifFilter)}
                                icon={<Download className="h-3.5 w-3.5 xs:h-4 xs:w-4" />}
                            >
                                <span className="hidden sm:inline">{t('actions.exporterCSV')}</span>
                            </ElisaButton>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={() => setCsvImportOpen(true)}
                                icon={<Upload className="h-3.5 w-3.5 xs:h-4 xs:w-4" />}
                            >
                                <span className="hidden sm:inline">{t('actions.importerCSV')}</span>
                            </ElisaButton>
                        </>
                    )}
                    {tab === 'statistiques' && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            onClick={() => exporterUsageStatsCSV()}
                            icon={<FileSpreadsheet className="h-3.5 w-3.5 xs:h-4 xs:w-4" />}
                        >
                            <span className="hidden sm:inline">{t('actions.exporterStats')}</span>
                        </ElisaButton>
                    )}
                    {tab === 'packages' ? (
                        <ElisaButton onClick={openCreatePackage} size="sm">
                            <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                            <span className="hidden xs:inline">{t('actions.creerPackage')}</span>
                            <span className="xs:hidden">{t('actions.creer')}</span>
                        </ElisaButton>
                    ) : (
                        <ElisaButton onClick={openCreatePromo} size="sm">
                            <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                            <span className="hidden xs:inline">{t('actions.creer')}</span>
                        </ElisaButton>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            tab === id
                                ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* ====== TAB PROMOTIONS ====== */}
            {tab === 'promotions' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {/* Filtres */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-texte-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('filtres.recherche')}
                                    className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
                                />
                            </div>
                            <div className="flex items-center gap-1 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-0.5">
                                <button
                                    onClick={() => setActifFilter(undefined)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${!actifFilter ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]' : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'}`}
                                >
                                    {t('filtres.tous')}
                                </button>
                                <button
                                    onClick={() => setActifFilter(true)}
                                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${actifFilter === true ? 'bg-green-500/10 text-green-400' : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'}`}
                                >
                                    {t('filtres.actifs')}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto">
                            <Filter className="h-3.5 w-3.5 shrink-0 text-[var(--color-texte-muted)]" />
                            <button
                                onClick={() => setScopeFilter('')}
                                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${!scopeFilter ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]' : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'}`}
                            >
                                {t('filtres.tous')}
                            </button>
                            {scopes.map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setScopeFilter(key)}
                                    className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${scopeFilter === key ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]' : 'text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoadingPromos && <PromotionsSkeleton />}

                    {/* Error */}
                    {isErrorPromos && (
                        <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                            <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                            <p className="text-[var(--color-texte)]">{t('messages.erreurChargement')}</p>
                            <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetchPromos()} icon={<RefreshCw className="h-4 w-4" />}>
                                {t('messages.ressayer')}
                            </ElisaButton>
                        </div>
                    )}

                    {/* Table */}
                    {!isLoadingPromos && !isErrorPromos && (
                        <>
                            <div className="overflow-x-auto rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                                            <th className="px-4 py-3 font-medium">{t('colonnes.code')}</th>
                                            <th className="px-4 py-3 font-medium">{t('colonnes.nom')}</th>
                                            <th className="px-4 py-3 font-medium">{t('colonnes.scope')}</th>
                                            <th className="hidden px-4 py-3 font-medium sm:table-cell">{t('colonnes.type')}</th>
                                            <th className="px-4 py-3 font-medium">{t('colonnes.valeur')}</th>
                                            <th className="hidden px-4 py-3 font-medium lg:table-cell">{t('colonnes.utilisations')}</th>
                                            <th className="px-4 py-3 font-medium">{t('colonnes.statut')}</th>
                                            <th className="hidden px-4 py-3 font-medium lg:table-cell">{t('colonnes.dateDebut')}</th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPromotions.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                                                            <Sparkles className="h-7 w-7 text-[var(--color-texte-muted)]" />
                                                        </div>
                                                        <p className="text-[var(--color-texte-secondaire)]">{t('messages.aucunePromotion')}</p>
                                                        <ElisaButton size="sm" className="mt-3" onClick={openCreatePromo} icon={<Plus className="h-4 w-4" />}>
                                                            {t('actions.creer')}
                                                        </ElisaButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        <AnimatePresence mode="popLayout">
                                            {filteredPromotions.map((p, index) => (
                                                <motion.tr
                                                    key={p.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ delay: index * 0.03, duration: 0.25, ease: 'easeOut' }}
                                                    whileHover={{ backgroundColor: 'var(--color-surface-hover)', transition: { duration: 0.15 } }}
                                                    className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)] cursor-default"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="max-w-[200px] truncate">{p.nom}</div>
                                                        {/* v5 — Indicateurs auto-promo + programmation */}
                                                        <div className="mt-0.5 flex items-center gap-1">
                                                            {p.config?.typeAutomatique && p.config.typeAutomatique !== TypeAutoPromotion.MANUELLE && (
                                                                <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium bg-violet-500/10 text-violet-400" title={AUTO_PROMO_LABELS[p.config.typeAutomatique]}>
                                                                    <Zap className="h-2.5 w-2.5" />
                                                                    {t(`autoPromo.${p.config.typeAutomatique}`)}
                                                                </span>
                                                            )}
                                                            {p.estProgrammee && (
                                                                <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400" title={p.dateProgrammation ? new Date(p.dateProgrammation).toLocaleString('fr-FR') : ''}>
                                                                    <Clock className="h-2.5 w-2.5" />
                                                                    {t('form.estProgrammee')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <PromoBadge scope={p.scope} type={p.typePromotion} valeur={p.valeur} compact />
                                                    </td>
                                                    <td className="hidden px-4 py-3 text-xs sm:table-cell text-[var(--color-texte-secondaire)]">
                                                        {p.dureeApplication === 'PERMANENTE' ? t('messages.permanente') : p.dureeApplication === 'N_CYCLES' ? `${p.conditions?.nbCycles ?? '?'} cycles` : t('messages.premiereFacture')}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {formaterValeurPromotion(p.typePromotion, p.valeur)}
                                                    </td>
                                                    <td className="hidden px-4 py-3 text-xs lg:table-cell">
                                                        {p.utilisations}{p.maxUtilisations ? ` / ${p.maxUtilisations}` : ''}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatutBadge actif={p.actif} dateFin={p.dateFin} compact />
                                                    </td>
                                                    <td className="hidden px-4 py-3 text-xs lg:table-cell text-[var(--color-texte-muted)]">
                                                        {new Date(p.dateDebut).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <ElisaButton
                                                                variant="ghost"
                                                                size="xs"
                                                                onClick={() => handleTogglePromo(p.id)}
                                                                icon={<span className="text-xs">{p.actif ? '🟢' : '⚪'}</span>}
                                                            >
                                                                <span className="hidden sm:inline">{p.actif ? t('actions.desactiver') : t('actions.activer')}</span>
                                                            </ElisaButton>
                                                            <ElisaButton variant="ghost" size="xs" onClick={() => openEditPromo(p)} icon={<Pencil className="h-3.5 w-3.5" />}>
                                                                <span className="hidden sm:inline">{t('actions.modifier')}</span>
                                                            </ElisaButton>
                                                            <ElisaButton
                                                                variant="ghost"
                                                                size="xs"
                                                                onClick={() => handleDupliquer(p.id)}
                                                                disabled={dupliquerMutation.isPending}
                                                                icon={<Copy className="h-3.5 w-3.5" />}
                                                            >
                                                                <span className="hidden sm:inline">{t('actions.dupliquer')}</span>
                                                            </ElisaButton>
                                                            <ElisaButton
                                                                variant="ghost"
                                                                size="xs"
                                                                onClick={() => setPromoToDelete(p)}
                                                                className="text-[var(--color-danger-500)]"
                                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                                            >
                                                                <span className="hidden sm:inline">{t('actions.supprimer')}</span>
                                                            </ElisaButton>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 pt-3">
                                    <p className="text-xs text-[var(--color-texte-muted)]">
                                        {pagination.total} {pagination.total > 1 ? t('messages.promotionPluriel') : t('messages.promotionSingulier')} — {t('pagination.page', { page: pagination.page, totalPages: pagination.totalPages })}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page <= 1}
                                            className="rounded-lg border border-[var(--color-bordure)] px-3 py-1.5 text-xs text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {t('pagination.precedent')}
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page >= pagination.totalPages}
                                            className="rounded-lg border border-[var(--color-bordure)] px-3 py-1.5 text-xs text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {t('pagination.suivant')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}

            {/* ====== TAB PACKAGES ====== */}
            {tab === 'packages' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {isLoadingPackages && <PromotionsSkeleton />}

                    {isErrorPackages && (
                        <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                            <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                            <p className="text-[var(--color-texte)]">{t('messages.erreurChargementPackages')}</p>
                            <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetchPackages()} icon={<RefreshCw className="h-4 w-4" />}>
                                {t('messages.ressayer')}
                            </ElisaButton>
                        </div>
                    )}

                    {!isLoadingPackages && !isErrorPackages && (
                        <>
                            {(!packages || packages.length === 0) ? (
                                <div className="flex flex-col items-center rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] py-12">
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                                        <Package className="h-7 w-7 text-[var(--color-texte-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-texte-secondaire)]">{t('messages.aucunPackage')}</p>
                                    <p className="mt-1 text-xs text-[var(--color-texte-muted)]">{t('package.minPacks')}</p>
                                    <ElisaButton size="sm" className="mt-3" onClick={openCreatePackage} icon={<Plus className="h-4 w-4" />}>
                                        {t('actions.creerPackage')}
                                    </ElisaButton>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {packages.map((p, index) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <PackageCard
                                                pkg={p}
                                                packNames={packNames}
                                                onEdit={openEditPackage}
                                                onDelete={(pkg) => setPackageToDelete(pkg)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}

            {/* ====== TAB SIMULATEUR ====== */}
            {tab === 'simulateur' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 sm:p-6">
                        <h2 className="text-lg font-semibold text-[var(--color-texte)] mb-4 flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-[var(--color-dominante)]" />
                            {t('simulateur.titre')}
                        </h2>

                        {/* Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <SimulInput
                                label={t('simulateur.montantPlan')}
                                value={simulParams.montantPlan}
                                onChange={(v) => setSimulParams(p => ({ ...p, montantPlan: v }))}
                            />
                            <SimulInput
                                label={t('simulateur.montantPacks')}
                                value={simulParams.montantPacks}
                                onChange={(v) => setSimulParams(p => ({ ...p, montantPacks: v }))}
                            />
                            <SimulInput
                                label={t('simulateur.montantModules')}
                                value={simulParams.montantModules}
                                onChange={(v) => setSimulParams(p => ({ ...p, montantModules: v }))}
                            />
                        </div>

                        <ElisaButton
                            onClick={handleSimuler}
                            disabled={simulerCascade.isPending}
                            icon={<Calculator className="h-4 w-4" />}
                        >
                            {simulerCascade.isPending ? t('simulateur.enCours') : t('simulateur.bouton')}
                        </ElisaButton>
                        {/* Résultat */}
                        {simulResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6"
                            >
                                <FactureBreakdown resultat={simulResult} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ====== TAB STATISTIQUES ====== */}
            {tab === 'statistiques' && (
                <StatsTab />
            )}

            {/* ====== MODALS ====== */}
            <PromotionFormModal
                open={promoModalOpen}
                onOpenChange={setPromoModalOpen}
                promotion={editPromo}
            />
            <PromotionFormModal
                open={packageModalOpen}
                onOpenChange={setPackageModalOpen}
                modePackage
                pkg={editPackage}
            />
            <ConfirmationModal
                isOpen={!!promoToDelete}
                title={t('messages.titreSupprimerPromo')}
                message={t('messages.confirmSuppression')}
                variant="danger"
                confirmLabel={t('actions.supprimer')}
                cancelLabel={t('form.annuler')}
                onConfirm={handleDeletePromo}
                onCancel={() => setPromoToDelete(null)}
            />
            <ConfirmationModal
                isOpen={!!packageToDelete}
                title={t('messages.titreSupprimerPackage')}
                message={t('messages.confirmSuppressionPackage')}
                variant="danger"
                confirmLabel={t('actions.supprimer')}
                cancelLabel={t('form.annuler')}
                onConfirm={handleDeletePackage}
                onCancel={() => setPackageToDelete(null)}
            />

            {/* ====== MODAL IMPORT CSV ====== */}
            <CustomModal
                open={csvImportOpen}
                onOpenChange={setCsvImportOpen}
                title={t('importCsv.titre')}
                description={t('importCsv.description')}
                size="lg"
                footer={<>
                    <ElisaButton variant="outline" size="sm" onClick={() => setCsvImportOpen(false)}>
                        {t('form.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        size="sm"
                        onClick={() => {
                            if (!csvContent.trim()) return;
                            importerCSVMutation.mutate(csvContent, {
                                onSuccess: (result) => {
                                    toast.success(
                                        `${result.created} créées, ${result.updated} mises à jour${result.errors.length > 0 ? `, ${result.errors.length} erreurs` : ''}`
                                    );
                                    setCsvImportOpen(false);
                                    setCsvContent('');
                                },
                                onError: () => toast.error(t('importCsv.erreur')),
                            });
                        }}
                        disabled={importerCSVMutation.isPending || !csvContent.trim()}
                    >
                        {importerCSVMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        {t('importCsv.importer')}
                    </ElisaButton>
                </>}
            >
                <div className="space-y-3">
                    <div className="rounded-lg bg-[var(--color-surface-hover)] p-3 text-xs font-mono text-[var(--color-texte-muted)]">
                        Code;Nom;Scope;Type;Valeur;Durée;Statut;Date début;Date fin;Priorité;Coupon;Cumulable
                    </div>
                    <textarea
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                        placeholder={t('importCsv.placeholder')}
                        rows={8}
                        className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-dominante)] hover:underline">
                        <Upload className="h-4 w-4" />
                        {t('importCsv.fichier')}
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setCsvContent(ev.target?.result as string);
                                    reader.readAsText(file, 'UTF-8');
                                }
                            }}
                        />
                    </label>
                </div>
            </CustomModal>
        </div>
    );
}

// =============================================
// Composants utilitaires
// =============================================

/** Couleurs des scopes pour les graphiques */
const SCOPE_CHART_COLORS: Record<string, string> = {
    PLAN: '#3b82f6',
    PACK: '#10b981',
    MODULE: '#8b5cf6',
    PACKAGE: '#f59e0b',
    QUOTA: '#06b6d4',
};

/** Composant Analytics — visualisations avancées avec tooltips interactifs */
function AnalyticsPanels() {
    const { t } = useTranslation('promotions');
    const { data: analytics, isLoading } = usePromotionsAnalytics();
    const [tooltipScope, setTooltipScope] = useState<{ scope: string; montant: number; pourcentage: number } | null>(null);
    const [tooltipSparkline, setTooltipSparkline] = useState<{ mois: string; montant: number; x: number; y: number } | null>(null);

    if (isLoading) return <PromotionsSkeleton />;
    if (!analytics) return null;

    const { repartitionScope, evolutionMensuelle, topPromotions, repartitionAutoPromo, tauxActivite } = analytics;

    // Max pour normaliser les barres
    const maxMontantScope = Math.max(...repartitionScope.map(r => r.montantDeduit), 1);
    const maxMontantEvolution = Math.max(...evolutionMensuelle.map(e => e.montantDeduit), 1);
    const maxMontantTop = Math.max(...topPromotions.map(t => t.montantDeduit), 1);
    const totalAutoPromo = repartitionAutoPromo.reduce((s, r) => s + r.nbPromotions, 0);

    // SVG sparkline points
    const sparkW = 280;
    const sparkH = 60;
    const sparkPoints = evolutionMensuelle.length > 0
        ? evolutionMensuelle.map((e, i) => {
            const x = (i / Math.max(evolutionMensuelle.length - 1, 1)) * sparkW;
            const y = sparkH - (e.montantDeduit / maxMontantEvolution) * sparkH;
            return `${x},${y}`;
        }).join(' ')
        : '';

    // Total déduit pour la barre cascade
    const totalDeduit = repartitionScope.reduce((s, r) => s + r.montantDeduit, 0);

    return (
        <div className="space-y-4">
            {/* Barre cascade — visualisation empilée des 5 phases */}
            {repartitionScope.length > 0 && totalDeduit > 0 && (
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-[var(--color-dominante)]" />
                        {t('analytics.cascadeProgress', 'Progression cascade')}
                        <span className="ml-auto text-xs font-normal text-[var(--color-texte-muted)]">
                            {totalDeduit.toLocaleString('fr-FR')} F {t('analytics.deduitTotal', 'déduits au total')}
                        </span>
                    </h3>
                    {/* Barre empilée */}
                    <div className="flex h-6 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                        {repartitionScope.map((r) => {
                            const widthPct = (r.montantDeduit / totalDeduit) * 100;
                            if (widthPct < 0.5) return null;
                            return (
                                <div
                                    key={r.scope}
                                    className="relative group flex items-center justify-center transition-all duration-500"
                                    style={{
                                        width: `${widthPct}%`,
                                        backgroundColor: SCOPE_CHART_COLORS[r.scope] ?? '#6b7280',
                                    }}
                                >
                                    {widthPct >= 8 && (
                                        <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                            {Math.round(widthPct)}%
                                        </span>
                                    )}
                                    {/* Tooltip hover */}
                                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 z-20 -translate-x-1/2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5 text-xs shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="font-semibold">{SCOPE_LABELS[r.scope as ScopePromotion] ?? r.scope}</p>
                                        <p className="text-[var(--color-texte-muted)]">{r.montantDeduit.toLocaleString('fr-FR')} F · {r.pourcentage}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Légende inline */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {repartitionScope.map((r) => (
                            <span key={r.scope} className="flex items-center gap-1.5 text-[11px] text-[var(--color-texte-muted)]">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SCOPE_CHART_COLORS[r.scope] ?? '#6b7280' }} />
                                {SCOPE_LABELS[r.scope as ScopePromotion] ?? r.scope}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {/* Ligne 1 : Répartition scopes + Évolution mensuelle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Répartition par scope */}
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-blue-400" />
                        {t('analytics.repartitionScope', 'Répartition par scope')}
                    </h3>
                    {repartitionScope.length === 0 ? (
                        <p className="text-xs text-[var(--color-texte-muted)] py-4 text-center">{t('stats.aucuneDonnee')}</p>
                    ) : (
                        <div className="space-y-2.5">
                            {repartitionScope.map((r) => (
                                <div key={r.scope}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCOPE_CHART_COLORS[r.scope] ?? '#6b7280' }} />
                                            {SCOPE_LABELS[r.scope as ScopePromotion] ?? r.scope}
                                        </span>
                                        <span className="text-[var(--color-texte-muted)]">
                                            {r.montantDeduit.toLocaleString('fr-FR')} F · {r.pourcentage}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 w-full rounded-full bg-[var(--color-surface-hover)] relative group cursor-pointer"
                                        onMouseEnter={() => setTooltipScope({ scope: r.scope, montant: r.montantDeduit, pourcentage: r.pourcentage })}
                                        onMouseLeave={() => setTooltipScope(null)}
                                    >
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(r.montantDeduit / maxMontantScope) * 100}%`,
                                                backgroundColor: SCOPE_CHART_COLORS[r.scope] ?? '#6b7280',
                                            }}
                                        />
                                        {/* Tooltip */}
                                        {tooltipScope && tooltipScope.scope === r.scope && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-texte)] shadow-lg whitespace-nowrap pointer-events-none">
                                                {SCOPE_LABELS[r.scope as ScopePromotion] ?? r.scope}: {r.montantDeduit.toLocaleString('fr-FR')} F ({r.pourcentage}%)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Évolution mensuelle (sparkline) */}
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-green-400" />
                        {t('analytics.evolutionMensuelle', 'Évolution mensuelle')}
                    </h3>
                    {evolutionMensuelle.length === 0 ? (
                        <p className="text-xs text-[var(--color-texte-muted)] py-4 text-center">{t('stats.aucuneDonnee')}</p>
                    ) : (
                        <div className="relative">
                            <svg viewBox={`0 0 ${sparkW} ${sparkH + 10}`} className="w-full h-16" preserveAspectRatio="none">
                                {/* Ligne */}
                                <polyline
                                    points={sparkPoints}
                                    fill="none"
                                    stroke="var(--color-dominante)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Points avec tooltips */}
                                {evolutionMensuelle.map((e, i) => {
                                    const x = (i / Math.max(evolutionMensuelle.length - 1, 1)) * sparkW;
                                    const y = sparkH - (e.montantDeduit / maxMontantEvolution) * sparkH;
                                    return (
                                        <g key={e.mois}>
                                            <circle cx={x} cy={y} r="3" fill="var(--color-dominante)" opacity="0.8" />
                                            {/* Zone hover plus large pour tooltip */}
                                            <rect
                                                x={x - 10}
                                                y={0}
                                                width={20}
                                                height={sparkH + 10}
                                                fill="transparent"
                                                onMouseEnter={() => setTooltipSparkline({ mois: e.mois, montant: e.montantDeduit, x, y })}
                                                onMouseLeave={() => setTooltipSparkline(null)}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>
                            {/* Tooltip sparkline */}
                            {tooltipSparkline && (
                                <div
                                    className="absolute pointer-events-none z-10 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-texte)] shadow-lg whitespace-nowrap"
                                    style={{
                                        left: `${(tooltipSparkline.x / sparkW) * 100}%`,
                                        top: `${(tooltipSparkline.y / (sparkH + 10)) * 100}%`,
                                        transform: 'translate(-50%, -100%)'
                                    }}
                                >
                                    {tooltipSparkline.mois}: {tooltipSparkline.montant.toLocaleString('fr-FR')} F
                                </div>
                            )}
                            <div className="flex justify-between mt-1">
                                {evolutionMensuelle.map((e) => (
                                    <span key={e.mois} className="text-[10px] text-[var(--color-texte-muted)]">
                                        {e.mois.slice(5)}/{e.mois.slice(2, 4)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ligne 2 : Top promotions + Taux activité + Auto-promo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Top 5 promotions */}
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-amber-400" />
                        {t('analytics.topPromotions', 'Top promotions')}
                    </h3>
                    {topPromotions.length === 0 ? (
                        <p className="text-xs text-[var(--color-texte-muted)] py-4 text-center">{t('stats.aucuneDonnee')}</p>
                    ) : (
                        <div className="space-y-2.5">
                            {topPromotions.map((p, i) => (
                                <div key={p.code} className="flex items-start gap-2">
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                                        i === 1 ? 'bg-gray-400/20 text-gray-400' :
                                        i === 2 ? 'bg-orange-600/20 text-orange-500' :
                                        'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'
                                    }`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-[var(--color-texte)] truncate">{p.nom}</p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-[10px] text-[var(--color-texte-muted)]">{p.nbUtilisations}× · {SCOPE_LABELS[p.scope as ScopePromotion] ?? p.scope}</span>
                                            <span className="text-[10px] font-medium text-green-400">−{p.montantDeduit.toLocaleString('fr-FR')} F</span>
                                        </div>
                                        <div className="h-1 mt-1 w-full rounded-full bg-[var(--color-surface-hover)]">
                                            <div className="h-1 rounded-full bg-amber-400/60" style={{ width: `${(p.montantDeduit / maxMontantTop) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Taux d'activité */}
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        {t('analytics.tauxActivite', 'Taux d\'activité')}
                    </h3>
                    <div className="flex flex-col items-center py-2">
                        {/* Jauge circulaire SVG */}
                        <svg viewBox="0 0 100 100" className="h-24 w-24">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-surface-hover)" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={tauxActivite.tauxActivation >= 70 ? '#10b981' : tauxActivite.tauxActivation >= 40 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(tauxActivite.tauxActivation / 100) * 251.2} 251.2`}
                                transform="rotate(-90 50 50)"
                            />
                            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill="var(--color-texte)" fontSize="18">
                                {tauxActivite.tauxActivation}%
                            </text>
                        </svg>
                        <div className="mt-2 text-center">
                            <p className="text-xs text-[var(--color-texte-secondaire)]">
                                {tauxActivite.promotionsUtilisees30j} / {tauxActivite.promotionsActives}
                            </p>
                            <p className="text-[10px] text-[var(--color-texte-muted)]">
                                {t('analytics.utilisees30j', 'utilisées (30 derniers jours)')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Auto-promotions */}
                <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-texte)] mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-pink-400" />
                        {t('analytics.autoPromos', 'Auto-promotions')}
                    </h3>
                    {repartitionAutoPromo.length === 0 ? (
                        <p className="text-xs text-[var(--color-texte-muted)] py-4 text-center">{t('analytics.aucuneAutoPromo', 'Aucune auto-promotion configurée')}</p>
                    ) : (
                        <div className="space-y-2">
                            {repartitionAutoPromo.map((r) => (
                                <div key={r.type} className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-400">
                                        <Zap className="h-3 w-3" />
                                        {AUTO_PROMO_LABELS[r.type as TypeAutoPromotion] ?? r.type}
                                    </span>
                                    <span className="text-xs text-[var(--color-texte-muted)]">
                                        {r.nbPromotions} · {totalAutoPromo > 0 ? Math.round((r.nbPromotions / totalAutoPromo) * 100) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsTab() {
    const { t } = useTranslation('promotions');
    const [statsPage, setStatsPage] = useState(1);
    const [scopeFilter, setScopeFilter] = useState<string>('');
    const { data: stats, isLoading, isError, refetch } = useUsageStats(statsPage, 20, scopeFilter ? { scope: scopeFilter } : undefined);

    const historique = stats?.historique ?? [];
    const parPromotion = stats?.parPromotion ?? [];
    const pagination = stats?.pagination;
    const resume = stats?.resume;

    // KPIs — utiliser le résumé serveur (précis) ou fallback calcul client
    const totalUtilisations = resume?.totalUtilisations ?? pagination?.total ?? 0;
    const montantTotalDeduit = resume?.totalDeduit ?? parPromotion.reduce((sum, p) => sum + Number(p.montantTotalDeduit || 0), 0);
    const nbPromotionsDistinctes = resume?.nbPromotionsDistinctes ?? parPromotion.length;
    const nbEtablissements = new Set(historique.map((h) => h.etablissementId)).size;

    const kpis = [
        { label: t('stats.totalUtilisations'), value: totalUtilisations.toLocaleString('fr-FR'), icon: Tag, color: 'text-blue-400' },
        { label: t('stats.montantTotalDeduit'), value: `${montantTotalDeduit.toLocaleString('fr-FR')} F`, icon: TrendingDown, color: 'text-green-400' },
        { label: t('stats.promotionsActives'), value: nbPromotionsDistinctes.toLocaleString('fr-FR'), icon: Sparkles, color: 'text-amber-400' },
        { label: t('stats.etablissementsConcernes'), value: nbEtablissements.toLocaleString('fr-FR'), icon: Building2, color: 'text-violet-400' },
    ];

    const handleExport = useCallback(() => {
        exporterUsageStatsCSV(scopeFilter ? { scope: scopeFilter } : undefined);
    }, [scopeFilter]);

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`h-4 w-4 ${kpi.color}`} />
                                <span className="text-xs text-[var(--color-texte-muted)]">{kpi.label}</span>
                            </div>
                            <p className="text-lg font-bold text-[var(--color-texte)]">{kpi.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Analytics avancées */}
            <AnalyticsPanels />

            {/* Filtre scope + Export CSV */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[var(--color-texte-muted)]" />
                    <select
                        value={scopeFilter}
                        onChange={(e) => { setScopeFilter(e.target.value); setStatsPage(1); }}
                        className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-texte)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
                    >
                        <option value="">{t('stats.tousScopes', 'Tous les scopes')}</option>
                        <option value="PLAN">Plan</option>
                        <option value="PACK">Packs</option>
                        <option value="MODULE">Modules</option>
                        <option value="PACKAGE">Packages</option>
                        <option value="QUOTA">Quota</option>
                    </select>
                </div>
                <ElisaButton
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    icon={<Download className="h-3.5 w-3.5" />}
                >
                    {t('stats.exporterCSV', 'Export CSV')}
                </ElisaButton>
            </div>

            {isLoading && <PromotionsSkeleton />}

            {isError && (
                <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                    <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                    <p className="text-[var(--color-texte)]">{t('messages.erreurChargement')}</p>
                    <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" />}>
                        {t('messages.ressayer')}
                    </ElisaButton>
                </div>
            )}

            {!isLoading && !isError && historique.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] py-12">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                        <BarChart3 className="h-7 w-7 text-[var(--color-texte-muted)]" />
                    </div>
                    <p className="text-[var(--color-texte-secondaire)]">{t('stats.aucuneDonnee')}</p>
                </div>
            )}

            {!isLoading && !isError && historique.length > 0 && (
                <>
                    {/* Agrégation par promotion */}
                    {parPromotion.length > 0 && (
                        <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
                            <div className="border-b border-[var(--color-bordure)] px-4 py-3">
                                <h3 className="text-sm font-semibold text-[var(--color-texte)]">{t('stats.agregation')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                                            <th className="px-4 py-2.5 font-medium text-xs">{t('stats.code')}</th>
                                            <th className="px-4 py-2.5 font-medium text-xs">{t('stats.scope')}</th>
                                            <th className="px-4 py-2.5 font-medium text-xs text-right">{t('stats.montantDeduit')}</th>
                                            <th className="px-4 py-2.5 font-medium text-xs text-right">{t('colonnes.utilisations')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parPromotion.map((p, i) => (
                                            <tr key={`${p.code}-${p.scope}-${i}`} className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)]">
                                                <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                                                <td className="px-4 py-2">
                                                    <span className="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs">
                                                        {p.scope}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right text-xs font-medium text-green-400">
                                                    −{Number(p.montantTotalDeduit || 0).toLocaleString('fr-FR')} F
                                                </td>
                                                <td className="px-4 py-2 text-right text-xs">
                                                    {p.nbUtilisations}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Historique */}
                    <div className="rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
                        <div className="border-b border-[var(--color-bordure)] px-4 py-3">
                            <h3 className="text-sm font-semibold text-[var(--color-texte)]">{t('stats.historique')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-bordure)] text-left text-[var(--color-texte-secondaire)]">
                                        <th className="px-4 py-2.5 font-medium text-xs">{t('stats.date')}</th>
                                        <th className="px-4 py-2.5 font-medium text-xs">{t('stats.code')}</th>
                                        <th className="hidden px-4 py-2.5 font-medium text-xs sm:table-cell">{t('stats.scope')}</th>
                                        <th className="px-4 py-2.5 font-medium text-xs text-right">{t('stats.montantDeduit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historique.map((h) => (
                                        <tr key={h.id} className="border-b border-[var(--color-bordure)]/50 text-[var(--color-texte)]">
                                            <td className="px-4 py-2 text-xs text-[var(--color-texte-muted)]">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(h.dateUtilisation).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs">{h.codePromotion}</td>
                                            <td className="hidden px-4 py-2 text-xs sm:table-cell">
                                                <span className="rounded-md bg-[var(--color-surface-hover)] px-2 py-0.5">{h.scope}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right text-xs font-medium text-green-400">
                                                −{h.montantDeduit.toLocaleString('fr-FR')} F
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <p className="text-xs text-[var(--color-texte-muted)]">
                                {t('stats.page', { page: pagination.page, totalPages: pagination.totalPages })}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setStatsPage((p) => Math.max(1, p - 1))}
                                    disabled={statsPage <= 1}
                                    className="rounded-lg border border-[var(--color-bordure)] px-3 py-1.5 text-xs text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('pagination.precedent')}
                                </button>
                                <button
                                    onClick={() => setStatsPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={statsPage >= pagination.totalPages}
                                    className="rounded-lg border border-[var(--color-bordure)] px-3 py-1.5 text-xs text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('pagination.suivant')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}

function SimulInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-xs font-medium text-[var(--color-texte-secondaire)] mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={0}
                className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-texte)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
            />
        </div>
    );
}

// =============================================
// Route TanStack
// =============================================

export const Route = createFileRoute('/platform/promotions')({
    component: PromotionsPage,
});

export default PromotionsPage;
