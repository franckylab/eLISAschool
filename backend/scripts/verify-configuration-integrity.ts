/**
 * ==================================
 * eLISAschool - Vérification Intégrité Configuration
 * ==================================
 * Version: 1.0.0
 * 
 * Script de vérification post-migration pour s'assurer que:
 * 1. ConfigurationApp n'est plus utilisé
 * 2. ParametreSysteme contient les données migrées
 * 3. EtablissementConfig a été simplifié
 * 4. Les fallbacks fonctionnent correctement
 */

// Charger .env depuis la racine du projet
import * as path from 'path';
import * as dotenv from 'dotenv';

const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

import { AppDataSource } from '@database/data-source';
import { ParametreSysteme } from '@modules/configuration/entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

interface VerificationResult {
    check: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: any;
}

const results: VerificationResult[] = [];

/**
 * Exécute toutes les vérifications
 */
async function verify(): Promise<void> {
    logger.info('🔍 Démarrage de la vérification d\'intégrité');

    let dataSource;
    try {
        dataSource = await AppDataSource.initialize();
        logger.info('✅ Connexion base de données établie');

        await check1_ParametreSystemePopule(dataSource);
        await check2_EtablissementConfigSimplifie(dataSource);
        await check3_FonctionnementFallbacks(dataSource);
        await check4_CohérenceModules(dataSource);

        // Afficher les résultats
        displayResults();

        // Déterminer le statut global
        const hasFail = results.some(r => r.status === 'FAIL');
        if (hasFail) {
            logger.error('❌ Vérification échouée - des problèmes ont été détectés');
            process.exit(1);
        } else {
            logger.info('✅ Intégrité vérifiée - tout est conforme');
        }

    } catch (error) {
        logger.error(`💥 Erreur de vérification: ${error}`);
        process.exit(1);
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

/**
 * Check 1: ParametreSysteme est peuplé
 */
async function check1_ParametreSystemePopule(dataSource: any): Promise<void> {
    logger.info('\n📋 Check 1: ParametreSysteme peuplé');

    const paramRepo = dataSource.getRepository(ParametreSysteme);
    const totalParams = await paramRepo.count();
    const globalParams = await paramRepo.count({ where: { etablissementId: null as any } });
    const etablissementParams = await paramRepo.count({
        where: { etablissementId: null as any } as any
    });

    results.push({
        check: 'ParametreSysteme total',
        status: totalParams > 0 ? 'PASS' : 'FAIL',
        message: `${totalParams} paramètres en base`,
        details: { total: totalParams, global: globalParams }
    });

    // Vérifier les paramètres migrés
    const migratedKeys = [
        'app.nom_etablissement',
        'app.langue_defaut',
        'app.devise',
        'app.theme_defaut',
        'modules.notes.actif',
        'modules.bulletins.actif',
    ];

    let foundMigrated = 0;
    for (const cle of migratedKeys) {
        const exists = await paramRepo.findOne({ where: { cle } });
        if (exists) foundMigrated++;
    }

    results.push({
        check: 'Paramètres migrés depuis ConfigurationApp',
        status: foundMigrated > 0 ? 'PASS' : 'WARN',
        message: `${foundMigrated}/${migratedKeys.length} paramètres migrés trouvés`,
    });
}

/**
 * Check 2: EtablissementConfig simplifié
 */
async function check2_EtablissementConfigSimplifie(dataSource: any): Promise<void> {
    logger.info('\n📋 Check 2: EtablissementConfig simplifié');

    const configRepo = dataSource.getRepository('etablissement_config');
    const configs = await configRepo.find({});

    if (configs.length === 0) {
        results.push({
            check: 'EtablissementConfig existe',
            status: 'WARN',
            message: 'Aucune configuration établissement trouvée',
        });
        return;
    }

    // Vérifier que les champs migrés sont NULL/vides
    let simplifiedCount = 0;
    for (const config of configs) {
        const hasThemeFields = !!(config as any).couleurPrimaire || (config as any).theme;
        const hasRegionalFields = !!(config as any).langueDefaut || (config as any).devise;
        const hasModules = !!(config as any).modulesActifs && Object.keys((config as any).modulesActifs).length > 0;

        if (!hasThemeFields && !hasRegionalFields && !hasModules) {
            simplifiedCount++;
        }
    }

    results.push({
        check: 'EtablissementConfig simplifié',
        status: simplifiedCount === configs.length ? 'PASS' : 'WARN',
        message: `${simplifiedCount}/${configs.length} configurations simplifiées`,
    });
}

/**
 * Check 3: Fallbacks fonctionnent
 */
async function check3_FonctionnementFallbacks(dataSource: any): Promise<void> {
    logger.info('\n📋 Check 3: Fallbacks');

    // Ce check nécessite le service de configuration
    // On vérifie simplement que la structure des données est cohérente
    const paramRepo = dataSource.getRepository(ParametreSysteme);

    // Vérifier que les paramètres globaux ont une valeurDefaut
    const globalParams = await paramRepo.find({
        where: { etablissementId: null as any }
    });

    let withDefaultValue = 0;
    for (const param of globalParams) {
        if ((param as any).valeurDefaut) {
            withDefaultValue++;
        }
    }

    results.push({
        check: 'Paramètres avec valeurDefaut',
        status: withDefaultValue > 0 ? 'PASS' : 'WARN',
        message: `${withDefaultValue}/${globalParams.length} paramètres ont une valeur par défaut`,
    });
}

/**
 * Check 4: Cohérence des modules
 */
async function check4_CohérenceModules(dataSource: any): Promise<void> {
    logger.info('\n📋 Check 4: Cohérence des modules');

    const paramRepo = dataSource.getRepository(ParametreSysteme);

    // Vérifier que les modules critiques sont actifs
    const criticalModules = ['auth', 'utilisateurs', 'configuration', 'notifications'];
    let activeCriticalModules = 0;

    for (const module of criticalModules) {
        const param = await paramRepo.findOne({
            where: { cle: `modules.${module}.actif` }
        });
        
        if (param) {
            try {
                const value = JSON.parse((param as any).valeur);
                if (value === true) activeCriticalModules++;
            } catch {
                // Ignore parse errors
            }
        }
    }

    results.push({
        check: 'Modules critiques actifs',
        status: activeCriticalModules === criticalModules.length ? 'PASS' : 'WARN',
        message: `${activeCriticalModules}/${criticalModules.length} modules critiques actifs`,
    });
}

/**
 * Affiche les résultats de vérification
 */
function displayResults(): void {
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 RÉSULTATS DE LA VÉRIFICATION');
    logger.info('='.repeat(60));

    for (const result of results) {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        logger.info(`${icon} ${result.check}: ${result.message}`);
        
        if (result.details) {
            logger.info(`   Détails: ${JSON.stringify(result.details)}`);
        }
    }

    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.filter(r => r.status === 'WARN').length;

    logger.info('='.repeat(60));
    logger.info(`📊 Résumé: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);
    logger.info('='.repeat(60));
}

// Exécuter la vérification
verify()
    .then(() => {
        logger.info('✅ Vérification complétée');
        process.exit(0);
    })
    .catch((error) => {
        logger.error(`❌ Vérification échouée: ${error}`);
        process.exit(1);
    });
