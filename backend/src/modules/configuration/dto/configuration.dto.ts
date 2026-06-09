/**
 * ==================================
 * eLISAschool - DTOs Configuration v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * DTOs étendus pour la configuration app, modules et paramètres système
 */

import { z } from 'zod';
import { CategorieParametre, TypeValeurParametre } from '../entities/parametre-systeme.entity';

// ============================================
// CONFIGURATION APPLICATION
// ============================================

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

export const activerLicenceSchema = z.object({
    licenceKey: z.string().min(10, 'Clé de licence invalide'),
});

// ============================================
// CONFIGURATION MODULES
// ============================================

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

export const widgetConfigSchema = z.object({
    id: z.string(),
    nom: z.string().min(1).max(100),
    type: z.string().min(1).max(50),
    visible: z.boolean().default(true),
    ordre: z.number().int().min(0),
    position: z.object({ x: z.number(), y: z.number() }),
    taille: z.object({ width: z.number().min(1), height: z.number().min(1) }),
    config: z.record(z.any()).optional(),
});

export const updateConfigModuleSchema = z.object({
    champsPersonnalises: z.array(champPersonnaliseSchema).optional(),
    widgets: z.array(widgetConfigSchema).optional(),
    parametres: z.record(z.any()).optional(),
    actif: z.boolean().optional(),
});

// ============================================
// PARAMÈTRES SYSTÈME
// ============================================

/**
 * Création d'un nouveau paramètre
 */
export const createParametreSchema = z.object({
    cle: z.string().min(3).max(255).regex(/^[a-z0-9_.]+$/, 'Format: module.nom_parametre'),
    valeur: z.any(),
    typeValeur: z.nativeEnum(TypeValeurParametre).optional(),
    categorie: z.nativeEnum(CategorieParametre).default(CategorieParametre.CUSTOM),
    module: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    modifiableRuntime: z.boolean().default(true),
    visible: z.boolean().default(true),
    ordre: z.number().int().min(0).default(0),
    validation: z.string().max(500).optional(),
    options: z.array(z.object({
        value: z.string(),
        label: z.string(),
    })).optional(),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Mise à jour d'un paramètre existant
 */
export const updateParametreSchema = z.object({
    valeur: z.any().optional(),
    description: z.string().max(500).optional(),
    visible: z.boolean().optional(),
    ordre: z.number().int().min(0).optional(),
    options: z.array(z.object({
        value: z.string(),
        label: z.string(),
    })).optional(),
});

/**
 * Mise à jour en masse de paramètres
 */
export const updateParametresBulkSchema = z.object({
    parametres: z.array(z.object({
        cle: z.string(),
        valeur: z.any(),
        etablissementId: z.string().uuid().optional(),
    })),
});

/**
 * Requête de liste des paramètres
 */
export const queryParametresSchema = z.object({
    categorie: z.nativeEnum(CategorieParametre).optional(),
    module: z.string().optional(),
    modifiableRuntime: z.boolean().optional(),
    visible: z.boolean().optional(),
    search: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Export/Import de configuration
 */
export const exportConfigSchema = z.object({
    includeApp: z.boolean().default(true),
    includeModules: z.boolean().default(true),
    includeParametres: z.boolean().default(true),
});

export const importConfigSchema = z.object({
    config: z.object({
        app: z.any().optional(),
        modules: z.array(z.any()).optional(),
        parametres: z.array(z.any()).optional(),
    }),
    overwrite: z.boolean().default(false),
});

/**
 * Schéma pour toggler l'activation d'un module
 */
export const toggleModuleSchema = z.object({
    actif: z.boolean({
        required_error: 'Le paramètre "actif" est requis et doit être un booléen',
        invalid_type_error: 'Le paramètre "actif" doit être un booléen',
    }),
});

/**
 * Schéma de réponse pour les dépendances d'un module
 */
export const moduleDependenciesSchema = z.object({
    moduleNom: z.string(),
    label: z.string(),
    dependances: z.array(z.object({
        nom: z.string(),
        label: z.string(),
        actif: z.boolean(),
        requis: z.boolean(),
    })),
    reverseDependances: z.array(z.object({
        nom: z.string(),
        label: z.string(),
        actif: z.boolean(),
    })),
    estActif: z.boolean(),
    peutEtreActive: z.boolean(),
    bloquages: z.array(z.string()),
});

// Types inférés
export type UpdateConfigAppDto = z.infer<typeof updateConfigAppSchema>;
export type ActiverLicenceDto = z.infer<typeof activerLicenceSchema>;
export type ChampPersonnaliseDto = z.infer<typeof champPersonnaliseSchema>;
export type WidgetConfigDto = z.infer<typeof widgetConfigSchema>;
export type UpdateConfigModuleDto = z.infer<typeof updateConfigModuleSchema>;
export type CreateParametreDto = z.infer<typeof createParametreSchema>;
export type UpdateParametreDto = z.infer<typeof updateParametreSchema>;
export type UpdateParametresBulkDto = z.infer<typeof updateParametresBulkSchema>;
export type QueryParametresDto = z.infer<typeof queryParametresSchema>;
export type ExportConfigDto = z.infer<typeof exportConfigSchema>;
export type ImportConfigDto = z.infer<typeof importConfigSchema>;
export type ToggleModuleDto = z.infer<typeof toggleModuleSchema>;
export type ModuleDependenciesDto = z.infer<typeof moduleDependenciesSchema>;

export default {
    updateConfigAppSchema,
    activerLicenceSchema,
    updateConfigModuleSchema,
    createParametreSchema,
    updateParametreSchema,
    updateParametresBulkSchema,
    queryParametresSchema,
    exportConfigSchema,
    importConfigSchema,
    toggleModuleSchema,
    moduleDependenciesSchema,
};
