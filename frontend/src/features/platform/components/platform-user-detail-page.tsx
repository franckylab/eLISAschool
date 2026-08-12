/**
 * ==================================
 * eLISAschool - Platform User Detail Page
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 *
 * Détail d'un utilisateur plateforme avec onglets :
 * - Informations : profil, rôle, dates, MFA
 * - Activité : historique (placeholder)
 * - Sécurité : reset MFA, suspension, révocation sessions, reset password
 *
 * Pattern aligné sur utilisateur-detail-page.tsx (tenant).
 * ADR-005 — Auth unifiée
 */

import { useCallback, useState } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    User, Shield, Activity, Settings,
    CheckCircle, XCircle, AlertCircle, Lock,
    Ban, RotateCcw, Key, Clock, Mail, Calendar,
    Archive, ArchiveRestore, FileText,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
    usePlatformUserDetail,
    useSuspendrePlatformUser,
    useReactiverPlatformUser,
    useResetMfaPlatformUser,
    useRevoquerSessionsPlatformUser,
    useForcePasswordResetPlatformUser,
    useArchiverPlatformUser,
    useDesarchiverPlatformUser,
    usePlatformUserAudit,
    type PlatformUser,
    type AuditLogEntry,
} from '../hooks/use-platform-users';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import type { Tab } from '@/components/ui';

// =============================================
// Config
// =============================================

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    PLATEFORME_ADMIN: 'Admin Plateforme',
    PLATEFORME_SUPPORT: 'Support',
    PLATEFORME_BILLING: 'Facturation',
    PLATEFORME_ANALYST: 'Analyste',
    PLATEFORME_AUDITOR: 'Auditeur',
};

type Onglet = 'informations' | 'activite' | 'securite';

// =============================================
// Composant principal
// =============================================

