/**
 * ==================================
 * eLISAschool - DTOs Etablissement
 * ==================================
 */

import { z } from 'zod';
import { SousSysteme, TypeEtablissement, CycleScolaire } from '../entities/etablissement.entity';

export const updateEtablissementSchema = z.object({
    nom: z.string().min(3).max(255).optional(),
    slogan: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    sousSysteme: z.nativeEnum(SousSysteme).optional(),
    type: z.nativeEnum(TypeEtablissement).optional(),
    cyclesActifs: z.array(z.nativeEnum(CycleScolaire)).optional(),
    numeroArrete: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactTelephone: z.string().optional(),
    adresse: z.string().optional(),
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

export type UpdateEtablissementDto = z.infer<typeof updateEtablissementSchema>;
