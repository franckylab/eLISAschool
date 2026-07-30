/**
 * ==================================
 * eLISAschool - Audit Timeline Component
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Timeline visuelle des logs d'audit pour une entité donnée.
 * v2 : diff extensible, load-more, groupement par jour, toggle portée,
 * badge source enfants, formatDate, ultra-responsif, icônes contextuelles.
 */

import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
    History, Plus, Pencil, Trash2, AlertTriangle, AlertCircle,
    Info, ChevronDown, ChevronRight, Loader2, Eye, GitBranch, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api-client';
import { resolveAuditNavLink, resolveRelationNavLink } from '@/lib/audit-navigation';
import { usePermissions } from '@/hooks';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

// ─── Types miroir backend ───

export interface AuditLogEntry {
    id: string;
    utilisateurId?: string;
    utilisateur?: { id: string; nom: string | null; prenom: string | null; email?: string };
    action: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    cible?: string;
    cibleId?: string;
    description?: string;
    anciennesValeurs?: Record<string, unknown>;
    nouvellesValeurs?: Record<string, unknown>;
    champsModifies?: string[];
    module?: string;
    parentCible?: string;
    parentCibleId?: string;
    estEchec: boolean;
    ipAddress?: string;
    navigateur?: string;
    systemeExploitation?: string;
    appareil?: string;
    metadata?: {
        entiteLabel?: string;
        entiteRef?: string;
        relations?: Record<string, { id: string; label?: string }>;
    };
    createdAt: string;
}

interface AuditTimelineProps {
    cible: string;
    cibleId: string;
    module?: string;
    limit?: number;
    className?: string;
    showScopeToggle?: boolean;
}

// ─── Helpers ───

const PAGE_SIZE = 20;

function iconeAction(action: string) {
    if (action.includes('CREATE')) return <Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />;
    if (action.includes('DELETE') || action.includes('DESACTIV')) return <Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />;
    if (action.includes('UPDATE') || action.includes('MODIF')) return <Pencil className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />;
    if (action.includes('VALIDATE') || action.includes('VALIDER') || action.includes('PUBLIER')) return <Eye className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />;
    return <Info className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />;
}

function couleurAction(action: string): string {
    if (action.includes('CREATE')) return 'text-[var(--color-success)] bg-[var(--color-success)]/10';
    if (action.includes('DELETE') || action.includes('DESACTIV')) return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10';
    if (action.includes('UPDATE') || action.includes('MODIF')) return 'text-[var(--color-info)] bg-[var(--color-info)]/10';
    return 'text-[var(--color-dominante)] bg-[var(--color-dominante)]/10';
}

function couleurSeverite(severity: string): string {
    switch (severity) {
        case 'CRITICAL': return 'bg-[var(--color-danger)]';
        case 'WARNING': return 'bg-[var(--color-warning)]';
        default: return 'bg-[var(--color-dominante)]/30';
    }
}

