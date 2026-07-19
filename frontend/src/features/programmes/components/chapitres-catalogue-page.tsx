import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Plus, Edit, Trash2, Clock, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import type { ProgrammeChapitre } from '../types/programme.types';
import { useTousChapitres, useCreerChapitre, useModifierChapitre, useSupprimerChapitre, useProgrammes, useProgrammeMatieres } from '../hooks/use-programmes';
import { ChapitreFormModal } from './chapitre-form-modal';
import type { Column } from '@/components/ui/DataTable';

export function ChapitresCataloguePage() {
    const navigate = useNavigate();
    const { t } = useTranslation('programmes');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filtreProgrammeId, setFiltreProgrammeId] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [chapitreToEdit, setChapitreToEdit] = useState<ProgrammeChapitre | null>(null);
    const [chapitreToDelete, setChapitreToDelete] = useState<ProgrammeChapitre | null>(null);

    const { hasPermission } = usePermissions();
    const { data: chapitresData, isLoading, isError, error, refetch } = useTousChapitres({
        page,
        limit,
        programmeId: filtreProgrammeId || undefined,
        statut: filtreStatut || undefined,
    });
    const { data: programmesData } = useProgrammes({ limit: 100 });
    const programmes = programmesData?.items || [];

    const creer = useCreerChapitre();
    const modifier = useModifierChapitre();
    const supprimer = useSupprimerChapitre();

    const chapitres = chapitresData?.data || [];
    const meta = chapitresData?.pagination;
    const total = meta?.totalItems || 0;
    const totalPages = meta?.totalPages || 1;

    const [createStep, setCreateStep] = useState<'idle' | 'select-matiere' | 'form'>('idle');
    const [createProgrammeId, setCreateProgrammeId] = useState('');
    const [createProgrammeMatiereId, setCreateProgrammeMatiereId] = useState('');
    const { data: programmeMatieres } = useProgrammeMatieres(createProgrammeId);

    const handleSubmit = async (dto: {
        titre: string;
        description?: string;
        objectifsPedagogiques?: string;
        ordre?: number;
        dureePrevueHeures?: number;
    }) => {
        if (chapitreToEdit) {
            await modifier.mutateAsync({ id: chapitreToEdit.id, ...dto });
        } else {
            if (!createProgrammeMatiereId) return;
            await creer.mutateAsync({
                programmeMatiereId: createProgrammeMatiereId,
                ...dto,
            });
        }
        setShowFormModal(false);
        setChapitreToEdit(null);
        setCreateProgrammeMatiereId('');
    };

    const handleDelete = async () => {
        if (!chapitreToDelete) return;
        await supprimer.mutateAsync(chapitreToDelete.id);
        setChapitreToDelete(null);
    };

    const programmeOptions = [
        { value: '', label: t('tousProgrammes', 'Tous les programmes') },
        ...programmes.map((p) => ({ value: p.id, label: `${p.nom} (${p.code})` })),
    ];

    const statutOptions = [
        { value: '', label: t('tousStatuts', 'Tous') },
        { value: 'ACTIF', label: t('statutChapitre.ACTIF') },
        { value: 'EN_ATTENTE_VALIDATION', label: t('statutChapitre.EN_ATTENTE_VALIDATION') },
        { value: 'INACTIF', label: t('statutChapitre.INACTIF') },
    ];

    const colonnes: Column<ProgrammeChapitre>[] = [
        {
            key: 'titre',
            header: t('titre', 'Chapitre'),
            sortable: true,
            render: (c) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-dominante)]" />
                    <span className="font-medium">{c.titre}</span>
                </div>
            ),
        },
        {
            key: 'programmeMatiere',
            header: t('matiere', 'Matière / Niveau'),
            render: (c) => {
                const mn = c.programmeMatiere?.matiereNiveau;
                return (
                    <div className="text-sm">
                        <span className="font-medium">{mn?.matiere?.nom || '-'}</span>
                        <span className="text-[var(--color-texte-secondaire)] mx-1">·</span>
                        <span className="text-[var(--color-texte-secondaire)]">{mn?.niveau?.nom || '-'}</span>
                    </div>
                );
            },
        },
        {
            key: 'programmeNom',
            header: t('programme', 'Programme'),
            render: (c) => {
                const progId = (c as any).programmeId;
                const progNom = (c as any).programmeNom;
                return progId ? (
                    <button onClick={() => navigate({ to: `/programmes/${progId}` })}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {progNom}
                    </button>
                ) : <span className="text-sm text-[var(--color-texte-secondaire)]">-</span>;
            },
        },
        {
            key: 'ordre',
            header: t('ordre'),
            render: (c) => <span className="text-sm font-mono">{c.ordre}</span>,
        },
        {
            key: 'dureePrevueHeures',
            header: t('dureePrevue'),
            render: (c) => (
                <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-[var(--color-texte-secondaire)]" />
                    <span>{c.dureePrevueHeures ?? '-'}h</span>
                </div>
            ),
        },
        {
            key: 'statut',
            header: t('statut'),
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    c.statut === 'ACTIF'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : c.statut === 'EN_ATTENTE_VALIDATION'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                    {t(`statutChapitre.${c.statut}`)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifierChapitre'),
                    onClick: () => {
                        setChapitreToEdit(c);
                        setShowFormModal(true);
                    },
                    permission: 'programmes:config:write',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setChapitreToDelete(c),
                    permission: 'programmes:config:write',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !chapitresData) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={(error as Error)?.message} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('catalogueChapitres', 'Catalogue des chapitres')}
                description={t('catalogueChapitresDesc', "Vue d'ensemble de tous les chapitres pédagogiques")}
                icon={ListChecks}
                variant="gradient"
                actions={
                    hasPermission('programmes:config:write') && createStep === 'idle' ? (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => setCreateStep('select-matiere')}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            {t('nouveauChapitre')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            {createStep === 'select-matiere' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3">
                    <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                        {t('nouveauChapitreSelectMatiere', 'Nouveau chapitre — sélectionnez la matière')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{t('programme', 'Programme')}</label>
                            <select value={createProgrammeId}
                                onChange={(e) => { setCreateProgrammeId(e.target.value); setCreateProgrammeMatiereId(''); }}
                                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                            >
                                <option value="">{t('selectionner', 'Sélectionner...')}</option>
                                {programmes.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{t('matiere', 'Matière')}</label>
                            <select value={createProgrammeMatiereId}
                                onChange={(e) => setCreateProgrammeMatiereId(e.target.value)}
                                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg text-sm bg-white dark:bg-gray-800"
                            >
                                <option value="">{t('selectionner', 'Sélectionner...')}</option>
                                {(programmeMatieres ?? []).map((pm) => (
                                    <option key={pm.id} value={pm.id}>
                                        {pm.matiereNiveau?.matiere?.nom || '?'} — {pm.matiereNiveau?.niveau?.nom || '?'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <ElisaButton variant="outline" size="sm" onClick={() => setCreateStep('idle')}>
                            {t('annuler')}
                        </ElisaButton>
                        <ElisaButton variant="primary" size="sm" disabled={!createProgrammeMatiereId}
                            onClick={() => { setCreateStep('form'); setShowFormModal(true); }}>
                            {t('suivant', 'Suivant')}
                        </ElisaButton>
                    </div>
                </div>
            )}

            <DataTable
                columns={colonnes}
                data={chapitres}
                isLoading={isLoading}
                tableId="chapitres-catalogue"
                enableCollapsibleFilters
                filtres={[
                    { key: 'programmeId', label: t('programme', 'Programme'), options: programmeOptions },
                    { key: 'statut', label: t('statut'), options: statutOptions },
                ]}
                onFilterChange={(key, value) => {
                    if (key === 'programmeId') setFiltreProgrammeId(value);
                    if (key === 'statut') setFiltreStatut(value);
                }}
                onClearFilters={() => { setFiltreProgrammeId(''); setFiltreStatut(''); }}
                pagination={{
                    page,
                    limit,
                    total,
                    totalPages,
                    onPageChange: setPage,
                }}
                emptyMessage={t('aucunChapitre', 'Aucun chapitre trouvé')}
            />

            <ChapitreFormModal
                open={showFormModal}
                chapitre={chapitreToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setChapitreToEdit(null);
                }}
                onSubmit={handleSubmit}
                isLoading={creer.isPending || modifier.isPending}
            />

            <ConfirmDialog
                open={!!chapitreToDelete}
                onOpenChange={(open) => { if (!open) setChapitreToDelete(null); }}
                onConfirm={handleDelete}
                title={t('supprimer')}
                description={t('confirmerSuppressionChapitre', 'Êtes-vous sûr de vouloir supprimer ce chapitre ?') + (chapitreToDelete ? ` "${chapitreToDelete.titre}"` : '')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
