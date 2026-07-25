/**
 * ==================================
 * eLISAschool - Export PNG de l'organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { toPng } from 'html-to-image';

/**
 * Exporte le conteneur React Flow en PNG.
 * Utilise html-to-image (SVG foreignObject) pour supporter oklch/oklab.
 */
export async function exporterOrganigrammePNG(
    elementId: string,
    nomEtablissement: string = 'organigramme',
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const dataUrl = await toPng(element, {
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: getComputedStyle(document.documentElement)
                .getPropertyValue('--color-surface').trim() || '#ffffff',
        });

        const link = document.createElement('a');
        link.download = `${nomEtablissement.replace(/\s+/g, '_')}_organigramme_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Erreur export PNG:', error);
    }
}
