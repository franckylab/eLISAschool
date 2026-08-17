/**
 * ==================================
 * eLISAschool - Platform Health Dashboard
 * ==================================
 * [Phase 6.2] Vue synthétique de l'état de santé de la plateforme.
 * Utilisable comme widget dans le dashboard ou la page monitoring.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Database,
    Server,
    Globe,
    Clock,
    Loader2,
    Activity,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    message?: string;
}

interface PlatformHealthProps {
    compact?: boolean;
    refreshInterval?: number;
}

// =============================================
// Composant
// =============================================

export function PlatformHealth({ compact = false, refreshInterval = 30_000 }: PlatformHealthProps) {
    const { t } = useTranslation('admin');
    const { data, isLoading } = useQuery({
        queryKey: ['platform-health'],
        queryFn: async () => {
            const res = await apiClient.get<{ status: string; checks: HealthCheck[]; timestamp: string }>('/api/platform/monitoring/health/detail');
            return res.data;
        },
        refetchInterval: refreshInterval,
    });

    const overallStatus = data?.status || 'unknown';

    const statusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="w-5 h-5 text-[var(--color-success-500)]" />;
            case 'degraded': return <AlertTriangle className="w-5 h-5 text-[var(--color-warning-500)]" />;
            case 'unhealthy': return <XCircle className="w-5 h-5 text-[var(--color-danger-500)]" />;
            default: return <Activity className="w-5 h-5 text-[var(--color-texte-muted)]" />;
        }
    };

    const serviceIcon = (service: string) => {
        switch (service) {
            case 'database': return <Database className="w-4 h-4" />;
            case 'api': return <Server className="w-4 h-4" />;
            case 'external': return <Globe className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5">
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-texte-muted)]" />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 space-y-4">
            {/* En-tête avec statut global */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-texte-muted)]" />
                    {t('monitoring.etatPlateforme', 'État de la plateforme')}
                </h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    overallStatus === 'healthy' ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]' :
                    overallStatus === 'degraded' ? 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]' :
                    'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]'
                }`}>
                    {overallStatus}
                </span>
            </div>

            {/* Services */}
            <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                {data?.checks.map((check) => (
                    <div key={check.service} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-bordure)]">
                        <span className="text-[var(--color-texte-muted)]">
                            {serviceIcon(check.service)}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium capitalize truncate">
                                    {check.service}
                                </span>
                                {statusIcon(check.status)}
                            </div>
                            {check.message && (
                                <p className="text-xs text-[var(--color-texte-muted)] truncate">{check.message}</p>
                            )}
                        </div>
                        {check.latency !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-[var(--color-texte-muted)]">
                                <Clock className="w-3 h-3" />
                                {check.latency}ms
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {data?.timestamp && (
                <p className="text-xs text-[var(--color-texte-muted)] text-right">
                    {t('monitoring.derniereVerification', 'Dernière vérification')}{': '}{new Date(data.timestamp).toLocaleString('fr-FR')}
                </p>
            )}
        </div>
    );
}

export default PlatformHealth;
