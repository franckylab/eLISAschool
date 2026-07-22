/**
 * ==================================
 * eLISAschool - Export PNG de l'organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import html2canvas from 'html2canvas';

/**
 * Exporte le conteneur React Flow en PNG
 */
export async function exporterOrganigrammePNG(
    elementId: string,
    nomEtablissement: string = 'organigramme',
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const link = document.createElement('a');
        link.download = `${nomEtablissement.replace(/\s+/g, '_')}_organigramme_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Erreur export PNG:', error);
    }
}
