/**
 * ==================================
 * eLISAschool - Platform Role Detail Page
 * ==================================
 * Version: 3.0.0 — Refactorisation plateforme
 *
 * Détail d'un rôle plateforme avec onglets :
 * - Permissions : permissions attribuées
 * - Utilisateurs : users ayant ce rôle
 * - Audit : historique (placeholder)
 *
 * Pattern aligné sur role-detail-page.tsx (tenant).
 * ADR-005 — Auth unifiée
 */

import { useMemo } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Lock, Unlock, Edit, Globe, Building2, Copy } from 'lucide-react';
import { usePlatformRoleDetail, usePlatformRoleUsers, useDupliquerRolePlateforme } from '../hooks/use-platform-roles';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { PlatformRolePermissionsTab } from './platform-role-permissions-tab';
import { PlatformRoleUsersTab } from './platform-role-users-tab';
import { PlatformRoleAuditTab } from './platform-role-audit-tab';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import type { Tab } from '@/components/ui';

type Onglet = 'permissions' | 'utilisateurs' | 'audit';

export function PlatformRoleDetailPage() {
    const { id } = useParams({ from: '/platform/roles/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/platform/roles/$id' });
    const { t } = useTranslation('admin');

    const ongletActif = (search as any)?.tab || 'permissions';
    const setOngletActif = (tab: Onglet) => navigate({
        to: '/platform/roles/$id',
        params: { id },
        search: { tab } as any,
    });

    const { data: role, isLoading, error, refetch } = usePlatformRoleDetail(id);
    const { data: users } = usePlatformRoleUsers(id);
    const dupliquer = useDupliquerRolePlateforme();
    const confirm = useConfirmation();

    const onglets: Tab[] = [
        { id: 'permissions', label: t('platformRoles.permissions', 'Permissions'), icon: Shield },
        { id: 'utilisateurs', label: t('platformRoles.utilisateurs', 'Utilisateurs'), icon: Users },
        { id: 'audit', label: t('platformRoles.audit', 'Audit'), icon: Users },
    ];

    const nbPermissions = useMemo(() => {
        if (!role?.permissions) return 0;
        return role.permissions.length;
    }, [role]);

    const nbUtilisateurs = users?.total || role?.nbUtilisateurs || 0;

    if (isLoading && !role) {
        return <PageSkeleton showHeader />;
    }

    if (error || !role) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('platformRoles.roleIntrouvable', 'Rôle introuvable')}
                    message={error?.message || t('platformRoles.chargerDetail', 'Impossible de charger les détails du rôle')}
                    onRetry={() => refetch()}
                    retryLabel={t('platformRoles.reessayer', 'Réessayer')}
                />
            </div>
        );
    }

    const displayRoleName = role.libelle || role.nom;

    return (
        <BreadcrumbLabelProvider value={displayRoleName}>
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                tone="dominant"
                icon={Shield}
                title={displayRoleName}
                subtitle={role.description || role.code || role.nom}
                showBreadcrumbs
                breadcrumbLabel={displayRoleName}
                onBack={() => navigate({ to: '/platform/roles' })}
                actions={
                    <div className="flex items-center gap-2">
                        {!role.estSysteme && (
                            <>
                                <button
                                    onClick={() => {
                                        confirm.ask({
                                            title: 'Dupliquer ce rôle',
                                            message: `Créer une copie de "${displayRoleName}" ?`,
                                            details: 'Le nouveau rôle aura les mêmes permissions. Vous pourrez ensuite le modifier.',
                                            variant: 'info',
                                            onConfirm: async () => {
                                                await dupliquer.mutateAsync({ id: role.id });
                                            },
                                        });
                                    }}
                                    disabled={dupliquer.isPending}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/25 transition-all duration-150 active:scale-[0.97]"
                                >
                                    <Copy className="h-4 w-4" />
                                    Dupliquer
                                </button>
                                <button
                                    onClick={() => {
                                        navigate({ to: '/platform/roles/$id', params: { id }, search: { tab: 'permissions', edit: 'true' } as any });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/25 transition-all duration-150 active:scale-[0.97]"
                                >
                                    <Edit className="h-4 w-4" />
                                    {t('platformRoles.modifierRole', 'Modifier rôle')}
                                </button>
                            </>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="h-[clamp(3rem,10vw,5rem)] w-[clamp(3rem,10vw,5rem)] rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                        {role.estSysteme ? (
                            <Lock className="h-[clamp(1.25rem,4vw,2.5rem)] w-[clamp(1.25rem,4vw,2.5rem)] text-white" />
                        ) : (
                            <Unlock className="h-[clamp(1.25rem,4vw,2.5rem)] w-[clamp(1.25rem,4vw,2.5rem)] text-white" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-[clamp(1.5rem,4.5vw,2.5rem)] font-bold text-white leading-tight">
                            {displayRoleName}
                        </h1>
                        <p className="text-[clamp(0.75rem,2vw,1rem)] text-white/70">{role.code || role.nom}</p>
                        {role.description && (
                            <p className="text-sm text-white/60 italic">{role.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium ${
                                role.estSysteme
                                    ? 'bg-amber-500/20 text-amber-200'
                                    : 'bg-green-500/20 text-green-200'
                            }`}>
                                {role.estSysteme ? <Lock className="h-[clamp(0.7rem,1.2vw,0.85rem)]" /> : <Unlock className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />}
                                {role.estSysteme ? t('platformRoles.roleSysteme', 'Rôle système') : t('platformRoles.rolePersonnalise', 'Rôle personnalisé')}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium ${
                                role.scope === 'plateforme'
                                    ? 'bg-blue-500/20 text-blue-200'
                                    : 'bg-emerald-500/20 text-emerald-200'
                            }`}>
                                {role.scope === 'plateforme' ? <Globe className="h-[clamp(0.7rem,1.2vw,0.85rem)]" /> : <Building2 className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />}
                                {role.scope === 'plateforme' ? 'Plateforme' : 'Tenant'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Shield className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {t('platformRoles.nbPermissions', { count: nbPermissions, defaultValue: `${nbPermissions} permissions` })}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Users className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {t('platformRoles.compteurUtilisateurs', { count: nbUtilisateurs, defaultValue: `${nbUtilisateurs} utilisateurs` })}
                            </span>
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
                {ongletActif === 'permissions' && (
                    <PlatformRolePermissionsTab roleId={role.id} estSysteme={role.estSysteme} />
                )}
                {ongletActif === 'utilisateurs' && (
                    <PlatformRoleUsersTab roleId={role.id} />
                )}
                {ongletActif === 'audit' && (
                    <PlatformRoleAuditTab roleId={role.id} />
                )}
            </TabsContent>
            {confirm.ConfirmationModal}
        </div>
        </BreadcrumbLabelProvider>
    );
}

export default PlatformRoleDetailPage;