function iconeSeverite(severity: string) {
    switch (severity) {
        case 'CRITICAL':
            return <AlertCircle className="h-3 w-3 text-[var(--color-danger)]" />;
        case 'WARNING':
            return <AlertTriangle className="h-3 w-3 text-[var(--color-warning)]" />;
        default:
            return null;
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

function formatDiffValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}

function groupByDay(logs: AuditLogEntry[], locale: Locale): Map<string, AuditLogEntry[]> {
    const groups = new Map<string, AuditLogEntry[]>();
    for (const log of logs) {
        const date = parseISO(log.createdAt);
        let label: string;
        if (isToday(date)) label = 'audit.aujourdhui';
        else if (isYesterday(date)) label = 'audit.hier';
        else label = format(date, 'EEEE d MMMM yyyy', { locale });
        const existing = groups.get(label);
        if (existing) existing.push(log);
        else groups.set(label, [log]);
    }
    return groups;
}

// ─── Diff Viewer ───

function DiffViewer({ log, t }: { log: AuditLogEntry; t: (key: string) => string }) {
    const fields = log.champsModifies ?? Object.keys(log.nouvellesValeurs ?? {});
    if (fields.length === 0 && !log.anciennesValeurs) return null;

    return (
        <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] overflow-hidden">
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="border-b border-[var(--color-bordure)]">
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.champ')}</th>
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.avant')}</th>
                        <th className="px-2 py-1 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.apres')}</th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field) => {
                        const avant = log.anciennesValeurs?.[field];
                        const apres = log.nouvellesValeurs?.[field];
                        if (avant === apres) return null;
                        return (
                            <tr key={field} className="border-b border-[var(--color-bordure)] last:border-0">
                                <td className="px-2 py-1 font-mono text-[var(--color-texte)]">{field}</td>
                                <td className="px-2 py-1 text-[var(--color-danger)] break-all max-w-[120px]">
                                    {formatDiffValue(avant)}
                                </td>
                                <td className="px-2 py-1 text-[var(--color-success)] break-all max-w-[120px]">
                                    {formatDiffValue(apres)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Log Item ───

function LogItem({ log, t, locale, isLast, hasPermission }: { log: AuditLogEntry; t: (key: string) => string; locale: Locale; isLast: boolean; hasPermission: (perm: string) => boolean }) {
    const [expanded, setExpanded] = useState(false);
    const hasDiff = !!(log.anciennesValeurs || log.nouvellesValeurs || log.champsModifies?.length);
    const isChild = !!log.parentCible;
    const date = parseISO(log.createdAt);
    const navLink = resolveAuditNavLink(log);

    const userDisplay = log.utilisateur
        ? (log.utilisateur.nom && log.utilisateur.prenom
            ? `${log.utilisateur.prenom} ${log.utilisateur.nom}`
            : log.utilisateur.email ?? '—')
        : null;

    return (
        <div className="relative flex gap-[var(--gap-sm)]" role="listitem">
            {/* Timeline dot + connector */}
            <div className="flex flex-col items-center pt-1">
                <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    couleurAction(log.action),
                )}>
                    {iconeAction(log.action)}
                </div>
                {!isLast && (
                    <div className={cn('w-0.5 flex-1 min-h-[1rem]', couleurSeverite(log.severity))} />
                )}
            </div>

            {/* Content */}
            <div className={cn('flex-1 min-w-0', !isLast && 'pb-[var(--gap-sm)]')}>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                    style={{ padding: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium text-[var(--color-texte)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)' }}>
                                    {libelleAction(log.action, t)}
                                </span>
                                {log.estEchec && (
                                    <span className="rounded-full bg-[var(--color-danger)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-danger)]">
                                        {t('audit.echec')}
                                    </span>
                                )}
                                {iconeSeverite(log.severity)}
                                {isChild && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-info)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-info)]">
                                        <GitBranch className="h-2.5 w-2.5" />
                                        {log.cible}
                                    </span>
                                )}
                            </div>

                            {/* Entity label with nav link */}
                            {log.metadata?.entiteLabel && (
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {navLink && hasPermission(navLink.permission) ? (
                                        <Link
                                            to={navLink.to as string}
                                            params={navLink.params}
                                            className="inline-flex items-center gap-1 text-[var(--color-dominante)] hover:underline font-medium"
                                        >
                                            {log.metadata.entiteLabel}
                                            {log.metadata.entiteRef && (
                                                <span className="text-[var(--color-texte-secondaire)] font-normal">
                                                    ({log.metadata.entiteRef})
                                                </span>
                                            )}
                                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                        </Link>
                                    ) : (
                                        <span className="text-[var(--color-texte)] font-medium">
                                            {log.metadata.entiteLabel}
                                            {log.metadata.entiteRef && (
                                                <span className="text-[var(--color-texte-secondaire)] font-normal ml-1">
                                                    ({log.metadata.entiteRef})
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Relations badges */}
                            {log.metadata?.relations && Object.keys(log.metadata.relations).length > 0 && (
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                    {Object.entries(log.metadata.relations).map(([key, rel]) => {
                                        const relNav = resolveRelationNavLink(key, rel);
                                        const tKey = `audit.relations.${key}`;
                                        const label = rel.label || (t(tKey) === tKey ? key : t(tKey));
                                        if (relNav && hasPermission(relNav.permission)) {
                                            return (
                                                <Link
                                                    key={key}
                                                    to={relNav.to as string}
                                                    params={relNav.params}
                                                    className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--color-dominante)] hover:underline transition-colors"
                                                >
                                                    {label}
                                                    <ExternalLink className="h-2 w-2 opacity-60" />
                                                </Link>
                                            );
                                        }
                                        return (
                                            <span key={key} className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--color-texte-secondaire)]">
                                                {label}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Description */}
                            {log.description && !log.metadata?.entiteLabel && (
                                <p className="mt-0.5 text-[var(--color-texte-secondaire)] truncate"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {log.description}
                                </p>
                            )}

                            {/* Meta row */}
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5"
                                style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                                {userDisplay && (
                                    <span className="text-[var(--color-texte-secondaire)]">
                                        {userDisplay}
                                    </span>
                                )}
                                <time className="text-[var(--color-texte-secondaire)]"
                                    dateTime={log.createdAt}
                                    title={format(date, 'PPpp', { locale })}>
                                    {format(date, 'HH:mm', { locale })}
                                </time>
                                {log.navigateur && (
                                    <span className="text-[var(--color-texte-secondaire)] opacity-70">
                                        {log.navigateur}
                                    </span>
                                )}
                                {log.systemeExploitation && (
                                    <span className="text-[var(--color-texte-secondaire)] opacity-70">
                                        {log.systemeExploitation}
                                    </span>
                                )}
                                {log.ipAddress && (
                                    <span className="text-[var(--color-texte-secondaire)] opacity-70 font-mono">
                                        {log.ipAddress}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Expand diff button */}
                        {hasDiff && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                aria-expanded={expanded}
                                aria-label={t('audit.voirModifications')}
                            >
                                {expanded
                                    ? <ChevronDown className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                    : <ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            </button>
                        )}
                    </div>

                    {/* Diff panel */}
                    {expanded && hasDiff && <DiffViewer log={log} t={t} />}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───

type Locale = typeof fr;

export function AuditTimeline({
    cible,
    cibleId,
    module,
    limit,
    className,
    showScopeToggle = true,
}: AuditTimelineProps) {
    const { t, i18n } = useTranslation();
    const locale: Locale = i18n.language === 'en' ? enUS : fr;
    const { hasPermission } = usePermissions();
    const [includeChildren, setIncludeChildren] = useState(false);
    const [offset, setOffset] = useState(0);
    const [allLogs, setAllLogs] = useState<AuditLogEntry[]>([]);
    const pageSize = limit ?? PAGE_SIZE;

    const hasAuditAccess = useMemo(() => {
        if (hasPermission('audit:view')) return true;
        if (module && hasPermission(`audit:${module}:view`)) return true;
        return false;
    }, [hasPermission, module]);

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ['audit-logs', cible, cibleId, module, includeChildren, offset],
        queryFn: async () => {
            const params: Record<string, string> = {
                cible,
                cibleId,
                limit: String(pageSize),
                offset: String(offset),
            };
            if (includeChildren) {
                params.scope = 'avec-liees';
            }
            if (module) params.module = module;

            const res = await apiClient.get<{ items: AuditLogEntry[]; total: number }>(
                '/api/audit/logs',
                params,
            );
            return res.data;
        },
        enabled: hasAuditAccess && !!cible && !!cibleId,
        staleTime: 30_000,
    });

    const handleLoadMore = useCallback(() => {
        if (!data) return;
        setAllLogs((prev) => [...prev, ...data.items]);
        setOffset((prev) => prev + pageSize);
    }, [data, pageSize]);

    const handleScopeChange = useCallback((withChildren: boolean) => {
        setIncludeChildren(withChildren);
        setAllLogs([]);
        setOffset(0);
    }, []);

    if (!hasAuditAccess) return null;

    const currentLogs = offset === 0 ? (data?.items ?? []) : [...allLogs, ...(data?.items ?? [])];
    const total = data?.total ?? 0;
    const hasMore = currentLogs.length < total;
    const groups = groupByDay(currentLogs, locale);

    if (isLoading && offset === 0) {
        return (
            <div className={cn('space-y-3', className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-hover)]" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
                <AlertCircle className="h-8 w-8 text-[var(--color-danger)] mb-2" />
                <p className="text-sm font-medium text-[var(--color-danger)]">{t('audit.erreurChargement')}</p>
                {error instanceof Error && (
                    <p className="mt-1 text-xs text-[var(--color-texte-secondaire)]">{error.message}</p>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col', className)}>
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <History className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-texte-secondaire)]" />
                    <span className="font-medium text-[var(--color-texte)]"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                        {t('audit.timelineLabel')}
                    </span>
                    {total > 0 && (
                        <span className="rounded-full bg-[var(--color-dominante)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-dominante)]">
                            {total}
                        </span>
                    )}
                </div>

                {/* Scope toggle */}
                {showScopeToggle && (
                    <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-bordure)] overflow-hidden"
                        style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                        <button
                            className={cn(
                                'px-2 py-1 transition-colors',
                                !includeChildren
                                    ? 'bg-[var(--color-dominante)] text-white'
                                    : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)]',
                            )}
                            onClick={() => handleScopeChange(false)}
                        >
                            {t('audit.porteeDirecte')}
                        </button>
                        <button
                            className={cn(
                                'px-2 py-1 transition-colors',
                                includeChildren
                                    ? 'bg-[var(--color-dominante)] text-white'
                                    : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)]',
                            )}
                            onClick={() => handleScopeChange(true)}
                        >
                            {t('audit.porteeElargie')}
                        </button>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {currentLogs.length === 0 && !isLoading && (
                <div className="text-center py-8">
                    <History className="mx-auto h-8 w-8 text-[var(--color-texte-secondaire)] mb-2" />
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {t('audit.aucunLog')}
                    </p>
                </div>
            )}

            {/* Grouped timeline */}
            {currentLogs.length > 0 && (
                <div role="list" aria-label={t('audit.timelineLabel')}>
                    {Array.from(groups.entries()).map(([dayLabel, dayLogs]) => (
                        <div key={dayLabel} className="mb-3">
                            {/* Day label */}
                            <div className="sticky top-0 z-10 mb-2">
                                <span className="inline-block rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-bordure)] px-2.5 py-0.5 font-medium text-[var(--color-texte-secondaire)]"
                                    style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                                    {dayLabel.startsWith('audit.') ? t(dayLabel) : dayLabel}
                                </span>
                            </div>

                            {/* Logs for this day */}
                            {dayLogs.map((log, idx) => (
                                <LogItem
                                    key={log.id}
                                    log={log}
                                    t={t}
                                    locale={locale}
                                    isLast={idx === dayLogs.length - 1}
                                    hasPermission={hasPermission}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="mt-2 mx-auto flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}
                >
                    {isFetching ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )}
                    {t('audit.chargerPlus')}
                </button>
            )}
        </div>
    );
}
