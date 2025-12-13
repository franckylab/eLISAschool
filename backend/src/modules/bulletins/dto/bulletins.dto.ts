/**
 * ==================================
 * eLISAschool - DTOs Bulletins
 * ==================================
 */

import { z } from 'zod';

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
