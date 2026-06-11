/**
 * ==================================
 * eLISAschool - PageLayout
 * ==================================
 * Layout principal authentifié : Sidebar + Header + Content
 * Responsive : sidebar overlay mobile, collapsible desktop
 */

import { type ReactNode, useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebar.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/cn';

interface PageLayoutProps {
    children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
    const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();

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

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-bordure)] bg-[var(--color-surface)] transition-all duration-300',
                    'lg:relative lg:z-auto',
                    isCollapsed ? 'lg:w-16' : 'lg:w-64',
                    isMobileOpen
                        ? 'w-64 translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
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
