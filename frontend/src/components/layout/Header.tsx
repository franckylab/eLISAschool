/**
 * ==================================
 * eLISAschool - Header
 * ==================================
 * En-tête principal avec recherche, language/theme switchers, notifications, user menu
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, Link } from '@tanstack/react-router';
import {
    Menu,
    Search,
    Bell,
    LogOut,
    KeyRound,
    Settings,
    X,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/stores/sidebar.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtablissement } from '@/features/etablissement';
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/navigation/ThemeSwitcher';
import { EtablissementSwitcher } from '@/components/auth/EtablissementSwitcher';
import { ElisaLogo } from '@/components/branding';

export function Header() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { toggleMobile } = useSidebarStore();
    const { utilisateur, etablissementId } = useAuthStore();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Charger le logo de l'établissement
    const { data: etablissement } = useEtablissement(etablissementId || '');
    const logoEtablissement = etablissement?.logoUrl;

    const handleLogout = async () => {
        // Utiliser le service de déconnexion sécurisée
        const { handleLogout: secureHandleLogout } = await import('@/lib/secure-logout');
        await secureHandleLogout({ redirect: true });
    };

    return (
        <header className="flex h-12 items-center justify-between border-b border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 xs:h-14 xs:px-3 sm:h-16 sm:px-4 md:px-6">
            {/* Gauche : Burger + Logo eLISAschool + Search */}
            <div className="flex items-center gap-1 xs:gap-2 sm:gap-3">
                {/* Mobile burger */}
                <button
                    onClick={toggleMobile}
                    className="rounded-md p-1 text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] xs:p-1.5 sm:p-2 lg:hidden"
                    aria-label="Menu"
                >
                    <Menu className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Logo eLISAschool - visible sur desktop */}
                <div className="hidden lg:flex items-center justify-center flex-shrink-0">
                    <Link to="/dashboard" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <ElisaLogo variant="horizontal" size="sm" />
                    </Link>
                </div>

                {/* Search - visible sur toutes les tailles */}
                <div className="relative">
                    <AnimatePresence>
                        {searchOpen ? (
                            <motion.div
                                initial={{ width: 36, opacity: 0 }}
                                animate={{ width: 'min(260px, calc(100vw - 160px))', opacity: 1 }}
                                exit={{ width: 36, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="flex items-center"
                            >
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('labels.recherche')}
                                    className="h-7 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-2 pl-7 text-[10px] text-[var(--color-texte)] placeholder:text-[var(--color-texte-secondaire)]/60 focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]/20 xs:h-8 xs:px-2.5 xs:pl-8 xs:text-xs sm:h-9 sm:px-3 sm:pl-9 sm:text-sm md:h-10"
                                    autoFocus
                                />
                                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--color-texte-secondaire)] xs:left-2.5 xs:h-3.5 xs:w-3.5 sm:left-3 sm:h-4 sm:w-4" />
                                <button
                                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] xs:right-1.5 sm:right-2"
                                >
                                    <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="search-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setSearchOpen(true)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)] xs:h-8 xs:w-8 sm:h-9 sm:w-9"
                                aria-label="Rechercher"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Search className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Droite : Actions */}
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">

                {/* NOUVEAU v3.0 : Sélecteur d'établissement (déplacé avant langue) */}
                <EtablissementSwitcher />

                <LanguageSwitcher />
                <ThemeSwitcher />

                {/* Notifications */}
                <motion.button
                    className="relative flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)] xs:h-8 xs:w-8 sm:h-9 sm:w-9"
                    aria-label="Notifications"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Bell className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    {/* Badge placeholder */}
                    <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-[var(--color-error)] xs:h-1.5 xs:w-1.5 sm:right-1 sm:top-1 sm:h-2 sm:w-2" />
                </motion.button>

                {/* User Menu */}
                {utilisateur && (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="flex items-center gap-1 rounded-lg p-0.5 transition-colors hover:bg-[var(--color-surface-hover)] xs:gap-1.5 xs:p-1 sm:gap-2 sm:p-1.5"
                                aria-label="Menu utilisateur"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-dominante)] text-[9px] font-bold text-white xs:h-7 xs:w-7 xs:text-[10px] sm:h-8 sm:w-8 sm:text-xs">
                                    {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                                </div>
                                <span className="hidden text-[10px] font-medium text-[var(--color-texte)] xs:block xs:text-xs sm:text-sm">
                                    {utilisateur.prenom}
                                </span>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={8}
                                className="z-50 w-[calc(100vw-2rem)] min-w-[180px] max-w-[280px] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-0.5 shadow-lg xs:w-auto xs:min-w-[200px] xs:max-w-[300px] xs:p-1 sm:min-w-[220px]"
                            >
                                <DropdownMenu.Label className="px-2 py-1.5 xs:px-3 xs:py-2">
                                    <p className="text-xs font-medium text-[var(--color-texte)] break-words xs:text-sm">
                                        {utilisateur.prenom} {utilisateur.nom}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-texte-secondaire)] break-all xs:text-xs">
                                        {utilisateur.email}
                                    </p>
                                </DropdownMenu.Label>
                                <DropdownMenu.Separator className="my-0.5 h-px bg-[var(--color-bordure)] xs:my-1" />
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)] xs:gap-2 xs:px-3 xs:py-2 xs:text-sm"
                                    onSelect={() => router.navigate({ to: '/change-password' })}
                                >
                                    <KeyRound className="h-3.5 w-3.5 flex-shrink-0 xs:h-4 xs:w-4" />
                                    <span className="break-words">{t('boutons.changerMotDePasse')}</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)] xs:gap-2 xs:px-3 xs:py-2 xs:text-sm"
                                    onSelect={() => router.navigate({ to: '/configuration' })}
                                >
                                    <Settings className="h-3.5 w-3.5 flex-shrink-0 xs:h-4 xs:w-4" />
                                    <span className="break-words">Configuration</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="my-0.5 h-px bg-[var(--color-bordure)] xs:my-1" />
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-[var(--color-error)] outline-none focus:bg-[var(--color-error)]/10 xs:gap-2 xs:px-3 xs:py-2 xs:text-sm"
                                    onSelect={handleLogout}
                                >
                                    <LogOut className="h-3.5 w-3.5 flex-shrink-0 xs:h-4 xs:w-4" />
                                    <span className="break-words">{t('boutons.deconnecter')}</span>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                )}
            </div>
        </header>
    );
}
