/**
 * ==================================
 * eLISAschool - Page Emploi du Temps (Stand-alone)
 * ==================================
 * Page principale de gestion des emplois du temps
 * 2 onglets : Planning (semaine/mois/jour/liste + analytique) | Configuration
 * Version: 3.0.0 — Phase 1 Restructuration
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Calendar, Settings, Plus, Download, ChevronLeft, ChevronRight,
    ShieldCheck, CalendarCheck, ChevronDown,
    CalendarDays, CalendarRange, List as ListIcon, BarChart3,
} from 'lucide-react';
import {
    useCreneaux, useValiderCreneauxClasse,
    useEnseignantOptions, useSalleOptions, useMatiereOptions,
    useAffectationsOptions, useSallesFromCreneaux,
} from '../hooks/use-emploi-du-temps';
import { useNavigationEDT, type PlanningView } from '../hooks/use-navigation-edt';
import { EDTCalendar } from './edt-calendar';
import { EDTFilterBar, type ContexteType } from './edt-filter-bar';
import type { OptionSimple } from '../hooks/use-emploi-du-temps';
import { EDTMonthView } from './edt-month-view';
import { EDTDayView } from './edt-day-view';
import { EDTListeView } from './edt-liste';
import { EDTPreferencesPage } from './edt-preferences';
import { EDTTemplatesPage } from './edt-templates';
import { EDTSynthese } from './edt-synthese';
import { EDTAudit } from './edt-audit';
import { EDTHeuresCoursModal } from './edt-heures-cours-modal';
import { EDTCreneauModal } from './edt-creneau-modal';
import { EDTCreneauDetailModal } from './edt-creneau-detail-modal';
import { EDTGenerationModal } from './edt-generation-modal';
import type { CreneauHoraire, JourSemaine } from '../types/edt.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { CustomModal } from '@/components/modals/CustomModal';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';

type EDTTab = 'planning' | 'configuration';

const EDT_TABS: EDTTab[] = ['planning', 'configuration'];

function isEDTTab(v: unknown): v is EDTTab {
    return typeof v === 'string' && EDT_TABS.includes(v as EDTTab);
}

/** Normalise les anciens onglets vers les nouveaux */
function normaliseTab(raw: unknown): EDTTab {
    if (isEDTTab(raw)) return raw;
    // Rétrocompatibilité : anciens onglets → planning
    if (typeof raw === 'string' && ['calendrier', 'liste', 'synthese', 'audit'].includes(raw)) return 'planning';
    if (typeof raw === 'string' && ['preferences', 'templates'].includes(raw)) return 'configuration';
    return 'planning';
}

