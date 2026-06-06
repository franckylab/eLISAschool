/**
 * ==================================
 * eLISAschool - DTOs Configuration Établissement
 * ==================================
 * Version: 1.0.0
 * 
 * DTOs pour la gestion de la configuration par établissement
 */

import { z } from 'zod';

/**
 * Schéma pour mettre à jour la configuration d'un établissement
 */
export const updateEtablissementConfigSchema = z.object({
    // Thème et personnalisation
    couleurPrimaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    couleurSecondaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    couleurAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    theme: z.enum(['default', 'dark', 'cameroon']).optional(),
    
    // Paramètres régionaux
    langueDefaut: z.enum(['fr', 'en', 'pt']).optional(),
    devise: z.enum(['XOF', 'XAF', 'EUR', 'USD']).optional(),
    fuseauHoraire: z.string().max(50).optional(),
    messageAccueil: z.string().max(500).optional(),
    
    // Modules
    modulesActifs: z.record(z.boolean()).optional(),
    
    // Quotas et limites (plans SaaS)
    maxEleves: z.number().int().min(0).optional(),
    maxUtilisateurs: z.number().int().min(0).optional(),
    maxClasses: z.number().int().min(0).optional(),
    stockageMaxMB: z.number().int().min(0).optional(),
    dateExpirationAbonnement: z.string().datetime().optional(),
    planAbonnement: z.enum(['gratuit', 'standard', 'premium', 'entreprise']).optional(),
});

/**
 * Schéma pour la réponse complète de configuration
 */
export const configurationCompleteSchema = z.object({
    etablissement: z.object({
        id: z.string().uuid(),
        nom: z.string(),
        type: z.string(),
        sousSysteme: z.string(),
        logoUrl: z.string().nullable(),
        slogan: z.string().nullable(),
    }),
    config: z.object({
        id: z.string().uuid(),
        cyclesActifs: z.array(z.string()),
        configurationBulletin: z.any().nullable(),
        couleurPrimaire: z.string().nullable(),
        couleurSecondaire: z.string().nullable(),
        couleurAccent: z.string().nullable(),
        theme: z.string(),
        langueDefaut: z.string(),
        devise: z.string(),
        fuseauHoraire: z.string(),
        messageAccueil: z.string().nullable(),
        modulesActifs: z.record(z.boolean()),
        maxEleves: z.number().nullable(),
        maxUtilisateurs: z.number().nullable(),
        maxClasses: z.number().nullable(),
        stockageMaxMB: z.number().nullable(),
        dateExpirationAbonnement: z.string().nullable(),
        planAbonnement: z.string(),
    }),
    parametres: z.array(z.object({
        cle: z.string(),
        valeur: z.any(),
        etablissementId: z.string().uuid().nullable(),
    })),
});

/**
 * Schéma pour dupliquer la configuration d'un établissement
 */
export const duplicateConfigSchema = z.object({
    sourceEtablissementId: z.string().uuid(),
    inclureParametres: z.boolean().default(true),
    inclureModules: z.boolean().default(true),
    inclureQuotas: z.boolean().default(true),
});

/**
 * Schéma pour comparer deux configurations
 */
export const compareConfigSchema = z.object({
    etablissementAId: z.string().uuid(),
    etablissementBId: z.string().uuid(),
});

// Types inférés
export type UpdateEtablissementConfigDto = z.infer<typeof updateEtablissementConfigSchema>;
export type ConfigurationCompleteDto = z.infer<typeof configurationCompleteSchema>;
export type DuplicateConfigDto = z.infer<typeof duplicateConfigSchema>;
export type CompareConfigDto = z.infer<typeof compareConfigSchema>;

export default {
    updateEtablissementConfigSchema,
    configurationCompleteSchema,
    duplicateConfigSchema,
    compareConfigSchema,
};
