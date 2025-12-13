/**
 * ==================================
 * eLISAschool - DTOs Cycles
 * ==================================
 */

import { z } from 'zod';
import { CycleScolaire } from '@modules/etablissement/entities';

export const createCycleSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.nativeEnum(CycleScolaire),
    ordre: z.number().int().min(1),
    actif: z.boolean().default(true),
});

export const updateCycleSchema = createCycleSchema.partial();

export type CreateCycleDto = z.infer<typeof createCycleSchema>;
export type UpdateCycleDto = z.infer<typeof updateCycleSchema>;
