/**
 * ==================================
 * eLISAschool - Fond animé (Originkit Text Wave + quadrillage cahier)
 * ==================================
 *
 * Trois couches, de l'arrière vers l'avant :
 *   1. Dégradé général (OPAQUE) — vrai fond de page, variant light/dark.
 *   2. Quadrillage « cahier » (statique, 100% CSS multi-gradients) — lignes
 *      bleues + points embossés aux intersections (biseau clair, ombre
 *      externe, ombre interne). Zéro DOM supplémentaire, zéro JS, aucune
 *      repaint par frame : les background-image sont peintes une seule fois.
 *   3. Text Wave (lettres) — composant Originkit vendored INTACT
 *      (src/components/originkit/ui/text-wave.tsx), backgroundColor passé
 *      à 'transparent' pour laisser le quadrillage apparaître.
 *
 * Résolution du thème au runtime (getComputedStyle + MutationObserver
 * `data-theme`) : dégradé/quadrillage suivent le mode light/dark, la
 * palette des lettres suit les vars CSS du thème produit.
 *
 * Réglages visuels : constantes exportées ci-dessous (ajuster sans toucher
 * au reste).
 */

import { useEffect, useMemo, useState } from 'react';
import CharacterBg from '@/components/originkit/ui/text-wave';
import { normaliserCouleurHex } from '@/lib/export';

// ==========================================
// Constantes de réglage — ajustables ici
// ==========================================

// --- Couche 3 : lettres Text Wave ---
export const FOND_ANIME_OPACITE = 0.4;
export const FOND_ANIME_SPEED = 5;
export const FOND_ANIME_GAP = 48;
export const FOND_ANIME_FONT_SIZE = 100;
export const FOND_ANIME_FONT_WEIGHT = 800;
export const FOND_ANIME_REVERSE = true;
export const FOND_ANIME_PALETTE_VARS = [
    '--color-dominant-500',
    '--color-accent-600',
    '--color-secondary-500',
];
export const FOND_ANIME_FALLBACK_PALETTE = ['#22c55e', '#007bff', '#f59e0b'];
export const FOND_ANIME_GRID_TEXT =
    'elisaschool ELISASCHOOL';

// --- Couche 1 : dégradé général (variant par thème) ---
export const FOND_DEGRADE_LIGHT =
    'linear-gradient(135deg, #ffffff 0%, #e6f0ff 45%, #fff3d6 100%)';
export const FOND_DEGRADE_DARK =
    'linear-gradient(135deg, #0e2418 0%, #14532d 50%, #3f3414 85%, #1d2438 100%)';

// --- Couche 2 : quadrillage cahier ---
export const FOND_GRILLE_CELLULE = 23; // px — taille du carreau
export const FOND_GRILLE_MAJEURE_ECHELLE = 1; // ligne majeure tous les N carreaux
export const FOND_GRILLE_OPACITE = 0.9; // opacité de la couche quadrillage
export const FOND_GRILLE_RELIEF_RATIO = 0.1; // rayon du point relief (× cellule)

export interface GrilleCouleurs {
    mineure: string; // ligne mineure (rgba)
    majeure: string; // ligne majeure (rgba)
    reliefClair: string; // biseau haut-gauche du point
    reliefCoeur: string; // cœur du point (dégradé)
    reliefOmbre: string; // ombre externe + interne (rgba)
}

export const FOND_GRILLE_LIGHT: GrilleCouleurs = {
    mineure: 'rgba(147, 197, 253, 0.25)', // #93c5fd
    majeure: 'rgba(147, 197, 253, 0.35)',
    reliefClair: 'rgba(255, 255, 255, 0.9)',
    reliefCoeur: 'rgba(147, 197, 253, 0.5)',
    reliefOmbre: 'rgba(71, 85, 105, 0.3)',
};

export const FOND_GRILLE_DARK: GrilleCouleurs = {
    mineure: 'rgba(19, 7, 148, 0.25)', // #22c55e — vert eLISAschool
    majeure: 'rgba(25, 56, 232, 0.35)',
    reliefClair: 'rgba(255, 255, 255, 0.16)',
    reliefCoeur: 'rgba(34, 197, 94, 0.4)',
    reliefOmbre: 'rgba(2, 6, 23, 0.5)',
};

const MEDIA_REDUCED = '(prefers-reduced-motion: reduce)';

// ==========================================
// Construction des background-image (100% CSS)
// ==========================================

