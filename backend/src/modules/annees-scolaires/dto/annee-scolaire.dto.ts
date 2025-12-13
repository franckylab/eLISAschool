/**
 * ==================================
 * eLISAschool - DTOs Années Scolaires
 * ==================================
 */

import { z } from 'zod';

export const createAnneeScolaireSchema = z.object({
    libelle: z.string().regex(/^\d{4}-\d{4}$/, "Format attendu: YYYY-YYYY"),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    enCours: z.boolean().default(false),
});

export const updateAnneeScolaireSchema = createAnneeScolaireSchema.partial().extend({
    cloturee: z.boolean().optional(),
});

export type CreateAnneeScolaireDto = z.infer<typeof createAnneeScolaireSchema>;
export type UpdateAnneeScolaireDto = z.infer<typeof updateAnneeScolaireSchema>;
