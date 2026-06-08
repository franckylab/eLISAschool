/**
 * ==================================
 * eLISAschool - DTOs Suivi-Personnel
 * ==================================
 */

import { z } from 'zod';

export const createIncidentPersonnelSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    gravite: z.enum(['MINEUR', 'MODERE', 'GRAVE', 'TRES_GRAVE']),
    type: z.string().min(2).max(200),
    description: z.string().min(10),
    actionPrise: z.string().optional(),
});

export const createEvaluationPersonnelSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    periodicite: z.enum(['MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE']),
    periode: z.string().min(4).max(50),
    noteGlobale: z.number().min(0).max(20).optional(),
    pointsFort: z.string().optional(),
    pointsAmeliorer: z.string().optional(),
    objectifs: z.string().optional(),
    commentaires: z.string().optional(),
    visibleConcerned: z.boolean().default(false),
});
