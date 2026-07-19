import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, Medal, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { DiplomeEleve } from '../types/diplome-eleve.types';
import {
    useDiplomesEleves,
    useCreerDiplomeEleve,
    useModifierDiplomeEleve,
    useSupprimerDiplomeEleve,
} from '../hooks/use-diplomes-eleves';
import { DiplomeEleveFormModal } from './diplome-eleve-form-modal';

export function DiplomesElevesPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('diplomes-eleves');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreExamenId, setFiltreExamenId] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [diplomeToEdit, setDiplomeToEdit] = useState<DiplomeEleve | null>(null);
    const [diplomeToDelete, setDiplomeToDelete] = useState<DiplomeEleve | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading, isError, error, refetch } = useDiplomesEleves({
        page,
        limit,
        recherche: recherche || undefined,
        examenNationalId: filtreExamenId,
    });

    const creer = useCreerDiplomeEleve();
    const modifier = useModifierDiplomeEleve();
    const supprimer = useSupprimerDiplomeEleve();

    const diplomes = data?.items || [];
    const meta = data?.meta;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const colonnes: Column<DiplomeEleve>[] = [
        {
            key: 'eleveId',
            header: t('colonne.eleve'),
            render: (diplome: DiplomeEleve) => (
                <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{diplome.eleve?.nom || diplome.eleveId?.substring(0, 8) || '—'}</span>
                </div>
            ),
        },
        {
            key: 'examenNationalId',
            header: t('colonne.examen'),
            render: (diplome: DiplomeEleve) => (
                <span className="text-sm">{diplome.examenNational?.nom || diplome.examenNationalId?.substring(0, 8) || '—'}</span>
            ),
        },
        {
            key: 'numeroDiplome',
            header: t('colonne.numeroDiplome'),
            render: (diplome: DiplomeEleve) => (
                <span className="text-sm font-mono">{diplome.numeroDiplome || '-'}</span>
            ),
        },
        {
            key: 'dateObtention',
            header: t('colonne.dateObtention'),
            render: (diplome: DiplomeEleve) => (
                <span className="text-sm">{diplome.dateObtention ? formatDate(diplome.dateObtention) : '-'}</span>
            ),
        },
        {
            key: 'mention',
            header: t('colonne.mention'),
            render: (diplome: DiplomeEleve) => (
                diplome.mention ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        diplome.mention.includes('Très')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : diplome.mention.includes('Bien')
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                        {diplome.mention}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'resultat',
            header: t('colonne.resultat'),
            render: (diplome: DiplomeEleve) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    diplome.resultat === 'ADMIS'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : diplome.resultat === 'AJOURNE'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {t(`resultat.${diplome.resultat}`)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (d) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/diplomes-eleves/$id', params: { id: d.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => { setDiplomeToEdit(d); setShowFormModal(true); },
                    permission: 'diplomes-eleves:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setDiplomeToDelete(d),
                    permission: 'diplomes-eleves:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setDiplomeToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (diplomeToEdit) {
            await modifier.mutateAsync({ id: diplomeToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setShowFormModal(false);
        setDiplomeToEdit(null);
    };

    const handleDelete = async () => {
        if (diplomeToDelete) {
            await supprimer.mutateAsync(diplomeToDelete.id);
            setDiplomeToDelete(null);
        }
    };

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                title={t('titre')}
                description={t('description')}
                icon={Medal}
                actions={
                    hasPermission('diplomes-eleves:create') ? (
                        <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
                            {t('nouveauDiplome')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            <DataTable
                tableId="diplomes-eleves"
                columns={colonnes}
                data={diplomes}
                isLoading={isLoading}
                pagination={meta ? {
                    page: meta.currentPage,
                    limit: meta.itemsPerPage,
                    total: meta.totalItems,
                    totalPages: meta.totalPages,
                    hasNext: meta.currentPage < meta.totalPages,
                    hasPrev: meta.currentPage > 1,
                    onPageChange: setPage,
                } : undefined}
                emptyMessage={t('aucunDiplome')}
                searchable
                searchPlaceholder={t('rechercher')}
                onSearchChange={(v) => { setRecherche(v); setPage(1); }}
                enableCollapsibleFilters
                filtres={[
                    {
                        key: 'examenNationalId',
                        label: t('colonne.examen'),
                        options: [],
                    },
                ]}
                onFilterChange={(key, value) => {
                    if (key === 'examenNationalId') setFiltreExamenId(value || undefined);
                }}
                onClearFilters={() => setFiltreExamenId(undefined)}
            />

            <DiplomeEleveFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setDiplomeToEdit(null);
                    }
                }}
                diplome={diplomeToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            <ConfirmDialog
                open={!!diplomeToDelete}
                onOpenChange={(open) => { if (!open) setDiplomeToDelete(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
