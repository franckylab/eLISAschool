/**
 * ==================================
 * eLISAschool - Page Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Building2, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { GroupeEtablissement } from '../types/groupe-etablissement.types';
import {
    useGroupesEtablissements,
    useCreerGroupeEtablissement,
    useModifierGroupeEtablissement,
    useSupprimerGroupeEtablissement,
} from '../hooks/use-groupes-etablissements';
import { GroupeEtablissementFormModal } from './groupe-etablissement-form-modal';

export function GroupesEtablissementsPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [groupeToEdit, setGroupeToEdit] = useState<GroupeEtablissement | null>(null);
    const [groupeToDelete, setGroupeToDelete] = useState<GroupeEtablissement | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useGroupesEtablissements({
        page,
        limit,
        recherche: recherche || undefined,
    });

    const creer = useCreerGroupeEtablissement();
    const modifier = useModifierGroupeEtablissement();
    const supprimer = useSupprimerGroupeEtablissement();

    const groupes = data?.data || [];
    const total = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    const colonnes: Column<GroupeEtablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Groupe',
            sortable: true,
            render: (g) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--color-dominante)]" />
                        <span className="font-semibold">{g.nom}</span>
                    </div>
                    {g.description && (
                        <p className="text-xs text-gray-500 mt-1">{g.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            render: (g) => (
                <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {g.code}
                </code>
            ),
        },
        {
            key: 'nbEtablissements',
            header: 'Établissements',
            render: (g) => (
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                        {g.nbEtablissements || 0}
                    </span>
                </div>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (g) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        g.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {g.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (g) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('groupes-etablissements:edit') && (
                        <button
                            onClick={() => {
                                setGroupeToEdit(g);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('groupes-etablissements:delete') && (
                        <button
                            onClick={() => setGroupeToDelete(g)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const handleDelete = async () => {
        if (!groupeToDelete) return;

        try {
            await supprimer.mutateAsync(groupeToDelete.id);
            setGroupeToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-texte)]">
                            Groupes d'Établissements
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Gérez les regroupements d'établissements pour la consolidation
                        </p>
                    </div>
                    {hasPermission('groupes-etablissements:create') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setGroupeToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau groupe
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Groupes</p>
                            <p className="text-2xl font-bold text-[var(--color-dominante)] mt-1">
                                {total}
                            </p>
                        </div>
                        <Building2 className="h-8 w-8 text-[var(--color-dominante)]/20" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Actifs</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {groupes.filter((g) => g.actif).length}
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-green-600/20" />
                    </div>
                </motion.div>
            </div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <DataTable
                    columns={colonnes}
                    data={groupes}
                    isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                    pagination={{
                        page,
                        limit,
                        total,
                        totalPages,
                        onPageChange: setPage,
                    }}
                    search={{
                        value: recherche,
                        onSearch: setRecherche,
                        placeholder: 'Rechercher un groupe...',
                    }}
                    emptyMessage="Aucun groupe d'établissements trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <GroupeEtablissementFormModal
                open={showFormModal}
                groupe={groupeToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setGroupeToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (groupeToEdit) {
                        await modifier.mutateAsync({ id: groupeToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            {/* Dialog Confirmation Suppression */}
            <ConfirmDialog
                open={!!groupeToDelete}
                onClose={() => setGroupeToDelete(null)}
                onConfirm={handleDelete}
                title="Supprimer le groupe"
                description={`Êtes-vous sûr de vouloir supprimer "${groupeToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
