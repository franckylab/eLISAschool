/**
 * ==================================
 * eLISAschool - DTOs Heure de Cours
 * ==================================
 * Version: 1.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createHeureCoursSchema = z.object({
    enseignantId: z.string().uuid(),
    classeId: z.string().uuid(),
    matiereId: z.string().uuid(),
    periodeId: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    heureDebut: z.string().regex(/^\d{2}:\d{2}$/),
    heureFin: z.string().regex(/^\d{2}:\d{2}$/),
    statutEffectue: z.enum(['PLANIFIE', 'EFFECTUE', 'ANNULE', 'REMPLACE']).default('PLANIFIE'),
    salle: z.string().optional(),
    remplacantId: z.string().uuid().optional(),
});

export const updateHeureCoursSchema = createHeureCoursSchema.partial();

export const queryHeureCoursSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        enseignantId: z.string().uuid().optional(),
        classeId: z.string().uuid().optional(),
        matiereId: z.string().uuid().optional(),
        dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        statutEffectue: z.enum(['PLANIFIE', 'EFFECTUE', 'ANNULE', 'REMPLACE']).optional(),
    });

export type CreateHeureCoursDto = z.infer<typeof createHeureCoursSchema>;
export type UpdateHeureCoursDto = z.infer<typeof updateHeureCoursSchema>;
export type QueryHeureCoursDto = z.infer<typeof queryHeureCoursSchema>;
