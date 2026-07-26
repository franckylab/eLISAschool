/**
 * ==================================
 * eLISAschool - Export organigramme (PNG/PDF)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Export configurable : format, résolution, coloration, titre/date/légende,
 * portée (visible ou tout déplié). Utilise html-to-image (SVG foreignObject)
 * pour supporter oklch/oklab de Tailwind v4.
 */

import { toPng, toJpeg } from 'html-to-image';

export interface ExportOptions {
    format: 'png' | 'pdf';
    resolution: 1 | 2 | 3 | 4;
    coloration: 'couleur' | 'monochrome' | 'noirBlanc';
    inclureTitre: boolean;
    inclureDate: boolean;
    inclureLegende: boolean;
    titre: string;
    portee: 'visible' | 'etendu';
}

const FILTRES_COLORATION: Record<string, string> = {
    couleur: 'none',
    monochrome: 'grayscale(0.75) contrast(1.1) saturate(0.4)',
    noirBlanc: 'grayscale(1) contrast(1.3) brightness(1.05)',
};

function creerOverlay(options: ExportOptions): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; z-index: 100;
        display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
        padding: 12px 20px; pointer-events: none;
        background: linear-gradient(180deg, var(--color-surface) 0%, transparent 100%);
    `;

    const gauche = document.createElement('div');
    gauche.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    if (options.inclureTitre) {
        const titreEl = document.createElement('div');
        titreEl.textContent = options.titre;
        titreEl.style.cssText = `
            font-size: 16px; font-weight: 700;
            color: var(--color-text-strong, var(--color-text));
            letter-spacing: -0.01em;
        `;
        gauche.appendChild(titreEl);
    }

    if (options.inclureDate) {
        const dateEl = document.createElement('div');
        dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        dateEl.style.cssText = `
            font-size: 11px; color: var(--color-text-muted);
        `;
        gauche.appendChild(dateEl);
    }

    if (gauche.childNodes.length > 0) {
        overlay.appendChild(gauche);
    }

    if (options.inclureLegende) {
        const legende = document.createElement('div');
        legende.style.cssText = `
            display: flex; align-items: center; gap: 16px;
            font-size: 10px; color: var(--color-text-secondary);
        `;

        const items = [
            { label: 'Hiérarchie', dasharray: '', color: 'var(--color-dominant-400)', width: '2' },
            { label: 'Rel. directe', dasharray: '6 3', color: 'var(--color-dominant-600)', width: '1.5' },
            { label: 'Rel. fonctionnelle', dasharray: '2 3', color: 'var(--color-accent-600)', width: '1.5' },
        ];

        for (const item of items) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; align-items: center; gap: 4px;';

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '24');
            svg.setAttribute('height', '6');
            svg.setAttribute('viewBox', '0 0 24 6');

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', '3');
            line.setAttribute('x2', '24');
            line.setAttribute('y2', '3');
            line.setAttribute('stroke', item.color);
            line.setAttribute('stroke-width', item.width);
            if (item.dasharray) line.setAttribute('stroke-dasharray', item.dasharray);

            svg.appendChild(line);
            wrapper.appendChild(svg);

            const label = document.createElement('span');
            label.textContent = item.label;
            wrapper.appendChild(label);

            legende.appendChild(wrapper);
        }

        overlay.appendChild(legende);
    }

    return overlay;
}

async function capturerElement(
    element: HTMLElement,
    options: ExportOptions,
): Promise<string> {
    const overlay = creerOverlay(options);
    element.style.position = element.style.position || 'relative';
    element.appendChild(overlay);

    const filtre = FILTRES_COLORATION[options.coloration] || 'none';
    const ancienFiltre = element.style.filter;
    if (filtre !== 'none') {
        element.style.filter = filtre;
    }

    const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-surface').trim() || '#ffffff';

    try {
        const dataUrl = await toPng(element, {
            pixelRatio: options.resolution,
            cacheBust: true,
            backgroundColor: bgColor,
            filter: (node) => {
                if (node instanceof HTMLElement && node.classList.contains('react-flow__controls')) {
                    return false;
                }
                return true;
            },
        });
        return dataUrl;
    } finally {
        element.removeChild(overlay);
        if (filtre !== 'none') {
            element.style.filter = ancienFiltre;
        }
    }
}

function telecharger(dataUrl: string, nomFichier: string): void {
    const link = document.createElement('a');
    link.download = nomFichier;
    link.href = dataUrl;
    link.click();
}

function exporterPdf(dataUrl: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = printWindow.document;

    const style = doc.createElement('style');
    style.textContent = `
        @page { size: landscape; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; background: #fff;
        }
        img {
            max-width: 100%; max-height: 95vh;
            object-fit: contain;
        }
        @media print {
            body { background: none; }
            img { page-break-inside: avoid; }
        }
    `;

    const img = doc.createElement('img');
    img.src = dataUrl;
    img.alt = 'Organigramme';

    doc.head.appendChild(doc.createElement('meta')).setAttribute('charset', 'utf-8');
    doc.title = 'Organigramme';
    doc.head.appendChild(style);
    doc.body.appendChild(img);

    printWindow.addEventListener('load', () => {
        setTimeout(() => { printWindow.print(); }, 300);
    });
}

function genererNomFichier(titre: string, format: 'png' | 'pdf'): string {
    const date = new Date().toISOString().slice(0, 10);
    const base = titre.replace(/\s+/g, '_') || 'organigramme';
    return `${base}_organigramme_${date}.${format}`;
}

export async function exporterOrganigramme(
    elementId: string,
    options: ExportOptions,
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (options.portee === 'etendu') {
        window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
            detail: { command: 'expand-all' },
        }));
        await new Promise(r => setTimeout(r, 600));
    }

    try {
        const dataUrl = await capturerElement(element, options);
        const nomFichier = genererNomFichier(options.titre, options.format);

        if (options.format === 'pdf') {
            exporterPdf(dataUrl);
        } else {
            telecharger(dataUrl, nomFichier);
        }
    } finally {
        if (options.portee === 'etendu') {
            window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
                detail: { command: 'collapse-all' },
            }));
        }
    }
}

/**
 * @deprecated Utiliser exporterOrganigramme() avec ExportOptions
 */
export async function exporterOrganigrammePNG(
    elementId: string,
    nomEtablissement: string = 'organigramme',
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const dataUrl = await toJpeg(element, {
            pixelRatio: 2,
            cacheBust: true,
            quality: 0.95,
            backgroundColor: getComputedStyle(document.documentElement)
                .getPropertyValue('--color-surface').trim() || '#ffffff',
        });

        const link = document.createElement('a');
        link.download = `${nomEtablissement.replace(/\s+/g, '_')}_organigramme_${new Date().toISOString().slice(0, 10)}.jpg`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Erreur export PNG:', error);
    }
}
