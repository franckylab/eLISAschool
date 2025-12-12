/**
 * ==================================
 * eLISAschool - DTOs Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';

/**
 * Schéma de création de note
 */
export const createNoteSchema = z.object({
    eleveId: z.string().uuid(),
    matiere: z.string().min(1).max(100),
    classe: z.string().max(100).optional(),
    typeEvaluation: z.enum(['DEVOIR', 'INTERROGATION', 'EXAMEN', 'PROJET', 'PARTICIPATION', 'AUTRE']).default('DEVOIR'),
    description: z.string().max(255).optional(),
    valeur: z.number().min(0),
    bareme: z.number().min(1).default(20),
    coefficient: z.number().min(0.1).default(1),
    commentaire: z.string().optional(),
    trimestre: z.string().max(50).optional(),
    anneeScolaire: z.string().max(20).optional(),
    dateEvaluation: z.string().optional(),
});

/**
 * Schéma de mise à jour de note
 */
export const updateNoteSchema = z.object({
    valeur: z.number().min(0).optional(),
    commentaire: z.string().optional(),
    statut: z.enum(['BROUILLON', 'VALIDEE', 'PUBLIEE']).optional(),
});

/**
 * Schéma de saisie de notes en masse
 */
export const createBulkNotesSchema = z.object({
    matiere: z.string().min(1).max(100),
    classe: z.string().max(100),
    typeEvaluation: z.enum(['DEVOIR', 'INTERROGATION', 'EXAMEN', 'PROJET', 'PARTICIPATION', 'AUTRE']),
    description: z.string().max(255).optional(),
    bareme: z.number().min(1).default(20),
    coefficient: z.number().min(0.1).default(1),
    trimestre: z.string().max(50).optional(),
    anneeScolaire: z.string().max(20).optional(),
    dateEvaluation: z.string().optional(),
    notes: z.array(z.object({
        eleveId: z.string().uuid(),
        valeur: z.number().min(0),
        commentaire: z.string().optional(),
    })).min(1),
});

/**
 * Schéma de filtrage des notes
 */
export const queryNotesSchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
    eleveId: z.string().uuid().optional(),
    matiere: z.string().optional(),
    classe: z.string().optional(),
    trimestre: z.string().optional(),
    anneeScolaire: z.string().optional(),
    typeEvaluation: z.string().optional(),
    statut: z.string().optional(),
});

// Types inférés
export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type CreateBulkNotesDto = z.infer<typeof createBulkNotesSchema>;
export type QueryNotesDto = z.infer<typeof queryNotesSchema>;

export default {
    createNoteSchema,
    updateNoteSchema,
    createBulkNotesSchema,
    queryNotesSchema,
};
