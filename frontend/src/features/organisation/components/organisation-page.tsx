import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Edit, Trash2, Search, AlertCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { useOrganisations, useSupprimerOrganisation, useStatistiquesOrganisation } from '../hooks/use-organisation';
import type { Organisation } from '../types/organisation.types';
import { OrganisationFormModal } from './organisation-form-modal';

function StatutBadge({ statut, t }: { statut: string; t: (key: string) => string }) {
    const colors: Record<string, string> = {
        ACTIF: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        EN_CREATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        ARCHIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    const labels = t('statutOrganisation', { returnObjects: true }) as Record<string, string>;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[statut] || colors.ACTIF}`}>
            {labels[statut] || statut}
        </span>
    );
}

function TypeBadge({ type, t }: { type: string; t: (key: string) => string }) {
    const labels = t('typeOrganisationLabel', { returnObjects: true }) as Record<string, string>;
    return <span className="text-sm text-gray-500">{labels[type] || type}</span>;
}

export function OrganisationPage() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [page, setPage] = useState(1);
    const [recherche, setRecherche] = useState('');
    const [filtreType, setFiltreType] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data, isLoading } = useOrganisations({
        page,
        limit: 20,
        recherche: recherche || undefined,
        type: filtreType as any || undefined,
    });

    const supprimer = useSupprimerOrganisation();

    const handleDelete = async () => {
        if (!deleteId) return;
        await supprimer.mutateAsync(deleteId);
        setDeleteId(null);
    };

    const colonnes: Column<Organisation>[] = [
        {
            key: 'nom',
            header: t('colOrganisation'),
            sortable: true,
            render: (o) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{o.nom}</p>
                        {o.code && <p className="text-xs text-gray-500 font-mono">{o.code}</p>}
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            header: t('colType'),
            render: (o) => <TypeBadge type={o.type} t={t} />,
        },
        {
            key: 'statut',
            header: t('colStatut'),
            render: (o) => <StatutBadge statut={o.statut} t={t} />,
        },
        {
            key: 'contact',
            header: t('colContact'),
            render: (o) => (
                <div className="text-sm text-gray-500">
                    {o.email && <p className="truncate max-w-[200px]">{o.email}</p>}
                    {o.telephone && <p className="text-xs">{o.telephone}</p>}
                </div>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right w-40',
            renderActions: (o) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => navigate({ to: `/organisation/${o.id}` }),
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setDeleteId(o.id),
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="space-y-6 p-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('titre')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('gererOrganisations')}</p>
                </div>
                {hasPermission('organisation:edit') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        {t('creer')}
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                tableId="organisations-page"
                colonnes={colonnes}
                donnees={data?.items || []}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'type',
                        label: t('colType'),
                        options: Object.entries(t('typeOrganisationLabel', { returnObjects: true }) as Record<string, string>)
                            .map(([value, label]) => ({ value, label })),
                        allOptionLabel: t('tousLesTypesOrg'),
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => { if (key === 'type') setFiltreType(valeur); }}
                disableClientSearch
                pagination={data?.meta ? {
                    page,
                    limit: data.meta.itemsPerPage,
                    total: data.meta.totalItems,
                    onPageChange: setPage,
                } : undefined}
                onPageChange={setPage}
            />

            {showCreateModal && (
                <OrganisationFormModal
                    open={showCreateModal}
                    onOpenChange={setShowCreateModal}
                />
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t('supprimerOrganisation')}
                message={t('confirmerSuppressionOrg')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
