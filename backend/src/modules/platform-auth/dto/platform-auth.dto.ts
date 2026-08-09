/**
 * ==================================
 * eLISAschool - DTOs Platform Auth
 * ==================================
 * Version: 1.0.0
 *
 * Schémas Zod pour l'authentification plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { z } from 'zod';

// =============================================
// Schémas de validation
// =============================================

export const platformLoginSchema = z.object({
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(1, 'Mot de passe requis'),
    codeMfa: z.string().optional(),
});

export type PlatformLoginDto = z.infer<typeof platformLoginSchema>;

// =============================================
// Réponses
// =============================================

export interface PlatformLoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    utilisateur: {
        identiteId: string;
        email: string;
        prenom: string;
        nom: string;
        rolePlateforme: string;
        avatarUrl?: string | null;
        mfaActive: boolean;
    };
    memberships: Array<{
        contexteType: string;
        contexteId: string | null;
        role: string;
    }>;
}

export interface PlatformMeResponse {
    identiteId: string;
    email: string;
    prenom: string;
    nom: string;
    rolePlateforme: string;
    avatarUrl?: string | null;
    mfaActive: boolean;
    memberships: Array<{
        contexteType: string;
        contexteId: string | null;
        role: string;
        estActif: boolean;
    }>;
    derniereConnexion: Date | null;
}
