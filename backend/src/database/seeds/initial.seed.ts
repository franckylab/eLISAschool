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
import { seedTypesContrat } from './system/seed-types-contrat';
import { seedNomenclatures } from './system/seed-nomenclatures';
import { seedOrganisation } from './system/seed-organisation';
import { seedTemplatesOrganisation } from './system/seed-templates';
import { seedSuperAdmin } from './system/seed-super-admin';
import { seedParametresFinances } from './system/seed-parametres-finances';
import { seedEmploiDuTemps } from './system/seed-emploi-du-temps';
import { seedJoursFeries } from './system/seed-jours-feries';
import { seedModeleRecu } from './system/seed-modele-recu';
import { seedCotisations } from './system/seed-cotisations';
import { seedTypesPrimes } from './system/seed-types-primes';
import { seedTypesRetenues } from './system/seed-types-retenues';
import { seedModulesCatalogue } from './system/seed-modules-catalogue';
import { seedPlansAbonnement } from './system/seed-plans-abonnement';
import { seedCyclesFacturation } from './system/seed-cycles-facturation';
import { seedPacksQuota } from './system/seed-packs-quota';
import { seedStrategiesExpiration } from './system/seed-strategies-expiration';
import { seedRemises } from './system/seed-remises';
import { seedPromotions } from './system/seed-promotions';
import { seedPackagePromotions } from './system/seed-packages';
import { seedParametresBilling } from './system/seed-parametres-billing';
import { seedCmsTemplates } from './system/seed-cms-templates';
import { seedCmsWidgets } from './system/seed-cms-widgets';
import { seedFeatureFlags } from './system/seed-feature-flags';
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

    // 8b. Catalogue modules unifié (source de vérité — Lot A v7)
    await seedModulesCatalogue();

    // 8c. Plans d'abonnement v3 pilotés par JSONB (migration 213)
    await seedPlansAbonnement();

    // 8d. Cycles de facturation configurables (migration 213)
    await seedCyclesFacturation();

    // 8e. Packs de quota supplémentaires (migration 213)
    await seedPacksQuota();

    // 8f. Stratégies d'expiration d'abonnement (migration 213)
    await seedStrategiesExpiration();

    // 8g. Remises abonnement commerciales (migration 213 — legacy, table _legacy_remises_abonnement)
    await seedRemises();

    // 8g-bis. Promotions v4 (migration 216 — table promotions, multi-scopes)
    await seedPromotions();

    // 8g-ter. Packages de packs quota (migration 216 — table package_promotions)
    await seedPackagePromotions();

    // 8h. Paramètres système billing (onboarding, essai, facturation)
    await seedParametresBilling();

    // 9. Super admin (estPlateforme=true — accès Control Plane)
    await seedSuperAdmin(etablissementPrincipalId, etablissementSecondaireId);

    // 9b. ADR-005 (v11) : Les utilisateurs plateforme sont créés dans seedUtilisateursParRole (demo).
    // Le super admin (seed ci-dessus) est le seul utilisateur plateforme créé au niveau système.
    // Les utilisateurs PLATEFORME_* de démo ont estPlateforme=true et ne sont PAS liés à un établissement.

    // 10. Types de contrat
    await seedTypesContrat();

    // 10c. Nomenclatures organisation (global — 6 tables)
    const nomenclatures = await seedNomenclatures();

    // 11. Structure organisationnelle (unités, postes, hiérarchies, fonctions)
    await seedOrganisation(etablissementPrincipalId, 'Lycée Bilingue eLISAschool', nomenclatures);
    await seedOrganisation(etablissementSecondaireId, 'Collège Privé Les Palmiers', nomenclatures);

    // 12. Templates d'organisation
    const templatesCount = await seedTemplatesOrganisation();
    logger.info(`📋 ${templatesCount} templates système créés`);

    // 13. Paramètres finances
    await seedParametresFinances();

    // 14. Paramètres EDT
    await seedEmploiDuTemps();

    // 14b. Jours fériés (modèles pays — 15 pays, fixes + variables 2025-2027)
    await seedJoursFeries();

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

    // 19. Templates CMS système (8 templates)
    await seedCmsTemplates();

    // 20. Widgets CMS par défaut (5 types × tous établissements)
    await seedCmsWidgets();

    // 21. Feature flags système (8 flags transverses — migration 210, catégorie commerciale v3)
    await seedFeatureFlags();

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
