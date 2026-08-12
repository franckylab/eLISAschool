/**
 * eLISAschool - Platform Role Users Tab
 * ======================================
 * Liste des utilisateurs plateforme ayant ce rôle.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Users, Mail, Search, X, Shield, CheckCircle, XCircle } from 'lucide-react';
import { usePlatformRoleUsers } from '../hooks/use-platform-roles';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface PlatformRoleUsersTabProps {
    roleId: string;
}

export function PlatformRoleUsersTab({ roleId }: PlatformRoleUsersTabProps) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const { data: response, isLoading, error, refetch } = usePlatformRoleUsers(roleId);
    const utilisateurs = response?.utilisateurs || [];
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!utilisateurs) return [];
        if (!search) return utilisateurs;
        const q = search.toLowerCase();
        return utilisateurs.filter(u =>
            `${u.prenom ?? ''} ${u.nom ?? ''} ${u.pseudonyme ?? ''}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [utilisateurs, search]);

    const stats = useMemo(() => {
        if (!utilisateurs) return { total: 0, actifs: 0, inactifs: 0 };
        return {
            total: utilisateurs.length,
            actifs: utilisateurs.filter(u => u.estActif).length,
            inactifs: utilisateurs.filter(u => !u.estActif).length,
        };
    }, [utilisateurs]);

    if (isLoading) return <PageSkeleton />;
    if (error) {
        return (
            <ErrorMessage
                title={t('platformRoles.erreurChargement', 'Erreur')}
                message={error.message || 'Impossible de charger les utilisateurs'}
                onRetry={() => refetch()}
                retryLabel={t('platformRoles.reessayer', 'Réessayer')}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">{t('platformRoles.total', 'Total')}</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">{t('platformRoles.actifs', 'Actifs')}</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.actifs}</p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-300">{t('platformRoles.inactifs', 'Inactifs')}</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactifs}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('platformRoles.rechercherUser', 'Rechercher un utilisateur...')}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Users list */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('platformRoles.aucunUserRole', 'Aucun utilisateur avec ce rôle')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => navigate({ to: '/platform/utilisateurs/$id', params: { id: user.id }, search: { tab: 'informations' } as any })}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all text-left"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30">
                                <Shield className="h-5 w-5 text-[var(--color-dominant-600)] dark:text-[var(--color-dominant-400)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.pseudonyme || user.email.split('@')[0]}
                                </p>
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                </span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.estActif
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                                {user.estActif ? t('platformRoles.actif', 'Actif') : t('platformRoles.inactif', 'Inactif')}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PlatformRoleUsersTab;
