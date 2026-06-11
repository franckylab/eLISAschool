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
  // Modules critiques
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
  
  // Module RH & Recrutement
  RECRUTEMENT = 'recrutement',
}

/**
 * Catégories de modules
 */
export enum ModuleCategory {
  CRITIQUES = 'critiques',
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
  [ModuleName.AUTH]: ModuleCategory.CRITIQUES,
  [ModuleName.UTILISATEURS]: ModuleCategory.CRITIQUES,
  [ModuleName.CONFIGURATION]: ModuleCategory.CRITIQUES,
  
  [ModuleName.NOTIFICATIONS]: ModuleCategory.COMMUNICATION,
  [ModuleName.MESSAGERIE]: ModuleCategory.COMMUNICATION,
  [ModuleName.REQUETES]: ModuleCategory.COMMUNICATION,
  [ModuleName.SONDAGES]: ModuleCategory.COMMUNICATION,
  [ModuleName.ANNONCES]: ModuleCategory.COMMUNICATION,
  
  [ModuleName.NOTES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.BULLETINS]: ModuleCategory.ACADEMIQUES,
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
  [ModuleName.ORGANISATION]: ModuleCategory.CRITIQUES,
  [ModuleName.RECRUTEMENT]: ModuleCategory.CRITIQUES,
};

/**
 * Modules activés par défaut
 */
export const DEFAULT_ACTIVE_MODULES: ModuleName[] = [
  ModuleName.AUTH,
  ModuleName.UTILISATEURS,
  ModuleName.CONFIGURATION,
  ModuleName.NOTIFICATIONS,
  ModuleName.NOTES,
];

export default { ModuleName, ModuleCategory, MODULE_CATEGORIES, DEFAULT_ACTIVE_MODULES };
