/**
 * ==================================
 * eLISAschool - Page Filières
 * ==================================
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, Split, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { Filiere } from '../types/filiere.types';
import {
    useFilieres,
    useCreerFiliere,
    useModifierFiliere,
    useSupprimerFiliere,
} from '../hooks/use-filieres';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import { FiliereFormModal } from './filiere-form-modal';

export function FilieresPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('filieres');
    const { hasPermission } = usePermissions();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreSousSysteme, setFiltreSousSysteme] = useState<string>();
    const [filtreCycleId, setFiltreCycleId] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [filiereToEdit, setFiliereToEdit] = useState<Filiere | null>(null);
    const [filiereToDelete, setFiliereToDelete] = useState<Filiere | null>(null);

    const { data, isLoading, isError, error, refetch } = useFilieres({
        page,
        limit,
        recherche: recherche || undefined,
        sousSysteme: filtreSousSysteme,
        cycleId: filtreCycleId,
    });

    const { data: cycles } = useTousCycles();
    const creer = useCreerFiliere();
    const modifier = useModifierFiliere();
    const supprimer = useSupprimerFiliere();

    const filieres = data?.items || [];
    const meta = data?.meta;

    const getNomCycle = (cycleId: string) => {
        return cycles?.find((c: { id: string; nom: string }) => c.id === cycleId)?.nom || '-';
    };

    const colonnes: Column<Filiere>[] = [
        {
            key: 'code',
            header: t('colonne.code'),
            render: (filiere: Filiere) => (
                <div className="flex items-center gap-2">
                    <Split className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{filiere.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: t('colonne.nom'),
            render: (filiere: Filiere) => (
                <span className="text-sm font-medium">{filiere.nom}</span>
            ),
        },
        {
            key: 'cycleId',
            header: t('colonne.cycle'),
            render: (filiere: Filiere) => (
                <span className="text-sm">{getNomCycle(filiere.cycleId)}</span>
            ),
        },
        {
            key: 'sousSysteme',
            header: t('colonne.sousSysteme'),
            render: (filiere: Filiere) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filiere.sousSysteme === 'FRANCOPHONE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                    {t(`sousSysteme.${filiere.sousSysteme}`)}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('colonne.statut'),
            render: (filiere: Filiere) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filiere.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {filiere.actif ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonne.actions'),
            className: 'text-right',
            renderActions: (f) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => navigate({ to: '/filieres/$id', params: { id: f.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => { setFiliereToEdit(f); setShowFormModal(true); },
                    permission: 'filieres:edit' as const,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setFiliereToDelete(f),
                    permission: 'filieres:delete' as const,
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setFiliereToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (filiereToEdit) {
            await modifier.mutateAsync({ id: filiereToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setShowFormModal(false);
        setFiliereToEdit(null);
    };

    const handleDelete = async () => {
        if (filiereToDelete) {
            await supprimer.mutateAsync(filiereToDelete.id);
            setFiliereToDelete(null);
        }
    };

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                title={t('titre')}
                description={t('description')}
                icon={Split}
                actions={
                    hasPermission('filieres:create') ? (
                        <ElisaButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={handleCreate}>
                            {t('nouvelleFiliere')}
                        </ElisaButton>
                    ) : undefined
                }
            />

            <DataTable
                tableId="filieres"
                columns={colonnes}
                data={filieres}
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
                emptyMessage={t('aucuneFiliere')}
                searchable
                searchPlaceholder={t('rechercher')}
                onSearchChange={(v) => { setRecherche(v); setPage(1); }}
                enableCollapsibleFilters
                filtres={[
                    { key: 'sousSysteme', label: t('colonne.sousSysteme'), options: [{ value: 'FRANCOPHONE', label: t('sousSysteme.FRANCOPHONE') }, { value: 'ANGLOPHONE', label: t('sousSysteme.ANGLOPHONE') }] },
                    { key: 'cycleId', label: t('colonne.cycle'), options: (cycles || []).map((c: { id: string; nom: string }) => ({ value: c.id, label: c.nom })) },
                ]}
                onFilterChange={(key, value) => {
                    if (key === 'sousSysteme') setFiltreSousSysteme(value || undefined);
                    if (key === 'cycleId') setFiltreCycleId(value || undefined);
                }}
                onClearFilters={() => { setFiltreSousSysteme(undefined); setFiltreCycleId(undefined); }}
            />

            <FiliereFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setFiliereToEdit(null);
                    }
                }}
                filiere={filiereToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            <ConfirmDialog
                open={!!filiereToDelete}
                onOpenChange={(open) => { if (!open) setFiliereToDelete(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { nom: filiereToDelete?.nom || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
