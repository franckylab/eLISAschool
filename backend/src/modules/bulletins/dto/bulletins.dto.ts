/**
 * ==================================
 * eLISAschool - DTOs Bulletins
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

export const generateBulletinSchema = z.object({
    classeAnneeId: z.string().uuid(),
    periodeId: z.string().uuid(),
    eleveId: z.string().uuid().optional(), // Si null, génère pour toute la classe
});

export const updateBulletinSchema = z.object({
    appreciationConseil: z.string().optional(),
    sanctions: z.array(z.string()).optional(),
    encouragements: z.array(z.string()).optional(),
    publie: z.boolean().optional(),
});

export type GenerateBulletinDto = z.infer<typeof generateBulletinSchema>;
export type UpdateBulletinDto = z.infer<typeof updateBulletinSchema>;

/**
 * Schéma de requête pour la liste des bulletins
 */
export const queryBulletinsSchema = paginationSchema.extend({
    eleveId: z.string().uuid().optional(),
    classeAnneeId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    publie: z.string().transform((v) => v === 'true').optional(),
    recherche: z.string().max(255).optional(),
});

export type QueryBulletinsDto = z.infer<typeof queryBulletinsSchema>;
