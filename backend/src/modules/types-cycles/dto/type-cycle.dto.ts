/**
 * ==================================
 * eLISAschool - DTOs Types-Cycles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createTypeCycleSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().min(2).max(50),
    description: z.string().optional(),
    dureeAnnees: z.number().int().min(1).max(20).default(0),
    ordre: z.number().int().min(1).default(1),
    diplomeSanctionnant: z.string().max(50).optional(),
    actif: z.boolean().default(true),
});

export const updateTypeCycleSchema = createTypeCycleSchema.partial();

export const queryTypesCyclesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateTypeCycleDto = z.infer<typeof createTypeCycleSchema>;
export type UpdateTypeCycleDto = z.infer<typeof updateTypeCycleSchema>;
export type QueryTypesCyclesDto = z.infer<typeof queryTypesCyclesSchema>;
