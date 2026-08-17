/**
 * ==================================
 * eLISAschool - CASL Ability Definitions
 * ==================================
 * Version: 5.1.0
 * 
 * Définition des capacités CASL par rôle + contexte établissement.
 * Partagé frontend/backend via le package shared.
 * 
 * Phase 2.2 — Refonte SaaS
 * Rules par role + contexte (ABAC) :
 * - SUPER_ADMIN : can('manage', 'all')
 * - DIRECTEUR : can('manage', 'all') scoped a etablissementId
 * - ENSEIGNANT : can('read', 'Note', { matiereId: ownMatiereIds })
 * - PARENT : can('read', 'Note', { eleveId: ownEnfantIds })
 * - COMPTABLE : can('read', 'Finances') scoped
 */

import { AbilityBuilder, PureAbility, ForcedSubject } from '@casl/ability';

// =============================================
// Types CASL — Actions et Subjects
// =============================================

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'import' | 'generate' | 'validate' | 'toggle';

export type Subject =
    | 'all'
    | 'Etablissement'
    | 'Eleve'
    | 'Note'
    | 'Bulletin'
    | 'Classe'
    | 'Matiere'
    | 'Programme'
    | 'Periode'
    | 'AnneeScolaire'
    | 'Personnel'
    | 'Contrat'
    | 'Paie'
    | 'Finances'
    | 'Paiement'
    | 'NotePaiement'
    | 'Transport'
    | 'Cantine'
    | 'Messagerie'
    | 'Sondage'
    | 'Annonce'
    | 'Club'
    | 'Gamification'
    | 'Carte'
    | 'Sante'
    | 'Orientation'
    | 'EmploiDuTemps'
    | 'Salle'
    | 'Configuration'
    | 'Module'
    | 'Parametre'
    | 'Audit'
    | 'Monitoring'
    | 'Utilisateur'
    | 'Role'
    | 'Permission'
    | 'Organisation'
    | 'GroupeEtablissement'
    | 'Recrutement'
    | 'Bibliotheque'
    | 'Billing'
    | 'Backup';

export type AppAbility = PureAbility<[Action, Subject | ForcedSubject<Subject>]>;

// =============================================
// Contexte utilisateur pour la résolution
// =============================================

export interface AbilityContext {
    id: string;
    role: string;
    etablissementId?: string;
    permissions?: string[];
    etablissements?: Array<{
        etablissementId: string;
        role: string;
        actif: boolean;
    }>;
    // Contexte spécifique pour ABAC
    ownMatiereIds?: string[];
    ownEleveIds?: string[];
    ownClassIds?: string[];
}

// =============================================
// Definition des abilities par rôle
// =============================================

/**
 * Définit les capacités CASL pour un utilisateur donné.
 * Utilise le pattern AbilityBuilder de CASL.js.
 * 
 * @param ctx - Contexte utilisateur (rôle, permissions, établissement)
 * @returns AppAbility instance pour vérifier les accès
 */
export function defineAbility(ctx: AbilityContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);
    void cannot;

    switch (ctx.role) {
        case 'SUPER_ADMIN':
            defineSuperAdminAbility(can);
            break;
        case 'ADMIN':
            defineAdminAbility(can, cannot, ctx);
            break;
        case 'DIRECTEUR':
        case 'PROVISEUR':
        case 'PRINCIPAL':
            defineDirecteurAbility(can, cannot, ctx);
            break;
        case 'CENSEUR':
            defineCenseurAbility(can, ctx);
            break;
        case 'ENSEIGNANT':
            defineEnseignantAbility(can, ctx);
            break;
        case 'COMPTABLE':
            defineComptableAbility(can, ctx);
            break;
        case 'PARENT':
            defineParentAbility(can, ctx);
            break;
        case 'ELEVE':
            defineEleveAbility(can, ctx);
            break;

        // =============================================
        // Durcissement v9 — G7 : Rôles plateforme en contexte tenant
        // Permissions minimales pour les utilisateurs plateforme opérant en tenant
        // =============================================
        case 'ADMIN_PLATEFORME':
            // Lecture seule en tenant (support/administration plateforme)
            can('read', 'all');
            break;
        case 'SUPPORT':
            // Lecture + gestion tickets
            can('read', 'all');
            can('update', 'Messagerie');
            break;
        case 'OBSERVATEUR':
            // Lecture seule
            can('read', 'all');
            break;
        case 'GESTIONNAIRE_GROUPES':
            // Lecture des établissements (filtrage par groupe appliqué au niveau middleware)
            can('read', 'Etablissement');
            can('read', 'Utilisateur');
            break;
        case 'FACTURATION':
            // Lecture + gestion factures
            can('read', 'all');
            can('manage', 'Finances');
            can('manage', 'Paiement');
            can('manage', 'Cantine');
            break;

        default:
            // Rôles secondaires — permissions minimales
            defineDefaultAbility(can, ctx);
            break;
    }

    return build();
}

