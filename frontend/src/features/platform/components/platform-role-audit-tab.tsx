/**
 * ============================================
 * eLISAschool - Platform Role Audit Tab
 * ============================================
 * Version: 2.0.0 — Audit trail réel (paginé)
 *
 * Historique des modifications d'un rôle plateforme.
 * Données récupérées depuis GET /api/platform/roles/:id/audit
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Clock, FileText, ChevronLeft, ChevronRight,
    Shield, Edit, Trash2, Plus, Key, AlertCircle,
} from 'lucide-react';
import { usePlatformRoleAudit, type RoleAuditLogEntry } from '../hooks/use-platform-roles';
import { PageSkeleton } from '@/components/ui/Skeleton';

interface PlatformRoleAuditTabProps {
    roleId: string;
}

// =============================================
// Mapping icônes par action
// =============================================

const ACTION_ICONS: Record<string, typeof Clock> = {
    'PLATFORM_ROLE_CREATE': Plus,
    'PLATFORM_ROLE_UPDATE': Edit,
    'PLATFORM_ROLE_DELETE': Trash2,
    'PLATFORM_ROLE_PERMISSIONS_UPDATE': Key,
};

const SEVERITY_COLORS: Record<string, string> = {
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
    danger: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    success: 'text-green-500 bg-green-100 dark:bg-green-900/30',
};

export function PlatformRoleAuditTab({ roleId }: PlatformRoleAuditTabProps) {
    const { t } = useTranslation('admin');
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = usePlatformRoleAudit(roleId, page);

    if (isLoading && !data) {
        return <PageSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                <p className="text-sm text-red-600 dark:text-red-400">
                    {t('platformRoles.auditErreur', 'Impossible de charger l\'historique d\'audit')}
                </p>
            </div>
        );
    }

    const items = data?.items || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {t('platformRoles.aucunAudit', 'Aucune activité enregistrée')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('platformRoles.aucunAuditDesc', 'Les modifications de ce rôle apparaîtront ici.')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {t('platformRoles.historiqueAudit', 'Historique d\'audit')}
                    </h3>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {total} {total > 1 ? 'entrées' : 'entrée'}
                    </span>
                </div>
            </div>

            {/* Liste des logs */}
            <div className="space-y-2">
                {items.map((log: RoleAuditLogEntry) => {
                    const Icon = ACTION_ICONS[log.action] || Clock;
                    const sevClass = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;
                    const date = new Date(log.createdAt);

                    return (
                        <div
                            key={log.id}
                            className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {/* Icône action */}
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${sevClass}`}>
                                <Icon className="h-4 w-4" />
                            </div>

                            {/* Contenu */}
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

                                {/* Détails anciennes/nouvelles valeurs */}
                                {(log.anciennesValeurs || log.nouvellesValeurs) && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                            {t('platformRoles.voirDetails', 'Voir détails')}
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
                            {t('platformRoles.precedent', 'Précédent')}
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('platformRoles.suivant', 'Suivant')}
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PlatformRoleAuditTab;
