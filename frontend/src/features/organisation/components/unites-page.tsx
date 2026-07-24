/**
 * ==================================
 * eLISAschool - Page Unités Organisationnelles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Pattern unifié : PageHeader gradient + bascule DataTable / Arbre (organigramme).
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, FolderTree, MapPin, User } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { useArborescence, useUnites, useModifierUnite, useSupprimerUnite } from '../hooks/use-unites';
import { UniteFormModal } from './organigramme/modals/UniteFormModal';
import { OrgViewToggle, type OrgView } from './org-view-toggle';
import type { UniteOrganisationnelle } from '../types/organisation.types';

function buildTreeNodes(unites: UniteOrganisationnelle[]): TreeNode<UniteOrganisationnelle>[] {
    const map = new Map<string, TreeNode<UniteOrganisationnelle>>();
    const roots: TreeNode<UniteOrganisationnelle>[] = [];
    for (const u of unites) {
        map.set(u.id, { id: u.id, label: u.nom, data: u, children: [], icon: <span className="text-xs">📂</span> });
    }
    for (const u of unites) {
        const node = map.get(u.id)!;
        if (u.parentId && map.has(u.parentId)) map.get(u.parentId)!.children!.push(node);
        else roots.push(node);
    }
    const sortByOrdre = (nodes: TreeNode<UniteOrganisationnelle>[]) => {
        nodes.sort((a, b) => (a.data.ordre || 0) - (b.data.ordre || 0));
        nodes.forEach((n) => n.children && sortByOrdre(n.children));
    };
    sortByOrdre(roots);
    return roots;
}

export function UnitesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    useDocumentTitle(`eLISAschool | ${t('unites')}`);

    const canWrite = hasPermission('organisation:unites:write');
    const canDelete = hasPermission('organisation:unites:delete');

    const { data: arborescence, isLoading } = useArborescence();
    const { data: unites } = useUnites();
    const modifier = useModifierUnite();
    const supprimer = useSupprimerUnite();

    const [vue, setVue] = useState<OrgView>('table');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editUnite, setEditUnite] = useState<UniteOrganisationnelle | null>(null);
    const [deleteUniteId, setDeleteUniteId] = useState<string | null>(null);
    const [parentId, setParentId] = useState<string | undefined>(undefined);

    const flattenTree = (nodes: UniteOrganisationnelle[]): UniteOrganisationnelle[] => nodes.flatMap((n) => [n, ...flattenTree((n as any).enfants || [])]);
    const treeNodes = useMemo(
        () => (arborescence && Array.isArray(arborescence) ? buildTreeNodes(flattenTree(arborescence)) : buildTreeNodes(unites || [])),
        [arborescence, unites],
    );

    const handleDragEnd = useCallback(async (activeId: string, overId: string | null) => {
        if (!overId || activeId === overId) return;
        await modifier.mutateAsync({ id: activeId, parentId: overId });
    }, [modifier]);

    const handleCreateChild = (pid: string) => { setParentId(pid); setShowCreateModal(true); };
    const handleCreateRoot = () => { setParentId(undefined); setShowCreateModal(true); };

    const colonnes: Column<UniteOrganisationnelle>[] = useMemo(() => [
        {
            key: 'nom', header: t('nom'), sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                        <Building2 className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{u.nom}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{u.code}</p>
                    </div>
                </div>
            ),
        },
        { key: 'type', header: t('type'), render: (u) => <span className="text-sm text-secondary">{u.echelonStructurel?.label || '—'}</span> },
        { key: 'parent', header: t('parent'), render: (u) => <span className="text-sm text-secondary">{u.parent?.nom || '—'}</span> },
        {
            key: 'responsable', header: t('responsable'),
            render: (u) => u.responsableNom
                ? <span className="text-sm text-secondary inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{u.responsableNom}</span>
                : <span className="text-sm text-muted-foreground">—</span>,
        },
        {
            key: 'localisation', header: t('localisation'),
            render: (u) => u.localisation
                ? <span className="text-sm text-secondary inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{u.localisation}</span>
                : <span className="text-sm text-muted-foreground">—</span>,
        },
        {
            key: 'statut', header: t('statut'), className: 'text-center',
            render: (u) => <Badge variant={u.actif !== false ? 'success' : 'secondary'} size="sm">{u.actif !== false ? t('actif') : t('inactif')}</Badge>,
        },
        {
            key: 'actions', header: 'Actions', className: 'text-right',
            renderActions: (u) => [
                { key: 'voir', icon: Eye, label: t('voir'), onClick: () => navigate({ to: '/organisation/unites/$id', params: { id: u.id } }), permission: 'organisation:unites:read', variant: 'info' as const },
                { key: 'ajouter', icon: Plus, label: t('ajouterSousUnite'), onClick: () => handleCreateChild(u.id), permission: 'organisation:unites:write', variant: 'info' as const },
                { key: 'modifier', icon: Edit, label: t('modifier'), onClick: () => setEditUnite(u), permission: 'organisation:unites:write', variant: 'warning' as const },
                { key: 'supprimer', icon: Trash2, label: t('supprimer'), onClick: () => setDeleteUniteId(u.id), permission: 'organisation:unites:delete', variant: 'danger' as const },
            ],
        },
    ], [t]);

    if (isLoading && !unites) return <PageSkeleton showTable />;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('unites')}
                subtitle={t('compteurUnites', { count: (unites || []).length })}
                icon={FolderTree}
                variant="gradient"
                actions={
                    <div className="flex items-center gap-2">
                        <OrgViewToggle value={vue} onChange={setVue} />
                        {canWrite && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreateRoot}>
                                {t('nouvelleUniteBtn')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <motion.div key={vue} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {vue === 'table' ? (
                    <DataTable
                        tableId="unites-list"
                        columns={colonnes}
                        data={unites || []}
                        isLoading={isLoading}
                        enableReordering
                        enablePinning
                        enableColumnVisibility
                        searchPlaceholder={t('rechercher')}
                        emptyMessage={t('aucuneUniteMsg')}
                    />
                ) : (
                    <div className="bg-card rounded-lg border border-border p-6">
                        <TreeView
                            nodes={treeNodes}
                            loading={isLoading}
                            emptyMessage={t('aucuneUniteMsg')}
                            enableDrag={canWrite}
                            onDragEnd={handleDragEnd}
                            renderActions={canWrite ? (node) => (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleCreateChild(node.id)} className="p-1 text-muted-foreground hover:text-primary rounded" title={t('ajouterSousUnite')}><Plus className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => setEditUnite(node.data)} className="p-1 text-muted-foreground hover:text-success rounded" title={t('modifier')}><Edit className="h-3.5 w-3.5" /></button>
                                    {canDelete && <button onClick={() => setDeleteUniteId(node.id)} className="p-1 text-muted-foreground hover:text-destructive rounded" title={t('supprimer')}><Trash2 className="h-3.5 w-3.5" /></button>}
                                </div>
                            ) : undefined}
                        />
                    </div>
                )}
            </motion.div>

            <UniteFormModal
                open={showCreateModal}
                onOpenChange={(v) => { if (!v) { setShowCreateModal(false); setParentId(undefined); } }}
                parentId={parentId}
            />
            {editUnite && (
                <UniteFormModal open={!!editUnite} onOpenChange={() => setEditUnite(null)} unite={editUnite} />
            )}

            <ConfirmationModal
                isOpen={!!deleteUniteId}
                onCancel={() => setDeleteUniteId(null)}
                onConfirm={async () => { if (deleteUniteId) { await supprimer.mutateAsync(deleteUniteId); setDeleteUniteId(null); } }}
                title={`${t('supprimer')} ${t('unites').toLowerCase()}`}
                message={t('confirmerSuppressionUnite')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
