/**
 * ==================================
 * eLISAschool - DTOs Templates Période (v5.0 — Niveaux + Usages)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v5.0 :
 * - Remplacement de `type` (enum TypePeriode) par `niveau` (number) + `usageCode` (string)
 * - Cohérence avec les règles métier basées sur l'usage
 */

import { z } from 'zod';

// =============================================
// STRUCTURE RÉCURSIVE — Nœud de template (v5.0)
// =============================================

/**
 * Schéma récursif pour un nœud de la structure hiérarchique.
 * Chaque nœud décrit un niveau de période, un usage sémantique,
 * le nombre d'occurrences et le pattern de nommage.
 */
export const noeudTemplateSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        niveau: z.number().int().min(0).max(20),
        usageCode: z.string().min(2).max(50),
        count: z.number().int().min(1).max(20),
        nom: z.string().min(2).max(100),
        enfants: z.array(noeudTemplateSchema).optional(),
    }),
);

// =============================================
// TEMPLATES — CRUD
// =============================================

export const createTemplatePeriodeSchema = z.object({
    nom: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),
    structure: noeudTemplateSchema,
});

export const updateTemplatePeriodeSchema = createTemplatePeriodeSchema.partial();

// =============================================
// GÉNÉRATION — Depuis un template (par ID)
// =============================================

export const genererDepuisTemplateSchema = z.object({
    templateId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFin: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

// =============================================
// TYPES INFÉRÉS
// =============================================

export type CreateTemplatePeriodeDto = z.infer<typeof createTemplatePeriodeSchema>;
export type UpdateTemplatePeriodeDto = z.infer<typeof updateTemplatePeriodeSchema>;
export type GenererDepuisTemplateDto = z.infer<typeof genererDepuisTemplateSchema>;
