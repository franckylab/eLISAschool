/**
 * eLISAschool - Module Personnel/RH
 * DTOs pour les progressions de programme
 */

import { z } from 'zod';

// Schéma de création de progression
export const createProgressionSchema = z.object({
    enseignantId: z.string().uuid('ID de l\'enseignant invalide'),
    matiereId: z.string().uuid('ID de la matière invalide'),
    classeId: z.string().uuid('ID de la classe invalide'),
    periodeId: z.string().uuid().optional(),
    pourcentageRealise: z.coerce.number().min(0).max(100, 'Le pourcentage doit être entre 0 et 100'),
    chapitreCourant: z.string().max(200),
    dateEvaluation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    remarques: z.string().max(2000).optional(),
});

// Schéma de mise à jour
export const updateProgressionSchema = createProgressionSchema.partial().omit({
    enseignantId: true,
    matiereId: true,
    classeId: true,
});

// Schéma de requête avec filtres
export const queryProgressionSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    enseignantId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    classeId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
});

export type CreateProgressionDto = z.infer<typeof createProgressionSchema>;
export type UpdateProgressionDto = z.infer<typeof updateProgressionSchema>;
export type QueryProgressionDto = z.infer<typeof queryProgressionSchema>;
