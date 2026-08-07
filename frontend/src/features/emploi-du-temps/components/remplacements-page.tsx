/**
 * ==================================
 * eLISAschool - Page Remplacements
 * ==================================
 * Page dédiée à la gestion des remplacements d'enseignants.
 * Stats rapides + DataTable (filtres intégrés) + workflow 2 étapes.
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    UserCheck, Clock, CheckCircle2, XCircle, AlertCircle,
    Plus, Eye, ThumbsUp, ThumbsDown, Ban, Play,
} from 'lucide-react';
import {
    useRemplacements, useStatistiquesRemplacements,
    useValiderRemplacement, useRejeterRemplacement, useAnnulerRemplacement,
    useExecuterRemplacement,
} from '@/features/personnel/hooks/use-remplacement-heure-cours';
import type { RemplacementHeureCours } from '@/features/personnel/hooks/use-remplacement-heure-cours';
import { useEnseignantOptions } from '@/features/emploi-du-temps/hooks/use-emploi-du-temps';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import type { FilterDef } from '@/components/ui/FilterPanel';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ColonneEnseignant, ColonneMatiere, ColonneClasse, BadgeStatutCreneau } from '@/components/ui/data-table';
import { RemplacementStepperModal } from './remplacement-stepper-modal';

// ─── Labels statut remplacement ─────────────────────────────

const STATUT_REMPLACEMENT_LABEL_KEYS: Record<string, string> = {
    EN_ATTENTE: 'remplacements.statuts.enAttente',
    VALIDEE: 'remplacements.statuts.validee',
    REJETEE: 'remplacements.statuts.rejetee',
    EXECUTEE: 'remplacements.statuts.executee',
    ANNULEE: 'remplacements.statuts.annulee',
};

// ─── Composant principal ─────────────────────────────────────

export function RemplacementsPage() {
    const { t, i18n } = useTranslation('emplois');
    const navigate = useNavigate();
    const locale = i18n.language || 'fr';

    // ─── État ────────────────────────────────────────────
    const [stepperOpen, setStepperOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailRemplacement, setDetailRemplacement] = useState<RemplacementHeureCours | null>(null);
    const [filtres, setFiltres] = useState<Record<string, string>>({ statut: '', demandeurId: '' });
    const [page, setPage] = useState(1);
    const limit = 25;

    // ─── Modals confirmation ─────────────────────────────
    const [confirmValidate, setConfirmValidate] = useState<RemplacementHeureCours | null>(null);
    const [confirmReject, setConfirmReject] = useState<RemplacementHeureCours | null>(null);
    const [motifRejet, setMotifRejet] = useState('');

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
    const executer = useExecuterRemplacement();
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
                        ? new Date(item.heureCours.date).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })
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
                <ColonneMatiere matiere={item.heureCours?.matiere ? { nom: item.heureCours.matiere.nom, couleur: null, code: null } : undefined} />
            ),
        },
        {
            key: 'classe',
            header: t('remplacements.colonnes.classe'),
            render: (item) => (
                <ColonneClasse classe={item.heureCours?.classeAnnee?.classe ? { nom: item.heureCours.classeAnnee.classe.nom, code: null } : undefined} />
            ),
        },
        {
            key: 'enseignantAbsent',
            header: t('remplacements.colonnes.enseignantAbsent'),
            render: (item) => (
                <ColonneEnseignant enseignant={item.demandeur ? { prenom: item.demandeur.prenom, nom: item.demandeur.nom } : undefined} />
            ),
        },
        {
            key: 'remplacant',
            header: t('remplacements.colonnes.remplacantPropose'),
            render: (item) => {
                if (!item.remplacant) return <span className="italic text-[var(--color-text-muted)]">{t('remplacements.aucunRemplacant')}</span>;
                return <ColonneEnseignant enseignant={{ prenom: item.remplacant.prenom, nom: item.remplacant.nom }} />;
            },
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
                const label = t(STATUT_REMPLACEMENT_LABEL_KEYS[item.statut] ?? item.statut);
                return <BadgeStatutCreneau statut={item.statut} label={label} />;
            },
        },
        {
            key: 'actions',
            header: t('remplacements.colonnes.actions'),
            size: 180,
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
                                onClick={() => setConfirmValidate(item)}
                                disabled={!item.remplacantId}
                                aria-label={t('remplacements.actions.valider')}
                                title={item.remplacantId ? t('remplacements.actions.valider') : t('remplacements.aucunRemplacant')}
                            />
                            <ElisaButton
                                variant="ghost"
                                size="xs"
                                icon={<ThumbsDown className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-danger)]" />}
                                onClick={() => setConfirmReject(item)}
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
                    {item.statut === 'VALIDEE' && (
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<Play className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-dominant-600)]" />}
                            onClick={() => executer.mutate({ id: item.id })}
                            aria-label={t('remplacements.actions.executer')}
                            title={t('remplacements.actions.executer')}
                        />
                    )}
                </div>
            ),
        },
    ], [t, locale, annuler, executer]);

    // ─── Handlers confirmation ───────────────────────────

    const handleConfirmValidate = useCallback(async () => {
        if (!confirmValidate?.remplacantId) return;
        valider.mutate({ id: confirmValidate.id, remplacantId: confirmValidate.remplacantId });
        setConfirmValidate(null);
    }, [confirmValidate, valider]);

    const handleConfirmReject = useCallback(async () => {
        if (!confirmReject || motifRejet.length < 3) return;
        rejeter.mutate({ id: confirmReject.id, motif: motifRejet });
        setConfirmReject(null);
        setMotifRejet('');
    }, [confirmReject, motifRejet, rejeter]);

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

            {/* ─── Toolbar + DataTable (filtres intégrés) ── */}
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
                    enableCollapsibleFilters
                    filtres={filterDefs}
                    onFilterChange={updateFiltre}
                    onClearFilters={clearFiltres}
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
                                    ? new Date(detailRemplacement.heureCours.date).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })
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
                            <BadgeStatutCreneau
                                statut={detailRemplacement.statut}
                                label={t(STATUT_REMPLACEMENT_LABEL_KEYS[detailRemplacement.statut] ?? detailRemplacement.statut)}
                            />
                        </div>
                        {detailRemplacement.commentaires && (
                            <div className="border-t border-[var(--color-bordure)] pt-[var(--space-sm)]">
                                <span className="text-sm text-[var(--color-text-secondary)]">{t('remplacements.colonnes.commentaires', { defaultValue: 'Commentaires' })}</span>
                                <p className="text-sm text-[var(--color-text-primary)] mt-1">{detailRemplacement.commentaires}</p>
                            </div>
                        )}
                    </div>
                )}
            </CustomModal>

            {/* ─── Confirmation validation ─────────────── */}
            <ConfirmationModal
                isOpen={!!confirmValidate}
                title={t('remplacements.confirmerValidation')}
                message={t('remplacements.confirmerValidationMessage')}
                confirmLabel={t('remplacements.actions.valider')}
                variant="info"
                onConfirm={handleConfirmValidate}
                onCancel={() => setConfirmValidate(null)}
                isLoading={valider.isPending}
            />

            {/* ─── Modal rejet (avec motif) ────────────── */}
            <CustomModal
                open={!!confirmReject}
                onOpenChange={(open) => { if (!open) { setConfirmReject(null); setMotifRejet(''); } }}
                title={t('remplacements.confirmerRejet')}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-[var(--gap-sm)] w-full">
                        <ElisaButton variant="ghost" onClick={() => { setConfirmReject(null); setMotifRejet(''); }}>
                            {t('fermer', { defaultValue: 'Annuler' })}
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            icon={<ThumbsDown className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            onClick={handleConfirmReject}
                            disabled={motifRejet.length < 3}
                            loading={rejeter.isPending}
                        >
                            {t('remplacements.actions.rejeter')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="flex flex-col gap-[var(--gap-sm)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('remplacements.confirmerValidationMessage', { defaultValue: 'Indiquez le motif du rejet.' })}
                    </p>
                    <textarea
                        value={motifRejet}
                        onChange={(e) => setMotifRejet(e.target.value)}
                        placeholder={t('remplacements.motifRejetPlaceholder')}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]/30 min-h-[80px] resize-none"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                        autoFocus
                    />
                </div>
            </CustomModal>
        </div>
    );
}
