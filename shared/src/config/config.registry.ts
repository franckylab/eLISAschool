/**
 * ==================================
 * eLISAschool - Registre de Configuration des Modules
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Configuration par défaut de chaque module
 */

import { ModuleName } from '../enums/modules.enum';
import { Role, Permission } from '../enums/roles.enum';

/**
 * Configuration d'un module
 */
export interface ModuleConfig {
    /** Nom du module */
    name: ModuleName;
    /** Libellé français */
    label: string;
    /** Description */
    description: string;
    /** Icône (Lucide React) */
    icon: string;
    /** Route de base */
    basePath: string;
    /** Activé par défaut */
    defaultActive: boolean;
    /** Requiert une licence premium */
    premium: boolean;
    /** Rôles ayant accès par défaut */
    defaultRoles: Role[];
    /** Permissions associées */
    permissions: Permission[];
    /** Dépendances (autres modules requis) */
    dependencies: ModuleName[];
    /** Paramètres par défaut du module */
    defaultSettings: Record<string, any>;
}

/**
 * Registre de tous les modules avec leur configuration
 */
export const MODULE_REGISTRY: Record<ModuleName, ModuleConfig> = {
    // ============ MODULES CRITIQUES ============
    [ModuleName.AUTH]: {
        name: ModuleName.AUTH,
        label: 'Authentification',
        description: 'Gestion des connexions et de la sécurité',
        icon: 'Shield',
        basePath: '/auth',
        defaultActive: true,
        premium: false,
        defaultRoles: Object.values(Role),
        permissions: [],
        dependencies: [],
        defaultSettings: {
            sessionDuration: 24 * 60, // 24h en minutes
            maxLoginAttempts: 5,
            lockoutDuration: 15, // minutes
            require2FA: false,
            passwordMinLength: 8,
        },
    },

    [ModuleName.UTILISATEURS]: {
        name: ModuleName.UTILISATEURS,
        label: 'Utilisateurs',
        description: 'Gestion des comptes utilisateurs',
        icon: 'Users',
        basePath: '/utilisateurs',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT, Permission.USERS_DELETE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            allowSelfRegistration: false,
            requireEmailVerification: true,
            defaultRole: Role.ELEVE,
        },
    },

    [ModuleName.CONFIGURATION]: {
        name: ModuleName.CONFIGURATION,
        label: 'Configuration',
        description: 'Paramètres de l\'application',
        icon: 'Settings',
        basePath: '/configuration',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: [Permission.CONFIG_VIEW, Permission.CONFIG_EDIT],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {},
    },

    // ============ MODULES COMMUNICATION ============
    [ModuleName.NOTIFICATIONS]: {
        name: ModuleName.NOTIFICATIONS,
        label: 'Notifications',
        description: 'Alertes et notifications utilisateurs',
        icon: 'Bell',
        basePath: '/notifications',
        defaultActive: true,
        premium: false,
        defaultRoles: Object.values(Role),
        permissions: [Permission.NOTIFICATIONS_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            enablePush: true,
            enableEmail: true,
            enableSMS: false,
            defaultChannel: 'IN_APP',
        },
    },

    [ModuleName.MESSAGERIE]: {
        name: ModuleName.MESSAGERIE,
        label: 'Messagerie',
        description: 'Communication interne',
        icon: 'MessageSquare',
        basePath: '/messagerie',
        defaultActive: true,
        premium: false,
        defaultRoles: Object.values(Role),
        permissions: [Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            allowAttachments: true,
            maxAttachmentSize: 5 * 1024 * 1024, // 5MB
            allowGroupChats: true,
        },
    },

    [ModuleName.REQUETES]: {
        name: ModuleName.REQUETES,
        label: 'Requêtes',
        description: 'Demandes administratives',
        icon: 'FileText',
        basePath: '/requetes',
        defaultActive: true,
        premium: false,
        defaultRoles: Object.values(Role),
        permissions: [Permission.REQUETES_VIEW, Permission.REQUETES_CREATE, Permission.REQUETES_APPROVE],
        dependencies: [ModuleName.AUTH, ModuleName.NOTIFICATIONS],
        defaultSettings: {
            requireApproval: true,
            approvalLevels: 1,
        },
    },

    [ModuleName.SONDAGES]: {
        name: ModuleName.SONDAGES,
        label: 'Sondages',
        description: 'Création et gestion de sondages',
        icon: 'CircleHelp',
        basePath: '/sondages',
        defaultActive: true,
        premium: false,
        defaultRoles: Object.values(Role),
        permissions: [Permission.SONDAGES_CREATE, Permission.SONDAGES_VOTE, Permission.SONDAGES_ANALYZE],
        dependencies: [ModuleName.AUTH, ModuleName.NOTIFICATIONS],
        defaultSettings: {
            maxDestinataires: 500,
            maxOptions: 20,
            dureeParDefaut: '7j',
            allowAnonymous: true,
            allowMultipleChoice: true,
        },
    },

    // ============ MODULES ACADÉMIQUES ============
    [ModuleName.NOTES]: {
        name: ModuleName.NOTES,
        label: 'Notes',
        description: 'Saisie et gestion des notes',
        icon: 'GraduationCap',
        basePath: '/notes',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PARENT, Role.ELEVE],
        permissions: [Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT, Permission.NOTES_DELETE, Permission.NOTES_VALIDATE],
        dependencies: [ModuleName.AUTH, ModuleName.UTILISATEURS],
        defaultSettings: {
            defaultBareme: 20,
            allowBulkEntry: true,
            requireValidation: true,
            showClassRanking: true,
        },
    },

    [ModuleName.BULLETINS]: {
        name: ModuleName.BULLETINS,
        label: 'Bulletins',
        description: 'Génération des bulletins scolaires',
        icon: 'FileSpreadsheet',
        basePath: '/bulletins',
        defaultActive: false,
        premium: true,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: [Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT],
        dependencies: [ModuleName.NOTES],
        defaultSettings: {
            includeRanking: true,
            includeComments: true,
            templateId: 'default',
        },
    },

    [ModuleName.ELEVES]: {
        name: ModuleName.ELEVES,
        label: 'Élèves',
        description: 'Gestion des dossiers élèves',
        icon: 'UserCheck',
        basePath: '/eleves',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PERSONNEL, Role.PARENT],
        permissions: [],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            requireValidation: false,
            validationLevels: 2,
            autoGenerateMatricule: true,
        },
    },

    [ModuleName.ORIENTATION]: {
        name: ModuleName.ORIENTATION,
        label: 'Orientation',
        description: 'Conseil d\'orientation scolaire',
        icon: 'Compass',
        basePath: '/orientation',
        defaultActive: false,
        premium: true,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: [],
        dependencies: [ModuleName.NOTES],
        defaultSettings: {},
    },

    [ModuleName.RESPONSABLES_ELEVES]: {
        name: ModuleName.RESPONSABLES_ELEVES,
        label: 'Responsables Élèves',
        description: 'Gestion des relations parents-élèves',
        icon: 'Users',
        basePath: '/responsables-eleves',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL, Role.PARENT],
        permissions: [],
        dependencies: [ModuleName.AUTH, ModuleName.ELEVES],
        defaultSettings: {
            allowMultipleParents: true,
            requireLegalGuardian: true,
            enablePaymentAccess: false,
        },
    },

    [ModuleName.PROGRAMMES]: {
        name: ModuleName.PROGRAMMES,
        label: 'Programmes Pédagogiques',
        description: 'Gestion du programme scolaire par période et suivi de progression',
        icon: 'BookOpen',
        basePath: '/programmes',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: [],
        dependencies: [ModuleName.AUTH, ModuleName.NOTES],
        defaultSettings: {
            enableGamification: true,
            autoCalculProgression: true,
            seuilConformite: 90,
        },
    },

    // ============ MODULES LOGISTIQUES ============
    [ModuleName.CANTINE]: {
        name: ModuleName.CANTINE,
        label: 'Cantine',
        description: 'Gestion des repas scolaires',
        icon: 'Utensils',
        basePath: '/cantine',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_CANTINE, Role.PARENT],
        permissions: [Permission.CANTINE_VIEW, Permission.CANTINE_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            defaultCurrency: 'XOF',
            menuPlanningDays: 7,
            allowPreorder: true,
        },
    },

    [ModuleName.TRANSPORT]: {
        name: ModuleName.TRANSPORT,
        label: 'Transport',
        description: 'Gestion des bus scolaires',
        icon: 'Bus',
        basePath: '/transport',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_TRANSPORT, Role.PARENT],
        permissions: [Permission.TRANSPORT_VIEW, Permission.TRANSPORT_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            enableGPS: false,
            enableQRCheckin: true,
        },
    },

    [ModuleName.MATERIEL]: {
        name: ModuleName.MATERIEL,
        label: 'Matériel',
        description: 'Inventaire et prêts de matériel',
        icon: 'Package',
        basePath: '/materiel',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PERSONNEL],
        permissions: [Permission.MATERIEL_VIEW, Permission.MATERIEL_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            enableBarcode: true,
            maxLoanDays: 30,
        },
    },
    
    [ModuleName.FINANCES]: {
        name: ModuleName.FINANCES,
        label: 'Finances',
        description: 'Gestion financière et paiements',
        icon: 'CreditCard',
        basePath: '/finances',
        defaultActive: false,
        premium: true,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [Permission.FINANCES_VIEW, Permission.FINANCES_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            defaultCurrency: 'XOF',
            enableOnlinePayment: false,
        },
    },

    // ============ MODULES ACTIVITÉS ============
    [ModuleName.CLUBS]: {
        name: ModuleName.CLUBS,
        label: 'Clubs',
        description: 'Activités extrascolaires',
        icon: 'Users2',
        basePath: '/clubs',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ENSEIGNANT, Role.ELEVE],
        permissions: [Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            maxClubsPerStudent: 3,
        },
    },

    [ModuleName.GAMIFICATION]: {
        name: ModuleName.GAMIFICATION,
        label: 'Gamification',
        description: 'Points et récompenses',
        icon: 'Trophy',
        basePath: '/gamification',
        defaultActive: false,
        premium: true,
        defaultRoles: Object.values(Role),
        permissions: [Permission.GAMIFICATION_VIEW, Permission.GAMIFICATION_MANAGE],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            pointsPerAttendance: 5,
            pointsPerGoodGrade: 10,
            enableLeaderboard: true,
            anonymizeRanking: false,
        },
    },

    // ============ MODULES DOCUMENTS ============
    [ModuleName.CARTES]: {
        name: ModuleName.CARTES,
        label: 'Cartes',
        description: 'Cartes scolaires et badges',
        icon: 'CreditCard',
        basePath: '/cartes',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PERSONNEL],
        permissions: [Permission.CARTES_VIEW, Permission.CARTES_GENERATE, Permission.CARTES_PRINT],
        dependencies: [ModuleName.AUTH, ModuleName.UTILISATEURS],
        defaultSettings: {
            enableQRCode: true,
            cardValidityMonths: 12,
        },
    },

    [ModuleName.DOCUMENTS]: {
        name: ModuleName.DOCUMENTS,
        label: 'Documents',
        description: 'Gestion documentaire',
        icon: 'FolderOpen',
        basePath: '/documents',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PERSONNEL],
        permissions: [Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {},
    },

    [ModuleName.IMPRESSIONS]: {
        name: ModuleName.IMPRESSIONS,
        label: 'Impressions',
        description: 'File d\'impression',
        icon: 'Printer',
        basePath: '/impressions',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.PERSONNEL],
        permissions: [],
        dependencies: [ModuleName.DOCUMENTS],
        defaultSettings: {
            defaultPrinter: null,
        },
    },

    // ============ MODULES SYSTÈME ============
    [ModuleName.SUIVI_ELEVES]: {
        name: ModuleName.SUIVI_ELEVES,
        label: 'Suivi Élèves',
        description: 'Suivi académique et comportemental des élèves',
        icon: 'UserCheck',
        basePath: '/suivi-eleves',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: [],
        dependencies: [ModuleName.AUTH, ModuleName.ELEVES],
        defaultSettings: {},
    },

    [ModuleName.SUIVI_PERSONNEL]: {
        name: ModuleName.SUIVI_PERSONNEL,
        label: 'Suivi Personnel',
        description: 'Scoring, évaluations et classement du personnel',
        icon: 'UserCog',
        basePath: '/suivi-personnel',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {},
    },

    [ModuleName.SANTE]: {
        name: ModuleName.SANTE,
        label: 'Santé',
        description: 'Suivi sanitaire et infirmerie',
        icon: 'Heart',
        basePath: '/sante',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {},
    },
    [ModuleName.SCORING]: {
        name: ModuleName.SCORING,
        label: 'Scoring',
        description: 'Évaluation globale des performances',
        icon: 'BarChart2',
        basePath: '/scoring',
        defaultActive: false,
        premium: true,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [],
        dependencies: [ModuleName.NOTES, ModuleName.GAMIFICATION],
        defaultSettings: {},
    },

    [ModuleName.MONITORING]: {
        name: ModuleName.MONITORING,
        label: 'Monitoring',
        description: 'Supervision système',
        icon: 'Activity',
        basePath: '/monitoring',
        defaultActive: false,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: [Permission.MONITORING_VIEW],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            retentionDays: 30,
        },
    },

    [ModuleName.PERIPHERIQUES]: {
        name: ModuleName.PERIPHERIQUES,
        label: 'Périphériques',
        description: 'Gestion des imprimantes et scanners',
        icon: 'Usb',
        basePath: '/peripheriques',
        defaultActive: false,
        premium: true,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: [],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {},
    },

    [ModuleName.DASHBOARD]: {
        name: ModuleName.DASHBOARD,
        label: 'Dashboard',
        description: 'Tableaux de bord dynamiques personnalisés',
        icon: 'LayoutDashboard',
        basePath: '/dashboard',
        defaultActive: true,
        premium: false,
        defaultRoles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PARENT, Role.ELEVE],
        permissions: [],
        dependencies: [ModuleName.AUTH],
        defaultSettings: {
            autoRefresh: true,
            refreshInterval: 300,
            defaultLayout: 'grid',
        },
    },
};

/**
 * Récupère la configuration d'un module
 */
export function getModuleConfig(moduleName: ModuleName): ModuleConfig {
    return MODULE_REGISTRY[moduleName];
}

/**
 * Récupère tous les modules d'une catégorie
 */
export function getModulesByCategory(category: string): ModuleConfig[] {
    return Object.values(MODULE_REGISTRY).filter(
        (m) => m.basePath.includes(category) || m.label.toLowerCase().includes(category)
    );
}

/**
 * Vérifie si un rôle a accès à un module
 */
export function hasModuleAccess(moduleName: ModuleName, role: Role): boolean {
    const config = MODULE_REGISTRY[moduleName];
    return config.defaultRoles.includes(role);
}

export default { MODULE_REGISTRY, getModuleConfig, getModulesByCategory, hasModuleAccess };
