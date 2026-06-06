/**
 * ==================================
 * eLISAschool - DTOs Classes
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createClasseSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().max(50).optional(),
    niveauId: z.string().uuid(),
    anneeScolaireId: z.string().uuid().optional(), // Si non fourni, utilise l'année active
    professeurPrincipalId: z.string().uuid().optional(),
    sallePrincipale: z.string().max(100).optional(),
    effectifMax: z.number().int().min(1).default(50),
    options: z.array(z.string()).optional(),
    actif: z.boolean().default(true),
});

export const updateClasseSchema = createClasseSchema.partial();

export const affecterEleveSchema = z.object({
    eleveId: z.string().uuid(),
    classeId: z.string().uuid(),
    dateAffectation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export type CreateClasseDto = z.infer<typeof createClasseSchema>;
export type UpdateClasseDto = z.infer<typeof updateClasseSchema>;
export type AffecterEleveDto = z.infer<typeof affecterEleveSchema>;

/**
 * Schéma de requête pour la liste des classes
 */
export const queryClassesSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        niveauId: z.string().uuid().optional(),
        anneeScolaireId: z.string().uuid().optional(),
        etablissementId: z.string().uuid().optional(),
        actif: z.string().transform((v) => v === 'true').optional(),
    });

export type QueryClassesDto = z.infer<typeof queryClassesSchema>;
