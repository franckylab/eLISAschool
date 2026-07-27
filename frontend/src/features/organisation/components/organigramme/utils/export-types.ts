/**
 * ==================================
 * eLISAschool - Types et presets export organigramme
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Presets de taille basés sur les résolutions standard (HD → 16K),
 * strictement croissants, définis par le bord long de l'image.
 * Qualité = pourcentage de la résolution cible (modèle cohérent :
 * la taille sélectionnée est toujours respectée, jamais dépassée).
 * Double plafond navigateur : dimension (20 480 px) ET surface totale
 * (~268 Mpx, limite Chrome/Firefox) — permet d'atteindre ~20 000 px
 * sur le bord long pour les organigrammes non carrés.
 * Estimation de poids réaliste pour un PNG de diagramme (aplats).
 */

export type FormatExport = 'png' | 'pdf';
export type ModeColoration = 'couleur' | 'monochrome' | 'noirBlanc';
export type Portee = 'visible' | 'etendu';
export type OrientationExport = 'paysage' | 'portrait';
/** Mode de pagination PDF : 'ajuster' = image entière sur 1 page, 'tuiles' = découpage en tuiles avec repères de collage */
export type ModePagination = 'ajuster' | 'tuiles';

/** Étapes de progression pendant l'export (affichées dans le modal) */
export type EtapeExport = 'preparation' | 'depliage' | 'capture' | 'generation' | 'telechargement';

export interface TaillePreset {
    id: string;
    label: string;
    /** Résolution cible du grand côté de l'image (px), quelle que soit l'orientation */
    bordLong: number;
    description: string;
}

export interface QualiteConfig {
    id: string;
    label: string;
    /** Fraction de la résolution cible (0-1) */
    facteur: number;
    description: string;
}

export interface ExportOptions {
    format: FormatExport;
    taillePreset: string;
    qualite: string;
    coloration: ModeColoration;
    inclureTitre: boolean;
    inclureDate: boolean;
    inclureLegende: boolean;
    inclureMinimap: boolean;
    titre: string;
    nomEtablissement: string;
    portee: Portee;
    orientation: OrientationExport;
    pageFormat?: string;
    pagination?: ModePagination;
}

export interface EstimationExport {
    largeurPx: number;
    hauteurPx: number;
    tailleEstimeeMo: number;
    pixelRatio: number;
    /** true si la résolution demandée a été plafonnée (limite canvas navigateur) */
    plafonne: boolean;
}

/** Résolutions standard, strictement croissantes (bord long) */
export const TAILLE_PRESETS: TaillePreset[] = [
    { id: 'hd', label: 'HD', bordLong: 1280, description: 'HD — 1280 px · aperçu, partage rapide' },
    { id: 'full-hd', label: 'Full HD', bordLong: 1920, description: 'Full HD — 1920 px · écran, présentation' },
    { id: 'qhd', label: 'QHD', bordLong: 2560, description: 'QHD — 2560 px · impression A4' },
    { id: '4k', label: '4K UHD', bordLong: 3840, description: '4K UHD — 3840 px · impression A3/A2' },
    { id: '8k', label: '8K UHD', bordLong: 7680, description: '8K UHD — 7680 px · très grand format' },
    { id: '16k', label: '16K', bordLong: 15360, description: '16K — 15 360 px · affiche, traçage grand format' },
    { id: 'ultra', label: 'Ultra', bordLong: 20480, description: 'Ultra — ~20 000 px · maximum navigateur' },
];

/** Qualité = pourcentage de la résolution cible, strictement croissant */
export const QUALITE_CONFIGS: QualiteConfig[] = [
    { id: 'minimale', label: 'Minimale', facteur: 0.25, description: '25 % de la taille cible — aperçu rapide' },
    { id: 'reduite', label: 'Réduite', facteur: 0.5, description: '50 % — fichier léger' },
    { id: 'equilibree', label: 'Équilibrée', facteur: 0.75, description: '75 % — bon compromis' },
    { id: 'maximale', label: 'Maximale', facteur: 1, description: '100 % de la taille cible — fidélité maximale' },
];

export const PAGE_FORMATS = [
    { id: 'a4', label: 'A4', width: 210, height: 297 },
    { id: 'a3', label: 'A3', width: 297, height: 420 },
    { id: 'a2', label: 'A2', width: 420, height: 594 },
    { id: 'a1', label: 'A1', width: 594, height: 841 },
    { id: 'a0', label: 'A0', width: 841, height: 1189 },
] as const;

export const FILTRES_COLORATION: Record<ModeColoration, string> = {
    couleur: 'none',
    monochrome: 'grayscale(0.7) contrast(1.15) saturate(0.3)',
    noirBlanc: 'grayscale(1) contrast(1.4) brightness(1.05)',
};

/**
 * Dimension maximale sûre d'un canvas sur une seule dimension.
 * Chrome/Firefox desktop acceptent jusqu'à 32 767 px par côté, mais la
 * surface totale devient limitante bien avant — 20 480 px permet le
 * preset Ultra tout en restant sous la limite par dimension.
 */
const DIMENSION_MAX_PX = 20480;

/**
 * Surface maximale d'un canvas (Chrome : ~268 Mpx = 16384²).
 * Un export 20 000 px de bord long n'est possible que si l'autre côté
 * est assez court pour respecter cette contrainte (ex. 20 000 × 13 000).
 */
const SURFACE_MAX_PX = 268_000_000;

/**
 * Poids moyen observé d'un PNG de diagramme (aplats de couleurs, fond blanc)
 * après compression deflate — très loin des 4 octets/pixel du RGBA brut.
 */
const OCTETS_PAR_PIXEL_PNG = 0.12;

export function getTaillePreset(id: string): TaillePreset {
    return TAILLE_PRESETS.find(p => p.id === id) ?? TAILLE_PRESETS[1];
}

export function getQualiteConfig(id: string): QualiteConfig {
    return QUALITE_CONFIGS.find(q => q.id === id) ?? QUALITE_CONFIGS[QUALITE_CONFIGS.length - 1];
}

export function estimerExport(
    largeurElement: number,
    hauteurElement: number,
    taillePreset: TaillePreset,
    qualite: QualiteConfig,
): EstimationExport {
    const bordLongElement = Math.max(largeurElement, hauteurElement, 1);
    const ratioCible = taillePreset.bordLong / bordLongElement;

    const pixelRatioDemande = ratioCible * qualite.facteur;
    const ratioPlafondDimension = DIMENSION_MAX_PX / bordLongElement;
    const surfaceElement = Math.max(largeurElement * hauteurElement, 1);
    const ratioPlafondSurface = Math.sqrt(SURFACE_MAX_PX / surfaceElement);
    const pixelRatio = Math.min(pixelRatioDemande, ratioPlafondDimension, ratioPlafondSurface);
    const plafonne = pixelRatio < pixelRatioDemande;

    const largeurPx = Math.round(largeurElement * pixelRatio);
    const hauteurPx = Math.round(hauteurElement * pixelRatio);

    const pixelsTotal = largeurPx * hauteurPx;
    const tailleEstimeeMo = (pixelsTotal * OCTETS_PAR_PIXEL_PNG) / (1024 * 1024);

    return {
        largeurPx,
        hauteurPx,
        tailleEstimeeMo: Math.round(tailleEstimeeMo * 100) / 100,
        pixelRatio,
        plafonne,
    };
}
