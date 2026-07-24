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
    description: z.string().max(200).optional(),
});

export const createPersonnelSchema = z.object({
    utilisateurId: z.string().uuid().optional(),
    typePersonnelId: z.string().uuid().optional(),
    matricule: z.string().min(2).max(50),
    dateEmbauche: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).default('ACTIF'),
    specialites: z.array(z.string()).optional(),
    diplomes: z.string().optional(),
    departement: z.string().max(200).optional(),
    specialitePrincipale: z.string().max(200).optional(),
    anneesExperience: z.number().int().positive().optional(),
    educationNiveau: z.enum(['LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE']).optional(),
});

export const updatePersonnelSchema = createPersonnelSchema.partial().omit({ utilisateurId: true });

export const updateTypePersonnelSchema = createTypePersonnelSchema.partial().extend({
    actif: z.boolean().optional(),
    estSysteme: z.boolean().optional(),
});

export type CreateTypePersonnelDto = z.infer<typeof createTypePersonnelSchema>;
export type UpdateTypePersonnelDto = z.infer<typeof updateTypePersonnelSchema>;
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

// ─── Inline Edit Schemas ───

export const updateStatutSchema = z.object({
    statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']),
});

export const updateTypePersonnelMembreSchema = z.object({
    typePersonnelId: z.string().uuid(),
});

export const updateDateEntreeSchema = z.object({
    dateEmbauche: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateCompetencesSchema = z.object({
    specialites: z.array(z.string()).optional(),
    diplomes: z.string().optional(),
    specialitePrincipale: z.string().max(200).optional(),
    competences: z.array(z.string()).optional(),
    educationNiveau: z.enum(['LICENCE', 'MASTER', 'DOCTORAT', 'AUTRE']).optional(),
    anneesExperience: z.number().int().positive().optional(),
});

// ─── Link/Unlink User ───

export const linkUtilisateurSchema = z.object({
    utilisateurId: z.string().uuid(),
});

export type LinkUtilisateurDto = z.infer<typeof linkUtilisateurSchema>;

export type QueryPersonnelDto = z.infer<typeof queryPersonnelSchema>;
