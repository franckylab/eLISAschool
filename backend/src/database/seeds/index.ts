/**
 * ==================================
 * eLISAschool - Index des Seeds
 * ==================================
 * Version: 6.0.0
 * 
 * Point d'entrée unique pour tous les seeds.
 * Organisé en : system/ (essentiel) + demo/ (test/dév)
 */

// System seeds
export { seedEtablissementsParDefaut } from './system/seed-etablissement-par-defaut';
export { seedStructureAcademique } from './system/seed-structure-academique';
export { seedAnneesScolaires } from './system/seed-annees-scolaires';
export { seedClassesParDefaut } from './system/seed-classes-par-defaut';
export { seedMatieres } from './system/seed-matieres';
export { seedMatieresNiveaux } from './system/seed-matieres-niveaux';
export { seedNomenclatures } from './system/seed-nomenclatures';
export { seedOrganisation } from './system/seed-organisation';
export { seedTemplatesOrganisation } from './system/seed-templates';
export { seedSuperAdmin } from './system/seed-super-admin';
export { seedParametresFinances } from './system/seed-parametres-finances';
export { seedEmploiDuTemps } from './system/seed-emploi-du-temps';
export { seedModeleRecu } from './system/seed-modele-recu';
export { RBACSeedService } from './system/rbac.seed';

// Demo seeds
export { seedUtilisateursParRole } from './demo/seed-utilisateurs-par-role';
export { seedElevesExemples } from './demo/seed-eleves-exemples';
export { seedGroupesEtablissements } from './demo/seed-groupes-etablissements';
export { seedChefEtablissementSecondaire } from './demo/seed-chef-etablissement-secondaire';
export { seedHeuresCoursEtEdt } from './demo/seed-heures-cours-edt';
export { seedOrganisationDemo } from './demo/seed-organisation-demo';

// Orchestration
export { runSystemSeeds } from './initial.seed';

// Services externes
export { seedDefaultNotificationProviders } from '@modules/notifications/services/seed-providers.service';
export { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';

// Types
export type { EtablissementsDefaut } from './system/seed-etablissement-par-defaut';

export const SEEDS_INFO = [
    // System
    { name: 'seedEtablissementsParDefaut', file: 'system/seed-etablissement-par-defaut.ts', description: 'Crée 2 établissements par défaut (ETAB-001, ETAB-002)', version: '2.0.0', multiTenant: false, idempotent: true },
    { name: 'seedStructureAcademique', file: 'system/seed-structure-academique.ts', description: 'Crée cycles, niveaux, filières, spécialités, examens, compétences', version: '3.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId'] },
    { name: 'seedAnneesScolaires', file: 'system/seed-annees-scolaires.ts', description: 'Crée 3 années scolaires (2024-2027)', version: '1.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId'], returns: 'anneeScolaireId (active)' },
    { name: 'seedClassesParDefaut', file: 'system/seed-classes-par-defaut.ts', description: 'Crée 1 classe par niveau', version: '3.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId', 'anneeScolaireId (optionnel)'] },
    { name: 'seedMatieres', file: 'system/seed-matieres.ts', description: 'Crée 15 matières de base', version: '2.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId'] },
    { name: 'seedMatieresNiveaux', file: 'system/seed-matieres-niveaux.ts', description: 'Associe matières aux niveaux avec coefficients', version: '1.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId'] },
    { name: 'seedSuperAdmin', file: 'system/seed-super-admin.ts', description: 'Crée le super administrateur', version: '1.0.0', multiTenant: false, idempotent: true },
    { name: 'seedParametresFinances', file: 'system/seed-parametres-finances.ts', description: 'Crée 74 paramètres de configuration finances', version: '2.0.0', multiTenant: false, idempotent: true },
    { name: 'seedEmploiDuTemps', file: 'system/seed-emploi-du-temps.ts', description: 'Crée 2 paramètres système EDT', version: '1.0.0', multiTenant: false, idempotent: true },
    { name: 'seedModeleRecu', file: 'system/seed-modele-recu.ts', description: 'Crée le modèle de reçu de paiement', version: '1.0.0', multiTenant: false, idempotent: true },
    // Demo
    { name: 'seedUtilisateursParRole', file: 'demo/seed-utilisateurs-par-role.ts', description: 'Crée 38 utilisateurs de test (1 par rôle)', version: '2.0.0', multiTenant: true, idempotent: true, requires: ['etablissementPrincipalId', 'etablissementSecondaireId (optionnel)'], defaultPassword: 'Test123456!' },
    { name: 'seedElevesExemples', file: 'demo/seed-eleves-exemples.ts', description: 'Crée 34 élèves exemples', version: '1.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId', 'anneeScolaireId'], defaultPassword: 'Test123456!' },
    { name: 'seedGroupesEtablissements', file: 'demo/seed-groupes-etablissements.ts', description: 'Crée les groupes d\'établissements de démo', version: '2.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId', 'superAdminId'] },
    { name: 'seedChefEtablissementSecondaire', file: 'demo/seed-chef-etablissement-secondaire.ts', description: 'Crée le chef d\'établissement pour le secondaire (démo)', version: '1.0.0', multiTenant: false, idempotent: true },
    { name: 'seedHeuresCoursEtEdt', file: 'demo/seed-heures-cours-edt.ts', description: 'Crée des heures cours et EDT de démonstration', version: '1.0.0', multiTenant: true, idempotent: true, requires: ['etablissementId'] },
];

export const RECOMMENDED_ORDER = [
    'seedEtablissementsParDefaut', 'seedStructureAcademique', 'seedAnneesScolaires',
    'seedClassesParDefaut', 'seedMatieres', 'seedMatieresNiveaux',
    'seedSuperAdmin', 'seedParametresFinances', 'seedEmploiDuTemps', 'seedModeleRecu',
    'seedUtilisateursParRole', 'seedElevesExemples', 'seedGroupesEtablissements',
];

export function getSeedInfo(seedName: string) {
    return SEEDS_INFO.find(s => s.name === seedName);
}

export function isMultiTenant(seedName: string): boolean {
    return getSeedInfo(seedName)?.multiTenant ?? false;
}

export function isIdempotent(seedName: string): boolean {
    return getSeedInfo(seedName)?.idempotent ?? false;
}

export function getSeedRequirements(seedName: string): string[] {
    return getSeedInfo(seedName)?.requires ?? [];
}
