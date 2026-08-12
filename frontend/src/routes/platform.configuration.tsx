/**
 * ==================================
 * eLISAschool - Platform Configuration v3 — Sidebar Navigation
 * ==================================
 * Refonte v3 : navigation sidebar verticale avec indicatrice animée,
 * backgrounds tintés par section, recherche inline, breadcrumb contextuel,
 * indicateurs statut, collapse/expand, et drawer mobile.
 *
 * Sections :
 *   1. Système & Application (SYSTEME)
 *   2. Sécurité & Authentification (SECURITE)
 *   3. Modules & Features
 *   4. Notifications (NOTIFICATION)
 *   5. Régional & Langue (REGIONAL)
 *   6. Sauvegarde & Restauration
 *   7. Historique & Audit
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Shield, Bell, RefreshCw,
    Server, ToggleLeft, History, HardDrive,
    Loader2, ChevronDown, Search,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks';
import { ConfigSidebar } from '@/components/ui/ConfigSidebar';
import type { ConfigSidebarSection } from '@/components/ui/ConfigSidebar';
import { FeatureFlagsManager } from '@/features/admin/components/feature-flags-manager';
import { ModulesTab } from '@/features/configuration/components/ModulesTab';
import { HistoriqueTab } from '@/features/configuration/components/HistoriqueTab';
import type { CategorieParametre } from '@/features/configuration/types/configuration.types';
import {
    ParameterField,
    ParameterGroup,
    ParameterSearchBar,
    ParameterDiffView,
    SaveBar,
    BulkActionsBar,
    MFAConfirmModal,
    ExportConfigButton,
    useParametresPlatforme,
    hasCriticalChanges,
} from '@/features/platform/configuration';

// Lazy load BackupManagement (lourd, utilisé uniquement dans la section sauvegarde)
const BackupManagementLazy = lazy(() =>
    import('@/features/configuration/components/BackupManagement').then(m => ({
        default: m.BackupManagement,
    }))
);

// ==================================
// Types
// ==================================
type SectionKey = 'systeme' | 'securite' | 'modules' | 'notifications' | 'regional' | 'sauvegarde' | 'historique';

interface SectionDef {
    key: SectionKey;
    labelKey: string;
    descriptionKey: string;
    icon: typeof Server;
    categorie?: CategorieParametre;
    color: string;
    tintBg: string;
}

// ==================================
// Définition des sections (avec couleurs de teinte)
// ==================================
const SECTIONS: SectionDef[] = [
    {
        key: 'systeme', labelKey: 'categories.systeme', descriptionKey: 'sections.systeme.description',
        icon: Server, categorie: 'SYSTEME',
        color: 'var(--color-info-600)',
        tintBg: 'var(--color-info-50)',
    },
    {
        key: 'securite', labelKey: 'categories.securite', descriptionKey: 'sections.securite.description',
        icon: Shield, categorie: 'SECURITE',
        color: 'var(--color-danger-600)',
        tintBg: 'var(--color-danger-50)',
    },
    {
        key: 'modules', labelKey: 'categories.modules', descriptionKey: 'sections.modules.description',
        icon: ToggleLeft,
        color: '#9333ea',
        tintBg: 'rgba(147, 51, 234, 0.06)',
    },
    {
        key: 'notifications', labelKey: 'categories.notifications', descriptionKey: 'sections.notifications.description',
        icon: Bell, categorie: 'NOTIFICATION',
        color: 'var(--color-warning-600)',
        tintBg: 'var(--color-warning-50)',
    },
    {
        key: 'regional', labelKey: 'categories.regional', descriptionKey: 'sections.regional.description',
        icon: Globe, categorie: 'REGIONAL',
        color: 'var(--color-success-600)',
        tintBg: 'var(--color-success-50)',
    },
    {
        key: 'sauvegarde', labelKey: 'categories.sauvegarde', descriptionKey: 'sections.sauvegarde.description',
        icon: HardDrive,
        color: 'var(--color-text-secondary)',
        tintBg: 'var(--color-surface-hover)',
    },
    {
        key: 'historique', labelKey: 'categories.historique', descriptionKey: 'sections.historique.description',
        icon: History,
        color: 'var(--color-text-muted)',
        tintBg: 'var(--color-surface-alt)',
    },
];

// Sections qui utilisent les paramètres (avec ParameterField)
const PARAM_SECTIONS: SectionKey[] = ['systeme', 'securite', 'notifications', 'regional'];

// ==================================
// Animation variants (locaux à la page)
// ==================================
const contentTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.18, ease: 'easeOut' },
};

const collapseVariants = {
    hidden: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: 'easeOut' } },
};

// ==================================
// LocalStorage key pour persistance section active
// ==================================
const LS_ACTIVE_SECTION = 'platform:config:activeSection';

// ==================================
// Composant principal
// ==================================
function PlatformConfigurationPage() {
    const { t } = useTranslation('config-params');
    const queryClient = useQueryClient();
    const isMobile = useMediaQuery('(max-width: 767px)');

    // État navigation (persisté dans localStorage)
    const [activeSection, setActiveSectionState] = useState<SectionKey>(() => {
        try {
            const saved = localStorage.getItem(LS_ACTIVE_SECTION);
            if (saved && SECTIONS.some(s => s.key === saved)) return saved as SectionKey;
        } catch { /* localStorage indisponible */ }
        return 'systeme';
    });
    const setActiveSection = useCallback((key: SectionKey) => {
        setActiveSectionState(key);
        try { localStorage.setItem(LS_ACTIVE_SECTION, key); } catch { /* ignore */ }
    }, []);
    const [showFeatureFlags, setShowFeatureFlags] = useState(false);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isContentCollapsed, setIsContentCollapsed] = useState(false);

    // État recherche par section
    const [searchBySection, setSearchBySection] = useState<Record<SectionKey, string>>({
        systeme: '', securite: '', modules: '', notifications: '', regional: '', sauvegarde: '', historique: '',
    });
    const [moduleFilterBySection, setModuleFilterBySection] = useState<Record<SectionKey, string | undefined>>({
        systeme: undefined, securite: undefined, modules: undefined, notifications: undefined,
        regional: undefined, sauvegarde: undefined, historique: undefined,
    });

    // État MFA
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);

    // Catégorie active pour le hook (optimisation : ne charger que la section active)
    const activeCategorie = useMemo((): CategorieParametre | null => {
        const section = SECTIONS.find(s => s.key === activeSection);
        return section?.categorie || null;
    }, [activeSection]);

    // Hook unique pour la section active (lazy loading)
    const currentHook = useParametresPlatforme(activeCategorie);

    // Recherche et filtre actif
    const currentSearch = searchBySection[activeSection] || '';
    const currentModuleFilter = moduleFilterBySection[activeSection];

    // Modules disponibles pour le filtre
    const modulesDisponibles = useMemo(() => {
        if (!currentHook?.parametres) return [];
        const modules = new Set<string>();
        for (const p of currentHook.parametres) {
            if (p.module) modules.add(p.module);
        }
        return Array.from(modules).sort();
    }, [currentHook?.parametres]);

    // Paramètres filtrés
    const filteredParametresByModule = useMemo(() => {
        if (!currentHook?.parametresByModule) return new Map<string, any[]>();
        const search = currentSearch.toLowerCase().trim();
        const moduleFilter = currentModuleFilter;
        const result = new Map<string, any[]>();
        for (const [module, params] of currentHook.parametresByModule) {
            if (moduleFilter && module !== moduleFilter) continue;
            const filtered = search
                ? params.filter(p =>
                    p.cle.toLowerCase().includes(search) ||
                    p.description?.toLowerCase().includes(search) ||
                    p.module?.toLowerCase().includes(search)
                )
                : params;
            if (filtered.length > 0) result.set(module, filtered);
        }
        return result;
    }, [currentHook?.parametresByModule, currentSearch, currentModuleFilter]);

    // Total paramètres
    const totalFiltered = useMemo(() => {
        let count = 0;
        for (const [, params] of filteredParametresByModule) count += params.length;
        return count;
    }, [filteredParametresByModule]);

    const totalParams = currentHook?.parametres?.length ?? 0;

    // Handlers
    const handleSearchChange = useCallback((value: string) => {
        setSearchBySection(prev => ({ ...prev, [activeSection]: value }));
    }, [activeSection]);

    const handleModuleChange = useCallback((module: string | undefined) => {
        setModuleFilterBySection(prev => ({ ...prev, [activeSection]: module }));
    }, [activeSection]);

    const handleSauvegarder = useCallback(async () => {
        if (!currentHook?.hasChanges) return;
        const isCritical = hasCriticalChanges(currentHook.dirtyFields, currentHook.parametres || []);
        if (isCritical) {
            setPendingSave(true);
            setShowMfaModal(true);
            return;
        }
        await currentHook.saveAll();
    }, [currentHook]);

    const handleMfaVerified = useCallback(async () => {
        if (pendingSave && currentHook?.hasChanges) await currentHook.saveAll();
        setPendingSave(false);
        setShowMfaModal(false);
    }, [pendingSave, currentHook]);

    const handleAnnuler = useCallback(() => { currentHook?.resetChanges(); }, [currentHook]);

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['platform', 'configuration'] });
    }, [queryClient]);

    const handleSectionClick = useCallback((key: SectionKey) => {
        if (key === activeSection) {
            setIsContentCollapsed(prev => !prev);
        } else {
            setActiveSection(key);
            setIsContentCollapsed(false);
        }
        if (isMobile) setMobileSidebarOpen(false);
    }, [activeSection, isMobile]);

    // Section active courante
    const activeSectionDef = SECTIONS.find(s => s.key === activeSection)!;
    const ActiveIcon = activeSectionDef.icon;
    const hasChanges = currentHook?.hasChanges ?? false;
    const hasError = currentHook?.isError ?? false;

    // Modifications count pour le badge
    const modificationsCount = currentHook?.modificationsCount ?? 0;

    // ─── Mapping sections → ConfigSidebarSection (composant partagé) ───
    const sidebarSections: ConfigSidebarSection[] = useMemo(() =>
        SECTIONS.map(s => ({
            key: s.key,
            label: t(s.labelKey),
            icon: s.icon,
            color: s.color,
            tintBg: s.tintBg,
            description: t(s.descriptionKey),
        })),
        [t]
    );

    // Handler recherche sidebar (délègue au handler existant)
    const handleSidebarSearch = useCallback((value: string) => {
        handleSearchChange(value);
    }, [handleSearchChange]);

    // ==================================
    // RENDER
    // ==================================
    return (
        <div className="flex h-full min-h-0">
            {/* ═══ Sidebar (desktop + mobile drawer) ═══ */}
            <ConfigSidebar
                sections={sidebarSections}
                activeKey={activeSection}
                onSectionChange={(key) => handleSectionClick(key as SectionKey)}
                searchValue={searchBySection[activeSection]}
                onSearchChange={handleSidebarSearch}
                searchPlaceholder={t('rechercher')}
                title={t('titre')}
                subtitle={t('sousTitre')}
                modificationsCount={modificationsCount}
                hasChanges={hasChanges}
                hasError={hasError}
                showSearch
                showRefresh
                onRefresh={handleRefresh}
                footerContent={<ExportConfigButton variant="ghost" size="sm" />}
                isMobile={isMobile}
                isDrawerOpen={isMobileSidebarOpen}
                onDrawerClose={() => setMobileSidebarOpen(false)}
                showMobileToggle={isMobile}
                onDrawerOpen={() => setMobileSidebarOpen(true)}
            />

            {/* ═══ Zone de contenu ═══ */}
            <div className="flex-1 min-w-0 overflow-y-auto">
                <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">

                    {/* ─── Header mobile + breadcrumb ─── */}
                    <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                        <div className="flex items-center gap-[var(--gap-sm)] min-w-0">
                            {/* Breadcrumb contextuel */}
                            <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                <div
                                    className="shrink-0 rounded-lg p-[clamp(0.25rem,0.2rem+0.15vw,0.375rem)]"
                                    style={{ backgroundColor: activeSectionDef.tintBg }}
                                >
                                    <ActiveIcon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: activeSectionDef.color }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                            {t('titre')}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>/</span>
                                        <span className="text-xs font-semibold truncate" style={{ color: activeSectionDef.color }}>
                                            {t(activeSectionDef.labelKey)}
                                        </span>
                                    </div>
                                    <p className="truncate hidden 2xs:block" style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.15vw, 0.75rem)', color: 'var(--color-text-muted)' }}>
                                        {t(activeSectionDef.descriptionKey)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Actions header */}
                        <div className="flex items-center gap-[var(--gap-xs)]">
                            {/* Toggle Feature Flags */}
                            <button
                                onClick={() => setShowFeatureFlags(v => !v)}
                                className={`flex items-center gap-[var(--gap-xs)] rounded-lg px-[var(--space-sm)] py-[clamp(0.25rem,0.2rem+0.15vw,0.375rem)] text-xs font-medium transition-colors ${
                                    showFeatureFlags ? '' : 'border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                style={{ fontSize: 'clamp(0.6875rem, 0.64rem + 0.2vw, 0.8125rem)', ...(showFeatureFlags
                                    ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' }
                                    : { color: 'var(--color-text-primary)' }
                                ) }}
                                aria-pressed={showFeatureFlags}
                            >
                                <ToggleLeft className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t('featureFlags')}</span>
                            </button>
                            {/* Actualiser (desktop) */}
                            {!isMobile && (
                                <button
                                    onClick={handleRefresh}
                                    className="flex items-center gap-[var(--gap-xs)] rounded-lg border border-[var(--color-bordure)] px-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] py-[clamp(0.25rem,0.2rem+0.15vw,0.375rem)] transition-colors hover:bg-[var(--color-surface-hover)]"
                                    style={{ color: 'var(--color-text-primary)', fontSize: 'clamp(0.6875rem, 0.64rem + 0.2vw, 0.8125rem)' }}
                                    aria-label={t('actualiser')}
                                >
                                    <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden lg:inline">{t('actualiser')}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ─── Feature Flags (toggle global) ─── */}
                    {showFeatureFlags && <FeatureFlagsManager />}

                    {/* ─── Contenu des sections ─── */}
                    {!showFeatureFlags && (
                        <div className="space-y-[var(--space-md)]">
                            {/* Bouton collapse/expand */}
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => setIsContentCollapsed(prev => !prev)}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[0.6875rem] font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    aria-expanded={!isContentCollapsed}
                                >
                                    <motion.div
                                        animate={{ rotate: isContentCollapsed ? -90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="h-3 w-3" />
                                    </motion.div>
                                    {isContentCollapsed ? t('developper', 'Développer') : t('reduire', 'Réduire')}
                                </button>
                            </div>

                            {/* Contenu animé (collapse/expand + transition section) */}
                            <AnimatePresence mode="wait">
                                {!isContentCollapsed && (
                                    <motion.div
                                        key={activeSection}
                                        {...contentTransition}
                                    >
                                        {/* ─── Sections Paramètres (SYSTEME, SECURITE, NOTIFICATIONS, REGIONAL) ─── */}
                                        {PARAM_SECTIONS.includes(activeSection) && currentHook && (
                                            <div className="space-y-[var(--space-md)]">
                                                {/* Barre de recherche + filtre module (content area) */}
                                                <ParameterSearchBar
                                                    recherche={currentSearch}
                                                    onRechercheChange={handleSearchChange}
                                                    moduleActif={currentModuleFilter}
                                                    onModuleChange={handleModuleChange}
                                                    modulesDisponibles={modulesDisponibles}
                                                    totalAffiche={totalFiltered}
                                                    totalParams={totalParams}
                                                />

                                                {/* Actions groupées */}
                                                <BulkActionsBar
                                                    categorie={activeSectionDef.categorie || activeSection}
                                                    totalParams={totalParams}
                                                    onResetCategorie={currentHook.resetCategorie}
                                                    disabled={currentHook.isSaving}
                                                />

                                                {/* Loading */}
                                                {currentHook.isLoading && (
                                                    <div className="flex items-center justify-center py-12">
                                                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: activeSectionDef.color }} />
                                                        <span className="ml-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('chargement')}</span>
                                                    </div>
                                                )}

                                                {/* Erreur */}
                                                {currentHook.isError && (
                                                    <div className="rounded-lg border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] p-4 text-center text-sm" style={{ color: 'var(--color-danger-700)' }}>
                                                        {t('sauvegardeErreur')}
                                                    </div>
                                                )}

                                                {/* Aucun paramètre */}
                                                {!currentHook.isLoading && !currentHook.isError && totalParams === 0 && (
                                                    <div className="rounded-lg border border-dashed border-[var(--color-bordure)] p-12 text-center">
                                                        <ActiveIcon className="mx-auto mb-3 h-10 w-10 opacity-20" style={{ color: activeSectionDef.color }} />
                                                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('aucunParametre')}</p>
                                                    </div>
                                                )}

                                                {/* Aucun résultat après filtre */}
                                                {!currentHook.isLoading && totalParams > 0 && totalFiltered === 0 && (
                                                    <div className="rounded-lg border border-dashed border-[var(--color-bordure)] p-8 text-center">
                                                        <Search className="mx-auto mb-2 h-8 w-8 opacity-20" style={{ color: activeSectionDef.color }} />
                                                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('aucunResultat')}</p>
                                                    </div>
                                                )}

                                                {/* Groupes de paramètres */}
                                                {!currentHook.isLoading && filteredParametresByModule.size > 0 && (
                                                    <div className="space-y-[var(--space-md)]">
                                                        {Array.from(filteredParametresByModule.entries()).map(([module, params]) => {
                                                            const moduleLabel = module === '_global'
                                                                ? t(`sections.${activeSection}.titre`)
                                                                : module;
                                                            return (
                                                                <ParameterGroup
                                                                    key={module}
                                                                    icon={ActiveIcon}
                                                                    titre={moduleLabel}
                                                                    description={module === '_global' ? t(`sections.${activeSection}.description`) : undefined}
                                                                    badge={params.length}
                                                                >
                                                                    {params.map(param => (
                                                                        <ParameterField
                                                                            key={param.cle}
                                                                            parametre={param}
                                                                            valeur={currentHook.editValues[param.cle]}
                                                                            onChange={currentHook.updateValue}
                                                                            disabled={!param.modifiableRuntime}
                                                                        />
                                                                    ))}
                                                                </ParameterGroup>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Diff preview + SaveBar */}
                                                {currentHook.hasChanges && (
                                                    <div className="space-y-[var(--space-md)]">
                                                        <ParameterDiffView
                                                            parametres={currentHook.parametres || []}
                                                            originalValues={currentHook.originalValues}
                                                            editValues={currentHook.editValues}
                                                            dirtyFields={currentHook.dirtyFields}
                                                        />
                                                    </div>
                                                )}

                                                {/* SaveBar sticky */}
                                                <SaveBar
                                                    modificationsCount={currentHook.modificationsCount}
                                                    visible={currentHook.hasChanges}
                                                    onSauvegarder={handleSauvegarder}
                                                    onAnnuler={handleAnnuler}
                                                    isSaving={currentHook.isSaving}
                                                    label={t('modifications')}
                                                />
                                            </div>
                                        )}

                                        {/* ─── Section Modules ─── */}
                                        {activeSection === 'modules' && <ModulesTab />}

                                        {/* ─── Section Sauvegarde ─── */}
                                        {activeSection === 'sauvegarde' && (
                                            <Suspense fallback={
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: activeSectionDef.color }} />
                                                    <span className="ml-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('chargement')}</span>
                                                </div>
                                            }>
                                                <BackupManagementLazy etablissementId="platform" />
                                            </Suspense>
                                        )}

                                        {/* ─── Section Historique ─── */}
                                        {activeSection === 'historique' && <HistoriqueTab />}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Placeholder quand contenu est réduit */}
                            {isContentCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <ActiveIcon className="mb-3 h-12 w-12 opacity-15" style={{ color: activeSectionDef.color }} />
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                        {t('sectionReduite', 'Section réduite')}
                                    </p>
                                    <button
                                        onClick={() => setIsContentCollapsed(false)}
                                        className="mt-3 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                                        style={{ backgroundColor: activeSectionDef.tintBg, color: activeSectionDef.color }}
                                    >
                                        {t('developper', 'Développer')}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ MFA Confirm Modal ═══ */}
            <MFAConfirmModal
                open={showMfaModal}
                onOpenChange={setShowMfaModal}
                onVerified={handleMfaVerified}
                onCancel={() => {
                    setPendingSave(false);
                    setShowMfaModal(false);
                }}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/configuration')({
    component: PlatformConfigurationPage,
});
