import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Building2, FolderTree, MapPin, User, ChevronRight } from 'lucide-react';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { useArborescence, useUnites, useCreerUnite, useModifierUnite, useSupprimerUnite } from '../hooks/use-organisation';
import { UniteFormModal } from './unite-form-modal';
import type { UniteOrganisationnelle, TypeUnite } from '../types/organisation.types';

const typeIcons: Record<string, string> = {
    DIRECTION: '🏢', DEPARTEMENT: '📂', SERVICE: '📋', POLE: '🎯',
    FILIERE: '🔗', CYCLE: '🔄', SECTION: '📑', COMMISSION: '⚖️',
    EQUIPE: '👥', AUTRE: '📌',
};

function buildTreeNodes(unites: UniteOrganisationnelle[]): TreeNode<UniteOrganisationnelle>[] {
    const map = new Map<string, TreeNode<UniteOrganisationnelle>>();
    const roots: TreeNode<UniteOrganisationnelle>[] = [];

    for (const u of unites) {
        map.set(u.id, {
            id: u.id,
            label: u.nom,
            data: u,
            children: [],
            icon: <span className="text-xs">{typeIcons[u.type] || '📌'}</span>,
        });
    }

    for (const u of unites) {
        const node = map.get(u.id)!;
        if (u.parentId && map.has(u.parentId)) {
            map.get(u.parentId)!.children!.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortByOrdre = (nodes: TreeNode<UniteOrganisationnelle>[]) => {
        nodes.sort((a, b) => (a.data.ordre || 0) - (b.data.ordre || 0));
        for (const n of nodes) {
            if (n.children) sortByOrdre(n.children);
        }
    };
    sortByOrdre(roots);

    return roots;
}

interface Props { organisationId: string }

export function TabUnites({ organisationId }: Props) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const { data: arborescence, isLoading } = useArborescence(organisationId);
    const { data: unites } = useUnites({ organisationId });
    const creer = useCreerUnite();
    const modifier = useModifierUnite();
    const supprimer = useSupprimerUnite();

    const typesUnite = t('typesUnite', { returnObjects: true }) as Record<string, string>;

    const [selectedUniteId, setSelectedUniteId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editUnite, setEditUnite] = useState<UniteOrganisationnelle | null>(null);
    const [deleteUniteId, setDeleteUniteId] = useState<string | null>(null);
    const [parentId, setParentId] = useState<string | undefined>(undefined);

    const flattenTree = (nodes: any[]): any[] =>
        nodes.flatMap((n) => [n, ...flattenTree(n.enfants || [])]);

    const treeNodes = arborescence && Array.isArray(arborescence)
        ? buildTreeNodes(flattenTree(arborescence))
        : buildTreeNodes(unites || []);

    const selectedUnite = selectedUniteId
        ? (unites || []).find((u) => u.id === selectedUniteId)
        : null;

    const handleDragEnd = useCallback(async (activeId: string, overId: string | null) => {
        if (!overId || activeId === overId) return;
        await modifier.mutateAsync({ id: activeId, parentId: overId });
    }, [modifier]);

    const handleCreateChild = (parentId: string) => {
        setParentId(parentId);
        setShowCreateModal(true);
    };

    const handleCreateRoot = () => {
        setParentId(undefined);
        setShowCreateModal(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <FolderTree className="h-5 w-5 text-blue-500" />
                            {t('arborescenceUnites')}
                        </h3>
                        {hasPermission('organisation:edit') && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                                onClick={handleCreateRoot}>
                                {t('nouvelleUniteBtn')}
                            </ElisaButton>
                        )}
                    </div>

                    <TreeView
                        nodes={treeNodes}
                        loading={isLoading}
                        emptyMessage={t('aucuneUniteMsg')}
                        selectedId={selectedUniteId || undefined}
                        onSelect={(node) => setSelectedUniteId(node.id)}
                        enableDrag={hasPermission('organisation:edit')}
                        onDragEnd={handleDragEnd}
                        renderActions={hasPermission('organisation:edit') ? (node) => (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleCreateChild(node.id)}
                                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title={t('ajouterSousUnite')}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setEditUnite(node.data)}
                                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                    title={t('modifier')}
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeleteUniteId(node.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title={t('supprimer')}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : undefined}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {selectedUnite ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            {selectedUnite.nom}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('code')}</span>
                            <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{selectedUnite.code}</span>
                        </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{t('type')}</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">{typesUnite[selectedUnite.type] || selectedUnite.type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">{t('ordre')}</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">{selectedUnite.ordre}</span>
                            </div>
                            {selectedUnite.responsableNom && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('responsable')}</span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                        <User className="h-3.5 w-3.5" />
                                        {selectedUnite.responsableNom}
                                    </span>
                                </div>
                            )}
                            {selectedUnite.localisation && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{t('localisation')}</span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedUnite.localisation}
                                    </span>
                                </div>
                            )}
                            {selectedUnite.description && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">{t('descriptionSection')}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedUnite.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-col items-center justify-center text-center py-6">
                            <ChevronRight className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('selectionnerUnite')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <UniteFormModal
                open={showCreateModal}
                onOpenChange={(v) => { if (!v) { setShowCreateModal(false); setParentId(undefined); } }}
                organisationId={organisationId}
                parentId={parentId}
            />

            {editUnite && (
                <UniteFormModal
                    open={!!editUnite}
                    onOpenChange={() => setEditUnite(null)}
                    organisationId={organisationId}
                    unite={editUnite}
                />
            )}

            <ConfirmationModal
                isOpen={!!deleteUniteId}
                onCancel={() => setDeleteUniteId(null)}
                onConfirm={async () => {
                    if (deleteUniteId) {
                        await supprimer.mutateAsync(deleteUniteId);
                        setDeleteUniteId(null);
                    }
                }}
                title={t('supprimer') + " " + t('unites').toLowerCase()}
                message={t('confirmerSuppressionUnite')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
