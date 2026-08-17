/**
 * ==================================
 * eLISAschool - UtilisateursTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Users, UserCheck, UserX, Shield, CheckCircle2,
    XCircle, LogIn, MoreHorizontal,
} from 'lucide-react';
import { SectionCard } from './shared';
import { formatRelativeTime } from './shared';
import type { UtilisateursResumeResult } from '@/features/etablissements/types/etablissement.types';

export function UtilisateursTab({ utilisateurs }: { utilisateurs: UtilisateursResumeResult }) {
    const { t } = useTranslation('admin');

    const ROLE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
        ADMIN: { bg: 'bg-[color-mix(in_srgb,var(--color-danger-500)_10%,transparent)]', text: 'text-[var(--color-danger-600)]', hex: '#ef4444' },
        CHEF_ETABLISSEMENT: { bg: 'bg-[color-mix(in_srgb,var(--color-accent-500)_10%,transparent)]', text: 'text-[var(--color-accent-600)]', hex: '#a855f7' },
        ENSEIGNANT: { bg: 'bg-[color-mix(in_srgb,var(--color-info-500)_10%,transparent)]', text: 'text-[var(--color-info-600)]', hex: '#3b82f6' },
        PERSONNEL: { bg: 'bg-[var(--color-surface-hover)]', text: 'text-[var(--color-text-muted)]', hex: '#6b7280' },
        PARENT: { bg: 'bg-[color-mix(in_srgb,var(--color-success-500)_10%,transparent)]', text: 'text-[var(--color-success-600)]', hex: '#22c55e' },
        ELEVE: { bg: 'bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)]', text: 'text-[var(--color-warning-600)]', hex: '#f59e0b' },
        RESPONSABLE_CANTINE: { bg: 'bg-[color-mix(in_srgb,var(--color-warning-500)_10%,transparent)]', text: 'text-[var(--color-warning-600)]', hex: '#f97316' },
        RESPONSABLE_TRANSPORT: { bg: 'bg-[color-mix(in_srgb,var(--color-info-500)_10%,transparent)]', text: 'text-[var(--color-info-600)]', hex: '#14b8a6' },
    };

    const tauxActifs = utilisateurs.total > 0 ? Math.round((utilisateurs.actifs / utilisateurs.total) * 100) : 0;

    // Export CSV des utilisateurs
    const handleExportUtilisateursCSV = useCallback(() => {
        if (!utilisateurs.derniers?.length) return;
        const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Actif', 'Dernière connexion', 'Créé le'];
        const rows = utilisateurs.derniers.map((u) => [
            u.nom || '',
            u.prenom || '',
            u.email || '',
            u.role || '',
            u.actif ? 'Oui' : 'Non',
            u.derniereConnexion ? new Date(u.derniereConnexion).toLocaleDateString('fr-FR') : 'Jamais',
            new Date(u.creeLe).toLocaleDateString('fr-FR'),
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [utilisateurs]);

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* Bouton export */}
            {utilisateurs.derniers && utilisateurs.derniers.length > 0 && (
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportUtilisateursCSV}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.exporterUtilisateurs', 'Exporter utilisateurs (CSV)')}
                    </motion.button>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            {/* Statistiques globales */}
            <SectionCard title={t('etablissements.detail.utilisateurs.vueEnsemble', 'Vue d\'ensemble')} icon={Users}>
                <div className="grid grid-cols-3 gap-[var(--gap-md)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                            {utilisateurs.total}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.total', 'Total')}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: 'var(--color-success-600)' }}>
                            {utilisateurs.actifs}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.actifs', 'Actifs')}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: tauxActifs >= 70 ? 'var(--color-success-600)' : tauxActifs >= 40 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                            {tauxActifs}%
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.tauxActivite', 'Taux activité')}
                        </p>
                    </motion.div>
                </div>

                {/* Barre de progression actifs/inactifs */}
                <div className="mt-[var(--space-md)]">
                    <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--color-success-600)' }}>
                            {t('etablissements.detail.utilisateurs.actifs', 'Actifs')}: {utilisateurs.actifs}
                        </span>
                        <span style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.inactifs', 'Inactifs')}: {utilisateurs.total - utilisateurs.actifs}
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tauxActifs}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: 'var(--color-success-500)' }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Répartition par rôle */}
            <SectionCard title={t('etablissements.detail.utilisateurs.repartitionRoles', 'Répartition par rôle')} icon={Shield}>
                {utilisateurs.parRole.length > 0 ? (
                    <div className="space-y-[var(--space-md)]">
                        {/* Donut chart SVG */}
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                                    {(() => {
                                        const sorted = [...utilisateurs.parRole].sort((a, b) => b.count - a.count);
                                        const total = sorted.reduce((s, r) => s + r.count, 0) || 1;
                                        let cumPct = 0;
                                        return sorted.map((r) => {
                                            const pct = (r.count / total) * 100;
                                            const colors = ROLE_COLORS[r.code] || { hex: '#9ca3af' };
                                            const circumference = 2 * Math.PI * 52;
                                            const dashLen = (pct / 100) * circumference;
                                            const dashOffset = -(cumPct / 100) * circumference;
                                            cumPct += pct;
                                            return (
                                                <motion.circle
                                                    key={r.code}
                                                    cx="70" cy="70" r="52"
                                                    fill="none" strokeWidth="16"
                                                    stroke={colors.hex}
                                                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                                    strokeDashoffset={dashOffset}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.2, duration: 0.5 }}
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                {/* Centre du donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                        {utilisateurs.total}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.total', 'Total')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Barres horizontales */}
                        {utilisateurs.parRole
                            .sort((a, b) => b.count - a.count)
                            .map((r, index) => {
                                const colors = ROLE_COLORS[r.code] || { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
                                const maxCount = utilisateurs.parRole[0]?.count || 1;
                                const pct = Math.round((r.count / maxCount) * 100);
                                return (
                                    <motion.div
                                        key={r.code}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="flex items-center gap-[var(--gap-sm)]"
                                    >
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium min-w-[80px] justify-center ${colors.bg} ${colors.text}`}>
                                            {r.role}
                                        </span>
                                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.04 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: 'var(--color-dominant-400)', opacity: 0.7 }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold min-w-[2rem] text-right" style={{ color: 'var(--color-texte)' }}>
                                            {r.count}
                                        </span>
                                    </motion.div>
                                );
                            })}
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.utilisateurs.aucunRole', 'Aucun utilisateur enregistré')}
                    </p>
                )}
            </SectionCard>

            {/* Derniers utilisateurs inscrits */}
            <SectionCard title={t('etablissements.detail.utilisateurs.derniersInscrits', 'Derniers inscrits')} icon={UserCircle} fullWidth>
                {utilisateurs.derniers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                    <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.nom', 'Nom')}
                                    </th>
                                    <th className="text-left py-2 px-3 text-xs font-medium hidden sm:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.role', 'Rôle')}
                                    </th>
                                    <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.statut', 'Statut')}
                                    </th>
                                    <th className="text-right py-2 px-3 text-xs font-medium hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.derniereConnexion', 'Dernière connexion')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {utilisateurs.derniers.map((u, index) => {
                                    const roleColors = ROLE_COLORS[u.code || ''] || { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
                                    return (
                                        <motion.tr
                                            key={u.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="transition-colors hover:bg-[var(--color-surface-alt)]"
                                            style={{ borderBottom: '1px solid var(--color-bordure)' }}
                                        >
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                                                        style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                                                        {(u.prenom?.[0] || u.nom?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-xs" style={{ color: 'var(--color-texte)' }}>
                                                            {u.prenom} {u.nom}
                                                        </p>
                                                        <p className="text-[0.65rem] sm:hidden" style={{ color: 'var(--color-texte-muted)' }}>
                                                            {u.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 hidden sm:table-cell">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                {u.actif ? (
                                                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-success-600)' }}>
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{t('etablissements.detail.utilisateurs.actif', 'Actif')}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                        <XCircle className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{t('etablissements.detail.utilisateurs.inactif', 'Inactif')}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right text-xs hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                                {u.derniereConnexion ? formatRelativeTime(u.derniereConnexion) : '—'}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.utilisateurs.aucunUtilisateur', 'Aucun utilisateur enregistré')}
                    </p>
                )}
            </SectionCard>
            </div>
        </div>
    );
}
