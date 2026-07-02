/**
 * ==================================
 * eLISAschool - DTOs Niveaux Période
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Schémas Zod pour la gestion des niveaux de périodicité.
 * Chaque établissement définit ses propres niveaux (0, 1, 2, 3...) avec libellés et usages.
 */

import { z } from 'zod';

// =============================================
// NIVEAUX PÉRIODE — CRUD
// =============================================

export const createNiveauPeriodeSchema = z.object({
    niveau: z.number().int().min(0).max(20),
    label: z.string().min(2).max(50),
    usageCode: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
});

export const updateNiveauPeriodeSchema = createNiveauPeriodeSchema.partial().omit({ niveau: true });

/**
 * Schéma pour la mise à jour en masse des niveaux (réordonnancement, drag & drop).
 */
export const reorderNiveauxSchema = z.object({
    niveaux: z.array(z.object({
        id: z.string().uuid(),
        niveau: z.number().int().min(0),
    })),
});

/**
 * Schéma pour la configuration initiale (wizard).
 * Permet de configurer tous les niveaux d'un coup.
 */
export const configInitialeNiveauxSchema = z.object({
    niveaux: z.array(z.object({
        niveau: z.number().int().min(0),
        label: z.string().min(2).max(50),
        usageCode: z.string().min(2).max(50),
        description: z.string().max(500).optional(),
    })).min(1).max(20),
});

// =============================================
// TYPES INFÉRÉS
// =============================================

export type CreateNiveauPeriodeDto = z.infer<typeof createNiveauPeriodeSchema>;
export type UpdateNiveauPeriodeDto = z.infer<typeof updateNiveauPeriodeSchema>;
export type ReorderNiveauxDto = z.infer<typeof reorderNiveauxSchema>;
export type ConfigInitialeNiveauxDto = z.infer<typeof configInitialeNiveauxSchema>;
