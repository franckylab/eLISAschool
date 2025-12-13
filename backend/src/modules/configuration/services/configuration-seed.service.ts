/**
 * ==================================
 * eLISAschool - Service Seed Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Initialisation des paramètres de configuration lors de la première installation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ConfigurationApp } from '../entities/configuration-app.entity';
import { ConfigurationModule } from '../entities/configuration-module.entity';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '../entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';
import { MODULE_REGISTRY, ModuleConfig } from '@shared/config/config.registry';
import { ModuleName } from '@shared/enums/modules.enum';

/**
 * Définition d'un paramètre par défaut
 */
interface ParametreDefaut {
    cle: string;
    valeur: any;
    typeValeur: TypeValeurParametre;
    categorie: CategorieParametre;
    module?: string;
    description: string;
    modifiableRuntime: boolean;
    visible: boolean;
    ordre: number;
    options?: { value: string; label: string }[];
}

/**
 * Service de seed pour la configuration
 */
export class ConfigurationSeedService {
    private configAppRepo: Repository<ConfigurationApp>;
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;

    constructor() {
        this.configAppRepo = AppDataSource.getRepository(ConfigurationApp);
        this.configModuleRepo = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
    }

    /**
     * Exécute tous les seeds de configuration
     */
    async runAllSeeds(): Promise<{ app: boolean; modules: number; parametres: number }> {
        logger.info('🌱 Démarrage du seed de configuration...');

        const appCreated = await this.seedConfigurationApp();
        const modulesCreated = await this.seedConfigurationModules();
        const parametresCreated = await this.seedParametresSysteme();

        logger.info(`✅ Seed terminé: App=${appCreated}, Modules=${modulesCreated}, Paramètres=${parametresCreated}`);

        return {
            app: appCreated,
            modules: modulesCreated,
            parametres: parametresCreated,
        };
    }

    /**
     * Seed de la configuration application
     */
    async seedConfigurationApp(): Promise<boolean> {
        const existing = await this.configAppRepo.findOne({ where: {} });
        if (existing) {
            logger.info('Configuration app déjà existante, skip...');
            return false;
        }

        const config = this.configAppRepo.create({
            nomEtablissement: 'eLISAschool Demo',
            typeEtablissement: 'MIXTE',
            langueDefaut: 'fr',
            devise: 'XAF',
            fuseauHoraire: 'Africa/Douala',
            couleurPrimaire: '#28a745',
            couleurSecondaire: '#ffc107',
            couleurAccent: '#007bff',
            theme: 'default',
            messageAccueil: 'Bienvenue sur eLISAschool - Votre solution de gestion scolaire',
            modulesActifs: this.getDefaultActiveModules(),
            version: '1.0.0',
        });

        await this.configAppRepo.save(config);
        logger.info('✅ Configuration app créée');
        return true;
    }

    /**
     * Seed des configurations de modules
     */
    async seedConfigurationModules(): Promise<number> {
        let created = 0;

        for (const moduleName of Object.values(ModuleName)) {
            const existing = await this.configModuleRepo.findOne({ where: { moduleNom: moduleName } });
            if (existing) continue;

            const registryConfig = MODULE_REGISTRY[moduleName];
            if (!registryConfig) continue;

            const config = this.configModuleRepo.create({
                moduleNom: moduleName,
                champsPersonnalises: [],
                widgets: [],
                parametres: registryConfig.defaultSettings || {},
                actif: registryConfig.defaultActive,
            });

            await this.configModuleRepo.save(config);
            created++;
        }

        logger.info(`✅ ${created} configurations de modules créées`);
        return created;
    }

    /**
     * Seed des paramètres système
     */
    async seedParametresSysteme(): Promise<number> {
        const defaults = this.getAllDefaultParametres();
        let created = 0;

        for (const param of defaults) {
            const existing = await this.parametreRepo.findOne({ where: { cle: param.cle } });
            if (existing) continue;

            const entity = this.parametreRepo.create({
                cle: param.cle,
                valeur: JSON.stringify(param.valeur),
                valeurDefaut: JSON.stringify(param.valeur),
                typeValeur: param.typeValeur,
                categorie: param.categorie,
                module: param.module,
                description: param.description,
                modifiableRuntime: param.modifiableRuntime,
                visible: param.visible,
                ordre: param.ordre,
                options: param.options,
            });

            await this.parametreRepo.save(entity);
            created++;
        }

        logger.info(`✅ ${created} paramètres système créés`);
        return created;
    }

    /**
     * Modules actifs par défaut
     */
    private getDefaultActiveModules(): Record<string, boolean> {
        const modules: Record<string, boolean> = {};
        Object.values(MODULE_REGISTRY).forEach((m: ModuleConfig) => {
            modules[m.name] = m.defaultActive;
        });
        return modules;
    }

