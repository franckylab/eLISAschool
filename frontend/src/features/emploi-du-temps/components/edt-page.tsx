/**
 * ==================================
 * eLISAschool - Page Emploi du Temps (Stand-alone)
 * ==================================
 * Page principale de gestion des emplois du temps
 * Contexte : classe / enseignant / salle
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Calendar, List, Settings, FileText, BarChart3, Plus, Download, ChevronLeft, ChevronRight, Shield, CalendarCheck } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from './edt-calendar';
import { EmploiDuTempsListe } from './edt-liste';
import { EDTPreferencesPage } from './edt-preferences';
import { EDTTemplatesPage } from './edt-templates';
import { EDTSynthese } from './edt-synthese';
import { EDTAudit } from './edt-audit';
import { EDTHeuresCoursModal } from './edt-heures-cours-modal';
import { EDTCreneauModal } from './edt-creneau-modal';
import type { CreneauHoraire } from '../types/edt.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { CustomModal } from '@/components/modals/CustomModal';
import { EDTGenerationModal } from './edt-generation-modal';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';

type EDTTab = 'calendrier' | 'liste' | 'synthese' | 'preferences' | 'templates' | 'audit';
type ContexteType = 'classe' | 'enseignant' | 'salle';

const EDT_TABS: EDTTab[] = ['calendrier', 'liste', 'synthese', 'preferences', 'templates', 'audit'];

function isEDTTab(v: unknown): v is EDTTab {
    return typeof v === 'string' && EDT_TABS.includes(v as EDTTab);
}

export function EDTStandalonePage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { tab?: string };
    const tab: EDTTab = isEDTTab(search.tab) ? search.tab : 'calendrier';
    const setTab = (id: string) => navigate({ search: { tab: id } as never });

    const [contexteType, setContexteType] = useState<ContexteType>('classe');
    const [classeFilter, setClasseFilter] = useState('');
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [heuresCoursModalOpen, setHeuresCoursModalOpen] = useState(false);
    const [creneauModalOpen, setCreneauModalOpen] = useState(false);
    const [selectedCreneau, setSelectedCreneau] = useState<CreneauHoraire | null>(null);
    const [semaineOffset, setSemaineOffset] = useState(0);

    /** Lundi de la semaine affichée */
    const semaineDebut = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1) + semaineOffset * 7;
        const lundi = new Date(now.setDate(diff));
        lundi.setHours(0, 0, 0, 0);
        return lundi;
    }, [semaineOffset]);

    /** Numéro de semaine ISO */
    const numeroSemaine = useMemo(() => {
        const d = new Date(semaineDebut);
        d.setDate(d.getDate() + 3);
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
    }, [semaineDebut]);

    /** Label de la semaine (ex: "28 juil. — 3 août") */
    const labelSemaine = useMemo(() => {
        const fin = new Date(semaineDebut);
        fin.setDate(fin.getDate() + 5); // samedi
        const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        return `${fmt(semaineDebut)} — ${fmt(fin)}`;
    }, [semaineDebut]);

    const semaineEstCourante = semaineOffset === 0;
    const allerSemainePrecedente = useCallback(() => setSemaineOffset(o => o - 1), []);
    const allerSemaineSuivante = useCallback(() => setSemaineOffset(o => o + 1), []);
    const allerSemaineCourante = useCallback(() => setSemaineOffset(0), []);

    const TABS: Tab[] = [
        { id: 'calendrier', label: t('onglets.calendrier'), icon: Calendar },
        { id: 'liste', label: t('onglets.liste'), icon: List },
        { id: 'synthese', label: t('onglets.synthese'), icon: BarChart3 },
        { id: 'preferences', label: t('onglets.preferences'), icon: Settings },
        { id: 'templates', label: t('onglets.templates'), icon: FileText },
        { id: 'audit', label: t('onglets.audit'), icon: Shield },
    ];

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
        // Le jour et l'heure seront passés via le modal si nécessaire
    };

    const handleExportPDF = () => {
        if (!classeFilter) return;
        window.open(`/api/emploi-du-temps/export/pdf/${classeFilter}`, '_blank');
    };

    const renderCalendrier = () => (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {/* ─── Navigation semaine ─────────── */}
            <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        icon={<ChevronLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={allerSemainePrecedente}
                        aria-label={t('calendrier.precedent')}
                    />
                    <button
                        onClick={allerSemaineCourante}
                        className={`rounded-lg px-[var(--space-sm)] py-[var(--space-xs)] font-medium transition-colors ${
                            semaineEstCourante
                                ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    >
                        {t('calendrier.aujourdhui')}
                    </button>
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        icon={<ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={allerSemaineSuivante}
                        aria-label={t('calendrier.suivant')}
                    />
                </div>
                <div
                    className="font-semibold text-[var(--color-text-primary)]"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 1rem)' }}
                >
                    {t('calendrier.semaine')} {numeroSemaine} — {labelSemaine}
                </div>
            </div>

            {/* ─── Barre de contexte + actions ─────── */}
            <div
                className="flex flex-wrap items-center justify-between gap-[var(--gap-md)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]"
            >
                {/* Sélecteur de contexte */}
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                    <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                        {(['classe', 'enseignant', 'salle'] as ContexteType[]).map(ct => (
                            <button
                                key={ct}
                                onClick={() => setContexteType(ct)}
                                className={`px-[var(--space-sm)] py-[var(--space-xs)] font-medium transition-colors ${
                                    contexteType === ct
                                        ? 'bg-[var(--color-dominant-600)] text-white'
                                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                                }`}
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                            >
                                {t(`contexte.${ct}`)}
                            </button>
                        ))}
                    </div>
                    <select
                        value={classeFilter}
                        onChange={(e) => setClasseFilter(e.target.value)}
                        className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                        style={{
                            fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
                            padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                            minWidth: 'clamp(140px, 30vw, 260px)',
                        }}
                    >
                        <option value="">{contexteType === 'classe' ? t('tousLesCreneaux') : t('selectionnerFiltre')}</option>
                        {classeOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-[var(--gap-sm)]">
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
            </div>

            {/* ─── Contenu ──────────────────────────── */}
            {isLoading ? (
                <PageSkeleton showHeader={false} showStats={false} showTable />
            ) : creneaux.length === 0 ? (
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
            ) : (
                <EDTCalendar creneaux={creneaux} onCreneauClick={handleCreneauClick} onCellClick={handleCellClick} semaineDebut={semaineDebut} />
            )}
        </div>
    );

    const renderListe = () => {
        if (!classeFilter) {
            return (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] py-[var(--space-xl)]">
                    <List className="h-[clamp(3rem,2.5rem+2vw,4rem)] w-[clamp(3rem,2.5rem+2vw,4rem)] text-[var(--color-text-muted)] mx-auto mb-[var(--space-md)]" />
                    <h3
                        className="font-semibold text-[var(--color-text-primary)] mb-[var(--space-sm)]"
                        style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                    >
                        {t('aucuneClasseSelectionnee')}
                    </h3>
                    <p
                        className="text-[var(--color-text-secondary)] max-w-md mx-auto text-center"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {t('selectionnerClassePourVoirListe')}
                    </p>
                </div>
            );
        }
        return <EmploiDuTempsListe classeAnneeId={classeFilter} anneeScolaireId="" />;
    };

    const renderTab = () => {
        switch (tab) {
            case 'calendrier': return renderCalendrier();
            case 'liste': return renderListe();
            case 'synthese': return (
                <EDTSynthese
                    classeAnneeId={classeFilter || undefined}
                    enseignantId={contexteType === 'enseignant' ? classeFilter || undefined : undefined}
                />
            );
            case 'preferences': return <EDTPreferencesPage />;
            case 'templates': return <EDTTemplatesPage />;
            case 'audit': return <EDTAudit />;
            default: return null;
        }
    };

    if (error) {
        return (
            <div className="p-[var(--space-lg)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

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
            >
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
                onSuccess={() => refetch()}
            />
        </div>
    );
}