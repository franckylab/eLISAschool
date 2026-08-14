/**
 * ==================================
 * eLISAschool - Énumération des modules
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Source de vérité unique pour les noms de modules
 */

/**
 * Modules disponibles dans l'application
 */
export enum ModuleName {
  // Modules de base
  AUTH = 'auth',
  UTILISATEURS = 'utilisateurs',
  CONFIGURATION = 'configuration',
  
  // Modules communication
  NOTIFICATIONS = 'notifications',
  MESSAGERIE = 'messagerie',
  REQUETES = 'requetes',
  SONDAGES = 'sondages',
  ANNONCES = 'annonces',
  
  // Modules académiques
  NOTES = 'notes',
  BULLETINS = 'bulletins',
  PERIODES = 'periodes',
  EMPLOI_DU_TEMPS = 'emploi-du-temps',
  ELEVES = 'eleves',
  ORIENTATION = 'orientation',
  RESPONSABLES_ELEVES = 'responsables-eleves',
  PROGRAMMES = 'programmes',
  
  // Modules logistiques
  CANTINE = 'cantine',
  TRANSPORT = 'transport',
  PARKING = 'parking',
  MATERIEL = 'materiel',
  FINANCES = 'finances',
  
  // Modules activités
  CLUBS = 'clubs',
  GAMIFICATION = 'gamification',
  
  // Modules documents
  CARTES = 'cartes',
  DOCUMENTS = 'documents',
  IMPRESSIONS = 'impressions',
  
  // Modules suivi
  SUIVI_ELEVES = 'suivi-eleves',
  SUIVI_PERSONNEL = 'suivi-personnel',
  
  // Modules santé
  SANTE = 'sante',
  
  // Modules système
  SCORING = 'scoring',
  MONITORING = 'monitoring',
  DASHBOARD = 'dashboard',
  PERIPHERIQUES = 'peripheriques',
  
  // Module organisation
  ORGANISATION = 'organisation',

  // Module postes
  POSTES = 'postes',

  // Module RH & Recrutement
  RECRUTEMENT = 'recrutement',

  // Module CMS (pages publiques white-label)
  CMS = 'cms',

  // Modules manquants (référencés dans app.ts mais absents du registre)
  SALLES = 'salles',
  OPTIONS = 'options',
  // Modules RH & Paie
  PERSONNEL = 'personnel',
  CONTRATS = 'contrats',
  PAIE = 'paie',

  // Modules plateforme (Control Plane)
  IDENTITES = 'identites',
  MEMBERSHIPS = 'memberships',
  PLATFORM_AUTH = 'platform-auth',
  PLATFORM_SESSIONS = 'platform-sessions',
  PLATFORM_USERS = 'platform-users',
  PLATFORM_ROLES = 'platform-roles',
}

/**
 * Catégories de modules
 */
export enum ModuleCategory {
  BASE = 'base',
  COMMUNICATION = 'communication',
  ACADEMIQUES = 'academiques',
  LOGISTIQUES = 'logistiques',
  ACTIVITES = 'activites',
  DOCUMENTS = 'documents',
  SYSTEME = 'systeme',
}

/**
 * Mapping modules -> catégories
 */
export const MODULE_CATEGORIES: Record<ModuleName, ModuleCategory> = {
  [ModuleName.AUTH]: ModuleCategory.BASE,
  [ModuleName.UTILISATEURS]: ModuleCategory.BASE,
  [ModuleName.CONFIGURATION]: ModuleCategory.BASE,
  
  [ModuleName.NOTIFICATIONS]: ModuleCategory.COMMUNICATION,
  [ModuleName.MESSAGERIE]: ModuleCategory.COMMUNICATION,
  [ModuleName.REQUETES]: ModuleCategory.COMMUNICATION,
  [ModuleName.SONDAGES]: ModuleCategory.COMMUNICATION,
  [ModuleName.ANNONCES]: ModuleCategory.COMMUNICATION,
  
  [ModuleName.NOTES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.BULLETINS]: ModuleCategory.ACADEMIQUES,
  [ModuleName.PERIODES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.EMPLOI_DU_TEMPS]: ModuleCategory.ACADEMIQUES,
  [ModuleName.ELEVES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.ORIENTATION]: ModuleCategory.ACADEMIQUES,
  [ModuleName.RESPONSABLES_ELEVES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.PROGRAMMES]: ModuleCategory.ACADEMIQUES,
  
  [ModuleName.CANTINE]: ModuleCategory.LOGISTIQUES,
  [ModuleName.TRANSPORT]: ModuleCategory.LOGISTIQUES,
  [ModuleName.PARKING]: ModuleCategory.LOGISTIQUES,
  [ModuleName.MATERIEL]: ModuleCategory.LOGISTIQUES,
  [ModuleName.FINANCES]: ModuleCategory.LOGISTIQUES,
  
  [ModuleName.CLUBS]: ModuleCategory.ACTIVITES,
  [ModuleName.GAMIFICATION]: ModuleCategory.ACTIVITES,
  
  [ModuleName.CARTES]: ModuleCategory.DOCUMENTS,
  [ModuleName.DOCUMENTS]: ModuleCategory.DOCUMENTS,
  [ModuleName.IMPRESSIONS]: ModuleCategory.DOCUMENTS,
  
  [ModuleName.SUIVI_ELEVES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.SUIVI_PERSONNEL]: ModuleCategory.ACADEMIQUES,
  [ModuleName.SANTE]: ModuleCategory.SYSTEME,
  [ModuleName.SCORING]: ModuleCategory.SYSTEME,
  [ModuleName.MONITORING]: ModuleCategory.SYSTEME,
  [ModuleName.DASHBOARD]: ModuleCategory.SYSTEME,
  [ModuleName.PERIPHERIQUES]: ModuleCategory.SYSTEME,
  [ModuleName.ORGANISATION]: ModuleCategory.BASE,
  [ModuleName.POSTES]: ModuleCategory.BASE,
  [ModuleName.RECRUTEMENT]: ModuleCategory.BASE,
  [ModuleName.CMS]: ModuleCategory.COMMUNICATION,
  [ModuleName.SALLES]: ModuleCategory.LOGISTIQUES,
  [ModuleName.OPTIONS]: ModuleCategory.ACADEMIQUES,
  [ModuleName.PERSONNEL]: ModuleCategory.ACADEMIQUES,
  [ModuleName.CONTRATS]: ModuleCategory.ACADEMIQUES,
  [ModuleName.PAIE]: ModuleCategory.ACADEMIQUES,
  [ModuleName.IDENTITES]: ModuleCategory.BASE,
  [ModuleName.MEMBERSHIPS]: ModuleCategory.BASE,
  [ModuleName.PLATFORM_AUTH]: ModuleCategory.BASE,
  [ModuleName.PLATFORM_SESSIONS]: ModuleCategory.BASE,
  [ModuleName.PLATFORM_USERS]: ModuleCategory.BASE,
  [ModuleName.PLATFORM_ROLES]: ModuleCategory.BASE,
};

export default { ModuleName, ModuleCategory, MODULE_CATEGORIES };
