/**
 * ==================================
 * eLISAschool - DTO Identité (Dual-Plane)
 * ==================================
 * Schémas de validation pour les endpoints identité.
 *
 * Modèle C — Auth0 Internalisé
 */

import { z } from 'zod';

// =============================================
// Liste paginée identités
// =============================================

export const listeIdentitesSchema = z.object({
    search: z.string().optional(),
    statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListeIdentitesDto = z.infer<typeof listeIdentitesSchema>;

// =============================================
// Création identité
// =============================================

export const creerIdentiteSchema = z.object({
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(8, 'Mot de passe requis (min 8 caractères)').optional(),
    emailVerifie: z.boolean().optional().default(false),
    mfaActive: z.boolean().optional().default(false),
});

export type CreerIdentiteDto = z.infer<typeof creerIdentiteSchema>;

// =============================================
// Modification identité
// =============================================

export const modifierIdentiteSchema = z.object({
    email: z.string().email('Email invalide').optional(),
    emailVerifie: z.boolean().optional(),
    mfaActive: z.boolean().optional(),
    statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
});

export type ModifierIdentiteDto = z.infer<typeof modifierIdentiteSchema>;

// =============================================
// Assignation rôle (membership)
// =============================================

export const assignerRoleSchema = z.object({
    identiteId: z.string().uuid('ID identité invalide'),
    contexteType: z.enum(['PLATEFORME', 'ETABLISSEMENT']),
    contexteId: z.string().uuid('ID contexte invalide').nullable().optional(),
    role: z.string().min(1, 'Rôle requis'),
});

export type AssignerRoleDto = z.infer<typeof assignerRoleSchema>;
