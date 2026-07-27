/**
 * ==================================
 * eLISAschool - Calcul et découpe de tuiles PDF
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Fonctions génériques pour le découpage d'une image en tuiles
 * paginées avec repères de collage — réutilisables par tout module
 * d'export (organigramme, emploi du temps, planning, etc.).
 */

/** Formats de page standard (dimensions en mm, portrait) */
export const PAGE_FORMATS_MM = [
    { id: 'a4', width: 210, height: 297 },
    { id: 'a3', width: 297, height: 420 },
    { id: 'a2', width: 420, height: 594 },
    { id: 'a1', width: 594, height: 841 },
    { id: 'a0', width: 841, height: 1189 },
] as const;

export type OrientationPage = 'paysage' | 'portrait';

/** Résultat du calcul de grille de tuiles pour export multi-pages */
export interface GrilleTuiles {
    colonnes: number;
    lignes: number;
    totalPages: number;
    /** Chevauchement entre tuiles en mm */
    chevauchementMm: number;
    /** Largeur utile d'une tuile en mm (hors chevauchement) */
    tuileUtileMm: { largeur: number; hauteur: number };
}

/**
 * Calcule la grille de tuiles pour un export multi-pages.
 * Le chevauchement (10mm par défaut) permet le collage physique.
 */
export function calculerGrilleTuiles(
    largeurImgMm: number,
    hauteurImgMm: number,
    pageFormat: string,
    orientation: OrientationPage,
    chevauchementMm = 10,
): GrilleTuiles {
    const fmt = PAGE_FORMATS_MM.find(f => f.id === pageFormat.toLowerCase());
    const petit = fmt ? Math.min(fmt.width, fmt.height) : 210;
    const grand = fmt ? Math.max(fmt.width, fmt.height) : 297;
    const pageW = orientation === 'portrait' ? petit : grand;
    const pageH = orientation === 'portrait' ? grand : petit;

    const marge = 10;
    const utileW = pageW - 2 * marge;
    const utileH = pageH - 2 * marge;

    const pasW = utileW - chevauchementMm;
    const pasH = utileH - chevauchementMm;

    const colonnes = Math.max(1, Math.ceil((largeurImgMm - chevauchementMm) / pasW));
    const lignes = Math.max(1, Math.ceil((hauteurImgMm - chevauchementMm) / pasH));

    return {
        colonnes,
        lignes,
        totalPages: colonnes * lignes,
        chevauchementMm,
        tuileUtileMm: { largeur: pasW, hauteur: pasH },
    };
}

/** Charge un dataURL en HTMLImageElement */
export function chargerImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = dataUrl;
    });
}

/**
 * Découpe une portion de l'image source via offscreen canvas.
 * Les coordonnées sont en pixels de l'image source.
 */
export function decouperTuile(
    source: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
): string {
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return source.src;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL('image/png');
}
