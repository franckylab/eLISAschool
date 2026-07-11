import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Briefcase } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { Fonction } from '../types/fonction.types';
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

type ViewMode = 'list' | 'tree';

export function FonctionsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [showFormModal, setShowFormModal] = useState(false);
    const [fonctionToEdit, setFonctionToEdit] = useState<Fonction | null>(null);
    const [fonctionToDelete, setFonctionToDelete] = useState<Fonction | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useFonctions({ recherche: search || undefined, page, limit });
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
            header: 'Code',
            render: (f) => (
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{f.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: 'Nom',
            render: (f) => <span className="text-sm font-medium">{f.nom}</span>,
        },
        {
            key: 'parent',
            header: 'Fonction parente',
            render: (f) => {
                const parent = f.parent || getFonctionParent(f.parentId);
                return (
                    <span className="text-sm text-muted-foreground">
                        {parent ? parent.nom : <span className="italic">— Racine —</span>}
                    </span>
                );
            },
        },
        {
            key: 'niveau',
            header: 'Niveau',
            render: (f) => (
                <span className="text-sm text-muted-foreground">{f.niveau}</span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (f) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    f.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {f.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (f) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => navigate({ to: '/fonctions/$id', params: { id: f.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => { setFonctionToEdit(f); setShowFormModal(true); },
                    permission: 'config:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setFonctionToDelete(f),
                    permission: 'config:edit',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setFonctionToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (fonctionToEdit) {
            await modifier.mutateAsync({ id: fonctionToEdit.id, dto: data });
        } else {
            await creer.mutateAsync(data);
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

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Fonctions</h1>
                    <p className="text-muted-foreground mt-1">
                        Catalogue hiérarchique des fonctions et rôles métier
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-lg border border-input overflow-hidden">
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                                viewMode === 'tree'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            Arbre
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            Liste
                        </button>
                    </div>
                    {hasPermission('config:edit') && (
                        <ElisaButton
                            variant="primary"
                            onClick={handleCreate}
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Créer une fonction
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {viewMode === 'tree' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FonctionArbre
                        fonctions={arbre || []}
                        isLoading={arbreLoading}
                        onEdit={(f) => { setFonctionToEdit(f); setShowFormModal(true); }}
                        onDelete={(f) => setFonctionToDelete(f)}
                        onView={(f) => navigate({ to: '/fonctions/$id', params: { id: f.id } })}
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
                                Rechercher
                            </label>
                            <input
                                type="text"
                                placeholder="Nom, code..."
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
                            emptyMessage="Aucune fonction trouvée"
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
                title="Supprimer la fonction"
                description={`Êtes-vous sûr de vouloir supprimer la fonction "${fonctionToDelete?.nom}" ?`}
                confirmText="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
