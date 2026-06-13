/**
 * ==================================
 * eLISAschool - DTOs Specialites
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createSpecialiteSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().min(2).max(50),
    description: z.string().optional(),
    filiereId: z.string().uuid(),
    ordre: z.number().int().min(1).default(1),
    actif: z.boolean().default(true),
});

export const updateSpecialiteSchema = createSpecialiteSchema.partial();

export const querySpecialitesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    filiereId: z.string().uuid().optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateSpecialiteDto = z.infer<typeof createSpecialiteSchema>;
export type UpdateSpecialiteDto = z.infer<typeof updateSpecialiteSchema>;
export type QuerySpecialitesDto = z.infer<typeof querySpecialitesSchema>;
