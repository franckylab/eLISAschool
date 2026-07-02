/**
 * ==================================
 * eLISAschool - DTOs Usages Niveau
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Schémas Zod pour la gestion des usages des niveaux de périodicité.
 * Usages système (globaux) + usages personnalisés (par établissement).
 */

import { z } from 'zod';

// =============================================
// USAGES NIVEAU — CRUD
// =============================================

export const createUsageNiveauSchema = z.object({
    code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, 'Le code doit être en majuscules avec des underscores'),
    label: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
});

export const updateUsageNiveauSchema = createUsageNiveauSchema.partial().omit({ code: true });

// =============================================
// TYPES INFÉRÉS
// =============================================

export type CreateUsageNiveauDto = z.infer<typeof createUsageNiveauSchema>;
export type UpdateUsageNiveauDto = z.infer<typeof updateUsageNiveauSchema>;