export function EDTStandalonePage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { tab?: string };
    const tab: EDTTab = normaliseTab(search.tab);
    const setTab = (id: string) => navigate({ search: { tab: id } as never });

    // ─── États globaux ──────────────────────────────
    const [contexteType, setContexteType] = useState<ContexteType>('classe');
    const [contexteFilter, setContexteFilter] = useState('');
    const [showAnalytique, setShowAnalytique] = useState(false);
    // Filtres avancés (client-side)
    const [filtreMatiere, setFiltreMatiere] = useState('');
    const [filtreJour, setFiltreJour] = useState<JourSemaine | undefined>(undefined);

    // ─── Navigation calendrier (hook extrait) ─────────
    const {
        planningView, setPlanningView,
        navigationDate, setNavigationDate,
        semaineDebut, moisDebut,
        navigationLabel, estCourant,
        naviguerPrecedent, naviguerSuivant, naviguerAujourdhui,
    } = useNavigationEDT();

    // ─── Modals ─────────────────────────────────────
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [heuresCoursModalOpen, setHeuresCoursModalOpen] = useState(false);
    const [creneauModalOpen, setCreneauModalOpen] = useState(false);
    const [selectedCreneau, setSelectedCreneau] = useState<CreneauHoraire | null>(null);
    // Modal détail (lecture seule)
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailCreneau, setDetailCreneau] = useState<CreneauHoraire | null>(null);

    // ─── Tabs ───────────────────────────────────────

    const TABS: Tab[] = [
        { id: 'planning', label: t('onglets.planning'), icon: Calendar },
        { id: 'configuration', label: t('onglets.configuration'), icon: Settings },
    ];

    // ─── Données de contexte (chargées selon le type) ─────────
    const { data: classes } = useToutesClasses();
    const { data: enseignantOptions = [] } = useEnseignantOptions();
    const { data: salleOptions = [] } = useSalleOptions();
    const { data: matiereOptions = [] } = useMatiereOptions();

    /** Options de classes pour le contexte 'classe' */
    const classeOptions: OptionSimple[] = useMemo(() =>
        (classes ?? [])
            .filter(c => c.classeAnneeId && c.actif)
            .map(c => ({
                value: c.classeAnneeId!,
                label: `${c.nom}${c.anneeScolaire?.libelle ? ` — ${c.anneeScolaire.libelle}` : ''}`,
            })),
        [classes]
    );

    /** Options contextuelles selon le type de contexte sélectionné */
    const contexteOptions: OptionSimple[] = useMemo(() => {
        switch (contexteType) {
            case 'enseignant': return enseignantOptions;
            case 'salle': return salleOptions;
            default: return classeOptions;
        }
    }, [contexteType, classeOptions, enseignantOptions, salleOptions]);

    // Reset du filtre quand le type de contexte change
    const handleContexteTypeChange = useCallback((type: ContexteType) => {
        setContexteType(type);
        setContexteFilter('');
    }, []);

    // ─── Filtre serveur adaptatif ─────────────────────
    const serverFilters = useMemo(() => {
        if (!contexteFilter) return { limit: 100 };
        switch (contexteType) {
            case 'classe': return { classeAnneeId: contexteFilter, limit: 100 };
            case 'enseignant': return { enseignantId: contexteFilter, limit: 100 };
            case 'salle': return { salleId: contexteFilter, limit: 100 };
        }
    }, [contexteType, contexteFilter]);

    const { data: paginated, isLoading, error, refetch } = useCreneaux(serverFilters);
    const creneaux = paginated?.items ?? [];
    const validerCreneauxClasse = useValiderCreneauxClasse();

    // ─── Options pour le modal créneau (affectations + salles) ───
    const classeAnneeIdForModal = contexteType === 'classe' ? contexteFilter || undefined : undefined;
    const { data: affectationsDisponibles = [] } = useAffectationsOptions(classeAnneeIdForModal);
    const { data: sallesDisponibles = [] } = useSallesFromCreneaux();

    /** Créneaux filtrés côté client (matière + jour) */
    const filteredCreneaux = useMemo(() => {
        let result = creneaux;
        if (filtreMatiere) {
            result = result.filter(c => c.affectationMatiereId === filtreMatiere);
        }
        if (filtreJour) {
            result = result.filter(c => c.jour === filtreJour);
        }
        return result;
    }, [creneaux, filtreMatiere, filtreJour]);

    // ─── Handlers ───────────────────────────────────

    const handleCreneauClick = (creneau: CreneauHoraire) => {
        setSelectedCreneau(creneau);
        setCreneauModalOpen(true);
    };

    /** Ouvrir le modal de détail (lecture seule) */
    const handleVoir = useCallback((creneau: CreneauHoraire) => {
        setDetailCreneau(creneau);
        setDetailModalOpen(true);
    }, []);

    /** Ouvrir le modal d'édition depuis le modal détail */
    const handleModifier = useCallback((creneau: CreneauHoraire) => {
        setSelectedCreneau(creneau);
        setCreneauModalOpen(true);
    }, []);

    const handleCreneauCreate = () => {
        setSelectedCreneau(null);
        setCreneauModalOpen(true);
    };

    const handleCellClick = (_jour: string, _heure: string) => {
        setSelectedCreneau(null);
        setCreneauModalOpen(true);
    };

    const handleExportPDF = () => {
        if (!contexteFilter || contexteType !== 'classe') return;
        window.open(`/api/emploi-du-temps/export/pdf/${contexteFilter}`, '_blank');
    };

    const handleDateClick = (date: Date) => {
        setNavigationDate(date);
        setPlanningView('jour');
    };

    // ─── Rendering ──────────────────────────────────

    const renderPlanningContent = () => {
        if (showAnalytique) {
            return (
                <div className="flex flex-col gap-[var(--gap-lg)]">
                    <EDTSynthese
                        classeAnneeId={contexteType === 'classe' ? contexteFilter || undefined : undefined}
                        enseignantId={contexteType === 'enseignant' ? contexteFilter || undefined : undefined}
                        embedded
                    />
                    <EDTAudit embedded />
                </div>
            );
        }

        switch (planningView) {
            case 'semaine':
                if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable />;
                if (filteredCreneaux.length === 0) return renderEmpty();
                return (
                    <EDTCalendar
                        creneaux={filteredCreneaux}
                        onCreneauClick={handleCreneauClick}
                        onCellClick={handleCellClick}
                        semaineDebut={semaineDebut}
                    />
                );
            case 'mois':
                return <EDTMonthView creneaux={filteredCreneaux} mois={moisDebut} onCreneauClick={handleCreneauClick} onDateClick={handleDateClick} />;
            case 'jour':
                return <EDTDayView creneaux={filteredCreneaux} date={navigationDate} onCreneauClick={handleCreneauClick} />;
            case 'liste':
                return <EDTListeView creneaux={filteredCreneaux} onVoir={handleVoir} onModifier={handleModifier} />;
            default:
                return null;
        }
    };

    const renderEmpty = () => (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] py-[var(--space-xl)]">
            <Calendar className="h-[clamp(3rem,2.5rem+2vw,4rem)] w-[clamp(3rem,2.5rem+2vw,4rem)] text-[var(--color-text-muted)] mx-auto mb-[var(--space-md)]" />
            <h3
                className="font-semibold text-[var(--color-text-primary)] mb-[var(--space-sm)]"
                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
            >
                {t('aucunCreneau')}
            </h3>
            <p
                className="text-[var(--color-text-secondary)] mb-[var(--space-lg)] max-w-md mx-auto text-center"
                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
            >
                {t('aucunCreneauDescription')}
            </p>
            <ElisaButton
                variant="primary"
                size="sm"
                icon={<Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                onClick={() => setGenModalOpen(true)}
            >
                {t('genererEmploiDuTemps')}
            </ElisaButton>
        </div>
    );

    const renderConfiguration = () => (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            <EDTPreferencesPage />
            <EDTTemplatesPage />
        </div>
    );

    const renderTab = () => {
        switch (tab) {
            case 'planning': return renderPlanningContent();
            case 'configuration': return renderConfiguration();
            default: return null;
        }
    };

    // ─── Erreur ─────────────────────────────────────

    if (error) {
        return (
            <div className="p-[var(--space-lg)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    // ─── Rendu principal ────────────────────────────

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[var(--space-lg)]">
            <PageHeader
                variant="gradient"
                icon={Calendar}
                title={t('titre')}
                subtitle={t('description')}
                onBack={() => navigate({ to: '/' })}
            />

            <TabsBar tabs={TABS} activeTab={tab} onTabChange={setTab} />

            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-[var(--gap-lg)]"
            >
                {tab === 'planning' && (
                    <>
                        {/* ─── Navigation calendrier unifiée ─── */}
                        <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<ChevronLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={naviguerPrecedent}
                                    aria-label={t('navigation.precedent')}
                                />
                                <button
                                    onClick={naviguerAujourdhui}
                                    className={`rounded-lg px-[var(--space-sm)] py-[var(--space-xs)] font-medium transition-colors ${
                                        estCourant
                                            ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                    }`}
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                >
                                    {t('navigation.aujourdhui')}
                                </button>
                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={naviguerSuivant}
                                    aria-label={t('navigation.suivant')}
                                />
                            </div>

                            {/* Sélecteur de mode de vue */}
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                <div className="relative">
                                    <select
                                        value={planningView}
                                        onChange={(e) => setPlanningView(e.target.value as PlanningView)}
                                        className="appearance-none rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] pl-[var(--space-sm)] pr-[var(--space-lg)] py-[var(--space-xs)] font-medium text-[var(--color-text-primary)] cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    >
                                        <option value="semaine">{t('vues.semaine')}</option>
                                        <option value="mois">{t('vues.mois')}</option>
                                        <option value="jour">{t('vues.jour')}</option>
                                        <option value="liste">{t('vues.liste')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--color-text-muted)] pointer-events-none" />
                                </div>

                                {/* Label navigation */}
                                {navigationLabel && (
                                    <span
                                        className="font-semibold text-[var(--color-text-primary)] hidden sm:inline"
                                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 1rem)' }}
                                    >
                                        {navigationLabel}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ─── Toggle sous-vues + analytique ─── */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                            {([
                                { id: 'semaine' as PlanningView, icon: CalendarDays },
                                { id: 'mois' as PlanningView, icon: CalendarRange },
                                { id: 'jour' as PlanningView, icon: Calendar },
                                { id: 'liste' as PlanningView, icon: ListIcon },
                            ]).map(({ id, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => { setPlanningView(id); setShowAnalytique(false); }}
                                    className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg font-medium transition-colors ${
                                        planningView === id && !showAnalytique
                                            ? 'bg-[var(--color-dominant-600)] text-white'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                    }`}
                                    style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                                >
                                    <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                    <span className="hidden sm:inline">{t(`vues.${id}`)}</span>
                                </button>
                            ))}

                            <div className="w-px h-5 bg-[var(--color-bordure)] mx-[var(--gap-xs)]" />

                            <button
                                onClick={() => setShowAnalytique(v => !v)}
                                className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg font-medium transition-colors ${
                                    showAnalytique
                                        ? 'bg-[var(--color-accent-600)] text-white'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                            >
                                <BarChart3 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                <span className="hidden sm:inline">{t('vues.analytique')}</span>
                            </button>
                        </div>

                        {/* ─── FilterBar ─────────────────────── */}
                        <EDTFilterBar
                            contexteType={contexteType}
                            onContexteTypeChange={handleContexteTypeChange}
                            contexteFilter={contexteFilter}
                            onContexteFilterChange={setContexteFilter}
                            contexteOptions={contexteOptions}
                            filtreMatiere={filtreMatiere}
                            onFiltreMatiereChange={setFiltreMatiere}
                            matiereOptions={matiereOptions}
                            filtreJour={filtreJour}
                            onFiltreJourChange={(j) => setFiltreJour(j || undefined)}
                        />

                        {/* ─── Actions ───────────────────────── */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                            <ElisaButton
                                variant="secondary"
                                size="xs"
                                onClick={handleCreneauCreate}
                                icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            >
                                <span className="hidden sm:inline">{t('creneau.ajouter')}</span>
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="xs"
                                icon={<Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={() => setGenModalOpen(true)}
                            >
                                {t('generer')}
                            </ElisaButton>
                            {contexteFilter && contexteType === 'classe' && (
                                <ElisaButton
                                    variant="secondary"
                                    size="xs"
                                    icon={<ShieldCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={() => validerCreneauxClasse.mutate(contexteFilter)}
                                    disabled={validerCreneauxClasse.isPending}
                                >
                                    <span className="hidden sm:inline">{t('valider')}</span>
                                </ElisaButton>
                            )}
                            <ElisaButton
                                variant="secondary"
                                size="xs"
                                icon={<CalendarCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={() => setHeuresCoursModalOpen(true)}
                            >
                                <span className="hidden sm:inline">{t('generationHeuresCours.titre')}</span>
                            </ElisaButton>
                            {contexteFilter && contexteType === 'classe' && (
                                <ElisaButton
                                    variant="outline"
                                    size="xs"
                                    icon={<Download className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={handleExportPDF}
                                >
                                    <span className="hidden sm:inline">PDF</span>
                                </ElisaButton>
                            )}
                        </div>
                    </>
                )}

                {/* ─── Contenu ──────────────────────────── */}
                {renderTab()}
            </motion.div>

            {/* ─── Modal Génération ─────────────────── */}
            {contexteFilter && contexteType === 'classe' && (
                <EDTGenerationModal
                    open={genModalOpen}
                    onOpenChange={setGenModalOpen}
                    classeAnneeId={contexteFilter}
                    onSuccess={() => { setGenModalOpen(false); }}
                />
            )}

            {/* ─── Modal Génération Heures de Cours ──── */}
            <CustomModal
                open={heuresCoursModalOpen}
                onOpenChange={setHeuresCoursModalOpen}
                title={t('generationHeuresCours.titre')}
                description={t('generationHeuresCours.description')}
                size="xl"
            >
                <EDTHeuresCoursModal
                    enseignantId={contexteType === 'enseignant' ? contexteFilter : ''}
                    classeAnneeId={contexteType === 'classe' ? contexteFilter || undefined : undefined}
                    onClose={() => setHeuresCoursModalOpen(false)}
                />
            </CustomModal>

            {/* ─── Modal Détail Créneau (lecture seule) ── */}
            <EDTCreneauDetailModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                creneau={detailCreneau}
                onModifier={handleModifier}
            />

            {/* ─── Modal Créneau ────────────────────── */}
            <EDTCreneauModal
                open={creneauModalOpen}
                onOpenChange={setCreneauModalOpen}
                creneau={selectedCreneau}
                etablissementId=""
                affectations={affectationsDisponibles}
                salles={sallesDisponibles}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
