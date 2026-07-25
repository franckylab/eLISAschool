import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Edit, Trash2, Workflow, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { OrgViewToggle, type OrgView } from '@/features/organisation/components/org-view-toggle';
import { usePermissions, useDocumentTitle } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { Fonction, CreerFonctionDto, ModifierFonctionDto } from '../types/fonction.types';
import {
    useFonctions,
    useCreerFonction,
    useModifierFonction,
    useSupprimerFonction,
    useArbreFonctions,
    useToutesFonctions,
} from '../hooks/use-fonctions';
import { FonctionFormModal } from './fonction-form-modal';
import { FonctionArbre } from './fonction-arbre';

export function FonctionsPage() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    useDocumentTitle('eLISAschool | Fonctions');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<OrgView>('arbre');
    const [showFormModal, setShowFormModal] = useState(false);
    const [fonctionToEdit, setFonctionToEdit] = useState<Fonction | null>(null);
    const [fonctionToDelete, setFonctionToDelete] = useState<Fonction | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading, isError, refetch } = useFonctions({ recherche: search || undefined, page, limit });
    const { data: arbre, isLoading: arbreLoading } = useArbreFonctions();
    const { data: allFonctions } = useToutesFonctions();

    const creer = useCreerFonction();
    const modifier = useModifierFonction();
    const supprimer = useSupprimerFonction();

    const fonctions = data?.items || [];
    const meta = data?.meta;
    const currentPage = meta?.currentPage || page;

    const getFonctionParent = (parentId?: string) => {
        if (!parentId || !allFonctions) return null;
        return allFonctions.find(f => f.id === parentId);
    };

    const colonnes: Column<Fonction>[] = [
        {
            key: 'code',
            header: t('code'),
            render: (f) => (
                <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{f.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: t('nom'),
            render: (f) => <span className="text-sm font-medium">{f.nom}</span>,
        },
        {
            key: 'parent',
            header: t('fonctionParente'),
            render: (f) => {
                const parent = f.parent || getFonctionParent(f.parentId);
                return (
                    <span className="text-sm text-muted-foreground">
                        {parent ? parent.nom : <span className="italic">{t('racine')}</span>}
                    </span>
                );
            },
        },
        {
            key: 'niveau',
            header: t('niveau'),
            render: (f) => (
                <span className="text-sm text-muted-foreground">{f.niveau}</span>
            ),
        },
        {
            key: 'actif',
            header: t('statut'),
            render: (f) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    f.actif
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                }`}>
                    {f.actif ? t('actif') : t('inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colActions'),
            className: 'text-right',
            renderActions: (f) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: '/organisation/fonctions/$id', params: { id: f.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => { setFonctionToEdit(f); setShowFormModal(true); },
                    permission: 'organisation:fonctions:write',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
                    onClick: () => setFonctionToDelete(f),
                    permission: 'organisation:fonctions:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setFonctionToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: CreerFonctionDto | ModifierFonctionDto) => {
        if (fonctionToEdit) {
            await modifier.mutateAsync({ id: fonctionToEdit.id, dto: data });
        } else {
            await creer.mutateAsync(data as CreerFonctionDto);
        }
        setShowFormModal(false);
        setFonctionToEdit(null);
    };

    const handleDelete = async () => {
        if (fonctionToDelete) {
            await supprimer.mutateAsync(fonctionToDelete.id);
            setFonctionToDelete(null);
        }
    };

    if (isLoading) return <PageSkeleton showTable />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ gap: 'var(--gap-md)', padding: 'var(--space-xl)' }}>
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="font-medium text-foreground" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>{t('erreurChargement')}</p>
                <ElisaButton variant="outline" onClick={() => refetch()}>
                    {t('reessayer')}
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            <PageHeader
                title={t('fonctions')}
                subtitle={t('compteurFonctions', { count: meta?.totalItems || 0 })}
                icon={Workflow}
                variant="gradient"
                actions={
                    <div className="flex items-center gap-2">
                        <OrgViewToggle value={viewMode} onChange={setViewMode} />
                        {hasPermission('organisation:fonctions:write') && (
                            <ElisaButton variant="primary" size="sm" onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
                                {t('nouvelleFonctionBtn')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            {viewMode === 'arbre' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FonctionArbre
                        fonctions={arbre || []}
                        isLoading={arbreLoading}
                        onEdit={(f) => { setFonctionToEdit(f); setShowFormModal(true); }}
                        onDelete={(f) => setFonctionToDelete(f)}
                        onView={(f) => navigate({ to: '/organisation/fonctions/$id', params: { id: f.id } })}
                    />
                </motion.div>
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="max-w-sm">
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                {t('rechercher')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('rechercherNomCode')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <DataTable
                            tableId="fonctions-list"
                            columns={colonnes}
                            data={fonctions}
                            isLoading={isLoading}
                            pagination={meta ? {
                                page: currentPage,
                                limit: meta.itemsPerPage,
                                total: meta.totalItems,
                                totalPages: meta.totalPages,
                                hasNext: currentPage < meta.totalPages,
                                hasPrev: currentPage > 1,
                                onPageChange: setPage,
                            } : undefined}
                            emptyMessage={t('aucuneFonctionTrouvee')}
                        />
                    </motion.div>
                </>
            )}

            <FonctionFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) { setShowFormModal(false); setFonctionToEdit(null); }
                }}
                fonction={fonctionToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            <ConfirmDialog
                open={!!fonctionToDelete}
                onOpenChange={(open) => { if (!open) setFonctionToDelete(null); }}
                title={t('supprimerFonction')}
                description={t('confirmerSuppressionFonction', { nom: fonctionToDelete?.nom })}
                confirmText={t('supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
