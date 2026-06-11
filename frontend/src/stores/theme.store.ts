/**
 * ==================================
 * eLISAschool - Store de thème
 * ==================================
 * Zustand store avec persist pour le thème dynamique 60-30-10
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import {
    appliquerThemeCSS,
    genererSecondaire,
    genererAccent,
    COULEURS_DOMINANTES,
} from '@/lib/theme-utils';

export type ModeTheme = 'light' | 'dark' | 'auto';

interface ThemeState {
    couleurDominante: string;
    couleurSecondaire: string;
    couleurAccent: string;
    mode: ModeTheme;

    // Actions
    setCouleurDominante: (couleur: string) => void;
    setMode: (mode: ModeTheme) => void;
    reinitialiserTheme: () => void;
    chargerDepuisConfig: () => Promise<void>;
    appliquerTheme: () => void;
}

const COULEUR_DEFAUT = COULEURS_DOMINANTES[0].valeur; // vert #28a745

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            couleurDominante: COULEUR_DEFAUT,
            couleurSecondaire: genererSecondaire(COULEUR_DEFAUT),
            couleurAccent: genererAccent(COULEUR_DEFAUT),
            mode: 'light' as ModeTheme,

            setCouleurDominante: (couleur: string) => {
                const secondaire = genererSecondaire(couleur);
                const accent = genererAccent(couleur);
                set({
                    couleurDominante: couleur,
                    couleurSecondaire: secondaire,
                    couleurAccent: accent,
                });
                appliquerThemeCSS(couleur, secondaire, accent);
            },

            setMode: (mode: ModeTheme) => {
                set({ mode });
                if (mode === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', mode);
                }
            },

            reinitialiserTheme: () => {
                const secondaire = genererSecondaire(COULEUR_DEFAUT);
                const accent = genererAccent(COULEUR_DEFAUT);
                set({
                    couleurDominante: COULEUR_DEFAUT,
                    couleurSecondaire: secondaire,
                    couleurAccent: accent,
                    mode: 'light',
                });
                appliquerThemeCSS(COULEUR_DEFAUT, secondaire, accent);
                document.documentElement.setAttribute('data-theme', 'light');
            },

            chargerDepuisConfig: async () => {
                try {
                    const response = await apiClient.get<{
                        theme?: {
                            couleurDominante?: string;
                            couleurSecondaire?: string;
                            couleurAccent?: string;
                            mode?: ModeTheme;
                        };
                    }>('/api/configuration');

                    if (response.success && response.data?.theme) {
                        const theme = response.data.theme;
                        const dominante = theme.couleurDominante || COULEUR_DEFAUT;
                        const secondaire = theme.couleurSecondaire || genererSecondaire(dominante);
                        const accent = theme.couleurAccent || genererAccent(dominante);
                        const mode = theme.mode || 'light';

                        set({
                            couleurDominante: dominante,
                            couleurSecondaire: secondaire,
                            couleurAccent: accent,
                            mode,
                        });
                        appliquerThemeCSS(dominante, secondaire, accent);

                        if (mode === 'auto') {
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                        } else {
                            document.documentElement.setAttribute('data-theme', mode);
                        }
                    }
                } catch {
                    // Utiliser le thème persisté en cas d'erreur
                    get().appliquerTheme();
                }
            },

            appliquerTheme: () => {
                const { couleurDominante, couleurSecondaire, couleurAccent, mode } = get();
                appliquerThemeCSS(couleurDominante, couleurSecondaire, couleurAccent);

                if (mode === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', mode);
                }
            },
        }),
        {
            name: 'elisaschool-theme',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                couleurDominante: state.couleurDominante,
                couleurSecondaire: state.couleurSecondaire,
                couleurAccent: state.couleurAccent,
                mode: state.mode,
            }),
        },
    ),
);
