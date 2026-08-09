/**
 * ==================================
 * eLISAschool - Page Sessions & Activité Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Liste des sessions actives, révocation manuelle,
 * historique des connexions (30 derniers jours).
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useTranslation } from 'react-i18next';
import { Monitor, LogOut, Trash2, Shield, Clock, Globe } from 'lucide-react';
import { usePlatformSessions, useRevokeSession, useRevokeAllSessions } from '../hooks/use-platform-sessions';

export function PlatformSessionsPage() {
    const { t } = useTranslation('admin');
    const { data: sessions, isLoading } = usePlatformSessions();
    const revokeSession = useRevokeSession();
    const revokeAll = useRevokeAllSessions();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--color-danger-500)] border-t-transparent rounded-full" />
            </div>
        );
    }

    const activeSessions = sessions || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-texte)]">
                        {t('platformSessions.title', 'Sessions & Activité')}
                    </h1>
                    <p className="text-sm text-[var(--color-texte-muted)]">
                        {t('platformSessions.subtitle', 'Gestion des sessions actives de la plateforme')}
                    </p>
                </div>
                {activeSessions.length > 0 && (
                    <button
                        onClick={() => revokeAll.mutate()}
                        className="px-4 py-2 text-sm rounded-lg bg-[var(--color-danger-100)] text-[var(--color-danger-700)] hover:bg-[var(--color-danger-200)] flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('platformSessions.revokeAll', 'Tout révoquer')}
                    </button>
                )}
            </div>

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                    icon={Monitor}
                    label={t('platformSessions.activeSessions', 'Sessions actives')}
                    value={activeSessions.length}
                />
                <KpiCard
                    icon={Shield}
                    label={t('platformSessions.uniqueUsers', 'Utilisateurs uniques')}
                    value={new Set(activeSessions.map(s => s.utilisateurPlateformeId)).size}
                />
                <KpiCard
                    icon={Clock}
                    label={t('platformSessions.maxPerUser', 'Max par utilisateur')}
                    value={3}
                />
            </div>

            {/* Liste sessions */}
            {activeSessions.length === 0 ? (
                <div className="p-12 text-center text-[var(--color-texte-muted)] rounded-xl border border-[var(--color-bordure)]">
                    <Monitor className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>{t('platformSessions.noSessions', 'Aucune session active')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeSessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] hover:border-[var(--color-danger-300)] transition-colors"
                        >
                            <div className="p-2 rounded-lg bg-[var(--color-surface-hover)]">
                                <Monitor className="w-5 h-5 text-[var(--color-texte-muted)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--color-texte)] truncate">
                                    {session.utilisateurPlateforme
                                        ? `${session.utilisateurPlateforme.prenom} ${session.utilisateurPlateforme.nom}`
                                        : 'Utilisateur inconnu'}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-[var(--color-texte-muted)]">
                                    <span className="flex items-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        {session.ip || 'N/A'}
                                    </span>
                                    <span>
                                        {new Date(session.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {session.userAgent && (
                                    <p className="text-xs text-[var(--color-texte-muted)] truncate mt-1">
                                        {session.userAgent}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-xs text-[var(--color-texte-muted)]">
                                <p>{t('platformSessions.expire', 'Expire')}</p>
                                <p className="font-medium">{new Date(session.expiresAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => revokeSession.mutate(session.id)}
                                className="p-2 rounded-lg hover:bg-[var(--color-danger-100)] text-[var(--color-danger-500)] transition-colors"
                                title={t('platformSessions.revoke', 'Révoquer cette session')}
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================
// Sous-composants
// =============================================

function KpiCard({ icon: Icon, label, value }: { icon: typeof Monitor; label: string; value: number }) {
    return (
        <div className="p-4 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-danger-100)]">
                    <Icon className="w-5 h-5 text-[var(--color-danger-500)]" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-[var(--color-texte)]">{value}</p>
                    <p className="text-xs text-[var(--color-texte-muted)]">{label}</p>
                </div>
            </div>
        </div>
    );
}

export default PlatformSessionsPage;
