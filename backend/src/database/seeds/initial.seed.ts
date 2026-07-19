/**
 * ==================================
 * eLISAschool - Orchestrateur des seeds système
 * ==================================
 * Exécute UNIQUEMENT les données système essentielles.
 * Les données de démonstration/test sont dans run-demo-seeds.ts
 */

import { AppDataSource } from '../data-source';
import { Utilisateur } from '@modules/auth/entities';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { RBACSeedService } from './system/rbac.seed';
import { seedEtablissementsParDefaut } from './system/seed-etablissement-par-defaut';
import { seedStructureAcademique } from './system/seed-structure-academique';
import { seedAnneesScolaires } from './system/seed-annees-scolaires';
import { seedClassesParDefaut } from './system/seed-classes-par-defaut';
import { seedMatieres } from './system/seed-matieres';
import { seedMatieresNiveaux } from './system/seed-matieres-niveaux';
import { seedTypePersonnel } from './system/seed-type-personnel';
import { seedTypesContrat } from './system/seed-types-contrat';
import { seedOrganisation } from './system/seed-organisation';
import { seedTemplatesOrganisation } from './system/seed-templates';
import { seedSuperAdmin } from './system/seed-super-admin';
import { seedParametresFinances } from './system/seed-parametres-finances';
import { seedEmploiDuTemps } from './system/seed-emploi-du-temps';
import { seedModeleRecu } from './system/seed-modele-recu';
import { seedCotisations } from './system/seed-cotisations';
import { seedTypesPrimes } from './system/seed-types-primes';
import { seedTypesRetenues } from './system/seed-types-retenues';
import { seedFondsCatalogue } from './system/seed-fonds-catalogue';
import { logger } from '@common/utils/logger.util';

export async function runSystemSeeds(): Promise<{
    etablissementPrincipalId: string;
    etablissementSecondaireId: string;
}> {
    logger.info('🌱 Exécution des seeds système...');

    // 1. Établissements par défaut
    const etablissements = await seedEtablissementsParDefaut();
    const etablissementPrincipalId = etablissements.principal;
    const etablissementSecondaireId = etablissements.secondaire;
    logger.info(`🏫 Établissement principal: ${etablissementPrincipalId}`);
    logger.info(`🏫 Établissement secondaire: ${etablissementSecondaireId}`);

    // 2. Structure académique
    await seedStructureAcademique(etablissementPrincipalId);
    await seedStructureAcademique(etablissementSecondaireId);

    // 3. Années scolaires
    const anneeActivePrincipal = await seedAnneesScolaires(etablissementPrincipalId);
    const anneeActiveSecondaire = await seedAnneesScolaires(etablissementSecondaireId);

    // 4. Classes
    if (anneeActivePrincipal) {
        await seedClassesParDefaut(etablissementPrincipalId, anneeActivePrincipal);
    }
    if (anneeActiveSecondaire) {
        await seedClassesParDefaut(etablissementSecondaireId, anneeActiveSecondaire);
    }

    // 5. Matières
    await seedMatieres(etablissementPrincipalId);
    await seedMatieres(etablissementSecondaireId);

    // 6. Matières-Niveaux
    await seedMatieresNiveaux(etablissementPrincipalId);
    await seedMatieresNiveaux(etablissementSecondaireId);

    // 7. Configuration modules et paramètres système
    await seedConfiguration(etablissementPrincipalId);
    await seedConfiguration(etablissementSecondaireId);

    // 8. RBAC (rôles + permissions + mappings)
    await seedRBAC();

    // 9. Super admin
    await seedSuperAdmin(etablissementPrincipalId, etablissementSecondaireId);

    // 10. Types de personnel
    await seedTypePersonnel();

    // 10b. Types de contrat
    await seedTypesContrat();

    // 11. Structure organisationnelle
    await seedOrganisation(etablissementPrincipalId, 'Lycée Bilingue eLISAschool');
    await seedOrganisation(etablissementSecondaireId, 'Collège Privé Les Palmiers');

    // 12. Templates d'organisation
    const templatesCount = await seedTemplatesOrganisation();
    logger.info(`📋 ${templatesCount} templates système créés`);

    // 13. Paramètres finances
    await seedParametresFinances();

    // 14. Paramètres EDT
    await seedEmploiDuTemps();

    // 15. Modèle de reçu
    await seedModeleRecu();

    // 16. Cotisations sociales
    await seedCotisations(etablissementPrincipalId);
    await seedCotisations(etablissementSecondaireId);

    // 17. Types de primes
    await seedTypesPrimes(etablissementPrincipalId);
    await seedTypesPrimes(etablissementSecondaireId);

    // 18. Types de retenues
    await seedTypesRetenues(etablissementPrincipalId);
    await seedTypesRetenues(etablissementSecondaireId);

    // 19. Catalogue de fonds SVG (global — pas lié à un établissement)
    await seedFondsCatalogue();

    logger.info('✅ Seeds système exécutés avec succès');

    return { etablissementPrincipalId, etablissementSecondaireId };
}

async function seedConfiguration(etablissementId: string): Promise<void> {
    const seedService = new ConfigurationSeedService();
    const result = await seedService.runAllSeeds();
    logger.info(`Configuration seeds: Modules=${result.modules}, Params=${result.parametres}`);
}

async function seedRBAC(): Promise<void> {
    const rbacSeedService = new RBACSeedService();
    const result = await rbacSeedService.runAllSeeds();
    logger.info(`RBAC seeds: ${result.roles} rôles, ${result.permissions} permissions, ${result.mappings} mappings`);
}
