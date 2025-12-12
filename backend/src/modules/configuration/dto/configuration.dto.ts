/**
 * ==================================
 * eLISAschool - DTOs Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';

/**
 * Schéma de mise à jour de la configuration app
 */
export const updateConfigAppSchema = z.object({
    nomEtablissement: z.string().max(255).optional(),
    typeEtablissement: z.enum(['MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'MIXTE']).optional(),
    adresseEtablissement: z.string().max(500).optional(),
    villeEtablissement: z.string().max(100).optional(),
    paysEtablissement: z.string().max(100).optional(),
    telephoneEtablissement: z.string().max(20).optional(),
    emailEtablissement: z.string().email().max(255).optional(),
    siteWebEtablissement: z.string().url().max(255).optional().nullable(),
    numeroAdministratif: z.string().max(100).optional(),
    sloganEtablissement: z.string().max(255).optional(),
    logoUrl: z.string().max(500).optional(),
    messageAccueil: z.string().max(500).optional(),
    langueDefaut: z.enum(['fr', 'en']).optional(),
    devise: z.enum(['XOF', 'XAF', 'EUR', 'USD']).optional(),
    fuseauHoraire: z.string().max(50).optional(),
    couleurPrimaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    couleurSecondaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    couleurAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    theme: z.enum(['default', 'dark', 'cameroon']).optional(),
});

/**
 * Schéma d'activation de licence
 */
export const activerLicenceSchema = z.object({
    licenceKey: z.string().min(10, 'Clé de licence invalide'),
});

/**
 * Schéma de champ personnalisé
 */
export const champPersonnaliseSchema = z.object({
    nom: z.string().min(1).max(100),
    label: z.string().min(1).max(255),
    type: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea']),
    required: z.boolean().default(false),
    visible: z.boolean().default(true),
    ordre: z.number().int().min(0),
    options: z.array(z.string()).optional(),
    defaultValue: z.any().optional(),
    validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
    }).optional(),
});

/**
 * Schéma de widget
 */
export const widgetConfigSchema = z.object({
    id: z.string(),
    nom: z.string().min(1).max(100),
    type: z.string().min(1).max(50),
    visible: z.boolean().default(true),
    ordre: z.number().int().min(0),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    taille: z.object({
        width: z.number().min(1),
        height: z.number().min(1),
    }),
    config: z.record(z.any()).optional(),
});

/**
 * Schéma de mise à jour de configuration module
 */
export const updateConfigModuleSchema = z.object({
    champsPersonnalises: z.array(champPersonnaliseSchema).optional(),
    widgets: z.array(widgetConfigSchema).optional(),
    parametres: z.record(z.any()).optional(),
    actif: z.boolean().optional(),
});

// Types inférés
export type UpdateConfigAppDto = z.infer<typeof updateConfigAppSchema>;
export type ActiverLicenceDto = z.infer<typeof activerLicenceSchema>;
export type ChampPersonnaliseDto = z.infer<typeof champPersonnaliseSchema>;
export type WidgetConfigDto = z.infer<typeof widgetConfigSchema>;
export type UpdateConfigModuleDto = z.infer<typeof updateConfigModuleSchema>;

export default {
    updateConfigAppSchema,
    activerLicenceSchema,
    updateConfigModuleSchema,
};
