/**
 * ==================================
 * eLISAschool — DTOs Paramètres Cascade
 * ==================================
 * Version: 1.0.0
 *
 * Schémas Zod pour les endpoints cascade multi-niveaux :
 * Système → Global → Groupe → Établissement
 */

import { z } from 'zod';

/**
 * Modification de la valeur globale d'un paramètre (niveau global)
 */
export const updateCascadeGlobalSchema = z.object({
    valeur: z.any(),
});

/**
 * Override établissement (niveau établissement)
 */
export const updateCascadeEtablissementSchema = z.object({
    valeur: z.any(),
});

/**
 * Override groupe (niveau groupe)
 */
export const updateCascadeGroupeSchema = z.object({
    valeur: z.any(),
});

/**
 * Requête de propagation — applique la valeur globale à tous les établissements
 * qui n'ont pas d'override explicite.
 */
export const propagerCascadeSchema = z.object({
    confirmOverwrite: z.boolean().default(false),
});

/**
 * Requête de liste des paramètres cascade (query params)
 */
export const queryCascadeSchema = z.object({
    module: z.string().optional(),
    categorie: z.string().optional(),
    search: z.string().optional(),
});

// Types inférés
export type UpdateCascadeGlobalDto = z.infer<typeof updateCascadeGlobalSchema>;
export type UpdateCascadeEtablissementDto = z.infer<typeof updateCascadeEtablissementSchema>;
export type UpdateCascadeGroupeDto = z.infer<typeof updateCascadeGroupeSchema>;
export type PropagerCascadeDto = z.infer<typeof propagerCascadeSchema>;
export type QueryCascadeDto = z.infer<typeof queryCascadeSchema>;
