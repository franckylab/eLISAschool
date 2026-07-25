/**
 * ==================================
 * eLISAschool - DTOs Notes v2.0
 * ==================================
 */

import { z } from 'zod';
import { TypeEvaluation, StatutNote } from '../entities/note.entity';
import { paginationSchema } from '@common/dto/pagination.dto';

/**
 * Schéma de base (ZodObject) — sert de socle à create/update.
 * Le refine (valeur ≤ barème) est appliqué sur les schémas finaux.
 */
const createNoteBaseSchema = z.object({
    eleveId: z.string().uuid(),
    matiereId: z.string().uuid(),
    classeAnneeId: z.string().uuid(),
    periodeId: z.string().uuid(),
    typeEvaluation: z.nativeEnum(TypeEvaluation).default(TypeEvaluation.DEVOIR),
    description: z.string().max(255).optional(),
    valeur: z.number().min(0),
    bareme: z.number().positive().optional(),
    coefficient: z.number().min(0).optional(),
    commentaire: z.string().optional(),
    dateEvaluation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const createNoteSchema = createNoteBaseSchema.refine(
    (data) => data.valeur <= (data.bareme ?? 20),
    { message: 'La valeur de la note ne peut pas dépasser le barème', path: ['valeur'] }
);

/**
 * Mise à jour : les identifiants structurants ne sont pas modifiables.
 */
export const updateNoteSchema = createNoteBaseSchema
    .partial()
    .omit({ eleveId: true, matiereId: true, classeAnneeId: true, periodeId: true })
    .extend({
        statut: z.enum([StatutNote.BROUILLON, StatutNote.VALIDEE, StatutNote.PUBLIEE]).optional(),
    });

export const createBulkNotesSchema = z.object({
    matiereId: z.string().uuid(),
    classeAnneeId: z.string().uuid(),
    periodeId: z.string().uuid(),
    typeEvaluation: z.nativeEnum(TypeEvaluation).default(TypeEvaluation.DEVOIR),
    description: z.string().max(255).optional(),
    bareme: z.number().positive().optional(),
    coefficient: z.number().min(0).optional(),
    dateEvaluation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    notes: z.array(z.object({
        eleveId: z.string().uuid(),
        valeur: z.number().min(0),
        commentaire: z.string().optional(),
    })).min(1),
}).refine(
    (data) => data.notes.every((n) => n.valeur <= (data.bareme ?? 20)),
    { message: 'La valeur d\'une note ne peut pas dépasser le barème', path: ['notes'] }
);

export const queryNotesSchema = paginationSchema
    .extend({
        eleveId: z.string().uuid().optional(),
        matiereId: z.string().uuid().optional(),
        classeAnneeId: z.string().uuid().optional(),
        periodeId: z.string().uuid().optional(),
        statut: z.nativeEnum(StatutNote).optional(),
        typeEvaluation: z.nativeEnum(TypeEvaluation).optional(),
        recherche: z.string().max(255).optional(),
    });

/**
 * Query pour GET /api/notes/statistiques
 */
export const queryNotesStatistiquesSchema = z.object({
    periodeId: z.string().uuid().optional(),
    classeAnneeId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    eleveId: z.string().uuid().optional(),
});

export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type CreateBulkNotesDto = z.infer<typeof createBulkNotesSchema>;
export type QueryNotesDto = z.infer<typeof queryNotesSchema>;
export type QueryNotesStatistiquesDto = z.infer<typeof queryNotesStatistiquesSchema>;
