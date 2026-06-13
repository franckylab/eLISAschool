/**
 * ==================================
 * eLISAschool - DTOs Diplomes-Eleves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createDiplomeEleveSchema = z.object({
    eleveId: z.string().uuid(),
    examenNationalId: z.string().uuid(),
    noteObtenue: z.number().min(0).max(20).optional(),
    mention: z.string().max(50).optional(),
    resultat: z.enum(['ADMIS', 'REFUSE', 'AJOURNE']),
    dateObtention: z.string(),
    numeroDiplome: z.string().max(100).optional(),
    observations: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
});

export const updateDiplomeEleveSchema = createDiplomeEleveSchema.partial();

export const queryDiplomesElevesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    eleveId: z.string().uuid().optional(),
    examenNationalId: z.string().uuid().optional(),
    resultat: z.enum(['ADMIS', 'REFUSE', 'AJOURNE']).optional(),
    anneeObtention: z.coerce.number().int().optional(),
    sortBy: z.string().default('dateObtention').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC').optional(),
});

export type CreateDiplomeEleveDto = z.infer<typeof createDiplomeEleveSchema>;
export type UpdateDiplomeEleveDto = z.infer<typeof updateDiplomeEleveSchema>;
export type QueryDiplomesElevesDto = z.infer<typeof queryDiplomesElevesSchema>;
