/**
 * ==================================
 * eLISAschool - Export de tous les modules
 * ==================================
 * Version: 3.0.0
 * Auteur: xAI Éducation
 * 
 * Tous les modules sont exportés pour permettre une utilisation
 * cohérente dans l'application.
 */

// Modules critiques
export * from './auth';
export * from './utilisateurs';
export * from './configuration';
export * from './notifications';
export * from './notes';

// Modules communication
export * from './messagerie';
export * from './requetes';

// Modules logistiques
export * from './cantine';
export * from './transport';
export * from './materiel';
export * from './finances';

// Modules activités
export * from './clubs';
export * from './gamification';
export * from './cartes';

// Modules suivi (nouveau v2.0)
export * from './suivi-eleves';
export * from './suivi-personnel';

// Module santé (nouveau v2.0)
export * from './sante';

// Modules système
export * from './scoring';
export * from './monitoring';
export * from './audit';
export * from './dashboard';
export * from './validation-workflow';
export * from './groupes-etablissements';

// Modules complémentaires
export * from './orientation';
export * from './impressions';

// Modules académiques (multi-établissements)
export * from './etablissement';
export * from './cycles';
export * from './niveaux';
export * from './annees-scolaires';
export * from './personnel';
export * from './classes';
export * from './matieres';
export * from './periodes';
export * from './eleves';
export * from './bulletins';
export * from './responsables-eleves';
