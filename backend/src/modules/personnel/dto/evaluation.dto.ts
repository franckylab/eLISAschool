/**
 * eLISAschool - Module Personnel/RH
 * DTOs pour les évaluations des enseignants
 */

import { z } from 'zod';

// Schéma de création d'évaluation
export const createEvaluationSchema = z.object({
    enseignantId: z.string().uuid('ID de l\'enseignant invalide'),
    evaluateurId: z.string().uuid('ID de l\'évaluateur invalide'),
    dateEvaluation: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    categorie: z.enum(['PEDAGOGIQUE', 'DISCIPLINE', 'PONCTUALITE', 'COLLABORATION', 'INNOVATION'], {
        errorMap: () => ({ message: 'Catégorie d\'évaluation invalide' })
    }),
    note: z.coerce.number().min(0).max(20, 'La note doit être entre 0 et 20'),
    commentaire: z.string().max(2000).optional(),
    planAction: z.string().max(2000).optional(),
});

// Schéma de mise à jour
export const updateEvaluationSchema = createEvaluationSchema.partial().omit({
    enseignantId: true,
    evaluateurId: true,
});

// Schéma de requête avec filtres
export const queryEvaluationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    enseignantId: z.string().uuid().optional(),
    evaluateurId: z.string().uuid().optional(),
    categorie: z.enum(['PEDAGOGIQUE', 'DISCIPLINE', 'PONCTUALITE', 'COLLABORATION', 'INNOVATION']).optional(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateEvaluationDto = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationDto = z.infer<typeof updateEvaluationSchema>;
export type QueryEvaluationDto = z.infer<typeof queryEvaluationSchema>;
