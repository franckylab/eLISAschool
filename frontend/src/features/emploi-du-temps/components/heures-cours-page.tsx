/**
 * ==================================
 * eLISAschool - Page Heures de Cours (Globale)
 * ==================================
 * Vue établissement avec stats, filtres avancés, DataTable et export.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Clock, CalendarPlus, Download, Plus, CheckCircle2, XCircle,
    UserCheck, BarChart3, TrendingUp, CalendarDays,
} from 'lucide-react';
import { useHeureCoursList, useStatistiquesGlobales, useUpdateHeureCours } from '@/features/personnel/hooks/use-heure-cours';
import type { HeureCours } from '@/features/personnel/hooks/use-heure-cours';
import { useEnseignantOptions, useSalleOptions, useMatiereOptions } from '@/features/emploi-du-temps/hooks/use-emploi-du-temps';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FilterPanel } from '@/components/ui/FilterPanel';
import type { FilterDef } from '@/components/ui/FilterPanel';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { HeuresCoursExportModal } from './heures-cours-export-modal';

// ─── Types filtres ────────────────────────────────────────────

interface FiltresHeuresCours {
    enseignantId: string;
    classeAnneeId: string;
    matiereId: string;
    salleId: string;
    statutEffectue: string;
    dateDebut: string;
    dateFin: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
}

const FILTRES_INITIAUX: FiltresHeuresCours = {
    enseignantId: '',
    classeAnneeId: '',
    matiereId: '',
    salleId: '',
    statutEffectue: '',
    dateDebut: '',
    dateFin: '',
    page: 1,
    limit: 25,
    sortBy: 'date',
    sortOrder: 'DESC',
};

// ─── Badge statut ─────────────────────────────────────────────

function BadgeStatut({ statut, label }: { statut: string; label: string }) {
    const variantMap: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'outline'> = {
        PLANIFIE: 'default',
        EFFECTUE: 'success',
        ANNULE: 'danger',
        REMPLACE: 'warning',
    };
    return <Badge variant={variantMap[statut] ?? 'outline'} size="sm">{label}</Badge>;
}

// ─── Composant principal ──────────────────────────────────────

export function HeuresCoursPage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();

    // ─── État filtres ──────────────────────────────────────
    const [filtres, setFiltres] = useState<FiltresHeuresCours>(FILTRES_INITIAUX);
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);

    const updateFiltre = useCallback((key: string, value: string) => {
        setFiltres(prev => ({ ...prev, [key]: value, page: 1 }));
    }, []);

    const clearFiltres = useCallback(() => {
        setFiltres(prev => ({ ...FILTRES_INITIAUX, sortBy: prev.sortBy, sortOrder: prev.sortOrder }));
    }, []);

    // ─── Params serveur ────────────────────────────────────
    const serverParams = useMemo(() => {
        const params: Record<string, string | number> = {
            page: filtres.page,
            limit: filtres.limit,
            sortBy: filtres.sortBy,
            sortOrder: filtres.sortOrder,
        };
        if (filtres.enseignantId) params.enseignantId = filtres.enseignantId;
        if (filtres.classeAnneeId) params.classeAnneeId = filtres.classeAnneeId;
        if (filtres.matiereId) params.matiereId = filtres.matiereId;
        if (filtres.salleId) params.salleId = filtres.salleId;
        if (filtres.statutEffectue) params.statutEffectue = filtres.statutEffectue;
        if (filtres.dateDebut) params.dateDebut = filtres.dateDebut;
        if (filtres.dateFin) params.dateFin = filtres.dateFin;
        return params;
    }, [filtres]);

    // ─── Stats globales (même filtres) ─────────────────────
    const statsFiltres = useMemo(() => {
        const f: Record<string, string | undefined> = {};
        if (filtres.enseignantId) f.enseignantId = filtres.enseignantId;
        if (filtres.classeAnneeId) f.classeAnneeId = filtres.classeAnneeId;
        if (filtres.matiereId) f.matiereId = filtres.matiereId;
        if (filtres.salleId) f.salleId = filtres.salleId;
        if (filtres.dateDebut) f.dateDebut = filtres.dateDebut;
        if (filtres.dateFin) f.dateFin = filtres.dateFin;
        return f;
    }, [filtres.enseignantId, filtres.classeAnneeId, filtres.matiereId, filtres.salleId, filtres.dateDebut, filtres.dateFin]);

    // ─── Hooks données ─────────────────────────────────────
    const { data: stats, isLoading: statsLoading } = useStatistiquesGlobales(statsFiltres);
    const { data: paginated, isLoading, error, refetch } = useHeureCoursList(serverParams);
    const updateHeureCours = useUpdateHeureCours();

    // ─── Options filtres ───────────────────────────────────
    const { data: enseignantOptions = [] } = useEnseignantOptions();
    const { data: salleOptions = [] } = useSalleOptions();
    const { data: matiereOptions = [] } = useMatiereOptions();
    const { data: classes = [] } = useToutesClasses();

    const classeOptions = useMemo(() => {
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

    // ─── Définitions filtres ───────────────────────────────
    const filterDefs: FilterDef[] = useMemo(() => [
        { key: 'enseignantId', label: t('heuresCoursPage.filtres.enseignant'), type: 'select', options: enseignantOptions, allOptionLabel: t('heuresCoursPage.filtres.tousEnseignants') },
        { key: 'classeAnneeId', label: t('heuresCoursPage.filtres.classe'), type: 'select', options: classeOptions, allOptionLabel: t('heuresCoursPage.filtres.toutesClasses') },
        { key: 'matiereId', label: t('heuresCoursPage.filtres.matiere'), type: 'select', options: matiereOptions, allOptionLabel: t('heuresCoursPage.filtres.toutesMatieres') },
        { key: 'salleId', label: t('heuresCoursPage.filtres.salle'), type: 'select', options: salleOptions, allOptionLabel: t('heuresCoursPage.filtres.toutesSalles') },
        { key: 'statutEffectue', label: t('heuresCoursPage.filtres.statut'), type: 'select', options: [
            { value: 'PLANIFIE', label: t('heuresCoursPage.statuts.planifie') },
            { value: 'EFFECTUE', label: t('heuresCoursPage.statuts.effectue') },
            { value: 'ANNULE', label: t('heuresCoursPage.statuts.annule') },
            { value: 'REMPLACE', label: t('heuresCoursPage.statuts.remplace') },
        ], allOptionLabel: t('heuresCoursPage.filtres.tousStatuts') },
        { key: 'dateDebut', label: t('heuresCoursPage.filtres.dateDebut'), type: 'date' },
        { key: 'dateFin', label: t('heuresCoursPage.filtres.dateFin'), type: 'date' },
    ], [t, enseignantOptions, classeOptions, matiereOptions, salleOptions]);

    const filterValues = useMemo(() => ({
        enseignantId: filtres.enseignantId,
        classeAnneeId: filtres.classeAnneeId,
        matiereId: filtres.matiereId,
        salleId: filtres.salleId,
        statutEffectue: filtres.statutEffectue,
        dateDebut: filtres.dateDebut,
        dateFin: filtres.dateFin,
    }), [filtres]);

    const activeFilterCount = useMemo(() => Object.values(filterValues).filter(v => v !== '').length, [filterValues]);

    // ─── Colonnes DataTable ────────────────────────────────
    const columns: Column<HeureCours>[] = useMemo(() => [
        {
            key: 'date',
            header: t('heuresCoursPage.colonnes.date'),
            sortable: true,
            size: 120,
            render: (item) => (
                <span className="font-medium text-[var(--color-text-primary)]">
                    {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
            ),
        },
        {
            key: 'heure',
            header: t('heuresCoursPage.colonnes.heure'),
            size: 120,
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.heureDebut} – {item.heureFin}
                </span>
            ),
        },
        {
            key: 'matiere',
            header: t('heuresCoursPage.colonnes.matiere'),
            sortable: true,
            render: (item) => (
                <span className="font-medium text-[var(--color-text-primary)]">
                    {item.matiere?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'classe',
            header: t('heuresCoursPage.colonnes.classe'),
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.classeAnnee?.classe?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'enseignant',
            header: t('heuresCoursPage.colonnes.enseignant'),
            hidden: true,
            render: (_item) => <span className="text-[var(--color-text-secondary)]">—</span>,
        },
        {
            key: 'salle',
            header: t('heuresCoursPage.colonnes.salle'),
            size: 100,
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.salle?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'typeCreneau',
            header: t('heuresCoursPage.colonnes.type'),
            size: 80,
            render: (item) => (
                <Badge variant="outline" size="sm">{item.typeCreneau}</Badge>
            ),
        },
        {
            key: 'statutEffectue',
            header: t('heuresCoursPage.colonnes.statut'),
            size: 120,
            render: (item) => {
                const statutKey = item.statutEffectue.toLowerCase().replace('_e', 'e');
                const labelMap: Record<string, string> = {
                    PLANIFIE: t('heuresCoursPage.statuts.planifie'),
                    EFFECTUE: t('heuresCoursPage.statuts.effectue'),
                    ANNULE: t('heuresCoursPage.statuts.annule'),
                    REMPLACE: t('heuresCoursPage.statuts.remplace'),
                };
                return <BadgeStatut statut={item.statutEffectue} label={labelMap[item.statutEffectue] ?? statutKey} />;
            },
        },
        {
            key: 'actions',
            header: t('heuresCoursPage.colonnes.actions'),
            size: 140,
            enableResizing: false,
            render: (item) => (
                <div className="flex items-center gap-1">
                    {item.statutEffectue === 'PLANIFIE' && (
                        <>
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={() => updateHeureCours.mutate({ id: item.id, statutEffectue: 'EFFECTUE' })}
                                aria-label={t('heuresCoursPage.actions.marquerEffectue')}
                                title={t('heuresCoursPage.actions.marquerEffectue')}
                            />
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={() => updateHeureCours.mutate({ id: item.id, statutEffectue: 'ANNULE' })}
                                aria-label={t('heuresCoursPage.actions.marquerAnnule')}
                                title={t('heuresCoursPage.actions.marquerAnnule')}
                            />
                        </>
                    )}
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        icon={<UserCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={() => navigate({ to: '/heures-cours/remplacements' } as any)}
                        aria-label={t('heuresCoursPage.actions.remplacer')}
                        title={t('heuresCoursPage.actions.remplacer')}
                    />
                </div>
            ),
        },
    ], [t, updateHeureCours, navigate]);

    // ─── Handlers ──────────────────────────────────────────

    const handleSortChange = useCallback((sortBy: string, sortOrder: 'ASC' | 'DESC') => {
        setFiltres(prev => ({ ...prev, sortBy, sortOrder }));
    }, []);

    const exportQuery = useMemo(() => {
        const q: Record<string, string | undefined> = {};
        if (filtres.enseignantId) q.enseignantId = filtres.enseignantId;
        if (filtres.classeAnneeId) q.classeAnneeId = filtres.classeAnneeId;
        if (filtres.matiereId) q.matiereId = filtres.matiereId;
        if (filtres.salleId) q.salleId = filtres.salleId;
        if (filtres.dateDebut) q.dateDebut = filtres.dateDebut;
        if (filtres.dateFin) q.dateFin = filtres.dateFin;
        return q;
    }, [filtres.enseignantId, filtres.classeAnneeId, filtres.matiereId, filtres.salleId, filtres.dateDebut, filtres.dateFin]);

    // ─── Erreur ────────────────────────────────────────────
    if (error) {
        return (
            <div className="p-[var(--space-lg)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    // ─── Rendu ─────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[clamp(var(--space-sm),2vw,var(--space-lg))]">
            {/* ─── Header ──────────────────────────────── */}
            <PageHeader
                variant="gradient"
                icon={Clock}
                title={t('heuresCoursPage.titre')}
                subtitle={t('heuresCoursPage.subtitle')}
                onBack={() => navigate({ to: '/emploi-du-temps' } as any)}
            />

            {/* ─── Dashboard Stats ─────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[var(--gap-sm)]">
                <StatCard
                    icon={BarChart3}
                    label={t('heuresCoursPage.stats.totalHeures')}
                    value={stats ? stats.totalHeures.toFixed(1) : '—'}
                    subtitle={t('heuresCoursPage.stats.heures')}
                    tone="accent"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={CheckCircle2}
                    label={t('heuresCoursPage.stats.tauxEffectuation')}
                    value={stats ? `${stats.tauxEffectuation.toFixed(0)}%` : '—'}
                    tone="success"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={XCircle}
                    label={t('heuresCoursPage.stats.tauxAnnulation')}
                    value={stats ? `${stats.tauxAnnulation.toFixed(0)}%` : '—'}
                    tone="danger"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={UserCheck}
                    label={t('heuresCoursPage.stats.tauxRemplacement')}
                    value={stats ? `${stats.tauxRemplacement.toFixed(0)}%` : '—'}
                    tone="warning"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={CalendarDays}
                    label={t('heuresCoursPage.stats.volumeSemaine')}
                    value={stats ? stats.volumeSemaine.toFixed(1) : '—'}
                    subtitle={t('heuresCoursPage.stats.heures')}
                    tone="purple"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('heuresCoursPage.stats.volumeMois')}
                    value={stats ? stats.volumeMois.toFixed(1) : '—'}
                    subtitle={t('heuresCoursPage.stats.heures')}
                    tone="orange"
                    loading={statsLoading}
                    compact
                />
            </div>

            {/* ─── Toolbar ─────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                <ElisaButton
                    variant="secondary"
                    size="xs"
                    icon={<CalendarPlus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                    onClick={() => navigate({ to: '/emploi-du-temps', search: { tab: 'planning' } } as any)}
                >
                    <span className="hidden sm:inline">{t('heuresCoursPage.actions.generer')}</span>
                </ElisaButton>
                <ElisaButton
                    variant="secondary"
                    size="xs"
                    icon={<Download className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                    onClick={() => setExportModalOpen(true)}
                >
                    <span className="hidden sm:inline">{t('heuresCoursPage.actions.exportCSV')}</span>
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    size="xs"
                    icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                    onClick={() => navigate({ to: '/emploi-du-temps', search: { tab: 'planning' } } as any)}
                >
                    <span className="hidden sm:inline">{t('heuresCoursPage.actions.ajouter')}</span>
                </ElisaButton>
            </div>

            {/* ─── FilterPanel ─────────────────────────── */}
            <FilterPanel
                open={filterPanelOpen}
                onOpenChange={setFilterPanelOpen}
                filters={filterDefs}
                values={filterValues}
                onChange={updateFiltre}
                onClear={clearFiltres}
                activeCount={activeFilterCount}
            />

            {/* ─── DataTable ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <DataTable<HeureCours>
                    tableId="heures-cours-globales"
                    data={paginated?.items ?? []}
                    columns={columns}
                    isLoading={isLoading}
                    searchable={false}
                    pagination={{
                        page: filtres.page,
                        limit: filtres.limit,
                        total: paginated?.total ?? 0,
                    }}
                    onPageChange={(page) => setFiltres(prev => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres(prev => ({ ...prev, limit, page: 1 }))}
                    sortBy={filtres.sortBy}
                    sortOrder={filtres.sortOrder}
                    onSortChange={handleSortChange}
                    getRowId={(item) => item.id}
                    emptyMessage={t('heuresCoursPage.aucunCours')}
                />
            </motion.div>

            {/* ─── Modal Export ──────────────────────── */}
            <HeuresCoursExportModal
                open={exportModalOpen}
                onOpenChange={setExportModalOpen}
                filtres={exportQuery}
            />
        </div>
    );
}
