/**
 * ==================================
 * eLISAschool - Platform CASL Abilities
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Système CASL indépendant pour la plateforme (Control Plane).
 * Séparé du defineAbility() tenant pour isolation stricte.
 *
 * Actions plateforme : manage, read, create, update, delete, approve, export, toggle
 * Subjects plateforme : Etablissement, Abonnement, Facture, Plan, Provider, Module,
 *   PlatformUser, PlatformRole, Monitoring, AuditLog, ActionCritique, Backup,
 *   Configuration, GroupeSaaS, all
 */

import { AbilityBuilder, CreateAbility, createMongoAbility } from '@casl/ability';

// =============================================
// Types Platform
// =============================================

export type PlatformAction =
    | 'manage'
    | 'read'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'export'
    | 'toggle';

export type PlatformSubject =
    | 'all'
    | 'Etablissement'
    | 'Abonnement'
    | 'Facture'
    | 'Plan'
    | 'Provider'
    | 'Module'
    | 'PlatformUser'
    | 'PlatformRole'
    | 'Monitoring'
    | 'AuditLog'
    | 'ActionCritique'
    | 'Backup'
    | 'Configuration'
    | 'GroupeSaaS';

export type PlatformAbility = CreateAbility<
    typeof createMongoAbility<[PlatformAction, PlatformSubject]>
>;

// =============================================
// definePlatformAbility
// =============================================

/**
 * Définit les capacités CASL pour un utilisateur plateforme.
 *
 * @param role - Rôle plateforme (RolePlateforme) ou null si pas de membership plateforme
 * @returns PlatformAbility instance pour vérifier les accès
 */
export function definePlatformAbility(role: string | null): PlatformAbility {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility<
        [PlatformAction, PlatformSubject]
    >);

    switch (role) {
        case 'SUPER_ADMIN':
            defineSuperAdminPlatformAbility(can);
            break;
        case 'ADMIN_PLATEFORME':
            defineAdminPlateformeAbility(can, cannot);
            break;
        case 'SUPPORT':
            defineSupportAbility(can, cannot);
            break;
        case 'BILLING_MANAGER':
            defineBillingManagerAbility(can, cannot);
            break;
        case 'ANALYST':
            defineAnalystAbility(can, cannot);
            break;
        case 'AUDITOR':
            defineAuditorAbility(can, cannot);
            break;
        default:
            // Pas de rôle plateforme → aucun accès
            break;
    }

    return build();
}

// =============================================
// Abilities par rôle plateforme
// =============================================

function defineSuperAdminPlatformAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
) {
    can('manage', 'all');
}

function defineAdminPlateformeAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
    cannot: AbilityBuilder<PlatformAbility>['cannot'],
) {
    // Gestion complète des tenants et utilisateurs
    can('manage', 'Etablissement');
    can('manage', 'Abonnement');
    can('manage', 'PlatformUser');
    can('manage', 'GroupeSaaS');

    // Lecture + update configuration
    can('read', 'Monitoring');
    can('read', 'AuditLog');
    can('read', 'Configuration');
    can('update', 'Configuration');

    // Facturation
    can('manage', 'Facture');
    can('manage', 'Plan');
    can('manage', 'Provider');

    // Modules
    can('read', 'Module');
    can('toggle', 'Module');

    // Backups
    can('manage', 'Backup');

    // Rôles plateforme
    can('read', 'PlatformRole');

    // Interdictions explicites
    cannot('approve', 'ActionCritique'); // Réservé SUPER_ADMIN
    cannot('delete', 'PlatformUser', { role: 'SUPER_ADMIN' } as any); // Pas de suppression de SUPER_ADMIN
}

function defineSupportAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
    cannot: AbilityBuilder<PlatformAbility>['cannot'],
) {
    // Lecture seule pour support technique
    can('read', 'Etablissement');
    can('read', 'Monitoring');
    can('read', 'AuditLog');
    can('read', 'PlatformUser');
    can('read', 'Configuration');

    // Aucune écriture
    cannot('create', 'all');
    cannot('update', 'all');
    cannot('delete', 'all');
    cannot('toggle', 'all');
    cannot('approve', 'all');
}

function defineBillingManagerAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
    cannot: AbilityBuilder<PlatformAbility>['cannot'],
) {
    // Gestion facturation complète
    can('manage', 'Facture');
    can('manage', 'Plan');
    can('manage', 'Provider');
    can('manage', 'Abonnement');

    // Lecture établissements et modules
    can('read', 'Etablissement');
    can('read', 'Module');
    can('read', 'GroupeSaaS');

    // Interdictions
    cannot('delete', 'Etablissement');
    cannot('manage', 'PlatformUser');
    cannot('manage', 'PlatformRole');
    cannot('approve', 'ActionCritique');
}

function defineAnalystAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
    cannot: AbilityBuilder<PlatformAbility>['cannot'],
) {
    // Lecture + export globaux
    can('read', 'all');
    can('export', 'all');

    // Aucune écriture
    cannot('create', 'all');
    cannot('update', 'all');
    cannot('delete', 'all');
    cannot('toggle', 'all');
    cannot('approve', 'all');
}

function defineAuditorAbility(
    can: AbilityBuilder<PlatformAbility>['can'],
    cannot: AbilityBuilder<PlatformAbility>['cannot'],
) {
    // Lecture audit + monitoring + établissements
    can('read', 'AuditLog');
    can('read', 'Monitoring');
    can('read', 'Etablissement');
    can('read', 'PlatformUser');
    can('read', 'Configuration');

    // Export audit + monitoring
    can('export', 'AuditLog');
    can('export', 'Monitoring');

    // Aucune écriture
    cannot('create', 'all');
    cannot('update', 'all');
    cannot('delete', 'all');
    cannot('toggle', 'all');
    cannot('approve', 'all');
}

export default definePlatformAbility;
