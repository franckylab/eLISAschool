/**
 * ==================================
 * eLISAschool - DTOs Bulletins
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

export const generateBulletinSchema = z.object({
    classeId: z.string().uuid(),
    periodeId: z.string().uuid(),
    eleveId: z.string().uuid().optional(), // Si null, génère pour toute la classe
});

export const updateBulletinSchema = z.object({
    appreciationConseil: z.string().optional(),
    publie: z.boolean().optional(),
});

export type GenerateBulletinDto = z.infer<typeof generateBulletinSchema>;
export type UpdateBulletinDto = z.infer<typeof updateBulletinSchema>;

/**
 * Schéma de requête pour la liste des bulletins
 */
export const queryBulletinsSchema = paginationSchema.extend({
    eleveId: z.string().uuid().optional(),
    classeId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    anneeScolaireId: z.string().uuid().optional(),
    publie: z.string().transform((v) => v === 'true').optional(),
});

export type QueryBulletinsDto = z.infer<typeof queryBulletinsSchema>;
