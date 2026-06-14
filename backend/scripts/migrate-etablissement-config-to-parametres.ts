/**
 * ==================================
 * eLISAschool - Migration EtablissementConfig vers ParametreSysteme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Migration des champs redondants d'EtablissementConfig vers ParametreSysteme
 * avec scopage par établissement.
 * 
 * Champs migrés:
 * - couleurPrimaire, couleurSecondaire, couleurAccent, theme
 * - langueDefaut, devise, fuseauHoraire, messageAccueil
 * - modulesActifs
 * 
 * Cette migration est IDÉMPOTENTE et peut être exécutée plusieurs fois sans risque.
 */

// Charger .env depuis la racine du projet
import * as path from 'path';
import * as dotenv from 'dotenv';

const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

import { AppDataSource } from '@database/data-source';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '@modules/configuration/entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

interface FieldMapping {
    cle: (etablissementId: string) => string;
    type: TypeValeurParametre;
    categorie: CategorieParametre;
    description: string;
}

const FIELD_MAPPINGS: Record<string, FieldMapping> = {
    couleurPrimaire: {
        cle: (id: string) => `etablissement.${id}.couleur_primaire`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur primaire de l\'établissement (migré depuis EtablissementConfig)',
    },
    couleurSecondaire: {
        cle: (id: string) => `etablissement.${id}.couleur_secondaire`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur secondaire de l\'établissement (migré depuis EtablissementConfig)',
    },
    couleurAccent: {
        cle: (id: string) => `etablissement.${id}.couleur_accent`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur d\'accent de l\'établissement (migré depuis EtablissementConfig)',
    },
    theme: {
        cle: (id: string) => `etablissement.${id}.theme`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Thème de l\'établissement (migré depuis EtablissementConfig)',
    },
    langueDefaut: {
        cle: (id: string) => `etablissement.${id}.langue_defaut`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Langue par défaut de l\'établissement (migré depuis EtablissementConfig)',
    },
    devise: {
        cle: (id: string) => `etablissement.${id}.devise`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Devise de l\'établissement (migré depuis EtablissementConfig)',
    },
    fuseauHoraire: {
        cle: (id: string) => `etablissement.${id}.fuseau_horaire`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Fuseau horaire de l\'établissement (migré depuis EtablissementConfig)',
    },
    messageAccueil: {
        cle: (id: string) => `etablissement.${id}.message_accueil`,
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Message d\'accueil de l\'établissement (migré depuis EtablissementConfig)',
    },
    modulesActifs: {
        cle: (id: string) => `etablissement.${id}.modules_actifs`,
        type: TypeValeurParametre.JSON,
        categorie: CategorieParametre.MODULE,
        description: 'Modules actifs de l\'établissement (migré depuis EtablissementConfig)',
    },
};

/**
 * Exécute la migration EtablissementConfig → ParametreSysteme
 */
async function migrate(): Promise<void> {
    logger.info('🚀 Démarrage de la migration EtablissementConfig → ParametreSysteme');

    let dataSource;
    try {
        // Initialiser la connexion DB
        dataSource = await AppDataSource.initialize();
        logger.info('✅ Connexion base de données établie');

        const configRepo = dataSource.getRepository('etablissement_config');
        const paramRepo = dataSource.getRepository(ParametreSysteme);

        // Récupérer toutes les configurations d'établissements
        const configs = await configRepo.find({});
        
        if (configs.length === 0) {
            logger.info('ℹ️  Aucun EtablissementConfig à migrer - migration terminée');
            return;
        }

        logger.info(`📋 ${configs.length} EtablissementConfig trouvés - démarrage de la migration`);

        let migratedCount = 0;
        let skippedCount = 0;
        let etablissementCount = 0;

        // Parcourir chaque établissement
        for (const config of configs) {
            const etablissementId = (config as any).etablissementId;
            let etablissementMigrated = false;

            logger.info(`\n📦 Migration établissement: ${etablissementId}`);

            // Parcourir chaque champ à migrer
            for (const [fieldName, mapping] of Object.entries(FIELD_MAPPINGS)) {
                try {
                    const value = (config as any)[fieldName];

                    // Skip si valeur undefined, null ou vide
                    if (value === undefined || value === null || value === '' || 
                        (typeof value === 'object' && Object.keys(value).length === 0)) {
                        skippedCount++;
                        continue;
                    }

                    const cle = mapping.cle(etablissementId);

                    // Vérifier si le paramètre existe déjà (idempotence)
                    const existing = await paramRepo.findOne({
                        where: { cle, etablissementId }
                    });

                    if (existing) {
                        logger.info(`  ⏭️  Paramètre existe déjà: ${cle}`);
                        skippedCount++;
                        continue;
                    }

                    // Créer le paramètre avec scopage établissement
                    const param = paramRepo.create({
                        cle,
                        valeur: JSON.stringify(value),
                        typeValeur: mapping.type,
                        categorie: mapping.categorie,
                        description: mapping.description,
                        etablissementId, // ✅ Scopé à l'établissement
                        valeurDefaut: JSON.stringify(value),
                        modifiableRuntime: true,
                        visible: true,
                    });

                    await paramRepo.save(param);
                    migratedCount++;
                    etablissementMigrated = true;
                    logger.info(`  ✅ Migré: ${fieldName} → ${cle}`);
                } catch (error) {
                    logger.error(`  ❌ Erreur migration ${fieldName}: ${error}`);
                }
            }

            if (etablissementMigrated) {
                etablissementCount++;
            }
        }

        logger.info('\n🎉 Migration terminée avec succès!');
        logger.info(`📊 Statistiques:`);
        logger.info(`   - Établissements migrés: ${etablissementCount}`);
        logger.info(`   - Paramètres migrés: ${migratedCount}`);
        logger.info(`   - Paramètres ignorés: ${skippedCount}`);

    } catch (error) {
        logger.error(`💥 Échec de la migration: ${error}`);
        throw error;
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

// Exécuter la migration
migrate()
    .then(() => {
        logger.info('✅ Migration complétée');
        process.exit(0);
    })
    .catch((error) => {
        logger.error(`❌ Migration échouée: ${error}`);
        process.exit(1);
    });
