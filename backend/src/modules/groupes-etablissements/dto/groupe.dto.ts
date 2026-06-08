/**
 * ==================================
 * eLISAschool - DTOs Groupe Établissement
 * ==================================
 * Version: 1.0.0
 * 
 * Schémas de validation Zod pour les groupes d'établissements.
 */

import { z } from 'zod';

// ==================================
// Schémas de création/modification
// ==================================

export const createGroupeSchema = z.object({
    nom: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(255),
    description: z.string().optional(),
    code: z
        .string()
        .min(2, 'Le code doit contenir au moins 2 caractères')
        .max(50)
        .regex(/^[A-Z0-9_-]+$/, 'Le code ne doit contenir que des majuscules, chiffres, tirets et underscores'),
    etablissementIds: z.array(z.string().uuid()).min(1, 'Au moins un établissement est requis').optional(),
});

export const updateGroupeSchema = z.object({
    nom: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    actif: z.boolean().optional(),
});

export const addEtablissementSchema = z.object({
    etablissementId: z.string().uuid('ID d\'établissement invalide').optional(),
    etablissementIds: z.array(z.string().uuid()).min(1, 'Au moins un établissement est requis').optional(),
}).refine(data => data.etablissementId || data.etablissementIds, {
    message: 'Au moins un établissement est requis (etablissementId ou etablissementIds)',
});

export const addAdminSchema = z.object({
    utilisateurId: z.string().uuid('ID d\'utilisateur invalide'),
});

// ==================================
// Types inférés
// ==================================

export type CreateGroupeDto = z.infer<typeof createGroupeSchema>;
export type UpdateGroupeDto = z.infer<typeof updateGroupeSchema>;
export type AddEtablissementDto = z.infer<typeof addEtablissementSchema>;
export type AddAdminDto = z.infer<typeof addAdminSchema>;
