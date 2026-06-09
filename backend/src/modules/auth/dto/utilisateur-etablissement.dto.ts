/**
 * ==================================
 * eLISAschool - DTOs Gestion Multi-Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Schémas Zod pour les affectations d'utilisateurs à plusieurs établissements.
 */

import { z } from 'zod';
import { Role } from '@modules/auth/entities';

/**
 * Schéma pour affecter un établissement à un utilisateur
 */
export const affecterEtablissementSchema = z.object({
    etablissementId: z.string().uuid('ID d\'établissement invalide'),
    role: z.string().min(1, 'Le rôle est requis'),
    etablissementPrincipal: z.boolean().optional().default(false),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    motif: z.string().max(500).optional(),
});

/**
 * Schéma pour mettre à jour le rôle dans un établissement
 */
export const updateRoleEtablissementSchema = z.object({
    role: z.string().min(1, 'Le rôle est requis'),
});

/**
 * Schéma pour changer d'établissement actif (switch)
 */
export const switchEtablissementSchema = z.object({
    etablissementId: z.string().uuid('ID d\'établissement invalide'),
});

export type AffecterEtablissementDto = z.infer<typeof affecterEtablissementSchema>;
export type UpdateRoleEtablissementDto = z.infer<typeof updateRoleEtablissementSchema>;
export type SwitchEtablissementDto = z.infer<typeof switchEtablissementSchema>;
