/**
 * ==================================
 * eLISAschool - Énumération des modules
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
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
  
  // Modules académiques
  NOTES = 'notes',
  BULLETINS = 'bulletins',
  ORIENTATION = 'orientation',
  
  // Modules logistiques
  CANTINE = 'cantine',
  TRANSPORT = 'transport',
  MATERIEL = 'materiel',
  
  // Modules activités
  CLUBS = 'clubs',
  GAMIFICATION = 'gamification',
  
  // Modules documents
  CARTES = 'cartes',
  DOCUMENTS = 'documents',
  IMPRESSIONS = 'impressions',
  
  // Modules système
  SCORING = 'scoring',
  MONITORING = 'monitoring',
  PERIPHERIQUES = 'peripheriques',
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
  
  [ModuleName.NOTES]: ModuleCategory.ACADEMIQUES,
  [ModuleName.BULLETINS]: ModuleCategory.ACADEMIQUES,
  [ModuleName.ORIENTATION]: ModuleCategory.ACADEMIQUES,
  
  [ModuleName.CANTINE]: ModuleCategory.LOGISTIQUES,
  [ModuleName.TRANSPORT]: ModuleCategory.LOGISTIQUES,
  [ModuleName.MATERIEL]: ModuleCategory.LOGISTIQUES,
  
  [ModuleName.CLUBS]: ModuleCategory.ACTIVITES,
  [ModuleName.GAMIFICATION]: ModuleCategory.ACTIVITES,
  
  [ModuleName.CARTES]: ModuleCategory.DOCUMENTS,
  [ModuleName.DOCUMENTS]: ModuleCategory.DOCUMENTS,
  [ModuleName.IMPRESSIONS]: ModuleCategory.DOCUMENTS,
  
  [ModuleName.SCORING]: ModuleCategory.SYSTEME,
  [ModuleName.MONITORING]: ModuleCategory.SYSTEME,
  [ModuleName.PERIPHERIQUES]: ModuleCategory.SYSTEME,
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
