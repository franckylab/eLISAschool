/**
 * ==================================
 * eLISAschool - Palette Créneau EDT
 * ==================================
 * Utilitaire de contraste et palette pour les créneaux du calendrier.
 * Garantit lisibilité et cohérence visuelle quelle que soit la couleur matière,
 * en mode clair comme sombre.
 * Version: 1.1.0 — theme-aware (mode light/dark)
 * Auteur: franck arlos chendjou
 */

import { useSyncExternalStore } from 'react';

// ─── Conversion couleurs ─────────────────────────────────

/**
 * Parse un hex `#rgb` ou `#rrggbb` en [r, g, b] (0-255).
 */
export function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Composante linéaire sRGB (pour le calcul de luminance WCAG).
 */
function canalLineaire(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/**
 * Luminance relative WCAG 2.1 (0 = noir, 1 = blanc).
 */
export function luminanceRelative(hex: string): number {
    const [r, g, b] = hexToRgb(hex);
    return 0.2126 * canalLineaire(r) + 0.7152 * canalLineaire(g) + 0.0722 * canalLineaire(b);
}

/**
 * Ratio de contraste WCAG entre deux couleurs (1:1 à 21:1).
 */
export function ratioContraste(hex1: string, hex2: string): number {
    const l1 = luminanceRelative(hex1);
    const l2 = luminanceRelative(hex2);
    const plusClair = Math.max(l1, l2);
    const plusFonce = Math.min(l1, l2);
    return (plusClair + 0.05) / (plusFonce + 0.05);
}

/**
 * Mélange deux couleurs hex en proportion donnée (0-100).
 * Retourne un `rgb(...)` utilisable en CSS.
 */
export function melangeCouleur(hex1: string, pct1: number, hex2: string): string {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const p = pct1 / 100;
    return `rgb(${Math.round(r1 * p + r2 * (1 - p))}, ${Math.round(g1 * p + g2 * (1 - p))}, ${Math.round(b1 * p + b2 * (1 - p))})`;
}

// ─── Palette Créneau ─────────────────────────────────────

/**
 * Détermine la meilleure couleur de texte (blanc ou sombre) pour un fond donné.
 */
function couleurTexteAuto(fondHex: string): string {
    return ratioContraste(fondHex, '#ffffff') >= 3 ? '#ffffff' : '#1f2937';
}

export interface PaletteCreneau {
    /** Couleur brute de la matière (hex) */
    base: string;
    /** Fond teinté léger (week/day view) — `rgb(...)` */
    fondTeinte: string;
    /** Fond assombri (month view) — `rgb(...)` pour contraste ≥ 4.5:1 avec blanc */
    fondAssombri: string;
    /** Couleur de texte optimale sur fond assombri */
    texteSurFond: string;
    /** Couleur de texte optimale sur fond teinté */
    texteSurTeinte: string;
    /** Bordure colorée (teinte moyenne) — `rgb(...)` */
    bordure: string;
    /** Fond très léger pour badges/pills — `rgb(...)` */
    fondBadge: string;
}

/**
 * Génère une palette complète pour un créneau à partir de sa couleur matière.
 * Theme-aware : adapte les surfaces selon le mode light/dark.
 *
 * @param couleur - Couleur hex de la matière (ex: `#DDA0DD`)
 * @param surface - Couleur de surface du thème (défaut: auto selon mode)
 * @param mode - 'light' | 'dark' (défaut: 'light') — ajuste les surfaces
 *
 * @example
 * ```ts
 * // Light mode
 * const p = paletteCreneau('#DDA0DD');
 * // Dark mode
 * const p = paletteCreneau('#DDA0DD', undefined, 'dark');
 * // Month view:  bg={p.fondAssombri} color={p.texteSurFond}
 * // Week view:   bg={p.fondTeinte}   color={p.texteSurTeinte}
 * // Border:      borderLeft={p.bordure}
 * ```
 */
export function paletteCreneau(
    couleur: string,
    surface?: string,
    mode: 'light' | 'dark' = 'light',
): PaletteCreneau {
    // Surfaces par défaut selon le mode
    const surfaceDefaut = mode === 'dark' ? '#1e293b' : '#ffffff';
    const surfaceUtilisee = surface ?? surfaceDefaut;
    // Surface sombre pour le calcul du fond assombri (garantit contraste avec blanc)
    const surfaceSombre = '#111827';

    // Calcul du fond teinté
    const fondTeinteCalc = melangeCouleur(couleur, 18, surfaceUtilisee);
    // Calcul du fond assombri
    const fondAssombriCalc = melangeCouleur(couleur, 60, surfaceSombre);

    return {
        base: couleur,
        // Tinte légère (18%) — fond de créneau en vue semaine/jour
        fondTeinte: fondTeinteCalc,
        // Fond assombri (60% couleur + 40% noir) — contraste ≥ 4.5:1 avec blanc
        fondAssombri: fondAssombriCalc,
        // Texte auto selon le fond
        texteSurFond: couleurTexteAuto(fondAssombriCalc),
        // Texte auto sur fond teinté (contraste WCAG)
        texteSurTeinte: couleurTexteAuto(fondTeinteCalc),
        // Bordure (40% couleur + 60% surface)
        bordure: melangeCouleur(couleur, 40, surfaceUtilisee),
        // Badge très léger (10% couleur)
        fondBadge: melangeCouleur(couleur, 10, surfaceUtilisee),
    };
}

/**
 * Détermine si une couleur hex est "claire" (luminance > 0.5).
 * Utile pour adapter les éléments UI (ombres, bordures, etc.).
 */
export function estCouleurClaire(hex: string): boolean {
    return luminanceRelative(hex) > 0.5;
}

// ─── Hook détection mode thème ────────────────────────────

/**
 * Hook pour détecter le mode thème actuel (light/dark).
 * Utilise `data-theme` sur `<html>` + MutationObserver pour réactivité.
 * Retourne 'light' | 'dark'.
 */
function subscribeThemeMode(callback: () => void): () => void {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
}

function getThemeMode(): 'light' | 'dark' {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return 'light';
    // auto : détecter via prefers-color-scheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Hook React : retourne le mode thème actuel ('light' | 'dark').
 * Réactif aux changements de `data-theme` via MutationObserver.
 *
 * @example
 * ```ts
 * const mode = useModeTheme();
 * const pal = paletteCreneau('#DDA0DD', undefined, mode);
 * ```
 */
export function useModeTheme(): 'light' | 'dark' {
    return useSyncExternalStore(subscribeThemeMode, getThemeMode, getThemeMode);
}
