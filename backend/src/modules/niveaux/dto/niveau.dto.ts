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

export type CreateNiveauDto = z.infer<typeof createNiveauSchema>;
export type UpdateNiveauDto = z.infer<typeof updateNiveauSchema>;
