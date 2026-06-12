/**
 * ==================================
 * eLISAschool - PageLayout
 * ==================================
 * Layout principal authentifié : Sidebar + Header + Content
 * Responsive : sidebar overlay mobile, collapsible desktop
 */

import { type ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/cn';

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { isCollapsed, isMobileOpen, setMobileOpen, toggle } = useSidebarStore();
    const [sidebarHovered, setSidebarHovered] = useState(false);

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
        <div className="flex h-screen overflow-hidden bg-[var(--color-fond)]">
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
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                <aside
                    className={cn(
                        'relative z-auto flex h-full flex-col border-r border-[var(--color-bordure)] bg-[var(--color-surface)] transition-all duration-300 ease-in-out',
                        isCollapsed ? 'w-16' : 'w-64',
                    )}
                >
                    <Sidebar />
                </aside>

                {/* Bouton toggle sur la bordure — apparaît au hover */}
                <AnimatePresence>
                    {sidebarHovered && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={toggle}
                            className={cn(
                                'absolute top-1/2 -translate-y-1/2 z-50',
                                'flex h-6 w-6 items-center justify-center',
                                'rounded-full border border-[var(--color-bordure)]',
                                'bg-[var(--color-surface)] shadow-sm',
                                'text-[var(--color-texte-secondaire)]',
                                'hover:bg-[var(--color-dominante)] hover:text-white hover:border-[var(--color-dominante)]',
                                'hover:shadow-md',
                                'transition-colors duration-150',
                                '-right-3',
                            )}
                            aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
                            title={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
                        >
                            <ChevronLeft
                                className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-300',
                                    isCollapsed && 'rotate-180',
                                )}
                            />
                        </motion.button>
                    )}
                </AnimatePresence>
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
