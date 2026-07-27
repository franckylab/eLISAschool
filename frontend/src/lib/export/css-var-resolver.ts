/**
 * ==================================
 * eLISAschool - Résolveur CSS Variables
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Résout les variables CSS var(--name) en valeurs hex concrètes
 * via getComputedStyle(). Nécessaire pour l'export PNG/PDF où les
 * CSS vars ne sont pas résolues dans les SVG sérialisés.
 * Extrait dans lib/export/ pour réutilisation par tout module d'export.
 */

const cache = new Map<string, string>();
const VAR_REGEX = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/;

export function resolveCssVar(name: string): string {
    const cached = cache.get(name);
    if (cached) return cached;

    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (value) {
        cache.set(name, value);
        return value;
    }
    return '';
}

export function resolveColor(cssValue: string): string {
    if (!cssValue.includes('var(')) return cssValue;

    const match = cssValue.match(VAR_REGEX);
    if (!match) return cssValue;

    const varName = match[1];
    const fallback = match[2]?.trim();
    const resolved = resolveCssVar(varName);

    return resolved || fallback || cssValue;
}

export function clearResolverCache(): void {
    cache.clear();
}

let canvasCtx: CanvasRenderingContext2D | null = null;

/**
 * Normalise n'importe quelle couleur CSS (oklch, rgb, nom…) en hex #rrggbb
 * via le canvas 2D. Retourne le fallback si la couleur est invalide,
 * non résolue (var() restante) ou non opaque.
 */
export function normaliserCouleurHex(cssColor: string, fallback: string): string {
    if (!canvasCtx) {
        canvasCtx = document.createElement('canvas').getContext('2d');
    }
    if (!canvasCtx) return fallback;

    canvasCtx.fillStyle = fallback;
    canvasCtx.fillStyle = cssColor;
    const normalisee = canvasCtx.fillStyle;
    return typeof normalisee === 'string' && normalisee.startsWith('#') ? normalisee : fallback;
}
