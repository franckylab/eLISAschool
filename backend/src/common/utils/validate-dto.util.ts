/**
 * ==================================
 * eLISAschool - Validation DTO utilitaire
 * ==================================
 * Version: 3.0.0
 * 
 * Fonction utilitaire centralisée pour valider les DTOs avec Zod.
 * À utiliser dans TOUS les controllers au lieu de helpers locaux.
 * 
 * Changelog v3.0:
 * - Format d'erreur standardisé avec détails { errors: [{ field, message }] }
 * - Ajout de validateQuery() pour les query parameters
 * - Suppression du try/catch (safeParse gère déjà les erreurs proprement)
 */

import { z, ZodSchema } from 'zod';
import { AppError } from '@common/filters/error.filter';

/**
 * Valide et parse un DTO avec Zod (body, query, params)
 * @param schema Le schéma Zod à utiliser
 * @param data Les données à valider
 * @returns Les données validées et typées
 * @throws AppError avec détails des erreurs si la validation échoue
 */
export function validateDto<T extends ZodSchema>(schema: T, data: unknown): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map((e) => ({
            field: e.path.join('.') || 'root',
            message: e.message,
            code: e.code,
        }));
        const messages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new AppError(
            `Erreur de validation: ${messages}`,
            400,
            'VALIDATION_ERROR',
            true,
            { errors }
        );
    }
    return result.data;
}

/**
 * Valide les query parameters (utilise z.coerce pour convertir string → number/boolean)
 * Alias sémantique de validateDto pour les query strings
 */
export function validateQuery<T extends ZodSchema>(schema: T, query: unknown): z.infer<T> {
    return validateDto(schema, query);
}

export default validateDto;
