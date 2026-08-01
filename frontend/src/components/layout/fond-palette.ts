/**
 * ==================================
 * eLISAschool - Palette du fond principal (SOURCE DE VÉRITÉ UNIQUE)
 * ==================================
 *
 * Seul fichier autorisé à définir des couleurs pour le fond (dégradé,
 * quadrillage). Règles :
 *   - Toute couleur existant dans l'échelle thème (globals.css @theme,
 *     réécrite au runtime par theme-utils.appliquerThemeCSS) est référencée
 *     par var(--color-…) — jamais re-définie ici. Le changement de thème
 *     d'un établissement se propage donc automatiquement au fond.
 *   - Les opacités sont appliquées via color-mix() (socle navigateur :
 *     Chrome 111+ / Safari 16.2+ / Firefox 113+).
 *   - Seules les couleurs PROPRES au fond (stops de dégradé custom)
 *     sont définies ici, dans FOND_CANON.
 *
 * Directives visuelles (grill-me 2026-07-31, version « bleu eLISAschool ») :
 *   - Lignes du quadrillage : BLEU eLISAschool à opacité TRÈS SUBTILE
 *     (light : 12-22%, dark : 6-10%), et un dégradé vertical posé
 *     AU-DESSUS des lignes via GrilleCouleurs.teinte. Light : blanc
 *     atténué → bleu → noir subtil. Dark : quasi-nul (blanc 4% →
 *     transparent → noir 5%). Léger « flou » par bords progressifs.
 *   - Fond : light = BLEU pâle → bleu clair → vert pâle (coloré).
 *     dark = neutre profond thématé (dominant-950 8%, lueur 2%,
 *     assombrissement). Les cartes (#1a2744) ressortent par leur
 *     surface + bordure (#475569) sur fond #111827.
 *   - Mesh gradient (couche 3) : aurora subtile via 3 radial-gradient
 *     positionnés aux coins, couleur thème (var). Light : 4-6% opacité,
 *     dark : 3-5% opacité. Zéro repaint, 100% CSS.
 *
 * Garde anti-drift : scripts/check-fond-colors.sh (hex/rgba hors de ce
 * fichier dans components/layout/ → erreur).
 */

export interface GrilleCouleurs {
    mineure: string; // ligne mineure (chaîne couleur CSS complète)
    majeure: string; // ligne majeure
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
    bleuLigneFonce: '#3b82f6',   // accent-500 — lignes dark
} as const;

// ==========================================
// Couche 1 — dégradé général (variant par thème)
// Light : BLEU pâle (accent-50) → BLEU eLISAschool clair (accent-100) →
//         vert eLISAschool pâle (dominant-100) → BLEU pâle (accent-50)
// Dark : fond neutre profond thématé — dominant-950 à 8% pour une
//        teinte subtile de la couleur de l'établissement, lueur 2%,
//        assombrissement en bas. Les cartes (#1a2744) ressortent
//        naturellement par leur surface + bordure (#475569).
// ==========================================
export const FOND_DEGRADE_LIGHT =
    `linear-gradient(135deg, var(--color-accent-50, #eff6ff) 0%, var(--color-accent-100, #dbeafe) 45%, var(--color-dominant-100, #dcfce7) 78%, var(--color-accent-50, #eff6ff) 100%)`;
export const FOND_DEGRADE_DARK =
    `linear-gradient(135deg, color-mix(in srgb, ${FOND_CANON.blanc} 2%, transparent) 0%, var(--color-background, #111827) 25%, color-mix(in srgb, var(--color-dominant-950, #052e16) 8%, var(--color-background, #111827)) 60%, color-mix(in srgb, ${FOND_CANON.noir} 10%, transparent) 100%)`;

// ==========================================
// Couche 2 — quadrillage cahier (variant par thème)
// Lignes : BLEU eLISAschool (light : accent-300/400, dark : accent-500)
// à opacité TRÈS SUBTILE.
// ==========================================
export const FOND_GRILLE_LIGHT: GrilleCouleurs = {
    // BLEU eLISAschool en dur (couleur de marque, pas var thème)
    mineure: `color-mix(in srgb, ${FOND_CANON.bleuLigneClair} 12%, transparent)`,
    majeure: `color-mix(in srgb, ${FOND_CANON.bleuLigneMedium} 22%, transparent)`,
    // Teinte verticale light : blanche en haut, neutre au milieu, gris subtil en bas
    teinte: `linear-gradient(180deg, color-mix(in srgb, ${FOND_CANON.blanc} 20%, transparent) 0%, color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 8%, transparent) 45%, color-mix(in srgb, ${FOND_CANON.noir} 5%, transparent) 100%)`,
};

export const FOND_GRILLE_DARK: GrilleCouleurs = {
    // BLEU eLISAschool en dur (couleur de marque, pas var thème)
    // Opacité minimale : le fond dark ne doit JAMAIS competir avec les cartes
    mineure: `color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 6%, transparent)`,
    majeure: `color-mix(in srgb, ${FOND_CANON.bleuLigneFonce} 10%, transparent)`,
    // Teinte verticale dark : quasi-nulle — léger éclaircissement en haut
    teinte: `linear-gradient(180deg, color-mix(in srgb, ${FOND_CANON.blanc} 4%, transparent) 0%, transparent 50%, color-mix(in srgb, ${FOND_CANON.noir} 5%, transparent) 100%)`,
};

// ==========================================
// Couche 3 — mesh gradient « aurora » (variant par thème)
// 3 radial-gradient positionnés aux coins, couleur thème (var CSS).
// Effet organique subtil, zéro repaint, 100% CSS.
// ==========================================
export const FOND_MESH_LIGHT =
    `radial-gradient(ellipse 80% 60% at 15% 20%, var(--color-dominant-300, #86efac) 0%, transparent 60%), ` +
    `radial-gradient(ellipse 70% 50% at 85% 75%, var(--color-accent-300, #93c5fd) 0%, transparent 55%), ` +
    `radial-gradient(ellipse 60% 45% at 50% 50%, var(--color-secondary-300, #fcd34d) 0%, transparent 50%)`;
export const FOND_MESH_DARK =
    `radial-gradient(ellipse 80% 60% at 15% 20%, var(--color-dominant-800, #166534) 0%, transparent 60%), ` +
    `radial-gradient(ellipse 70% 50% at 85% 75%, var(--color-accent-800, #1e40af) 0%, transparent 55%), ` +
    `radial-gradient(ellipse 60% 45% at 50% 50%, var(--color-secondary-800, #92400e) 0%, transparent 50%)`;

// Opacité de la couche mesh (appliquée via style.opacity sur le div)
export const FOND_MESH_OPACITE_LIGHT = 0.05; // 5% — très subtil
export const FOND_MESH_OPACITE_DARK = 0.04;  // 4% — quasi imperceptible
