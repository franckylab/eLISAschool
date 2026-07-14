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
import { Plus, User, Users, Shield, Mail, Phone, Calendar, Eye, Pencil, Trash2, UserMinus, UserCheck, Filter, Briefcase, ExternalLink, Key, QrCode } from 'lucide-react';

import { useUtilisateurs, useToggleStatutUtilisateur } from '../hooks/use-utilisateurs';
import { UtilisateurFormModal } from './utilisateur-form-modal';
import { SuppressionUtilisateurModal } from './suppression-utilisateur-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { useAuthStore } from '@/stores';
import type { Utilisateur, UtilisateurFiltres } from '../types/utilisateur.types';
import type { Column } from '@/components/ui/DataTable';
import { CustomModal } from '@/components/modals/CustomModal';
import { useNavigate } from '@tanstack/react-router';

export function UtilisateursPage() {
    const { t } = useTranslation('utilisateurs');
    const navigate = useNavigate();
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
            header: t('nom'),
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                        <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                        </p>
                        {u.telephone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
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
            header: t('role'),
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.role}</span>
                </div>
            ),
        },
        {
            key: 'statut',
            header: t('etatCompte'),
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
                        {actif ? t('actifEtablissement') : t('inactifEtablissement')}
                    </span>
                );
            },
        },
        {
            key: 'personnel',
            header: t('colonnes.personnel'),
            className: 'text-center',
            render: (u) => {
                const mp = u.membrePersonnel;
                return mp ? (
                    <button
                        onClick={() => navigate({ to: '/personnel/$id', params: { id: mp.id } } as any)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        <Briefcase className="h-3 w-3" />
                        {mp.matricule}
                        <ExternalLink className="h-3 w-3" />
                    </button>
                ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{t('nonLie')}</span>
                );
            },
        },
        {
            key: 'pseudonyme',
            header: t('pseudonyme'),
            render: (u) => (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Key className="h-3.5 w-3.5 text-gray-400" />
                    <span>{u.pseudonyme || '—'}</span>
                </div>
            ),
        },
        {
            key: 'qrCodeId',
            header: t('qrCode'),
            className: 'text-center',
            render: (u) => (
                <div className="flex items-center justify-center">
                    {u.qrCodeId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                            <QrCode className="h-3 w-3" />
                            {t('qrCodeActif')}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'maxEtablissementsPersonnel',
            header: t('maxEtablissements'),
            sortable: true,
            className: 'text-center',
            render: (u) => (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {u.maxEtablissementsPersonnel === 0
                        ? t('illimite')
                        : u.maxEtablissementsPersonnel === 1
                            ? '1'
                            : String(u.maxEtablissementsPersonnel)}
                </span>
            ),
        },
        {
            key: 'derniereConnexion',
            header: t('derniereConnexion'),
            sortable: true,
            render: (u) => (
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {u.derniereConnexion 
                        ? new Date(u.derniereConnexion).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                        : t('jamaisConnecte')}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions', // kept as a generic term
            className: 'text-right',
            renderActions: (u) => {
                const actif = u.actifDansEtablissement ?? true;
                return [
                    {
                        key: 'voir',
                        icon: Eye,
                        label: 'Voir', // generic — kept simple
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
                        label: actif ? t('desactiver') : t('reactiver'),
                        onClick: () => setUtilisateurToToggle(u),
                        permission: 'utilisateurs:statut:change',
                        variant: actif ? 'danger' as const : 'success' as const,
                    },
                    {
                        key: 'supprimer',
                        icon: Trash2,
                        label: t('supprimerCompte'),
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
                    title={t('erreurChargement')}
                    message={error.message || t('erreurChargement')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titrePage')}
                subtitle={t('compteurUtilisateurs', { count: data?.meta?.totalItems || 0 })}
                icon={Users}
                variant="gradient"
                actions={hasPermission('utilisateurs:create') ? (
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
                        {t('nouvelUtilisateur')}
                    </ElisaButton>
                ) : undefined}
            />

            {/* Barre de recherche et filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <ElisaSelect
                        value={filtres.actifFiltre || 'actif'}
                        onValueChange={(value) => setFiltres((prev) => ({ ...prev, actifFiltre: value as 'tous' | 'actif' | 'inactif', page: 1 }))}
                        options={[
                            { value: 'tous', label: t('tousStatuts') },
                            { value: 'actif', label: t('actifsUniquement') },
                            { value: 'inactif', label: t('inactifsUniquement') },
                        ]}
                        className="min-w-[140px]"
                    />
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
                    searchPlaceholder={t('rechercherPlaceholder')}
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
                    emptyMessage={t('aucunUtilisateurTrouve')}
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
                title={utilisateurToToggle?.actifDansEtablissement ? t('desactiver') : t('reactiver')}
                description={
                    utilisateurToToggle?.actifDansEtablissement
                        ? t('actifEtablissement')
                        : t('inactifEtablissement')
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
                            {t('annuler')}
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
                                ? t('traitementEnCours')
                                : utilisateurToToggle?.actifDansEtablissement
                                    ? t('confirmerDesactivation')
                                    : t('confirmerReactivation')}
                        </ElisaButton>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Informations utilisateur */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                                <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {utilisateurToToggle?.prenom} {utilisateurToToggle?.nom}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{utilisateurToToggle?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Champ motif obligatoire */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('motifLabel', { action: utilisateurToToggle?.actifDansEtablissement ? t('actionDesactivation') : t('actionReactivation') })}
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
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                            required
                            minLength={10}
                            maxLength={500}
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {motifToggle.trim().length < 10
                                    ? `${t('motifRequis')} (${motifToggle.trim().length}/10)`
                                    : t('motifValide')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {motifToggle.length}/500
                            </p>
                        </div>
                    </div>

                    {/* Avertissement */}
                    {utilisateurToToggle?.actifDansEtablissement && (
                        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
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
