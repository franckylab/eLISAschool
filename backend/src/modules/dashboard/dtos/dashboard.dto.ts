/**
 * ==================================
 * eLISAschool - DTOs Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Validation des requêtes et réponses du dashboard
 */

import { z } from 'zod';

/**
 * Schema pour les filtres de widget
 */
export const widgetFiltersSchema = z.object({
    etablissementId: z.string().uuid().optional(),
    periode: z.string().optional(),
    anneeScolaire: z.string().optional(),
    module: z.string().optional(),
    type: z.string().optional(),
});

export type WidgetFiltersDto = z.infer<typeof widgetFiltersSchema>;

/**
 * Schema pour la configuration d'un widget utilisateur
 */
export const userWidgetConfigSchema = z.object({
    id: z.string(),
    visible: z.boolean().default(true),
    ordre: z.number().int().min(0).default(0),
    position: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
    }),
    taille: z.object({
        width: z.number().int().min(1).max(4),
        height: z.number().int().min(1).max(6),
    }),
    config: z.record(z.any()).optional(),
});

export type UserWidgetConfigDto = z.infer<typeof userWidgetConfigSchema>;

/**
 * Schema pour sauvegarder un layout
 */
export const saveLayoutSchema = z.object({
    nom: z.string().min(2).max(100).optional(),
    widgets: z.array(userWidgetConfigSchema).min(1),
    actif: z.boolean().default(true),
    etablissementId: z.string().uuid().optional(),
});

export type SaveLayoutDto = z.infer<typeof saveLayoutSchema>;

/**
 * Schema pour rafraîchir un widget
 */
export const refreshWidgetSchema = z.object({
    widgetId: z.string(),
    forceRefresh: z.boolean().default(false),
});

export type RefreshWidgetDto = z.infer<typeof refreshWidgetSchema>;

/**
 * Schema pour les paramètres de performance
 */
export const performanceParamsSchema = z.object({
    widgetId: z.string().optional(),
    periode: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

export type PerformanceParamsDto = z.infer<typeof performanceParamsSchema>;
