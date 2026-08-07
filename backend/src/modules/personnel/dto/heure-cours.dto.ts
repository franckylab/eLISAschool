/**
 * ==================================
 * eLISAschool - DTOs Heure de Cours
 * ==================================
 * Version: 1.3.0
 * Ajout mettreAJourCreneau (v1.3 — propagation inverse instance → créneau, grill-me 2026-08-03)
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createHeureCoursSchema = z.object({
    enseignantId: z.string().uuid(),
    classeAnneeId: z.string().uuid(),
    matiereId: z.string().uuid(),
    periodeId: z.string().uuid().optional(),
    creneauId: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    heureDebut: z.string().regex(/^\d{2}:\d{2}$/),
    heureFin: z.string().regex(/^\d{2}:\d{2}$/),
    statutEffectue: z.enum(['PLANIFIE', 'EFFECTUE', 'ANNULE', 'REMPLACE']).default('PLANIFIE'),
    typeCreneau: z.enum(['COURS', 'TP', 'TD', 'RECREATION', 'ETUDE', 'PERMANENCE', 'AUTRE']).default('COURS'),
    salle: z.string().optional(),
    salleId: z.string().uuid().optional(),
    remplacantId: z.string().uuid().optional(),
    commentaire: z.string().optional(),
    affectationMatiereId: z.string().uuid().optional(),
    // Q6 : « Mettre à jour aussi le créneau hebdo » — jamais automatique, défaut OFF.
    mettreAJourCreneau: z.boolean().optional(),
});

export const updateHeureCoursSchema = createHeureCoursSchema.partial();

export const queryHeureCoursSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        enseignantId: z.string().uuid().optional(),
        classeAnneeId: z.string().uuid().optional(),
        matiereId: z.string().uuid().optional(),
        salleId: z.string().uuid().optional(),
        dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        statutEffectue: z.enum(['PLANIFIE', 'EFFECTUE', 'ANNULE', 'REMPLACE']).optional(),
    });

export const genererHeuresCoursFromEdtSchema = z.object({
    enseignantId: z.string().uuid(),
    classeAnneeId: z.string().uuid().optional(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodeId: z.string().uuid().optional(),
});

export type CreateHeureCoursDto = z.infer<typeof createHeureCoursSchema>;
export type UpdateHeureCoursDto = z.infer<typeof updateHeureCoursSchema>;
export type QueryHeureCoursDto = z.infer<typeof queryHeureCoursSchema>;
export type GenererHeuresCoursFromEdtDto = z.infer<typeof genererHeuresCoursFromEdtSchema>;