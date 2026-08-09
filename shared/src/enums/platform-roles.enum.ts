/**
 * ==================================
 * eLISAschool - Enums Rôles Plateforme
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Rôles plateforme séparés des rôles tenant.
 * Utilisés dans la table utilisateurs_plateforme et memberships.
 */

/**
 * Rôles disponibles pour les administrateurs plateforme.
 * Chaque rôle a un ensemble de permissions défini dans platform-abilities.ts.
 */
export enum RolePlateforme {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN_PLATEFORME = 'ADMIN_PLATEFORME',
    SUPPORT = 'SUPPORT',
    BILLING_MANAGER = 'BILLING_MANAGER',
    ANALYST = 'ANALYST',
    AUDITOR = 'AUDITOR',
}

/**
 * Type de contexte pour les memberships.
 * PLATEFORME : accès au panel admin (Control Plane)
 * ETABLISSEMENT : accès aux données d'un établissement (Data Plane)
 */
export enum ContexteType {
    PLATEFORME = 'PLATEFORME',
    ETABLISSEMENT = 'ETABLISSEMENT',
}

/**
 * Statut d'une identité globale.
 */
export enum StatutIdentite {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU',
}

/**
 * Labels des rôles plateforme (i18n fallback).
 */
export const ROLE_PLATEFORME_LABELS: Record<RolePlateforme, string> = {
    [RolePlateforme.SUPER_ADMIN]: 'Super Administrateur',
    [RolePlateforme.ADMIN_PLATEFORME]: 'Admin Plateforme',
    [RolePlateforme.SUPPORT]: 'Support Technique',
    [RolePlateforme.BILLING_MANAGER]: 'Gestionnaire Facturation',
    [RolePlateforme.ANALYST]: 'Analyste',
    [RolePlateforme.AUDITOR]: 'Auditeur',
};

/**
 * Rôles système (non supprimables).
 */
export const ROLES_PLATEFORME_SYSTEME = new Set<string>(Object.values(RolePlateforme));

/**
 * Mapping des anciens rôles plateforme vers les nouveaux.
 * Utilisé pour la migration rétrocompatible.
 */
export const MAPPING_ANCIENS_ROLES: Record<string, RolePlateforme> = {
    SUPER_ADMIN: RolePlateforme.SUPER_ADMIN,
    ADMINISTRATION_PLATEFORME: RolePlateforme.ADMIN_PLATEFORME,
    SECURITE_PLATEFORME: RolePlateforme.SUPPORT,
    SUPPORT_PLATEFORME: RolePlateforme.SUPPORT,
    COMMERCIAL_PLATEFORME: RolePlateforme.BILLING_MANAGER,
    MONITORING_PLATEFORME: RolePlateforme.ANALYST,
};
