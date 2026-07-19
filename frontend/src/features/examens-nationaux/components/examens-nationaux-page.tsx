import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, FileBadge2, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { ExamenNational } from '../types/examen-national.types';
import {
    useExamensNationaux,
    useCreerExamenNational,
    useModifierExamenNational,
    useSupprimerExamenNational,
} from '../hooks/use-examens-nationaux';
import { ExamenNationalFormModal } from './examen-national-form-modal';

export function ExamensNationauxPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('examens-nationaux');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreSousSysteme, setFiltreSousSysteme] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [examenToEdit, setExamenToEdit] = useState<ExamenNational | null>(null);
    const [examenToDelete, setExamenToDelete] = useState<ExamenNational | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading, isError, error, refetch } = useExamensNationaux({
        page,
        limit,
        recherche: recherche || undefined,
        sousSysteme: filtreSousSysteme,
    });

    const creer = useCreerExamenNational();
    const modifier = useModifierExamenNational();
    const supprimer = useSupprimerExamenNational();

    const examens = data?.items || [];
    const meta = data?.meta;

    const colonnes: Column<ExamenNational>[] = [
        {
            key: 'code',
            header: t('colonne.code'),
            render: (examen: ExamenNational) => (
                <div className="flex items-center gap-2">
                    <FileBadge2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{examen.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: t('colonne.nom'),
            render: (examen: ExamenNational) => (
                <span className="text-sm font-medium">{examen.nom}</span>
            ),
        },
        {
            key: 'niveauId',
            header: t('colonne.niveau'),
            render: (examen: ExamenNational) => (
                <span className="text-sm">{examen.niveau?.nom || '-'}</span>
            ),
        },
        {
            key: 'sousSysteme',
            header: t('colonne.sousSysteme'),
            render: (examen: ExamenNational) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.sousSysteme === 'FRANCOPHONE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                    {t(`sousSysteme.${examen.sousSysteme}`)}
                </span>
            ),
        },
        {
            key: 'estObligatoire',
            header: t('colonne.obligatoire'),
            render: (examen: ExamenNational) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.estObligatoire
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {examen.estObligatoire ? t('oui') : t('non')}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('colonne.statut'),
            render: (examen: ExamenNational) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {examen.actif ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (e) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/examens-nationaux/$id', params: { id: e.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => { setExamenToEdit(e); setShowFormModal(true); },
                    permission: 'examens-nationaux:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setExamenToDelete(e),
                    permission: 'examens-nationaux:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setExamenToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (examenToEdit) {
            await modifier.mutateAsync({ id: examenToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setShowFormModal(false);
        setExamenToEdit(null);
    };

    const handleDelete = async () => {
        if (examenToDelete) {
            await supprimer.mutateAsync(examenToDelete.id);
            setExamenToDelete(null);
        }
    };

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                title={t('titre')}
                description={t('description')}
                variant="gradient"
                icon={FileBadge2}
                actions={
                    hasPermission('examens-nationaux:create') ? (
                        <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
                            {t('nouvelExamen')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            <DataTable
                tableId="examens-nationaux"
                columns={colonnes}
                data={examens}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                disableClientSearch
                pagination={meta ? {
                    page: meta.currentPage,
                    limit: meta.itemsPerPage,
                    total: meta.totalItems,
                    totalPages: meta.totalPages,
                    hasNext: meta.currentPage < meta.totalPages,
                    hasPrev: meta.currentPage > 1,
                    onPageChange: setPage,
                } : undefined}
                emptyMessage={t('aucunExamen')}
                searchable
                searchPlaceholder={t('rechercher')}
                onSearchChange={(v) => { setRecherche(v); setPage(1); }}
                enableCollapsibleFilters
                filtres={[
                    {
                        key: 'sousSysteme',
                        label: t('colonne.sousSysteme'),
                        options: [
                            { value: 'FRANCOPHONE', label: t('sousSysteme.FRANCOPHONE') },
                            { value: 'ANGLOPHONE', label: t('sousSysteme.ANGLOPHONE') },
                        ],
                    },
                ]}
                onFilterChange={(key, value) => {
                    if (key === 'sousSysteme') setFiltreSousSysteme(value || undefined);
                }}
                onClearFilters={() => setFiltreSousSysteme(undefined)}
            />

            <ExamenNationalFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setExamenToEdit(null);
                    }
                }}
                examen={examenToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            <ConfirmDialog
                open={!!examenToDelete}
                onOpenChange={(open) => { if (!open) setExamenToDelete(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { nom: examenToDelete?.nom || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
