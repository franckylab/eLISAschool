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
    utilisateurId: z.string().uuid().optional(),
    typePersonnelId: z.string().uuid().optional(),
    matricule: z.string().min(2).max(50),
    dateEmbauche: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).default('ACTIF'),
    specialites: z.array(z.string()).optional(),
    diplomes: z.string().optional(),
    // Infos personnelles dénormalisées
    nom: z.string().max(100).optional(),
    prenom: z.string().max(100).optional(),
    dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sexe: z.enum(['M', 'F']).optional(),
    email: z.string().email().max(255).optional(),
    telephone: z.string().max(50).optional(),
    adresse: z.string().optional(),
    departement: z.string().max(200).optional(),
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
        typeCode: z.string().max(50).optional(),
        etablissementId: z.string().uuid().optional(),
        statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).optional(),
        actif: z.coerce.boolean().optional(),
    });

export type QueryPersonnelDto = z.infer<typeof queryPersonnelSchema>;
