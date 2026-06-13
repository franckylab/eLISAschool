/**
 * ==================================
 * eLISAschool - DTOs Examens-Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createExamenNationalSchema = z.object({
    nom: z.string().min(2).max(150),
    code: z.string().min(2).max(50),
    type: z.enum(['NATIONAL', 'REGIONAL', 'INTERNATIONAL']),
    niveauId: z.string().uuid(),
    dateProgrammation: z.string().optional(),
    coefficient: z.number().min(0).optional(),
    estObligatoire: z.boolean().default(true),
    diplomeDelivre: z.string().max(100).optional(),
    description: z.string().optional(),
    sousSysteme: z.enum(['FRANCOPHONE', 'ANGLOPHONE']).default('FRANCOPHONE'),
    actif: z.boolean().default(true),
});

export const updateExamenNationalSchema = createExamenNationalSchema.partial();

export const queryExamensNationauxSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    niveauId: z.string().uuid().optional(),
    type: z.enum(['NATIONAL', 'REGIONAL', 'INTERNATIONAL']).optional(),
    sousSysteme: z.enum(['FRANCOPHONE', 'ANGLOPHONE']).optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('nom').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateExamenNationalDto = z.infer<typeof createExamenNationalSchema>;
export type UpdateExamenNationalDto = z.infer<typeof updateExamenNationalSchema>;
export type QueryExamensNationauxDto = z.infer<typeof queryExamensNationauxSchema>;
