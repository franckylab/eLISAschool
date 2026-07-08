import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit, Trash2, ArrowUp, ArrowDown, User, Briefcase } from 'lucide-react';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { useOrganigramme, usePostes, useHierarchies, useSupprimerHierarchie } from '../hooks/use-organisation';
import { HierarchieFormModal } from './hierarchie-form-modal';
import type { HierarchiePersonnel } from '../types/organisation.types';

const relationColors: Record<string, 'success' | 'default' | 'warning' | 'info' | 'secondary'> = {
    SUPERVISE_DIRECT: 'success',
    SUPERVISE_INDIRECT: 'default',
    RATTACHEMENT_FONCTIONNEL: 'warning',
    COLLABORATION: 'secondary',
    REMPLACEMENT: 'info',
    INTERIM: 'info',
};

interface Props { organisationId: string }

export function TabHierarchie({ organisationId }: Props) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const { data: organigramme, isLoading: orgLoading } = useOrganigramme(organisationId);
    const { data: hierarchies, isLoading: hierLoading } = useHierarchies();
    const { data: postes } = usePostes({ organisationId });
    const supprimer = useSupprimerHierarchie();

    const relationLabels = t('typeRelation', { returnObjects: true }) as Record<string, string>;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editHierarchie, setEditHierarchie] = useState<HierarchiePersonnel | null>(null);
    const [deleteHierarchieId, setDeleteHierarchieId] = useState<string | null>(null);

    const organigrammeNodes = organigramme || [];

    const buildOrganigramTree = (nodes: any[]): TreeNode<any>[] => {
        return nodes.map((n) => ({
            id: n.id,
            label: `${n.nom} ${n.code ? `(${n.code})` : ''}`,
            data: n,
            icon: <Users className="h-4 w-4 text-gray-500" />,
            children: n.enfants ? buildOrganigramTree(n.enfants) : [],
        }));
    };

    const hierColumns: Column<HierarchiePersonnel>[] = [
        {
            key: 'subordonne',
            header: t('colSubordonne'),
            render: (h) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{h.personnelNom}</span>
                </div>
            ),
        },
        {
            key: 'relation',
            header: '',
            render: () => (
                <div className="flex items-center justify-center">
                    <ArrowUp className="h-4 w-4 text-blue-500" />
                </div>
            ),
        },
        {
            key: 'superieur',
            header: t('colSuperieur'),
            render: (h) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{h.superieurNom}</span>
                </div>
            ),
        },
        {
            key: 'typeRelation',
            header: t('colTypeRelation'),
            render: (h) => (
                <Badge variant={relationColors[h.typeRelation] || 'default'} size="sm">
                    {relationLabels[h.typeRelation] || h.typeRelation}
                </Badge>
            ),
        },
        {
            key: 'poste',
            header: t('colPoste'),
            render: (h) => (
                h.posteIntitule ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-3.5 w-3.5" />
                        {h.posteIntitule}
                    </div>
                ) : <span className="text-sm text-gray-400">-</span>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right w-24',
            renderActions: (h) => {
                if (!hasPermission('organisation:edit')) return [];
                return [
                    {
                        key: 'modifier',
                        icon: Edit,
                        label: t('modifier'),
                        onClick: () => setEditHierarchie(h),
                    },
                    {
                        key: 'supprimer',
                        icon: Trash2,
                        label: t('supprimer'),
                        onClick: () => setDeleteHierarchieId(h.id),
                        variant: 'danger' as const,
                    },
                ];
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        {t('organigramme')}
                    </h3>
                    <TreeView
                        nodes={buildOrganigramTree(organigrammeNodes)}
                        loading={orgLoading}
                        emptyMessage={t('aucuneUniteOrganigramme')}
                    />
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ArrowDown className="h-5 w-5 text-blue-500" />
                            {t('relationsHierarchiques')}
                        </h3>
                        {hasPermission('organisation:edit') && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                                onClick={() => setShowCreateModal(true)}>
                                {t('nouvelleRelationBtn')}
                            </ElisaButton>
                        )}
                    </div>

                    <DataTable
                        colonnes={hierColumns}
                        donnees={hierarchies || []}
                        isLoading={hierLoading}
                        disableClientSearch
                    />
                </div>
            </div>

            <HierarchieFormModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                postes={postes || []}
            />

            {editHierarchie && (
                <HierarchieFormModal
                    open={!!editHierarchie}
                    onOpenChange={() => setEditHierarchie(null)}
                    postes={postes || []}
                    hierarchie={editHierarchie}
                />
            )}

            <ConfirmationModal
                isOpen={!!deleteHierarchieId}
                onCancel={() => setDeleteHierarchieId(null)}
                onConfirm={async () => {
                    if (deleteHierarchieId) {
                        await supprimer.mutateAsync(deleteHierarchieId);
                        setDeleteHierarchieId(null);
                    }
                }}
                title={t('supprimerRelation')}
                message={t('confirmerSuppressionRelation')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
