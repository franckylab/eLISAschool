/**
 * ==================================
 * eLISAschool - DTOs Personnel
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createTypePersonnelSchema = z.object({
    code: z.string().min(2).max(50),
    nom: z.string().min(2).max(100),
    permissionsDefaut: z.array(z.string()).optional(),
});

export const createPersonnelSchema = z.object({
    utilisateurId: z.string().uuid(),
    typePersonnelId: z.string().uuid().optional(),
    matricule: z.string().min(2).max(50),
    dateEmbauche: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).default('ACTIF'),
    specialites: z.array(z.string()).optional(),
    diplomes: z.string().optional(),
});

export const updatePersonnelSchema = createPersonnelSchema.partial().omit({ utilisateurId: true });

export type CreateTypePersonnelDto = z.infer<typeof createTypePersonnelSchema>;
export type CreatePersonnelDto = z.infer<typeof createPersonnelSchema>;
export type UpdatePersonnelDto = z.infer<typeof updatePersonnelSchema>;

/**
 * Schéma de requête pour la liste du personnel
 */
export const queryPersonnelSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        typePersonnelId: z.string().uuid().optional(),
        etablissementId: z.string().uuid().optional(),
        statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).optional(),
    });

export type QueryPersonnelDto = z.infer<typeof queryPersonnelSchema>;
