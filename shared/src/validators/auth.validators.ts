/**
 * ==================================
 * eLISAschool - Validateurs d'authentification (partagés)
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Schémas partagés entre backend et frontend.
 * Noms de champs en FRANÇAIS (convention eLISAschool).
 * 
 * Changelog v2.0:
 * - Tous les champs renommés en français (motDePasse, confirmationMotDePasse, etc.)
 * - Ajout de refreshTokenSchema et verifyEmailSchema
 * - Source unique de vérité : le backend réexporte depuis ce fichier
 */

import { z } from 'zod';
import { LIMITS } from '../constants';

/**
 * Schéma de validation pour le login
 */
export const loginSchema = z.object({
    email: z.string()
        .email('Adresse email invalide')
        .max(255, 'L\'email ne peut pas dépasser 255 caractères'),

    motDePasse: z.string()
        .min(LIMITS.PASSWORD_MIN_LENGTH, `Le mot de passe doit faire au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`),

    seRappelerDeMoi: z.boolean().optional().default(false),
});

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = z.object({
    email: z.string()
        .email('Adresse email invalide')
        .max(255, 'L\'email ne peut pas dépasser 255 caractères'),

    motDePasse: z.string()
        .min(LIMITS.PASSWORD_MIN_LENGTH, `Le mot de passe doit faire au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`)
        .max(LIMITS.PASSWORD_MAX_LENGTH, `Le mot de passe ne peut pas dépasser ${LIMITS.PASSWORD_MAX_LENGTH} caractères`)
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
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = z.object({
    motDePasseActuel: z.string()
        .min(1, 'Le mot de passe actuel est requis'),

    nouveauMotDePasse: z.string()
        .min(LIMITS.PASSWORD_MIN_LENGTH, `Le mot de passe doit faire au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`)
        .max(LIMITS.PASSWORD_MAX_LENGTH, `Le mot de passe ne peut pas dépasser ${LIMITS.PASSWORD_MAX_LENGTH} caractères`)
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),

    confirmationMotDePasse: z.string(),
}).refine((data) => data.nouveauMotDePasse === data.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmationMotDePasse'],
});

/**
 * Schéma de validation pour la demande de réinitialisation
 */
export const forgotPasswordSchema = z.object({
    email: z.string()
        .email('Adresse email invalide'),
});

/**
 * Schéma de validation pour la réinitialisation
 */
export const resetPasswordSchema = z.object({
    token: z.string()
        .min(1, 'Le token est requis'),

    nouveauMotDePasse: z.string()
        .min(LIMITS.PASSWORD_MIN_LENGTH, `Le mot de passe doit faire au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`)
        .max(LIMITS.PASSWORD_MAX_LENGTH, `Le mot de passe ne peut pas dépasser ${LIMITS.PASSWORD_MAX_LENGTH} caractères`)
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),

    confirmationMotDePasse: z.string(),
}).refine((data) => data.nouveauMotDePasse === data.confirmationMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmationMotDePasse'],
});

/**
 * Schéma de validation pour le rafraîchissement de token
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Le token de rafraîchissement est requis'),
});

/**
 * Schéma de validation pour la vérification email
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Le token de vérification est requis'),
});

/**
 * Schéma de déconnexion (refreshToken optionnel)
 */
export const logoutSchema = z.object({
    refreshToken: z.string().optional(),
});

// Types inférés
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

export default {
    loginSchema,
    registerSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    verifyEmailSchema,
    logoutSchema,
};
