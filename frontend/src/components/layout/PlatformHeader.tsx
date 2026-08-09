/**
 * ==================================
 * eLISAschool - Platform Header
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Header dédié à l'espace plateforme (Control Plane).
 * Remplace la bannière statique par un header complet :
 * - Logo + badge ADMIN
 * - Recherche globale (Cmd+K)
 * - Notifications plateforme
 * - Alertes santé système
 * - Dropdown profil admin (MFA, retour tenant, déconnexion)
 *
 * Plan v7.1 — Panel Admin Enterprise
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, Link } from '@tanstack/react-router';
import {
    Search,
    Bell,
    Shield,
    ArrowLeft,
    LogOut,
    KeyRound,
    Settings,
    X,
    Activity,
    User,
    Wifi,
    WifiOff,
    AlertTriangle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { ElisaLogo } from '@/components/branding';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRealtimeMonitoring } from '@/hooks/use-realtime-monitoring';

// =============================================
// Types
// =============================================

type SanteSysteme = 'ok' | 'warning' | 'critical';

interface PlatformHeaderProps {
    /** Santé du système — vert/orange/rouge */
    santeSysteme?: SanteSysteme;
    /** Nombre de notifications en attente */
    notificationsCount?: number;
}

// =============================================
// Configuration santé système
// =============================================

const SANTE_CONFIG: Record<SanteSysteme, { color: string; bg: string; label: string }> = {
    ok: { color: 'var(--color-success, #22c55e)', bg: 'color-mix(in srgb, var(--color-success, #22c55e) 15%, transparent)', label: 'header.santeOk' },
    warning: { color: 'var(--color-warning, #f59e0b)', bg: 'color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent)', label: 'header.santeWarning' },
    critical: { color: 'var(--color-danger, #dc3545)', bg: 'color-mix(in srgb, var(--color-danger, #dc3545) 15%, transparent)', label: 'header.santeCritical' },
};

// =============================================
// Composant
// =============================================

