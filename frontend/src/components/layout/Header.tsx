/**
 * ==================================
 * eLISAschool - Header
 * ==================================
 * En-tête principal avec recherche, language/theme switchers, notifications, user menu
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@tanstack/react-router';
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
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/navigation/ThemeSwitcher';
import { EtablissementSwitcher } from '@/components/auth/EtablissementSwitcher';

export function Header() {
    const { t } = useTranslation('common');
    const router = useRouter();
    const { toggleMobile } = useSidebarStore();
    const { utilisateur } = useAuthStore();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        // Utiliser le service de déconnexion sécurisée
        const { handleLogout: secureHandleLogout } = await import('@/lib/secure-logout');
        await secureHandleLogout({ redirect: true });
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-bordure)] bg-[var(--color-surface)] px-4 sm:px-6">
            {/* Gauche : Burger + Search */}
            <div className="flex items-center gap-3">
                {/* Mobile burger */}
                <button
                    onClick={toggleMobile}
                    className="rounded-md p-2 text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] lg:hidden"
                    aria-label="Menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Search */}
                <div className="relative hidden sm:block">
                    <AnimatePresence>
                        {searchOpen ? (
                            <motion.div
                                initial={{ width: 40, opacity: 0 }}
                                animate={{ width: 300, opacity: 1 }}
                                exit={{ width: 40, opacity: 0 }}
                                className="flex items-center"
                            >
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('labels.recherche')}
                                    className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 pl-9 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-secondaire)]/60 focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20"
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-texte-secondaire)]" />
                                <button
                                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="search-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setSearchOpen(true)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                aria-label="Rechercher"
                            >
                                <Search className="h-5 w-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Droite : Actions */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeSwitcher />

                {/* NOUVEAU v3.0 : Sélecteur d'établissement */}
                <EtablissementSwitcher />

                {/* Notifications */}
                <button
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {/* Badge placeholder */}
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-error)]" />
                </button>

                {/* User Menu */}
                {utilisateur && (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                                aria-label="Menu utilisateur"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominante)] text-xs font-bold text-white">
                                    {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
                                </div>
                                <span className="hidden text-sm font-medium text-[var(--color-texte)] md:block">
                                    {utilisateur.prenom}
                                </span>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                align="end"
                                sideOffset={8}
                                className="z-50 min-w-[200px] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-1 shadow-lg"
                            >
                                <DropdownMenu.Label className="px-3 py-2">
                                    <p className="text-sm font-medium text-[var(--color-texte)]">
                                        {utilisateur.prenom} {utilisateur.nom}
                                    </p>
                                    <p className="text-xs text-[var(--color-texte-secondaire)]">
                                        {utilisateur.email}
                                    </p>
                                </DropdownMenu.Label>
                                <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-bordure)]" />
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]"
                                    onSelect={() => router.navigate({ to: '/change-password' })}
                                >
                                    <KeyRound className="h-4 w-4" />
                                    {t('boutons.changerMotDePasse')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]"
                                    onSelect={() => router.navigate({ to: '/configuration' })}
                                >
                                    <Settings className="h-4 w-4" />
                                    Configuration
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-bordure)]" />
                                <DropdownMenu.Item
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-error)] outline-none focus:bg-[var(--color-error)]/10"
                                    onSelect={handleLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('boutons.deconnecter')}
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                )}
            </div>
        </header>
    );
}
