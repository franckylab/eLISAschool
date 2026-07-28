/**
 * ==================================
 * eLISAschool - Service Seed Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Initialisation des paramètres de configuration lors de la première installation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
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
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;

    constructor() {
        this.configModuleRepo = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
    }

    /**
     * Exécute tous les seeds de configuration
     * @param etablissementId ID de l'établissement pour scopage (optionnel)
     * @param force Si true, force la réinitialisation des valeurs existantes vers les valeurs par défaut
     */
    async runAllSeeds(etablissementId?: string, force: boolean = false): Promise<{ modules: number; parametres: number }> {
        logger.info(`🌱 Démarrage du seed de configuration${etablissementId ? ` (Étab: ${etablissementId.substring(0, 8)})` : ''}${force ? ' (FORCÉ)' : ''}...`);

        const modulesCreated = await this.seedConfigurationModules(etablissementId, force);
        const parametresCreated = await this.seedParametresSysteme(etablissementId, force);

        logger.info(`✅ Seed terminé: Modules=${modulesCreated}, Paramètres=${parametresCreated}`);

        return {
            modules: modulesCreated,
            parametres: parametresCreated,
        };
    }

    /**
     * Seed des configurations de modules
     * @param etablissementId ID de l'établissement pour scopage (optionnel)
     * @param force Si true, force la réinitialisation même si la config existe
     */
    async seedConfigurationModules(etablissementId?: string, force: boolean = false): Promise<number> {
        let created = 0;
        let updated = 0;

        for (const moduleName of Object.values(ModuleName)) {
            const existing = await this.configModuleRepo.findOne({ 
                where: { 
                    moduleNom: moduleName,
                    ...(etablissementId ? { etablissementId } : { etablissementId: null as any })
                } 
            });
            
            if (existing && force) {
                // Forcer la réinitialisation
                const registryConfig = MODULE_REGISTRY[moduleName];
                if (!registryConfig) continue;

                const defaultValues = {
                    champsPersonnalises: [],
                    widgets: [],
                    parametres: registryConfig.defaultSettings || {},
                };

                Object.assign(existing, {
                    ...defaultValues,
                    valeurDefaut: defaultValues, // Sauvegarder les valeurs par défaut
                });
                await this.configModuleRepo.save(existing);
                updated++;
                continue;
            }
            
            if (existing) continue;

            const registryConfig = MODULE_REGISTRY[moduleName];
            if (!registryConfig) continue;

            const defaultValues = {
                champsPersonnalises: [],
                widgets: [],
                parametres: registryConfig.defaultSettings || {},
            };

            const config = this.configModuleRepo.create({
                moduleNom: moduleName,
                ...defaultValues,
                valeurDefaut: defaultValues,
                ...(etablissementId ? { etablissementId } : {}),
            });

            await this.configModuleRepo.save(config);
            created++;
        }

        logger.info(`✅ ${created} configurations de modules créées, ${updated} réinitialisées (force)`);
        return created + updated;
    }

    /**
     * Seed des paramètres système
     * @param force Si true, force la réinitialisation même si le paramètre existe
     */
    async seedParametresSysteme(etablissementId?: string, force: boolean = false): Promise<number> {
        const defaults = this.getAllDefaultParametres();
        let created = 0;
        let updated = 0;

        for (const param of defaults) {
            const existing = await this.parametreRepo.findOne({ 
                where: { 
                    cle: param.cle,
                    ...(etablissementId ? { etablissementId } : { etablissementId: null as any })
                } 
            });
            
            if (existing && force) {
                // Forcer la réinitialisation vers la valeur par défaut
                existing.valeur = JSON.stringify(param.valeur);
                existing.valeurDefaut = JSON.stringify(param.valeur);
                existing.typeValeur = param.typeValeur;
                existing.categorie = param.categorie;
                existing.module = param.module;
                existing.description = param.description;
                existing.modifiableRuntime = param.modifiableRuntime;
                existing.visible = param.visible;
                existing.ordre = param.ordre;
                existing.options = param.options;
                
                await this.parametreRepo.save(existing);
                updated++;
                continue;
            }
            
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
                ...(etablissementId ? { etablissementId } : {}),
            });

            await this.parametreRepo.save(entity);
            created++;
        }

        logger.info(`✅ ${created} paramètres système créés, ${updated} réinitialisés (force)`);
        return created + updated;
    }

    /**
     * Tous les paramètres par défaut
     */
    private getAllDefaultParametres(): ParametreDefaut[] {
        return [
            // ============ SÉCURITÉ (auth) ============
            { cle: 'auth.session_duration', valeur: 1440, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Durée de session en minutes (24h par défaut)', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'auth.max_login_attempts', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Nombre max de tentatives de connexion', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'auth.lockout_duration', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Durée de blocage après échecs (minutes)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'auth.require_2fa', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger l\'authentification 2FA', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'auth.password_min_length', valeur: 8, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Longueur minimale du mot de passe', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'auth.password_require_uppercase', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger une majuscule', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'auth.password_require_number', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger un chiffre', modifiableRuntime: true, visible: true, ordre: 7 },
            { cle: 'auth.password_require_lowercase', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger au moins une lettre minuscule', modifiableRuntime: true, visible: true, ordre: 8 },
            { cle: 'auth.password_require_special', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger au moins un caractère spécial (!@#$%^&*)', modifiableRuntime: true, visible: true, ordre: 9 },
            { cle: 'auth.password_history_count', valeur: 3, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Nombre de mots de passe conservés dans l\'historique (0-12, 0 = désactivé)', modifiableRuntime: true, visible: true, ordre: 10 },
            { cle: 'auth.password_expiry_days', valeur: 0, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Expiration du mot de passe en jours (0 = jamais expirer)', modifiableRuntime: true, visible: true, ordre: 11 },

            // ============ SÉCURITÉ AVANCÉE ============
            { cle: 'auth.require_email_verification', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Exiger la vérification de l\'email avant connexion', modifiableRuntime: true, visible: true, ordre: 12 },
            { cle: 'auth.allow_self_registration', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Autoriser l\'auto-inscription des utilisateurs', modifiableRuntime: true, visible: true, ordre: 13 },
            { cle: 'auth.inactivity_timeout', valeur: 30, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Délai d\'inactivité avant déconnexion automatique (minutes)', modifiableRuntime: true, visible: true, ordre: 14 },
            { cle: 'auth.ip_whitelist', valeur: '', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Liste blanche d\'adresses IP autorisées (séparées par des virgules, vide = toutes autorisées)', modifiableRuntime: true, visible: true, ordre: 15 },
            { cle: 'auth.log_sensitive_actions', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Journaliser toutes les actions sensibles dans l\'audit trail', modifiableRuntime: true, visible: true, ordre: 16 },

            // ============ PROTECTION & MONITORING ============
            { cle: 'auth.brute_force_protection', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Activer la protection contre les attaques par force brute', modifiableRuntime: true, visible: true, ordre: 17 },
            { cle: 'auth.rate_limiting', valeur: 'medium', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Niveau de limitation du débit des requêtes', modifiableRuntime: true, visible: true, ordre: 18, options: [{ value: 'low', label: 'Faible (100 req/min)' }, { value: 'medium', label: 'Moyen (50 req/min)' }, { value: 'high', label: 'Élevé (20 req/min)' }] },
            { cle: 'auth.security_email_alerts', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Envoyer des alertes par email pour les événements de sécurité critiques', modifiableRuntime: true, visible: true, ordre: 19 },
            { cle: 'auth.suspicious_activity_notifications', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SECURITE, module: 'auth', description: 'Notifier les utilisateurs en cas d\'activité suspecte sur leur compte', modifiableRuntime: true, visible: true, ordre: 20 },

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
            // @reserved — clé non branchée pour l'instant (aucun consommateur runtime)
            { cle: 'notes.auto_notify_on_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: '[Réservé] Notifier les parents après validation', modifiableRuntime: true, visible: true, ordre: 7 },
            { cle: 'notes.parent_voir_validees', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'notes', description: 'Autoriser les parents à voir les notes validées (non publiées)', modifiableRuntime: true, visible: true, ordre: 8 },

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
            // @reserved — clé non branchée pour l'instant (aucun consommateur runtime)
            { cle: 'bulletins.validation_threshold', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'bulletins', description: '[Réservé] Seuil de validation (/20)', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'bulletins.calculation_method', valeur: 'ponderee', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Méthode de calcul', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'bulletins.display_coefficients', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Afficher les coefficients', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'bulletins.template_id', valeur: 'default', typeValeur: TypeValeurParametre.STRING, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Template par défaut', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'bulletins.require_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Validation obligatoire des bulletins (workflow)', modifiableRuntime: true, visible: true, ordre: 7 },
            { cle: 'bulletins.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Niveaux de validation', modifiableRuntime: true, visible: true, ordre: 8 },
            { cle: 'bulletins.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Rôles requis par niveau', modifiableRuntime: true, visible: true, ordre: 9 },
            // Clé legacy lue en fallback par bulletins.service (requireValidation) quand bulletins.require_validation est absente
            { cle: 'bulletins.validation_workflow', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'bulletins', description: 'Ancienne clé de workflow de validation (fallback de bulletins.require_validation)', modifiableRuntime: true, visible: false, ordre: 10 },

            // ============ GAMIFICATION ============
            { cle: 'gamification.points_attendance', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Points par présence journalière', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'gamification.points_good_grade', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Points pour bonne note (≥80%)', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'gamification.enable_leaderboard', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Activer le leaderboard', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'gamification.anonymize_ranking', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Anonymiser le classement', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'gamification.auto_attendance', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Attribution automatique des points d\'assiduité (cron job)', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'gamification.auto_notes', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Attribution automatique des points pour bonnes notes', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'gamification.seuil_bonne_note', valeur: 0.8, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'gamification', description: 'Seuil pour bonne note (80% du barème)', modifiableRuntime: true, visible: true, ordre: 7 },

            // ============ PROGRAMMES PÉDAGOGIQUES ============
            { cle: 'programmes.actif', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Activer le module programmes pédagogiques', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'programmes.enable_gamification', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Activer la gamification pour les enseignants (points/badges)', modifiableRuntime: true, visible: true, ordre: 2 },
            // @reserved — clé non branchée pour l'instant (aucun consommateur runtime)
            { cle: 'programmes.auto_calcul_progression', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'programmes', description: '[Réservé] Calcul automatique de la progression à partir des chapitres validés', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'programmes.seuil_conformite', valeur: 90, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Seuil de conformité programme (%) pour badge "programme conforme"', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'programmes.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Validation obligatoire des chapitres créés', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'programmes.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Niveaux de validation des chapitres', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'programmes.validation_roles', valeur: JSON.stringify({ '1': 'ENSEIGNANT', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 7 },
            // Clés lues par correlation-programme.service (préfixe singulier « programme. » — ne pas renommer)
            { cle: 'programme.ecart_acceptable_progression', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Écart acceptable (%) entre progression programme et progression attendue', modifiableRuntime: true, visible: true, ordre: 8 },
            { cle: 'programme.gamification_enseignants_actif', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'programmes', description: 'Activer les points/badges enseignants liés à la progression des programmes', modifiableRuntime: true, visible: true, ordre: 9 },

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
            { cle: 'periodes.cloture_verify_notes', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Vérifier la présence de notes avant la clôture (avertissement)', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'periodes.cloture_verify_bulletins', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Vérifier la présence de bulletins avant la clôture (avertissement)', modifiableRuntime: true, visible: true, ordre: 5 },
            { cle: 'periodes.cloture_block_pending_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Bloquer la clôture si des notes sont en attente de validation', modifiableRuntime: true, visible: true, ordre: 6 },
            { cle: 'periodes.lock_on_cloture', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Verrouiller toutes les saisies après la clôture de la période', modifiableRuntime: true, visible: true, ordre: 7 },
            { cle: 'periodes.niveau_affichage_courant', valeur: 1, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'periodes', description: 'Niveau hiérarchique à afficher comme période en cours dans le sidebar (0=Évaluation, 1=Trimestre, 2=Semestre, 3=Année)', modifiableRuntime: true, visible: true, ordre: 8 },

            // ============ ÉLÈVES ============
            { cle: 'eleves.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Validation obligatoire des inscriptions d\'élèves', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'eleves.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Niveaux de validation des inscriptions', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'eleves.validation_roles', valeur: JSON.stringify({ '1': 'PERSONNEL', '2': 'CHEF_ETABLISSEMENT', '3': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'eleves', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },

            // ============ PERSONNEL ============
            { cle: 'personnel.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Validation obligatoire des embauches de personnel', modifiableRuntime: true, visible: true, ordre: 1 },
            { cle: 'personnel.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Niveaux de validation des embauches', modifiableRuntime: true, visible: true, ordre: 2 },
            { cle: 'personnel.validation_roles', valeur: JSON.stringify({ '1': 'CHEF_ETABLISSEMENT', '2': 'ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Rôles requis par niveau de validation', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'personnel.contrat_require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Validation obligatoire des contrats de personnel', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'personnel.paie.require_validation', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'personnel', description: 'Validation obligatoire des bulletins de paie', modifiableRuntime: true, visible: true, ordre: 5 },

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
            { cle: 'annees_scolaires.cloture_check_periodes', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Vérifier que toutes les périodes sont fermées avant la clôture', modifiableRuntime: true, visible: true, ordre: 10 },
            { cle: 'annees_scolaires.cloture_check_notes', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Vérifier que toutes les notes sont saisies avant la clôture', modifiableRuntime: true, visible: true, ordre: 11 },
            { cle: 'annees_scolaires.cloture_check_bulletins', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'annees-scolaires', description: 'Vérifier que tous les bulletins sont générés avant la clôture', modifiableRuntime: true, visible: true, ordre: 12 },

            // ============ ÉTABLISSEMENT ============
            { cle: 'etablissement.require_validation', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Validation obligatoire des créations/désactivations d\'établissement', modifiableRuntime: true, visible: true, ordre: 3 },
            { cle: 'etablissement.validation_levels', valeur: 2, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Niveaux de validation des établissements', modifiableRuntime: true, visible: true, ordre: 4 },
            { cle: 'etablissement.validation_roles', valeur: JSON.stringify({ '1': 'ADMIN', '2': 'SUPER_ADMIN' }), typeValeur: TypeValeurParametre.JSON, categorie: CategorieParametre.MODULE, module: 'etablissement', description: 'Rôles requis par niveau de validation des établissements', modifiableRuntime: true, visible: true, ordre: 5 },

            // ============ SUIVI-ÉLÈVES - GAMIFICATION ============
            { cle: 'suivi-eleves.gamification.actif', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-eleves', description: 'Activer la gamification dans le suivi-élèves', modifiableRuntime: true, visible: true, ordre: 10 },
            { cle: 'suivi-eleves.gamification.points_felicitations', valeur: 10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-eleves', description: 'Points pour une félicitation', modifiableRuntime: true, visible: true, ordre: 11 },
            { cle: 'suivi-eleves.gamification.points_observation_positive', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-eleves', description: 'Points pour observation positive', modifiableRuntime: true, visible: true, ordre: 12 },
            { cle: 'suivi-eleves.gamification.points_observation_negative', valeur: -5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-eleves', description: 'Points pour observation négative', modifiableRuntime: true, visible: true, ordre: 13 },

            // ============ SUIVI-PERSONNEL - GAMIFICATION ============
            { cle: 'suivi-personnel.gamification.actif', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Activer la gamification dans le suivi-personnel', modifiableRuntime: true, visible: true, ordre: 10 },
            { cle: 'suivi-personnel.gamification.points_evaluation_positive', valeur: 20, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour évaluation positive du personnel', modifiableRuntime: true, visible: true, ordre: 11 },
            { cle: 'suivi-personnel.gamification.seuil_evaluation_positive', valeur: 15, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Seuil de note pour évaluation positive (/20)', modifiableRuntime: true, visible: true, ordre: 12 },
            { cle: 'suivi-personnel.gamification.points_assiduite', valeur: 5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points d\'assiduité pour le personnel', modifiableRuntime: true, visible: true, ordre: 13 },

            // ============ SUIVI-PERSONNEL - SCORING ============
            { cle: 'scoring-personnel.actif', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Activer le système de scoring du personnel', modifiableRuntime: true, visible: true, ordre: 20 },
            { cle: 'scoring-personnel.auto_recalcul_quotidien', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Recalcul automatique quotidien des scores', modifiableRuntime: true, visible: true, ordre: 21 },
            { cle: 'scoring-personnel.auto_classement', valeur: true, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Mise à jour automatique des classements', modifiableRuntime: true, visible: true, ordre: 22 },
            { cle: 'scoring-personnel.reset_mensuel', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Reset mensuel des scores', modifiableRuntime: true, visible: true, ordre: 23 },
            { cle: 'scoring-personnel.nettoyage_historique', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Nettoyage automatique de l\'historique (> 1 an)', modifiableRuntime: true, visible: true, ordre: 24 },
            { cle: 'scoring-personnel.ponderation_assiduite', valeur: 0.25, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Pondération score assiduité (0-1)', modifiableRuntime: true, visible: true, ordre: 25 },
            { cle: 'scoring-personnel.ponderation_comportement', valeur: 0.25, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Pondération score comportement (0-1)', modifiableRuntime: true, visible: true, ordre: 26 },
            { cle: 'scoring-personnel.ponderation_performance', valeur: 0.30, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Pondération score performance (0-1)', modifiableRuntime: true, visible: true, ordre: 27 },
            { cle: 'scoring-personnel.ponderation_pedagogie', valeur: 0.20, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Pondération score pédagogie (0-1)', modifiableRuntime: true, visible: true, ordre: 28 },
            { cle: 'scoring-personnel.points_incident_mineur', valeur: -5, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour incident mineur', modifiableRuntime: true, visible: true, ordre: 29 },
            { cle: 'scoring-personnel.points_incident_modere', valeur: -10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour incident modéré', modifiableRuntime: true, visible: true, ordre: 30 },
            { cle: 'scoring-personnel.points_incident_grave', valeur: -20, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour incident grave', modifiableRuntime: true, visible: true, ordre: 31 },
            { cle: 'scoring-personnel.points_incident_tres_grave', valeur: -40, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour incident très grave', modifiableRuntime: true, visible: true, ordre: 32 },
            { cle: 'scoring-personnel.points_absence_non_justifiee', valeur: -10, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour absence non justifiée', modifiableRuntime: true, visible: true, ordre: 33 },
            { cle: 'scoring-personnel.points_retard', valeur: -3, typeValeur: TypeValeurParametre.NUMBER, categorie: CategorieParametre.MODULE, module: 'suivi-personnel', description: 'Points pour retard', modifiableRuntime: true, visible: true, ordre: 34 },

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

            // ============ MODULES - ÉTAT ACTIF ============
            // Paramètres pour permettre getParamBoolean('{module}.actif')
            ...Object.entries(MODULE_REGISTRY).map(([moduleName, config], index) => ({
                cle: `${moduleName}.actif`,
                valeur: config.defaultActive,
                typeValeur: TypeValeurParametre.BOOLEAN,
                categorie: CategorieParametre.MODULE,
                module: moduleName,
                description: `Module ${config.label} actif`,
                modifiableRuntime: true,
                visible: true,
                ordre: 100 + index,
            })),
            { cle: 'system.maintenance_mode', valeur: false, typeValeur: TypeValeurParametre.BOOLEAN, categorie: CategorieParametre.SYSTEME, description: 'Mode maintenance', modifiableRuntime: true, visible: true, ordre: 3 },
        ];
    }
}

export const configurationSeedService = new ConfigurationSeedService();
export default ConfigurationSeedService;
