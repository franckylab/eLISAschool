/**
 * ==================================
 * eLISAschool - Export PDF organigramme (jsPDF)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Génération PDF professionnel via jsPDF.
 * Supporte A4→A0, orientation paysage, en-tête/pied de page,
 * légende des liens, image centrée avec ratio préservé.
 */

import { jsPDF } from 'jspdf';
import { PAGE_FORMATS } from './export-types';

interface PdfOptions {
    titre: string;
    inclureDate: boolean;
    inclureLegende: boolean;
    pageFormat: string;
}

const COULEURS_PDF = {
    bg: '#ffffff',
    text: '#1f2937',
    textStrong: '#0f172a',
    textMuted: '#9ca3af',
    textSecondary: '#4b5563',
    border: '#e5e7eb',
    dominant: '#28a745',
    dominantLight: '#4ade80',
    accent: '#007bff',
} as const;

function getPageDimensions(format: string): { width: number; height: number } {
    const fmt = PAGE_FORMATS.find(f => f.id === format.toLowerCase());
    if (fmt) return { width: fmt.width, height: fmt.height };
    return { width: 297, height: 210 };
}

function dessinerLegende(doc: jsPDF, y: number, pageWidth: number): void {
    const startX = pageWidth - 80;
    const items = [
        { label: 'Hiérarchie', color: COULEURS_PDF.dominantLight, dash: undefined },
        { label: 'Rel. directe', color: COULEURS_PDF.dominant, dash: '3' },
        { label: 'Rel. fonctionnelle', color: COULEURS_PDF.accent, dash: '1' },
    ];

    doc.setFontSize(7);
    items.forEach((item, i) => {
        const x = startX + i * 26;
        doc.setDrawColor(item.color);
        doc.setLineWidth(0.5);
        if (item.dash) {
            doc.setLineDashPattern([Number(item.dash), 1], 0);
        } else {
            doc.setLineDashPattern([], 0);
        }
        doc.line(x, y, x + 8, y);
        doc.setLineDashPattern([], 0);
        doc.setTextColor(COULEURS_PDF.textSecondary);
        doc.text(item.label, x + 10, y + 1);
    });
}

export async function exporterPdfJsPdf(
    imageDataUrl: string,
    options: PdfOptions,
): Promise<void> {
    const { width: pageWidth, height: pageHeight } = getPageDimensions(options.pageFormat);
    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';

    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: [pageWidth, pageHeight],
    });

    const marge = 10;
    const headerHeight = options.inclureDate ? 12 : 8;
    const footerHeight = options.inclureLegende ? 12 : 4;
    const zoneWidth = pageWidth - 2 * marge;
    const zoneHeight = pageHeight - headerHeight - footerHeight - 2 * marge;

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COULEURS_PDF.textStrong);
    doc.text(options.titre || 'Organigramme', marge, marge + 5);

    if (options.inclureDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COULEURS_PDF.textMuted);
        const dateStr = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        doc.text(dateStr, marge, marge + 10);
    }

    doc.setDrawColor(COULEURS_PDF.border);
    doc.setLineWidth(0.2);
    doc.line(marge, marge + headerHeight, pageWidth - marge, marge + headerHeight);

    const imgY = marge + headerHeight;

    return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(zoneWidth / imgWidth, zoneHeight / imgHeight);
            const renderWidth = imgWidth * ratio;
            const renderHeight = imgHeight * ratio;
            const offsetX = marge + (zoneWidth - renderWidth) / 2;
            const offsetY = imgY + (zoneHeight - renderHeight) / 2;

            doc.addImage(imageDataUrl, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

            if (options.inclureLegende) {
                const legendeY = pageHeight - marge - 4;
                doc.setDrawColor(COULEURS_PDF.border);
                doc.line(marge, legendeY - 4, pageWidth - marge, legendeY - 4);
                dessinerLegende(doc, legendeY, pageWidth);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(COULEURS_PDF.textMuted);
            doc.text(
                `eLISAschool — ${new Date().toLocaleDateString('fr-FR')}`,
                pageWidth - marge,
                pageHeight - 3,
                { align: 'right' },
            );

            const nomFichier = `${(options.titre || 'organigramme').replace(/\s+/g, '_')}_organigramme_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(nomFichier);
            resolve();
        };
        img.onerror = () => reject(new Error('Impossible de charger l\'image pour le PDF'));
        img.src = imageDataUrl;
    });
}
