/**
 * ==================================
 * eLISAschool - Store Sidebar
 * ==================================
 * Zustand store avec persist pour la navigation latérale
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    activeModule: string | null;
    activeSection: string | null;

    // Actions
    toggle: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMobileOpen: (open: boolean) => void;
    toggleMobile: () => void;
    setActiveModule: (module: string | null) => void;
    setActiveSection: (section: string | null) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            isMobileOpen: false,
            activeModule: null,
            activeSection: null,

            toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
            setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
            toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
            setActiveModule: (module: string | null) => set({ activeModule: module }),
            setActiveSection: (section: string | null) => set({ activeSection: section }),
        }),
        {
            name: 'elisaschool-sidebar',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isCollapsed: state.isCollapsed,
                activeModule: state.activeModule,
            }),
        },
    ),
);
