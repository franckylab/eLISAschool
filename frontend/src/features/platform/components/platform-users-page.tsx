/**
 * ==================================
 * eLISAschool - Page Utilisateurs Plateforme
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 *
 * CRUD utilisateurs plateforme avec DataTable, KPIs, filtres.
 * Pattern aligné sur utilisateurs-page.tsx (tenant).
 *
 * ADR-005 — Auth unifiée (source unique de vérité)
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Users, Shield, ShieldCheck, UserPlus,
    Eye, Ban, RotateCcw,
    CheckCircle, AlertTriangle, Mail,
    Filter, Building2, Edit, Download, Archive, ArchiveRestore,
} from 'lucide-react';
import {
    usePlatformUsers,
    usePlatformUserKpis,
    useCreatePlatformUser,
    useSuspendrePlatformUser,
    useReactiverPlatformUser,
    useUpdatePlatformUser,
    useArchiverPlatformUser,
    useDesarchiverPlatformUser,
    useExportCsvPlatformUsers,
    type PlatformUser,
    type PlatformUserFiltres,
} from '../hooks/use-platform-users';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals/CustomModal';
import type { Column } from '@/components/ui/DataTable';

// =============================================
// Config badges
// =============================================

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    PLATEFORME_ADMIN: 'Admin Plateforme',
    PLATEFORME_SUPPORT: 'Support',
    PLATEFORME_BILLING: 'Facturation',
    PLATEFORME_ANALYST: 'Analyste',
    PLATEFORME_AUDITOR: 'Auditeur',
};

export function PlatformUsersPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('admin');
    const [filtres, setFiltres] = useState<PlatformUserFiltres>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userToToggle, setUserToToggle] = useState<PlatformUser | null>(null);
    const [userToEdit, setUserToEdit] = useState<PlatformUser | null>(null);
    const [userToArchive, setUserToArchive] = useState<PlatformUser | null>(null);
    const [editRole, setEditRole] = useState('');

    // Création
    const [newEmail, setNewEmail] = useState('');
    const [newPrenom, setNewPrenom] = useState('');
    const [newNom, setNewNom] = useState('');
    const [newRole, setNewRole] = useState('PLATEFORME_ADMIN');

    const { data: usersData, isLoading, isFetching, error, refetch } = usePlatformUsers(filtres);
    const { data: kpis } = usePlatformUserKpis();
    const creer = useCreatePlatformUser();
    const suspendre = useSuspendrePlatformUser();
    const reactiver = useReactiverPlatformUser();
    const updateuser = useUpdatePlatformUser();
    const archiver = useArchiverPlatformUser();
    const desarchiver = useDesarchiverPlatformUser();
    const exportCsv = useExportCsvPlatformUsers();

    const utilisateurs = usersData?.items || [];

    const colonnes: Column<PlatformUser>[] = [
        {
            key: 'utilisateur',
            header: t('platformUsers.utilisateur', 'Utilisateur'),
            sortable: true,
            render: (u) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30">
                        <span className="text-sm font-bold text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]">
                            {u.prenom?.[0]}{u.nom?.[0]}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: t('platformUsers.role', 'Rôle'),
            sortable: true,
            render: (u) => (
                <span className="inline-flex rounded-full bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 px-2.5 py-0.5 text-xs font-medium text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]">
                    {ROLE_LABELS[u.role] || u.role}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('platformUsers.statut', 'Statut'),
            sortable: true,
            render: (u) => {
                const estActif = u.estActif || u.statut === 'ACTIF';
                const estSuspendu = u.statut === 'SUSPENDU';
                const estArchive = u.statut === 'ARCHIVE';
                return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        estArchive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        estSuspendu ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        estActif ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            estArchive ? 'bg-purple-500' : estSuspendu ? 'bg-red-500' : estActif ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {estArchive ? 'Archivé' : estSuspendu ? t('platformUsers.suspendu', 'Suspendu') : estActif ? t('platformUsers.actif', 'Actif') : t('platformUsers.inactif', 'Inactif')}
                    </span>
                );
            },
        },
        {
            key: 'mfa',
            header: 'MFA',
            className: 'text-center',
            render: (u) => {
                const mfaActif = u.mfaActive || u.deuxFacteursActif;
                return mfaActif ? (
                    <CheckCircle className="h-4 w-4 mx-auto text-green-600 dark:text-green-400" />
                ) : (
                    <AlertTriangle className="h-4 w-4 mx-auto text-amber-500" />
                );
            },
        },
        {
            key: 'derniereConnexion',
            header: t('platformUsers.derniereConnexion', 'Dernière connexion'),
            sortable: true,
            render: (u) => {
                const date = u.dernierAcces || u.dernierAccesPlatforme;
                return (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {date ? new Date(date).toLocaleDateString() : '—'}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: t('platformUsers.actions', 'Actions'),
            className: 'text-right',
            renderActions: (u) => {
                const estActif = u.estActif || u.statut === 'ACTIF';
                return [
                    {
                        key: 'detail',
                        icon: Eye,
                        label: t('platformUsers.voir', 'Détail'),
                        onClick: () => navigate({ to: '/platform/utilisateurs/$id', params: { id: u.id }, search: { tab: 'informations' } as any }),
                    },
                    {
                        key: 'edit',
                        icon: Edit,
                        label: t('platformUsers.modifier', 'Modifier'),
                        onClick: () => {
                            setUserToEdit(u);
                            setEditRole(u.role);
                        },
                    },
                    {
                        key: 'toggle',
                        icon: estActif ? Ban : RotateCcw,
                        label: estActif ? t('platformUsers.desactiver', 'Désactiver') : t('platformUsers.reactiver', 'Réactiver'),
                        onClick: () => setUserToToggle(u),
                        variant: estActif ? 'danger' as const : undefined,
                    },
                    {
                        key: 'archive',
                        icon: u.statut === 'ARCHIVE' ? ArchiveRestore : Archive,
                        label: u.statut === 'ARCHIVE' ? 'Désarchiver' : 'Archiver',
                        onClick: () => setUserToArchive(u),
                        variant: u.statut === 'ARCHIVE' ? undefined : 'danger' as const,
                    },
                ];
            },
        },
    ];

    // KPI cards
    const kpiCards = [
        { icon: Users, label: t('platformUsers.total', 'Total comptes'), value: kpis ? String(kpis.total) : '—', color: 'var(--color-dominant-600)' },
        { icon: Shield, label: t('platformUsers.superAdmins', 'Super Admins'), value: kpis ? String(kpis.parRole?.SUPER_ADMIN || 0) : '—', color: 'var(--color-danger)' },
        { icon: ShieldCheck, label: t('platformUsers.mfaActif', 'MFA actif'), value: kpis ? `${kpis.mfaPourcentage || 0}%` : '—', color: 'var(--color-success)' },
        { icon: Building2, label: t('platformUsers.plateforme', 'Plateforme'), value: kpis?.parPlanGestion ? `${kpis.parPlanGestion.plateforme} / ${kpis.parPlanGestion.tenant}` : '—', sublabel: 'Plateforme / Tenant', color: '#8b5cf6' },
    ];

    if (isLoading && !usersData) {
        return <PageSkeleton showStats showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('platformUsers.erreurChargement', 'Erreur de chargement')}
                    message={error.message || t('platformUsers.impossibleCharger', 'Impossible de charger les utilisateurs')}
                    onRetry={() => refetch()}
                    retryLabel={t('platformUsers.reessayer', 'Réessayer')}
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">
                        {t('platformUsers.titre', 'Utilisateurs Plateforme')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('platformUsers.description', 'Gérez les comptes administrateur du Control Plane')}
                    </p>
                </div>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<UserPlus className="h-4 w-4" />}
                    onClick={() => setShowCreateModal(true)}
                >
                    {t('platformUsers.creer', 'Nouveau compte')}
                </ElisaButton>
                <ElisaButton
                    variant="outline"
                    size="sm"
                    icon={<Download className="h-4 w-4" />}
                    chargement={exportCsv.isPending}
                    onClick={() => exportCsv.mutate(filtres)}
                >
                    Export CSV
                </ElisaButton>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi, index) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{kpi.label}</span>
                            <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Barre de filtres */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
            >
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                
                {/* Filtre Scope */}
                <select
                    value={filtres.scope || 'tous'}
                    onChange={(e) => setFiltres(prev => ({ ...prev, scope: e.target.value as 'plateforme' | 'tenant' | 'tous' }))}
                    className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="tous">Tous les scopes</option>
                    <option value="plateforme">Plateforme</option>
                    <option value="tenant">Tenant</option>
                </select>

                {/* Filtre Rôle */}
                <select
                    value={filtres.role || ''}
                    onChange={(e) => setFiltres(prev => ({ ...prev, role: e.target.value || undefined }))}
                    className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="">Tous les rôles</option>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                {/* Filtre Statut */}
                <select
                    value={filtres.statut || ''}
                    onChange={(e) => setFiltres(prev => ({ ...prev, statut: e.target.value || undefined }))}
                    className="h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                    <option value="">Tous les statuts</option>
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="SUSPENDU">Suspendu</option>
                </select>

                {/* Filtre MFA */}
                <button
                    onClick={() => setFiltres(prev => ({ ...prev, mfaActive: prev.mfaActive === undefined ? true : prev.mfaActive === true ? false : undefined }))}
                    className={`h-8 rounded-lg border px-3 text-sm font-medium transition-colors ${
                        filtres.mfaActive === true
                            ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : filtres.mfaActive === false
                                ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {filtres.mfaActive === true ? 'MFA activé' : filtres.mfaActive === false ? 'MFA désactivé' : 'MFA (tous)'}
                </button>

                {/* Reset filtres */}
                {(filtres.scope || filtres.role || filtres.statut || filtres.mfaActive !== undefined) && (
                    <button
                        onClick={() => setFiltres({})}
                        className="h-8 rounded-lg px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Réinitialiser
                    </button>
                )}
            </motion.div>

            {/* DataTable */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="platform-users-list"
                    data={utilisateurs}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchPlaceholder={t('platformUsers.rechercher', 'Rechercher un utilisateur...')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, search: recherche || undefined }))
                    }
                    disableClientSearch
                    emptyMessage={t('platformUsers.aucunUtilisateur', 'Aucun utilisateur plateforme')}
                />
            </motion.div>

            {/* Modal Toggle statut */}
            <ConfirmationModal
                isOpen={!!userToToggle}
                title={userToToggle?.estActif ? t('platformUsers.desactiverTitre', 'Désactiver ce compte') : t('platformUsers.reactiverTitre', 'Réactiver ce compte')}
                message={userToToggle ? `${userToToggle.prenom} ${userToToggle.nom}` : ''}
                details={userToToggle?.estActif
                    ? t('platformUsers.desactiverDetails', 'L\'utilisateur ne pourra plus se connecter.')
                    : t('platformUsers.reactiverDetails', 'L\'utilisateur pourra à nouveau se connecter.')
                }
                variant={userToToggle?.estActif ? 'danger' : 'info'}
                onConfirm={async () => {
                    if (userToToggle) {
                        if (userToToggle.estActif) {
                            await suspendre.mutateAsync(userToToggle.id);
                        } else {
                            await reactiver.mutateAsync(userToToggle.id);
                        }
                        setUserToToggle(null);
                    }
                }}
                onCancel={() => setUserToToggle(null)}
                isLoading={suspendre.isPending || reactiver.isPending}
            />

            {/* Modal Création */}
            <CustomModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                title={t('platformUsers.nouveauCompte', 'Nouveau compte plateforme')}
                footer={
                    <div className="flex justify-end gap-2">
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => { setShowCreateModal(false); setNewEmail(''); setNewPrenom(''); setNewNom(''); }}
                        >
                            {t('platformUsers.annuler', 'Annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            chargement={creer.isPending}
                            disabled={!newEmail.trim() || !newPrenom.trim() || !newNom.trim()}
                            onClick={() => {
                                creer.mutate(
                                    { email: newEmail.trim(), prenom: newPrenom.trim(), nom: newNom.trim(), role: newRole },
                                    { onSuccess: () => { setShowCreateModal(false); setNewEmail(''); setNewPrenom(''); setNewNom(''); } },
                                );
                            }}
                        >
                            {t('platformUsers.creerCompte', 'Créer le compte')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                            placeholder="admin@elisaschool.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('platformUsers.prenom', 'Prénom')}</label>
                            <input
                                type="text"
                                value={newPrenom}
                                onChange={(e) => setNewPrenom(e.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                                placeholder="Prénom"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('platformUsers.nom', 'Nom')}</label>
                            <input
                                type="text"
                                value={newNom}
                                onChange={(e) => setNewNom(e.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                                placeholder="Nom"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('platformUsers.role', 'Rôle')}</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                        >
                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </CustomModal>

            {/* Modal Édition utilisateur */}
            <CustomModal
                open={!!userToEdit}
                onOpenChange={(v) => { if (!v) setUserToEdit(null); }}
                title={t('platformUsers.modifierCompte', 'Modifier le compte')}
                size="md"
                footer={
                    <div className="flex justify-end gap-2">
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToEdit(null)}
                        >
                            {t('platformUsers.annuler', 'Annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            chargement={updateuser.isPending}
                            disabled={!userToEdit || editRole === userToEdit.role}
                            onClick={async () => {
                                if (userToEdit && editRole !== userToEdit.role) {
                                    await updateuser.mutateAsync({
                                        id: userToEdit.id,
                                        role: editRole,
                                    });
                                    setUserToEdit(null);
                                }
                            }}
                        >
                            {t('platformUsers.enregistrer', 'Enregistrer')}
                        </ElisaButton>
                    </div>
                }
            >
                {userToEdit && (
                    <div className="space-y-4">
                        {/* Infos utilisateur (lecture seule) */}
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {userToEdit.prenom} {userToEdit.nom}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {userToEdit.email}
                            </p>
                        </div>
                        {/* Sélection du rôle */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('platformUsers.nouveauRole', 'Nouveau rôle')}
                            </label>
                            <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                            >
                                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            {editRole !== userToEdit.role && (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                    Le rôle sera changé de « {ROLE_LABELS[userToEdit.role] || userToEdit.role} » à « {ROLE_LABELS[editRole] || editRole} »
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* Modal Confirmation Archivage/Désarchivage */}
            <ConfirmationModal
                isOpen={!!userToArchive}
                title={userToArchive?.statut === 'ARCHIVE' ? 'Désarchiver ce compte' : 'Archiver ce compte'}
                message={userToArchive ? `${userToArchive.prenom} ${userToArchive.nom}` : ''}
                details={userToArchive?.statut === 'ARCHIVE'
                    ? 'L\'utilisateur sera restauré avec le statut Inactif. Il pourra être réactivé ensuite.'
                    : 'L\'utilisateur sera archivé (non destructif). Il ne pourra plus se connecter mais ses données sont conservées.'}
                variant={userToArchive?.statut === 'ARCHIVE' ? 'info' : 'danger'}
                onConfirm={async () => {
                    if (userToArchive) {
                        if (userToArchive.statut === 'ARCHIVE') {
                            await desarchiver.mutateAsync({ id: userToArchive.id });
                        } else {
                            await archiver.mutateAsync(userToArchive.id);
                        }
                        setUserToArchive(null);
                    }
                }}
                onCancel={() => setUserToArchive(null)}
                isLoading={archiver.isPending || desarchiver.isPending}
            />
        </div>
    );
}

export default PlatformUsersPage;
