import { useMemo } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Lock, Unlock, Edit } from 'lucide-react';
import { useRole, useUsersByRole } from '../hooks/use-roles-permissions';
import { usePermissions } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { RolePermissionsTab } from './role-permissions-tab';
import { RoleUsersTab } from './role-users-tab';
import type { Tab } from '@/components/ui';

type Onglet = 'permissions' | 'utilisateurs';

export function RoleDetailPage() {
    const { id } = useParams({ from: '/_auth/admin/roles/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/_auth/admin/roles/$id' });
    const { hasPermission } = usePermissions();
    const { t } = useTranslation('utilisateurs');

    const ongletActif = (search as any)?.tab || 'permissions';
    const setOngletActif = (tab: Onglet) => navigate({
        to: '/admin/roles/$id',
        params: { id },
        search: { tab } as any,
    });

    const { data: role, isLoading, error, refetch } = useRole(id);
    const { data: users } = useUsersByRole(id);

    const onglets: Tab[] = [
        { id: 'permissions', label: t('permissions'), icon: Shield },
        { id: 'utilisateurs', label: t('utilisateurs'), icon: Users },
    ];

    const nbPermissions = useMemo(() => {
        if (!role?.permissions) return 0;
        if (typeof role.permissions[0] === 'string') return role.permissions.length;
        return (role.permissions as any[]).length;
    }, [role]);

    const nbUtilisateurs = users?.length || role?.nbUtilisateurs || 0;

    if (isLoading && !role) {
        return <PageSkeleton showHeader />;
    }

    if (error || !role) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('roleNonTrouve')}
                    message={error?.message || t('chargerDetailsRole')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    const peutModifier = hasPermission('roles:edit') && !role.estSysteme;

    return (
        <BreadcrumbLabelProvider value={role.libelle}>
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                tone="dominant"
                icon={Shield}
                title={role.libelle}
                subtitle={role.description || role.code}
                showBreadcrumbs
                breadcrumbLabel={role.libelle}
                onBack={() => navigate({ to: '/admin/roles' })}
                actions={
                    peutModifier && (
                        <button
                            onClick={() => {
                                navigate({ to: '/admin/roles/$id', params: { id }, search: { tab: 'permissions', edit: 'true' } as any });
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/25 transition-all duration-150 active:scale-[0.97]"
                        >
                            <Edit className="h-4 w-4" />
                            {t('modifierRole')}
                        </button>
                    )
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
                            {role.libelle}
                        </h1>
                        <p className="text-[clamp(0.75rem,2vw,1rem)] text-white/70">{role.code}</p>
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
                                {role.estSysteme ? t('roleSysteme') : t('rolePersonnalise')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Shield className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {t('nbPermissions', { count: nbPermissions })}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Users className="h-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {t('compteurUtilisateurs', { count: nbUtilisateurs })}
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
                    <RolePermissionsTab roleId={role.id} estSysteme={role.estSysteme} />
                )}
                {ongletActif === 'utilisateurs' && (
                    <RoleUsersTab roleId={role.id} />
                )}
            </TabsContent>
        </div>
        </BreadcrumbLabelProvider>
    );
}
