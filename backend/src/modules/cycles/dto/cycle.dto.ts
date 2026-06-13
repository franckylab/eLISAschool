/**
 * ==================================
 * eLISAschool - DTOs Cycles (Mis à jour)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * DTOs mis à jour pour supporter typeCycleId au lieu de CycleScolaire enum
 */

import { z } from 'zod';

export const createCycleSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().min(2).max(50),
    typeCycleId: z.string().uuid().optional(),
    ordre: z.number().int().min(1).default(1),
    actif: z.boolean().default(true),
});

export const updateCycleSchema = createCycleSchema.partial();

export const queryCyclesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateCycleDto = z.infer<typeof createCycleSchema>;
export type UpdateCycleDto = z.infer<typeof updateCycleSchema>;
export type QueryCyclesDto = z.infer<typeof queryCyclesSchema>;
