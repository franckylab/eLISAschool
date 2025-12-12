/**
 * ==================================
 * eLISAschool - Énumérations des rôles et permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

/**
 * Rôles disponibles dans l'application
 */
export enum Role {
    /** Super administrateur - accès total */
    SUPER_ADMIN = 'SUPER_ADMIN',

    /** Administrateur de l'établissement */
    ADMIN = 'ADMIN',

    /** Chef d'établissement */
    CHEF_ETABLISSEMENT = 'CHEF_ETABLISSEMENT',

    /** Enseignant */
    ENSEIGNANT = 'ENSEIGNANT',

    /** Personnel non-enseignant (secrétaire, etc.) */
    PERSONNEL = 'PERSONNEL',

    /** Responsable cantine */
    RESPONSABLE_CANTINE = 'RESPONSABLE_CANTINE',

    /** Responsable transport */
    RESPONSABLE_TRANSPORT = 'RESPONSABLE_TRANSPORT',

    /** Parent d'élève */
    PARENT = 'PARENT',

    /** Élève */
    ELEVE = 'ELEVE',
}

/**
 * Permissions granulaires
 */
export enum Permission {
    // Utilisateurs
    USERS_VIEW = 'users:view',
    USERS_CREATE = 'users:create',
    USERS_EDIT = 'users:edit',
    USERS_DELETE = 'users:delete',

    // Rôles
    ROLES_VIEW = 'roles:view',
    ROLES_MANAGE = 'roles:manage',

    // Notes
    NOTES_VIEW = 'notes:view',
    NOTES_CREATE = 'notes:create',
    NOTES_EDIT = 'notes:edit',
    NOTES_DELETE = 'notes:delete',
    NOTES_VALIDATE = 'notes:validate',

    // Bulletins
    BULLETINS_VIEW = 'bulletins:view',
    BULLETINS_GENERATE = 'bulletins:generate',
    BULLETINS_PRINT = 'bulletins:print',

    // Cantine
    CANTINE_VIEW = 'cantine:view',
    CANTINE_MANAGE = 'cantine:manage',

    // Transport
    TRANSPORT_VIEW = 'transport:view',
    TRANSPORT_MANAGE = 'transport:manage',

    // Matériel
    MATERIEL_VIEW = 'materiel:view',
    MATERIEL_MANAGE = 'materiel:manage',

    // Clubs
    CLUBS_VIEW = 'clubs:view',
    CLUBS_MANAGE = 'clubs:manage',

    // Documents
    DOCUMENTS_VIEW = 'documents:view',
    DOCUMENTS_CREATE = 'documents:create',
    DOCUMENTS_PRINT = 'documents:print',

    // Cartes
    CARTES_VIEW = 'cartes:view',
    CARTES_GENERATE = 'cartes:generate',
    CARTES_PRINT = 'cartes:print',

    // Configuration
    CONFIG_VIEW = 'config:view',
    CONFIG_EDIT = 'config:edit',

    // Monitoring
    MONITORING_VIEW = 'monitoring:view',

    // Messagerie
    MESSAGES_SEND = 'messages:send',
    MESSAGES_BROADCAST = 'messages:broadcast',

    // Notifications
    NOTIFICATIONS_MANAGE = 'notifications:manage',

    // Requêtes
    REQUETES_VIEW = 'requetes:view',
    REQUETES_CREATE = 'requetes:create',
    REQUETES_APPROVE = 'requetes:approve',

    // Gamification
    GAMIFICATION_VIEW = 'gamification:view',
    GAMIFICATION_MANAGE = 'gamification:manage',
}

/**
 * Mapping des permissions par défaut pour chaque rôle
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: Object.values(Permission), // Toutes les permissions

    [Role.ADMIN]: [
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT,
        Permission.ROLES_VIEW, Permission.ROLES_MANAGE,
        Permission.CONFIG_VIEW, Permission.CONFIG_EDIT,
        Permission.MONITORING_VIEW,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.NOTIFICATIONS_MANAGE,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
    ],

    [Role.CHEF_ETABLISSEMENT]: [
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.CONFIG_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
    ],

    [Role.ENSEIGNANT]: [
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    [Role.PERSONNEL]: [
        Permission.USERS_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    [Role.RESPONSABLE_CANTINE]: [
        Permission.CANTINE_VIEW, Permission.CANTINE_MANAGE,
        Permission.MESSAGES_SEND,
    ],

    [Role.RESPONSABLE_TRANSPORT]: [
        Permission.TRANSPORT_VIEW, Permission.TRANSPORT_MANAGE,
        Permission.MESSAGES_SEND,
    ],

    [Role.PARENT]: [
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
    ],

    [Role.ELEVE]: [
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW,
        Permission.GAMIFICATION_VIEW,
    ],
};

export default { Role, Permission, DEFAULT_ROLE_PERMISSIONS };
