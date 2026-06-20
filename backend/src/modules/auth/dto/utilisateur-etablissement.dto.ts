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

/**
 * ==================================
 * DTOs pour la vérification de retrait (v5.0)
 * ==================================
 */

/**
 * Schéma de réponse pour un blocage (empêche le retrait)
 */
export const blocageSchema = z.object({
    code: z.string(),
    message: z.string(),
    severite: z.literal('bloquant'),
    actionRequise: z.string().optional(),
});

/**
 * Schéma de réponse pour un avertissement (confirmation requise)
 */
export const avertissementSchema = z.object({
    code: z.string(),
    message: z.string(),
    severite: z.literal('avertissement'),
    nombre: z.number().int().nonnegative(),
    actionRecommandee: z.string().optional(),
});

/**
 * Schéma du résumé chiffré des impacts
 */
export const resumeRetraitSchema = z.object({
    nombreBlocages: z.number().int().nonnegative(),
    nombreAvertissements: z.number().int().nonnegative(),
    classesAssignees: z.number().int().nonnegative(),
    elevesResponsables: z.number().int().nonnegative(),
    estDernierChef: z.boolean(),
});

/**
 * Schéma complet de réponse pour la vérification de retrait
 */
export const verificationRetraitSchema = z.object({
    peutRetirer: z.boolean(),
    blocages: z.array(blocageSchema),
    avertissements: z.array(avertissementSchema),
    resume: resumeRetraitSchema,
});

/**
 * Types TypeScript inférés
 */
export type BlocageRetrait = z.infer<typeof blocageSchema>;
export type AvertissementRetrait = z.infer<typeof avertissementSchema>;
export type ResumeRetrait = z.infer<typeof resumeRetraitSchema>;
export type VerificationRetraitResponse = z.infer<typeof verificationRetraitSchema>;
