/**
 * ==================================
 * eLISAschool - Export organigramme (PNG/PDF)
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Export configurable : presets de taille, qualité, coloration,
 * titre/date/légende, minimap, portée (visible ou tout déplié),
 * progression par étapes (callback onProgress).
 * L'overlay (titre/date/légende) n'est incrusté que pour le PNG :
 * le PDF dessine son propre en-tête/légende via jsPDF (zéro redondance).
 * Légende alignée sur le thème actif (couleurs des liens résolues au runtime).
 * Fond blanc forcé pour export fidèle. Résolution CSS vars avant capture.
 * Utilise html-to-image (SVG foreignObject) pour oklch/oklab Tailwind v4.
 */

import { toPng } from 'html-to-image';
import { resolveColor, clearResolverCache, normaliserCouleurHex, attendreStabilisationDom, telecharger, genererNomFichier, tailleDataUrlOctets } from '@/lib/export';
import {
    type ExportOptions,
    type EstimationExport,
    type FormatExport,
    type EtapeExport,
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
} as const;

/** Couleurs canon des liens (fallbacks si le thème n'est pas résolu) */
const COULEURS_LIENS_DEFAUT = {
    hierarchie: '#28a745',
    directe: '#f59e0b',
    fonctionnelle: '#007bff',
} as const;

export interface CouleursLiens {
    hierarchie: string;
    directe: string;
    fonctionnelle: string;
}

/** Libellés de la légende (traduits, fournis par le composant appelant) */
export interface LibellesLegende {
    hierarchie: string;
    directe: string;
    fonctionnelle: string;
}

const LIBELLES_LEGENDE_DEFAUT: LibellesLegende = {
    hierarchie: 'Hiérarchie',
    directe: 'Rel. directe',
    fonctionnelle: 'Rel. fonctionnelle',
};

export interface ResultatExport {
    format: FormatExport;
    tailleOctets: number;
    largeurPx: number;
    hauteurPx: number;
}

export type OnProgressExport = (etape: EtapeExport) => void;

/**
 * Résout les couleurs réelles des liens depuis le thème actif.
 * Les liens hiérarchiques suivent la couleur dominante de l'établissement :
 * la légende exportée doit refléter ces couleurs, pas des hex figés.
 */
export function resoudreCouleursLiens(): CouleursLiens {
    return {
        hierarchie: normaliserCouleurHex(
            resolveColor('var(--color-dominant-500)'), COULEURS_LIENS_DEFAUT.hierarchie),
        directe: normaliserCouleurHex(
            resolveColor('var(--color-secondary-500)'), COULEURS_LIENS_DEFAUT.directe),
        fonctionnelle: normaliserCouleurHex(
            resolveColor('var(--color-accent-600)'), COULEURS_LIENS_DEFAUT.fonctionnelle),
    };
}

