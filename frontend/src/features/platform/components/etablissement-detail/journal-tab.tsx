/**
 * ==================================
 * eLISAschool - JournalTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    FileText, Download, RefreshCw, ChevronLeft, ChevronRight,
    ShieldAlert, ScrollText, AlertTriangle, Info,
} from 'lucide-react';
import { SectionCard } from './shared';
import type { AuditLogResponse, AuditLogEntry } from '@/features/etablissements/types/etablissement.types';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export function JournalTab({ etablissementId }: { etablissementId: string }) {
    const { t } = useTranslation('admin');
    const [filtreSeverity, setFiltreSeverity] = useState<string>('');
    const [filtreModule, setFiltreModule] = useState<string>('');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Query serveur avec pagination et filtres
    const { data: audit, isLoading } = useQuery<AuditLogResponse>({
        queryKey: ['platform-etablissement-detail', 'audit', etablissementId, page, limit, filtreSeverity, filtreModule],
        queryFn: async () => {
            const params: Record<string, string> = { page: String(page), limit: String(limit) };
            if (filtreSeverity) params.severity = filtreSeverity;
            if (filtreModule) params.module = filtreModule;
            const res = await apiClient.get<AuditLogEntry[]>(`/api/platform/etablissements/${etablissementId}/audit`, params);
            if (!res.data) throw new Error('Réponse audit invalide');
            return { data: res.data, meta: res.meta ?? { totalItems: 0, currentPage: 1, totalPages: 1, itemsPerPage: limit } };
        },
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });

    // Modules uniques pour le filtre (chargés une fois depuis les données disponibles)
    const { data: modulesUniques = [] } = useQuery<string[]>({
        queryKey: ['platform-etablissement-detail', 'audit-modules', etablissementId],
        queryFn: async () => {
            const res = await apiClient.get<AuditLogEntry[]>(`/api/platform/etablissements/${etablissementId}/audit`, { page: '1', limit: '100' });
            const mods = new Set(res.data?.map((l) => l.module).filter(Boolean) as string[]);
            return Array.from(mods).sort();
        },
        staleTime: 5 * 60_000,
    });

    const logsPage: AuditLogEntry[] = audit?.data || [];
    const total = audit?.meta?.totalItems ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Reset page quand filtres changent
    const handleFiltreSeverity = useCallback((v: string) => { setFiltreSeverity(v); setPage(1); }, []);
    const handleFiltreModule = useCallback((v: string) => { setFiltreModule(v); setPage(1); }, []);
    const handleResetFiltres = useCallback(() => { setFiltreSeverity(''); setFiltreModule(''); setPage(1); }, []);

    // Stats rapides (depuis le total serveur)
    const countBySeverity = useMemo(() => {
        const counts: Record<string, number> = { info: 0, warning: 0, error: 0, critical: 0 };
        // Utiliser les données de la page courante comme indicateur
        logsPage.forEach((l) => { if (counts[l.severity] !== undefined) counts[l.severity]++; });
        return counts;
    }, [logsPage]);

    const countEchecs = useMemo(() => logsPage.filter((l) => l.estEchec).length, [logsPage]);

    // Export CSV des logs de la page courante
    const handleExportCSV = useCallback(() => {
        if (!logsPage.length) return;
        const headers = ['Date', 'Action', 'Sévérité', 'Module', 'Utilisateur', 'Email', 'Rôle', 'Cible', 'Description', 'Échec', 'IP'];
        const rows = logsPage.map((l) => [
            new Date(l.createdAt).toLocaleString('fr-FR'),
            l.action?.replace(/_/g, ' ') || '',
            l.severity,
            l.module || '',
            l.utilisateur ? `${l.utilisateur.prenom || ''} ${l.utilisateur.nom || ''}`.trim() : '',
            l.utilisateur?.email || '',
            l.utilisateur?.role || '',
            l.cible || '',
            l.description || '',
            l.estEchec ? 'Oui' : 'Non',
            l.ipAddress || '',
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_audit_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logsPage]);

    return (
        <div className="space-y-[var(--space-lg)]">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-[var(--gap-sm)]">
                {[
                    { label: t('etablissements.detail.journal.totalActions', 'Total actions'), value: total, color: 'var(--color-dominant-600)' },
                    { label: t('etablissements.detail.journal.info', 'Info'), value: countBySeverity.info, color: 'var(--color-info-600, #2563eb)' },
                    { label: t('etablissements.detail.journal.avertissements', 'Avertissements'), value: countBySeverity.warning, color: 'var(--color-warning-600, #d97706)' },
                    { label: t('etablissements.detail.journal.erreurs', 'Erreurs'), value: countBySeverity.error + countBySeverity.critical, color: 'var(--color-danger-600, #dc2626)' },
                    { label: t('etablissements.detail.journal.echecs', 'Échecs'), value: countEchecs, color: 'var(--color-danger-500)' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] text-center"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <p className="text-[clamp(1.125rem,2.5vw,1.75rem)] font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[clamp(0.625rem,1.2vw,0.75rem)]" style={{ color: 'var(--color-texte-muted)' }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Distribution sévérité — barre empilée */}
            {logsPage.length > 0 && (() => {
                const totalSev = countBySeverity.info + countBySeverity.warning + countBySeverity.error + countBySeverity.critical;
                if (totalSev === 0) return null;
                const sevs = [
                    { key: 'info', count: countBySeverity.info, color: 'var(--color-info-500)', label: 'Info' },
                    { key: 'warning', count: countBySeverity.warning, color: 'var(--color-warning-500)', label: 'Warning' },
                    { key: 'error', count: countBySeverity.error, color: 'var(--color-danger-500)', label: 'Error' },
                    { key: 'critical', count: countBySeverity.critical, color: 'var(--color-danger-700, #b91c1c)', label: 'Critical' },
                ].filter(s => s.count > 0);
                return (
                    <div className="rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                        <div className="flex items-center justify-between mb-[var(--space-xs)]">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.detail.journal.distributionSeverite', 'Distribution sévérité')}
                            </span>
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                {sevs.map(s => (
                                    <span key={s.key} className="flex items-center gap-1 text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        {s.label} ({s.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                            {sevs.map(s => (
                                <motion.div
                                    key={s.key}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.count / totalSev) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full"
                                    style={{ backgroundColor: s.color }}
                                    title={`${s.label}: ${Math.round((s.count / totalSev) * 100)}%`}
                                />
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                <select
                    value={filtreSeverity}
                    onChange={(e) => handleFiltreSeverity(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.detail.journal.toutesSeverites', 'Toutes sévérités')}</option>
                    <option value="info">{t('etablissements.detail.journal.info', 'Info')}</option>
                    <option value="warning">{t('etablissements.detail.journal.avertissement', 'Avertissement')}</option>
                    <option value="error">{t('etablissements.detail.journal.erreur', 'Erreur')}</option>
                    <option value="critical">{t('etablissements.detail.journal.critique', 'Critique')}</option>
                </select>

                {modulesUniques.length > 0 && (
                    <select
                        value={filtreModule}
                        onChange={(e) => handleFiltreModule(e.target.value)}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                        style={{
                            borderColor: 'var(--color-bordure)',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-texte)',
                            fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        }}
                    >
                        <option value="">{t('etablissements.detail.journal.tousModules', 'Tous modules')}</option>
                        {modulesUniques.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                )}

                {(filtreSeverity || filtreModule) && (
                    <button
                        onClick={handleResetFiltres}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{
                            borderColor: 'var(--color-bordure)',
                            color: 'var(--color-texte-muted)',
                            fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        }}
                    >
                        {t('common.actions.reinitialiserFiltres', 'Réinitialiser')}
                    </button>
                )}

                {/* Bouton export CSV */}
                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                    {total} {t('etablissements.detail.journal.resultats', 'résultats')}
                </span>
                <button
                    onClick={handleExportCSV}
                    disabled={!logsPage.length}
                    className="inline-flex items-center gap-[var(--gap-xxs)] rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm font-medium transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        color: 'var(--color-dominant-700)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('etablissements.detail.journal.exporterCSV', 'Exporter CSV')}</span>
                </button>
            </div>

            {/* Liste des logs */}
            {isLoading ? (
                <div className="space-y-[var(--space-xs)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-[var(--gap-sm)] rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] animate-pulse"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                                <div className="h-2 w-2/3 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : logsPage.length > 0 ? (
                <div className="space-y-[var(--space-xs)]">
                    {logsPage.map((log, index) => {
                        const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                        const SevIcon = sev.icon;
                        const nomUtilisateur = log.utilisateur
                            ? `${log.utilisateur.prenom || ''} ${log.utilisateur.nom || ''}`.trim() || log.utilisateur.email || '—'
                            : '—';

                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index * 0.02, 0.4) }}
                                className="flex items-start gap-[var(--gap-sm)] rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] transition-colors hover:bg-[var(--color-surface-alt)]"
                                style={{
                                    borderColor: log.estEchec ? 'var(--color-danger-300, #fca5a5)' : 'var(--color-bordure)',
                                    backgroundColor: log.estEchec ? 'var(--color-danger-50, #fef2f2)' : 'var(--color-surface)',
                                }}
                            >
                                {/* Icône sévérité */}
                                <div
                                    className="mt-0.5 flex h-[clamp(1.75rem,3vw,2.25rem)] w-[clamp(1.75rem,3vw,2.25rem)] shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${sev.color}15` }}
                                >
                                    <SevIcon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: sev.color }} />
                                </div>

                                {/* Contenu */}
                                <div className="min-w-0 flex-1 space-y-[var(--space-xxs)]">
                                    <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                                        {/* Action */}
                                        <span
                                            className="font-medium truncate"
                                            style={{
                                                color: 'var(--color-texte)',
                                                fontSize: 'clamp(0.8125rem, 0.72rem + 0.3vw, 0.9375rem)',
                                            }}
                                        >
                                            {log.action?.replace(/_/g, ' ')}
                                        </span>
                                        {/* Badge module */}
                                        {log.module && (
                                            <span className="inline-flex rounded-full px-[var(--space-xs)] py-[clamp(0.0625rem,0.05rem+0.05vw,0.125rem)] text-[clamp(0.6rem,1vw,0.7rem)] font-medium"
                                                style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                                                {log.module}
                                            </span>
                                        )}
                                        {/* Badge échec */}
                                        {log.estEchec && (
                                            <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full bg-[color-mix(in_srgb,var(--color-danger-500)_10%,transparent)] px-[var(--space-xs)] py-[clamp(0.0625rem,0.05rem+0.05vw,0.125rem)] text-[clamp(0.6rem,1vw,0.7rem)] font-medium text-[var(--color-danger-600)]">
                                                <XCircle className="h-3 w-3" />
                                                {t('etablissements.detail.journal.echec', 'Échec')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {log.description && (
                                        <p
                                            className="truncate"
                                            style={{
                                                color: 'var(--color-texte-muted)',
                                                fontSize: 'clamp(0.6875rem, 0.62rem + 0.25vw, 0.8125rem)',
                                            }}
                                        >
                                            {log.description}
                                        </p>
                                    )}

                                    {/* Métadonnées */}
                                    <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                                        <span className="inline-flex items-center gap-[var(--gap-xxs)]" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                            <UserCircle className="h-3 w-3" />
                                            {nomUtilisateur}
                                            {log.utilisateur?.role && (
                                                <span className="rounded bg-gray-100 px-1 text-[0.6rem] font-medium text-gray-600">
                                                    {log.utilisateur.role}
                                                </span>
                                            )}
                                        </span>
                                        {log.cible && (
                                            <span className="inline-flex items-center gap-[var(--gap-xxs)]" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                                <ArrowUpRight className="h-3 w-3" />
                                                {log.cible}
                                            </span>
                                        )}
                                        {log.ipAddress && (
                                            <span className="hidden md:inline text-[0.65rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                                {log.ipAddress}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <div className="shrink-0 text-right">
                                    <p style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                        {formatRelativeTime(log.createdAt)}
                                    </p>
                                    <p className="hidden sm:block" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                        {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-[var(--space-xl)]">
                    <ScrollText className="h-10 w-10 mb-3" style={{ color: 'var(--color-texte-muted)', opacity: 0.4 }} />
                    <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.journal.aucunLog', 'Aucune action enregistrée')}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-[var(--gap-xs)] pt-[var(--space-sm)]">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                    >
                        ← {t('common.pagination.precedent', 'Précédent')}
                    </button>
                    <span className="text-sm" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                        {t('common.pagination.pageSur', 'Page {{page}} sur {{total}}', { page, total: totalPages })}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                    >
                        {t('common.pagination.suivant', 'Suivant')} →
                    </button>
                </div>
            )}
        </div>
    );
}