    /**
     * Tous les paramètres par défaut
     */
    private getAllDefaultParametres(): ParametreDefaut[] {
        return [
            // ============ SÉCURITÉ (auth) ============
            { cle: 'auth.session_duration', valeur: 1440, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Durée de session en minutes (24h par défaut)', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'auth.max_login_attempts', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Nombre max de tentatives de connexion', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'auth.lockout_duration', valeur: 15, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Durée de blocage après échecs (minutes)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'auth.require_2fa', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger l\'authentification 2FA', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'auth.password_min_length', valeur: 8, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Longueur minimale du mot de passe', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'auth.password_require_uppercase', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger une majuscule', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'auth.password_require_number', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger un chiffre', modifiableRuntime: true, visible: true, ordre: 7 },

            // ============ NOTIFICATIONS ============
            { cle: 'notifications.enable_push', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Activer les notifications push', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'notifications.enable_email', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Activer les notifications email', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'notifications.enable_sms', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Activer les notifications SMS', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'notifications.default_channel', valeur: 'IN_APP', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Canal par défaut', modifiableRuntime: true, visible: true, ordre: 4, options: [{ value: 'IN_APP', label: 'Application' }, { value: 'EMAIL', label: 'Email' }, { value: 'PUSH', label: 'Push' }] },

            // ============ NOTES ============
            { cle: 'notes.bareme_defaut', valeur: 20, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Barème par défaut des évaluations', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'notes.show_ranking', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Afficher le classement', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'notes.require_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Validation obligatoire des notes', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'notes.allow_bulk_entry', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Autoriser la saisie en masse', modifiableRuntime: true, visible: true, ordre: 4 },

            // ============ CANTINE ============
            { cle: 'cantine.menu_planning_days', valeur: 7, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Jours de planification des menus', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'cantine.allow_preorder', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Autoriser les précommandes', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'cantine.max_debt', valeur: 10000, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Dette maximale autorisée (FCFA)', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ TRANSPORT ============
            { cle: 'transport.enable_gps', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Activer le suivi GPS', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'transport.enable_qr_checkin', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Activer le pointage par QR code', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'transport.alert_delay_minutes', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Délai avant alerte retard (minutes)', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ GAMIFICATION ============
            { cle: 'gamification.points_attendance', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Points par présence journalière', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'gamification.points_good_grade', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Points pour bonne note (≥80%)', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'gamification.enable_leaderboard', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Activer le leaderboard', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'gamification.anonymize_ranking', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Anonymiser le classement', modifiableRuntime: true, visible: true, ordre: 4 },

            // ============ CARTES ============
            { cle: 'cartes.enable_qrcode', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Inclure QR code sur les cartes', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'cartes.validity_months', valeur: 12, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Durée de validité (mois)', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'cartes.include_photo', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Inclure la photo', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ CLUBS ============
            { cle: 'clubs.max_per_student', valeur: 3, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Nombre max de clubs par élève', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'clubs.require_approval', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Approbation requise pour inscription', modifiableRuntime: true, visible: true, ordre: 2 },

            // ============ MATÉRIEL ============
            { cle: 'materiel.max_loan_days', valeur: 30, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Durée max de prêt (jours)', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'materiel.enable_barcode', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Activer les codes-barres', modifiableRuntime: true, visible: true, ordre: 2 },

            // ============ REQUÊTES ============
            { cle: 'requetes.approval_levels', valeur: 1, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'requetes', description: 'Niveaux d\'approbation', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'requetes.auto_notify', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'requetes', description: 'Notification automatique', modifiableRuntime: true, visible: true, ordre: 2 },

            // ============ RÉGIONAL ============
            { cle: 'regional.currency', valeur: 'XOF', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.REGIONAL, description: 'Devise monétaire', modifiableRuntime: true, visible: true, ordre: 1, options: [{ value: 'XOF', label: 'Franc CFA (FCFA)' }, { value: 'EUR', label: 'Euro (€)' }, { value: 'USD', label: 'Dollar ($)' }] },
            { cle: 'regional.timezone', valeur: 'Africa/Douala', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.REGIONAL, description: 'Fuseau horaire', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'regional.language', valeur: 'fr', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.REGIONAL, description: 'Langue par défaut', modifiableRuntime: true, visible: true, ordre: 3, options: [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }] },
            { cle: 'regional.date_format', valeur: 'DD/MM/YYYY', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.REGIONAL, description: 'Format de date', modifiableRuntime: true, visible: true, ordre: 4 },

            // ============ UTILISATEURS ============
            { cle: 'utilisateurs.default_role', valeur: 'ELEVE', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.MODULE, module: 'utilisateurs', description: 'Rôle par défaut à l\'inscription', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'utilisateurs.allow_self_registration', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'utilisateurs', description: 'Autoriser l\'auto-inscription', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'utilisateurs.require_email_verification', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'utilisateurs', description: 'Exiger la vérification email', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ SYSTÈME ============
            { cle: 'system.backup_retention_days', valeur: 30, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SYSTEME, description: 'Jours de rétention des sauvegardes', modifiableRuntime: false, visible: true, ordre: 1 },
            { cle: 'system.log_level', valeur: 'info', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.SYSTEME, description: 'Niveau de log', modifiableRuntime: true, visible: true, ordre: 2, options: [{ value: 'debug', label: 'Debug' }, { value: 'info', label: 'Info' }, { value: 'warn', label: 'Warning' }, { value: 'error', label: 'Error' }] },
            { cle: 'system.maintenance_mode', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SYSTEME, description: 'Mode maintenance', modifiableRuntime: true, visible: true, ordre: 3 },
        ];
    }
}

export const configurationSeedService = new ConfigurationSeedService();
export default ConfigurationSeedService;
