/**
 * ==================================
 * eLISAschool - Export de tous les modules
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
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
export * from './sondages';
export * from './annonces';

// Modules logistiques
export * from './cantine';
export * from './transport';
export * from './parking';
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
export * from './types-enum';
export * from './organisation';

// Modules complémentaires
export * from './orientation';
export * from './impressions';
export * from './salles';
export * from './options';

// Module RH & Recrutement
export * from './recrutement';

// Module CMS (pages publiques white-label)
export * from './cms';

// Modules académiques (multi-établissements)
export * from './etablissement';
export * from './cycles';
export * from './niveaux';
export * from './filieres';
export * from './specialites';
export * from './competences';
export * from './examens-nationaux';
export * from './annees-scolaires';
export * from './personnel';
export * from './classes';
export * from './matieres';
export * from './periodes';
export * from './programmes';
export * from './eleves';
export * from './bulletins';
export * from './parents';
export * from './diplomes-eleves';
// Auth plateforme (ADR-005 — source unique de vérité)
// ADR-005 (v11) : Modules identites, utilisateurs-plateforme, memberships,
// permissions-plateforme, platform-sessions SUPPRIMÉS — source unique de vérité.
export * from './platform-auth';

// Export explicite pour lever l'ambiguïté avec l'enum `CreneauHoraire` (classe.entity,
// créneau MATIN/APRES_MIDI/JOURNEE_COMPLETE) : l'entité EDT prime via modules/index.
export { CreneauHoraire } from './emploi-du-temps/entities/creneau-horaire.entity';
export * from './emploi-du-temps';