export function PlatformUserDetailPage() {
    const { id } = useParams({ from: '/platform/utilisateurs/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/platform/utilisateurs/$id' });
    const { t } = useTranslation('admin');

    const ongletActif = (search as any)?.tab || 'informations';
    const setOngletActif = (tab: Onglet) => navigate({
        to: '/platform/utilisateurs/$id',
        params: { id },
        search: { tab } as any,
    });

    const { data: user, isLoading, error, refetch } = usePlatformUserDetail(id);
    const suspendre = useSuspendrePlatformUser();
    const reactiver = useReactiverPlatformUser();
    const resetMfa = useResetMfaPlatformUser();
    const revoquerSessions = useRevoquerSessionsPlatformUser();
    const forceResetPassword = useForcePasswordResetPlatformUser();
    const archiver = useArchiverPlatformUser();
    const desarchiver = useDesarchiverPlatformUser();
    const confirm = useConfirmation();

    const displayName = user ? `${user.prenom} ${user.nom}` : '';

    const onglets: Tab[] = [
        { id: 'informations', label: t('platformUsers.tabInformations', 'Informations'), icon: User },
        { id: 'activite', label: t('platformUsers.tabActivite', 'Activité'), icon: Activity },
        { id: 'securite', label: t('platformUsers.tabSecurite', 'Sécurité'), icon: Settings },
    ];

    const estActif = user?.estActif || user?.statut === 'ACTIF';
    const estSuspendu = user?.statut === 'SUSPENDU';
    const estArchive = user?.statut === 'ARCHIVE';
    const mfaActif = user?.mfaActive || user?.deuxFacteursActif;

    // Handlers avec confirmation
    const handleToggleStatut = useCallback(() => {
        if (!user) return;
        confirm.ask({
            title: estActif ? t('platformUsers.desactiverTitre', 'Désactiver ce compte') : t('platformUsers.reactiverTitre', 'Réactiver ce compte'),
            message: `${user.prenom} ${user.nom}`,
            details: estActif
                ? t('platformUsers.desactiverDetails', 'L\'utilisateur ne pourra plus se connecter.')
                : t('platformUsers.reactiverDetails', 'L\'utilisateur pourra à nouveau se connecter.'),
            variant: estActif ? 'danger' : 'info',
            onConfirm: async () => {
                if (estActif) {
                    await suspendre.mutateAsync(user.id);
                } else {
                    await reactiver.mutateAsync(user.id);
                }
            },
        });
    }, [user, estActif, confirm, suspendre, reactiver, t]);

    const handleResetMfa = useCallback(() => {
        if (!user) return;
        confirm.ask({
            title: t('platformUsers.resetMfaTitre', 'Réinitialiser le MFA'),
            message: `Réinitialiser le MFA de ${user.prenom} ${user.nom} ?`,
            details: 'L\'utilisateur devra reconfigurer son authentification à deux facteurs.',
            variant: 'warning',
            onConfirm: async () => { await resetMfa.mutateAsync(user.id); },
        });
    }, [user, confirm, resetMfa, t]);

    const handleRevoquerSessions = useCallback(() => {
        if (!user) return;
        confirm.ask({
            title: t('platformUsers.revoquerSessionsTitre', 'Révoquer les sessions'),
            message: `Déconnecter toutes les sessions actives de ${user.prenom} ${user.nom} ?`,
            details: 'L\'utilisateur sera déconnecté de tous ses appareils et devra se reconnecter.',
            variant: 'warning',
            onConfirm: async () => { await revoquerSessions.mutateAsync(user.id); },
        });
    }, [user, confirm, revoquerSessions, t]);

    const handleForceResetPassword = useCallback(() => {
        if (!user) return;
        confirm.ask({
            title: t('platformUsers.resetPasswordTitre', 'Réinitialiser le mot de passe'),
            message: `Forcer la réinitialisation du mot de passe pour ${user.prenom} ${user.nom} ?`,
            details: 'Les sessions actives seront révoquées. L\'utilisateur devra créer un nouveau mot de passe.',
            variant: 'warning',
            onConfirm: async () => { await forceResetPassword.mutateAsync(user.id); },
        });
    }, [user, confirm, forceResetPassword, t]);

    if (isLoading && !user) {
        return <PageSkeleton showHeader />;
    }

    if (error || !user) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('platformUsers.utilisateurIntrouvable', 'Utilisateur introuvable')}
                    message={error?.message || t('platformUsers.impossibleCharger', 'Impossible de charger les détails')}
                    onRetry={() => refetch()}
                    retryLabel={t('platformUsers.reessayer', 'Réessayer')}
                />
            </div>
        );
    }

    return (
        <BreadcrumbLabelProvider value={displayName}>
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                tone="dominant"
                showBreadcrumbs
                breadcrumbLabel={displayName}
                onBack={() => navigate({ to: '/platform/utilisateurs' })}
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    {/* Avatar initiales */}
                    <div className="h-[clamp(3rem,10vw,8rem)] w-[clamp(3rem,10vw,8rem)] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[clamp(0.875rem,3vw,2.5rem)] font-bold text-white shadow-md shrink-0">
                        {(user.prenom?.charAt(0) ?? '') + (user.nom?.charAt(0) ?? '') || '?'}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">
                            {displayName}
                        </h1>
                        <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70">{user.email}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {/* Badge statut */}
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium ${
                                estArchive ? 'bg-purple-500/20 text-purple-200' :
                                estSuspendu ? 'bg-red-500/20 text-red-200' :
                                estActif ? 'bg-green-500/20 text-green-200' :
                                'bg-gray-500/20 text-gray-200'
                            }`}>
                                {estArchive ? <Archive className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" /> :
                                 estSuspendu ? <XCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" /> :
                                 estActif ? <CheckCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" /> :
                                 <AlertCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />}
                                {estArchive ? 'Archivé' : estSuspendu ? t('platformUsers.suspendu', 'Suspendu') : estActif ? t('platformUsers.actif', 'Actif') : t('platformUsers.inactif', 'Inactif')}
                            </span>
                            {/* Badge rôle */}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Shield className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {ROLE_LABELS[user.role] || user.role}
                            </span>
                            {/* Badge MFA */}
                            {mfaActif && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-blue-200">
                                    <Lock className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                    MFA
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </PageHeader>

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
                showHeader
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'informations' && (
                    <InformationsTab user={user} />
                )}
                {ongletActif === 'activite' && (
                    <ActiviteTab userId={user.id} />
                )}
                {ongletActif === 'securite' && (
                    <SecuriteTab
                        estActif={estActif}
                        estArchive={estArchive}
                        mfaActif={!!mfaActif}
                        onToggleStatut={handleToggleStatut}
                        onResetMfa={handleResetMfa}
                        onRevoquerSessions={handleRevoquerSessions}
                        onForceResetPassword={handleForceResetPassword}
                        onArchiver={() => {
                            if (!user) return;
                            confirm.ask({
                                title: 'Archiver ce compte',
                                message: `${user.prenom} ${user.nom}`,
                                details: 'L\'utilisateur ne pourra plus se connecter. Cette action est réversible.',
                                variant: 'warning',
                                onConfirm: async () => { await archiver.mutateAsync(user.id); },
                            });
                        }}
                        onDesarchiver={() => {
                            if (!user) return;
                            confirm.ask({
                                title: 'Désarchiver ce compte',
                                message: `${user.prenom} ${user.nom}`,
                                details: 'L\'utilisateur sera remis en statut Inactif et pourra être réactivé.',
                                variant: 'info',
                                onConfirm: async () => { await desarchiver.mutateAsync({ id: user.id }); },
                            });
                        }}
                        isLoading={{
                            toggleStatut: suspendre.isPending || reactiver.isPending,
                            resetMfa: resetMfa.isPending,
                            revoquerSessions: revoquerSessions.isPending,
                            forceResetPassword: forceResetPassword.isPending,
                            archiver: archiver.isPending,
                            desarchiver: desarchiver.isPending,
                        }}
                    />
                )}
            </TabsContent>

            {confirm.ConfirmationModal}
        </div>
        </BreadcrumbLabelProvider>
    );
}

// =============================================
// Tab Informations
// =============================================

function InformationsTab({ user }: { user: PlatformUser }) {
    const { t } = useTranslation('admin');
    const mfaActif = user.mfaActive || user.deuxFacteursActif;
    const estActif = user.estActif || user.statut === 'ACTIF';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profil */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('platformUsers.profil', 'Profil')}
                </h3>
                <div className="space-y-3">
                    <InfoRow icon={Mail} label="Email" value={user.email} />
                    <InfoRow icon={Shield} label={t('platformUsers.role', 'Rôle')} value={ROLE_LABELS[user.role] || user.role} />
                    <InfoRow icon={Key} label="MFA" value={mfaActif ? t('common:oui', 'Oui') : t('common:non', 'Non')} />
                    <InfoRow icon={Calendar} label={t('platformUsers.creeLe', 'Créé le')} value={new Date(user.createdAt).toLocaleDateString()} />
                    {user.dernierAcces && (
                        <InfoRow icon={Clock} label={t('platformUsers.dernierAcces', 'Dernier accès')} value={new Date(user.dernierAcces).toLocaleString()} />
                    )}
                </div>
            </div>

            {/* Statut */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('platformUsers.statut', 'Statut')}
                </h3>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                    estActif
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${estActif ? 'bg-green-500' : 'bg-red-500'}`} />
                    {estActif ? t('platformUsers.actif', 'Actif') : t('platformUsers.inactif', 'Inactif')}
                </div>
                {user.groupeEtablissementIds && user.groupeEtablissementIds.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('platformUsers.groupesRattaches', '{{count}} groupe(s) rattaché(s)', { count: user.groupeEtablissementIds.length })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// Tab Activité (audit trail réel)
// =============================================

const ACTION_ICONS: Record<string, typeof Clock> = {
    'PLATFORM_USER_CREATE': CheckCircle,
    'PLATFORM_USER_UPDATE': Key,
    'PLATFORM_USER_DEACTIVATE': Ban,
    'PLATFORM_USER_REACTIVATE': RotateCcw,
    'PLATFORM_USER_RESET_MFA': Lock,
    'PLATFORM_USER_REVOKE_SESSIONS': Settings,
    'PLATFORM_USER_FORCE_RESET_PASSWORD': Key,
};

const SEVERITY_COLORS: Record<string, string> = {
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
    danger: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    success: 'text-green-500 bg-green-100 dark:bg-green-900/30',
};

function ActiviteTab({ userId }: { userId: string }) {
    const { t } = useTranslation('admin');
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = usePlatformUserAudit(userId, page);

    if (isLoading && !data) {
        return <PageSkeleton />;
    }

    const items = data?.items || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    if (error || total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {t('platformUsers.aucuneActivite', 'Aucune activité enregistrée')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('platformUsers.aucuneActiviteDesc', 'Les actions sur cet utilisateur apparaîtront ici.')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('platformUsers.historiqueAudit', 'Historique d\'audit')}
                </h3>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {total} {total > 1 ? 'entrées' : 'entrée'}
                </span>
            </div>

            {/* Liste des logs */}
            <div className="space-y-2">
                {items.map((log: AuditLogEntry) => {
                    const Icon = ACTION_ICONS[log.action] || Clock;
                    const sevClass = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;
                    const date = new Date(log.createdAt);

                    return (
                        <div
                            key={log.id}
                            className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${sevClass}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {log.description || log.action}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                                        <Shield className="h-3 w-3" />
                                        {log.module || '—'}
                                    </span>
                                    {log.estEchec && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                                            <AlertCircle className="h-3 w-3" />
                                            Échec
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {date.toLocaleDateString()} à {date.toLocaleTimeString()}
                                    </span>
                                </div>
                                {(log.anciennesValeurs || log.nouvellesValeurs) && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                            Voir détails
                                        </summary>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            {log.anciennesValeurs && (
                                                <div className="rounded bg-red-50 dark:bg-red-900/20 p-2">
                                                    <span className="font-medium text-red-700 dark:text-red-400">Avant</span>
                                                    <pre className="mt-1 whitespace-pre-wrap text-red-600 dark:text-red-300">
                                                        {JSON.stringify(log.anciennesValeurs, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {log.nouvellesValeurs && (
                                                <div className="rounded bg-green-50 dark:bg-green-900/20 p-2">
                                                    <span className="font-medium text-green-700 dark:text-green-400">Après</span>
                                                    <pre className="mt-1 whitespace-pre-wrap text-green-600 dark:text-green-300">
                                                        {JSON.stringify(log.nouvellesValeurs, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Page {page} sur {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================
// Tab Sécurité
// =============================================

function SecuriteTab({
    estActif, estArchive, mfaActif,
    onToggleStatut, onResetMfa, onRevoquerSessions, onForceResetPassword,
    onArchiver, onDesarchiver,
    isLoading,
}: {
    estActif: boolean;
    estArchive: boolean;
    mfaActif: boolean;
    onToggleStatut: () => void;
    onResetMfa: () => void;
    onRevoquerSessions: () => void;
    onForceResetPassword: () => void;
    onArchiver: () => void;
    onDesarchiver: () => void;
    isLoading: Record<string, boolean>;
}) {
    const { t } = useTranslation('admin');

    const actions = [
        {
            key: 'toggleStatut',
            icon: estActif ? Ban : RotateCcw,
            label: estActif ? t('platformUsers.suspendre', 'Suspendre le compte') : t('platformUsers.reactiver', 'Réactiver le compte'),
            description: estActif
                ? t('platformUsers.suspendreDesc', 'L\'utilisateur ne pourra plus se connecter')
                : t('platformUsers.reactiverDesc', 'Autoriser à nouveau la connexion'),
            variant: estActif ? 'danger' as const : 'success' as const,
            onClick: onToggleStatut,
            loading: isLoading.toggleStatut,
            hidden: estArchive,
        },
        {
            key: 'archiver',
            icon: Archive,
            label: 'Archiver le compte',
            description: 'Désactiver de manière permanente (réversible). L\'utilisateur ne pourra plus se connecter.',
            variant: 'warning' as const,
            onClick: onArchiver,
            loading: isLoading.archiver,
            hidden: estArchive,
        },
        {
            key: 'desarchiver',
            icon: ArchiveRestore,
            label: 'Désarchiver le compte',
            description: 'Remettre l\'utilisateur en statut Inactif pour pouvoir le réactiver.',
            variant: 'success' as const,
            onClick: onDesarchiver,
            loading: isLoading.desarchiver,
            hidden: !estArchive,
        },
        {
            key: 'resetMfa',
            icon: Key,
            label: t('platformUsers.resetMfa', 'Réinitialiser le MFA'),
            description: mfaActif
                ? t('platformUsers.mfaActifDesc', 'Le MFA est actif — réinitialiser pour reconfiguration')
                : t('platformUsers.mfaInactifDesc', 'Le MFA n\'est pas configuré'),
            variant: 'warning' as const,
            onClick: onResetMfa,
            loading: isLoading.resetMfa,
            disabled: !mfaActif,
        },
        {
            key: 'revoquerSessions',
            icon: Settings,
            label: t('platformUsers.revoquerSessions', 'Révoquer les sessions'),
            description: t('platformUsers.revoquerSessionsDesc', 'Déconnecter de tous les appareils'),
            variant: 'warning' as const,
            onClick: onRevoquerSessions,
            loading: isLoading.revoquerSessions,
        },
        {
            key: 'forceResetPassword',
            icon: Lock,
            label: t('platformUsers.resetPassword', 'Forcer le reset du mot de passe'),
            description: t('platformUsers.resetPasswordDesc', 'Les sessions seront révoquées, un email de réinitialisation sera envoyé'),
            variant: 'warning' as const,
            onClick: onForceResetPassword,
            loading: isLoading.forceResetPassword,
        },
    ];

    const variantClasses: Record<string, string> = {
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
        success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('platformUsers.actionsSecurite', 'Actions de sécurité')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actions.filter(a => !a.hidden).map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.key}
                            onClick={action.onClick}
                            disabled={action.disabled || action.loading}
                            className={`flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left transition-colors ${
                                action.disabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/40'
                                    : variantClasses[action.variant] || variantClasses.warning
                            }`}
                        >
                            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium">{action.label}</p>
                                <p className="text-xs opacity-70 mt-0.5">{action.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================
// Sous-composants
// =============================================

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400 w-28">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
        </div>
    );
}

export default PlatformUserDetailPage;
