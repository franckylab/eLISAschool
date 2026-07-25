/**
 * ==================================
 * eLISAschool - Catégories de fonction (source unique de catégorisation du personnel)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Remplace l'ancienne entité TypePersonnel (supprimée en v5.0).
 * La catégorie d'un membre du personnel est TOUJOURS dérivée de ses fonctions :
 * MembreFonction active (estPrincipale DESC) → AffectationPoste ACTIF → null.
 */

export enum CategorieFonction {
    ENSEIGNANT = 'ENSEIGNANT',
    DIRECTION = 'DIRECTION',
    ADMINISTRATIF = 'ADMINISTRATIF',
    TECHNIQUE = 'TECHNIQUE',
    SERVICE = 'SERVICE',
    SANTE = 'SANTE',
    SOCIAL = 'SOCIAL',
    AUTRE = 'AUTRE',
}

export const CATEGORIES_FONCTION = Object.values(CategorieFonction);

/** Source de dérivation de la catégorie d'un membre */
export type CategorieSource = 'FONCTION' | 'AFFECTATION' | null;
