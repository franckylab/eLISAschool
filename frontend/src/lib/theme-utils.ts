/**
 * ==================================
 * eLISAschool - Utilitaires de Thème
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Génération de palettes, conversions couleur, application CSS
 */

/* ===== Conversions de couleur ===== */

export function hexToHsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/* ===== Génération de palette ===== */

export function genererEchelleCouleur(hex: string): Record<number, string> {
    const [h, s, l] = hexToHsl(hex);
    return {
        50: hslToHex(h, Math.min(s, 90), 97),
        100: hslToHex(h, Math.min(s, 85), 93),
        200: hslToHex(h, Math.min(s, 80), 86),
        300: hslToHex(h, Math.min(s, 75), 77),
        400: hslToHex(h, Math.min(s, 70), 66),
        500: hslToHex(h, s, 55),
        600: hex,
        700: hslToHex(h, Math.min(s + 5, 100), Math.max(l - 10, 20)),
        800: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 20, 15)),
        900: hslToHex(h, Math.min(s + 15, 100), Math.max(l - 30, 10)),
        950: hslToHex(h, Math.min(s + 20, 100), Math.max(l - 40, 5)),
    };
}

export function genererSecondaire(hex: string): string {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex((h + 40) % 360, Math.min(s + 10, 100), Math.min(l + 5, 70));
}

export function genererAccent(hex: string): string {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex((h + 200) % 360, Math.min(s + 5, 100), Math.min(l, 60));
}

export function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

/* ===== Application CSS ===== */

export function appliquerThemeCSS(
    dominante: string,
    secondaire: string,
    accent: string
): void {
    const root = document.documentElement;
    const domEchelle = genererEchelleCouleur(dominante);
    const secEchelle = genererEchelleCouleur(secondaire);
    const accEchelle = genererEchelleCouleur(accent);

    Object.entries(domEchelle).forEach(([key, val]) => {
        root.style.setProperty(`--color-dominant-${key}`, val);
    });
    Object.entries(secEchelle).forEach(([key, val]) => {
        root.style.setProperty(`--color-secondary-${key}`, val);
    });
    Object.entries(accEchelle).forEach(([key, val]) => {
        root.style.setProperty(`--color-accent-${key}`, val);
    });

    // Mettre à jour les alias FR pour les composants
    root.style.setProperty('--color-dominante', dominante);
    root.style.setProperty('--color-dominante-hover', domEchelle[700]);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-accent-hover', accEchelle[700]);
}

/* ===== Couleurs dominantes prédéfinies ===== */

export const COULEURS_DOMINANTES = [
    { nom: 'Vert', valeur: '#28a745' },
    { nom: 'Bleu', valeur: '#007bff' },
    { nom: 'Rouge', valeur: '#dc3545' },
    { nom: 'Jaune', valeur: '#ffc107' },
    { nom: 'Violet', valeur: '#6f42c1' },
    { nom: 'Orange', valeur: '#fd7e14' },
    { nom: 'Marron', valeur: '#795548' },
    { nom: 'Rose', valeur: '#e91e63' },
    { nom: 'Gris', valeur: '#6c757d' },
] as const;
