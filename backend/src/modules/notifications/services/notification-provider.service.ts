/**
 * ==================================
 * eLISAschool - Service Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * CRUD pour la gestion des providers de notifications
 */

import { Repository, FindOptionsWhere } from 'typeorm';
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

/**
 * Service de gestion des providers de notifications
 */
export class NotificationProviderService {
    private repo: Repository<NotificationProvider>;

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

        logger.info(`[ProviderService] Provider créé: ${provider.nom} (${provider.type})`);
        return provider;
    }

    /**
     * Récupérer tous les providers
     */
    async findAll(query: QueryNotificationProvidersDto): Promise<{
        items: NotificationProvider[];
        total: number;
    }> {
        const { page, limit, type, service, actif, etablissementId } = query;

        const where: FindOptionsWhere<NotificationProvider> = {};

        if (type) where.type = type as TypeNotification;
        if (service) where.service = service as ServiceNotification;
        if (actif !== undefined) where.actif = actif;
        if (etablissementId) where.etablissementId = etablissementId;

        const [items, total] = await this.repo.findAndCount({
            where,
            order: { priorite: 'ASC', createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    /**
     * Récupérer un provider par ID
     */
    async findOne(id: string): Promise<NotificationProvider> {
        const provider = await this.repo.findOne({ where: { id } });

        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
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
}

export const notificationProviderService = new NotificationProviderService();
export default NotificationProviderService;
