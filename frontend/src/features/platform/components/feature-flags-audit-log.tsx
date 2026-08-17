/**
 * ==================================
 * eLISAschool - Feature Flags Audit Log
 * ==================================
 * Table paginée de l'historique d'audit des feature flags.
 * 
 * Migration 210 — Refonte Feature Flags (R4)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    History,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface HistoryEntry {
    id: string;
    flagDefinitionId?: string;
    etablissementId?: string;
    action: string;
    ancienneValeur?: string;
    nouvelleValeur?: string;
    modifiePar?: string;
    commentaire?: string;
    createdAt: string;
    flagDefinition?: {
        cle: string;
        label: string;
    };
}

// =============================================
// Constants
// =============================================

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
    TOGGLE_ON: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]',
    TOGGLE_OFF: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
    DELETE: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
    ROLLOUT_CHANGE: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
    SEGMENT_CHANGE: 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]',
    EXPIRE: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
    RESET: 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
};

const ACTIONS = [
    { value: '', label: 'Toutes actions' },
    { value: 'CREATE', label: 'Création' },
    { value: 'TOGGLE_ON', label: 'Activation' },
    { value: 'TOGGLE_OFF', label: 'Désactivation' },
    { value: 'DELETE', label: 'Suppression' },
    { value: 'ROLLOUT_CHANGE', label: 'Changement rollout' },
    { value: 'SEGMENT_CHANGE', label: 'Changement segment' },
    { value: 'EXPIRE', label: 'Expiration' },
    { value: 'RESET', label: 'Reset' },
];

// =============================================
// Component
// =============================================

export function FeatureFlagsAuditLog() {
    const { t } = useTranslation('admin');
    const [page, setPage] = useState(1);
    const [filterAction, setFilterAction] = useState('');
    const [searchFlag, setSearchFlag] = useState('');
    const limit = 25;

    const { data, isLoading } = useQuery<{ data: HistoryEntry[]; total: number } | undefined>({
        queryKey: ['feature-flags-history', page, limit, filterAction],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (filterAction) params.set('action', filterAction);

            const res = await apiClient.get<{ data: HistoryEntry[]; total: number }>(
                `/api/platform/facturation/feature-flags/history?${params.toString()}`
            );
            return res.data;
        },
        staleTime: 15 * 1000,
    });

    const entries = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Filtrage local par nom de flag
    const filteredEntries = searchFlag
        ? entries.filter(e =>
            e.flagDefinition?.cle?.toLowerCase().includes(searchFlag.toLowerCase()) ||
            e.flagDefinition?.label?.toLowerCase().includes(searchFlag.toLowerCase())
        )
        : entries;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-texte-muted)]" />
                    <input
                        type="text"
                        value={searchFlag}
                        onChange={e => setSearchFlag((e.target as HTMLInputElement).value)}
                        placeholder={t('featureFlags.audit.searchFlag', 'Rechercher un flag...')}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    />
                </div>
                <select
                    value={filterAction}
                    onChange={e => { setFilterAction(e.target.value); setPage(1); }}
                    className="px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                >
                    {ACTIONS.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                </select>
                <span className="text-xs text-[var(--color-texte-muted)]">
                    {total} {t('featureFlags.audit.entries', 'entrées')}
                </span>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--color-surface-hover)]">
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.date', 'Date')}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.action', 'Action')}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.flag', 'Flag')}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.etablissement', 'Établissement')}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.commentaire', 'Commentaire')}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t('featureFlags.audit.par', 'Par')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-[var(--color-texte-muted)]">
                                            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            {t('featureFlags.audit.noEntries', 'Aucune entrée dans l\'historique')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry: HistoryEntry) => (
                                        <tr key={entry.id} className="border-t hover:bg-[var(--color-surface-hover)] transition-colors">
                                            <td className="px-3 py-2 text-xs text-[var(--color-texte-muted)] whitespace-nowrap">
                                                {new Date(entry.createdAt).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                                                    {entry.action}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {entry.flagDefinition ? (
                                                    <div>
                                                        <span className="font-medium text-sm">{entry.flagDefinition.label}</span>
                                                        <code className="text-xs ml-1.5 font-mono text-[var(--color-texte-muted)]">
                                                            {entry.flagDefinition.cle}
                                                        </code>
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--color-texte-muted)]">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <code className="text-xs font-mono text-[var(--color-texte-muted)]">
                                                    {entry.etablissementId ? entry.etablissementId.substring(0, 8) + '...' : '—'}
                                                </code>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-[var(--color-texte-muted)] max-w-[200px] truncate">
                                                {entry.commentaire || '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <code className="text-xs font-mono text-[var(--color-texte-muted)]">
                                                    {entry.modifiePar ? entry.modifiePar.substring(0, 8) + '...' : '—'}
                                                </code>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-texte-muted)]">
                                Page {page} / {totalPages} ({total} résultats)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {t('common.previous', 'Précédent')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-colors"
                                >
                                    {t('common.next', 'Suivant')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
