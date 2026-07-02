/**
 * ==================================
 * eLISAschool - DTOs Années Scolaires
 * ==================================
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';
import { StatutAnneeScolaire } from '../entities';

export const createAnneeScolaireSchema = z.object({
    libelle: z.string().min(2, "Le libellé est requis").max(50),
    code: z.string().max(50).optional(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    enCours: z.boolean().default(false),
});

export const queryAnneesScolairesSchema = paginationWithSortSchema.merge(searchSchema).extend({
    statut: z.nativeEnum(StatutAnneeScolaire).optional(),
    enCours: z.coerce.boolean().optional(),
    etablissementId: z.string().uuid().optional(),
});

export const updateAnneeScolaireSchema = createAnneeScolaireSchema.partial();

export type CreateAnneeScolaireDto = z.infer<typeof createAnneeScolaireSchema>;
export type UpdateAnneeScolaireDto = z.infer<typeof updateAnneeScolaireSchema>;
