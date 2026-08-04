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
import { useCreneaux, useValiderCreneauxClasse } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from './edt-calendar';
import { EDTFilterBar, type ContexteType } from './edt-filter-bar';
import { EDTMonthView } from './edt-month-view';
import { EDTDayView } from './edt-day-view';
import { EDTListeView } from './edt-liste';
import { EDTPreferencesPage } from './edt-preferences';
import { EDTTemplatesPage } from './edt-templates';
import { EDTSynthese } from './edt-synthese';
import { EDTAudit } from './edt-audit';
import { EDTHeuresCoursModal } from './edt-heures-cours-modal';
import { EDTCreneauModal } from './edt-creneau-modal';
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
type PlanningView = 'semaine' | 'mois' | 'jour' | 'liste';

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
    const [classeFilter, setClasseFilter] = useState('');
    const [planningView, setPlanningView] = useState<PlanningView>('semaine');
    const [showAnalytique, setShowAnalytique] = useState(false);
    const [navigationDate, setNavigationDate] = useState(new Date());
    // Filtres avancés (client-side)
    const [filtreMatiere, setFiltreMatiere] = useState('');
    const [filtreJour, setFiltreJour] = useState<JourSemaine | undefined>(undefined);

    // ─── Modals ─────────────────────────────────────
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [heuresCoursModalOpen, setHeuresCoursModalOpen] = useState(false);
    const [creneauModalOpen, setCreneauModalOpen] = useState(false);
    const [selectedCreneau, setSelectedCreneau] = useState<CreneauHoraire | null>(null);

    // ─── Navigation calculée ────────────────────────

    /** Lundi de la semaine de référence */
    const semaineDebut = useMemo(() => {
        const d = new Date(navigationDate);
        const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? 6 : day - 1);
        const lundi = new Date(d.setDate(diff));
        lundi.setHours(0, 0, 0, 0);
        return lundi;
    }, [navigationDate]);

    /** 1er du mois de référence */
    const moisDebut = useMemo(() => {
        const d = new Date(navigationDate);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [navigationDate]);

    /** Label dynamique selon le mode de vue */
    const navigationLabel = useMemo(() => {
        switch (planningView) {
            case 'semaine': {
                const fin = new Date(semaineDebut);
                fin.setDate(fin.getDate() + 5);
                const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                return `S${numeroSemaineISO(semaineDebut)} — ${fmt(semaineDebut)} — ${fmt(fin)}`;
            }
            case 'mois':
                return navigationDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            case 'jour':
                return navigationDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            case 'liste':
                return '';
        }
    }, [planningView, navigationDate, semaineDebut]);

    const estCourant = useMemo(() => {
        const now = new Date();
        switch (planningView) {
            case 'semaine': return isSameWeek(navigationDate, now);
            case 'mois': return navigationDate.getMonth() === now.getMonth() && navigationDate.getFullYear() === now.getFullYear();
            case 'jour': return navigationDate.toDateString() === now.toDateString();
            default: return true;
        }
    }, [planningView, navigationDate]);

    const naviguerPrecedent = useCallback(() => {
        setNavigationDate(prev => {
            const d = new Date(prev);
            switch (planningView) {
                case 'semaine': d.setDate(d.getDate() - 7); break;
                case 'mois': d.setMonth(d.getMonth() - 1); break;
                case 'jour': d.setDate(d.getDate() - 1); break;
            }
            return d;
        });
    }, [planningView]);

    const naviguerSuivant = useCallback(() => {
        setNavigationDate(prev => {
            const d = new Date(prev);
            switch (planningView) {
                case 'semaine': d.setDate(d.getDate() + 7); break;
                case 'mois': d.setMonth(d.getMonth() + 1); break;
                case 'jour': d.setDate(d.getDate() + 1); break;
            }
            return d;
        });
    }, [planningView]);

    const naviguerAujourdhui = useCallback(() => {
        setNavigationDate(new Date());
    }, []);

    // ─── Tabs ───────────────────────────────────────

    const TABS: Tab[] = [
        { id: 'planning', label: t('onglets.planning'), icon: Calendar },
        { id: 'configuration', label: t('onglets.configuration'), icon: Settings },
    ];

    // ─── Données ────────────────────────────────────

    const { data: classes } = useToutesClasses();
    const classeOptions = (classes ?? [])
        .filter(c => c.classeAnneeId && c.actif)
        .map(c => ({
            value: c.classeAnneeId!,
            label: `${c.nom}${c.anneeScolaire?.libelle ? ` — ${c.anneeScolaire.libelle}` : ''}`,
        }));

    const filters = classeFilter
        ? contexteType === 'classe' ? { classeAnneeId: classeFilter } : { limit: 100 }
        : { limit: 100 };
    const { data: paginated, isLoading, error, refetch } = useCreneaux(filters);
    const creneaux = paginated?.items ?? [];
    const validerCreneauxClasse = useValiderCreneauxClasse();

    /** Options de matière déduites des créneaux chargés */
    const matiereOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of creneaux) {
            const nom = c.affectationMatiere?.matiere?.nom;
            const id = c.affectationMatiereId;
            if (id && nom && !map.has(id)) {
                map.set(id, nom);
            }
        }
        return Array.from(map.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [creneaux]);

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

    /** Affectations et salles déduites des créneaux chargés (pour le modal) */
    const { affectationsDisponibles, sallesDisponibles } = useMemo(() => {
        const affectationMap = new Map<string, { id: string; matiere?: { nom: string; code?: string }; enseignant?: { nom: string; prenom: string } }>();
        const salleMap = new Map<string, { id: string; nom: string; code?: string }>();
        for (const c of creneaux) {
            if (c.affectationMatiereId && c.affectationMatiere && !affectationMap.has(c.affectationMatiereId)) {
                affectationMap.set(c.affectationMatiereId, {
                    id: c.affectationMatiere.id,
                    matiere: c.affectationMatiere.matiere,
                    enseignant: c.affectationMatiere.enseignant,
                });
            }
            if (c.salleId && c.salle && !salleMap.has(c.salleId)) {
                salleMap.set(c.salleId, { id: c.salle.id, nom: c.salle.nom, code: c.salle.code });
            }
        }
        return { affectationsDisponibles: Array.from(affectationMap.values()), sallesDisponibles: Array.from(salleMap.values()) };
    }, [creneaux]);

    // ─── Handlers ───────────────────────────────────

    const handleCreneauClick = (creneau: CreneauHoraire) => {
        setSelectedCreneau(creneau);
        setCreneauModalOpen(true);
    };

    const handleCreneauCreate = () => {
        setSelectedCreneau(null);
        setCreneauModalOpen(true);
    };

    const handleCellClick = (_jour: string, _heure: string) => {
        setSelectedCreneau(null);
        setCreneauModalOpen(true);
    };

    const handleExportPDF = () => {
        if (!classeFilter) return;
        window.open(`/api/emploi-du-temps/export/pdf/${classeFilter}`, '_blank');
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
                        classeAnneeId={classeFilter || undefined}
                        enseignantId={contexteType === 'enseignant' ? classeFilter || undefined : undefined}
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
                return <EDTListeView creneaux={filteredCreneaux} onCreneauClick={handleCreneauClick} />;
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
                            onContexteTypeChange={setContexteType}
                            classeFilter={classeFilter}
                            onClasseFilterChange={setClasseFilter}
                            classeOptions={classeOptions}
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
                            {classeFilter && contexteType === 'classe' && (
                                <ElisaButton
                                    variant="secondary"
                                    size="xs"
                                    icon={<ShieldCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    onClick={() => validerCreneauxClasse.mutate(classeFilter)}
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
                            {classeFilter && (
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
            <CustomModal
                open={genModalOpen}
                onOpenChange={setGenModalOpen}
                title={t('genererEmploiDuTemps')}
                description={t('configurerGeneration')}
                size="2xl"
            >
                {classeFilter && (
                    <EDTGenerationModal
                        classeAnneeId={classeFilter}
                        onSuccess={() => { setGenModalOpen(false); }}
                        onClose={() => setGenModalOpen(false)}
                    />
                )}
            </CustomModal>

            {/* ─── Modal Génération Heures de Cours ──── */}
            <CustomModal
                open={heuresCoursModalOpen}
                onOpenChange={setHeuresCoursModalOpen}
                title={t('generationHeuresCours.titre')}
                description={t('generationHeuresCours.description')}
                size="xl"
            >
                <EDTHeuresCoursModal
                    enseignantId={contexteType === 'enseignant' ? classeFilter : ''}
                    classeAnneeId={contexteType === 'classe' ? classeFilter || undefined : undefined}
                    onClose={() => setHeuresCoursModalOpen(false)}
                />
            </CustomModal>

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

// ─── Helpers ─────────────────────────────────────────

function numeroSemaineISO(d: Date): number {
    const date = new Date(d);
    date.setDate(date.getDate() + 3);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
}

function isSameWeek(a: Date, b: Date): boolean {
    const getMonday = (d: Date) => {
        const r = new Date(d);
        const day = r.getDay();
        r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
        r.setHours(0, 0, 0, 0);
        return r;
    };
    return getMonday(a).getTime() === getMonday(b).getTime();
}
