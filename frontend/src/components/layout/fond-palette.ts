/**
 * ==================================
 * eLISAschool - Palette du fond principal (SOURCE DE VÉRITÉ UNIQUE)
 * ==================================
 *
 * Seul fichier autorisé à définir des couleurs pour le fond (dégradé,
 * quadrillage, relief). Règles :
 *   - Toute couleur existant dans l'échelle thème (globals.css @theme,
 *     réécrite au runtime par theme-utils.appliquerThemeCSS) est référencée
 *     par var(--color-…) — jamais re-définie ici. Le changement de thème
 *     d'un établissement se propage donc automatiquement au fond.
 *   - Les opacités sont appliquées via color-mix() (socle navigateur :
 *     Chrome 111+ / Safari 16.2+ / Firefox 113+).
 *   - Seules les couleurs PROPRES au fond (stops de dégradé custom,
 *     ombres des reliefs) sont définies ici, dans FOND_CANON.
 *
 * Directives visuelles (grill-me 2026-07-31, version « bleu eLISAschool ») :
 *   - Lignes du quadrillage : BLEU eLISAschool (light : accent-300/400,
 *     dark : accent-500) à opacité FORTE, et un dégradé vertical
 *     blanc → bleu → noir/gris (blanc en haut) posé
 *     AU-DESSUS des lignes via GrilleCouleurs.teinte : les lignes se teintent
 *     verticalement en restant parfaitement visibles. Léger « flou » :
 *     bords de ligne progressifs (FOND_GRILLE_BORD_DOUX, fond-anime).
 *   - Fond : light = BLEU eLISAschool principal + dégradé blanc et vert ;
 *     dark = GRIS principal + dégradé bleu eLISAschool, blanc (lueur) et
 *     vert. Dégradés fluides 135° (diagonale haut-gauche → bas-droite).
 *
 * Garde anti-drift : scripts/check-fond-colors.sh (hex/rgba hors de ce
 * fichier dans components/layout/ → erreur).
 */

export interface GrilleCouleurs {
    mineure: string; // ligne mineure (chaîne couleur CSS complète)
    majeure: string; // ligne majeure
    reliefClair: string; // biseau haut-gauche du point
    reliefCoeur: string; // cœur du point (dégradé)
    reliefOmbre: string; // ombre externe + interne
    teinte: string; // dégradé vertical posé au-dessus des lignes
}

// ==========================================
// Canon — valeurs hex (couleurs propres au fond + fallbacks des vars)
// ==========================================
export const FOND_CANON = {
    // Fallbacks des vars échelle thème (valeurs par défaut globals.css —
    // utilisées uniquement si la var est absente)
    dominant500: '#22c55e',
    accent600: '#007bff',
    secondary500: '#f59e0b',
    accent500: '#3b82f6',
    // Neutres propres au fond
    blanc: '#ffffff',
    noir: '#000000',
    // Ombres des reliefs (neutres)
    reliefOmbreLight: '#475569',
    reliefOmbreDark: '#020617',
    // ==========================================
    // BLEU eLISAschool — couleur de MARQUE
    // Utilisé pour les lignes du quadrillage (light ET dark).
    // NE PAS utiliser var(--color-accent-*) ici : ces vars sont
    // réécrites au runtime par appliquerThemeCSS() selon la couleur
    // dominante de l'établissement. Le quadrillage doit rester bleu
    // eLISAschool quelle que soit la thème.
    // ==========================================
    bleuLigneClair: '#93c5fd',   // accent-300 — lignes mineures light
    bleuLigneMedium: '#60a5fa',  // accent-400 — lignes majeures light
    bleuLigneFonce: '#3b82f6',   // accent-500 — lignes dark + relief
} as const;

// ==========================================
// Couche 1 — dégradé général (variant par thème)
// Light : BLEU pâle (accent-50) → BLEU eLISAschool clair (accent-100) →
//         vert eLISAschool pâle (dominant-100) → BLEU pâle (accent-50)
// Dark : lueur blanche → GRIS principal (--color-background) →
//        bleu eLISAschool foncé (accent-900) → vert eLISAschool foncé
// ==========================================
export const FOND_DEGRADE_LIGHT =
    `linear-gradient(135deg, var(--color-accent-50, #eff6ff) 0%, var(--color-accent-100, #dbeafe) 45%, var(--color-dominant-100, #dcfce7) 78%, var(--color-accent-50, #eff6ff) 100%)`;
export const FOND_DEGRADE_DARK =
    `linear-gradient(135deg, color-mix(in srgb, ${FOND_CANON.blanc} 8%, transparent) 0%, var(--color-background, #111827) 22%, var(--color-accent-900, #1e3a8a) 62%, var(--color-dominant-900, #14532d) 100%)`;

// ==========================================
// Couche 2 — quadrillage cahier (variant par thème)
// Lignes : BLEU eLISAschool (light : accent-300/400, dark : accent-500)
// à opacité FORTE. Les reliefs suivent la même teinte que les lignes.
// ==========================================
export const FOND_GRILLE_LIGHT: GrilleCouleurs = {
    // BLEU eLISAschool en dur (couleur de marque, pas var thème)
    mineure: `color-mix(in srgb, ${FOND_CANON.bleuLigneClair} 20%, transparent)`,
    majeure: `color-mix(in srgb, ${FOND_CANON.bleuLigneMedium} 32%, transparent)`,
    reliefClair: `color-mix(in srgb, ${FOND_CANON.blanc} 90%, transparent)`,
    reliefCoeur: `color-mix(in srgb, ${FOND_CANON.bleuLigneClair} 15%, transparent)`,
    reliefOmbre: `color-mix(in srgb, ${FOND_CANON.reliefOmbreLight} 30%, transparent)`,
    // Teinte verticale light : atténuée — blanc en haut, bleu eLISAschool léger, gris subtil en bas
    teinte: `linear-gradient(180deg, color-mix(in srgb, ${FOND_CANON.blanc} 25%, transparent) 0%, color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 12%, transparent) 45%, color-mix(in srgb, ${FOND_CANON.reliefOmbreLight} 10%, transparent) 100%)`,
};

export const FOND_GRILLE_DARK: GrilleCouleurs = {
    // BLEU eLISAschool en dur (couleur de marque, pas var thème)
    mineure: `color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 18%, transparent)`,
    majeure: `color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 32%, transparent)`,
    reliefClair: `color-mix(in srgb, ${FOND_CANON.blanc} 16%, transparent)`,
    reliefCoeur: `color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 14%, transparent)`,
    reliefOmbre: `color-mix(in srgb, ${FOND_CANON.reliefOmbreDark} 50%, transparent)`,
    // Teinte verticale dark : blanc → bleu eLISAschool → noir (se fond dans le fond sombre)
    teinte: `linear-gradient(180deg, color-mix(in srgb, ${FOND_CANON.blanc} 38%, transparent) 0%, color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 20%, transparent) 45%, color-mix(in srgb, ${FOND_CANON.noir} 30%, transparent) 100%)`,
};
