/**
 * ==================================
 * eLISAschool - DTOs Postes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v2.0 : FK UUID directes, suppression champs obsolètes.
 */

import { z } from 'zod';

export const createPosteSchema = z.object({
    intitule: z.string().min(2).max(100),
    description: z.string().optional(),
    code: z.string().min(2).max(50),
    categoriePosteId: z.string().uuid().optional(), // FK vers CategoriePoste
    niveauResponsabiliteId: z.string().uuid().optional(), // FK vers NiveauResponsabilite
    fonctionId: z.string().uuid(), // FK vers Fonction (obligatoire)
    uniteOrganisationnelleId: z.string().uuid(),
    nombrePostes: z.number().int().min(1).default(1),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({
    code: true,
});

export const queryPostesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categoriePosteId: z.string().uuid().optional(),
    statut: z.enum(['ACTIF', 'VACANT', 'SUPPRIME', 'EN_ATTENTE']).optional(),
    fonctionId: z.string().uuid().optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    vacant: z.coerce.boolean().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreatePosteDto = z.infer<typeof createPosteSchema>;
export type UpdatePosteDto = z.infer<typeof updatePosteSchema>;
export type QueryPostesDto = z.infer<typeof queryPostesSchema>;
