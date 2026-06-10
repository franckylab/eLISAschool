/**
 * ==================================
 * eLISAschool - Service Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * CRUD pour la gestion des providers de notifications
 */

import { Repository, FindOptionsWhere, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NotificationProvider, ServiceNotification, TypeNotification } from '../entities';
import {
    CreateNotificationProviderDto,
    UpdateNotificationProviderDto,
    QueryNotificationProvidersDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { providerRegistry } from '../providers/provider-registry';
import { EmailProvider, SmsProvider, PushProvider, InAppProvider } from '../providers';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Service de gestion des providers de notifications avec cache optimisé
 */
export class NotificationProviderService {
    private repo: Repository<NotificationProvider>;
    
    // Cache optimisé pour les providers
    private cache = new Map<string, NotificationProvider>();
    private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
    private cacheTimestamp = new Map<string, number>();

    constructor() {
        this.repo = AppDataSource.getRepository(NotificationProvider);
    }

    /**
     * Créer un nouveau provider
     */
    async create(dto: CreateNotificationProviderDto): Promise<NotificationProvider> {
        // Vérifier l'unicité du nom pour ce type
        const existing = await this.repo.findOne({
            where: { nom: dto.nom, type: dto.type as TypeNotification },
        });

        if (existing) {
            throw new AppError(
                `Un provider '${dto.nom}' existe déjà pour le type ${dto.type}`,
                409,
                'PROVIDER_EXISTS'
            );
        }

        // Si estDefaut = true, désactiver les autres providers par défaut de ce type
        if (dto.estDefaut) {
            await this.repo.update(
                { type: dto.type as TypeNotification, estDefaut: true },
                { estDefaut: false }
            );
        }

        const provider = this.repo.create({
            ...dto,
            type: dto.type as TypeNotification,
            service: dto.service as ServiceNotification,
        });

        await this.repo.save(provider);

        // Enregistrer dans le registry
        this.registerInRegistry(provider);
        
        // Invalider le cache
        this.invalidateCache(provider.type);
        
        // Audit trail
        try {
            await auditService.log({
                action: AuditAction.NOTIFICATION_PROVIDER_CREATE,
                cible: 'NotificationProvider',
                cibleId: provider.id,
                description: `Création provider ${provider.nom} (${provider.type})`,
                nouvellesValeurs: { nom: provider.nom, type: provider.type, service: provider.service },
                module: 'notifications',
            });
        } catch (error) {
            logger.warn(`[ProviderService] Échec audit create (non bloquant)`, error);
        }

        logger.info(`[ProviderService] Provider créé: ${provider.nom} (${provider.type})`);
        return provider;
    }

    /**
     * Récupérer tous les providers avec filtrage multi-tenant
     */
    async findAll(query: QueryNotificationProvidersDto, etablissementId?: string): Promise<{
        items: NotificationProvider[];
        total: number;
    }> {
        const { page, limit, type, service, actif } = query;

        const where: FindOptionsWhere<NotificationProvider> = {};

        // ✅ Filtrage multi-tenant : établissement OU global
        if (etablissementId) {
            where.etablissementId = In([etablissementId, null]);
        }

        if (type) where.type = type as TypeNotification;
        if (service) where.service = service as ServiceNotification;
        if (actif !== undefined) where.actif = actif;

        const [items, total] = await this.repo.findAndCount({
            where,
            order: { priorite: 'ASC', createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    /**
     * Récupérer un provider par ID avec validation multi-tenant
     */
    async findOne(id: string, etablissementId?: string): Promise<NotificationProvider> {
        const provider = await this.repo.findOne({ where: { id } });

        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }
        
        // ✅ Validation multi-tenant
        if (etablissementId && provider.etablissementId && provider.etablissementId !== etablissementId) {
            throw new AppError('Accès non autorisé à ce provider', 403, 'FORBIDDEN');
        }

        return provider;
    }

    /**
     * Mettre à jour un provider
     */
    async update(id: string, dto: UpdateNotificationProviderDto): Promise<NotificationProvider> {
        const provider = await this.findOne(id);

        // Si on change estDefaut
        if (dto.estDefaut === true) {
            await this.repo.update(
                { type: provider.type, estDefaut: true },
                { estDefaut: false }
            );
        }

        // Mettre à jour les champs
        Object.assign(provider, dto);

        // Si la configuration a changé, réinitialiser le provider dans le registry
        if (dto.configuration) {
            this.registerInRegistry(provider);
        }

        await this.repo.save(provider);
        
        // Invalider le cache
        this.invalidateCache(provider.type);
        
        // Audit trail
        try {
            await auditService.log({
                action: AuditAction.NOTIFICATION_PROVIDER_UPDATE,
                cible: 'NotificationProvider',
                cibleId: provider.id,
                description: `Modification provider ${provider.nom}`,
                nouvellesValeurs: dto,
                module: 'notifications',
            });
        } catch (error) {
            logger.warn(`[ProviderService] Échec audit update (non bloquant)`, error);
        }

        logger.info(`[ProviderService] Provider modifié: ${provider.nom}`);
        return provider;
    }

    /**
     * Supprimer un provider
     */
    async remove(id: string): Promise<void> {
        const provider = await this.findOne(id);

        // Empêcher la suppression du dernier provider d'un type
        const count = await this.repo.count({
            where: { type: provider.type, actif: true },
        });

        if (count <= 1) {
            throw new AppError(
                'Impossible de supprimer le dernier provider actif',
                400,
                'LAST_PROVIDER'
            );
        }

        // Retirer du registry
        providerRegistry.unregister(provider.type, provider.nom);
        
        // Invalider le cache
        this.invalidateCache(provider.type);
        
        // Audit trail
        try {
            await auditService.log({
                action: AuditAction.NOTIFICATION_PROVIDER_DELETE,
                cible: 'NotificationProvider',
                cibleId: provider.id,
                description: `Suppression provider ${provider.nom}`,
                module: 'notifications',
            });
        } catch (error) {
            logger.warn(`[ProviderService] Échec audit delete (non bloquant)`, error);
        }

        await this.repo.remove(provider);

        logger.info(`[ProviderService] Provider supprimé: ${provider.nom}`);
    }

    /**
     * Activer/désactiver un provider
     */
    async toggle(id: string): Promise<NotificationProvider> {
        const provider = await this.findOne(id);
        provider.actif = !provider.actif;

        await this.repo.save(provider);
        
        // Invalider le cache
        this.invalidateCache(provider.type);
        
        // Audit trail
        try {
            await auditService.log({
                action: AuditAction.NOTIFICATION_PROVIDER_TOGGLE,
                cible: 'NotificationProvider',
                cibleId: provider.id,
                description: `Provider ${provider.nom} ${provider.actif ? 'activé' : 'désactivé'}`,
                module: 'notifications',
            });
        } catch (error) {
            logger.warn(`[ProviderService] Échec audit toggle (non bloquant)`, error);
        }

        if (provider.actif) {
            this.registerInRegistry(provider);
        } else {
            providerRegistry.unregister(provider.type, provider.nom);
        }

        logger.info(
            `[ProviderService] Provider ${provider.actif ? 'activé' : 'désactivé'}: ${provider.nom}`
        );
        return provider;
    }

    /**
     * Définir un provider comme défaut
     */
    async setDefault(id: string): Promise<NotificationProvider> {
        const provider = await this.findOne(id);

        // Désactiver les autres providers par défaut de ce type
        await this.repo.update(
            { type: provider.type, estDefaut: true },
            { estDefaut: false }
        );

        provider.estDefaut = true;
        await this.repo.save(provider);
        
        // Invalider le cache
        this.invalidateCache(provider.type);
        
        // Audit trail
        try {
            await auditService.log({
                action: AuditAction.NOTIFICATION_PROVIDER_UPDATE,
                cible: 'NotificationProvider',
                cibleId: provider.id,
                description: `Provider ${provider.nom} défini par défaut`,
                module: 'notifications',
            });
        } catch (error) {
            logger.warn(`[ProviderService] Échec audit setDefault (non bloquant)`, error);
        }

        logger.info(`[ProviderService] Provider défini par défaut: ${provider.nom}`);
        return provider;
    }

    /**
     * Tester la configuration d'un provider
     */
    async testProvider(
        id: string,
        testConfig?: Record<string, any>
    ): Promise<{ succes: boolean; message: string }> {
        const provider = await this.findOne(id);

        const config = testConfig || provider.configuration;

        // Créer une instance temporaire du provider pour le test
        const providerInstance = this.createProviderInstance(provider);

        try {
            const succes = await providerInstance.testerConfiguration(config);

            if (succes) {
                // Réinitialiser les erreurs si le test réussit
                provider.resetErreurs();
                await this.repo.save(provider);

                return {
                    succes: true,
                    message: 'Configuration valide',
                };
            } else {
                provider.enregistrerErreur('Test de configuration échoué');
                await this.repo.save(provider);

                return {
                    succes: false,
                    message: 'Test de configuration échoué',
                };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            provider.enregistrerErreur(message);
            await this.repo.save(provider);

            return {
                succes: false,
                message,
            };
        }
    }

    /**
     * Récupérer le provider par défaut avec cache optimisé
     */
    async getDefaultProvider(type: TypeNotification, etablissementId?: string): Promise<NotificationProvider | null> {
        const cacheKey = `default:${type}:${etablissementId || 'global'}`;
        const cached = this.cache.get(cacheKey);
        const timestamp = this.cacheTimestamp.get(cacheKey);

        // Vérifier le cache
        if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
            logger.debug(`[ProviderService] Cache hit pour ${cacheKey}`);
            return cached;
        }

        // Cache miss → DB
        logger.debug(`[ProviderService] Cache miss pour ${cacheKey}`);
        const where: FindOptionsWhere<NotificationProvider> = {
            type,
            estDefaut: true,
            actif: true,
        };
        
        // Multi-tenant : établissement OU global
        if (etablissementId) {
            where.etablissementId = In([etablissementId, null]);
        }

        const provider = await this.repo.findOne({
            where,
            order: { priorite: 'ASC' },
        });

        if (provider) {
            this.cache.set(cacheKey, provider);
            this.cacheTimestamp.set(cacheKey, Date.now());
        }

        return provider;
    }

    /**
     * Invalider le cache après modification
     */
    private invalidateCache(type?: TypeNotification): void {
        if (!type) {
            // Invalider tout le cache
            this.cache.clear();
            this.cacheTimestamp.clear();
            logger.debug('[ProviderService] Cache entièrement invalidé');
        } else {
            // Invalider uniquement le type concerné
            const keysToDelete: string[] = [];
            this.cache.forEach((_, key) => {
                if (key.includes(type)) {
                    keysToDelete.push(key);
                }
            });
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                this.cacheTimestamp.delete(key);
            });
            logger.debug(`[ProviderService] Cache invalidé pour ${type}`);
        }
    }

    /**
     * Réinitialiser les quotas journaliers (appelé par un cron job)
     */
    async resetDailyQuotas(): Promise<number> {
        const result = await this.repo.update({}, { quotaUtilise: 0 });
        logger.info(`[ProviderService] Quotas journaliers réinitialisés (${result.affected} providers)`);
        return result.affected || 0;
    }

    /**
     * Créer une instance de provider selon le service
     */
    private createProviderInstance(provider: NotificationProvider) {
        switch (provider.service) {
            case ServiceNotification.NODEMAILER:
            case ServiceNotification.SENDGRID:
            case ServiceNotification.MAILGUN:
            case ServiceNotification.AWS_SES:
                return new EmailProvider(provider.nom);

            case ServiceNotification.TWILIO:
            case ServiceNotification.VONAGE:
            case ServiceNotification.AFRICAS_TALKING:
            case ServiceNotification.OVH_SMS:
                return new SmsProvider(provider.nom);

            case ServiceNotification.FIREBASE_FCM:
            case ServiceNotification.ONESIGNAL:
                return new PushProvider(provider.nom);

            case ServiceNotification.IN_APP:
                return new InAppProvider();

            default:
                throw new AppError(`Service non supporté: ${provider.service}`, 400, 'UNSUPPORTED_SERVICE');
        }
    }

    /**
     * Enregistrer un provider dans le registry
     */
    private registerInRegistry(provider: NotificationProvider): void {
        if (!provider.actif) return;

        try {
            const providerInstance = this.createProviderInstance(provider);
            providerInstance.initialiser(provider.configuration);

            if (providerInstance.estConfiguré()) {
                providerRegistry.register(providerInstance);
                logger.debug(`[ProviderService] Provider enregistré dans le registry: ${provider.nom}`);
            } else {
                logger.warn(`[ProviderService] Provider non configuré, non enregistré: ${provider.nom}`);
            }
        } catch (error) {
            logger.error(
                `[ProviderService] Erreur lors de l'enregistrement du provider ${provider.nom}`,
                error
            );
        }
    }

    /**
     * Charger tous les providers actifs en mémoire au démarrage
     */
    async loadActiveProviders(): Promise<number> {
        const activeProviders = await this.repo.find({
            where: { actif: true },
            order: { priorite: 'ASC' },
        });

        let count = 0;
        for (const provider of activeProviders) {
            try {
                this.registerInRegistry(provider);
                count++;
            } catch (error) {
                logger.error(
                    `[ProviderService] Erreur chargement provider ${provider.nom}`,
                    error
                );
            }
        }

        logger.info(`[ProviderService] ${count} providers chargés en mémoire`);
        return count;
    }

    /**
     * Obtenir les données de monitoring pour le dashboard
     */
    async getMonitoring(etablissementId?: string): Promise<{
        providers: Array<{
            id: string;
            nom: string;
            type: string;
            service: string;
            actif: boolean;
            estDefaut: boolean;
            quotaUtilise: number;
            quotaTotal: number;
            quotaPourcentage: number;
            erreursConsecutives: number;
            priorite: number;
            statut: 'OK' | 'ATTENTION' | 'CRITIQUE';
            derniereActivite?: Date;
        }>;
        statistiquesGlobales: {
            totalProviders: number;
            providersActifs: number;
            providersEnErreur: number;
            totalQuotaUtilise: number;
            totalQuotaDisponible: number;
        };
    }> {
        const where: FindOptionsWhere<NotificationProvider> = {};
        
        // Multi-tenant
        if (etablissementId) {
            where.etablissementId = In([etablissementId, null]);
        }

        const providers = await this.repo.find({
            where,
            order: { priorite: 'ASC', createdAt: 'DESC' },
        });

        const providersMonitoring = providers.map(p => {
            const quotaPourcentage = p.quotaJournalier > 0 
                ? Math.round((p.quotaUtilise / p.quotaJournalier) * 100)
                : 0;

            let statut: 'OK' | 'ATTENTION' | 'CRITIQUE' = 'OK';
            if (p.erreursConsecutives >= 5) {
                statut = 'CRITIQUE';
            } else if (p.erreursConsecutives >= 3) {
                statut = 'ATTENTION';
            }

            return {
                id: p.id,
                nom: p.nom,
                type: p.type,
                service: p.service,
                actif: p.actif,
                estDefaut: p.estDefaut,
                quotaUtilise: p.quotaUtilise,
                quotaTotal: p.quotaJournalier,
                quotaPourcentage,
                erreursConsecutives: p.erreursConsecutives,
                priorite: p.priorite,
                statut,
                derniereActivite: p.derniereErreurAt || p.updatedAt,
            };
        });

        // Statistiques globales
        const totalProviders = providers.length;
        const providersActifs = providers.filter(p => p.actif).length;
        const providersEnErreur = providers.filter(p => p.erreursConsecutives >= 3).length;
        const totalQuotaUtilise = providers.reduce((sum, p) => sum + p.quotaUtilise, 0);
        const totalQuotaDisponible = providers.reduce((sum, p) => sum + (p.quotaJournalier > 0 ? p.quotaJournalier : 0), 0);

        return {
            providers: providersMonitoring,
            statistiquesGlobales: {
                totalProviders,
                providersActifs,
                providersEnErreur,
                totalQuotaUtilise,
                totalQuotaDisponible,
            },
        };
    }
}

export const notificationProviderService = new NotificationProviderService();
export default NotificationProviderService;
