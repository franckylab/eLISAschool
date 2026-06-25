/**
 * ==================================
 * eLISAschool - DTOs Apparence (Fonds)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { CategorieFond } from '../entities';

/**
 * Schéma pour ajouter un fond à un établissement
 */
export const ajouterFondSchema = z.object({
    fondId: z.string().uuid('ID du fond invalide'),
    ordre: z.number().int().min(0).optional().default(0),
});

export type AjouterFondDto = z.infer<typeof ajouterFondSchema>;

/**
 * Schéma pour modifier un fond d'un établissement
 */
export const modifierFondEtablissementSchema = z.object({
    actif: z.boolean().optional(),
    ordre: z.number().int().min(0).optional(),
});

export type ModifierFondEtablissementDto = z.infer<typeof modifierFondEtablissementSchema>;

/**
 * Schéma pour la configuration de rotation
 */
export const configRotationSchema = z.object({
    actif: z.boolean(),
    delaiRotation: z
        .number()
        .int()
        .min(10, 'Le délai minimum est de 10 secondes')
        .max(700000, 'Le délai maximum est de 700000 secondes (~8 jours)'),
});

export type ConfigRotationDto = z.infer<typeof configRotationSchema>;

/**
 * Schéma pour l'upload de fond personnalisé
 */
export const uploadFondSchema = z.object({
    nom: z.string().min(2).max(100, 'Nom trop long'),
    description: z.string().max(255).optional(),
    categorie: z.nativeEnum(CategorieFond),
    fichier: z.string(), // base64 ou chemin
});

export type UploadFondDto = z.infer<typeof uploadFondSchema>;

/**
 * Schéma pour filtrer le catalogue
 */
export const filterCatalogueSchema = z.object({
    categorie: z.nativeEnum(CategorieFond).optional(),
    estActif: z.boolean().optional(),
    source: z.enum(['catalogue', 'upload']).optional(),
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(36),
});

export type FilterCatalogueDto = z.infer<typeof filterCatalogueSchema>;
