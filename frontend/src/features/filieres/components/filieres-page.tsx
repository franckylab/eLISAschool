/**
 * ==================================
 * eLISAschool - Page Filières
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, BookOpen, School, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
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
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreSousSysteme, setFiltreSousSysteme] = useState<string>();
    const [filtreCycleId, setFiltreCycleId] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [filiereToEdit, setFiliereToEdit] = useState<Filiere | null>(null);
    const [filiereToDelete, setFiliereToDelete] = useState<Filiere | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useFilieres({
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
    const total = meta?.totalItems || 0;
    const totalPages = meta?.totalPages || 1;
    const currentPage = meta?.currentPage || page;

    const getNomCycle = (cycleId: string) => {
        return cycles?.find((c: any) => c.id === cycleId)?.nom || '-';
    };

    const colonnes: Column<Filiere>[] = [
        {
            key: 'code',
            header: 'Code',
            render: (filiere: Filiere, _index: number) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{filiere.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: 'Nom',
            render: (filiere: Filiere, _index: number) => (
                <span className="text-sm font-medium">{filiere.nom}</span>
            ),
        },
        {
            key: 'cycleId',
            header: 'Cycle',
            render: (filiere: Filiere, _index: number) => (
                <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getNomCycle(filiere.cycleId)}</span>
                </div>
            ),
        },
        {
            key: 'sousSysteme',
            header: 'Sous-système',
            render: (filiere: Filiere, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filiere.sousSysteme === 'FRANCOPHONE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                    {filiere.sousSysteme === 'FRANCOPHONE' ? 'Francophone' : 'Anglophone'}
                </span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (filiere: Filiere, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    filiere.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {filiere.actif ? 'Actif' : 'Inactif'}
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
                    onClick: () => navigate({ to: '/filieres/$id', params: { id: f.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => { setFiliereToEdit(f); setShowFormModal(true); },
                    permission: 'filieres:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setFiliereToDelete(f),
                    permission: 'filieres:delete',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Filières</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des filières et spécialités du second cycle secondaire
                    </p>
                </div>
                {hasPermission('filieres:create') && (
                    <ElisaButton
                        variant="primary"
                        onClick={handleCreate}
                        icon={<Plus className="h-4 w-4" />}
                    >
                        Créer une filière
                    </ElisaButton>
                )}
            </motion.div>

            {/* Filtres */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Rechercher</label>
                    <input
                        type="text"
                        placeholder="Nom, code..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sous-système</label>
                    <select
                        value={filtreSousSysteme || ''}
                        onChange={(e) => setFiltreSousSysteme(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    >
                        <option value="">Tous</option>
                        <option value="FRANCOPHONE">Francophone</option>
                        <option value="ANGLOPHONE">Anglophone</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Cycle</label>
                    <select
                        value={filtreCycleId || ''}
                        onChange={(e) => setFiltreCycleId(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    >
                        <option value="">Tous</option>
                        {cycles?.map((cycle: any) => (
                            <option key={cycle.id} value={cycle.id}>{cycle.nom}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <DataTable
                    columns={colonnes}
                    data={filieres}
                    isLoading={isLoading}
                    pagination={meta ? {
                        page: currentPage,
                        limit: meta.itemsPerPage,
                        total,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                        onPageChange: setPage,
                    } : undefined}
                    emptyMessage="Aucune filière trouvée"
                />
            </motion.div>

            {/* Modal Formulaire */}
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

            {/* Modal Confirmation Suppression */}
            <ConfirmDialog
                open={!!filiereToDelete}
                onOpenChange={(open) => { if (!open) setFiliereToDelete(null); }}
                title="Supprimer la filière"
                description={`Êtes-vous sûr de vouloir supprimer la filière "${filiereToDelete?.nom}" ?`}
                confirmText="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
