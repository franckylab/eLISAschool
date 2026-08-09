/**
 * ==================================
 * eLISAschool - DTOs d'authentification
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Réexporte les schémas partagés depuis @shared/validators
 * et ajoute les types spécifiques au backend (JWT, réponses).
 * 
 * Source unique de vérité pour les schémas : shared/src/validators/auth.validators.ts
 */

// ==================================
// Réexporter les schémas depuis shared
// ==================================
export {
    loginSchema,
    registerSchema,
    refreshTokenSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailSchema,
    logoutSchema,
} from '@shared/validators/auth.validators';

// ==================================
// Aliases de types pour compatibilité ascendante
// ==================================
export type {
    LoginInput as LoginDto,
    RegisterInput as RegisterDto,
    RefreshTokenInput as RefreshTokenDto,
    ForgotPasswordInput as ForgotPasswordDto,
    ResetPasswordInput as ResetPasswordDto,
    ChangePasswordInput as ChangePasswordDto,
    VerifyEmailInput as VerifyEmailDto,
    LogoutInput as LogoutDto,
} from '@shared/validators/auth.validators';

// ==================================
// Interfaces de réponse (backend uniquement)
// ==================================

/**
 * Réponse de connexion réussie
 */
export interface LoginResponseDto {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    utilisateur?: {
        id: string;
        email: string;
        matricule: string;
        role: string;
        nom: string;
        prenom: string;
        etablissementActif?: string;
        etablissements?: Array<{
            etablissementId: string;
            role: string;
            etablissementPrincipal: boolean;
            actif: boolean;
        }>;
        permissions?: string[];
    };
    // NOUVEAU v3.0 : Sélection d'établissement
    etablissementsDisponibles?: Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
        logoUrl?: string;
    }>;
    requiereSelectionEtablissement?: boolean;
    tokenTemporaire?: boolean;
    // MFA — Phase P1 v6
    mfaRequired?: boolean;
    mfaToken?: string;
}

/**
 * Payload du JWT
 */
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    roles?: string[];
    // Permissions volontairement exclues du JWT : elles sont résolues côté serveur
    // à chaque requête (permissionResolverService, avec cache) pour éviter un
    // token > 16KB qui provoquerait des erreurs HTTP 431.
    etablissementId?: string;
    roleDansEtablissement?: string; // NOUVEAU v3.0 : rôle spécifique à l'établissement actif
    etablissements?: Array<{
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
    role: string;
    roles?: string[];
    permissions?: string[];
    etablissementId?: string;
    etablissements?: Array<{
        etablissementId: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
}
