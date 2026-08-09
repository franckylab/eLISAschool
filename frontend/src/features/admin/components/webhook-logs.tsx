/**
 * ==================================
 * eLISAschool - Webhook Logs
 * ==================================
 * 
 * Liste des derniers webhooks reçus par provider,
 * avec statut, payload, réponse et retry manuel.
 * 
 * Phase P4.2 — Refonte SaaS v4
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    Webhook,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Clock,
    AlertTriangle,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface WebhookLog {
    id: string;
    provider: string;
    event: string;
    statut: 'SUCCESS' | 'FAILED' | 'PENDING';
    payload: Record<string, unknown>;
    response?: Record<string, unknown>;
    httpStatus?: number;
    createdAt: string;
    retries: number;
    error?: string;
}

// =============================================
// Component
// =============================================

export function WebhookLogs() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [filterProvider, setFilterProvider] = useState<string>('');
    const [filterStatut, setFilterStatut] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: webhooks, isLoading } = useQuery<WebhookLog[]>({
        queryKey: ['platform-webhooks', filterProvider, filterStatut],
        queryFn: async () => {
            const res = await apiClient.get<WebhookLog[]>(
                '/api/paiement/webhooks/logs'
            ).catch(() => ({ data: [] as WebhookLog[] }));
            return res.data || [];
        },
    });

    const retryMutation = useMutation({
        mutationFn: (webhookId: string) => apiClient.post(`/api/paiement/webhooks/${webhookId}/retry`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-webhooks'] });
        },
    });

    const filteredWebhooks = webhooks?.filter(w => {
        if (filterProvider && w.provider !== filterProvider) return false;
        if (filterStatut && w.statut !== filterStatut) return false;
        return true;
    });

    const providers = [...new Set(webhooks?.map(w => w.provider) || [])];

    const statutIcon = (statut: string) => {
        switch (statut) {
            case 'SUCCESS': return <CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-success-500)]" />;
            case 'FAILED': return <XCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-danger-500)]" />;
            default: return <Clock className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-warning-500)]" />;
        }
    };

    const statutColor = (statut: string) => {
        switch (statut) {
            case 'SUCCESS': return 'bg-[var(--color-success-100)] text-[var(--color-success-700)]';
            case 'FAILED': return 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]';
            default: return 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]';
        }
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 border rounded-lg bg-[var(--color-surface-hover)] animate-pulse" style={{ opacity: 0.3 }} />)}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    {t('webhooks.titreRecus')}
                </h3>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['platform-webhooks'] })}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)]"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={filterProvider}
                    onChange={(e) => setFilterProvider(e.target.value)}
                    className="px-3 py-1.5 border rounded-lg text-sm bg-[var(--color-surface)]"
                >
                    <option value="">{t('webhooks.tousProviders')}</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    className="px-3 py-1.5 border rounded-lg text-sm bg-[var(--color-surface)]"
                >
                    <option value="">{t('webhooks.tousStatuts')}</option>
                    <option value="SUCCESS">{t('webhooks.succes')}</option>
                    <option value="FAILED">{t('webhooks.echec')}</option>
                    <option value="PENDING">{t('webhooks.en_attente')}</option>
                </select>
            </div>

            {/* Webhook list */}
            {filteredWebhooks && filteredWebhooks.length > 0 ? (
                <div className="space-y-2">
                    {filteredWebhooks.map(webhook => (
                        <div key={webhook.id} className="border rounded-lg overflow-hidden">
                            <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--color-surface-hover)]"
                                onClick={() => setExpandedId(expandedId === webhook.id ? null : webhook.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {statutIcon(webhook.statut)}
                                    <div>
                                        <div className="text-sm font-medium">{webhook.event}</div>
                                        <div className="text-xs text-[var(--color-texte-muted)]">{webhook.provider}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statutColor(webhook.statut)}`}>
                                        {webhook.statut}
                                    </span>
                                    {webhook.httpStatus && (
                                        <span className="text-xs text-[var(--color-texte-muted)] font-mono">{webhook.httpStatus}</span>
                                    )}
                                    <span className="text-xs text-[var(--color-texte-muted)]">
                                        {new Date(webhook.createdAt).toLocaleString('fr-FR')}
                                    </span>
                                    {expandedId === webhook.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>

                            {expandedId === webhook.id && (
                                <div className="border-t p-3 space-y-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 10%, transparent)' }}>
                                    {webhook.error && (
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-danger-600)]">
                                            <AlertTriangle className="w-4 h-4" />
                                            {webhook.error}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('webhooks.detail.payload')}</div>
                                        <pre className="text-xs bg-[var(--color-surface)] p-2 rounded border overflow-x-auto max-h-40">
                                            {JSON.stringify(webhook.payload, null, 2)}
                                        </pre>
                                    </div>
                                    {webhook.response && (
                                        <div>
                                            <div className="text-xs font-medium text-[var(--color-texte-muted)] mb-1">{t('webhooks.detail.reponse')}</div>
                                            <pre className="text-xs bg-[var(--color-surface)] p-2 rounded border overflow-x-auto max-h-40">
                                                {JSON.stringify(webhook.response, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {webhook.statut === 'FAILED' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                retryMutation.mutate(webhook.id);
                                            }}
                                            disabled={retryMutation.isPending}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg hover:opacity-90"
                                                                                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            {t('webhooks.retry')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-[var(--color-texte-muted)] text-sm border border-dashed rounded-lg">
                    {t('webhooks.aucun')}
                </div>
            )}
        </div>
    );
}

export default WebhookLogs;