// =============================================
// Abilities par rôle
// =============================================

function defineSuperAdminAbility(can: AbilityBuilder<AppAbility>['can']) {
    can('manage', 'all');
}

function defineAdminAbility(
    can: AbilityBuilder<AppAbility>['can'],
    cannot: AbilityBuilder<AppAbility>['cannot'],
    ctx: AbilityContext,
) {
    // ADMIN — gestion complète de son établissement
    can('manage', 'Etablissement', { id: ctx.etablissementId } as any);
    can('manage', 'Eleve');
    can('manage', 'Note');
    can('manage', 'Bulletin');
    can('manage', 'Classe');
    can('manage', 'Matiere');
    can('manage', 'Programme');
    can('manage', 'Periode');
    can('manage', 'AnneeScolaire');
    can('manage', 'Personnel');
    can('manage', 'Contrat');
    can('manage', 'Paie');
    can('manage', 'Finances');
    can('manage', 'Transport');
    can('manage', 'Cantine');
    can('manage', 'Messagerie');
    can('manage', 'Sondage');
    can('manage', 'Annonce');
    can('manage', 'Club');
    can('manage', 'Gamification');
    can('manage', 'Carte');
    can('manage', 'Sante');
    can('manage', 'Orientation');
    can('manage', 'EmploiDuTemps');
    can('manage', 'Salle');
    can('manage', 'Utilisateur');
    can('manage', 'Organisation');
    can('manage', 'Recrutement');
    can('manage', 'Bibliotheque');
    // Configuration établissement (lecture + écriture scoped)
    can('read', 'Configuration');
    can('read', 'Module');
    can('update', 'Parametre');
    can('read', 'Audit');
    // Interdictions explicites — portée plateforme
    cannot('delete', 'Configuration'); // Config globale = plateforme
    cannot('toggle', 'Module'); // Toggle global = plateforme
    cannot('manage', 'GroupeEtablissement'); // Cross-tenant
    cannot('manage', 'Monitoring'); // Infrastructure = plateforme
}

function defineDirecteurAbility(
    can: AbilityBuilder<AppAbility>['can'],
    cannot: AbilityBuilder<AppAbility>['cannot'],
    ctx: AbilityContext,
) {
    // DIRECTEUR — comme ADMIN mais sans certaines actions sensibles
    defineAdminAbility(can, cannot, ctx);
    // Restrictions supplémentaires
    cannot('delete', 'Etablissement');
    cannot('delete', 'Personnel');
    cannot('manage', 'Role');
    cannot('manage', 'Permission');
}

function defineCenseurAbility(can: AbilityBuilder<AppAbility>['can'], _ctx: AbilityContext) {
    // CENSEUR — discipline + organisation + lecture académique
    can('read', 'Eleve');
    can('create', 'Eleve');
    can('update', 'Eleve');
    can('read', 'Note');
    can('read', 'Bulletin');
    can('read', 'Classe');
    can('read', 'Messagerie');
    can('create', 'Messagerie');
    can('read', 'Organisation');
    can('manage', 'EmploiDuTemps');
    can('read', 'Finances');
    can('validate', 'Eleve');
    can('validate', 'Club');
}

function defineEnseignantAbility(can: AbilityBuilder<AppAbility>['can'], ctx: AbilityContext) {
    // ENSEIGNANT — accès scoped à SES matieres/classes
    can('read', 'Eleve');
    can('read', 'Classe');
    can('read', 'Matiere');
    
    // Notes : créer/lire pour ses propres matières
    if (ctx.ownMatiereIds?.length) {
        can('manage', 'Note', { matiereId: ctx.ownMatiereIds } as any);
    } else {
        can('read', 'Note');
    }
    
    can('read', 'Bulletin');
    can('read', 'EmploiDuTemps');
    can('read', 'Messagerie');
    can('create', 'Messagerie');
    can('read', 'Programme');
    can('read', 'Periode');
}

