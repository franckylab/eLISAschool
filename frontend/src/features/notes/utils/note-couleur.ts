/**
 * ==================================
 * eLISAschool - Utilitaires couleur des notes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Helpers de colorisation d'une note selon son ratio valeur/barème.
 * Utilise exclusivement les tokens CSS du thème (dark mode inclus).
 */

/**
 * Classe texte selon le ratio valeur/barème.
 * ratio < 0.4 → danger, < 0.5 → warning, < 0.7 → neutre, ≥ 0.7 → success.
 */
export function getNoteColorClass(valeur: number, bareme: number = 20): string {
    const base = bareme > 0 ? bareme : 20;
    const ratio = valeur / base;
    if (ratio < 0.4) return 'text-danger';
    if (ratio < 0.5) return 'text-warning';
    if (ratio < 0.7) return 'text-foreground';
    return 'text-success';
}

/**
 * Classes badge (fond + texte) selon le ratio valeur/barème.
 */
export function getNoteBadgeClass(valeur: number, bareme: number = 20): string {
    const base = bareme > 0 ? bareme : 20;
    const ratio = valeur / base;
    if (ratio < 0.4) return 'bg-danger/10 text-danger';
    if (ratio < 0.5) return 'bg-warning/10 text-warning';
    if (ratio < 0.7) return 'bg-muted text-foreground';
    return 'bg-success/10 text-success';
}

/**
 * Formatage "valeur/barème" avec arrondi à 2 décimales max.
 */
export function formatNote(valeur: number, bareme: number = 20): string {
    const arrondi = Math.round(valeur * 100) / 100;
    return `${arrondi}/${bareme > 0 ? bareme : 20}`;
}
