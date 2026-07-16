import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Users, Mail, Phone, Calendar, Search, X,
    UserCheck, Shield, AlertTriangle,
} from 'lucide-react';
import { useUsersByRole } from '../hooks/use-roles-permissions';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface RoleUsersTabProps {
    roleId: string;
}

export function RoleUsersTab({ roleId }: RoleUsersTabProps) {
    const { t } = useTranslation('utilisateurs');
    const navigate = useNavigate();
    const { data: utilisateurs, isLoading, error, refetch } = useUsersByRole(roleId);
    const [search, setSearch] = useState('');

    const deduped = useMemo(() => {
        if (!utilisateurs) return [];
        const seen = new Set<string>();
        return utilisateurs.filter(u => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
        });
    }, [utilisateurs]);

    const stats = useMemo(() => {
        if (!deduped || deduped.length === 0) return { total: 0, actifs: 0, inactifs: 0, suspendus: 0 };
        return {
            total: deduped.length,
            actifs: deduped.filter(u => u.statut === 'ACTIF').length,
            inactifs: deduped.filter(u => u.statut === 'INACTIF').length,
            suspendus: deduped.filter(u => u.statut === 'SUSPENDU').length,
        };
    }, [deduped]);

    const filtered = useMemo(() => {
        if (!search) return deduped;
        const q = search.toLowerCase();
        return deduped.filter(u =>
            `${u.prenom} ${u.nom}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [deduped, search]);

    if (isLoading && !utilisateurs) {
        return <PageSkeleton />;
    }

    if (error) {
        return (
            <ErrorMessage
                title={t('erreurChargement')}
                message={error.message || t('erreurChargement')}
                onRetry={() => refetch()}
                retryLabel={t('reessayer')}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Users} label={t('total')} value={stats.total} color="blue" />
                <StatCard icon={Shield} label={t('actif')} value={stats.actifs} color="green" />
                <StatCard icon={AlertTriangle} label={t('inactif')} value={stats.inactifs} color="yellow" />
                <StatCard icon={AlertTriangle} label={t('suspendu')} value={stats.suspendus} color="red" />
            </CardGrid>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('rechercherUtilisateur')}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dominant-500 transition-shadow"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Users list */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                        {search ? t('aucunUtilisateurRecherche') : t('aucunUtilisateurRole')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => navigate({ to: '/utilisateurs/$id' as any, params: { id: user.id } } as any)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all text-left"
                        >
                            <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-dominant-100 dark:bg-dominant-900/30 flex items-center justify-center">
                                    <UserCheck className="h-6 w-6 text-dominant-600 dark:text-dominant-400" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {user.prenom} {user.nom}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Mail className="h-3 w-3" />
                                        {user.email}
                                    </span>
                                    {user.telephone && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Phone className="h-3 w-3" />
                                            {user.telephone}
                                        </span>
                                    )}
                                    {(user as any).derniereConnexion && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-3 w-3" />
                                            {new Date((user as any).derniereConnexion).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.statut === 'ACTIF'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : user.statut === 'SUSPENDU'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {user.statut === 'ACTIF' ? t('actif') : user.statut === 'SUSPENDU' ? t('suspendu') : user.statut || t('inactif')}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
