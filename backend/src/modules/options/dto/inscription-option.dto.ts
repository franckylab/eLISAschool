/**
 * ==================================
 * eLISAschool - DTOs Options Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// ==================================
// Schémas de Validation
// ==================================

export const createInscriptionOptionSchema = z.object({
    eleveId: z.string().uuid('ID élève invalide'),
    matiereId: z.string().uuid('ID matière invalide'),
    anneeScolaireId: z.string().uuid('ID année scolaire invalide'),
    coefficient: z.number().min(0.5).max(5).default(1),
    commentaire: z.string().max(500).optional(),
});

export const updateInscriptionOptionSchema = z.object({
    coefficient: z.number().min(0.5).max(5).optional(),
    statut: z.enum(['ACTIVE', 'ABANDONNEE', 'EN_ATTENTE']).optional(),
    dateAbandon: z.string().date().optional(),
    motifAbandon: z.string().max(500).optional(),
    estValidée: z.boolean().optional(),
    commentaire: z.string().max(500).optional(),
});

export const queryInscriptionOptionsSchema = z.object({
    eleveId: z.string().uuid().optional(),
    anneeScolaireId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    statut: z.enum(['ACTIVE', 'ABANDONNEE', 'EN_ATTENTE']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

export const validerInscriptionOptionSchema = z.object({
    estValidée: z.boolean(),
    commentaire: z.string().max(500).optional(),
});

// ==================================
// Types Inférés
// ==================================

export type CreateInscriptionOptionDto = z.infer<typeof createInscriptionOptionSchema>;
export type UpdateInscriptionOptionDto = z.infer<typeof updateInscriptionOptionSchema>;
export type QueryInscriptionOptionsDto = z.infer<typeof queryInscriptionOptionsSchema>;
export type ValiderInscriptionOptionDto = z.infer<typeof validerInscriptionOptionSchema>;
