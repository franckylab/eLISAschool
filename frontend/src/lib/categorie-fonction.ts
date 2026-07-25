/**
 * ==================================
 * eLISAschool - Catégories de fonction (miroir frontend de personnel.constants.ts backend)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Remplace l'ancienne entité TypePersonnel (supprimée en v5.0).
 * La catégorie d'un membre du personnel est TOUJOURS dérivée de ses fonctions.
 */

export type CategorieFonction =
    | 'ENSEIGNANT'
    | 'DIRECTION'
    | 'ADMINISTRATIF'
    | 'TECHNIQUE'
    | 'SERVICE'
    | 'SANTE'
    | 'SOCIAL'
    | 'AUTRE';

export const CATEGORIES_FONCTION: CategorieFonction[] = [
    'ENSEIGNANT',
    'DIRECTION',
    'ADMINISTRATIF',
    'TECHNIQUE',
    'SERVICE',
    'SANTE',
    'SOCIAL',
    'AUTRE',
];

export type CategorieSource = 'FONCTION' | 'AFFECTATION' | null;

/** Couleurs par catégorie — utilisent les CSS vars du thème (dark mode inclus) */
export const CATEGORIE_COLORS: Record<CategorieFonction, { bg: string; text: string; dot: string }> = {
    ENSEIGNANT: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
    DIRECTION: { bg: 'bg-accent/10', text: 'text-accent-foreground', dot: 'bg-accent' },
    ADMINISTRATIF: { bg: 'bg-[var(--color-info)]/10', text: 'text-[var(--color-info)]', dot: 'bg-[var(--color-info)]' },
    TECHNIQUE: { bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]', dot: 'bg-[var(--color-warning)]' },
    SERVICE: { bg: 'bg-secondary/20', text: 'text-secondary-foreground', dot: 'bg-secondary' },
    SANTE: { bg: 'bg-destructive/10', text: 'text-destructive', dot: 'bg-destructive' },
    SOCIAL: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    AUTRE: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export function getCategorieColors(categorie?: string | null) {
    return CATEGORIE_COLORS[(categorie as CategorieFonction) || 'AUTRE'] || CATEGORIE_COLORS.AUTRE;
}
