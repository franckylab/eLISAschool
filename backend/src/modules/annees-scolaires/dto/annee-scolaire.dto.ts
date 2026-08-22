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
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const queryAnneesScolairesSchema = paginationWithSortSchema.merge(searchSchema).extend({
    statut: z.nativeEnum(StatutAnneeScolaire).optional(),
    etablissementId: z.string().uuid().optional(),
});

export const updateAnneeScolaireSchema = createAnneeScolaireSchema.partial();

export type CreateAnneeScolaireDto = z.infer<typeof createAnneeScolaireSchema>;
export type UpdateAnneeScolaireDto = z.infer<typeof updateAnneeScolaireSchema>;
