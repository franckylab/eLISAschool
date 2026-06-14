/**
 * ==================================
 * eLISAschool - Migration ConfigurationApp vers ParametreSysteme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Migration des données de l'entité dépréciée ConfigurationApp
 * vers le système unifié ParametreSysteme (scopage global).
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
    cle: string;
    type: TypeValeurParametre;
    categorie: CategorieParametre;
    description: string;
}

const FIELD_MAPPINGS: Record<string, FieldMapping> = {
    // Informations établissement
    nomEtablissement: {
        cle: 'app.nom_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Nom de l\'établissement (migré depuis ConfigurationApp)',
    },
    typeEtablissement: {
        cle: 'app.type_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Type d\'établissement (migré depuis ConfigurationApp)',
    },
    adresseEtablissement: {
        cle: 'app.adresse_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Adresse de l\'établissement (migré depuis ConfigurationApp)',
    },
    villeEtablissement: {
        cle: 'app.ville_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Ville de l\'établissement (migré depuis ConfigurationApp)',
    },
    paysEtablissement: {
        cle: 'app.pays_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Pays de l\'établissement (migré depuis ConfigurationApp)',
    },
    telephoneEtablissement: {
        cle: 'app.telephone_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Téléphone de l\'établissement (migré depuis ConfigurationApp)',
    },
    emailEtablissement: {
        cle: 'app.email_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Email de l\'établissement (migré depuis ConfigurationApp)',
    },
    siteWebEtablissement: {
        cle: 'app.site_web_etablissement',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Site web de l\'établissement (migré depuis ConfigurationApp)',
    },
    numeroAdministratif: {
        cle: 'app.numero_arrete',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Numéro d\'arrêté ministériel (migré depuis ConfigurationApp)',
    },
    sloganEtablissement: {
        cle: 'app.slogan',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Slogan de l\'établissement (migré depuis ConfigurationApp)',
    },
    logoUrl: {
        cle: 'app.logo_url',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'URL du logo (migré depuis ConfigurationApp)',
    },
    messageAccueil: {
        cle: 'app.message_accueil',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.ETABLISSEMENT,
        description: 'Message d\'accueil (migré depuis ConfigurationApp)',
    },

    // Paramètres régionaux
    langueDefaut: {
        cle: 'app.langue_defaut',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Langue par défaut (migré depuis ConfigurationApp)',
    },
    devise: {
        cle: 'app.devise',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Devise monétaire (migré depuis ConfigurationApp)',
    },
    fuseauHoraire: {
        cle: 'app.fuseau_horaire',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.REGIONAL,
        description: 'Fuseau horaire (migré depuis ConfigurationApp)',
    },

    // Thème
    couleurPrimaire: {
        cle: 'app.couleur_primaire',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur primaire du thème (migré depuis ConfigurationApp)',
    },
    couleurSecondaire: {
        cle: 'app.couleur_secondaire',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur secondaire du thème (migré depuis ConfigurationApp)',
    },
    couleurAccent: {
        cle: 'app.couleur_accent',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Couleur d\'accent du thème (migré depuis ConfigurationApp)',
    },
    theme: {
        cle: 'app.theme',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.THEME,
        description: 'Thème actif (migré depuis ConfigurationApp)',
    },

    // Licence
    licenceKey: {
        cle: 'app.licence_key',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.SYSTEME,
        description: 'Clé de licence (migré depuis ConfigurationApp)',
    },
    licenceExpiration: {
        cle: 'app.licence_expiration',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.SYSTEME,
        description: 'Date d\'expiration de la licence (migré depuis ConfigurationApp)',
    },
    licenceActive: {
        cle: 'app.licence_active',
        type: TypeValeurParametre.BOOLEAN,
        categorie: CategorieParametre.SYSTEME,
        description: 'Statut de la licence (migré depuis ConfigurationApp)',
    },

    // Modules activés
    modulesActifs: {
        cle: 'app.modules_actifs',
        type: TypeValeurParametre.JSON,
        categorie: CategorieParametre.MODULE,
        description: 'Modules activés globalement (migré depuis ConfigurationApp)',
    },

    // Version
    version: {
        cle: 'app.version',
        type: TypeValeurParametre.STRING,
        categorie: CategorieParametre.SYSTEME,
        description: 'Version de l\'application (migré depuis ConfigurationApp)',
    },
};

/**
 * Exécute la migration ConfigurationApp → ParametreSysteme
 */
async function migrate(): Promise<void> {
    logger.info('🚀 Démarrage de la migration ConfigurationApp → ParametreSysteme');

    let dataSource;
    try {
        // Initialiser la connexion DB
        dataSource = await AppDataSource.initialize();
        logger.info('✅ Connexion base de données établie');

        const configAppRepo = dataSource.getRepository('configuration_app');
        const paramRepo = dataSource.getRepository(ParametreSysteme);

        // Vérifier s'il y a des données à migrer
        const configApp = await configAppRepo.findOne({ where: {} });
        if (!configApp) {
            logger.info('ℹ️  Aucune ConfigurationApp à migrer - migration terminée');
            return;
        }

        logger.info('📋 ConfigurationApp trouvée - démarrage de la migration');

        let migratedCount = 0;
        let skippedCount = 0;

        // Parcourir chaque champ et migrer
        for (const [fieldName, mapping] of Object.entries(FIELD_MAPPINGS)) {
            try {
                const value = (configApp as any)[fieldName];

                // Skip si valeur undefined ou null
                if (value === undefined || value === null) {
                    skippedCount++;
                    continue;
                }

                // Vérifier si le paramètre existe déjà (idempotence)
                const existing = await paramRepo.findOne({
                    where: { cle: mapping.cle, etablissementId: undefined as any }
                });

                if (existing) {
                    logger.info(`⏭️  Paramètre existe déjà: ${mapping.cle}`);
                    skippedCount++;
                    continue;
                }

                // Créer le paramètre
                const param = paramRepo.create({
                    cle: mapping.cle,
                    valeur: JSON.stringify(value),
                    typeValeur: mapping.type,
                    categorie: mapping.categorie,
                    description: mapping.description,
                    etablissementId: undefined as any, // Global
                    valeurDefaut: JSON.stringify(value),
                    modifiableRuntime: true,
                    visible: true,
                    ordre: migratedCount,
                });

                await paramRepo.save(param);
                migratedCount++;
                logger.info(`✅ Migré: ${fieldName} → ${mapping.cle}`);
            } catch (error) {
                logger.error(`❌ Erreur migration ${fieldName}: ${error}`);
            }
        }

        logger.info('🎉 Migration terminée avec succès!');
        logger.info(`📊 Statistiques: ${migratedCount} migrés, ${skippedCount} ignorés`);

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
