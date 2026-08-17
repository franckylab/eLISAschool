/**
 * ==================================
 * eLISAschool - Platform Sessions & Activité
 * ==================================
 * Visualisation des sessions actives et de l'activité
 * des utilisateurs sur la plateforme.
 * Refonte v3 — migration 213.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    MonitorSmartphone,
    Loader2,
    RefreshCw,
    Users,
    Clock,
    Globe,
    Shield,
    Search,
} from 'lucide-react';

export const Route = createFileRoute('/platform/sessions')({
    component: PlatformSessionsPage,
});

interface SessionInfo {
    id: string;
    utilisateurId: string;
    nomUtilisateur: string;
    email: string;
    etablissementId?: string;
    nomEtablissement?: string;
    role: string;
    ip: string;
    userAgent: string;
    derniereActivite: string;
    creeeLe: string;
    expireLe: string;
    estActive: boolean;
}

interface SessionsResponse {
    success: boolean;
    data: {
        sessions: SessionInfo[];
        total: number;
        actives: number;
    };
}

function PlatformSessionsPage() {
    const { t } = useTranslation('admin');
    const [search, setSearch] = useState('');
    const [filterEtab, setFilterEtab] = useState('');

    const { data, isLoading, refetch } = useQuery<SessionsResponse>({
        queryKey: ['platform-sessions', search, filterEtab],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (search) params.search = search;
            if (filterEtab) params.etablissementId = filterEtab;
            const res = await apiClient.get<any>('/api/platform/sessions', params);
            return (res as any).data ?? res;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    const sessions = data?.data?.sessions ?? [];
    const total = data?.data?.total ?? 0;
    const actives = data?.data?.actives ?? 0;

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'maintenant';
        if (mins < 60) return `il y a ${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${Math.floor(hours / 24)}j`;
    };

    const parseUA = (ua: string) => {
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Autre';
    };

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>
                        {t('navigation.sessions', 'Sessions & Activité')}
                    </h1>
                    <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                        Sessions actives et historique de connexion des utilisateurs
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md hover:bg-[var(--color-surface-hover)]"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg">
                    <div className="flex items-center gap-2 text-[var(--color-texte-muted)] text-xs mb-1">
                        <Users className="w-3.5 h-3.5" />
                        Total sessions
                    </div>
                    <p className="text-2xl font-bold">{isLoading ? '—' : total}</p>
                </div>
                <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
                        <MonitorSmartphone className="w-3.5 h-3.5" />
                        Sessions actives
                    </div>
                    <p className="text-2xl font-bold text-green-600">{isLoading ? '—' : actives}</p>
                </div>
                <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg">
                    <div className="flex items-center gap-2 text-[var(--color-texte-muted)] text-xs mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        Dernière MAJ
                    </div>
                    <p className="text-sm font-medium">{new Date().toLocaleTimeString('fr-FR')}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-texte-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, email, IP…"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)]"
                    />
                </div>
                <input
                    type="text"
                    value={filterEtab}
                    onChange={(e) => setFilterEtab(e.target.value)}
                    placeholder="Filtrer par établissement ID"
                    className="px-3 py-2 text-sm border border-[var(--color-bordure)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger-500)] w-64"
                />
            </div>

            {/* Sessions table */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-danger-500)]" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12 text-[var(--color-texte-muted)]">
                        <MonitorSmartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucune session trouvée</p>
                        <p className="text-xs mt-1">L'endpoint /api/platform/sessions doit être implémenté côté backend</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--color-bordure)] bg-[var(--color-surface-hover)]">
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Utilisateur</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Établissement</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Rôle</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">IP</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Navigateur</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Dernière activité</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-texte-muted)]">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-bordure)]">
                                {sessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-[var(--color-surface-hover)]">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{session.nomUtilisateur}</div>
                                            <div className="text-xs text-[var(--color-texte-muted)]">{session.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{session.nomEtablissement ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--color-surface-hover)]">
                                                <Shield className="w-3 h-3" />
                                                {session.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{session.ip}</td>
                                        <td className="px-4 py-3 text-xs flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {parseUA(session.userAgent)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--color-texte-muted)]">
                                            {timeAgo(session.derniereActivite)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block w-2 h-2 rounded-full ${session.estActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
