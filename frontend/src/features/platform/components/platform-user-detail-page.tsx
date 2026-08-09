/**
 * ==================================
 * eLISAschool - Page Détail Utilisateur Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Détail d'un utilisateur plateforme avec onglets :
 * - Infos : profil, rôle, dates
 * - Sessions : sessions actives, révocation
 * - Audit : historique des actions
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { useParams, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, Shield, ShieldCheck, ShieldOff,
    Clock, Mail, Key, Calendar, Monitor, LogOut,
} from 'lucide-react';
import { usePlatformUserDetail, useSuspendrePlatformUser, useReactiverPlatformUser, useResetMfaPlatformUser } from '../hooks/use-platform-users';
import { usePlatformSessions, useRevokeSession } from '../hooks/use-platform-sessions';
import { useState } from 'react';

type TabKey = 'infos' | 'sessions' | 'audit';

export function PlatformUserDetailPage() {
    const { id } = useParams({ from: '/platform/utilisateurs/$id' });
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<TabKey>('infos');

    const { data: user, isLoading } = usePlatformUserDetail(id);
    const suspendre = useSuspendrePlatformUser();
    const reactiver = useReactiverPlatformUser();
    const resetMfa = useResetMfaPlatformUser();
    const revokeSession = useRevokeSession();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--color-danger-500)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12 text-[var(--color-texte-muted)]">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>{t('platformUsers.detailNotFound', 'Utilisateur introuvable')}</p>
            </div>
        );
    }

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'infos', label: t('platformUsers.tabInfos', 'Informations') },
        { key: 'sessions', label: t('platformUsers.tabSessions', 'Sessions') },
        { key: 'audit', label: t('platformUsers.tabAudit', 'Audit') },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/platform/utilisateurs"
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[var(--color-texte)]">
                        {user.prenom} {user.nom}
                    </h1>
                    <p className="text-sm text-[var(--color-texte-muted)]">{user.email}</p>
                </div>
                <div className="flex gap-2">
                    {user.estActif ? (
                        <button
                            onClick={() => suspendre.mutate(user.id)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-warning-100)] text-[var(--color-warning-700)] hover:bg-[var(--color-warning-200)]"
                        >
                            <ShieldOff className="w-4 h-4 inline mr-1" />
                            {t('platformUsers.suspendre', 'Suspendre')}
                        </button>
                    ) : (
                        <button
                            onClick={() => reactiver.mutate(user.id)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-success-100)] text-[var(--color-success-700)] hover:bg-[var(--color-success-200)]"
                        >
                            <ShieldCheck className="w-4 h-4 inline mr-1" />
                            {t('platformUsers.reactiver', 'Réactiver')}
                        </button>
                    )}
                    <button
                        onClick={() => resetMfa.mutate(user.id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-active)]"
                    >
                        <Key className="w-4 h-4 inline mr-1" />
                        {t('platformUsers.resetMfa', 'Reset MFA')}
                    </button>
                </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 border-b border-[var(--color-bordure)]">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === tab.key
                                ? 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]'
                                : 'text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu onglet */}
            {activeTab === 'infos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                        <h3 className="font-semibold text-[var(--color-texte)]">{t('platformUsers.profil', 'Profil')}</h3>
                        <div className="space-y-3">
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            <InfoRow icon={Shield} label={t('platformUsers.role', 'Rôle')} value={user.rolePlateforme} />
                            <InfoRow icon={Key} label="MFA" value={user.mfaActive ? t('common:oui', 'Oui') : t('common:non', 'Non')} />
                            <InfoRow icon={Calendar} label={t('platformUsers.creeLe', 'Créé le')} value={new Date(user.createdAt).toLocaleDateString()} />
                            {user.dernierAcces && (
                                <InfoRow icon={Clock} label={t('platformUsers.dernierAcces', 'Dernier accès')} value={new Date(user.dernierAcces).toLocaleString()} />
                            )}
                        </div>
                    </div>
                    <div className="space-y-4 p-4 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                        <h3 className="font-semibold text-[var(--color-texte)]">{t('platformUsers.statut', 'Statut')}</h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            user.estActif
                                ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                : 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${user.estActif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-danger-500)]'}`} />
                            {user.estActif ? t('platformUsers.actif', 'Actif') : t('platformUsers.inactif', 'Inactif')}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sessions' && (
                <UserSessionsSection userId={user.id} />
            )}

            {activeTab === 'audit' && (
                <div className="p-8 text-center text-[var(--color-texte-muted)]">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>{t('platformUsers.auditComingSoon', 'Historique d\'audit — Bientôt disponible')}</p>
                </div>
            )}
        </div>
    );
}

// =============================================
// Sous-composants
// =============================================

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-[var(--color-texte-muted)] flex-shrink-0" />
            <span className="text-sm text-[var(--color-texte-muted)] w-28">{label}</span>
            <span className="text-sm font-medium text-[var(--color-texte)]">{value}</span>
        </div>
    );
}

function UserSessionsSection({ userId }: { userId: string }) {
    const { t } = useTranslation('admin');
    const { data: sessions } = usePlatformSessions();
    const revokeSession = useRevokeSession();

    const userSessions = sessions?.filter(
        (s) => s.utilisateurPlateformeId === userId,
    ) || [];

    if (userSessions.length === 0) {
        return (
            <div className="p-8 text-center text-[var(--color-texte-muted)]">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p>{t('platformUsers.noSessions', 'Aucune session active')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {userSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                    <Monitor className="w-5 h-5 text-[var(--color-texte-muted)]" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.userAgent || 'Unknown'}</p>
                        <p className="text-xs text-[var(--color-texte-muted)]">
                            IP: {session.ip || 'N/A'} · {new Date(session.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={() => revokeSession.mutate(session.id)}
                        className="p-1.5 rounded hover:bg-[var(--color-danger-100)] text-[var(--color-danger-500)]"
                        title={t('platformUsers.revokeSession', 'Révoquer')}
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default PlatformUserDetailPage;
