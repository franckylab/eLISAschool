/**
 * ==================================
 * eLISAschool - Store de langue
 * ==================================
 * Zustand store avec persist pour la gestion i18n
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LanguageState {
    langue: string;
    devise: string;

    // Actions
    setLangue: (langue: string) => void;
    setDevise: (devise: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            langue: import.meta.env.VITE_DEFAULT_LANGUAGE || 'fr',
            devise: import.meta.env.VITE_DEFAULT_CURRENCY || 'XAF',

            setLangue: (langue: string) => {
                set({ langue });
            },

            setDevise: (devise: string) => {
                set({ devise });
            },
        }),
        {
            name: 'elisaschool-language',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
