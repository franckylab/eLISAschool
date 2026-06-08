/**
 * eLISAschool - Module Personnel/RH
 * DTOs pour les absences du personnel
 */

import { z } from 'zod';

// Schéma de création d'absence
export const createAbsenceSchema = z.object({
    membrePersonnelId: z.string().uuid('ID du membre du personnel invalide'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    type: z.enum(['MALADIE', 'CONGE', 'RETARD', 'ABSENCE_INJUSTIFIEE', 'AUTRE'], {
        errorMap: () => ({ message: 'Type d\'absence invalide' })
    }),
    heureDebut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    heureFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    motif: z.string().max(500).optional(),
    justification: z.string().max(1000).optional(),
});

// Schéma de mise à jour
export const updateAbsenceSchema = createAbsenceSchema.partial().omit({
    membrePersonnelId: true,
});

// Schéma de requête avec filtres
export const queryAbsenceSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    membrePersonnelId: z.string().uuid().optional(),
    type: z.enum(['MALADIE', 'CONGE', 'RETARD', 'ABSENCE_INJUSTIFIEE', 'AUTRE']).optional(),
    statutJustification: z.enum(['JUSTIFIEE', 'NON_JUSTIFIEE', 'EN_ATTENTE']).optional(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateAbsenceDto = z.infer<typeof createAbsenceSchema>;
export type UpdateAbsenceDto = z.infer<typeof updateAbsenceSchema>;
export type QueryAbsenceDto = z.infer<typeof queryAbsenceSchema>;
