/**
 * ==================================
 * eLISAschool - Page Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { GroupeEtablissement, GroupeEtablissementFiltres } from '../types/groupe-etablissement.types';
import {
    useGroupesEtablissements,
    useCreerGroupeEtablissement,
    useModifierGroupeEtablissement,
    useSupprimerGroupeEtablissement,
    useEtablissementsDisponibles,
    useUtilisateursDisponibles,
    useListerEtablissementsGroupe,
    useListerAdmins,
} from '../hooks/use-groupes-etablissements';
import { GroupeEtablissementFormModal } from './groupe-etablissement-form-modal';
import { GroupeEtablissementDetailModal } from './groupe-etablissement-detail-modal';
import { GestionEtablissementsModal } from './gestion-etablissements-modal';
import { GestionAdminsModal } from './gestion-admins-modal';

export function GroupesEtablissementsPage() {
    const { t } = useTranslation('groupes-etablissements');
    const { hasPermission } = usePermissions();
    
    const [filtres, setFiltres] = useState<GroupeEtablissementFiltres>({ 
        page: 1, 
        limit: 20, 
        recherche: '' 
    });
    const [showFormModal, setShowFormModal] = useState(false);
    const [groupeToEdit, setGroupeToEdit] = useState<GroupeEtablissement | null>(null);
    const [groupeToDelete, setGroupeToDelete] = useState<GroupeEtablissement | null>(null);
    const [groupeToView, setGroupeToView] = useState<GroupeEtablissement | null>(null);
    const [groupeToManageEtabs, setGroupeToManageEtabs] = useState<GroupeEtablissement | null>(null);
    const [groupeToManageAdmins, setGroupeToManageAdmins] = useState<GroupeEtablissement | null>(null);

    const { data: dataGroupes, isLoading } = useGroupesEtablissements(filtres);
    const { data: dataEtablissements } = useEtablissementsDisponibles();
    const { data: dataUtilisateurs } = useUtilisateursDisponibles();
    const { data: dataEtablissementsAssignes } = useListerEtablissementsGroupe(groupeToManageEtabs?.id || '', !!groupeToManageEtabs);
    const { data: dataAdminsActuels } = useListerAdmins(groupeToManageAdmins?.id || '', !!groupeToManageAdmins);

    const creer = useCreerGroupeEtablissement();
    const modifier = useModifierGroupeEtablissement();
    const supprimer = useSupprimerGroupeEtablissement();

    // Extraire les tableaux de données des réponses API
    // Les hooks retournent déjà les tableaux extraits (queryFn fait return response?.data)
    const groupes = dataGroupes?.items || [];
    const etablissementsDisponibles = dataEtablissements || [];
    const utilisateursDisponibles = dataUtilisateurs || [];
    const etablissementsAssignes = dataEtablissementsAssignes || [];
    const adminsActuels = dataAdminsActuels || [];
    const total = dataGroupes?.meta?.totalItems || 0;

    const colonnes: Column<GroupeEtablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('colonnes.groupe'),
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
            header: t('colonnes.code'),
            render: (g) => (
                <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {g.code}
                </code>
            ),
        },
        {
            key: 'nbEtablissements',
            header: t('colonnes.etablissements'),
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
            header: t('colonnes.statut'),
            render: (g) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        g.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {g.actif ? t('champs.actif') : t('champs.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: t('colonnes.actions'),
            className: 'text-right',
            render: (g) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => setGroupeToView(g)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title={t('boutons.voirDetails')}
                        aria-label={`${t('boutons.voirDetails')} - ${g.nom}`}
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('groupes-etablissements:edit') && (
                        <>
                            <button
                                onClick={() => setGroupeToManageEtabs(g)}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                title="Gérer les établissements"
                                aria-label={`Gérer les établissements - ${g.nom}`}
                            >
                                <Building2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setGroupeToManageAdmins(g)}
                                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                                title="Gérer les admins"
                                aria-label={`Gérer les admins - ${g.nom}`}
                            >
                                <Users className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setGroupeToEdit(g);
                                    setShowFormModal(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                title={t('boutons.modifier')}
                                aria-label={`${t('boutons.modifier')} - ${g.nom}`}
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    {hasPermission('groupes-etablissements:delete') && (
                        <button
                            onClick={() => setGroupeToDelete(g)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title={t('boutons.supprimer')}
                            aria-label={`${t('boutons.supprimer')} - ${g.nom}`}
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
        <div className="flex flex-col gap-6 p-6">
            {/* En-tête */}
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('titre')}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{total} groupe(s)</p>
                </div>
                {hasPermission('groupes-etablissements:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setGroupeToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        {t('boutons.nouveau')}
                    </ElisaButton>
                )}
            </motion.div>

            {/* Tableau */}
            <DataTable
                data={groupes}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('search.placeholder')}
                onSearchChange={(val: string) =>
                    setFiltres((prev) => ({ ...prev, recherche: val, page: 1 }))
                }
                disableClientSearch
                pagination={dataGroupes?.meta ? {
                    page: dataGroupes.meta.currentPage,
                    limit: dataGroupes.meta.itemsPerPage,
                    total: dataGroupes.meta.totalItems,
                    totalPages: dataGroupes.meta.totalPages,
                    hasNext: dataGroupes.meta.currentPage < dataGroupes.meta.totalPages,
                    hasPrev: dataGroupes.meta.currentPage > 1,
                } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                emptyMessage={t('messages.aucunGroupe')}
                aria-label={t('titre')}
            />

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
                onOpenChange={(open) => { if (!open) setGroupeToDelete(null); }}
                onConfirm={handleDelete}
                title={t('confirmation.titreSuppression')}
                description={t('confirmation.messageSuppression', { nom: groupeToDelete?.nom })}
                confirmText={t('confirmation.confirmText')}
                variant="danger"
                isLoading={supprimer.isPending}
            />

            {/* Modal Détails */}
            {groupeToView && (
                <GroupeEtablissementDetailModal
                    open={!!groupeToView}
                    onOpenChange={(open) => { if (!open) setGroupeToView(null); }}
                    groupe={groupeToView}
                />
            )}

            {/* Modal Gestion Établissements */}
            {groupeToManageEtabs && (
                <GestionEtablissementsModal
                    open={!!groupeToManageEtabs}
                    onOpenChange={(open) => { if (!open) setGroupeToManageEtabs(null); }}
                    groupe={groupeToManageEtabs}
                    etablissementsDisponibles={etablissementsDisponibles}
                    etablissementsAssignes={etablissementsAssignes}
                    onRefresh={() => {
                        // Rafraîchir la liste principale
                        setGroupeToManageEtabs(null);
                    }}
                />
            )}

            {/* Modal Gestion Admins */}
            {groupeToManageAdmins && (
                <GestionAdminsModal
                    open={!!groupeToManageAdmins}
                    onOpenChange={(open) => { if (!open) setGroupeToManageAdmins(null); }}
                    groupe={groupeToManageAdmins}
                    utilisateursDisponibles={utilisateursDisponibles}
                    adminsActuels={adminsActuels}
                    onRefresh={() => {
                        setGroupeToManageAdmins(null);
                    }}
                />
            )}
        </div>
    );
}
