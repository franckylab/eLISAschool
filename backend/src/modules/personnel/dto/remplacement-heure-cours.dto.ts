/**
 * ==================================
 * eLISAschool - DTOs RemplacementHeureCours
 * ==================================
 * Schémas Zod pour la validation des remplacements d'enseignants.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { StatutRemplacement } from '../entities/remplacement-heure-cours.entity';

// ─── Création d'une demande de remplacement ────────────────────

export const creerRemplacementSchema = z.object({
    heureCoursId: z.string().uuid('ID de heure de cours invalide'),
    motif: z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(1000),
    remplacantId: z.string().uuid('ID de remplaçant invalide').optional().nullable(),
});

export type CreerRemplacementDto = z.infer<typeof creerRemplacementSchema>;

// ─── Validation d'un remplacement ──────────────────────────────

export const validerRemplacementSchema = z.object({
    remplacantId: z.string().uuid('ID de remplaçant invalide'),
    commentaires: z.string().max(500).optional(),
});

export type ValiderRemplacementDto = z.infer<typeof validerRemplacementSchema>;

// ─── Exécution d'un remplacement (après validation) ────────────

export const executerRemplacementSchema = z.object({
    commentaires: z.string().max(500).optional(),
});

export type ExecuterRemplacementDto = z.infer<typeof executerRemplacementSchema>;

// ─── Rejet d'un remplacement ───────────────────────────────────

export const rejeterRemplacementSchema = z.object({
    motif: z.string().min(3, 'Le motif de rejet doit contenir au moins 3 caractères').max(500),
});

export type RejeterRemplacementDto = z.infer<typeof rejeterRemplacementSchema>;

// ─── Query (liste paginée) ─────────────────────────────────────

export const queryRemplacementSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['dateDemande', 'createdAt', 'statut']).default('dateDemande'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
    statut: z.nativeEnum(StatutRemplacement).optional(),
    demandeurId: z.string().uuid().optional(),
    heureCoursId: z.string().uuid().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
});

export type QueryRemplacementDto = z.infer<typeof queryRemplacementSchema>;
