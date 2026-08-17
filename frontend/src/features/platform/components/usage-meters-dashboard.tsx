/**
 * ==================================
 * eLISAschool - Usage Meters Dashboard
 * ==================================
 * 
 * Dashboard de consommation par tenant avec indicateurs quota,
 * graphiques de consommation et alertes visuelles.
 * 
 * Phase P2.4 — Refonte SaaS v4
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    BarChart3,
    Users,
    GraduationCap,
    HardDrive,
    MessageSquare,
    Layers,
    AlertTriangle,
    CheckCircle2,
    Download,
    RefreshCw,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface QuotaData {
    id: string;
    type: string;
    utilise: number;
    maximum: number;
    pourcentage: number;
    etablissementId: string;
}

interface EtablissementOption {
    id: string;
    nom: string;
    code: string;
}

// =============================================
// Helpers
// =============================================

function getQuotaColor(pourcentage: number): string {
    if (pourcentage >= 100) return 'bg-[var(--color-danger-500)]';
    if (pourcentage >= 90) return 'bg-[var(--color-danger-400)]';
    if (pourcentage >= 80) return 'bg-[var(--color-warning-500)]';
    return 'bg-[var(--color-success-500)]';
}

function getQuotaTextColor(pourcentage: number): string {
    if (pourcentage >= 100) return 'text-[var(--color-danger-600)]';
    if (pourcentage >= 90) return 'text-[var(--color-danger-500)]';
    if (pourcentage >= 80) return 'text-[var(--color-warning-600)]';
    return 'text-[var(--color-success-600)]';
}

function getQuotaLabel(type: string): string {
    const labels: Record<string, string> = {
        ELEVES: 'Élèves',
        UTILISATEURS: 'Utilisateurs',
        CLASSES: 'Classes',
        STOCKAGE: 'Stockage (Go)',
        SMS: 'SMS /mois',
    };
    return labels[type] || type;
}

function getQuotaIcon(type: string) {
    switch (type) {
        case 'ELEVES': return GraduationCap;
        case 'UTILISATEURS': return Users;
        case 'CLASSES': return Layers;
        case 'STOCKAGE': return HardDrive;
        case 'SMS': return MessageSquare;
        default: return BarChart3;
    }
}

// =============================================
// Component
// =============================================

export function UsageMetersDashboard() {
    const { t } = useTranslation('admin');
    const [selectedEtablissement, setSelectedEtablissement] = useState<string>('');
    const [searchNom, setSearchNom] = useState('');

    // Fetch etablissements list
    const { data: etablissements } = useQuery<EtablissementOption[]>({
        queryKey: ['platform-etablissements-list'],
        queryFn: async () => {
            const res = await apiClient.get<EtablissementOption[] | { success: boolean; data: EtablissementOption[] }>('/api/platform/etablissements');
            const payload = res.data as any;
            const liste: EtablissementOption[] = Array.isArray(payload) ? payload : payload?.data ?? [];
            return liste.map((e) => ({ id: e.id, nom: e.nom, code: e.code ?? '' }));
        },
    });

    // Fetch quotas for selected etablissement
    const { data: quotas, isLoading, refetch } = useQuery<QuotaData[] | undefined>({
        queryKey: ['platform-quotas', selectedEtablissement],
        queryFn: async () => {
            const res = await apiClient.get<{ success: boolean; data: any[] }>(
                `/api/platform/facturation/quotas/${selectedEtablissement}`
            );
            // Refonte v3 — EtatQuota { ressource, utilisation, limite, pourcentage }
            const liste = res.data?.data ?? [];
            return liste.map((q: any, i: number) => ({
                id: q.id ?? `${q.ressource}-${i}`,
                type: q.ressource,
                utilise: Number(q.utilisation),
                maximum: Number(q.limite),
                pourcentage: Number(q.pourcentage),
                etablissementId: selectedEtablissement,
            }));
        },
        enabled: !!selectedEtablissement,
    });

    const filteredEtablissements = etablissements?.filter(e =>
        e.nom.toLowerCase().includes(searchNom.toLowerCase()) ||
        e.code.toLowerCase().includes(searchNom.toLowerCase())
    );

    const globalAlert = quotas?.some(q => q.pourcentage >= 90);

    const handleExportCSV = () => {
        if (!quotas) return;
        const header = 'Type,Utilisé,Maximum,Pourcentage\n';
        const rows = quotas.map(q => `${getQuotaLabel(q.type)},${q.utilise},${q.maximum},${q.pourcentage}%`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-${selectedEtablissement.slice(0, 8)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        {t('usage.titre')}
                    </h3>
                    <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{t('usage.sousTitre')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedEtablissement && (
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                    )}
                    <button
                        onClick={() => refetch()}
                        disabled={!selectedEtablissement}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Etablissement selector */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchNom}
                        onChange={(e) => setSearchNom(e.target.value)}
                        placeholder={t('usage.alertes.rechercherEtab')}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    />
                </div>
                <select
                    value={selectedEtablissement}
                    onChange={(e) => setSelectedEtablissement(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)] min-w-[200px]"
                >
                    <option value="">{t('usage.alertes.selectionnerEtab')}</option>
                    {filteredEtablissements?.map(e => (
                        <option key={e.id} value={e.id}>{e.nom} {e.code ? `(${e.code})` : ''}</option>
                    ))}
                </select>
            </div>

            {/* Alert banner */}
            {globalAlert && (
                <div className="flex items-center gap-2 p-3 bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border border-[var(--color-warning-200)] rounded-[var(--radius-lg)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{t('usage.alertes.actionRequise')}</span>
                </div>
            )}

            {/* Loading */}
            {!selectedEtablissement && (
                <div className="text-center py-12 text-[var(--color-text-muted)] border border-dashed rounded-[var(--radius-lg)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                    {t('usage.alertes.selectionnez')}
                </div>
            )}

            {selectedEtablissement && isLoading && (
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 border rounded-lg bg-[var(--color-surface-hover)]" style={{ opacity: 0.3 }} />
                    ))}
                </div>
            )}

            {/* Quotas grid */}
            {quotas && quotas.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {quotas.map(quota => {
                        const Icon = getQuotaIcon(quota.type);
                        const color = getQuotaColor(quota.pourcentage);
                        const textColor = getQuotaTextColor(quota.pourcentage);
                        const isOver = quota.pourcentage >= 100;
                        const isWarning = quota.pourcentage >= 80;

                        return (
                            <div key={quota.id} className={`border rounded-[var(--radius-lg)] space-y-3 ${isOver ? 'border-[var(--color-danger-200)] bg-[var(--color-danger-50)]/50' : ''}`} style={{ padding: 'clamp(0.75rem, 0.6rem + 0.5vw, 1.25rem)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-5 h-5 ${textColor}`} />
                                        <span className="font-medium text-sm">{getQuotaLabel(quota.type)}</span>
                                    </div>
                                    {isOver ? (
                                        <span className="flex items-center gap-1 text-[var(--color-danger-600)] bg-[var(--color-danger-100)] px-2 py-0.5 rounded-full" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                            <AlertTriangle className="w-3 h-3" />
                                            {t('usage.alertes.badgeDepasse')}
                                        </span>
                                    ) : isWarning ? (
                                        <span className="flex items-center gap-1 text-[var(--color-warning-600)] bg-[var(--color-warning-100)] px-2 py-0.5 rounded-full" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                            <AlertTriangle className="w-3 h-3" />
                                            {t('usage.alertes.badgeAlerte')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[var(--color-success-600)] bg-[var(--color-success-100)] px-2 py-0.5 rounded-full" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                            <CheckCircle2 className="w-3 h-3" />
                                            {t('usage.alertes.badgeOk')}
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="relative h-3 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.min(quota.pourcentage, 100)}%` }}
                                    />
                                </div>

                                {/* Numbers */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--color-text-muted)]">
                                        {quota.utilise.toLocaleString('fr-FR')} / {quota.maximum.toLocaleString('fr-FR')}
                                    </span>
                                    <span className={`font-semibold ${textColor}`}>
                                        {quota.pourcentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedEtablissement && quotas?.length === 0 && (
                <div className="text-center py-8 text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                    {t('usage.alertes.aucuneDonneeQuota')}
                </div>
            )}
        </div>
    );
}

export default UsageMetersDashboard;
