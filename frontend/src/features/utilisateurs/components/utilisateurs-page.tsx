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
import { Plus, User, Shield, Mail, Phone, Calendar, Eye, Pencil, Trash2, UserMinus, UserCheck, Filter } from 'lucide-react';

import { useUtilisateurs, useToggleStatutUtilisateur } from '../hooks/use-utilisateurs';
import { UtilisateurFormModal } from './utilisateur-form-modal';
import { SuppressionUtilisateurModal } from './suppression-utilisateur-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { useAuthStore } from '@/stores';
import type { Utilisateur, UtilisateurFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';
import { CustomModal } from '@/components/modals/CustomModal';

export function UtilisateursPage() {
    useTranslation();
    const { hasPermission } = usePermissions();
    const { etablissementId } = useAuthStore();
    
    const [filtres, setFiltres] = useState<UtilisateurFiltres>({ 
        page: 1, 
        limit: 20,
        etablissementId: etablissementId || undefined,
        actifFiltre: 'actif' // Par défaut: utilisateurs actifs
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [utilisateurSelected, setUtilisateurSelected] = useState<Utilisateur | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [utilisateurToDelete, setUtilisateurToDelete] = useState<Utilisateur | null>(null);
    
    // States pour le toggle statut
    const [utilisateurToToggle, setUtilisateurToToggle] = useState<Utilisateur | null>(null);
    const [motifToggle, setMotifToggle] = useState('');
    
    const { data, isLoading, error, refetch } = useUtilisateurs(filtres);
    const toggleStatut = useToggleStatutUtilisateur(etablissementId || '');

    const colonnes: Column<Utilisateur>[] = [
        {
            key: 'utilisateur',
            header: 'Utilisateur',
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                        <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                        </p>
                        {u.telephone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">{u.telephone}</span>
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
                // Utiliser le statut d'affectation (pas le statut global)
                const actif = u.actifDansEtablissement ?? true;
                return (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        actif 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                        {actif ? 'Actif dans l\'établissement' : 'Inactif dans l\'établissement'}
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
            header: 'Actions',
            className: 'text-right',
            renderActions: (u) => {
                const actif = u.actifDansEtablissement ?? true;
                return [
                    {
                        key: 'voir',
                        icon: Eye,
                        label: 'Voir détails',
                        onClick: () => { window.location.href = `/utilisateurs/${u.id}`; },
                        permission: 'utilisateurs:view',
                        variant: 'info' as const,
                    },
                    {
                        key: 'modifier',
                        icon: Pencil,
                        label: 'Modifier',
                        onClick: () => {
                            setUtilisateurSelected(u);
                            setModeFormulaire('edition');
                            setModalOpen(true);
                        },
                        permission: 'utilisateurs:edit',
                        variant: 'warning' as const,
                    },
                    {
                        key: 'toggleStatut',
                        icon: actif ? UserMinus : UserCheck,
                        label: actif ? 'Désactiver' : 'Réactiver',
                        onClick: () => setUtilisateurToToggle(u),
                        permission: 'utilisateurs:statut:change',
                        variant: actif ? 'danger' as const : 'success' as const,
                    },
                    {
                        key: 'supprimer',
                        icon: Trash2,
                        label: 'Supprimer',
                        onClick: () => setUtilisateurToDelete(u),
                        permission: 'utilisateurs:delete',
                        variant: 'danger' as const,
                    },
                ];
            },
        },
    ];

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

            {/* Barre de recherche et filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                        value={filtres.actifFiltre || 'actif'}
                        onChange={(e) => setFiltres((prev) => ({ ...prev, actifFiltre: e.target.value as 'tous' | 'actif' | 'inactif', page: 1 }))}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="actif">Actifs uniquement</option>
                        <option value="inactif">Inactifs uniquement</option>
                    </select>
                </div>
            </div>

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

            {/* Modal Suppression avec vérification des impacts */}
            {utilisateurToDelete && (
                <SuppressionUtilisateurModal
                    ouvert={!!utilisateurToDelete}
                    utilisateurId={utilisateurToDelete.id}
                    utilisateurNom={`${utilisateurToDelete.prenom} ${utilisateurToDelete.nom}`}
                    etablissementId={etablissementId || undefined}
                    onSuccess={() => {
                        setUtilisateurToDelete(null);
                        refetch();
                    }}
                    onClose={() => setUtilisateurToDelete(null)}
                />
            )}

            {/* Modal Confirmation Toggle Statut (Désactiver/Réactiver) */}
            <CustomModal
                open={!!utilisateurToToggle}
                onOpenChange={(open) => {
                    if (!open) {
                        setUtilisateurToToggle(null);
                        setMotifToggle('');
                    }
                }}
                title={utilisateurToToggle?.actifDansEtablissement ? 'Désactiver cet utilisateur' : 'Réactiver cet utilisateur'}
                description={
                    utilisateurToToggle?.actifDansEtablissement
                        ? 'L\'utilisateur n\'aura plus accès à cet établissement'
                        : 'L\'utilisateur retrouvera ses accès à cet établissement'
                }
                size="md"
                footer={
                    <>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setUtilisateurToToggle(null);
                                setMotifToggle('');
                            }}
                        >
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant={utilisateurToToggle?.actifDansEtablissement ? 'danger' : 'primary'}
                            size="sm"
                            onClick={async () => {
                                if (utilisateurToToggle && motifToggle.trim().length >= 10) {
                                    await toggleStatut.mutateAsync({
                                        utilisateurId: utilisateurToToggle.id,
                                        actif: !utilisateurToToggle.actifDansEtablissement,
                                        motif: motifToggle.trim(),
                                    });
                                    setUtilisateurToToggle(null);
                                    setMotifToggle('');
                                }
                            }}
                            disabled={motifToggle.trim().length < 10 || toggleStatut.isPending}
                        >
                            {toggleStatut.isPending
                                ? 'Traitement en cours...'
                                : utilisateurToToggle?.actifDansEtablissement
                                    ? 'Confirmer la désactivation'
                                    : 'Confirmer la réactivation'}
                        </ElisaButton>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Informations utilisateur */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                                <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {utilisateurToToggle?.prenom} {utilisateurToToggle?.nom}
                                </p>
                                <p className="text-sm text-gray-600">{utilisateurToToggle?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Champ motif obligatoire */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Motif {utilisateurToToggle?.actifDansEtablissement ? 'de la désactivation' : 'de la réactivation'}
                            <span className="text-red-500"> *</span>
                        </label>
                        <textarea
                            value={motifToggle}
                            onChange={(e) => setMotifToggle(e.target.value)}
                            placeholder={
                                utilisateurToToggle?.actifDansEtablissement
                                    ? 'Ex: Fin de contrat, Mutation, Absence prolongée...'
                                    : 'Ex: Retour de mission, Nouveau contrat, Réintégration...'
                            }
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                            required
                            minLength={10}
                            maxLength={500}
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                {motifToggle.trim().length < 10
                                    ? `Minimum 10 caractères requis (${motifToggle.trim().length}/10)`
                                    : '✓ Motif valide'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {motifToggle.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Avertissement */}
                    {utilisateurToToggle?.actifDansEtablissement && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm text-amber-800">
                                <strong>⚠️ Attention :</strong> Cette action désactivera tous les accès de l'utilisateur à cet établissement.
                                L'utilisateur ne pourra plus se connecter ni accéder aux données.
                            </p>
                        </div>
                    )}
                </div>
            </CustomModal>
        </div>
    );
}
