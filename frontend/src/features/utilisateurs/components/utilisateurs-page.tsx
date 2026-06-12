/**
 * ==================================
 * eLISAschool - Page Utilisateurs Complète
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page de gestion des utilisateurs avec UX premium
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, User, Shield, Mail, Phone, Calendar, Eye } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useUtilisateurs, useSupprimerUtilisateur } from '../hooks/use-utilisateurs';
import { UtilisateurFormModal } from './utilisateur-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Utilisateur, UtilisateurFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';

export function UtilisateursPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    
    const [filtres, setFiltres] = useState<UtilisateurFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [utilisateurSelected, setUtilisateurSelected] = useState<Utilisateur | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [utilisateurToDelete, setUtilisateurToDelete] = useState<Utilisateur | null>(null);

    const { data, isLoading, error, refetch } = useUtilisateurs(filtres);
    const supprimer = useSupprimerUtilisateur();

    const colonnes: Column<Utilisateur>[] = [
        {
            key: 'utilisateur',
            header: 'Utilisateur',
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                        <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {u.email}
                        </p>
                        {u.telephone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {u.telephone}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Rôle',
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    <span className="text-sm font-medium text-gray-900">{u.role}</span>
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (u) => {
                const statuts = {
                    actif: { couleur: 'bg-green-100 text-green-800', libelle: 'Actif' },
                    inactif: { couleur: 'bg-gray-100 text-gray-800', libelle: 'Inactif' },
                    suspendu: { couleur: 'bg-red-100 text-red-800', libelle: 'Suspendu' },
                    EN_ATTENTE_VALIDATION: { couleur: 'bg-yellow-100 text-yellow-800', libelle: 'En attente' },
                    SUPPRIME: { couleur: 'bg-gray-100 text-gray-500', libelle: 'Supprimé' },
                };
                const statut = statuts[u.statut as keyof typeof statuts] || statuts.inactif;
                return (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statut.couleur}`}>
                        {statut.libelle}
                    </span>
                );
            },
        },
        {
            key: 'derniereConnexion',
            header: 'Dernière connexion',
            sortable: true,
            render: (u) => (
                <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {u.derniereConnexion 
                        ? new Date(u.derniereConnexion).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                        : 'Jamais connecté'}
                </div>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (u) => (
                <div className="flex justify-end gap-2">
                    {hasPermission('utilisateurs:view') && (
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => navigate({ to: `/utilisateurs/${u.id}` })}
                        >
                            Détails
                        </ElisaButton>
                    )}
                    {hasPermission('utilisateurs:edit') && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setUtilisateurSelected(u);
                                setModeFormulaire('edition');
                                setModalOpen(true);
                            }}
                        >
                            Modifier
                        </ElisaButton>
                    )}
                    {hasPermission('utilisateurs:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            isLoading={supprimer.isPending}
                            onClick={() => setUtilisateurToDelete(u)}
                        >
                            Supprimer
                        </ElisaButton>
                    )}
                </div>
            ),
        },
    ];

    const handleSuccess = () => {
        setModalOpen(false);
        setUtilisateurSelected(undefined);
    };

    // Affichage skeleton pendant le chargement
    if (isLoading) {
        return <PageSkeleton showStats showTable />;
    }

    // Affichage message d'erreur
    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title="Erreur de chargement"
                    message={error.message || "Impossible de charger les utilisateurs"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div 
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
                    <p className="text-sm text-gray-600">{data?.meta?.totalItems || 0} utilisateur(s)</p>
                </div>
                {hasPermission('utilisateurs:create') && (
                    <ElisaButton 
                        variant="primary" 
                        size="sm" 
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setModeFormulaire('creation');
                            setUtilisateurSelected(undefined);
                            setModalOpen(true);
                        }}
                    >
                        Nouvel utilisateur
                    </ElisaButton>
                )}
            </motion.div>

            {/* Barre de recherche */}
            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                    searchPlaceholder="Rechercher un utilisateur par nom, email ou rôle..."
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    disableClientSearch
                    pagination={data?.meta ? {
                        page: data.meta.currentPage,
                        limit: data.meta.itemsPerPage,
                        total: data.meta.totalItems,
                        totalPages: data.meta.totalPages,
                        hasNext: data.meta.currentPage < data.meta.totalPages,
                        hasPrev: data.meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                    emptyMessage="Aucun utilisateur trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            {modalOpen && (
                <UtilisateurFormModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    mode={modeFormulaire}
                    utilisateur={utilisateurSelected}
                />
            )}

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={!!utilisateurToDelete}
                title="Supprimer cet utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${utilisateurToDelete?.prenom} ${utilisateurToDelete?.nom} ?`}
                details="Cette action est irréversible et désactivera tous les accès associés à ce compte."
                variant="danger"
                onConfirm={async () => {
                    if (utilisateurToDelete) {
                        await supprimer.mutateAsync(utilisateurToDelete.id);
                        setUtilisateurToDelete(null);
                    }
                }}
                onCancel={() => setUtilisateurToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
