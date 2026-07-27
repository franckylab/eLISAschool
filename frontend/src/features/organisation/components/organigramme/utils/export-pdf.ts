/**
 * ==================================
 * eLISAschool - Export PDF organigramme (jsPDF)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Génération PDF professionnel via jsPDF.
 * Deux modes de pagination :
 * - 'ajuster' : image entière sur une page (comportement historique)
 * - 'tuiles' : découpage en tuiles A4/A3/… avec repères de collage,
 *   page 1 = assemblage réduit + grille numérotée + légende,
 *   pages suivantes = 1 tuile/page avec label Lx·Cy — n/N,
 *   chevauchement 10mm, marks de découpe, DPI cible 150.
 * Source unique du contenu : l'image capturée est vierge (sans overlay),
 * seul jsPDF dessine titre/date/légende — zéro redondance.
 * Retourne la taille réelle du fichier généré (octets).
 */

import { jsPDF } from 'jspdf';
import { chargerImage, decouperTuile, calculerGrilleTuiles, PAGE_FORMATS_MM } from '@/lib/export';
import {
    type OrientationExport,
    type ModePagination,
} from './export-types';

interface CouleursLegende {
    hierarchie: string;
    directe: string;
    fonctionnelle: string;
}

interface LibellesLegende {
    hierarchie: string;
    directe: string;
    fonctionnelle: string;
}

interface PdfOptions {
    titre: string;
    nomEtablissement: string;
    nomFichier: string;
    inclureDate: boolean;
    inclureLegende: boolean;
    pageFormat: string;
    orientation: OrientationExport;
    pagination?: ModePagination;
    couleursLegende?: CouleursLegende;
    libellesLegende?: LibellesLegende;
}

const COULEURS_PDF = {
    bg: '#ffffff',
    text: '#1f2937',
    textStrong: '#0f172a',
    textMuted: '#9ca3af',
    textSecondary: '#4b5563',
    border: '#e5e7eb',
    mark: '#94a3b8',
} as const;

const LEGENDE_DEFAUT: CouleursLegende = {
    hierarchie: '#28a745',
    directe: '#f59e0b',
    fonctionnelle: '#007bff',
};

const LIBELLES_DEFAUT: LibellesLegende = {
    hierarchie: 'Hiérarchie',
    directe: 'Rel. directe',
    fonctionnelle: 'Rel. fonctionnelle',
};

/** DPI cible pour le rendu des tuiles (qualité impression) */
const DPI_TUILES = 150;
/** Pixels par mm à DPI_TUILES */
const PX_PAR_MM = DPI_TUILES / 25.4;

function getPageDimensions(
    format: string,
    orientation: OrientationExport,
): { width: number; height: number } {
    const fmt = PAGE_FORMATS_MM.find(f => f.id === format.toLowerCase());
    const petit = fmt ? Math.min(fmt.width, fmt.height) : 210;
    const grand = fmt ? Math.max(fmt.width, fmt.height) : 297;
    return orientation === 'portrait'
        ? { width: petit, height: grand }
        : { width: grand, height: petit };
}

function dessinerLegende(
    doc: jsPDF,
    y: number,
    pageWidth: number,
    couleurs: CouleursLegende,
    libelles: LibellesLegende,
): void {
    const items = [
        { label: libelles.hierarchie, color: couleurs.hierarchie, dash: undefined as number[] | undefined },
        { label: libelles.directe, color: couleurs.directe, dash: [3, 1] },
        { label: libelles.fonctionnelle, color: couleurs.fonctionnelle, dash: [1, 1] },
    ];

    doc.setFontSize(7);

    const largeurs = items.map(item => 10 + doc.getTextWidth(item.label));
    const largeurTotale = largeurs.reduce((somme, l) => somme + l, 0) + (items.length - 1) * 6;
    let x = pageWidth - 10 - largeurTotale;

    items.forEach((item, i) => {
        doc.setDrawColor(item.color);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern(item.dash ?? [], 0);
        doc.line(x, y, x + 8, y);
        doc.setLineDashPattern([], 0);
        doc.setTextColor(COULEURS_PDF.textSecondary);
        doc.text(item.label, x + 10, y + 1);
        x += largeurs[i] + 6;
    });
}

function dessinerEnTete(
    doc: jsPDF,
    options: PdfOptions,
    pageWidth: number,
    marge: number,
): number {
    const avecTitre = options.titre.length > 0;
    const avecEtablissement = options.nomEtablissement.length > 0;

    let headerHeight = 2;
    if (avecTitre) headerHeight += 6;
    if (avecEtablissement) headerHeight += 5;
    if (options.inclureDate) headerHeight += 4;

    let cursorY = marge + 5;

    if (avecTitre) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COULEURS_PDF.textStrong);
        doc.text(options.titre, marge, cursorY);
        cursorY += 6;
    }

    if (avecEtablissement) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COULEURS_PDF.textSecondary);
        doc.text(options.nomEtablissement, marge, cursorY);
        cursorY += 5;
    }

    if (options.inclureDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COULEURS_PDF.textMuted);
        const dateStr = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        doc.text(dateStr, marge, cursorY);
    }

    if (headerHeight > 2) {
        doc.setDrawColor(COULEURS_PDF.border);
        doc.setLineWidth(0.2);
        doc.line(marge, marge + headerHeight, pageWidth - marge, marge + headerHeight);
    }

    return headerHeight;
}

