/**
 * ==================================
 * eLISAschool - Widget Registry
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Registre déclaratif de tous les widgets disponibles
 */

import { WidgetDefinition } from '../types/dashboard.types';
import { Role } from '@shared/enums/roles.enum';

/**
 * Registry de tous les widgets disponibles
 * Chaque widget est défini de manière déclarative avec :
 * - Rôles autorisés
 * - Permissions requises
 * - Résolveur de données
 * - Configuration de cache
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
    // ==================================
    // WIDGETS STATISTIQUES ÉLÈVES
    // ==================================
    {
        id: 'eleves-stats-general',
        nom: 'Statistiques Générales Élèves',
        description: 'Nombre total d\'élèves, actifs, radiés, répartition par genre',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL],
        permissions: ['eleves:view', 'eleves:statistiques:view'],
        dataResolver: 'dashboardDataService.getElevesStats',
        cacheTTL: 300, // 5 minutes
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'eleves',
        icon: 'Users',
        complexite: 2,
    },
    {
        id: 'eleves-repartition-classe',
        nom: 'Répartition par Classe',
        description: 'Nombre d\'élèves par classe',
        type: 'chart-bar',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL],
        permissions: ['eleves:view', 'classes:view'],
        dataResolver: 'dashboardDataService.getElevesRepartitionClasse',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'eleves',
        icon: 'BarChart3',
        complexite: 3,
    },
    {
        id: 'eleves-nouveaux',
        nom: 'Nouvelles Inscriptions',
        description: 'Dernières inscriptions d\'élèves',
        type: 'list',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL],
        permissions: ['eleves:view'],
        dataResolver: 'dashboardDataService.getElevesDernieresInscriptions',
        cacheTTL: 120,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'eleves',
        icon: 'UserPlus',
        complexite: 2,
    },

    // ==================================
    // WIDGETS NOTES & MOYENNES
    // ==================================
    {
        id: 'notes-moyennes-generales',
        nom: 'Moyennes Générales',
        description: 'Évolution des moyennes générales par période',
        type: 'chart-line',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PERSONNEL],
        permissions: ['notes:view', 'notes:statistiques:view'],
        dataResolver: 'dashboardDataService.getNotesMoyennesParPeriode',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'notes',
        icon: 'TrendingUp',
        complexite: 4,
    },
    {
        id: 'notes-dernieres-saisies',
        nom: 'Dernières Notes Saisies',
        description: 'Historique récent des notes saisies',
        type: 'list',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: ['notes:view'],
        dataResolver: 'dashboardDataService.getNotesDernieresNotes',
        cacheTTL: 180,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'notes',
        icon: 'ClipboardList',
        complexite: 2,
    },
    {
        id: 'notes-repartition-notes',
        nom: 'Répartition des Notes',
        description: 'Distribution des notes (0-5, 5-10, 10-15, 15-20)',
        type: 'chart-pie',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT],
        permissions: ['notes:view', 'notes:statistiques:view'],
        dataResolver: 'dashboardDataService.getNotesRepartition',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'notes',
        icon: 'PieChart',
        complexite: 3,
    },

    // ==================================
    // WIDGETS MONITORING SYSTÈME
    // ==================================
    {
        id: 'monitoring-sante-systeme',
        nom: 'Santé du Système',
        description: 'Statut base de données, mémoire, CPU',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: ['monitoring:health:view'],
        dataResolver: 'dashboardDataService.getMonitoringHealthWidgets',
        cacheTTL: 60,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'monitoring',
        icon: 'Activity',
        complexite: 2,
        premium: false,
    },
    {
        id: 'monitoring-stats-utilisateurs',
        nom: 'Statistiques Utilisateurs',
        description: 'Utilisateurs actifs, par rôle',
        type: 'chart-bar',
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: ['monitoring:stats:view', 'utilisateurs:view'],
        dataResolver: 'dashboardDataService.getMonitoringUtilisateursStats',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'monitoring',
        icon: 'Users',
        complexite: 3,
    },

    // ==================================
    // WIDGETS CANTINE
    // ==================================
    {
        id: 'cantine-inscriptions-jour',
        nom: 'Inscriptions Cantine du Jour',
        description: 'Nombre de repas prévus aujourd\'hui',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_CANTINE],
        permissions: ['cantine:view', 'cantine:inscriptions:view'],
        dataResolver: 'cantineService.getInscriptionsJour',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'cantine',
        icon: 'Utensils',
        complexite: 2,
    },
    {
        id: 'cantine-solde-moyen',
        nom: 'Solde Moyen Cantine',
        description: 'Solde moyen des comptes cantine',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.RESPONSABLE_CANTINE],
        permissions: ['cantine:view', 'cantine:solde:view'],
        dataResolver: 'cantineService.getSoldeMoyen',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'cantine',
        icon: 'Wallet',
        complexite: 3,
    },

    // ==================================
    // WIDGETS TRANSPORT
    // ==================================
    {
        id: 'transport-inscriptions-actives',
        nom: 'Inscriptions Transport Actives',
        description: 'Nombre d\'élèves inscrits au transport',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_TRANSPORT],
        permissions: ['transport:view', 'transport:inscriptions:view'],
        dataResolver: 'transportService.getInscriptionsActives',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'transport',
        icon: 'Bus',
        complexite: 2,
    },

    // ==================================
    // WIDGETS ABSENCES & RETARDS
    // ==================================
    {
        id: 'absences-retards-jour',
        nom: 'Absences & Retards du Jour',
        description: 'Statistiques absences et retards aujourd\'hui',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL, Role.ENSEIGNANT],
        permissions: ['absences:view', 'absences:statistiques:view'],
        dataResolver: 'absencesService.getAbsencesRetardsJour',
        cacheTTL: 180,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'absences',
        icon: 'AlertCircle',
        complexite: 2,
    },

    // ==================================
    // WIDGETS MESSAGERIE
    // ==================================
    {
        id: 'messagerie-messages-non-lus',
        nom: 'Messages Non Lus',
        description: 'Nombre de messages non lus',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PARENT, Role.ELEVE],
        permissions: ['messages:view'],
        dataResolver: 'messagerieService.getMessagesNonLus',
        cacheTTL: 60,
        refreshStrategy: 'realtime',
        etablissementScope: false,
        module: 'messagerie',
        icon: 'Mail',
        complexite: 1,
    },

    // ==================================
    // WIDGETS NOTIFICATIONS
    // ==================================
    {
        id: 'notifications-recentes',
        nom: 'Notifications Récentes',
        description: 'Dernières notifications',
        type: 'list',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.PARENT, Role.ELEVE],
        permissions: ['notifications:view'],
        dataResolver: 'notificationsService.getNotificationsRecentes',
        cacheTTL: 60,
        refreshStrategy: 'realtime',
        etablissementScope: false,
        module: 'notifications',
        icon: 'Bell',
        complexite: 1,
    },

    // ==================================
    // WIDGETS ACTIONS RAPIDES
    // ==================================
    {
        id: 'actions-rapides-admin',
        nom: 'Actions Rapides (Admin)',
        description: 'Accès rapides aux fonctions courantes',
        type: 'quick-actions',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: [],
        dataResolver: 'dashboardService.getActionsRapidesAdmin',
        cacheTTL: 3600,
        refreshStrategy: 'manual',
        etablissementScope: true,
        module: 'dashboard',
        icon: 'Zap',
        complexite: 1,
    },
    {
        id: 'actions-rapides-enseignant',
        nom: 'Actions Rapides (Enseignant)',
        description: 'Accès rapides pour enseignants',
        type: 'quick-actions',
        roles: [Role.ENSEIGNANT],
        permissions: [],
        dataResolver: 'dashboardService.getActionsRapidesEnseignant',
        cacheTTL: 3600,
        refreshStrategy: 'manual',
        etablissementScope: true,
        module: 'dashboard',
        icon: 'Zap',
        complexite: 1,
    },

    // ==================================
    // WIDGETS BULLETINS
    // ==================================
    {
        id: 'bulletins-generation-status',
        nom: 'Statut Génération Bulletins',
        description: 'Progression génération des bulletins',
        type: 'progress',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL],
        permissions: ['bulletins:view', 'bulletins:generate'],
        dataResolver: 'bulletinsService.getGenerationStatus',
        cacheTTL: 120,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'bulletins',
        icon: 'FileText',
        complexite: 3,
    },

    // ==================================
    // WIDGETS CLASSES
    // ==================================
    {
        id: 'classes-liste-active',
        nom: 'Classes Actives',
        description: 'Liste des classes actives avec effectifs',
        type: 'data-table',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL],
        permissions: ['classes:view'],
        dataResolver: 'classesService.getClassesActives',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'classes',
        icon: 'School',
        complexite: 2,
    },

    // ==================================
    // WIDGETS VALIDATION WORKFLOW
    // ==================================
    {
        id: 'validation-stats-par-module',
        nom: 'Statistiques Validations',
        description: 'Validations en cours, complétées, rejetées par module',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: ['validation:dashboard:view'],
        dataResolver: 'dashboardDataService.getValidationStatsParModule',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'validation-workflow',
        icon: 'CheckCircle',
        complexite: 2,
    },
    {
        id: 'validation-en-attente',
        nom: 'Validations en Attente',
        description: 'Liste des validations nécessitant votre approbation',
        type: 'list',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.ENSEIGNANT, Role.RESPONSABLE_CANTINE, Role.RESPONSABLE_TRANSPORT],
        permissions: ['validation:dashboard:view'],
        dataResolver: 'dashboardDataService.getValidationEnAttente',
        cacheTTL: 180,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'validation-workflow',
        icon: 'Clock',
        complexite: 2,
    },
    {
        id: 'validation-temps-moyen',
        nom: 'Temps Moyen de Validation',
        description: 'Temps moyen de traitement par niveau et module',
        type: 'chart-bar',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: ['validation:dashboard:view'],
        dataResolver: 'dashboardDataService.getValidationTempsMoyen',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'validation-workflow',
        icon: 'Timer',
        complexite: 3,
    },
];

/**
 * Map des widgets par ID pour accès rapide
 */
export const WIDGET_REGISTRY_MAP: Map<string, WidgetDefinition> = new Map(
    WIDGET_REGISTRY.map(w => [w.id, w])
);

/**
 * Récupérer un widget par son ID
 */
export function getWidgetById(id: string): WidgetDefinition | undefined {
    return WIDGET_REGISTRY_MAP.get(id);
}

/**
 * Récupérer tous les widgets d'un module
 */
export function getWidgetsByModule(module: string): WidgetDefinition[] {
    return WIDGET_REGISTRY.filter(w => w.module === module);
}
