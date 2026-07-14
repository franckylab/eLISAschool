/**
 * ==================================
 * eLISAschool - Index des Seeds
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 * 
 * Point d'entrée unique pour tous les seeds
 */

// Seeds principaux
export { seedEtablissementsParDefaut } from './seed-etablissement-par-defaut';
export { seedStructureAcademique } from './seed-structure-academique';
export { seedAnneesScolaires } from './seed-annees-scolaires';
export { seedClassesParDefaut } from './seed-classes-par-defaut';
export { seedMatieres } from './seed-matieres';
export { seedMatieresNiveaux } from './seed-matieres-niveaux';
export { seedUtilisateursParRole } from './seed-utilisateurs-par-role';
export { seedElevesExemples } from './seed-eleves-exemples';
export { seedGroupesEtablissements } from './seed-groupes-etablissements';
export { seedTypePersonnel } from './seed-type-personnel';

// Orchestration
export { runSeeds } from './initial.seed';

// Utilitaires
export { seedDefaultNotificationProviders } from '@modules/notifications/services/seed-providers.service';

// RBAC
export { RBACSeedService } from './rbac.seed';

// Configuration
export { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';

// Types et interfaces
export type { EtablissementsDefaut } from './seed-etablissement-par-defaut';

/**
 * Liste complète des seeds disponibles
 */
export const SEEDS_INFO = [
    {
        name: 'seedEtablissementsParDefaut',
        file: 'seed-etablissement-par-defaut.ts',
        description: 'Crée 2 établissements par défaut (ETAB-001, ETAB-002)',
        version: '2.0.0',
        multiTenant: false,
        idempotent: true,
    },
    {
        name: 'seedStructureAcademique',
        file: 'seed-structure-academique.ts',
        description: 'Crée cycles, niveaux, filières, spécialités, examens, compétences',
        version: '3.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId'],
    },
    {
        name: 'seedAnneesScolaires',
        file: 'seed-annees-scolaires.ts',
        description: 'Crée 3 années scolaires (2024-2027)',
        version: '1.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId'],
        returns: 'anneeScolaireId (active)',
    },
    {
        name: 'seedClassesParDefaut',
        file: 'seed-classes-par-defaut.ts',
        description: 'Crée 1 classe par niveau',
        version: '3.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId', 'anneeScolaireId (optionnel)'],
    },
    {
        name: 'seedMatieres',
        file: 'seed-matieres.ts',
        description: 'Crée 15 matières de base',
        version: '2.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId'],
    },
    {
        name: 'seedMatieresNiveaux',
        file: 'seed-matieres-niveaux.ts',
        description: 'Associe matières aux niveaux avec coefficients',
        version: '1.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId'],
    },
    {
        name: 'seedUtilisateursParRole',
        file: 'seed-utilisateurs-par-role.ts',
        description: 'Crée 38 utilisateurs de test (1 par rôle)',
        version: '1.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementPrincipalId', 'etablissementSecondaireId (optionnel)'],
        defaultPassword: 'Test123456!',
    },
    {
        name: 'seedElevesExemples',
        file: 'seed-eleves-exemples.ts',
        description: 'Crée 34 élèves exemples',
        version: '1.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId', 'anneeScolaireId'],
        defaultPassword: 'Test123456!',
    },
    {
        name: 'seedGroupesEtablissements',
        file: 'seed-groupes-etablissements.ts',
        description: 'Crée les groupes d\'établissements',
        version: '1.0.0',
        multiTenant: true,
        idempotent: true,
        requires: ['etablissementId', 'superAdminId'],
    },
];

/**
 * Ordre recommandé d'exécution
 */
export const RECOMMENDED_ORDER = [
    'seedEtablissementsParDefaut',
    'seedStructureAcademique',
    'seedAnneesScolaires',
    'seedClassesParDefaut',
    'seedMatieres',
    'seedMatieresNiveaux',
    // Configuration et RBAC (via services)
    'seedUtilisateursParRole',
    'seedElevesExemples',
    'seedGroupesEtablissements',
];

/**
 * Obtenir les informations d'un seed par son nom
 */
export function getSeedInfo(seedName: string) {
    return SEEDS_INFO.find(s => s.name === seedName);
}

/**
 * Vérifier si un seed est multi-tenant
 */
export function isMultiTenant(seedName: string): boolean {
    const info = getSeedInfo(seedName);
    return info?.multiTenant ?? false;
}

/**
 * Vérifier si un seed est idempotent
 */
export function isIdempotent(seedName: string): boolean {
    const info = getSeedInfo(seedName);
    return info?.idempotent ?? false;
}

/**
 * Obtenir les prérequis d'un seed
 */
export function getSeedRequirements(seedName: string): string[] {
    const info = getSeedInfo(seedName);
    return info?.requires ?? [];
}
