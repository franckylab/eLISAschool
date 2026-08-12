/**
 * ==================================
 * eLISAschool - DTOs Platform Auth (Compatibilité ADR-005)
 * ==================================
 * Version: 2.0.0 — ADR-005 (v11)
 *
 * Schémas Zod pour les routes de compatibilité /api/platform/auth/*.
 * Le login réel est délégué au auth.service.ts unifié (source unique).
 *
 * ADR-005 : Plus de DTOs dual-plane (PlatformLoginResponse, PlatformMfaRequiredResponse,
 * PlatformMeResponse supprimés). Utilise LoginResponseDto du module auth.
 */

import { z } from 'zod';

// =============================================
// Schéma de compatibilité pour la route /api/platform/auth/login
// =============================================

/**
 * Schéma de login plateforme (compatibilité route).
 * Délègue au auth.service.ts unifié (ADR-005 — source unique de vérité).
 */
export const platformLoginSchema = z.object({
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(1, 'Mot de passe requis'),
});

export type PlatformLoginDto = z.infer<typeof platformLoginSchema>;
