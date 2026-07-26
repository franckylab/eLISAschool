/**
 * ==================================
 * eLISAschool - Types et presets export organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Définit les presets de taille, configurations de qualité,
 * modes de coloration et options d'export PNG/PDF.
 */

export type FormatExport = 'png' | 'pdf';
export type ModeColoration = 'couleur' | 'monochrome' | 'noirBlanc';
export type Portee = 'visible' | 'etendu';

export interface TaillePreset {
    id: string;
    label: string;
    maxWidth: number;
    maxHeight: number;
    description: string;
}

export interface QualiteConfig {
    id: string;
    label: string;
    pixelRatio: number;
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
    titre: string;
    portee: Portee;
    pageFormat?: string;
}

export interface EstimationExport {
    largeurPx: number;
    hauteurPx: number;
    tailleEstimeeMo: number;
    pixelRatio: number;
}

export const TAILLE_PRESETS: TaillePreset[] = [
    { id: 'moyen', label: 'Moyen', maxWidth: 2000, maxHeight: 2000, description: 'Écran standard' },
    { id: 'grand', label: 'Grand', maxWidth: 4000, maxHeight: 4000, description: 'Affichage détaillé' },
    { id: 'tres-grand', label: 'Très grand', maxWidth: 8000, maxHeight: 8000, description: 'Impression grand format' },
    { id: '4k', label: '4K', maxWidth: 3840, maxHeight: 2160, description: 'Ultra HD (3840×2160)' },
    { id: '8k', label: '8K', maxWidth: 7680, maxHeight: 4320, description: '8K UHD (7680×4320)' },
];

export const QUALITE_CONFIGS: QualiteConfig[] = [
    { id: 'standard', label: 'Standard', pixelRatio: 1, description: '×1 — Rapide, fichier léger' },
    { id: 'haute', label: 'Haute', pixelRatio: 2, description: '×2 — Bonne qualité' },
    { id: 'ultra', label: 'Ultra', pixelRatio: 3, description: '×3 — Haute fidélité' },
    { id: 'max', label: 'Maximum', pixelRatio: 4, description: '×4 — Qualité maximale' },
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

export function getTaillePreset(id: string): TaillePreset {
    return TAILLE_PRESETS.find(p => p.id === id) ?? TAILLE_PRESETS[0];
}

export function getQualiteConfig(id: string): QualiteConfig {
    return QUALITE_CONFIGS.find(q => q.id === id) ?? QUALITE_CONFIGS[1];
}

export function estimerExport(
    largeurElement: number,
    hauteurElement: number,
    taillePreset: TaillePreset,
    qualite: QualiteConfig,
): EstimationExport {
    const ratioPourTaille = Math.min(
        taillePreset.maxWidth / largeurElement,
        taillePreset.maxHeight / hauteurElement,
    );

    const pixelRatio = Math.min(Math.max(qualite.pixelRatio, ratioPourTaille), 8);

    const largeurPx = Math.round(largeurElement * pixelRatio);
    const hauteurPx = Math.round(hauteurElement * pixelRatio);

    const pixelsTotal = largeurPx * hauteurPx;
    const octetsParPixel = 4;
    const tailleEstimeeMo = (pixelsTotal * octetsParPixel) / (1024 * 1024);

    return { largeurPx, hauteurPx, tailleEstimeeMo: Math.round(tailleEstimeeMo * 10) / 10, pixelRatio };
}
