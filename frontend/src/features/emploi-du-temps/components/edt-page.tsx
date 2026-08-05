/**
 * ==================================
 * eLISAschool - Page Emploi du Temps (Stand-alone)
 * ==================================
 * Page principale de gestion des emplois du temps
 * 2 onglets : Planning (semaine/mois/jour/liste + analytique) | Configuration
 * Version: 4.0.0 — Toolbar consolidée + code mort supprimé
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Calendar, Settings, Plus, Download, ChevronLeft, ChevronRight,
    ShieldCheck, CalendarCheck, Crosshair,
    CalendarDays, CalendarRange, List as ListIcon, BarChart3,
    Users, GraduationCap, DoorOpen,
} from 'lucide-react';
import {
    useCreneaux, useValiderCreneauxClasse,
    useEnseignantOptions, useSalleOptions, useMatiereOptions,
    useAffectationsOptions, useSallesFromCreneaux,
} from '../hooks/use-emploi-du-temps';
import { useNavigationEDT, type PlanningView } from '../hooks/use-navigation-edt';
import { EDTCalendar } from './edt-calendar';
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
import { EDTDatePickerModal } from './edt-datepicker-modal';
import type { CreneauHoraire } from '../types/edt.types';
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

type ContexteType = 'classe' | 'enseignant' | 'salle';

const CONTEXTE_ICONS: Record<ContexteType, React.ReactNode> = {
    classe: <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    enseignant: <GraduationCap className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
    salle: <DoorOpen className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />,
};

export function EDTStandalonePage() {
    const { t, i18n } = useTranslation('emplois');
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { tab?: string };
    const tab: EDTTab = normaliseTab(search.tab);
    const setTab = (id: string) => navigate({ search: { tab: id } as never });

    // ─── États globaux ──────────────────────────────
    const [contexteType, setContexteType] = useState<ContexteType>('classe');
    const [contexteFilter, setContexteFilter] = useState('');
    const [showAnalytique, setShowAnalytique] = useState(false);

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
    // Modal datepicker (navigation rapide par date)
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // ─── Tabs ───────────────────────────────────────

    const TABS: Tab[] = [
        { id: 'planning', label: t('onglets.planning'), icon: Calendar },
        { id: 'configuration', label: t('onglets.configuration'), icon: Settings },
    ];

    // ─── Données de contexte (chargement lazy selon le type) ─────────
    const { data: classes } = useToutesClasses();
    const { data: enseignantOptions = [] } = useEnseignantOptions(contexteType === 'enseignant');
    const { data: salleOptions = [] } = useSalleOptions(contexteType === 'salle');
    const { data: matiereOptions = [] } = useMatiereOptions(planningView === 'liste');

    /** Options de classes pour le contexte 'classe' (dédupliquées par classeAnneeId) */
    const classeOptions: OptionSimple[] = useMemo(() => {
        const seen = new Set<string>();
        return (classes ?? [])
            .filter(c => c.classeAnneeId && c.actif)
            .filter(c => {
                if (seen.has(c.classeAnneeId!)) return false;
                seen.add(c.classeAnneeId!);
                return true;
            })
            .map(c => ({
                value: c.classeAnneeId!,
                label: `${c.nom}${c.anneeScolaire?.libelle ? ` — ${c.anneeScolaire.libelle}` : ''}`,
            }));
    }, [classes]);

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
    // Déduplication défensive par ID (le backend peut retourner des doublons)
    const creneaux = useMemo(() => {
        const items = paginated?.items ?? [];
        const seen = new Set<string>();
        return items.filter(c => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });
    }, [paginated?.items]);
    const validerCreneauxClasse = useValiderCreneauxClasse();

    // ─── Options pour le modal créneau (affectations + salles) ───
    const classeAnneeIdForModal = contexteType === 'classe' ? contexteFilter || undefined : undefined;
    const { data: affectationsDisponibles = [] } = useAffectationsOptions(classeAnneeIdForModal);
    const { data: sallesDisponibles = [] } = useSallesFromCreneaux();

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
                if (creneaux.length === 0) return renderEmpty();
                return (
                    <EDTCalendar
                        creneaux={creneaux}
                        onCreneauClick={handleCreneauClick}
                        onCellClick={handleCellClick}
                        semaineDebut={semaineDebut}
                    />
                );
            case 'mois':
                return <EDTMonthView creneaux={creneaux} mois={moisDebut} onCreneauClick={handleCreneauClick} onDateClick={handleDateClick} />;
            case 'jour':
                return <EDTDayView creneaux={creneaux} date={navigationDate} onCreneauClick={handleCreneauClick} />;
            case 'liste':
                return <EDTListeView creneaux={creneaux} onVoir={handleVoir} onModifier={handleModifier} matiereOptions={matiereOptions} />;
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
                        {/* ─── Toolbar principale : Navigation + Contexte + Actions ─── */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                            {/* Navigation calendrier — pill compact */}
                            <div className="group flex items-center gap-[var(--gap-xs)] rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-xxs)] py-[var(--space-xxs)] transition-colors hover:border-[var(--color-dominant-300)]">
                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<ChevronLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={naviguerPrecedent}
                                    aria-label={t('navigation.precedent')}
                                />

                                {/* Label cliquable → ouvre le datepicker modal */}
                                {navigationLabel && (
                                    <button
                                        type="button"
                                        onClick={() => setDatePickerOpen(true)}
                                        className="flex items-center gap-[var(--gap-xs)] px-[var(--space-xs)] py-[var(--space-xxs)] rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer min-w-0"
                                        aria-label={t('navigation.titreDatepicker')}
                                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    >
                                        <span
                                            className="font-semibold text-[var(--color-text-primary)] truncate hidden md:inline"
                                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 1rem)' }}
                                        >
                                            {navigationLabel}
                                        </span>
                                        <span
                                            className="font-semibold text-[var(--color-text-primary)] truncate md:hidden"
                                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                        >
                                            {/* Label abrégé pour mobile : mois court */}
                                            {navigationDate.toLocaleDateString(i18n.language || 'fr', { month: 'short', year: '2-digit' })}
                                        </span>
                                    </button>
                                )}

                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={naviguerSuivant}
                                    aria-label={t('navigation.suivant')}
                                />

                                {/* Bouton Aujourd'hui — discret, visible au hover ou si pas courant */}
                                <button
                                    type="button"
                                    onClick={naviguerAujourdhui}
                                    className={`flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-200
                                        h-[clamp(1.5rem,1.25rem+0.5vw,1.75rem)]
                                        w-[clamp(1.5rem,1.25rem+0.5vw,1.75rem)]
                                        ${estCourant
                                            ? 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] hover:bg-[var(--color-surface-hover)]'
                                            : 'opacity-100 text-[var(--color-dominant-500)] hover:bg-[var(--color-dominant-50)]'
                                        }
                                    `}
                                    aria-label={t('navigation.allerAujourdhui')}
                                    title={t('navigation.aujourdhui')}
                                >
                                    <Crosshair className="h-[var(--icon-xxs)] w-[var(--icon-xxs)]" />
                                </button>
                            </div>

                            {/* Séparateur */}
                            <div className="hidden sm:block w-px h-6 bg-[var(--color-bordure)]" />

                            {/* Contexte (classe/enseignant/salle) */}
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                                    {(['classe', 'enseignant', 'salle'] as ContexteType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleContexteTypeChange(type)}
                                            className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                                                contexteType === type
                                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                            }`}
                                            aria-pressed={contexteType === type}
                                            aria-label={t(`contexte.${type}`)}
                                        >
                                            {CONTEXTE_ICONS[type]}
                                            <span className="hidden sm:inline">{t(`contexte.${type}`)}</span>
                                        </button>
                                    ))}
                                </div>
                                <select
                                    value={contexteFilter}
                                    onChange={(e) => setContexteFilter(e.target.value)}
                                    className="h-[clamp(1.75rem,1.5rem+0.5vw,2.25rem)] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-sm)] text-[var(--color-text-primary)] text-sm transition-colors hover:border-[var(--color-dominant-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-300)]"
                                    style={{ minWidth: 'clamp(120px, 25vw, 240px)' }}
                                    aria-label={t('filtres.contexteLabel')}
                                >
                                    <option value="">
                                        {contexteType === 'classe'
                                            ? t('filtres.toutesClasses')
                                            : contexteType === 'enseignant'
                                                ? t('filtres.tousEnseignants')
                                                : t('filtres.toutesSalles')}
                                    </option>
                                    {contexteOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Séparateur */}
                            <div className="hidden sm:block w-px h-6 bg-[var(--color-bordure)]" />

                            {/* Actions */}
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <ElisaButton
                                    variant="primary"
                                    size="xs"
                                    icon={<Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={() => setGenModalOpen(true)}
                                >
                                    <span className="hidden sm:inline">{t('generer')}</span>
                                </ElisaButton>
                                <ElisaButton
                                    variant="secondary"
                                    size="xs"
                                    onClick={handleCreneauCreate}
                                    icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                >
                                    <span className="hidden sm:inline">{t('creneau.ajouter')}</span>
                                </ElisaButton>
                                {contexteFilter && contexteType === 'classe' && (
                                    <>
                                        <ElisaButton
                                            variant="secondary"
                                            size="xs"
                                            icon={<ShieldCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                            onClick={() => validerCreneauxClasse.mutate(contexteFilter)}
                                            disabled={validerCreneauxClasse.isPending}
                                        >
                                            <span className="hidden sm:inline">{t('valider')}</span>
                                        </ElisaButton>
                                        <ElisaButton
                                            variant="outline"
                                            size="xs"
                                            icon={<Download className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                            onClick={handleExportPDF}
                                        >
                                            <span className="hidden sm:inline">{t('exporterPdf')}</span>
                                        </ElisaButton>
                                    </>
                                )}
                                <ElisaButton
                                    variant="secondary"
                                    size="xs"
                                    icon={<CalendarCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={() => setHeuresCoursModalOpen(true)}
                                >
                                    <span className="hidden lg:inline">{t('generationHeuresCours.titre')}</span>
                                </ElisaButton>
                            </div>
                        </div>

                        {/* ─── Toolbar secondaire : Vues + Analytique ─── */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                            <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                                {([
                                    { id: 'semaine' as PlanningView, icon: CalendarDays },
                                    { id: 'mois' as PlanningView, icon: CalendarRange },
                                    { id: 'jour' as PlanningView, icon: Calendar },
                                    { id: 'liste' as PlanningView, icon: ListIcon },
                                ]).map(({ id, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => { setPlanningView(id); setShowAnalytique(false); }}
                                        className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                                            planningView === id && !showAnalytique
                                                ? 'bg-[var(--color-dominant-600)] text-white dark:bg-[var(--color-dominant-700)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                        }`}
                                        aria-pressed={planningView === id && !showAnalytique}
                                        aria-label={t(`vues.${id}`)}
                                    >
                                        <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                        <span className="hidden sm:inline">{t(`vues.${id}`)}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-5 bg-[var(--color-bordure)]" />

                            <button
                                onClick={() => setShowAnalytique(v => !v)}
                                className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg text-xs font-medium transition-colors ${
                                    showAnalytique
                                        ? 'bg-[var(--color-accent-600)] text-white dark:bg-[var(--color-accent-700)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                aria-pressed={showAnalytique}
                                aria-label={t('vues.analytique')}
                            >
                                <BarChart3 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                <span className="hidden sm:inline">{t('vues.analytique')}</span>
                            </button>
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

            {/* ─── Modal Datepicker (navigation rapide par date) ── */}
            <EDTDatePickerModal
                open={datePickerOpen}
                onOpenChange={setDatePickerOpen}
                currentDate={navigationDate}
                onDateSelect={(date) => setNavigationDate(date)}
                onToday={naviguerAujourdhui}
                onCurrentWeek={() => {
                    setNavigationDate(new Date());
                    setPlanningView('semaine');
                }}
            />
        </div>
    );
}
