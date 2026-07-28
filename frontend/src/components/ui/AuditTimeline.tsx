/**
 * ==================================
 * eLISAschool - Audit Timeline Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Timeline visuelle des logs d'audit pour une entité donnée.
 * Utilise l'API /api/audit/logs avec filtre cible/cibleId.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { History, FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api-client';
import { formatDistance } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

// ─── Types miroir backend ───

export interface AuditLogEntry {
    id: string;
    utilisateurId?: string;
    utilisateur?: { id: string; nom: string; prenom: string };
    action: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    cible?: string;
    cibleId?: string;
    description?: string;
    anciennesValeurs?: Record<string, unknown>;
    nouvellesValeurs?: Record<string, unknown>;
    module?: string;
    estEchec: boolean;
    createdAt: string;
}

interface AuditTimelineProps {
    cible: string;
    cibleId: string;
    module?: string;
    limit?: number;
    className?: string;
}

function iconeSeverity(severity: string) {
    switch (severity) {
        case 'CRITICAL':
            return <AlertCircle className="h-4 w-4 text-[var(--color-danger)]" />;
        case 'WARNING':
            return <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />;
        default:
            return <Info className="h-4 w-4 text-[var(--color-dominante)]" />;
    }
}

function couleurLigne(severity: string) {
    switch (severity) {
        case 'CRITICAL': return 'bg-[var(--color-danger)]';
        case 'WARNING': return 'bg-[var(--color-warning)]';
        default: return 'bg-[var(--color-dominante)]/40';
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

export function AuditTimeline({
    cible,
    cibleId,
    module,
    limit = 50,
    className,
}: AuditTimelineProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : fr;

    const { data, isLoading } = useQuery({
        queryKey: ['audit-logs', cible, cibleId, module],
        queryFn: async () => {
            const params: Record<string, string> = {
                cible,
                cibleId,
                limit: String(limit),
                offset: '0',
            };
            if (module) params.module = module;

            const res = await apiClient.get<{ items: AuditLogEntry[]; total: number }>(
                '/api/audit/logs',
                params,
            );
            return res.data;
        },
        enabled: !!cible && !!cibleId,
        staleTime: 30_000,
    });

    const logs = data?.items ?? [];

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className={cn('text-center py-8', className)}>
                <History className="mx-auto h-8 w-8 text-[var(--color-texte-secondaire)] mb-2" />
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    {t('audit.aucunLog')}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-0', className)} role="list" aria-label={t('audit.timelineLabel')}>
            {logs.map((log, index) => (
                <div key={log.id} className="relative flex gap-3" role="listitem">
                    {/* Ligne verticale + icône */}
                    <div className="flex flex-col items-center">
                        {iconeSeverity(log.severity)}
                        {index < logs.length - 1 && (
                            <div className={cn('w-0.5 flex-1 min-h-[1.5rem]', couleurLigne(log.severity))} />
                        )}
                    </div>

                    {/* Contenu */}
                    <div className={cn('flex-1 pb-4', index === logs.length - 1 && 'pb-0')}>
                        <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    {/* Action badge */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-3 w-3 shrink-0 text-[var(--color-texte-secondaire)]" />
                                        <span className="text-xs font-medium text-[var(--color-texte)]">
                                            {libelleAction(log.action, t)}
                                        </span>
                                        {log.estEchec && (
                                            <span className="rounded-full bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-danger)]">
                                                {t('audit.echec')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {log.description && (
                                        <p className="text-xs text-[var(--color-texte-secondaire)] truncate">
                                            {log.description}
                                        </p>
                                    )}

                                    {/* Utilisateur + date */}
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-texte-secondaire)]">
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
                    </div>
                </div>
            ))}
        </div>
    );
}
