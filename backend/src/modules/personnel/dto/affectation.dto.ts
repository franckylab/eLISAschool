/**
 * ==================================
 * eLISAschool - DTOs Affectation Poste
 * ==================================
 * Version: 1.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createAffectationSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    posteId: z.string().uuid(),
    contratId: z.string().uuid().optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    typeMutation: z.enum(['NOUVELLE', 'PROMOTION', 'TRANSFERT', 'INTERIM', 'REINTEGRATION']).default('NOUVELLE'),
    salaireAssocie: z.coerce.number().positive().optional(),
    commentaire: z.string().optional(),
});

export const updateAffectationSchema = createAffectationSchema.partial().omit({ membrePersonnelId: true });

export const queryAffectationSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        membrePersonnelId: z.string().uuid().optional(),
        posteId: z.string().uuid().optional(),
        statut: z.enum(['ACTIF', 'TERMINE', 'EN_ATTENTE', 'SUSPENDU']).optional(),
        typeMutation: z.enum(['NOUVELLE', 'PROMOTION', 'TRANSFERT', 'INTERIM', 'REINTEGRATION']).optional(),
    });

export type CreateAffectationDto = z.infer<typeof createAffectationSchema>;
export type UpdateAffectationDto = z.infer<typeof updateAffectationSchema>;
export type QueryAffectationDto = z.infer<typeof queryAffectationSchema>;
