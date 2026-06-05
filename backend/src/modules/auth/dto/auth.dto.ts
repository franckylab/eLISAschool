/**
 * ==================================
 * eLISAschool - DTOs d'authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';

// ==================================
// Schémas de validation Zod
// ==================================

/**
 * Schéma de connexion
 */
export const loginSchema = z.object({
    email: z.string()
        .email('Adresse email invalide')
        .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
    motDePasse: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    seRappelerDeMoi: z.boolean().optional().default(false),
});

/**
 * Schéma d'inscription
 */
export const registerSchema = z.object({
    email: z.string()
        .email('Adresse email invalide')
        .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
    motDePasse: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères')
        .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmationMotDePasse: z.string(),
    nom: z.string()
        .min(2, 'Le nom doit faire au moins 2 caractères')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    prenom: z.string()
        .min(2, 'Le prénom doit faire au moins 2 caractères')
        .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
    telephone: z.string()
        .regex(/^\+?[0-9]{9,15}$/, 'Numéro de téléphone invalide')
        .optional(),
    langue: z.string().default('fr'),
}).refine((data) => data.motDePasse === data.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmationMotDePasse'],
});

/**
 * Schéma de rafraîchissement de token
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Le token de rafraîchissement est requis'),
});

/**
 * Schéma de demande de réinitialisation de mot de passe
 */
export const forgotPasswordSchema = z.object({
    email: z.string().email('Adresse email invalide'),
});

/**
 * Schéma de réinitialisation de mot de passe
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Le token est requis'),
    nouveauMotDePasse: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmationMotDePasse: z.string(),
}).refine((data) => data.nouveauMotDePasse === data.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmationMotDePasse'],
});

/**
 * Schéma de changement de mot de passe
 */
export const changePasswordSchema = z.object({
    motDePasseActuel: z.string().min(1, 'Le mot de passe actuel est requis'),
    nouveauMotDePasse: z.string()
        .min(8, 'Le mot de passe doit faire au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    confirmationMotDePasse: z.string(),
}).refine((data) => data.nouveauMotDePasse === data.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmationMotDePasse'],
});

/**
 * Schéma de vérification email
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Le token de vérification est requis'),
});

// ==================================
// Types inférés
// ==================================

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

// ==================================
// Interfaces de réponse
// ==================================

/**
 * Réponse de connexion réussie
 */
export interface LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    utilisateur: {
        id: string;
        email: string;
        matricule: string;
        role: string;
        nom: string;
        prenom: string;
    };
}

/**
 * Payload du JWT
 */
export interface JwtPayload {
    sub: string; // utilisateurId
    email: string;
    role: string; // Rôle principal (backward compat)
    roles?: string[]; // NOUVEAU : tous les codes de rôles
    permissions?: string[]; // NOUVEAU : permissions résolues au login
    etablissementId?: string; // Legacy (single-établissement)
    etablissements?: Array<{ // NOUVEAU : multi-établissements (v2.0)
        etablissementId: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
    iat?: number;
    exp?: number;
}

/**
 * Utilisateur authentifié (attaché à la requête)
 */
export interface UtilisateurAuth {
    id: string;
    email: string;
    role: string; // Rôle principal (backward compat)
    roles?: string[]; // NOUVEAU : tous les rôles
    permissions?: string[]; // NOUVEAU : permissions résolues
    etablissementId?: string; // Legacy (single-établissement)
    etablissements?: Array<{ // NOUVEAU : multi-établissements (v2.0)
        etablissementId: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
}

export default {
    loginSchema,
    registerSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
};