function defineComptableAbility(can: AbilityBuilder<AppAbility>['can'], _ctx: AbilityContext) {
    // COMPTABLE — finances en lecture + validation paiements
    can('read', 'Finances');
    can('read', 'Paiement');
    can('validate', 'Paiement');
    can('read', 'Eleve');
    can('read', 'NotePaiement');
    can('export', 'Finances');
    can('read', 'Messagerie');
}

function defineParentAbility(can: AbilityBuilder<AppAbility>['can'], ctx: AbilityContext) {
    // PARENT — lecture des notes de SES enfants
    if (ctx.ownEleveIds?.length) {
        can('read', 'Note', { eleveId: ctx.ownEleveIds } as any);
        can('read', 'Bulletin', { eleveId: ctx.ownEleveIds } as any);
        can('read', 'EmploiDuTemps', { classeId: ctx.ownClassIds } as any);
    }
    can('read', 'Messagerie');
    can('create', 'Messagerie');
    can('read', 'Sante');
}

function defineEleveAbility(can: AbilityBuilder<AppAbility>['can'], ctx: AbilityContext) {
    // ELEVE — lecture de ses propres données
    can('read', 'Note', { eleveId: ctx.id } as any);
    can('read', 'Bulletin', { eleveId: ctx.id } as any);
    can('read', 'EmploiDuTemps');
    can('read', 'Messagerie');
    can('create', 'Messagerie');
}

function defineDefaultAbility(can: AbilityBuilder<AppAbility>['can'], ctx: AbilityContext) {
    // Permissions minimales par défaut
    can('read', 'Messagerie');
    can('read', 'EmploiDuTemps');
    
    // Permissions dynamiques depuis le JWT
    if (ctx.permissions) {
        mapPermissionsToCasl(ctx.permissions, can);
    }
}

// =============================================
// Mapping permissions legacy → CASL
// =============================================

/**
 * Convertit les permissions legacy (ex: 'eleves:view') en rules CASL.
 * Utilisé pour les rôles qui ont des permissions dynamiques assignées via RBAC.
 */
function mapPermissionsToCasl(
    permissions: string[],
    can: AbilityBuilder<AppAbility>['can']
) {
    const actionMap: Record<string, Action> = {
        'view': 'read',
        'list': 'read',
        'read': 'read',
        'create': 'create',
        'edit': 'update',
        'update': 'update',
        'delete': 'delete',
        'manage': 'manage',
        'export': 'export',
        'import': 'import',
        'generate': 'generate',
        'validate': 'validate',
        'toggle': 'toggle',
    };

    const subjectMap: Record<string, Subject> = {
        'eleves': 'Eleve',
        'notes': 'Note',
        'bulletins': 'Bulletin',
        'classes': 'Classe',
        'matieres': 'Matiere',
        'programmes': 'Programme',
        'periodes': 'Periode',
        'finances': 'Finances',
        'transport': 'Transport',
        'cantine': 'Cantine',
        'messagerie': 'Messagerie',
        'sondages': 'Sondage',
        'annonces': 'Annonce',
        'clubs': 'Club',
        'gamification': 'Gamification',
        'cartes': 'Carte',
        'sante': 'Sante',
        'orientation': 'Orientation',
        'emploi-du-temps': 'EmploiDuTemps',
        'salles': 'Salle',
        'configuration': 'Configuration',
        'utilisateurs': 'Utilisateur',
        'roles': 'Role',
        'audit': 'Audit',
        'monitoring': 'Monitoring',
        'personnel': 'Personnel',
        'organisation': 'Organisation',
        'recrutement': 'Recrutement',
        'bibliotheque': 'Bibliotheque',
    };

    for (const perm of permissions) {
        const parts = perm.split(':');
        if (parts.length < 2) continue;

        const module = parts[0];
        const action = parts[parts.length - 1];
        
        const caslAction = actionMap[action];
        const caslSubject = subjectMap[module];
        
        if (caslAction && caslSubject) {
            can(caslAction, caslSubject);
        }
    }
}

export default defineAbility;
