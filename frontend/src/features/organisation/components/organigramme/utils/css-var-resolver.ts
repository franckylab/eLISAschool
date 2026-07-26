/**
 * ==================================
 * eLISAschool - Résolveur CSS Variables
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Résout les variables CSS var(--name) en valeurs hex concrètes
 * via getComputedStyle(). Nécessaire pour l'export PNG/PDF où les
 * CSS vars ne sont pas résolues dans les SVG sérialisés.
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
