/**
 * ==================================
 * eLISAschool - Page Remplacements
 * ==================================
 * Page dédiée à la gestion des remplacements d'enseignants.
 * Stats rapides + DataTable + StepperModal de création.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    UserCheck, Clock, CheckCircle2, XCircle, AlertCircle,
    Plus, Eye, ThumbsUp, ThumbsDown, Ban,
} from 'lucide-react';
import {
    useRemplacements, useStatistiquesRemplacements,
    useValiderRemplacement, useRejeterRemplacement, useAnnulerRemplacement,
} from '@/features/personnel/hooks/use-remplacement-heure-cours';
import type { RemplacementHeureCours } from '@/features/personnel/hooks/use-remplacement-heure-cours';
import { useEnseignantOptions } from '@/features/emploi-du-temps/hooks/use-emploi-du-temps';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FilterPanel } from '@/components/ui/FilterPanel';
import type { FilterDef } from '@/components/ui/FilterPanel';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui';
import { CustomModal } from '@/components/modals/CustomModal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { RemplacementStepperModal } from './remplacement-stepper-modal';

// ─── Badge statut remplacement ──────────────────────────────

function BadgeStatutRemplacement({ statut, label }: { statut: string; label: string }) {
    const variantMap: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'outline'> = {
        EN_ATTENTE: 'warning',
        VALIDEE: 'success',
        REJETEE: 'danger',
        EXECUTEE: 'success',
        ANNULEE: 'outline',
    };
    return <Badge variant={variantMap[statut] ?? 'outline'} size="sm">{label}</Badge>;
}

// ─── Composant principal ─────────────────────────────────────

export function RemplacementsPage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();

    // ─── État ────────────────────────────────────────────
    const [stepperOpen, setStepperOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailRemplacement, setDetailRemplacement] = useState<RemplacementHeureCours | null>(null);
    const [filtres, setFiltres] = useState<Record<string, string>>({ statut: '', demandeurId: '' });
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 25;

    const updateFiltre = useCallback((key: string, value: string) => {
        setFiltres(prev => ({ ...prev, [key]: value }));
        setPage(1);
    }, []);

    const clearFiltres = useCallback(() => {
        setFiltres({ statut: '', demandeurId: '' });
        setPage(1);
    }, []);

    // ─── Params serveur ──────────────────────────────────
    const serverParams = useMemo(() => {
        const params: Record<string, string | number> = { page, limit };
        if (filtres.statut) params.statut = filtres.statut;
        if (filtres.demandeurId) params.demandeurId = filtres.demandeurId;
        return params;
    }, [filtres, page, limit]);

    // ─── Hooks données ───────────────────────────────────
    const { data: stats, isLoading: statsLoading } = useStatistiquesRemplacements();
    const { data: paginated, isLoading, error, refetch } = useRemplacements(serverParams);
    const valider = useValiderRemplacement();
    const rejeter = useRejeterRemplacement();
    const annuler = useAnnulerRemplacement();
    const { data: enseignantOptions = [] } = useEnseignantOptions();

    // ─── Filtres defs ────────────────────────────────────
    const filterDefs: FilterDef[] = useMemo(() => [
        {
            key: 'statut',
            label: t('remplacements.colonnes.statut'),
            type: 'select',
            options: [
                { value: 'EN_ATTENTE', label: t('remplacements.statuts.enAttente') },
                { value: 'VALIDEE', label: t('remplacements.statuts.validee') },
                { value: 'REJETEE', label: t('remplacements.statuts.rejetee') },
                { value: 'EXECUTEE', label: t('remplacements.statuts.executee') },
                { value: 'ANNULEE', label: t('remplacements.statuts.annulee') },
            ],
            allOptionLabel: t('heuresCoursPage.filtres.tousStatuts'),
        },
        {
            key: 'demandeurId',
            label: t('heuresCoursPage.filtres.enseignant'),
            type: 'select',
            options: enseignantOptions,
            allOptionLabel: t('heuresCoursPage.filtres.tousEnseignants'),
        },
    ], [t, enseignantOptions]);

    const activeFilterCount = useMemo(() => Object.values(filtres).filter(v => v !== '').length, [filtres]);

    // ─── Colonnes DataTable ──────────────────────────────
    const columns: Column<RemplacementHeureCours>[] = useMemo(() => [
        {
            key: 'dateCours',
            header: t('remplacements.colonnes.dateCours'),
            sortable: true,
            size: 140,
            render: (item) => (
                <span className="font-medium text-[var(--color-text-primary)]">
                    {item.heureCours?.date
                        ? new Date(item.heureCours.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
                        : '—'}
                </span>
            ),
        },
        {
            key: 'heure',
            header: t('heuresCoursPage.colonnes.heure'),
            size: 110,
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.heureCours?.heureDebut && item.heureCours?.heureFin
                        ? `${item.heureCours.heureDebut} – ${item.heureCours.heureFin}`
                        : '—'}
                </span>
            ),
        },
        {
            key: 'matiere',
            header: t('remplacements.colonnes.matiere'),
            render: (item) => (
                <span className="font-medium text-[var(--color-text-primary)]">
                    {item.heureCours?.matiere?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'classe',
            header: t('remplacements.colonnes.classe'),
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.heureCours?.classeAnnee?.classe?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'enseignantAbsent',
            header: t('remplacements.colonnes.enseignantAbsent'),
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.demandeur ? `${item.demandeur.prenom} ${item.demandeur.nom}` : '—'}
                </span>
            ),
        },
        {
            key: 'remplacant',
            header: t('remplacements.colonnes.remplacantPropose'),
            render: (item) => (
                <span className="text-[var(--color-text-secondary)]">
                    {item.remplacant ? `${item.remplacant.prenom} ${item.remplacant.nom}` : '—'}
                </span>
            ),
        },
        {
            key: 'motif',
            header: t('remplacements.colonnes.motif'),
            hidden: true,
            render: (item) => (
                <span className="text-[var(--color-text-secondary)] truncate max-w-[200px] block" title={item.motif}>
                    {item.motif}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('remplacements.colonnes.statut'),
            size: 120,
            render: (item) => {
                const labelMap: Record<string, string> = {
                    EN_ATTENTE: t('remplacements.statuts.enAttente'),
                    VALIDEE: t('remplacements.statuts.validee'),
                    REJETEE: t('remplacements.statuts.rejetee'),
                    EXECUTEE: t('remplacements.statuts.executee'),
                    ANNULEE: t('remplacements.statuts.annulee'),
                };
                return <BadgeStatutRemplacement statut={item.statut} label={labelMap[item.statut] ?? item.statut} />;
            },
        },
        {
            key: 'actions',
            header: t('remplacements.colonnes.actions'),
            size: 160,
            enableResizing: false,
            render: (item) => (
                <div className="flex items-center gap-1">
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        icon={<Eye className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={() => { setDetailRemplacement(item); setDetailModalOpen(true); }}
                        aria-label={t('remplacements.actions.voirDetail')}
                        title={t('remplacements.actions.voirDetail')}
                    />
                    {item.statut === 'EN_ATTENTE' && (
                        <>
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<ThumbsUp className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success)]" />}
                                onClick={() => {
                                    if (item.remplacant) {
                                        valider.mutate({ id: item.id, remplacantId: item.remplacant.id! });
                                    }
                                }}
                                disabled={!item.remplacantId}
                                aria-label={t('remplacements.actions.valider')}
                                title={t('remplacements.actions.valider')}
                            />
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<ThumbsDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-danger)]" />}
                                onClick={() => rejeter.mutate({ id: item.id, motif: 'Rejeté par le validateur' })}
                                aria-label={t('remplacements.actions.rejeter')}
                                title={t('remplacements.actions.rejeter')}
                            />
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<Ban className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)]" />}
                                onClick={() => annuler.mutate(item.id)}
                                aria-label={t('remplacements.actions.annuler')}
                                title={t('remplacements.actions.annuler')}
                            />
                        </>
                    )}
                </div>
            ),
        },
    ], [t, valider, rejeter, annuler]);

    // ─── Erreur ──────────────────────────────────────────
    if (error) {
        return (
            <div className="p-[var(--space-lg)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    // ─── Rendu ───────────────────────────────────────────
    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[clamp(var(--space-sm),2vw,var(--space-lg))]">
            {/* ─── Header ──────────────────────────────── */}
            <PageHeader
                variant="gradient"
                icon={UserCheck}
                title={t('remplacements.titre')}
                subtitle={t('remplacements.subtitle')}
                onBack={() => navigate({ to: '/heures-cours' } as any)}
            />

            {/* ─── Stats rapides ───────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)]">
                <StatCard
                    icon={Clock}
                    label={t('remplacements.stats.enAttente')}
                    value={stats?.enAttente ?? 0}
                    tone="warning"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={CheckCircle2}
                    label={t('remplacements.stats.validees')}
                    value={stats?.validees ?? 0}
                    tone="success"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={XCircle}
                    label={t('remplacements.stats.rejetees')}
                    value={stats?.rejetees ?? 0}
                    tone="danger"
                    loading={statsLoading}
                    compact
                />
                <StatCard
                    icon={AlertCircle}
                    label={t('remplacements.stats.executees')}
                    value={stats?.executees ?? 0}
                    tone="accent"
                    loading={statsLoading}
                    compact
                />
            </div>

            {/* ─── Toolbar ─────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                <ElisaButton
                    variant="primary"
                    size="xs"
                    icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                    onClick={() => setStepperOpen(true)}
                >
                    {t('remplacements.actions.nouvelleDemande')}
                </ElisaButton>
            </div>

            {/* ─── FilterPanel ─────────────────────────── */}
            <FilterPanel
                open={filterPanelOpen}
                onOpenChange={setFilterPanelOpen}
                filters={filterDefs}
                values={filtres}
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
                <DataTable<RemplacementHeureCours>
                    tableId="remplacements-heure-cours"
                    data={paginated?.items ?? []}
                    columns={columns}
                    isLoading={isLoading}
                    searchable={false}
                    pagination={{
                        page,
                        limit,
                        total: paginated?.total ?? 0,
                    }}
                    onPageChange={setPage}
                    getRowId={(item) => item.id}
                    emptyMessage={t('remplacements.aucuneDemande')}
                />
            </motion.div>

            {/* ─── StepperModal (création demande) ─────── */}
            <RemplacementStepperModal
                open={stepperOpen}
                onOpenChange={setStepperOpen}
            />

            {/* ─── Modal détail ────────────────────────── */}
            <CustomModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                title={t('remplacements.actions.voirDetail')}
                size="md"
            >
                {detailRemplacement && (
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.dateCours')}</span>
                            <span className="font-medium">
                                {detailRemplacement.heureCours?.date
                                    ? new Date(detailRemplacement.heureCours.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.matiere')}</span>
                            <span className="font-medium">{detailRemplacement.heureCours?.matiere?.nom ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.classe')}</span>
                            <span className="font-medium">{detailRemplacement.heureCours?.classeAnnee?.classe?.nom ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.enseignantAbsent')}</span>
                            <span className="font-medium">
                                {detailRemplacement.demandeur ? `${detailRemplacement.demandeur.prenom} ${detailRemplacement.demandeur.nom}` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.remplacantPropose')}</span>
                            <span className="font-medium">
                                {detailRemplacement.remplacant ? `${detailRemplacement.remplacant.prenom} ${detailRemplacement.remplacant.nom}` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.motif')}</span>
                            <span className="font-medium text-right max-w-[60%]">{detailRemplacement.motif}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.statut')}</span>
                            <BadgeStatutRemplacement
                                statut={detailRemplacement.statut}
                                label={{ EN_ATTENTE: t('remplacements.statuts.enAttente'), VALIDEE: t('remplacements.statuts.validee'), REJETEE: t('remplacements.statuts.rejetee'), EXECUTEE: t('remplacements.statuts.executee'), ANNULEE: t('remplacements.statuts.annulee') }[detailRemplacement.statut] ?? detailRemplacement.statut}
                            />
                        </div>
                        {detailRemplacement.commentaires && (
                            <div className="border-t border-[var(--color-bordure)] pt-[var(--space-sm)]">
                                <span className="text-sm text-[var(--color-text-secondary)]">Commentaires</span>
                                <p className="text-sm text-[var(--color-text-primary)] mt-1">{detailRemplacement.commentaires}</p>
                            </div>
                        )}
                    </div>
                )}
            </CustomModal>
        </div>
    );
}
