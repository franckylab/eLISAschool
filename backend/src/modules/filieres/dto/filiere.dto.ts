/**
 * ==================================
 * eLISAschool - DTOs Filières
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createFiliereSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().min(1).max(50),
    description: z.string().optional(),
    cycleId: z.string().uuid(),
    sousSysteme: z.enum(['FRANCOPHONE', 'ANGLOPHONE', 'BICULTUREL']).default('FRANCOPHONE'),
    ordre: z.number().int().min(0).default(1),
    coefficientFrais: z.number().min(0).max(10).default(0),
    actif: z.boolean().default(true),
});

export const updateFiliereSchema = createFiliereSchema.partial();

export const queryFilieresSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    cycleId: z.string().uuid().optional(),
    sousSysteme: z.enum(['FRANCOPHONE', 'ANGLOPHONE', 'BICULTUREL']).optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('nom').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateFiliereDto = z.infer<typeof createFiliereSchema>;
export type UpdateFiliereDto = z.infer<typeof updateFiliereSchema>;
export type QueryFilieresDto = z.infer<typeof queryFilieresSchema>;
