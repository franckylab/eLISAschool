/**
 * ==================================
 * eLISAschool - Page Parents (Module Parents)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Users, UserCheck, Phone, Mail } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { Parent } from '../types/parent.types';
import {
    useParents,
    useCreerParent,
    useModifierParent,
    useSupprimerParent,
} from '../hooks/use-parents';
import { ParentFormModal } from './parent-form-modal';

export function ParentsPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [showFormModal, setShowFormModal] = useState(false);
    const [parentToEdit, setParentToEdit] = useState<Parent | null>(null);
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useParents({
        page,
        limit,
        recherche: undefined,
    });

    const creer = useCreerParent();
    const modifier = useModifierParent();
    const supprimer = useSupprimerParent();

    const parents = data?.data || [];
    const total = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    const getLienParenteLabel = (lien: string) => {
        const labels: Record<string, string> = {
            PERE: 'Père',
            MERE: 'Mère',
            TUTEUR: 'Tuteur',
            AUTRE: 'Autre',
        };
        return labels[lien] || lien;
    };

    const colonnes: Column<Parent>[] = [
        {
            key: 'eleve',
            header: 'Élève',
            sortable: true,
            render: (r) => (
                <div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--color-dominante)]" />
                        <span className="font-semibold">
                            {r.eleveNom} {r.elevePrenom}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: 'lienParente',
            header: 'Lien de parenté',
            render: (r) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.responsableLegal
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}
                >
                    {r.responsableLegal && <UserCheck className="h-3 w-3 mr-1" />}
                    {getLienParenteLabel(r.lienParente)}
                </span>
            ),
        },
        {
            key: 'telephone',
            header: 'Téléphone',
            render: (r) => (
                r.telephone ? (
                    <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{r.telephone}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'email',
            header: 'Email',
            render: (r) => (
                r.email ? (
                    <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{r.email}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (r) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => {/* Voir détails */},
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {
                        setParentToEdit(r);
                        setShowFormModal(true);
                    },
                    permission: 'parents:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setParentToDelete(r),
                    permission: 'parents:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleDelete = async () => {
        if (!parentToDelete) return;

        try {
            await supprimer.mutateAsync(parentToDelete.id);
            setParentToDelete(null);
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
                            Parents
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Gérez les liens de parenté et responsables légaux
                        </p>
                    </div>
                    {hasPermission('parents:create') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setParentToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau parent
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Parents</p>
                            <p className="text-2xl font-bold text-[var(--color-dominante)] mt-1">
                                {total}
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-[var(--color-dominante)]/20" />
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
                            <p className="text-sm text-gray-500">Responsables Légaux</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {parents.filter((r) => r.responsableLegal).length}
                            </p>
                        </div>
                        <UserCheck className="h-8 w-8 text-purple-600/20" />
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
                    tableId="parents"
                    columns={colonnes}
                    data={parents}
                    isLoading={isLoading}
                    pagination={{
                        page,
                        limit,
                        total,
                        totalPages,
                        onPageChange: setPage,
                    }}
                    emptyMessage="Aucun parent trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <ParentFormModal
                open={showFormModal}
                parent={parentToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setParentToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (parentToEdit) {
                        await modifier.mutateAsync({ id: parentToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            {/* Dialog Confirmation Suppression */}
            <ConfirmDialog
                open={!!parentToDelete}
                onOpenChange={(open) => { if (!open) setParentToDelete(null); }}
                onConfirm={handleDelete}
                title="Supprimer le parent"
                description={`Êtes-vous sûr de vouloir supprimer ce parent ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
