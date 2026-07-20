/**
 * ==================================
 * eLISAschool - PageLayout
 * ==================================
 * Layout principal authentifié : Sidebar + Header + Content
 * Responsive : sidebar overlay mobile, collapsible desktop
 */

import { type ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FondRotator } from './FondRotator';
import { NidAlveoleBackground } from './NidAlveoleBackground';
import { cn } from '@/lib/cn';

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { isCollapsed, isMobileOpen, setMobileOpen, toggle } = useSidebarStore();

    console.log('[PageLayout] Rendu du layout principal');

    // Fermer le sidebar mobile lors du resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setMobileOpen]);

    return (
        <div className="relative flex h-screen overflow-hidden">
            {/* Fond alvéole fixe (base) */}
            <NidAlveoleBackground />

            {/* Fond d'écran rotatif catalogue (par-dessus) */}
            <FondRotator />

            {/* Overlay mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar + bouton toggle sur la bordure */}
            <div
                className="relative hidden lg:block"
            >
                <aside
                    className={cn(
                        'relative z-auto flex h-full flex-col border-r border-[var(--color-bordure)] bg-[var(--color-surface)] transition-all duration-300 ease-in-out',
                        isCollapsed ? 'w-16' : 'w-64',
                    )}
                >
                    <Sidebar />
                </aside>

                {/* Bouton toggle sur la bordure — toujours visible et persistant */}
                <motion.button
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={toggle}
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 z-50',
                        'flex h-8 w-8 items-center justify-center',
                        'rounded-full border-2 border-[var(--color-bordure)]',
                        'bg-[var(--color-surface)] shadow-lg',
                        'text-[var(--color-texte-secondaire)]',
                        'hover:bg-[var(--color-dominante)] hover:text-white hover:border-[var(--color-dominante)]',
                        'hover:shadow-xl',
                        'active:scale-95',
                        'transition-all duration-200',
                        '-right-4',
                    )}
                    aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
                    title={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
                >
                    <ChevronLeft
                        className={cn(
                            'h-5 w-5 transition-transform duration-300',
                            isCollapsed && 'rotate-180',
                        )}
                    />
                </motion.button>
            </div>

            {/* Sidebar mobile */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--color-bordure)] bg-[var(--color-surface)] transition-transform duration-300 lg:hidden',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <Sidebar />
            </aside>

            {/* Zone principale */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                {/* Contenu */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
