/**
 * eLISAschool - Module Personnel/RH
 * DTOs pour les bulletins de paie
 */

import { z } from 'zod';

// Schéma de création de bulletin
export const createBulletinSchema = z.object({
    membrePersonnelId: z.string().uuid('ID du membre du personnel invalide'),
    contratId: z.string().uuid('ID du contrat invalide'),
    mois: z.coerce.number().int().min(1).max(12, 'Le mois doit être entre 1 et 12'),
    annee: z.coerce.number().int().min(2000).max(2100),
    primes: z.coerce.number().min(0).optional().default(0),
    deductions: z.coerce.number().min(0).optional().default(0),
    notes: z.string().max(2000).optional(),
});

// Schéma de mise à jour
export const updateBulletinPaieSchema = createBulletinSchema.partial().omit({
    membrePersonnelId: true,
}).extend({
    statut: z.enum(['GENERE', 'VALIDE', 'PAYE', 'ANNULE']).optional(),
});

// Schéma de requête avec filtres
export const queryBulletinSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    membrePersonnelId: z.string().uuid().optional(),
    mois: z.coerce.number().int().min(1).max(12).optional(),
    annee: z.coerce.number().int().optional(),
    statut: z.enum(['GENERE', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'PAYE', 'ANNULE']).optional(),
});

export type CreateBulletinPaieDto = z.infer<typeof createBulletinSchema>;
export type UpdateBulletinPaieDto = z.infer<typeof updateBulletinPaieSchema>;
export type QueryBulletinPaieDto = z.infer<typeof queryBulletinSchema>;