function preparerPourExport(element: HTMLElement): void {
    element.querySelectorAll('animate, animateTransform').forEach(el => el.remove());

    // Fix remplissage noir : le `fill: none` des edges vient de la classe CSS
    // `.react-flow__edge-path`, perdue lors de la sérialisation SVG de la capture.
    // Sans fill explicite, un path smoothstep à angles est rempli en noir.
    element.querySelectorAll<SVGElement>('.react-flow__edges path, .react-flow__edge path').forEach(p => {
        if (!p.getAttribute('fill')) {
            p.setAttribute('fill', 'none');
        }
    });

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

function creerOverlay(
    options: ExportOptions,
    couleursLiens: CouleursLiens,
    libelles: LibellesLegende,
): HTMLDivElement {
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

        if (options.nomEtablissement) {
            const etabEl = document.createElement('div');
            etabEl.textContent = options.nomEtablissement;
            etabEl.style.cssText = `font-size: 12px; font-weight: 500; color: ${COULEURS_EXPORT.textSecondary};`;
            gauche.appendChild(etabEl);
        }
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
            { label: libelles.hierarchie, dasharray: '', color: couleursLiens.hierarchie, width: '2.5' },
            { label: libelles.directe, dasharray: '10 5', color: couleursLiens.directe, width: '2.5' },
            { label: libelles.fonctionnelle, dasharray: '4 5', color: couleursLiens.fonctionnelle, width: '2.5' },
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
    couleursLiens: CouleursLiens,
    libelles: LibellesLegende,
): Promise<{ dataUrl: string; estimation: EstimationExport }> {
    clearResolverCache();

    preparerPourExport(element);

    // L'overlay n'est incrusté que pour le PNG : le PDF dessine son propre
    // en-tête/date/légende via jsPDF — l'incruster aussi dans l'image
    // dupliquerait titre, établissement, date et légende.
    const overlay = options.format === 'png'
        ? creerOverlay(options, couleursLiens, libelles)
        : null;
    if (overlay) {
        element.style.position = element.style.position || 'relative';
        element.appendChild(overlay);
    }

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
                    if (node.classList.contains('react-flow__minimap')) return options.inclureMinimap;
                    if (node.classList.contains('react-flow__attribution')) return false;
                    if (node.getAttribute('role') === 'toolbar') return false;
                }
                return true;
            },
        });
        return { dataUrl, estimation };
    } finally {
        if (overlay?.parentNode) element.removeChild(overlay);
        if (filtre !== 'none') {
            element.style.filter = ancienFiltre;
        }
    }
}

export async function exporterOrganigramme(
    elementId: string,
    options: ExportOptions,
    onProgress?: OnProgressExport,
    libellesLegende?: LibellesLegende,
): Promise<ResultatExport | null> {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const libelles = libellesLegende ?? LIBELLES_LEGENDE_DEFAUT;

    onProgress?.('preparation');
    // Yield pour laisser React peindre la barre de progression avant le travail lourd
    await new Promise(resolve => setTimeout(resolve, 16));

    if (options.portee === 'etendu') {
        onProgress?.('depliage');
        window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
            detail: { command: 'expand-all' },
        }));
        await attendreStabilisationDom(element);
    }

    const couleursLiens = resoudreCouleursLiens();

    // Minimap force-mount pour mobile/tablette (< 1280px) : la minimap n'est
    // rendue que sur desktop. Si l'export la demande, on la monte temporairement.
    let minimapForcee = false;
    if (options.inclureMinimap) {
        window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
            detail: { command: 'force-minimap', visible: true },
        }));
        minimapForcee = true;
        await attendreStabilisationDom(element);
    }

    try {
        onProgress?.('capture');
        const { dataUrl, estimation } = await capturerElement(element, options, couleursLiens, libelles);
        const nomFichier = genererNomFichier(options.nomEtablissement, 'organigramme', options.format);

        onProgress?.('generation');
        let tailleOctets: number;
        if (options.format === 'pdf') {
            const { exporterPdfJsPdf } = await import('./export-pdf');
            tailleOctets = await exporterPdfJsPdf(dataUrl, {
                titre: options.inclureTitre ? options.titre : '',
                nomEtablissement: options.inclureTitre ? options.nomEtablissement : '',
                nomFichier,
                inclureDate: options.inclureDate,
                inclureLegende: options.inclureLegende,
                pageFormat: options.pageFormat || 'a4',
                orientation: options.orientation,
                pagination: options.pagination,
                couleursLegende: couleursLiens,
                libellesLegende: libelles,
            });
        } else {
            tailleOctets = tailleDataUrlOctets(dataUrl);
            onProgress?.('telechargement');
            telecharger(dataUrl, nomFichier);
        }

        return {
            format: options.format,
            tailleOctets,
            largeurPx: estimation.largeurPx,
            hauteurPx: estimation.hauteurPx,
        };
    } finally {
        if (minimapForcee) {
            window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
                detail: { command: 'force-minimap', visible: false },
            }));
        }
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
