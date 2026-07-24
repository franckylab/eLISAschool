import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Edit, Trash2, ArrowUp, ArrowDown, User, Briefcase, Network } from 'lucide-react';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { useOrganigramme, useHierarchies, useSupprimerHierarchie } from '../hooks/use-organisation';
import { usePostes } from '@/features/postes/hooks/use-postes';
import { HierarchieFormModal } from './hierarchie-form-modal';
import type { HierarchiePersonnel, OrganigrammeNode, OrganigrammePoste } from '../types/organisation.types';

export function TabHierarchie() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    useDocumentTitle('eLISAschool | Hiérarchie');
    const { data: organigramme, isLoading: orgLoading } = useOrganigramme();
    const { data: hierarchies, isLoading: hierLoading } = useHierarchies();
        const { data: postesData } = usePostes();
        const postes = postesData?.items || [];
    const supprimer = useSupprimerHierarchie();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editHierarchie, setEditHierarchie] = useState<HierarchiePersonnel | null>(null);
    const [deleteHierarchieId, setDeleteHierarchieId] = useState<string | null>(null);

    const organigrammeNodes = organigramme || [];

    const compterOccupes = (postes: OrganigrammePoste[]): number =>
        postes.reduce((acc: number, p: OrganigrammePoste) => acc + (p.occupantsCount || 0), 0);

    const buildOrganigramTree = (nodes: OrganigrammeNode[]): TreeNode<OrganigrammeNode>[] => {
        return nodes.map((n: OrganigrammeNode) => {
            const postesLocaux: OrganigrammePoste[] = n.postes || [];
            const occupes = compterOccupes(postesLocaux);
            const total = postesLocaux.reduce((acc: number, p: OrganigrammePoste) => acc + (p.nombrePostes || 1), 0);
            const capacite = total > 0 ? ` [${occupes}/${total}]` : '';
            return {
                id: n.id,
                label: `${n.nom} ${n.code ? `(${n.code})` : ''}${capacite}`,
                data: n,
                icon: <Users className="h-4 w-4 text-muted-foreground" />,
                children: n.enfants ? buildOrganigramTree(n.enfants as OrganigrammeNode[]) : [],
            };
        });
    };

    const hierColumns: Column<HierarchiePersonnel>[] = [
        {
            key: 'subordonne',
            header: t('colSubordonne'),
            render: (h) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{h.personnelId || '-'}</span>
                </div>
            ),
        },
        {
            key: 'relation',
            header: '',
            render: () => (
                <div className="flex items-center justify-center">
                    <ArrowUp className="h-4 w-4 text-primary" />
                </div>
            ),
        },
        {
            key: 'superieur',
            header: t('colSuperieur'),
            render: (h) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{h.superieurId || '-'}</span>
                </div>
            ),
        },
        {
            key: 'typeRelation',
            header: t('colTypeRelation'),
            render: (h) => (
                <Badge variant="default" size="sm">
                    {h.typeRelation || '-'}
                </Badge>
            ),
        },
        {
            key: 'poste',
            header: t('colPoste'),
            render: (h) => (
                h.posteId ? (
                    <div className="flex items-center gap-2 text-sm text-secondary">
                        <Briefcase className="h-3.5 w-3.5" />
                        {h.posteId}
                    </div>
                ) : <span className="text-sm text-muted-foreground">-</span>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right w-24',
            renderActions: (h) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => setEditHierarchie(h),
                    permission: 'organisation:hierarchie:write',
                    variant: 'warning' as const,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setDeleteHierarchieId(h.id),
                    permission: 'organisation:hierarchie:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('hierarchie')}
                subtitle={t('relationsHierarchiques')}
                icon={Network}
                variant="gradient"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {t('organigramme')}
                    </h3>
                    <TreeView
                        nodes={buildOrganigramTree(organigrammeNodes)}
                        loading={orgLoading}
                        emptyMessage={t('aucuneUniteOrganigramme')}
                    />
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <ArrowDown className="h-5 w-5 text-primary" />
                            {t('relationsHierarchiques')}
                        </h3>
                        {hasPermission('organisation:hierarchie:write') && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                                onClick={() => setShowCreateModal(true)}>
                                {t('nouvelleRelationBtn')}
                            </ElisaButton>
                        )}
                    </div>

                    <DataTable
                        tableId="hierarchie-table"
                        columns={hierColumns}
                        data={hierarchies || []}
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