export function PlatformHeader({ santeSysteme = 'ok' }: Omit<PlatformHeaderProps, 'notificationsCount'>) {
    const { t } = useTranslation(['common', 'admin']);
    const router = useRouter();
    const { utilisateur } = useAuthStore();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // ── Monitoring temps réel (WebSocket) ──
    const { alerts, connected, clearAlerts } = useRealtimeMonitoring();
    const notificationsCount = alerts.length;

    const handleLogout = async () => {
        const { handleLogout: secureHandleLogout } = await import('@/lib/secure-logout');
        await secureHandleLogout({ redirect: true });
    };

    // ── Raccourci Cmd+K pour ouvrir la recherche ──
    const handleSearchShortcut = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setSearchOpen(prev => !prev);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleSearchShortcut);
        return () => document.removeEventListener('keydown', handleSearchShortcut);
    }, [handleSearchShortcut]);

    const santeConfig = SANTE_CONFIG[santeSysteme];

    return (
        <header
            className="flex items-center justify-between border-b border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-md)]"
            style={{ height: 'clamp(3rem, 5vw, 3.5rem)' }}
        >
            {/* ── Gauche : Logo + Badge ADMIN + Search ── */}
            <div className="flex items-center gap-[var(--gap-sm)]">
                {/* Logo elisa°school */}
                <Link to="/platform/dashboard" className="flex items-center gap-[var(--gap-xs)] shrink-0">
                    {!isMobile && (
                        <ElisaLogo variant="horizontal" size="sm" theme="auto" />
                    )}
                    {isMobile && (
                        <div
                            className="flex items-center justify-center rounded-lg font-extrabold text-white"
                            style={{
                                width: 'clamp(1.5rem, 4vw, 2rem)',
                                height: 'clamp(1.5rem, 4vw, 2rem)',
                                background: 'linear-gradient(135deg, var(--color-dominante), #4ade80)',
                                fontSize: 'clamp(0.625rem, 1.5vw, 0.875rem)',
                            }}
                        >
                            e
                        </div>
                    )}
                </Link>

                {/* Badge ADMIN */}
                <span
                    className="rounded font-bold uppercase tracking-wider text-white shrink-0"
                    style={{
                        fontSize: 'clamp(0.5rem, 1vw, 0.5625rem)',
                        padding: 'clamp(0.125rem, 0.3vw, 0.25rem) clamp(0.25rem, 0.5vw, 0.5rem)',
                        backgroundColor: 'var(--color-danger)',
                        letterSpacing: '0.5px',
                    }}
                >
                    ADMIN
                </span>

                {/* Séparateur */}
                <div className="hidden sm:block h-6 w-px bg-[var(--color-bordure)] mx-[var(--gap-xs)]" />

                {/* Barre de recherche */}
                <div className="relative hidden sm:block">
                    <AnimatePresence>
                        {searchOpen ? (
                            <motion.div
                                initial={{ width: 36, opacity: 0 }}
                                animate={{ width: 'min(300px, calc(100vw - 300px))', opacity: 1 }}
                                exit={{ width: 36, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex items-center"
                            >
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('common:header.rechercherPlateforme', 'Rechercher dans la plateforme...')}
                                    className="h-8 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-2.5 pl-8 text-xs text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)]/60 focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]/20"
                                    autoFocus
                                />
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-texte-muted)]" />
                                <button
                                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="search-btn"
                                onClick={() => setSearchOpen(true)}
                                className="flex h-8 items-center gap-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-2.5 text-xs text-[var(--color-texte-muted)] transition-all hover:border-[var(--color-dominante)]/30 hover:text-[var(--color-texte)]"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                aria-label={t('common:header.rechercherPlateforme', 'Rechercher')}
                            >
                                <Search className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{t('common:header.rechercherPlateforme', 'Rechercher...')}</span>
                                <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-[var(--color-bordure)] bg-[var(--color-surface)] px-1 py-0.5 text-[9px] font-medium text-[var(--color-texte-muted)]">
                                    ⌘K
                                </kbd>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Droite : Actions ── */}
            <div className="flex items-center gap-[var(--gap-xs)]">
                {/* Indicateur santé système */}
                <button
                    className="relative flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{
                        width: 'clamp(1.75rem, 3vw, 2.25rem)',
                        height: 'clamp(1.75rem, 3vw, 2.25rem)',
                    }}
                    title={t(`common:${santeConfig.label}`, santeSysteme === 'ok' ? 'Système opérationnel' : santeSysteme === 'warning' ? 'Alertes actives' : 'Incidents critiques')}
                    aria-label={t('common:header.santeSysteme', 'Santé du système')}
                    onClick={() => router.navigate({ to: '/platform/monitoring' })}
                >
                    <Activity
                        className="shrink-0"
                        style={{
                            width: 'var(--icon-xs)',
                            height: 'var(--icon-xs)',
                            color: santeConfig.color,
                        }}
                    />
                    {/* Pastille de statut */}
                    <span
                        className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full border border-[var(--color-surface)]"
                        style={{ backgroundColor: santeConfig.color }}
                    />
                </button>

                {/* Notifications plateforme + dropdown alertes temps réel */}
                <DropdownMenu.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <DropdownMenu.Trigger asChild>
                        <motion.button
                            className="relative flex items-center justify-center rounded-lg text-[var(--color-texte-muted)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                            style={{
                                width: 'clamp(1.75rem, 3vw, 2.25rem)',
                                height: 'clamp(1.75rem, 3vw, 2.25rem)',
                            }}
                            aria-label={t('common:header.notifications')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Bell style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                            {notificationsCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[8px] font-bold text-white">
                                    {notificationsCount > 9 ? '9+' : notificationsCount}
                                </span>
                            )}
                            {/* Indicateur connexion WebSocket */}
                            <span
                                className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-[var(--color-surface)]"
                                style={{ backgroundColor: connected ? 'var(--color-success)' : 'var(--color-texte-muted)' }}
                                title={connected ? t('admin:monitoring.tempsReel.connecte', 'Connecté') : t('admin:monitoring.tempsReel.wsIndisponible', 'Déconnecté')}
                            />
                        </motion.button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={8}
                            className="z-50 w-[calc(100vw-2rem)] max-w-[360px] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-lg"
                        >
                            {/* Header du panel notifications */}
                            <div className="flex items-center justify-between border-b border-[var(--color-bordure)] px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-[var(--color-texte-muted)]" />
                                    <span className="text-sm font-semibold text-[var(--color-texte)]">
                                        {t('admin:monitoring.tempsReel.titre', 'Temps réel')}
                                    </span>
                                    {/* Badge connexion */}
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        connected
                                            ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                            : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'
                                    }`}>
                                        {connected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                                        {connected ? t('admin:monitoring.tempsReel.connecte', 'Connecté') : t('admin:monitoring.tempsReel.polling', 'Polling')}
                                    </span>
                                </div>
                                {alerts.length > 0 && (
                                    <button
                                        className="text-[10px] text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]"
                                        onClick={clearAlerts}
                                    >
                                        {t('admin:platformUsers.fermer', 'Tout effacer')}
                                    </button>
                                )}
                            </div>

                            {/* Liste des alertes */}
                            <div className="max-h-[320px] overflow-y-auto">
                                {alerts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]/30" />
                                        <p className="mt-2 text-sm text-[var(--color-texte-muted)]">
                                            {t('admin:monitoring.tempsReel.aucuneAlerte', 'Aucune alerte temps réel reçue')}
                                        </p>
                                    </div>
                                ) : (
                                    alerts.slice(0, 10).map((alert) => (
                                        <button
                                            key={alert.id}
                                            className="flex w-full items-start gap-3 border-b border-[var(--color-bordure)]/50 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)] last:border-b-0"
                                            onClick={() => {
                                                setNotificationsOpen(false);
                                                if (alert.etablissementId) {
                                                    router.navigate({ to: '/platform/monitoring' });
                                                }
                                            }}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {alert.severity === 'critical' ? (
                                                    <XCircle className="h-4 w-4 text-[var(--color-danger)]" />
                                                ) : alert.severity === 'warning' ? (
                                                    <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-[var(--color-info)]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-[var(--color-texte)]">
                                                    {alert.message}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-[var(--color-texte-muted)]">
                                                    {alert.rule} · {new Date(alert.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-[var(--color-bordure)] px-4 py-2">
                                <button
                                    className="w-full text-center text-xs font-medium text-[var(--color-dominante)] hover:underline"
                                    onClick={() => {
                                        setNotificationsOpen(false);
                                        router.navigate({ to: '/platform/monitoring' });
                                    }}
                                >
                                    {t('admin:monitoring.sousTitre', 'Voir le monitoring complet')}
                                </button>
                            </div>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                {/* Séparateur */}
                <div className="h-6 w-px bg-[var(--color-bordure)] mx-[var(--gap-xxs)]" />

                {/* Dropdown profil admin */}
                {utilisateur && (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="flex items-center gap-[var(--gap-xs)] rounded-lg p-0.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                                aria-label={t('common:header.menuUtilisateur')}
                            >
                                <div
                                    className="flex items-center justify-center rounded-full font-bold text-white"
                                    style={{
                                        width: 'clamp(1.5rem, 2.5vw, 2rem)',
                                        height: 'clamp(1.5rem, 2.5vw, 2rem)',
                                        backgroundColor: 'var(--color-dominante)',
                                        fontSize: 'clamp(0.5rem, 1vw, 0.6875rem)',
                                    }}
                                >
                                    {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                                </div>
                                {!isMobile && (
                                    <div className="hidden sm:block text-left">
                                        <p className="text-xs font-semibold text-[var(--color-texte)] leading-tight">
                                            {utilisateur.prenom} {utilisateur.nom?.[0]}.
                                        </p>
                                        <p className="text-[9px] text-[var(--color-texte-muted)] leading-tight">
                                            {utilisateur.role}
                                        </p>
                                    </div>
                                )}
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={8}
                                className="z-50 w-[calc(100vw-2rem)] min-w-[220px] max-w-[300px] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-1 shadow-lg"
                            >
                                {/* Infos utilisateur */}
                                <DropdownMenu.Label className="px-3 py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
                                            style={{ backgroundColor: 'var(--color-dominante)', fontSize: '0.875rem' }}
                                        >
                                            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[var(--color-texte)] truncate">
                                                {utilisateur.prenom} {utilisateur.nom}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-texte-muted)] truncate">
                                                {utilisateur.email}
                                            </p>
                                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-danger)]">
                                                {utilisateur.role}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenu.Label>

                                <DropdownMenu.Separator className="my-0.5 h-px bg-[var(--color-bordure)]" />

                                {/* Retour espace établissement */}
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]"
                                    onSelect={() => router.navigate({ to: '/dashboard' })}
                                >
                                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('common:header.retourEspaceTenant')}</span>
                                </DropdownMenu.Item>

                                <DropdownMenu.Separator className="my-0.5 h-px bg-[var(--color-bordure)]" />

                                {/* Configuration */}
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]"
                                    onSelect={() => router.navigate({ to: '/platform/configuration' })}
                                >
                                    <Settings className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('common:navigation.configuration')}</span>
                                </DropdownMenu.Item>

                                {/* Changer mot de passe */}
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]"
                                    onSelect={() => router.navigate({ to: '/change-password' })}
                                >
                                    <KeyRound className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('common:boutons.changerMotDePasse')}</span>
                                </DropdownMenu.Item>

                                <DropdownMenu.Separator className="my-0.5 h-px bg-[var(--color-bordure)]" />

                                {/* Déconnexion */}
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--color-danger)] outline-none focus:bg-[var(--color-danger)]/10"
                                    onSelect={handleLogout}
                                >
                                    <LogOut className="h-3.5 w-3.5 shrink-0" />
                                    <span>{t('common:boutons.deconnecter')}</span>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                )}
            </div>
        </header>
    );
}

export default PlatformHeader;
