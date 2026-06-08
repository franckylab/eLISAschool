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

    // ==================================
    // WIDGETS PORTAL PARENT
    // ==================================
    {
        id: 'parent-mes-enfants',
        nom: 'Mes Enfants',
        description: 'Liste de vos enfants avec informations de base',
        type: 'list',
        roles: [Role.PARENT],
        permissions: ['parents:view-enfants'],
        dataResolver: 'portalParentService.getEnfantsParent',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'Users',
        complexite: 2,
    },
    {
        id: 'parent-dashboard-global',
        nom: 'Vue d\'ensemble',
        description: 'Dashboard parent avec résumé de tous les enfants',
        type: 'stats-cards',
        roles: [Role.PARENT],
        permissions: ['parents:view-enfants'],
        dataResolver: 'portalParentService.getDashboardParent',
        cacheTTL: 180,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'LayoutDashboard',
        complexite: 4,
    },
    {
        id: 'parent-notes-recents',
        nom: 'Dernières Notes',
        description: 'Dernières notes reçues pour vos enfants',
        type: 'list',
        roles: [Role.PARENT],
        permissions: ['parents:view-notes'],
        dataResolver: 'portalParentService.getNotesEnfant',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'ClipboardList',
        complexite: 3,
    },
    {
        id: 'parent-bulletins-disponibles',
        nom: 'Bulletins Disponibles',
        description: 'Bulletins scolaires disponibles pour vos enfants',
        type: 'data-table',
        roles: [Role.PARENT],
        permissions: ['parents:view-bulletins'],
        dataResolver: 'portalParentService.getBulletinsEnfant',
        cacheTTL: 600,
        refreshStrategy: 'on-demand',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'FileSpreadsheet',
        complexite: 3,
    },
    {
        id: 'parent-cantine-solde',
        nom: 'Solde Cantine',
        description: 'Solde cantine de vos enfants',
        type: 'stats-cards',
        roles: [Role.PARENT],
        permissions: ['parents:view-enfants'],
        dataResolver: 'portalParentService.getCantineEnfant',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'Utensils',
        complexite: 2,
    },
    {
        id: 'parent-transport-info',
        nom: 'Transport Scolaire',
        description: 'Informations de transport de vos enfants',
        type: 'list',
        roles: [Role.PARENT],
        permissions: ['parents:view-enfants'],
        dataResolver: 'portalParentService.getTransportEnfant',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'Bus',
        complexite: 2,
    },
    {
        id: 'parent-alertes',
        nom: 'Alertes & Notifications',
        description: 'Alertes cantine, transport, notes pour vos enfants',
        type: 'alert',
        roles: [Role.PARENT],
        permissions: ['parents:view-enfants'],
        dataResolver: 'portalParentService.getDashboardParent',
        cacheTTL: 120,
        refreshStrategy: 'realtime',
        etablissementScope: false,
        module: 'responsables-eleves',
        icon: 'AlertCircle',
        complexite: 3,
    },

    // ==================================
    // WIDGETS RH - PERSONNEL (NOUVEAUX)
    // ==================================
    {
        id: 'rh-personnel-stats-general',
        nom: 'Statistiques Générales Personnel',
        description: 'Nombre total de personnel, répartition par type (enseignants, administratif, etc.)',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: ['rh_contrats:view', 'rh_absences:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'Users',
        complexite: 2,
    },
    {
        id: 'rh-contrats-expiration',
        nom: 'Contrats Expirant Bientôt',
        description: 'Liste des contrats arrivant à expiration dans les 30 prochains jours',
        type: 'alert',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT],
        permissions: ['rh_contrats:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'AlertTriangle',
        complexite: 3,
    },
    {
        id: 'rh-absences-assiduite',
        nom: 'Taux d\'Assiduité du Personnel',
        description: 'Statistiques des absences, retards et taux de présence ce mois',
        type: 'chart-bar',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.CENSEUR],
        permissions: ['rh_absences:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'CalendarX',
        complexite: 4,
    },
    {
        id: 'rh-heures-cours-volume',
        nom: 'Volume Horaire Enseignants',
        description: 'Heures de cours effectuées ce mois par enseignant',
        type: 'chart-bar',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_PEDAGOGIQUE],
        permissions: ['rh_heures_cours:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'Clock',
        complexite: 4,
    },
    {
        id: 'rh-evaluations-performance',
        nom: 'Évaluations des Enseignants',
        description: 'Moyennes des évaluations par catégorie (pédagogie, ponctualité, etc.)',
        type: 'chart-pie',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_PEDAGOGIQUE, Role.INSPECTEUR_PEDAGOGIQUE],
        permissions: ['rh_evaluations:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'Star',
        complexite: 5,
    },
    {
        id: 'rh-progressions-programmes',
        nom: 'Progression des Programmes',
        description: 'Avancement des programmes par classe et matière avec alertes retard',
        type: 'progress',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_PEDAGOGIQUE, Role.INSPECTEUR_PEDAGOGIQUE],
        permissions: ['rh_progressions:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 600,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'TrendingUp',
        complexite: 5,
    },
    {
        id: 'rh-masse-salariale',
        nom: 'Masse Salariale du Mois',
        description: 'Total des salaires et répartition par type de contrat',
        type: 'stats-cards',
        roles: [Role.SUPER_ADMIN, Role.ADMIN],
        permissions: ['rh_paie:view'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 300,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'DollarSign',
        complexite: 3,
        premium: true,
    },
    {
        id: 'rh-absences-non-justifiees',
        nom: 'Absences Non Justifiées',
        description: 'Liste des absences non justifiées nécessitant une action',
        type: 'data-table',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.CENSEUR],
        permissions: ['rh_absences:justifier'],
        dataResolver: 'personnelDashboardService.getDashboardRH',
        cacheTTL: 180,
        refreshStrategy: 'interval',
        etablissementScope: true,
        module: 'personnel',
        icon: 'AlertCircle',
        complexite: 3,
    },
    {
        id: 'rh-enseignant-profil',
        nom: 'Profil Enseignant (Vue Individuelle)',
        description: 'Vue complète d\'un enseignant: heures, évaluations, absences, progressions',
        type: 'custom',
        roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CHEF_ETABLISSEMENT, Role.RESPONSABLE_PEDAGOGIQUE, Role.INSPECTEUR_PEDAGOGIQUE],
        permissions: ['rh_dashboard:view'],
        dataResolver: 'personnelDashboardService.getStatistiquesEnseignant',
        cacheTTL: 300,
        refreshStrategy: 'on-demand',
        etablissementScope: true,
        module: 'personnel',
        icon: 'User',
        complexite: 6,
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
