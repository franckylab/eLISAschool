/**
 * ==================================
 * eLISAschool - DTOs de Pagination Réutilisables
 * ==================================
 * Version: 2.0.0
 * 
 * Schémas Zod standardisés pour la pagination
 * à utiliser dans tous les modules de l'application.
 * 
 * Bonne pratique : étendre ces schémas selon les besoins
 * spécifiques de chaque module.
 */

import { z } from 'zod';
import { LIMITS } from '@shared/constants/app.constants';

// ============================================
// SCHÉMAS DE BASE
// ============================================

/**
 * Schéma de base pour la pagination
 * À utiliser comme base pour tous les query DTOs
 */
export const paginationSchema = z.object({
    /**
     * Numéro de page (commence à 1)
     * Accepte string ou number, convertit automatiquement
     */
    page: z.coerce
        .number()
        .int('La page doit être un nombre entier')
        .min(1, 'La page doit être supérieure ou égale à 1')
        .default(1),

    /**
     * Nombre d'éléments par page
     * Limité entre 1 et PAGINATION_MAX (100 par défaut)
     */
    limit: z.coerce
        .number()
        .int('La limite doit être un nombre entier')
        .min(1, 'La limite doit être supérieure ou égale à 1')
        .max(LIMITS.PAGINATION_MAX, `La limite ne peut pas dépasser ${LIMITS.PAGINATION_MAX}`)
        .default(LIMITS.PAGINATION_DEFAULT),
});

/**
 * Schéma pour le tri (sorting)
 */
export const sortSchema = z.object({
    /**
     * Champ de tri
     * Doit être validé côté service contre une liste de champs autorisés
     */
    sortBy: z.string().max(100).default('createdAt'),

    /**
     * Ordre de tri
     */
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

/**
 * Schéma combiné pagination + tri
 * Le plus couramment utilisé
 */
export const paginationWithSortSchema = paginationSchema.merge(sortSchema);

// ============================================
// SCHÉMAS SPÉCIALISÉS
// ============================================

/**
 * Schéma pour la recherche textuelle
 */
export const searchSchema = z.object({
    /**
     * Terme de recherche
     * Recherché dans plusieurs champs (email, nom, etc.)
     */
    search: z.string().max(255).optional(),
});

/**
 * Schéma pour les filtres de date
 */
export const dateRangeSchema = z.object({
    /**
     * Date de début (format ISO 8601)
     */
    dateDebut: z.string().datetime().optional(),

    /**
     * Date de fin (format ISO 8601)
     */
    dateFin: z.string().datetime().optional(),
});

// ============================================
// SCHÉMAS COMPOSÉS PRÊTS À L'EMPLOI
// ============================================

/**
 * Schéma complet : pagination + tri + recherche
 * Pour les listes avec recherche textuelle
 */
export const queryWithSearchSchema = paginationWithSortSchema.merge(searchSchema);

/**
 * Schéma complet : pagination + tri + recherche + dates
 * Pour les historiques, logs, etc.
 */
export const queryWithSearchAndDatesSchema = queryWithSearchSchema.merge(dateRangeSchema);

// ============================================
// TYPES INFÉRÉS
// ============================================

export type PaginationDto = z.infer<typeof paginationSchema>;
export type SortDto = z.infer<typeof sortSchema>;
export type PaginationWithSortDto = z.infer<typeof paginationWithSortSchema>;
export type SearchDto = z.infer<typeof searchSchema>;
export type DateRangeDto = z.infer<typeof dateRangeSchema>;
export type QueryWithSearchDto = z.infer<typeof queryWithSearchSchema>;
export type QueryWithSearchAndDatesDto = z.infer<typeof queryWithSearchAndDatesSchema>;

// ============================================
// FONCTIONS HELPER
// ============================================

/**
 * Crée un schéma de pagination personnalisé
 * Permet de surcharger les valeurs par défaut
 * 
 * @param options - Options de personnalisation
 * @returns Schéma Zod de pagination
 * 
 * @example
 * const queryParametresSchema = createCustomPaginationSchema({
 *   defaultLimit: 50,
 *   maxLimit: 200
 * }).extend({
 *   categorie: z.string().optional(),
 * });
 */
export function createCustomPaginationSchema(options?: {
    defaultPage?: number;
    defaultLimit?: number;
    maxLimit?: number;
}) {
    const {
        defaultPage = 1,
        defaultLimit = LIMITS.PAGINATION_DEFAULT,
        maxLimit = LIMITS.PAGINATION_MAX,
    } = options || {};

    return z.object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .default(defaultPage),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(maxLimit)
            .default(defaultLimit),
    });
}

/**
 * Valide et extrait les paramètres de pagination
 * Utile pour les controllers qui reçoivent req.query
 * 
 * @param schema - Schéma Zod complet incluant pagination
 * @param query - req.query
 * @returns Paramètres validés
 */
export function validatePaginationQuery<T extends z.ZodTypeAny>(
    schema: T,
    query: Record<string, unknown>
): z.infer<T> {
    return schema.parse(query);
}

// ============================================
// EXPORTS
// ============================================

export default {
    paginationSchema,
    sortSchema,
    paginationWithSortSchema,
    searchSchema,
    dateRangeSchema,
    queryWithSearchSchema,
    queryWithSearchAndDatesSchema,
    createCustomPaginationSchema,
    validatePaginationQuery,
};
