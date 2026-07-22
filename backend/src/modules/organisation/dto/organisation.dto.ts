/**
 * ==================================
 * eLISAschool - DTOs Organisation
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Schémas de validation Zod pour le module Organisation.
 * Refonte v3.0 : types et relations via FK UUID (plus d'enum pour les types ouverts).
 */

import { z } from 'zod';

// ==================== Unité Organisationnelle ====================

export const createUniteOrganisationnelleSchema = z.object({
    nom: z.string().min(2).max(100),
    description: z.string().optional(),
    typeUniteId: z.string().uuid().optional(), // FK vers TypeUniteOrganisationnelle
    usageUniteId: z.string().uuid().optional(), // FK vers UsageUnite
    niveauOrganisationId: z.string().uuid().optional(), // FK vers NiveauOrganisation
    code: z.string().min(2).max(50),
    statut: z.enum(['ACTIF', 'EN_CREATION', 'EN_RESTRUCTURATION', 'ARCHIVE']).default('ACTIF'),
    etablissementId: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(), // nullable: null = détacher (racine)
    ordre: z.number().int().min(0).default(0),
    responsableNom: z.string().max(200).optional(),
    responsableId: z.string().uuid().optional(),
    localisation: z.string().max(100).optional(),
    telephone: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal('')),
});

export const updateUniteOrganisationnelleSchema = createUniteOrganisationnelleSchema.partial().omit({
    etablissementId: true, // L'établissement ne peut pas être changé
});

export type CreateUniteOrganisationnelleDto = z.infer<typeof createUniteOrganisationnelleSchema>;
export type UpdateUniteOrganisationnelleDto = z.infer<typeof updateUniteOrganisationnelleSchema>;

// ==================== Hierarchie Personnel ====================

export const createHierarchiePersonnelSchema = z.object({
    personnelId: z.string().uuid().optional(),
    personnelNom: z.string().min(2).max(200).optional(),
    superieurId: z.string().uuid().optional(),
    superieurNom: z.string().min(2).max(200).optional(),
    typeRelationId: z.string().uuid().optional(), // FK vers TypeRelationHierarchique
    statut: z.enum(['ACTIVE', 'HISTORIQUE', 'PLANIFIEE']).default('ACTIVE'),
    posteId: z.string().uuid().optional(),
    posteIntitule: z.string().max(100).optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    uniteNom: z.string().max(100).optional(),
    etablissementId: z.string().uuid().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    commentaire: z.string().optional(),
});

export const updateHierarchiePersonnelSchema = createHierarchiePersonnelSchema.partial();

export type CreateHierarchiePersonnelDto = z.infer<typeof createHierarchiePersonnelSchema>;
export type UpdateHierarchiePersonnelDto = z.infer<typeof updateHierarchiePersonnelSchema>;

// ==================== DTOs pour requêtes ====================

export const filtreUnitesSchema = z.object({
    typeUniteId: z.string().uuid().optional(), // FK vers TypeUniteOrganisationnelle
    actif: z.coerce.boolean().optional(),
    parentId: z.string().uuid().optional(),
    etablissementId: z.string().uuid().optional(),
    recherche: z.string().optional(),
});

export type FiltreUnitesDto = z.infer<typeof filtreUnitesSchema>;
