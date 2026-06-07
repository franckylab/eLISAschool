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
            { cle: 'notifications.default_channel', valeur: 'IN_APP', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Canal par défaut', modifiableRuntime: true, visible: true, ordre: 4, options: [{ value: 'IN_APP', label: 'Application' }, { value: 'EMAIL', label: 'Email' }, { value: 'PUSH', label: 'Push' }, { value: 'SMS', label: 'SMS' }] },
            { cle: 'notifications.providers.auto_load', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Charger automatiquement les providers au démarrage', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'notifications.retries.max_attempts', valeur: 3, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Nombre maximal de tentatives d\'envoi', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'notifications.rate_limit.per_hour', valeur: 100, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.NOTIFICATION, module: 'notifications', description: 'Limite de notifications par utilisateur par heure', modifiableRuntime: true, visible: true, ordre: 7 },

            // ============ NOTES ============
            { cle: 'notes.bareme_defaut', valeur: 20, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Barème par défaut des évaluations', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'notes.show_ranking', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Afficher le classement', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'notes.require_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Validation obligatoire des notes', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'notes.allow_bulk_entry', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Autoriser la saisie en masse', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'notes.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Niveaux de validation des notes', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'notes.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'notes.auto_notify_on_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Notifier les parents après validation', modifiableRuntime: true, visible: true, ordre: 7 },

            // ============ CANTINE ============
            { cle: 'cantine.menu_planning_days', valeur: 7, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Jours de planification des menus', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'cantine.allow_preorder', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Autoriser les précommandes', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'cantine.max_debt', valeur: 10000, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Dette maximale autorisée (FCFA)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'cantine.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Niveaux de validation inscriptions', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'cantine.validation_roles', valeur: JSON.stringify({ '1': 'PERSONNEL', '2': 'RESPONSABLE_CANTINE', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Rôles requis par niveau', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'cantine.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cantine', description: 'Validation obligatoire des inscriptions cantine', modifiableRuntime: true, visible: true, ordre: 6 },

            // ============ TRANSPORT ============
            { cle: 'transport.enable_gps', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Activer le suivi GPS', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'transport.enable_qr_checkin', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Activer le pointage par QR code', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'transport.alert_delay_minutes', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Délai avant alerte retard (minutes)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'transport.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Niveaux de validation inscriptions', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'transport.validation_roles', valeur: JSON.stringify({ '1': 'PERSONNEL', '2': 'RESPONSABLE_TRANSPORT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Rôles requis par niveau', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'transport.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'transport', description: 'Validation obligatoire des inscriptions transport', modifiableRuntime: true, visible: true, ordre: 6 },

            // ============ BULLETINS ============
            { cle: 'bulletins.include_ranking', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Inclure le classement', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'bulletins.show_appreciations', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Afficher les appréciations', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'bulletins.validation_threshold', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Seuil de validation (/20)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'bulletins.calculation_method', valeur: 'ponderee', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Méthode de calcul', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'bulletins.display_coefficients', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Afficher les coefficients', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'bulletins.template_id', valeur: 'default', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Template par défaut', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'bulletins.validation_workflow', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Activer workflow validation', modifiableRuntime: true, visible: true, ordre: 7 },
            { cle: 'bulletins.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Niveaux de validation', modifiableRuntime: true, visible: true, ordre: 8 },
            { cle: 'bulletins.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Rôles requis par niveau', modifiableRuntime: true, visible: true, ordre: 9 },

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

            // ============ CLASSES ============
            { cle: 'classes.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'classes', description: 'Validation obligatoire des affectations d\'élèves', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'classes.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'classes', description: 'Niveaux de validation des affectations', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'classes.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'classes', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ MATIÈRES ============
            { cle: 'matieres.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'matieres', description: 'Validation obligatoire des affectations enseignants et programmes', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'matieres.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'matieres', description: 'Niveaux de validation des affectations/programmes', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'matieres.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'matieres', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ PÉRIODES ============
            { cle: 'periodes.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Validation obligatoire de la clôture des périodes', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'periodes.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Niveaux de validation de la clôture', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'periodes.validation_roles', valeur: JSON.stringify({ '1': 'CHEF_ETABLISSEMENT', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ ÉLÈVES ============
            { cle: 'eleves.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Validation obligatoire des inscriptions d\'élèves', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'eleves.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Niveaux de validation des inscriptions', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'eleves.validation_roles', valeur: JSON.stringify({ '1': 'PERSONNEL', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ PERSONNEL ============
            { cle: 'personnel.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Validation obligatoire des embauches de personnel', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'personnel.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Niveaux de validation des embauches', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'personnel.validation_roles', valeur: JSON.stringify({ '1': 'CHEF_ETABLISSEMENT', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ CLUBS (workflow) ============
            { cle: 'clubs.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Validation obligatoire de la création de clubs', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'clubs.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Niveaux de validation des clubs', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'clubs.validation_roles', valeur: JSON.stringify({ '1': 'COORDINATEUR_CLUBS', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'clubs.inscription_require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'clubs', description: 'Validation obligatoire des inscriptions aux clubs', modifiableRuntime: true, visible: true, ordre: 6 },

            // ============ MATÉRIEL (workflow) ============
            { cle: 'materiel.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Validation obligatoire des acquisitions de matériel', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'materiel.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Niveaux de validation du matériel', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'materiel.validation_roles', valeur: JSON.stringify({ '1': 'GESTIONNAIRE', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'materiel.pret_require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'materiel', description: 'Validation obligatoire des prêts de matériel', modifiableRuntime: true, visible: true, ordre: 6 },

            // ============ CARTES ============
            { cle: 'cartes.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Validation obligatoire des demandes de carte', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'cartes.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Niveaux de validation des cartes', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'cartes.validation_roles', valeur: JSON.stringify({ '1': 'CHEF_ETABLISSEMENT', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Rôles requis par niveau de validation des cartes', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'cartes.renouvellement_require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'cartes', description: 'Validation obligatoire des renouvellements de carte', modifiableRuntime: true, visible: true, ordre: 6 },

            // ============ ANNÉES SCOLAIRES ============
            { cle: 'annees_scolaires.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Validation obligatoire des années scolaires (création et clôture)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'annees_scolaires.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Niveaux de validation des années scolaires', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'annees_scolaires.validation_roles', valeur: JSON.stringify({ '1': 'CHEF_ETABLISSEMENT', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Rôles requis par niveau de validation des années scolaires', modifiableRuntime: true, visible: true, ordre: 5 },

            // ============ ÉTABLISSEMENT ============
            { cle: 'etablissement.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Validation obligatoire des créations/désactivations d\'établissement', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'etablissement.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Niveaux de validation des établissements', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'etablissement.validation_roles', valeur: JSON.stringify({ '1': 'ADMIN', '2': 'SUPER_ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Rôles requis par niveau de validation des établissements', modifiableRuntime: true, visible: true, ordre: 5 },

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
