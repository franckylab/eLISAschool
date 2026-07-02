/**
 * ==================================
 * eLISAschool - DTOs Périodes (v5.0 — Niveaux de périodicité)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v5.0 :
 * - Remplacement de `type` (enum TypePeriode) par `niveauId` (FK vers NiveauPeriode)
 * - Suppression de l'import TypePeriode
 * - Cohérence avec les niveaux configurables
 */

import { z } from 'zod';

// =============================================
// PÉRIODES — CRUD
// =============================================

export const createPeriodeSchema = z.object({
    nom: z.string().min(2).max(100),
    niveauId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    /** IDs des périodes enfants (compositions) — optionnel à la création */
    enfants: z.array(z.object({
        periodeId: z.string().uuid(),
        ordre: z.number().int().min(1),
        poids: z.number().min(0).default(1),
    })).optional(),
});

export const updatePeriodeSchema = createPeriodeSchema.partial().omit({ anneeScolaireId: true, enfants: true });

// =============================================
// COMPOSITIONS — Gestion de la hiérarchie
// =============================================

export const createCompositionSchema = z.object({
    periodeParentId: z.string().uuid(),
    periodeEnfantId: z.string().uuid(),
    ordre: z.number().int().min(1),
    poids: z.number().min(0).default(1),
});

export const updateCompositionSchema = z.object({
    ordre: z.number().int().min(1).optional(),
    poids: z.number().min(0).optional(),
});

/**
 * Schéma pour le remplacement batch des compositions d'un parent.
 * Utilisé par PUT /api/periodes/:id/compositions — sauvegarde atomique.
 */
export const replaceCompositionsSchema = z.object({
    enfants: z.array(z.object({
        periodeEnfantId: z.string().uuid(),
        ordre: z.number().int().min(1),
        poids: z.number().min(0).default(1),
    })),
});

// =============================================
// TEMPLATES — Génération automatique
// =============================================

/**
 * @deprecated Conservé pour compatibilité. Utiliser les templates personnalisables.
 */
export const genererTemplateSchema = z.object({
    template: z.string().optional(),
    anneeScolaireId: z.string().uuid(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

// =============================================
// CLÔTURE / RÉOUVERTURE
// =============================================

export const cloturerPeriodeSchema = z.object({
    commentaire: z.string().max(500).optional(),
    forcer: z.boolean().default(false),
});

export const reouvrirPeriodeSchema = z.object({
    motif: z.string().min(5).max(500),
});

// =============================================
// TYPES INFÉRÉS
// =============================================

export type CreatePeriodeDto = z.infer<typeof createPeriodeSchema>;
export type UpdatePeriodeDto = z.infer<typeof updatePeriodeSchema>;
export type CreateCompositionDto = z.infer<typeof createCompositionSchema>;
export type UpdateCompositionDto = z.infer<typeof updateCompositionSchema>;
export type GenererTemplateDto = z.infer<typeof genererTemplateSchema>;
export type CloturerPeriodeDto = z.infer<typeof cloturerPeriodeSchema>;
export type ReouvrirPeriodeDto = z.infer<typeof reouvrirPeriodeSchema>;
export type ReplaceCompositionsDto = z.infer<typeof replaceCompositionsSchema>;
