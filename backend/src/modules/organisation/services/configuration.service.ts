/**
 * ==================================
 * eLISAschool - Service Configuration Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Paramètres configurables et réinitialisables pour le module organisation
 * - Seuils d'alertes
 * - Comportements par défaut
 * - Limites et quotas
 * - Options d'affichage
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';
import { redisService } from '@common/services/redis.service';

// ==================== TYPES DE PARAMÈTRES ====================

export interface ParametreOrganisation {
    cle: string;
    valeur: string | number | boolean;
    type: 'string' | 'number' | 'boolean' | 'json';
    label: string;
    description: string;
    categorie: string;
    valeurParDefaut: string | number | boolean;
    modifiable: boolean;
}

// ==================== DÉFINITIONS DES PARAMÈTRES ====================

export const PARAMETRES_ORGANISATION_DEFAULT: ParametreOrganisation[] = [
    // Alertes et Notifications
    {
        cle: 'organisation.seuil_vacance_critique',
        valeur: 30,
        type: 'number',
        label: 'Seuil critique vacance (jours)',
        description: 'Nombre de jours après lequel un poste vacant est considéré critique',
        categorie: 'alertes',
        valeurParDefaut: 30,
        modifiable: true,
    },
    {
        cle: 'organisation.seuil_vacance_avertissement',
        valeur: 15,
        type: 'number',
        label: 'Seuil avertissement vacance (jours)',
        description: 'Nombre de jours pour afficher un avertissement',
        categorie: 'alertes',
        valeurParDefaut: 15,
        modifiable: true,
    },
    {
        cle: 'organisation.notifications_vacance_activees',
        valeur: true,
        type: 'boolean',
        label: 'Notifications postes vacants',
        description: 'Activer les notifications pour les postes vacants',
        categorie: 'alertes',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.frequence_verification_vacance',
        valeur: 'quotidien',
        type: 'string',
        label: 'Fréquence vérification vacance',
        description: 'Fréquence de vérification des postes vacants (quotidien, hebdomadaire, mensuel)',
        categorie: 'alertes',
        valeurParDefaut: 'quotidien',
        modifiable: true,
    },

    // Cache et Performance
    {
        cle: 'organisation.cache_arborescence_ttl',
        valeur: 300,
        type: 'number',
        label: 'TTL cache arborescence (secondes)',
        description: 'Durée de vie du cache pour l\'arborescence (5 min par défaut)',
        categorie: 'performance',
        valeurParDefaut: 300,
        modifiable: true,
    },
    {
        cle: 'organisation.cache_organigramme_ttl',
        valeur: 300,
        type: 'number',
        label: 'TTL cache organigramme (secondes)',
        description: 'Durée de vie du cache pour l\'organigramme',
        categorie: 'performance',
        valeurParDefaut: 300,
        modifiable: true,
    },
    {
        cle: 'organisation.cache_actif',
        valeur: true,
        type: 'boolean',
        label: 'Cache activé',
        description: 'Activer/désactiver le cache Redis',
        categorie: 'performance',
        valeurParDefaut: true,
        modifiable: true,
    },

    // Clonage et Duplication
    {
        cle: 'organisation.clonage_actif',
        valeur: true,
        type: 'boolean',
        label: 'Clonage activé',
        description: 'Autoriser le clonage d\'unités et structures',
        categorie: 'clonage',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.clonage_unites_max',
        valeur: 50,
        type: 'number',
        label: 'Max unités par clonage',
        description: 'Nombre maximum d\'unités pouvant être clonées en une opération',
        categorie: 'clonage',
        valeurParDefaut: 50,
        modifiable: true,
    },
    {
        cle: 'organisation.clonage_postes_toujours_vacants',
        valeur: true,
        type: 'boolean',
        label: 'Postes clonés vacants',
        description: 'Les postes clonés sont toujours créés vacants',
        categorie: 'clonage',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.clonage_prefixe_auto',
        valeur: 'COPY',
        type: 'string',
        label: 'Préfixe auto clonage',
        description: 'Préfixe automatique pour les codes clonés',
        categorie: 'clonage',
        valeurParDefaut: 'COPY',
        modifiable: true,
    },

    // Validation et Cohérence
    {
        cle: 'organisation.validation_arborescence_auto',
        valeur: false,
        type: 'boolean',
        label: 'Validation automatique',
        description: 'Valider automatiquement l\'arborescence après modifications',
        categorie: 'validation',
        valeurParDefaut: false,
        modifiable: true,
    },
    {
        cle: 'organisation.blocage_cycles_strict',
        valeur: true,
        type: 'boolean',
        label: 'Blocage cycles strict',
        description: 'Bloquer strictement toute création de cycle hiérarchique',
        categorie: 'validation',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.profondeur_max_arborescence',
        valeur: 10,
        type: 'number',
        label: 'Profondeur max arborescence',
        description: 'Profondeur maximale autorisée dans l\'arborescence',
        categorie: 'validation',
        valeurParDefaut: 10,
        modifiable: true,
    },

    // Historique et Traçabilité
    {
        cle: 'organisation.historique_actif',
        valeur: true,
        type: 'boolean',
        label: 'Historique activé',
        description: 'Enregistrer l\'historique des mouvements',
        categorie: 'historique',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.historique_retention_jours',
        valeur: 365,
        type: 'number',
        label: 'Rétention historique (jours)',
        description: 'Durée de conservation de l\'historique (1 an)',
        categorie: 'historique',
        valeurParDefaut: 365,
        modifiable: true,
    },
    {
        cle: 'organisation.historique_max_par_personnel',
        valeur: 100,
        type: 'number',
        label: 'Max historique par personnel',
        description: 'Nombre maximum d\'entrées d\'historique par personnel',
        categorie: 'historique',
        valeurParDefaut: 100,
        modifiable: true,
    },

    // Affichage et Export
    {
        cle: 'organisation.export_pdf_actif',
        valeur: true,
        type: 'boolean',
        label: 'Export PDF activé',
        description: 'Autoriser l\'export PDF des organigrammes',
        categorie: 'export',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.export_inclure_statistiques',
        valeur: true,
        type: 'boolean',
        label: 'Inclure statistiques export',
        description: 'Inclure les statistiques dans les exports PDF',
        categorie: 'export',
        valeurParDefaut: true,
        modifiable: true,
    },
    {
        cle: 'organisation.export_theme_couleurs',
        valeur: 'professionnel',
        type: 'string',
        label: 'Thème couleurs export',
        description: 'Thème de couleurs pour les exports (professionnel, moderne, classique)',
        categorie: 'export',
        valeurParDefaut: 'professionnel',
        modifiable: true,
    },

    // Multi-tenancy et Sécurité
    {
        cle: 'organisation.isolation_etablissement_stricte',
        valeur: true,
        type: 'boolean',
        label: 'Isolation stricte établissement',
        description: 'Isolation stricte des données par établissement',
        categorie: 'securite',
        valeurParDefaut: true,
        modifiable: false, // Paramètre système critique
    },
    {
        cle: 'organisation.suppression_verification_unites',
        valeur: true,
        type: 'boolean',
        label: 'Vérification avant suppression',
        description: 'Vérifier les unités actives avant suppression organisation',
        categorie: 'securite',
        valeurParDefaut: true,
        modifiable: true,
    },

    // Pagination
    {
        cle: 'organisation.pagination_defaut_limit',
        valeur: 20,
        type: 'number',
        label: 'Limite pagination par défaut',
        description: 'Nombre d\'éléments par page par défaut',
        categorie: 'pagination',
        valeurParDefaut: 20,
        modifiable: true,
    },
    {
        cle: 'organisation.pagination_max_limit',
        valeur: 100,
        type: 'number',
        label: 'Limite pagination maximum',
        description: 'Nombre maximum d\'éléments par page',
        categorie: 'pagination',
        valeurParDefaut: 100,
        modifiable: true,
    },
];

// ==================== SERVICE DE CONFIGURATION ====================

export class ConfigurationOrganisationService {
    private static instance: ConfigurationOrganisationService;
    private cache = new Map<string, ParametreOrganisation>();
    private initialised = false;

    // OPTIMISATION: Cache Redis avec TTL pour configuration
    private readonly CACHE_PREFIX = 'org:config:';
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly useRedis = process.env.REDIS_URL ? true : false;

    private constructor() {}

    static getInstance(): ConfigurationOrganisationService {
        if (!ConfigurationOrganisationService.instance) {
            ConfigurationOrganisationService.instance = new ConfigurationOrganisationService();
        }
        return ConfigurationOrganisationService.instance;
    }

    /**
     * Initialiser les paramètres par défaut
     */
    async initialiser(): Promise<void> {
        if (this.initialised) return;

        // Charger tous les paramètres par défaut en cache
        PARAMETRES_ORGANISATION_DEFAULT.forEach((param) => {
            this.cache.set(param.cle, { ...param });
        });

        this.initialised = true;
        logger.info('[ConfigurationOrganisation] Initialisé avec 26 paramètres par défaut');
    }

    /**
     * Obtenir un paramètre
     */
    async getParametre(cle: string): Promise<ParametreOrganisation | null> {
        if (!this.initialised) {
            await this.initialiser();
        }

        return this.cache.get(cle) || null;
    }

    /**
     * Obtenir la valeur d'un paramètre
     */
    async getValeur<T = any>(cle: string): Promise<T | null> {
        const param = await this.getParametre(cle);
        if (!param) return null;

        return param.valeur as T;
    }

    /**
     * Obtenir tous les paramètres d'une catégorie
     */
    async getParametresParCategorie(categorie: string): Promise<ParametreOrganisation[]> {
        if (!this.initialised) {
            await this.initialiser();
        }

        return Array.from(this.cache.values()).filter(
            (p) => p.categorie === categorie
        );
    }

    /**
     * Obtenir tous les paramètres
     */
    async getAllParametres(): Promise<ParametreOrganisation[]> {
        if (!this.initialised) {
            await this.initialiser();
        }

        return Array.from(this.cache.values());
    }

    /**
     * Mettre à jour un paramètre
     */
    async setParametre(cle: string, valeur: string | number | boolean): Promise<ParametreOrganisation> {
        if (!this.initialised) {
            await this.initialiser();
        }

        const param = this.cache.get(cle);
        if (!param) {
            throw new AppError(`Paramètre inconnu: ${cle}`, 404, 'PARAM_NOT_FOUND');
        }

        if (!param.modifiable) {
            throw new AppError(
                `Paramètre non modifiable: ${cle} (paramètre système)`,
                403,
                'PARAM_NOT_MODIFIABLE'
            );
        }

        // Validation et coercion du type
        let valeurCoerced = valeur;
        if (param.type === 'number' && typeof valeur === 'string') {
            const parsed = Number(valeur);
            if (isNaN(parsed)) {
                throw new AppError(`Type invalide: nombre attendu pour ${cle}`, 400, 'INVALID_TYPE');
            }
            valeurCoerced = parsed;
        } else if (param.type === 'boolean' && typeof valeur === 'string') {
            valeurCoerced = valeur === 'true' || valeur === '1';
        }
        this.validerType(valeurCoerced, param.type);

        param.valeur = valeurCoerced;
        this.cache.set(cle, param);

        logger.info(`[ConfigurationOrganisation] Paramètre modifié: ${cle} = ${valeur}`);
        return param;
    }

    /**
     * Réinitialiser un paramètre à sa valeur par défaut
     */
    async resetParametre(cle: string): Promise<ParametreOrganisation> {
        if (!this.initialised) {
            await this.initialiser();
        }

        const param = this.cache.get(cle);
        if (!param) {
            throw new AppError(`Paramètre inconnu: ${cle}`, 404, 'PARAM_NOT_FOUND');
        }

        param.valeur = param.valeurParDefaut;
        this.cache.set(cle, param);

        logger.info(`[ConfigurationOrganisation] Paramètre réinitialisé: ${cle}`);
        return param;
    }

    /**
     * Réinitialiser tous les paramètres d'une catégorie
     */
    async resetCategorie(categorie: string): Promise<number> {
        if (!this.initialised) {
            await this.initialiser();
        }

        let count = 0;
        this.cache.forEach((param, cle) => {
            if (param.categorie === categorie) {
                param.valeur = param.valeurParDefaut;
                this.cache.set(cle, param);
                count++;
            }
        });

        logger.info(`[ConfigurationOrganisation] Catégorie réinitialisée: ${categorie} (${count} paramètres)`);
        return count;
    }

    /**
     * Réinitialiser TOUS les paramètres
     */
    async resetAll(): Promise<number> {
        if (!this.initialised) {
            await this.initialiser();
        }

        let count = 0;
        this.cache.forEach((param, cle) => {
            if (param.modifiable) {
                param.valeur = param.valeurParDefaut;
                this.cache.set(cle, param);
                count++;
            }
        });

        logger.info(`[ConfigurationOrganisation] Tous les paramètres réinitialisés (${count} paramètres)`);
        return count;
    }

    /**
     * Exporter la configuration courante
     */
    async exporterConfiguration(): Promise<Record<string, any>> {
        if (!this.initialised) {
            await this.initialiser();
        }

        const config: Record<string, any> = {};
        this.cache.forEach((param) => {
            config[param.cle] = param.valeur;
        });

        return config;
    }

    /**
     * Importer une configuration
     */
    async importerConfiguration(config: Record<string, any>): Promise<number> {
        if (!this.initialised) {
            await this.initialiser();
        }

        let count = 0;
        for (const [cle, valeur] of Object.entries(config)) {
            try {
                await this.setParametre(cle, valeur);
                count++;
            } catch (error) {
                logger.warn(`[ConfigurationOrganisation] Échec import ${cle}:`, error);
            }
        }

        logger.info(`[ConfigurationOrganisation] Configuration importée (${count} paramètres)`);
        return count;
    }

    /**
     * Obtenir les statistiques de configuration
     */
    async getStatistiques(): Promise<any> {
        if (!this.initialised) {
            await this.initialiser();
        }

        const params = Array.from(this.cache.values());
        const parCategorie = params.reduce((acc, p) => {
            acc[p.categorie] = (acc[p.categorie] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const modifies = params.filter((p) => p.valeur !== p.valeurParDefaut).length;
        const nonModifiables = params.filter((p) => !p.modifiable).length;

        return {
            total: params.length,
            parCategorie,
            modifies,
            nonModifiables,
            categories: Object.keys(parCategorie),
        };
    }

    /**
     * Valider le type d'un paramètre
     */
    private validerType(valeur: any, typeAttendu: string): void {
        switch (typeAttendu) {
            case 'number':
                if (typeof valeur !== 'number') {
                    throw new AppError(`Type invalide: nombre attendu`, 400, 'INVALID_TYPE');
                }
                break;
            case 'boolean':
                if (typeof valeur !== 'boolean') {
                    throw new AppError(`Type invalide: booléen attendu`, 400, 'INVALID_TYPE');
                }
                break;
            case 'string':
                if (typeof valeur !== 'string') {
                    throw new AppError(`Type invalide: chaîne attendue`, 400, 'INVALID_TYPE');
                }
                break;
            case 'json':
                // Accepte tout
                break;
            default:
                throw new AppError(`Type inconnu: ${typeAttendu}`, 400, 'UNKNOWN_TYPE');
        }
    }
}

// Singleton export
export const configurationOrganisationService = ConfigurationOrganisationService.getInstance();
