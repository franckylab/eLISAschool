/**
 * ==================================
 * eLISAschool - Fond principal (dégradé + quadrillage cahier)
 * ==================================
 *
 * Trois couches, de l'arrière vers l'avant :
 *   1. Dégradé général (OPAQUE) — vrai fond de page, variant light/dark.
 *      Le dark intègre la couleur dominante (thème établissement).
 *   2. Quadrillage « cahier » (statique, 100% CSS multi-gradients) — lignes
 *      BLEU eLISAschool à opacité très subtile + teinte verticale thème-aware.
 *      Léger effet « flouté » par des bords de ligne progressifs — PAS de
 *      filter: blur(). Zéro DOM supplémentaire, zéro JS par frame.
 *   3. Mesh gradient « aurora » — 3 radial-gradient aux coins, couleur
 *      thème (var CSS). Opacité très faible (5% light, 4% dark). Effet
 *      organique subtil, 100% CSS, zéro repaint.
 *
 * TOUTES les couleurs sont définies dans ./fond-palette (source de vérité
 * unique — voir scripts/check-fond-colors.sh). Résolution du thème au
 * runtime (MutationObserver `data-theme`).
 */

import { useEffect, useMemo, useState } from 'react';
import {
    FOND_DEGRADE_DARK,
    FOND_DEGRADE_LIGHT,
    FOND_GRILLE_DARK,
    FOND_GRILLE_LIGHT,
    FOND_MESH_DARK,
    FOND_MESH_LIGHT,
    FOND_MESH_OPACITE_DARK,
    FOND_MESH_OPACITE_LIGHT,
    type GrilleCouleurs,
} from './fond-palette';

// ==========================================
// Constantes de réglage — ajustables ici
// ==========================================

// --- Quadrillage cahier (couleurs : fond-palette) ---
export const FOND_GRILLE_CELLULE = 23; // px — taille du carreau
export const FOND_GRILLE_MAJEURE_ECHELLE = 1; // ligne majeure tous les N carreaux
export const FOND_GRILLE_OPACITE = 0.85; // opacité de la couche quadrillage
export const FOND_GRILLE_LARGEUR_LIGNE = 2; // px — largeur ligne (bords progressifs inclus)
export const FOND_GRILLE_BORD_DOUX = 0.9; // px — rampe d'adoucissement de chaque bord de ligne

// ==========================================
// Construction des background-image (100% CSS)
// ==========================================

function construireQuadrillage(
    cfg: GrilleCouleurs,
    cellule: number,
    majeureEchelle: number,
): { image: string; size: string } {
    const majeur = cellule * majeureEchelle;
    const bord = FOND_GRILLE_BORD_DOUX;
    const coeur = Math.max(0.5, FOND_GRILLE_LARGEUR_LIGNE - 2 * bord);

    // Ligne douce : rampe transparent→couleur (bord), cœur plein, rampe
    // couleur→transparent (bord) — « léger effet flouté » sans filter.
    const ligne = (couleur: string) =>
        `transparent 0, ${couleur} ${bord}px, ${couleur} ${bord + coeur}px, transparent ${FOND_GRILLE_LARGEUR_LIGNE}px, transparent ${cellule}px`;
    const ligneMajeure = (couleur: string) =>
        `transparent 0, ${couleur} ${bord}px, ${couleur} ${bord + coeur + 0.1}px, transparent ${FOND_GRILLE_LARGEUR_LIGNE + 0.1}px, transparent ${majeur}px`;

    const images: string[] = [
        // Lignes mineures — horizontales puis verticales
        `repeating-linear-gradient(to right, ${ligne(cfg.mineure)})`,
        `repeating-linear-gradient(to bottom, ${ligne(cfg.mineure)})`,
        // Lignes majeures (légèrement plus épaisses) — tous les N carreaux
        `repeating-linear-gradient(to right, ${ligneMajeure(cfg.majeure)})`,
        `repeating-linear-gradient(to bottom, ${ligneMajeure(cfg.majeure)})`,
    ];
    const tailles: string[] = ['auto', 'auto', 'auto', 'auto'];

    // Teinte verticale (blanc → bleu → noir/gris) — posée EN
    // DERNIÈRE (la plus haute) : les lignes prennent la teinte du dégradé
    // verticalement. Spécifique au thème via cfg.teinte.
    images.push(cfg.teinte);
    tailles.push('auto');

    return { image: images.join(', '), size: tailles.join(', ') };
}

// ==========================================
// Résolution thème / couleurs
// ==========================================

function resoudreTheme(): 'light' | 'dark' {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function resoudreCouleurs(): { theme: 'light' | 'dark'; background: string; grille: GrilleCouleurs; mesh: string; meshOpacite: number } {
    const theme = resoudreTheme();
    return {
        theme,
        background: theme === 'dark' ? FOND_DEGRADE_DARK : FOND_DEGRADE_LIGHT,
        grille: theme === 'dark' ? FOND_GRILLE_DARK : FOND_GRILLE_LIGHT,
        mesh: theme === 'dark' ? FOND_MESH_DARK : FOND_MESH_LIGHT,
        meshOpacite: theme === 'dark' ? FOND_MESH_OPACITE_DARK : FOND_MESH_OPACITE_LIGHT,
    };
}

function useThemeCouleurs(): { theme: 'light' | 'dark'; background: string; grille: GrilleCouleurs; mesh: string; meshOpacite: number } {
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

// ==========================================
// Composant
// ==========================================

export function FondAnime() {
    const { background, grille, mesh, meshOpacite } = useThemeCouleurs();
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
            {/* Couche 2 — quadrillage */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: quadrillage.image,
                    backgroundSize: quadrillage.size,
                    opacity: FOND_GRILLE_OPACITE,
                }}
            />
            {/* Couche 3 — mesh gradient « aurora » */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: mesh,
                    opacity: meshOpacite,
                }}
            />
        </div>
    );
}
