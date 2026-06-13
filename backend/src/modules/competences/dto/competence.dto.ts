/**
 * ==================================
 * eLISAschool - DTOs Competences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

export const createCompetenceSchema = z.object({
    code: z.string().min(2).max(50),
    libelle: z.string().min(5).max(200),
    description: z.string().optional(),
    domaine: z.string().max(100),
    niveauId: z.string().uuid(),
    matiereId: z.string().uuid().optional(),
    ordre: z.number().int().min(1).default(1),
    actif: z.boolean().default(true),
});

export const updateCompetenceSchema = createCompetenceSchema.partial();

export const queryCompetencesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    niveauId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    domaine: z.string().optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateCompetenceDto = z.infer<typeof createCompetenceSchema>;
export type UpdateCompetenceDto = z.infer<typeof updateCompetenceSchema>;
export type QueryCompetencesDto = z.infer<typeof queryCompetencesSchema>;
