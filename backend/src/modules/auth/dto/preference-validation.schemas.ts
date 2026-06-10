/**
 * ==================================
 * eLISAschool - Schémas de Validation Stricte pour Préférences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Validation Zod stricte pour toutes les préférences utilisateur et globales
 */

import { z } from 'zod';
import { CategoriePreference } from '@modules/auth/entities/preference-utilisateur.entity';

/**
 * Schéma de validation pour une préférence utilisateur
 */
export const preferenceUtilisateurSchema = z.object({
    cle: z
        .string()
        .min(2, 'La clé doit avoir au moins 2 caractères')
        .max(100, 'La clé ne peut pas excéder 100 caractères')
        .regex(/^[a-z0-9._-]+$/, 'La clé ne peut contenir que des lettres minuscules, chiffres, points, tirets et underscores'),

    valeur: z.string({
        required_error: 'La valeur est requise',
    }),

    typeValeur: z.enum(['string', 'number', 'boolean', 'json'], {
        errorMap: () => ({ message: 'Type de valeur invalide' }),
    }),

    categorie: z.nativeEnum(CategoriePreference, {
        errorMap: () => ({ message: 'Catégorie invalide' }),
    }),

    estModifiableParUtilisateur: z.boolean().optional().default(true),
});

/**
 * Schéma pour créer une préférence utilisateur
 */
export const createPreferenceUtilisateurSchema = preferenceUtilisateurSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

/**
 * Schéma pour mettre à jour une préférence utilisateur
 */
export const updatePreferenceUtilisateurSchema = createPreferenceUtilisateurSchema.partial().extend({
    cle: z.string().min(2).max(100).optional(), // Clé non modifiable par défaut
});

/**
 * Schéma de validation pour une préférence globale
 */
export const preferenceGlobaleSchema = z.object({
    cle: z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9._-]+$/),

    valeur: z.string(),

    typeValeur: z.enum(['string', 'number', 'boolean', 'json']),

    categorie: z.nativeEnum(CategoriePreference),

    libelle: z
        .string()
        .min(5, 'Le libellé doit avoir au moins 5 caractères')
        .max(200, 'Le libellé ne peut pas excéder 200 caractères'),

    description: z.string().optional(),

    estModifiableParUtilisateur: z.boolean().default(true),

    ordre: z.number().int().min(0).default(0),

    metadata: z.record(z.any()).optional().nullable(),
});

/**
 * Schéma pour définir une préférence globale
 */
export const setPreferenceGlobaleSchema = z.object({
    cle: z.string().min(2).max(100),
    valeur: z.string(),
});

/**
 * Schéma pour réinitialiser une catégorie de préférences
 */
export const resetCategorieSchema = z.object({
    categorie: z.nativeEnum(CategoriePreference),
});

/**
 * Schéma pour importer des préférences
 */
export const importPreferencesSchema = z.object({
    jsonData: z.string({
        required_error: 'Les données JSON sont requises',
    }).refine((val, ctx) => {
        try {
            const parsed = JSON.parse(val);
            if (!parsed.preferences || !Array.isArray(parsed.preferences)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Le JSON doit contenir un tableau "preferences"',
                });
                return false;
            }
            return true;
        } catch {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'JSON invalide',
            });
            return false;
        }
    }),

    mode: z.enum(['merge', 'replace']).default('merge'),
});

/**
 * Schéma pour la configuration du dashboard
 */
export const dashboardConfigSchema = z.object({
    layout: z.array(z.object({
        id: z.string(),
        widget: z.string(),
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1).max(12),
        h: z.number().int().min(1).max(20),
        visible: z.boolean().default(true),
        ordre: z.number().int().min(0),
    })).default([]),

    widgetsActifs: z.array(z.string()).default([]),

    widgetsMasques: z.array(z.string()).default([]),

    widgetConfig: z.record(z.record(z.any())).default({}),

    themeDashboard: z.string().max(50).default('default'),

    nombreColonnes: z.number().int().min(1).max(6).default(3),

    tailleCartes: z.enum(['small', 'medium', 'large']).default('medium'),

    triParDefaut: z.enum(['alphabetique', 'personnalise', 'frequent']).default('personnalise'),

    afficherStatsRapides: z.boolean().default(true),

    afficherNotificationsRecents: z.boolean().default(true),

    nombreNotifications: z.number().int().min(1).max(50).default(5),

    refreshInterval: z.number().int().min(0).max(3600).default(60),
});

/**
 * Schéma pour mettre à jour partiellement le dashboard
 */
export const updateDashboardConfigSchema = dashboardConfigSchema.partial();

/**
 * Types inférés
 */
export type PreferenceUtilisateurDto = z.infer<typeof createPreferenceUtilisateurSchema>;
export type UpdatePreferenceUtilisateurDto = z.infer<typeof updatePreferenceUtilisateurSchema>;
export type PreferenceGlobaleDto = z.infer<typeof preferenceGlobaleSchema>;
export type SetPreferenceGlobaleDto = z.infer<typeof setPreferenceGlobaleSchema>;
export type ImportPreferencesDto = z.infer<typeof importPreferencesSchema>;
export type DashboardConfigDto = z.infer<typeof dashboardConfigSchema>;
export type UpdateDashboardConfigDto = z.infer<typeof updateDashboardConfigSchema>;
