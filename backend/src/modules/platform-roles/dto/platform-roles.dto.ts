/**
 * ==================================
 * eLISAschool - DTO Role Builder
 * ==================================
 * Schémas de validation pour la gestion des rôles plateforme.
 *
 * V2.3 — Panel Admin Enterprise
 */

import { z } from 'zod';

// =============================================
// Création rôle personnalisé
// =============================================

export const creerRoleSchema = z.object({
    nom: z.string().min(3, 'Nom requis (min 3 caractères)').max(100),
    description: z.string().optional(),
    permissions: z.array(z.string()).min(1, 'Au moins une permission requise'),
    scopeType: z.enum(['global', 'groupe']).default('groupe'),
});

export type CreerRoleDto = z.infer<typeof creerRoleSchema>;

// =============================================
// Modification rôle
// =============================================

export const modifierRoleSchema = z.object({
    nom: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    scopeType: z.enum(['global', 'groupe']).optional(),
});

export type ModifierRoleDto = z.infer<typeof modifierRoleSchema>;