function construireQuadrillage(
    cfg: GrilleCouleurs,
    cellule: number,
    majeureEchelle: number,
): { image: string; size: string } {
    const majeur = cellule * majeureEchelle;
    const r = Math.max(2, Math.round(cellule * FOND_GRILLE_RELIEF_RATIO));
    const tuile = cellule * 1;

    const images: string[] = [
        // Lignes mineures (1px) — horizontales puis verticales
        `repeating-linear-gradient(to right, ${cfg.mineure} 0, ${cfg.mineure} 1px, transparent 1.5px, transparent ${cellule}px)`,
        `repeating-linear-gradient(to bottom, ${cfg.mineure} 0, ${cfg.mineure} 1px, transparent 1.5px, transparent ${cellule}px)`,
        // Lignes majeures (2px) — tous les N carreaux
        `repeating-linear-gradient(to right, ${cfg.majeure} 0, ${cfg.majeure} 2px, transparent 2.5px, transparent ${majeur}px)`,
        `repeating-linear-gradient(to bottom, ${cfg.majeure} 0, ${cfg.majeure} 2px, transparent 2.5px, transparent ${majeur}px)`,
    ];
    const tailles: string[] = ['auto', 'auto', 'auto', 'auto'];

    // Points embossés aux 4 coins de la tuile → un point par intersection
    for (const [dx, dy] of [
        [0, 0],
        [tuile, 0],
        [0, tuile],
        [tuile, tuile],
    ] as const) {
        // 1. Ombre externe (bas-droite, floue) — profondeur
        images.push(
            `radial-gradient(circle at ${dx + 2}px ${dy + 2}px, ${cfg.reliefOmbre} 0, ${cfg.reliefOmbre} ${r}px, transparent ${r + 2}px)`,
        );
        tailles.push(`${tuile}px ${tuile}px`);
        // 2. Corps du point (biseau clair haut-gauche → cœur dégradé)
        images.push(
            `radial-gradient(circle at ${dx + 0.05}px ${dy + 0.05}px, ${cfg.reliefClair} 0 ${Math.max(1, r * 0.4)}px, ${cfg.reliefCoeur} ${Math.max(1, r * 0.4)}px ${r}px, transparent ${r + 0.5}px)`,
        );
        tailles.push(`${tuile}px ${tuile}px`);
        // 3. Ombre interne (anneau sombre sur le bord du point)
        images.push(
            `radial-gradient(circle at ${dx + 0.05}px ${dy + 0.05}px, transparent 0 ${r * 0.8}px, ${cfg.reliefOmbre} ${r + 0.5}px, transparent ${r + 1.2}px)`,
        );
        tailles.push(`${tuile}px ${tuile}px`);
    }

    return { image: images.join(', '), size: tailles.join(', ') };
}

// ==========================================
// Résolution thème / couleurs
// ==========================================

function resoudreTheme(): 'light' | 'dark' {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function resoudreCouleurs(): { theme: 'light' | 'dark'; background: string; grille: GrilleCouleurs; palette: string[] } {
    const theme = resoudreTheme();
    const style = getComputedStyle(document.documentElement);
    const lire = (variable: string, fallback: string): string => {
        const brut = style.getPropertyValue(variable).trim();
        return brut ? normaliserCouleurHex(brut, fallback) : fallback;
    };
    return {
        theme,
        background: theme === 'dark' ? FOND_DEGRADE_DARK : FOND_DEGRADE_LIGHT,
        grille: theme === 'dark' ? FOND_GRILLE_DARK : FOND_GRILLE_LIGHT,
        palette: FOND_ANIME_PALETTE_VARS.map((variable, index) =>
            lire(variable, FOND_ANIME_FALLBACK_PALETTE[index] ?? FOND_ANIME_FALLBACK_PALETTE[0]),
        ),
    };
}

function useThemeCouleurs(): { theme: 'light' | 'dark'; background: string; grille: GrilleCouleurs; palette: string[] } {
    const [couleurs, setCouleurs] = useState(resoudreCouleurs);

    useEffect(() => {
        const observer = new MutationObserver(() => setCouleurs(resoudreCouleurs()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        return () => observer.disconnect();
    }, []);

    return couleurs;
}

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(MEDIA_REDUCED).matches,
    );

    useEffect(() => {
        const mq = window.matchMedia(MEDIA_REDUCED);
        const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return reduced;
}

// ==========================================
// Composant
// ==========================================

export function FondAnime() {
    const { background, grille, palette } = useThemeCouleurs();
    const reducedMotion = useReducedMotion();
    const quadrillage = useMemo(
        () => construireQuadrillage(grille, FOND_GRILLE_CELLULE, FOND_GRILLE_MAJEURE_ECHELLE),
        [grille],
    );

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 -z-20"
            style={{ background, pointerEvents: 'none' }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: quadrillage.image,
                    backgroundSize: quadrillage.size,
                    opacity: FOND_GRILLE_OPACITE,
                }}
            />
            <CharacterBg
                gridText={normaliserEspacements(FOND_ANIME_GRID_TEXT)}
                speed={reducedMotion ? 0 : FOND_ANIME_SPEED}
                gap={FOND_ANIME_GAP}
                reverse={FOND_ANIME_REVERSE}
                backgroundColor="transparent"
                style={{ opacity: FOND_ANIME_OPACITE }}
                font={{
                    fontFamily: 'Inter',
                    fontWeight: FOND_ANIME_FONT_WEIGHT,
                    fontSize: FOND_ANIME_FONT_SIZE,
                    lineHeight: 0.5,
                    letterSpacing: 0,
                    textAlign: 'top',
                }}
                colors={{
                    paletteCount: palette.length,
                    color1: palette[0],
                    color2: palette[2],
                    color3: palette[1],
                    color4: palette[3],
                    color5: palette[4]
                }}
            />
        </div>
    );
}

function normaliserEspacements(texte: string): string {
    return texte.trim().replace(/\s+/g, ' ');
}
