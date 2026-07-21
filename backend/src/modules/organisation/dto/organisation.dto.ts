/**
 * ==================================
 * eLISAschool - DTOs Organisation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Schémas de validation Zod pour le module Organisation
 */

import { z } from 'zod';

// ==================== Unité Organisationnelle ====================

export const createUniteOrganisationnelleSchema = z.object({
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    type: z.enum([
        'DIRECTION',
        'DEPARTEMENT',
        'SERVICE',
        'UNITE_PEDAGOGIQUE',
        'COMMISSION',
        'EQUIPE',
        'AUTRE',
    ]),
    code: z.string().min(2).max(50),
    etablissementId: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    ordre: z.number().int().min(0).default(0),
    responsableNom: z.string().max(200).optional(),
    responsableId: z.string().uuid().optional(),
    localisation: z.string().max(100).optional(),
    telephone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    metadata: z.record(z.any()).optional(),
});

export const updateUniteOrganisationnelleSchema = createUniteOrganisationnelleSchema.partial().omit({
    code: true, // Le code ne peut pas être modifié
    etablissementId: true, // L'établissement ne peut pas être changé
});

export type CreateUniteOrganisationnelleDto = z.infer<typeof createUniteOrganisationnelleSchema>;
export type UpdateUniteOrganisationnelleDto = z.infer<typeof updateUniteOrganisationnelleSchema>;

// ==================== Hierarchie Personnel ====================

export const createHierarchiePersonnelSchema = z.object({
    personnelId: z.string().uuid(),
    personnelNom: z.string().min(2).max(200),
    superieurId: z.string().uuid(),
    superieurNom: z.string().min(2).max(200),
    typeRelation: z.enum([
        'SUPERVISE_DIRECT',
        'SUPERVISE_INDIRECT',
        'RATTACHEMENT_FONCTIONNEL',
        'COLLABORATION',
        'REPLACEMENT',
        'INTERIM',
    ]).default('SUPERVISE_DIRECT'),
    posteId: z.string().uuid().optional(),
    posteIntitule: z.string().max(100).optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    uniteNom: z.string().max(100).optional(),
    etablissementId: z.string().uuid(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    commentaire: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export const updateHierarchiePersonnelSchema = createHierarchiePersonnelSchema.partial();

export type CreateHierarchiePersonnelDto = z.infer<typeof createHierarchiePersonnelSchema>;
export type UpdateHierarchiePersonnelDto = z.infer<typeof updateHierarchiePersonnelSchema>;

// ==================== DTOs pour requêtes ====================

export const filtreUnitesSchema = z.object({
    type: z.enum([
        'DIRECTION',
        'DEPARTEMENT',
        'SERVICE',
        'UNITE_PEDAGOGIQUE',
        'COMMISSION',
        'EQUIPE',
        'AUTRE',
    ]).optional(),
    actif: z.boolean().optional(),
    parentId: z.string().uuid().optional(),
    etablissementId: z.string().uuid().optional(),
});

export type FiltreUnitesDto = z.infer<typeof filtreUnitesSchema>;
