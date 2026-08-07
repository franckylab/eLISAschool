/**
 * ==================================
 * eLISAschool - Page Emploi du Temps (Stand-alone)
 * ==================================
 * Page principale de gestion des emplois du temps
 * 2 onglets : Planning (semaine/mois/jour/liste + analytique) | Configuration
 * Version: 4.0.0 — Toolbar consolidée + code mort supprimé
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Calendar, Settings, Plus, Download, ChevronLeft, ChevronRight,
    ShieldCheck, CalendarCheck, Crosshair,
    CalendarDays, CalendarRange, List as ListIcon, BarChart3,
    Users, GraduationCap, DoorOpen, CheckCircle2, Clock, MapPin, User as UserIcon, Eye,
} from 'lucide-react';
import {
    useCreneaux, useValiderCreneauxClasse,
    useEnseignantOptions, useSalleOptions, useMatiereOptions,
} from '../hooks/use-emploi-du-temps';
import { useNavigationEDT, type PlanningView } from '../hooks/use-navigation-edt';
import { useJoursFeries } from '../hooks/use-jours-feries';
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
import { EDTLegend } from './edt-legend';
import type { CreneauHoraire } from '../types/edt.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
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
    /** Toggle : afficher tous les créneaux par jour (vue mois) */
    const [showAllCreneaux, setShowAllCreneaux] = useState(false);

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
    // Modal +N (liste créneaux journée — vue mois)
    const [plusNModalOpen, setPlusNModalOpen] = useState(false);
    const [plusNCreneaux, setPlusNCreneaux] = useState<CreneauHoraire[]>([]);
    const [plusNJourIndex, setPlusNJourIndex] = useState<number>(0);

    // ─── Tabs ───────────────────────────────────────

    const TABS: Tab[] = [
        { id: 'planning', label: t('onglets.planning'), icon: Calendar },
        { id: 'configuration', label: t('onglets.configuration'), icon: Settings },
    ];

    // ─── Jours fériés (année courante) ─────────────
    const { data: joursFeries = [] } = useJoursFeries(navigationDate.getFullYear());

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

    // ─── Auto-sélection du 1er contexte disponible ─────────────
    useEffect(() => {
        if (!contexteFilter && contexteOptions.length > 0) {
            setContexteFilter(contexteOptions[0].value);
        }
    }, [contexteFilter, contexteOptions]);

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
    // Le modal charge maintenant ses propres données indépendamment du filtre toolbar
    const contexteClasseIdForModal = contexteType === 'classe' && contexteFilter ? contexteFilter : undefined;

    // ─── Handlers ───────────────────────────────────

    /** Clic créneau depuis semaine/mois → modal détail (lecture seule) */
    const handleCreneauClick = (creneau: CreneauHoraire) => {
        setDetailCreneau(creneau);
        setDetailModalOpen(true);
    };

    /** Clic créneau depuis la vue jour → modal édition directe */
    const handleCreneauEdit = (creneau: CreneauHoraire) => {
        setSelectedCreneau(creneau);
        setCreneauModalOpen(true);
    };

    /** Ouvrir le modal de détail (lecture seule) — vue liste */
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

    /** Clic sur "+N" dans la vue mois : ouvrir la liste complète du jour */
    const handlePlusNClick = useCallback((creneaux: CreneauHoraire[], jourIndex: number) => {
        setPlusNCreneaux(creneaux);
        setPlusNJourIndex(jourIndex);
        setPlusNModalOpen(true);
    }, []);

    /** Noms de jours pour le modal +N (index → label) */
    const JOURS_LABELS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

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
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        <EDTCalendar
                            creneaux={creneaux}
                            onCreneauClick={handleCreneauClick}
                            onCellClick={handleCellClick}
                            semaineDebut={semaineDebut}
                            joursFeries={joursFeries}
                        />
                        <EDTLegend joursFeries={joursFeries} />
                    </div>
                );
            case 'mois':
                return (
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        <EDTMonthView creneaux={creneaux} mois={moisDebut} onCreneauClick={handleCreneauClick} onDateClick={handleDateClick} onPlusNClick={handlePlusNClick} joursFeries={joursFeries} showAll={showAllCreneaux} />
                        <EDTLegend joursFeries={joursFeries} />
                    </div>
                );
            case 'jour':
                return <EDTDayView creneaux={creneaux} date={navigationDate} onCreneauClick={handleCreneauEdit} joursFeries={joursFeries} />;
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
                        <div className="flex flex-wrap items-center gap-y-[var(--gap-sm)] gap-x-[var(--gap-xs)]">
                            {/* Navigation calendrier — pill compact */}
                            <div className="group flex shrink-0 items-center gap-[var(--gap-xs)] rounded-[var(--radius-lg)] border border-gray-300 dark:border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-xxs)] py-[var(--space-xxs)] transition-colors hover:border-[var(--color-dominant-400)] dark:hover:border-[var(--color-dominant-300)]">
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
                            <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-[var(--color-bordure)]" />

                            {/* Contexte (classe/enseignant/salle) */}
                            <div className="flex shrink-0 items-center gap-[var(--gap-xs)]">
                                <div className="flex shrink-0 rounded-lg border border-gray-300 dark:border-[var(--color-bordure)] overflow-hidden bg-[var(--color-surface-alt)] dark:bg-[var(--color-surface)]">
                                    {(['classe', 'enseignant', 'salle'] as ContexteType[]).map((type, idx) => (
                                        <button
                                            key={type}
                                            onClick={() => handleContexteTypeChange(type)}
                                            className={`flex shrink-0 items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                                                idx > 0 ? 'border-l border-gray-200 dark:border-[var(--color-bordure)]/60' : ''
                                            } ${
                                                contexteType === type
                                                    ? 'bg-[var(--color-dominant-600)] text-white dark:bg-[var(--color-dominant-700)] shadow-sm'
                                                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] dark:text-[var(--color-text-secondary)]'
                                            }`}
                                            aria-pressed={contexteType === type}
                                            aria-label={t(`contexte.${type}`)}
                                        >
                                            {CONTEXTE_ICONS[type]}
                                            <span className="hidden sm:inline">{t(`contexte.${type}`)}</span>
                                        </button>
                                    ))}
                                </div>
                                <ElisaSelect
                                    value={contexteFilter}
                                    onValueChange={setContexteFilter}
                                    placeholder={
                                        contexteType === 'classe'
                                            ? t('filtres.selectionnerClasse')
                                            : contexteType === 'enseignant'
                                                ? t('filtres.selectionnerEnseignant')
                                                : t('filtres.selectionnerSalle')
                                    }
                                    options={contexteOptions}
                                    searchable
                                    compact
                                    className="w-[clamp(132px,26vw,264px)]"
                                    aria-label={t('filtres.contexteLabel')}
                                />
                            </div>

                            {/* Séparateur */}
                            <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-[var(--color-bordure)]" />

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-[var(--gap-xs)]">
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
                        <div className="flex flex-wrap items-center gap-y-[var(--gap-xs)] gap-x-[var(--gap-xs)]">
                            <div className="flex shrink-0 rounded-lg border border-gray-300 dark:border-[var(--color-bordure)] overflow-hidden bg-[var(--color-surface-alt)] dark:bg-[var(--color-surface)]">
                                {([
                                    { id: 'semaine' as PlanningView, icon: CalendarDays },
                                    { id: 'mois' as PlanningView, icon: CalendarRange },
                                    { id: 'jour' as PlanningView, icon: Calendar },
                                    { id: 'liste' as PlanningView, icon: ListIcon },
                                ]).map(({ id, icon: Icon }, idx) => (
                                    <button
                                        key={id}
                                        onClick={() => { setPlanningView(id); setShowAnalytique(false); }}
                                        className={`flex shrink-0 items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] text-xs font-medium transition-colors ${
                                            idx > 0 ? 'border-l border-gray-200 dark:border-[var(--color-bordure)]/60' : ''
                                        } ${
                                            planningView === id && !showAnalytique
                                                ? 'bg-[var(--color-dominant-600)] text-white dark:bg-[var(--color-dominant-700)] shadow-sm'
                                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] dark:text-[var(--color-text-secondary)]'
                                        }`}
                                        aria-pressed={planningView === id && !showAnalytique}
                                        aria-label={t(`vues.${id}`)}
                                    >
                                        <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                        <span className="hidden sm:inline">{t(`vues.${id}`)}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-5 bg-gray-300 dark:bg-[var(--color-bordure)]" />

                            <button
                                onClick={() => setShowAnalytique(v => !v)}
                                className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg text-xs font-medium transition-colors ${
                                    showAnalytique
                                        ? 'bg-[var(--color-accent-600)] text-white dark:bg-[var(--color-accent-700)]'
                                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] dark:text-[var(--color-text-secondary)]'
                                }`}
                                aria-pressed={showAnalytique}
                                aria-label={t('vues.analytique')}
                            >
                                <BarChart3 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                <span className="hidden sm:inline">{t('vues.analytique')}</span>
                            </button>

                            {/* Toggle afficher tous les créneaux (vue mois) */}
                            {planningView === 'mois' && (
                                <>
                                    <div className="w-px h-5 bg-gray-300 dark:bg-[var(--color-bordure)]" />
                                    <button
                                        onClick={() => setShowAllCreneaux(v => !v)}
                                        className={`flex items-center gap-1 px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg text-xs font-medium transition-colors ${
                                            showAllCreneaux
                                                ? 'bg-[var(--color-dominant-600)] text-white dark:bg-[var(--color-dominant-700)] shadow-sm'
                                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] dark:text-[var(--color-text-secondary)]'
                                        }`}
                                        aria-pressed={showAllCreneaux}
                                        aria-label={t('vues.afficherTout')}
                                        title={t('vues.afficherToutTooltip')}
                                    >
                                        <Eye className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                        <span className="hidden sm:inline">{t('vues.afficherTout')}</span>
                                    </button>
                                </>
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
            <EDTHeuresCoursModal
                open={heuresCoursModalOpen}
                onOpenChange={setHeuresCoursModalOpen}
                contexteClasseAnneeId={contexteType === 'classe' ? contexteFilter || undefined : undefined}
            />

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
                contexteClasseId={contexteClasseIdForModal}
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

            {/* ─── Modal +N (liste créneaux journée — vue mois) ── */}
            <CustomModal
                open={plusNModalOpen}
                onOpenChange={setPlusNModalOpen}
                title={t('jours.' + JOURS_LABELS[plusNJourIndex])}
                description={t('modalPlusN.description', { count: plusNCreneaux.length })}
                size="md"
            >
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    {[...plusNCreneaux]
                        .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
                        .map((c) => {
                            const couleur = c.couleur || c.affectationMatiere?.matiere?.couleur || 'var(--color-dominant-500)';
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setPlusNModalOpen(false);
                                        handleCreneauClick(c);
                                    }}
                                    className="flex items-center gap-[var(--gap-sm)] rounded-lg border border-[var(--color-bordure)] p-[var(--space-sm)] text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                                >
                                    {/* Pastille couleur matière */}
                                    <div
                                        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: couleur }}
                                    >
                                        {c.affectationMatiere?.matiere?.nom?.charAt(0) ?? '?'}
                                    </div>
                                    {/* Infos */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="font-semibold text-[var(--color-text-primary)] truncate"
                                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                                            >
                                                {c.affectationMatiere?.matiere?.nom ?? '—'}
                                            </span>
                                            {c.hasHeuresCours && (
                                                <CheckCircle2 className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
                                            )}
                                        </div>
                                        <div
                                            className="flex flex-wrap items-center gap-x-[var(--gap-sm)] gap-y-0 text-[var(--color-text-secondary)]"
                                            style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                                        >
                                            <span className="flex items-center gap-0.5">
                                                <Clock className="h-3 w-3" />
                                                {c.heureDebut}–{c.heureFin}
                                            </span>
                                            {c.affectationMatiere?.enseignant?.utilisateur?.profil && (
                                                <span className="flex items-center gap-0.5">
                                                    <UserIcon className="h-3 w-3" />
                                                    {c.affectationMatiere.enseignant.utilisateur.profil.prenom} {c.affectationMatiere.enseignant.utilisateur.profil.nom}
                                                </span>
                                            )}
                                            {c.salle && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    {c.salle.nom}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </CustomModal>
        </div>
    );
}
