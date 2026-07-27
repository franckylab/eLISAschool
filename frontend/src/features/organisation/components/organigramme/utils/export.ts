/**
 * ==================================
 * eLISAschool - Export organigramme (PNG/PDF)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Export configurable : presets de taille, qualité, coloration,
 * titre/date/légende, portée (visible ou tout déplié).
 * Fond blanc forcé pour export fidèle. Résolution CSS vars avant capture.
 * Utilise html-to-image (SVG foreignObject) pour oklch/oklab Tailwind v4.
 */

import { toPng } from 'html-to-image';
import { resolveColor, clearResolverCache } from './css-var-resolver';
import {
    type ExportOptions,
    type EstimationExport,
    FILTRES_COLORATION,
    getTaillePreset,
    getQualiteConfig,
    estimerExport,
} from './export-types';

const COULEURS_EXPORT = {
    bg: '#ffffff',
    text: '#1f2937',
    textStrong: '#0f172a',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    dominant: '#28a745',
    dominantLight: '#4ade80',
    secondary: '#f59e0b',
    accent: '#007bff',
} as const;

function preparerPourExport(element: HTMLElement): void {
    element.querySelectorAll('animate, animateTransform').forEach(el => el.remove());

    element.querySelectorAll<SVGElement>('path[stroke-dashoffset]').forEach(el => {
        el.removeAttribute('stroke-dashoffset');
    });

    element.querySelectorAll<SVGElement>('path[stroke-dasharray="2000"]').forEach(el => {
        el.removeAttribute('stroke-dasharray');
    });

    element.querySelectorAll('[style*="var("]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = htmlEl.style;
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            const val = style.getPropertyValue(prop);
            if (val.includes('var(')) {
                const resolved = val.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_match, varName, fallback) => {
                    const r = resolveColor(`var(${varName})`);
                    return r || fallback || '';
                });
                if (resolved !== val) {
                    style.setProperty(prop, resolved);
                }
            }
        }
    });

    element.querySelectorAll<SVGElement>('svg [stroke*="var("], svg [fill*="var("]').forEach((el) => {
        const stroke = el.getAttribute('stroke');
        if (stroke?.includes('var(')) {
            const resolved = resolveColor(stroke);
            if (resolved) el.setAttribute('stroke', resolved);
        }
        const fill = el.getAttribute('fill');
        if (fill?.includes('var(')) {
            const resolved = resolveColor(fill);
            if (resolved) el.setAttribute('fill', resolved);
        }
    });

    element.querySelectorAll<SVGElement>('svg[style*="background"], svg[style*="background-color"]').forEach(el => {
        const computed = getComputedStyle(el);
        const bg = computed.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') {
            el.style.backgroundColor = bg;
        }
    });
}

function creerOverlay(options: ExportOptions): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; z-index: 100;
        display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
        padding: 12px 20px; pointer-events: none;
        background: linear-gradient(180deg, ${COULEURS_EXPORT.bg} 0%, transparent 100%);
    `;

    const gauche = document.createElement('div');
    gauche.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

    if (options.inclureTitre) {
        const titreEl = document.createElement('div');
        titreEl.textContent = options.titre;
        titreEl.style.cssText = `
            font-size: 16px; font-weight: 700;
            color: ${COULEURS_EXPORT.textStrong};
            letter-spacing: -0.01em;
        `;
        gauche.appendChild(titreEl);
    }

    if (options.inclureDate) {
        const dateEl = document.createElement('div');
        dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        dateEl.style.cssText = `font-size: 11px; color: ${COULEURS_EXPORT.textMuted};`;
        gauche.appendChild(dateEl);
    }

    if (gauche.childNodes.length > 0) {
        overlay.appendChild(gauche);
    }

    if (options.inclureLegende) {
        const legende = document.createElement('div');
        legende.style.cssText = `
            display: flex; align-items: center; gap: 16px;
            font-size: 10px; color: ${COULEURS_EXPORT.textSecondary};
        `;

        const items = [
            { label: 'Hiérarchie', dasharray: '', color: COULEURS_EXPORT.dominant, width: '2.5' },
            { label: 'Rel. directe', dasharray: '10 5', color: COULEURS_EXPORT.secondary, width: '2' },
            { label: 'Rel. fonctionnelle', dasharray: '4 5', color: COULEURS_EXPORT.accent, width: '2' },
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
    clearResolverCache();

    preparerPourExport(element);

    const overlay = creerOverlay(options);
    element.style.position = element.style.position || 'relative';
    element.appendChild(overlay);

    const filtre = FILTRES_COLORATION[options.coloration] || 'none';
    const ancienFiltre = element.style.filter;
    if (filtre !== 'none') {
        element.style.filter = filtre;
    }

    const taille = getTaillePreset(options.taillePreset);
    const qualite = getQualiteConfig(options.qualite);
    const estimation = estimerExport(element.offsetWidth, element.offsetHeight, taille, qualite);

    try {
        const dataUrl = await toPng(element, {
            pixelRatio: estimation.pixelRatio,
            cacheBust: true,
            backgroundColor: COULEURS_EXPORT.bg,
            filter: (node) => {
                if (node instanceof HTMLElement) {
                    if (node.classList.contains('react-flow__controls')) return false;
                    if (node.classList.contains('react-flow__minimap')) return false;
                    if (node.classList.contains('react-flow__attribution')) return false;
                    if (node.getAttribute('role') === 'toolbar') return false;
                }
                return true;
            },
        });
        return dataUrl;
    } finally {
        if (overlay.parentNode) element.removeChild(overlay);
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
            const { exporterPdfJsPdf } = await import('./export-pdf');
            await exporterPdfJsPdf(dataUrl, {
                titre: options.titre,
                inclureDate: options.inclureDate,
                inclureLegende: options.inclureLegende,
                pageFormat: options.pageFormat || 'a4',
            });
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

export function calculerEstimation(
    elementId: string,
    taillePresetId: string,
    qualiteId: string,
): EstimationExport | null {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const taille = getTaillePreset(taillePresetId);
    const qualite = getQualiteConfig(qualiteId);
    return estimerExport(element.offsetWidth, element.offsetHeight, taille, qualite);
}
