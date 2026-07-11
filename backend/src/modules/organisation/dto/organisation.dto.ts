/**
 * ==================================
 * eLISAschool - DTOs Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Schémas de validation Zod pour le module Organisation
 */

import { z } from 'zod';
import { TypeOrganisation, StatutOrganisation } from '../entities';

// ==================== Organisation ====================

export const createOrganisationSchema = z.object({
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    type: z.nativeEnum(TypeOrganisation).default(TypeOrganisation.ETABLISSEMENT_SCOLAIRE),
    logoUrl: z.string().url().optional().or(z.literal('')),
    code: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
    telephone: z.string().max(50).optional(),
    adresse: z.string().optional(),
    siteWeb: z.string().url().optional().or(z.literal('')),
    etablissementId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
});

export const updateOrganisationSchema = createOrganisationSchema.partial().omit({
    code: true, // Le code ne peut pas être modifié après création
});

export type CreateOrganisationDto = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationDto = z.infer<typeof updateOrganisationSchema>;

// ==================== Unité Organisationnelle ====================

export const createUniteOrganisationnelleSchema = z.object({
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    type: z.enum([
        'DIRECTION',
        'DEPARTEMENT',
        'SERVICE',
        'POLE',
        'FILIERE',
        'CYCLE',
        'SECTION',
        'COMMISSION',
        'EQUIPE',
        'AUTRE',
    ]),
    code: z.string().min(2).max(50),
    organisationId: z.string().uuid(),
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
    organisationId: true, // L'organisation ne peut pas être changée
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
        'POLE',
        'FILIERE',
        'CYCLE',
        'SECTION',
        'COMMISSION',
        'EQUIPE',
        'AUTRE',
    ]).optional(),
    actif: z.boolean().optional(),
    parentId: z.string().uuid().optional(),
    organisationId: z.string().uuid().optional(),
});

export type FiltreUnitesDto = z.infer<typeof filtreUnitesSchema>;
