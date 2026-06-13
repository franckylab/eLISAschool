/**
 * ==================================
 * eLISAschool - DTOs Niveaux
 * ==================================
 */

import { z } from 'zod';
import { SousSysteme } from '@modules/etablissement/entities';

export const createNiveauSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().max(50).optional(),
    cycleId: z.string().uuid(),
    sousSysteme: z.nativeEnum(SousSysteme),
    ordre: z.number().int().min(1),
    actif: z.boolean().default(true),
});

export const updateNiveauSchema = createNiveauSchema.partial();

export const queryNiveauxSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    cycleId: z.string().uuid().optional(),
    sousSysteme: z.nativeEnum(SousSysteme).optional(),
    actif: z.coerce.boolean().optional(),
    estClasseExamen: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateNiveauDto = z.infer<typeof createNiveauSchema>;
export type UpdateNiveauDto = z.infer<typeof updateNiveauSchema>;
export type QueryNiveauxDto = z.infer<typeof queryNiveauxSchema>;