function dessinerFooter(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    marge: number,
): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COULEURS_PDF.textMuted);
    doc.text(
        `eLISAschool — ${new Date().toLocaleDateString('fr-FR')}`,
        pageWidth - marge,
        pageHeight - 3,
        { align: 'right' },
    );
}

/**
 * Dessine les repères de découpe aux 4 coins d'une tuile.
 */
function dessinerMarks(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    markLen: number,
): void {
    doc.setDrawColor(COULEURS_PDF.mark);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([], 0);

    const coins = [
        { cx: x, cy: y, dx: -1, dy: -1 },
        { cx: x + w, cy: y, dx: 1, dy: -1 },
        { cx: x, cy: y + h, dx: -1, dy: 1 },
        { cx: x + w, cy: y + h, dx: 1, dy: 1 },
    ];

    for (const c of coins) {
        doc.line(c.cx, c.cy, c.cx + c.dx * markLen, c.cy);
        doc.line(c.cx, c.cy, c.cx, c.cy + c.dy * markLen);
    }
}

/**
 * Mode 'ajuster' : image entière ajustée sur une page (comportement historique).
 */
async function exporterModeAjuster(
    imageDataUrl: string,
    options: PdfOptions,
): Promise<number> {
    const { width: pageWidth, height: pageHeight } = getPageDimensions(
        options.pageFormat,
        options.orientation,
    );
    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
    const marge = 10;

    const doc = new jsPDF({ orientation, unit: 'mm', format: [pageWidth, pageHeight] });
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    const headerHeight = dessinerEnTete(doc, options, pageWidth, marge);
    const footerHeight = options.inclureLegende ? 12 : 4;
    const zoneWidth = pageWidth - 2 * marge;
    const zoneHeight = pageHeight - headerHeight - footerHeight - 2 * marge;
    const imgY = marge + headerHeight;

    const img = await chargerImage(imageDataUrl);
    const ratio = Math.min(zoneWidth / img.width, zoneHeight / img.height);
    const renderWidth = img.width * ratio;
    const renderHeight = img.height * ratio;
    const offsetX = marge + (zoneWidth - renderWidth) / 2;
    const offsetY = imgY + (zoneHeight - renderHeight) / 2;

    doc.addImage(imageDataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

    if (options.inclureLegende) {
        const legendeY = pageHeight - marge - 4;
        doc.setDrawColor(COULEURS_PDF.border);
        doc.setLineWidth(0.2);
        doc.line(marge, legendeY - 4, pageWidth - marge, legendeY - 4);
        dessinerLegende(
            doc, legendeY, pageWidth,
            options.couleursLegende ?? LEGENDE_DEFAUT,
            options.libellesLegende ?? LIBELLES_DEFAUT,
        );
    }

    dessinerFooter(doc, pageWidth, pageHeight, marge);

    const tailleOctets = doc.output('blob').size;
    doc.save(options.nomFichier);
    return tailleOctets;
}

/**
 * Mode 'tuiles' : page assemblage + tuiles avec repères de collage.
 *
 * Page 1 : en-tête + vue d'ensemble réduite + grille numérotée + légende.
 * Pages 2+ : 1 tuile/page avec label « Lx·Cy — n/N », corner marks, overlap.
 */
async function exporterModeTuiles(
    imageDataUrl: string,
    options: PdfOptions,
): Promise<number> {
    const { width: pageWidth, height: pageHeight } = getPageDimensions(
        options.pageFormat,
        options.orientation,
    );
    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
    const marge = 10;

    const doc = new jsPDF({ orientation, unit: 'mm', format: [pageWidth, pageHeight] });
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    const img = await chargerImage(imageDataUrl);

    // Dimensions de l'image en mm au DPI d'impression
    const imgLargeurMm = img.width / PX_PAR_MM;
    const imgHauteurMm = img.height / PX_PAR_MM;

    const grille = calculerGrilleTuiles(imgLargeurMm, imgHauteurMm, options.pageFormat, options.orientation);

    // ─── PAGE 1 : ASSEMBLAGE ───
    const headerHeight = dessinerEnTete(doc, options, pageWidth, marge);
    const footerHeight = options.inclureLegende ? 12 : 4;
    const zoneWidth = pageWidth - 2 * marge;
    const zoneHeight = pageHeight - headerHeight - footerHeight - 2 * marge;
    const imgY = marge + headerHeight;

    // Vue d'ensemble réduite
    const ratioApercu = Math.min(zoneWidth / imgLargeurMm, zoneHeight / imgHauteurMm);
    const apercuW = imgLargeurMm * ratioApercu;
    const apercuH = imgHauteurMm * ratioApercu;
    const apercuX = marge + (zoneWidth - apercuW) / 2;
    const apercuY = imgY + (zoneHeight - apercuH) / 2;

    doc.addImage(imageDataUrl, 'PNG', apercuX, apercuY, apercuW, apercuH);

    // Grille numérotée sur l'aperçu
    doc.setDrawColor(COULEURS_PDF.mark);
    doc.setLineWidth(0.1);
    doc.setLineDashPattern([1, 1], 0);
    doc.setFontSize(5);
    doc.setTextColor(COULEURS_PDF.textMuted);

    const pasXMm = grille.tuileUtileMm.largeur + grille.chevauchementMm;
    const pasYMm = grille.tuileUtileMm.hauteur + grille.chevauchementMm;

    for (let col = 0; col < grille.colonnes; col++) {
        for (let lig = 0; lig < grille.lignes; lig++) {
            const tileXMm = col * pasXMm;
            const tileYMm = lig * pasYMm;
            const tileW = Math.min(pasXMm, imgLargeurMm - tileXMm);
            const tileH = Math.min(pasYMm, imgHauteurMm - tileYMm);

            const rx = apercuX + tileXMm * ratioApercu;
            const ry = apercuY + tileYMm * ratioApercu;
            const rw = tileW * ratioApercu;
            const rh = tileH * ratioApercu;

            doc.rect(rx, ry, rw, rh);
            doc.text(`${col + 1}×${lig + 1}`, rx + 1, ry + 2.5);
        }
    }
    doc.setLineDashPattern([], 0);

    // Info grille sous l'aperçu
    doc.setFontSize(7);
    doc.setTextColor(COULEURS_PDF.textSecondary);
    doc.text(
        `${grille.colonnes} × ${grille.lignes} tuiles — ${grille.totalPages} pages — chevauchement ${grille.chevauchementMm} mm`,
        pageWidth / 2,
        apercuY + apercuH + 5,
        { align: 'center' },
    );

    if (options.inclureLegende) {
        const legendeY = pageHeight - marge - 4;
        doc.setDrawColor(COULEURS_PDF.border);
        doc.setLineWidth(0.2);
        doc.line(marge, legendeY - 4, pageWidth - marge, legendeY - 4);
        dessinerLegende(
            doc, legendeY, pageWidth,
            options.couleursLegende ?? LEGENDE_DEFAUT,
            options.libellesLegende ?? LIBELLES_DEFAUT,
        );
    }

    dessinerFooter(doc, pageWidth, pageHeight, marge);

    // ─── PAGES TUILES ───
    let pageIdx = 0;
    for (let col = 0; col < grille.colonnes; col++) {
        for (let lig = 0; lig < grille.lignes; lig++) {
            pageIdx++;
            doc.addPage();
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // En-tête tuile : label + compteur
            const label = `L${col + 1}·C${lig + 1}`;
            const compteur = `${pageIdx}/${grille.totalPages}`;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(COULEURS_PDF.textStrong);
            doc.text(label, marge, marge + 5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(COULEURS_PDF.textMuted);
            doc.text(compteur, pageWidth - marge, marge + 5, { align: 'right' });

            doc.setDrawColor(COULEURS_PDF.border);
            doc.setLineWidth(0.2);
            doc.line(marge, marge + 8, pageWidth - marge, marge + 8);

            // Découpe de la tuile en pixels source
            const sx = Math.round(col * pasXMm * PX_PAR_MM);
            const sy = Math.round(lig * pasYMm * PX_PAR_MM);
            const sw = Math.round(Math.min(pasXMm * PX_PAR_MM, img.width - sx));
            const sh = Math.round(Math.min(pasYMm * PX_PAR_MM, img.height - sy));

            const tuileDataUrl = decouperTuile(img, sx, sy, sw, sh);

            // Rendu de la tuile : pleine zone utile (marge 15mm pour les marks)
            const tuileMarge = 15;
            const tuileZoneW = pageWidth - 2 * tuileMarge;
            const tuileZoneH = pageHeight - 2 * tuileMarge - 8;
            const tuileY = tuileMarge + 8;

            // Ratio pour remplir la zone (pas d'ajustement — on veut la tuile pleine)
            const tuileRatio = Math.min(tuileZoneW / (sw / PX_PAR_MM), tuileZoneH / (sh / PX_PAR_MM));
            const tuileW = (sw / PX_PAR_MM) * tuileRatio;
            const tuileH = (sh / PX_PAR_MM) * tuileRatio;
            const tuileX = tuileMarge + (tuileZoneW - tuileW) / 2;

            doc.addImage(tuileDataUrl, 'PNG', tuileX, tuileY, tuileW, tuileH);

            // Repères de découpe aux 4 coins
            dessinerMarks(doc, tuileX, tuileY, tuileW, tuileH, 4);

            // Footer
            dessinerFooter(doc, pageWidth, pageHeight, marge);
        }
    }

    const tailleOctets = doc.output('blob').size;
    doc.save(options.nomFichier);
    return tailleOctets;
}

export async function exporterPdfJsPdf(
    imageDataUrl: string,
    options: PdfOptions,
): Promise<number> {
    if (options.pagination === 'tuiles') {
        return exporterModeTuiles(imageDataUrl, options);
    }
    return exporterModeAjuster(imageDataUrl, options);
}
