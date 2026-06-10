/**
 * ==================================
 * eLISAschool - DTOs Type Contrat Personnalisé
 * ==================================
 * Version: 1.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createTypeContratSchema = z.object({
    code: z.string().min(2).max(50),
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    categorie: z.enum([
        'EMPLOI_PERMANENT',
        'EMPLOI_TEMPORAIRE',
        'STAGE_FORMATION',
        'FREELANCE',
        'TEMPS_PARTIEL',
        'APPRENTISSAGE',
        'AUTRE',
    ]).default('EMPLOI_PERMANENT'),
    renouvellementAutoDefaut: z.boolean().default(false),
    dureeMaxMois: z.coerce.number().int().positive().nullable().optional(),
    clausesDefaut: z.array(z.string()).optional(),
    avantagesDefaut: z.record(z.any()).optional(),
    ordre: z.coerce.number().int().default(0),
});

export const updateTypeContratSchema = createTypeContratSchema.partial().omit({ code: true });

export const queryTypeContratSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        categorie: z.enum([
            'EMPLOI_PERMANENT',
            'EMPLOI_TEMPORAIRE',
            'STAGE_FORMATION',
            'FREELANCE',
            'TEMPS_PARTIEL',
            'APPRENTISSAGE',
            'AUTRE',
        ]).optional(),
        actif: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
        estSysteme: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    });

export type CreateTypeContratDto = z.infer<typeof createTypeContratSchema>;
export type UpdateTypeContratDto = z.infer<typeof updateTypeContratSchema>;
export type QueryTypeContratDto = z.infer<typeof queryTypeContratSchema>;
