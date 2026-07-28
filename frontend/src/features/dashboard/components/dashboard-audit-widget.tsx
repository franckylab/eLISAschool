/**
 * ==================================
 * eLISAschool - Dashboard Audit Widget
 * ==================================
 * Widget d'activité récente globale pour le tableau de bord.
 * Affiche les 10 derniers logs d'audit tous modules confondus.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    History,
    FileText,
    AlertTriangle,
    AlertCircle,
    Info,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api-client';
import { usePermissions } from '@/hooks';
import { formatDistance } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import type { AuditLogEntry } from '@/components/ui/AuditTimeline';

function iconeSeverity(severity: string) {
    switch (severity) {
        case 'CRITICAL':
            return <AlertCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-destructive" />;
        case 'WARNING':
            return <AlertTriangle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-warning)]" />;
        default:
            return <Info className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-primary" />;
    }
}

function couleurLigne(severity: string) {
    switch (severity) {
        case 'CRITICAL': return 'bg-destructive/40';
        case 'WARNING': return 'bg-[var(--color-warning)]/40';
        default: return 'bg-primary/30';
    }
}

function libelleAction(action: string, t: (key: string) => string) {
    const key = `audit.actions.${action}`;
    const translated = t(key);
    if (translated === key) {
        return action.replace(/_/g, ' ').toLowerCase();
    }
    return translated;
}

function moduleLabel(module: string | undefined, t: (key: string) => string) {
    if (!module) return '';
    const key = `modules.${module}`;
    const translated = t(key);
    if (translated === key) {
        return module;
    }
    return translated;
}

export function DashboardAuditWidget() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : fr;
    const { hasPermission } = usePermissions();

    const hasAccess = hasPermission('audit:view');

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-audit-recent'],
        queryFn: async () => {
            const res = await apiClient.get<{ items: AuditLogEntry[]; total: number }>(
                '/api/audit/logs',
                { limit: '10', offset: '0' },
            );
            return res.data;
        },
        enabled: hasAccess,
        staleTime: 60_000,
    });

    if (!hasAccess) return null;

    const logs = data?.items ?? [];

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-[clamp(0.75rem,1.2vw,1.25rem)] py-[clamp(0.625rem,1vw,0.875rem)] border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]/50">
                <Shield className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary" />
                <h3
                    className="font-semibold text-foreground"
                    style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                >
                    {t('dashboard:audit.titre')}
                </h3>
                {data?.total != null && data.total > 10 && (
                    <span
                        className="ml-auto text-[var(--color-texte-secondaire)]"
                        style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}
                    >
                        {t('dashboard:audit.totalLogs', { count: data.total })}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-[clamp(0.75rem,1.2vw,1.25rem)]">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8">
                        <History className="mx-auto h-8 w-8 text-[var(--color-texte-secondaire)] mb-2" />
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {t('dashboard:aucuneActivite')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0" role="list" aria-label={t('dashboard:audit.titre')}>
                        {logs.map((log, index) => (
                            <div key={log.id} className="relative flex gap-3" role="listitem">
                                {/* Timeline line + icon */}
                                <div className="flex flex-col items-center pt-0.5">
                                    {iconeSeverity(log.severity)}
                                    {index < logs.length - 1 && (
                                        <div className={cn('w-0.5 flex-1 min-h-[1.5rem]', couleurLigne(log.severity))} />
                                    )}
                                </div>

                                {/* Entry content */}
                                <div className={cn('flex-1 pb-3', index === logs.length - 1 && 'pb-0')}>
                                    <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-card)] p-[clamp(0.375rem,0.6vw,0.625rem)]">
                                        {/* Action + module badge */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <FileText className="h-3 w-3 shrink-0 text-[var(--color-texte-secondaire)]" />
                                            <span
                                                className="font-medium text-foreground"
                                                style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.2vw, 0.8125rem)' }}
                                            >
                                                {libelleAction(log.action, t)}
                                            </span>
                                            {log.module && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                                    {moduleLabel(log.module, t)}
                                                </span>
                                            )}
                                            {log.cible && (
                                                <span className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-texte-secondaire)]">
                                                    {log.cible}
                                                </span>
                                            )}
                                            {log.estEchec && (
                                                <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                                                    {t('audit.echec')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {log.description && (
                                            <p
                                                className="mt-1 text-[var(--color-texte-secondaire)] truncate"
                                                style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.15vw, 0.75rem)' }}
                                            >
                                                {log.description}
                                            </p>
                                        )}

                                        {/* User + timestamp */}
                                        <div
                                            className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[var(--color-texte-secondaire)]"
                                            style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.15vw, 0.6875rem)' }}
                                        >
                                            {log.utilisateur && (
                                                <span>{log.utilisateur.nom} {log.utilisateur.prenom}</span>
                                            )}
                                            <span title={new Date(log.createdAt).toLocaleString()}>
                                                {formatDistance(new Date(log.createdAt), new Date(), { addSuffix: true, locale })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
