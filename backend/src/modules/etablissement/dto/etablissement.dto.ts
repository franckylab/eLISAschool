/**
 * ==================================
 * eLISAschool - DTOs Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { SousSysteme, TypeEtablissement, CycleScolaire } from '../entities/etablissement.entity';

/**
 * Schéma de création d'un établissement
 */
export const createEtablissementSchema = z.object({
    nom: z.string().min(3).max(255),
    slogan: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    type: z.nativeEnum(TypeEtablissement).default(TypeEtablissement.LAIC),
    numeroArrete: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactTelephone: z.string().optional(),
    adresse: z.string().optional(),
});

/**
 * Schéma de mise à jour d'un établissement
 */
export const updateEtablissementSchema = z.object({
    nom: z.string().min(3).max(255).optional(),
    slogan: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    sousSysteme: z.nativeEnum(SousSysteme).optional(),
    type: z.nativeEnum(TypeEtablissement).optional(),
    numeroArrete: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactTelephone: z.string().optional(),
    adresse: z.string().optional(),
    actif: z.boolean().optional(),
});

/**
 * Schéma de mise à jour de la configuration d'un établissement
 */
export const updateEtablissementConfigSchema = z.object({
    cyclesActifs: z.array(z.nativeEnum(CycleScolaire)).optional(),
    configurationBulletin: z.object({
        style: z.string().optional(),
        couleurPrimaire: z.string().optional(),
        afficherRang: z.boolean().optional(),
        afficherMoyenneGenerale: z.boolean().optional(),
        afficherAppreciation: z.boolean().optional(),
        afficherPhoto: z.boolean().optional(),
        afficherCourbeProgression: z.boolean().optional(),
    }).optional(),
});

export type CreateEtablissementDto = z.infer<typeof createEtablissementSchema>;
export type UpdateEtablissementDto = z.infer<typeof updateEtablissementSchema>;
export type UpdateEtablissementConfigDto = z.infer<typeof updateEtablissementConfigSchema>;
