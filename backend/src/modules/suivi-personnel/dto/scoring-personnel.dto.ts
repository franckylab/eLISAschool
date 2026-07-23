/**
 * ==================================
 * eLISAschool - DTOs Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// =====================================================
// DTOs pour ScorePersonnel
// =====================================================

export const updateScorePersonnelSchema = z.object({
    scoreAssiduite: z.number().min(0).max(100).optional(),
    scoreComportement: z.number().min(0).max(100).optional(),
    scorePerformance: z.number().min(0).max(100).optional(),
    scorePedagogie: z.number().min(0).max(100).optional(),
});

export type UpdateScorePersonnelDto = z.infer<typeof updateScorePersonnelSchema>;

// =====================================================
// DTOs pour RegleScoringPersonnel
// =====================================================

export const createRegleScoringSchema = z.object({
    code: z.string().min(2).max(100),
    libelle: z.string().min(2).max(200),
    description: z.string().optional(),
    typeAction: z.enum(['ASSIDUITE', 'COMPORTEMENT', 'PERFORMANCE', 'PEDAGOGIE']),
    pointsAttribues: z.number().int().min(-100).max(100),
    estAutomatique: z.boolean().default(true),
    estActif: z.boolean().default(true),
    priorite: z.number().int().default(0),
    conditionsSupplementaires: z.record(z.string(), z.any()).optional(),
    categorieCible: z.string().max(50).optional(),
    typePersonnelCible: z.string().max(50).optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
});

export const updateRegleScoringSchema = createRegleScoringSchema.partial();

export type CreateRegleScoringDto = z.infer<typeof createRegleScoringSchema>;
export type UpdateRegleScoringDto = z.infer<typeof updateRegleScoringSchema>;

// =====================================================
// DTOs pour HistoriqueScorePersonnel
// =====================================================

export const attribuerPointsPersonnelSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    points: z.number().int().min(-100).max(100),
    typeAction: z.enum(['ASSIDUITE', 'COMPORTEMENT', 'PERFORMANCE', 'PEDAGOGIE']),
    description: z.string().min(2).max(500),
    sourceModule: z.string().max(50).optional(),
    sourceId: z.string().uuid().optional(),
    declencheurAutomatique: z.boolean().default(false),
    categorieScore: z.enum(['assiduite', 'comportement', 'performance', 'pedagogie']).optional(),
});

export const recalculerScoreSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    anneeScolaireId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    force: z.boolean().default(false),
});

export const classementPersonnelSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    etablissementId: z.string().uuid().optional(),
    anneeScolaireId: z.string().uuid(),
    periodeId: z.string().uuid().optional(),
    typePersonnelId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    classeId: z.string().uuid().optional(),
    sortBy: z.enum(['scoreGlobal', 'scoreAssiduite', 'scoreComportement', 'scorePerformance', 'scorePedagogie']).default('scoreGlobal'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type AttribuerPointsPersonnelDto = z.infer<typeof attribuerPointsPersonnelSchema>;
export type RecalculerScoreDto = z.infer<typeof recalculerScoreSchema>;
export type ClassementPersonnelDto = z.infer<typeof classementPersonnelSchema>;
