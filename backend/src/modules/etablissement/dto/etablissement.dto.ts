/**
 * ==================================
 * eLISAschool - DTOs Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { SousSysteme, TypeEtablissement } from '../entities/etablissement.entity';

/**
 * Schéma de création d'un établissement
 */
export const createEtablissementSchema = z.object({
    // Informations de base
    nom: z.string().min(3).max(255),
    codeEtablissement: z.string().max(50).optional(),
    slogan: z.string().max(500).optional(),
    
    // Logo établissement (v3.0)
    logoBase64: z.string().regex(/^data:image\/(png|jpeg|jpg|svg\+xml|webp);base64,/).max(1500000).optional().or(z.literal('')), // Max ~1MB base64
    logoType: z.enum(['png', 'jpg', 'jpeg', 'svg', 'webp']).optional(),
    logoTaille: z.number().int().positive().max(1048576).optional(), // Max 1MB en octets
    
    // Classification
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    type: z.nativeEnum(TypeEtablissement).default(TypeEtablissement.LAIC),
    
    // Identification légale
    numeroArrete: z.string().max(255).optional(),
    numeroContribuable: z.string().max(50).optional(),
    numeroCompteBancaire: z.string().max(50).optional(),
    
    // Contact
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactTelephone: z.string().max(255).optional(),
    adresse: z.string().optional(),
    siteWeb: z.string().url().max(255).optional().or(z.literal('')),
    
    // Réseaux sociaux
    facebook: z.string().max(255).optional(),
    twitter: z.string().max(255).optional(),
    
    // Horaires
    heuresOuverture: z.string().max(10).optional(), // Format: "07:30"
    heuresFermeture: z.string().max(10).optional(), // Format: "17:00"
    
    // Capacité
    effectifMax: z.number().int().min(1).optional(),
    
    // Direction
    directeurNom: z.string().max(200).optional(),
    directeurAdjointNom: z.string().max(200).optional(),
    censeurNom: z.string().max(200).optional(),
    surveillantGeneralNom: z.string().max(200).optional(),
    
    // Couleurs et personnalisation visuelle
    couleurPrimaire: z.string().max(20).optional().or(z.literal('')),
    couleurSecondaire: z.string().max(20).optional().or(z.literal('')),
    
    // Paramètres régionaux (v3.0)
    langueDefaut: z.enum(['fr', 'en', 'pt']).default('fr').optional(),
    devise: z.enum(['XAF', 'XOF', 'EUR', 'USD', 'NGN']).default('XAF').optional(),
    fuseauHoraire: z.string().max(50).default('Africa/Douala').optional(), // Format IANA timezone
});

/**
 * Schéma de mise à jour d'un établissement
 */
export const updateEtablissementSchema = createEtablissementSchema.partial().extend({
    actif: z.boolean().optional(),
});

/**
 * Schéma de mise à jour de la configuration d'un établissement
 */
export const updateEtablissementConfigSchema = z.object({
    // Cycles actifs
    cyclesActifs: z.array(z.string().uuid()).optional(),
    
    // Configuration du bulletin
    configurationBulletin: z.object({
        style: z.enum(['moderne', 'classique']).optional(),
        couleurPrimaire: z.string().optional(),
        afficherRang: z.boolean().optional(),
        afficherMoyenneGenerale: z.boolean().optional(),
        afficherAppreciation: z.boolean().optional(),
        afficherPhoto: z.boolean().optional(),
        afficherCourbeProgression: z.boolean().optional(),
    }).optional(),
    
    // Thème et personnalisation
    couleurPrimaire: z.string().max(10).optional(),
    couleurSecondaire: z.string().max(10).optional(),
    couleurAccent: z.string().max(10).optional(),
    theme: z.enum(['default', 'dark', 'cameroon']).optional(),
    
    // Paramètres régionaux
    langueDefaut: z.string().max(10).optional(),
    devise: z.string().max(10).optional(),
    fuseauHoraire: z.string().max(50).optional(),
    messageAccueil: z.string().optional(),
    
    // Modules actifs
    modulesActifs: z.record(z.string(), z.boolean()).optional(),
    
    // Quotas et limites
    maxEleves: z.number().int().min(1).optional(),
    maxUtilisateurs: z.number().int().min(1).optional(),
    maxClasses: z.number().int().min(1).optional(),
    stockageMaxMB: z.number().int().min(1).optional(),
    planAbonnement: z.enum(['gratuit', 'standard', 'premium', 'entreprise']).optional(),
    dateExpirationAbonnement: z.string().datetime().optional(),
});

export type CreateEtablissementDto = z.infer<typeof createEtablissementSchema>;
export type UpdateEtablissementDto = z.infer<typeof updateEtablissementSchema>;
export type UpdateEtablissementConfigDto = z.infer<typeof updateEtablissementConfigSchema>;
