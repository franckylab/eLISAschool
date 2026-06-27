/**
 * ==================================
 * eLISAschool - DTOs Notes v2.0
 * ==================================
 */

import { z } from 'zod';
import { TypeEvaluation, StatutNote } from '../entities/note.entity';
import { paginationSchema } from '@common/dto/pagination.dto';

export const createNoteSchema = z.object({
    eleveId: z.string().uuid(),
    matiereId: z.string().uuid(),
    // classeId: z.string().uuid(),  ← SUPPRIMÉ (migration 084) - déduit via AffectationEleve
    periodeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid().optional(), // Si non fourni, service prendra l'année de la période ou active
    typeEvaluation: z.nativeEnum(TypeEvaluation).default(TypeEvaluation.DEVOIR),
    description: z.string().max(255).optional(),
    valeur: z.number().min(0),
    bareme: z.number().positive().default(20),
    coefficient: z.number().min(0).default(1),
    commentaire: z.string().optional(),
    dateEvaluation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
    statut: z.nativeEnum(StatutNote).optional(),
});

export const createBulkNotesSchema = z.object({
    matiereId: z.string().uuid(),
    // classeId: z.string().uuid(),  ← SUPPRIMÉ (migration 084) - déduit via AffectationEleve pour chaque élève
    periodeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid().optional(),
    typeEvaluation: z.nativeEnum(TypeEvaluation).default(TypeEvaluation.DEVOIR),
    description: z.string().max(255).optional(),
    bareme: z.number().positive().default(20),
    coefficient: z.number().min(0).default(1),
    dateEvaluation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    notes: z.array(z.object({
        eleveId: z.string().uuid(),
        valeur: z.number().min(0),
        commentaire: z.string().optional(),
    })).min(1),
});

export const queryNotesSchema = paginationSchema
    .extend({
        eleveId: z.string().uuid().optional(),
        matiereId: z.string().uuid().optional(),
        // classeId: z.string().uuid().optional(),  ← SUPPRIMÉ - utiliser anneeScolaireId + eleveId pour filtrer
        periodeId: z.string().uuid().optional(),
        anneeScolaireId: z.string().uuid().optional(),
        statut: z.nativeEnum(StatutNote).optional(),
        typeEvaluation: z.nativeEnum(TypeEvaluation).optional(),
    });

export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type CreateBulkNotesDto = z.infer<typeof createBulkNotesSchema>;
export type QueryNotesDto = z.infer<typeof queryNotesSchema>;
