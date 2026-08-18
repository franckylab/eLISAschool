/**
 * ==================================
 * eLISAschool - Debug Console API
 * ==================================
 * Console API pour tester les endpoints plateforme.
 * Refonte v3 — migration 213.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { Terminal, Send, Loader2, Trash2, Clock } from 'lucide-react';

export const Route = createFileRoute('/platform/debug/api')({
    component: DebugApiPage,
});

interface HistoryEntry {
    id: string;
    method: string;
    url: string;
    status: number;
    duration: number;
    timestamp: Date;
}

const PRESET_ENDPOINTS = [
    { label: 'Plans abonnement', method: 'GET', url: '/api/platform/facturation/plans' },
    { label: 'Promotions', method: 'GET', url: '/api/billing/promotions' },
    { label: 'Packs quota', method: 'GET', url: '/api/platform/packs-quota' },
    { label: 'Cycles facturation', method: 'GET', url: '/api/platform/cycles-facturation' },
    { label: 'Stratégies expiration', method: 'GET', url: '/api/platform/strategies-expiration' },
    { label: 'Modules catalogue', method: 'GET', url: '/api/platform/modules' },
    { label: 'Feature flags', method: 'GET', url: '/api/platform/feature-flags' },
    { label: 'Entitlements resolve', method: 'GET', url: '/api/billing/entitlement/resolve' },
    { label: 'Paramètres cascade', method: 'GET', url: '/api/platform/parametres/cascade' },
    { label: 'Établissements', method: 'GET', url: '/api/platform/etablissements' },
];

function DebugApiPage() {
    const { t } = useTranslation('admin');
    const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
    const [url, setUrl] = useState('');
    const [body, setBody] = useState('');
    const [response, setResponse] = useState<string>('');
    const [status, setStatus] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const sendRequest = useCallback(async () => {
        if (!url.trim()) return;
        setLoading(true);
        setResponse('');
        setStatus(null);
        const start = Date.now();

        try {
            let result: any;
            const config: any = {};
            if (body.trim() && (method === 'POST' || method === 'PUT')) {
                try { config.data = JSON.parse(body); } catch { config.data = body; }
            }

            switch (method) {
                case 'GET': result = await apiClient.get(url); break;
                case 'POST': result = await apiClient.post(url, config.data); break;
                case 'PUT': result = await apiClient.put(url, config.data); break;
                case 'DELETE': result = await apiClient.delete(url); break;
            }
            const duration = Date.now() - start;
            const status = (result as any)?.status ?? 200;
            const data = (result as any)?.data ?? result;
            setResponse(JSON.stringify(data, null, 2));
            setStatus(status);
            setHistory((prev) => [{
                id: crypto.randomUUID(),
                method, url, status, duration, timestamp: new Date(),
            }, ...prev].slice(0, 20));
        } catch (err: any) {
            const duration = Date.now() - start;
            const status = err?.response?.status ?? err?.status ?? 0;
            const data = err?.response?.data ?? err?.data ?? { message: err?.message ?? 'Erreur inconnue' };
            setResponse(JSON.stringify(data, null, 2));
            setStatus(status);
            setHistory((prev) => [{
                id: crypto.randomUUID(),
                method, url, status, duration, timestamp: new Date(),
            }, ...prev].slice(0, 20));
        } finally {
            setLoading(false);
        }
    }, [method, url, body]);

    const getStatusColor = (s: number | null) => {
        if (!s) return 'text-gray-500';
        if (s >= 200 && s < 300) return 'text-green-600';
        if (s >= 300 && s < 400) return 'text-blue-600';
        if (s >= 400 && s < 500) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-[var(--space-md)]">
            {/* Request form */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-5 h-5 text-[var(--color-danger-500)]" />
                    <h2 className="font-semibold" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        Console API
                    </h2>
                </div>

                {/* Method + URL */}
                <div className="flex gap-2">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="px-3 py-2 text-sm font-mono font-bold border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)]"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="/api/platform/..."
                        className="flex-1 px-3 py-2 text-sm font-mono border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                        onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                    />
                    <button
                        onClick={sendRequest}
                        disabled={!url.trim() || loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-danger-600)] rounded-md hover:bg-[var(--color-danger-700)] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Envoyer
                    </button>
                </div>

                {/* Body (POST/PUT) */}
                {(method === 'POST' || method === 'PUT') && (
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-texte-muted)] mb-1">Body (JSON)</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder='{"key": "value"}'
                            rows={4}
                            className="w-full px-3 py-2 text-sm font-mono border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                        />
                    </div>
                )}

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_ENDPOINTS.map((preset) => (
                        <button
                            key={preset.url}
                            onClick={() => { setMethod(preset.method as any); setUrl(preset.url); }}
                            className="px-2 py-1 text-xs border border-[var(--color-bordure)] rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Response */}
            {(response || status !== null) && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                        <span className="text-sm font-medium">Réponse</span>
                        <span className={`text-sm font-mono font-bold ${getStatusColor(status)}`}>
                            {status ?? '—'}
                        </span>
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                        {response}
                    </pre>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                        <span className="text-sm font-medium">Historique</span>
                        <button onClick={() => setHistory([])} className="text-xs text-[var(--color-texte-muted)] hover:text-[var(--color-danger-600)]">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="divide-y divide-[var(--color-bordure)] max-h-48 overflow-auto">
                        {history.map((entry) => (
                            <button
                                key={entry.id}
                                onClick={() => { setMethod(entry.method as any); setUrl(entry.url); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[var(--color-surface-hover)]"
                            >
                                <span className="text-xs font-mono font-bold w-12 text-[var(--color-texte-muted)]">{entry.method}</span>
                                <span className="text-xs font-mono flex-1 truncate">{entry.url}</span>
                                <span className={`text-xs font-mono font-bold ${getStatusColor(entry.status)}`}>{entry.status}</span>
                                <span className="text-xs text-[var(--color-texte-muted)] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{entry.duration}ms
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
