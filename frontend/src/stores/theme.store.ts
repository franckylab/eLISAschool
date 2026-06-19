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

/**
 * Met à jour le favicon dynamique selon la couleur dominante
 */
function mettreAJourFavicon(couleur: string): void {
    try {
        const r = parseInt(couleur.slice(1, 3), 16);
        const g = parseInt(couleur.slice(3, 5), 16);
        const b = parseInt(couleur.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const couleurIcone = luminance > 0.5 ? '#000000' : '#ffffff';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="30" fill="${couleur}"/>
            <g fill="${couleurIcone}" opacity="0.95">
                <path d="M18 20 C18 20, 24 18, 32 20 L32 44 C24 42, 18 44, 18 44 Z"/>
                <path d="M46 20 C46 20, 40 18, 32 20 L32 44 C40 42, 46 44, 46 44 Z"/>
            </g>
            <line x1="32" y1="20" x2="32" y2="44" stroke="${couleur}" stroke-width="1.5" opacity="0.3"/>
        </svg>`;

        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        const link = document.querySelector('link[rel="icon"]:not([sizes])') as HTMLLinkElement | null;
        if (link) {
            link.href = dataUrl;
        }
    } catch {
        // Silencieux — favicon statique en fallback
    }
}

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
                mettreAJourFavicon(couleur);
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
                mettreAJourFavicon(COULEUR_DEFAUT);
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
                        mettreAJourFavicon(dominante);

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
