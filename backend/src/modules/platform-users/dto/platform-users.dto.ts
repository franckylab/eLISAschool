/**
 * ==================================
 * eLISAschool - DTO Utilisateurs Plateforme
 * ==================================
 * Schémas de validation pour les endpoints utilisateurs plateforme.
 *
 * V2.2 — Panel Admin Enterprise
 */

import { z } from 'zod';

// =============================================
// Liste paginée avec filtres
// =============================================

export const listeUtilisateursSchema = z.object({
    search: z.string().optional(),
    role: z.string().optional(),
    statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
    mfaActive: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListeUtilisateursDto = z.infer<typeof listeUtilisateursSchema>;

// =============================================
// Création utilisateur plateforme
// =============================================

export const creerUtilisateurSchema = z.object({
    email: z.string().email('Email invalide'),
    prenom: z.string().min(1, 'Prénom requis'),
    nom: z.string().min(1, 'Nom requis'),
    role: z.string().min(1, 'Rôle requis'),
    groupeEtablissementIds: z.array(z.string().uuid()).optional().default([]),
    envoyerEmail: z.boolean().optional().default(true),
});

export type CreerUtilisateurDto = z.infer<typeof creerUtilisateurSchema>;

// =============================================
// Modification utilisateur plateforme
// =============================================

export const modifierUtilisateurSchema = z.object({
    role: z.string().optional(),
    statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
    groupeEtablissementIds: z.array(z.string().uuid()).optional(),
    mfaRequired: z.boolean().optional(),
});

export type ModifierUtilisateurDto = z.infer<typeof modifierUtilisateurSchema>;

// =============================================
// Délégation temporaire
// =============================================

export const deleguerSchema = z.object({
    delegueId: z.string().uuid('ID du délégué invalide'),
    permissions: z.array(z.string()).min(1, 'Au moins une permission requise'),
    dateDebut: z.string().datetime('Date de début invalide'),
    dateFin: z.string().datetime('Date de fin invalide'),
    motif: z.string().optional(),
});

export type DeleguerDto = z.infer<typeof deleguerSchema>;
