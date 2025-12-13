/**
 * ==================================
 * eLISAschool - DTOs Périodes
 * ==================================
 */

import { z } from 'zod';

export const createTypePeriodeSchema = z.object({
    code: z.string().min(2).max(50),
    nom: z.string().min(2).max(100),
});

export const createPeriodeSchema = z.object({
    nom: z.string().min(2).max(100),
    typeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    ordre: z.number().int().min(1),
    poids: z.number().min(0).default(1),
});

export const updatePeriodeSchema = createPeriodeSchema.partial().extend({
    cloturee: z.boolean().optional(),
});

export type CreateTypePeriodeDto = z.infer<typeof createTypePeriodeSchema>;
export type CreatePeriodeDto = z.infer<typeof createPeriodeSchema>;
export type UpdatePeriodeDto = z.infer<typeof updatePeriodeSchema>;
