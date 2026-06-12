/**
 * ==================================
 * eLISAschool - Page Responsables Élèves
 * ==================================
 * Version: 1.0.0
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
import type { ResponsableEleve } from '../types/responsable-eleve.types';
import {
    useResponsablesEleves,
    useCreerResponsableEleve,
    useModifierResponsableEleve,
    useSupprimerResponsableEleve,
} from '../hooks/use-responsables-eleves';
import { ResponsableEleveFormModal } from './responsable-eleve-form-modal';

export function ResponsablesElevesPage() {
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [responsableToEdit, setResponsableToEdit] = useState<ResponsableEleve | null>(null);
    const [responsableToDelete, setResponsableToDelete] = useState<ResponsableEleve | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useResponsablesEleves({
        page,
        limit,
        recherche: recherche || undefined,
    });

    const creer = useCreerResponsableEleve();
    const modifier = useModifierResponsableEleve();
    const supprimer = useSupprimerResponsableEleve();

    const responsables = data?.data || [];
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

    const colonnes: Column<ResponsableEleve>[] = [
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
            render: (r) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('responsables-eleves:edit') && (
                        <button
                            onClick={() => {
                                setResponsableToEdit(r);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('responsables-eleves:delete') && (
                        <button
                            onClick={() => setResponsableToDelete(r)}
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
        if (!responsableToDelete) return;

        try {
            await supprimer.mutateAsync(responsableToDelete.id);
            setResponsableToDelete(null);
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
                            Responsables d'Élèves
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Gérez les liens de parenté et responsables légaux
                        </p>
                    </div>
                    {hasPermission('responsables-eleves:create') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setResponsableToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau responsable
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
                            <p className="text-sm text-gray-500">Total Responsables</p>
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
                                {responsables.filter((r) => r.responsableLegal).length}
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
                    columns={colonnes}
                    data={responsables}
                    isLoading={isLoading}
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
                        placeholder: 'Rechercher un responsable...',
                    }}
                    emptyMessage="Aucun responsable d'élève trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <ResponsableEleveFormModal
                open={showFormModal}
                responsable={responsableToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setResponsableToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (responsableToEdit) {
                        await modifier.mutateAsync({ id: responsableToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            {/* Dialog Confirmation Suppression */}
            <ConfirmDialog
                open={!!responsableToDelete}
                onClose={() => setResponsableToDelete(null)}
                onConfirm={handleDelete}
                title="Supprimer le responsable"
                description={`Êtes-vous sûr de vouloir supprimer ce responsable ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
