/**
 * ==================================
 * eLISAschool - Validation DTO utilitaire
 * ==================================
 * Version: 2.0.0
 * 
 * Fonction utilitaire pour valider les DTOs avec Zod
 */

import { z, ZodSchema } from 'zod';
import { AppError } from '@common/filters/error.filter';

/**
 * Valide et parse un DTO avec Zod
 * @param schema Le schéma Zod à utiliser
 * @param data Les données à valider
 * @returns Les données validées et typées
 * @throws AppError si la validation échoue
 */
export function validateDto<T extends ZodSchema>(schema: T, data: unknown): z.infer<T> {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(
                `Validation échouée: ${messages}`,
                400,
                'VALIDATION_ERROR'
            );
        }
        throw error;
    }
}

export default validateDto;
