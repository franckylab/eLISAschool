/**
 * ==================================
 * eLISAschool - Service Notifications v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Notification, TypeNotification, StatutNotification } from '../entities';
import { CreateNotificationDto, CreateBulkNotificationDto, QueryNotificationsDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParam } from '@modules/configuration/utils/config.helper';

/**
 * Service de gestion des notifications avec configuration centralisée
 */
export class NotificationsService {
    private notificationRepository: Repository<Notification>;

    constructor() {
        this.notificationRepository = AppDataSource.getRepository(Notification);
    }

    /**
     * Récupère les paramètres notifications depuis la configuration
     */
    private async getNotificationsParams() {
        return {
            enablePush: await getParamBoolean('notifications.enable_push', true),
            enableEmail: await getParamBoolean('notifications.enable_email', true),
            enableSms: await getParamBoolean('notifications.enable_sms', false),
            defaultChannel: await getParam<string>('notifications.default_channel', 'IN_APP'),
        };
    }

    /**
     * Créer une notification
     */
    async create(createDto: CreateNotificationDto, expediteurId?: string): Promise<Notification> {
        const params = await this.getNotificationsParams();

        // Si type non spécifié, utiliser le canal par défaut configuré
        const type = createDto.type || params.defaultChannel as TypeNotification;

        // Vérifier si le canal est activé
        if (type === TypeNotification.PUSH && !params.enablePush) {
            throw new AppError('Les notifications push sont désactivées', 400, 'PUSH_DISABLED');
        }
        if (type === TypeNotification.EMAIL && !params.enableEmail) {
            throw new AppError('Les notifications email sont désactivées', 400, 'EMAIL_DISABLED');
        }
        if (type === TypeNotification.SMS && !params.enableSms) {
            throw new AppError('Les notifications SMS sont désactivées', 400, 'SMS_DISABLED');
        }

        const notification = this.notificationRepository.create({
            ...createDto,
            type,
            expediteurId,
            statut: StatutNotification.EN_ATTENTE,
        });

        await this.notificationRepository.save(notification);

        // Envoyer immédiatement si non programmée
        if (!createDto.programmeePour) {
            await this.envoyerNotification(notification);
        }

        logger.info(`Notification créée pour ${createDto.destinataireId} (type: ${type})`);
        return notification;
    }

    /**
     * Créer des notifications en masse
     */
    async createBulk(createDto: CreateBulkNotificationDto, expediteurId?: string): Promise<number> {
        const params = await this.getNotificationsParams();
        const type = (createDto.type || params.defaultChannel) as TypeNotification;

        const notifications = createDto.destinatairesIds.map((destinataireId) =>
            this.notificationRepository.create({
                destinataireId,
                titre: createDto.titre,
                contenu: createDto.contenu,
                type,
                priorite: createDto.priorite as any,
                categorie: createDto.categorie,
                expediteurId,
                statut: StatutNotification.EN_ATTENTE,
            })
        );

        await this.notificationRepository.save(notifications);

        // Envoyer toutes les notifications
        for (const notification of notifications) {
            await this.envoyerNotification(notification);
        }

        logger.info(`${notifications.length} notifications créées en masse`);
        return notifications.length;
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    async findByUser(
        utilisateurId: string,
        query: QueryNotificationsDto
    ): Promise<{ items: Notification[]; total: number }> {
        const { page, limit, statut, type, categorie, nonLues } = query;

        const where: FindOptionsWhere<Notification> = { destinataireId: utilisateurId };

        if (statut) where.statut = statut as StatutNotification;
        if (type) where.type = type as TypeNotification;
        if (categorie) where.categorie = categorie;
        if (nonLues) where.statut = StatutNotification.ENVOYEE;

        const [items, total] = await this.notificationRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    /**
     * Marquer une notification comme lue
     */
    async markAsRead(id: string, utilisateurId: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id, destinataireId: utilisateurId },
        });

        if (!notification) {
            throw new AppError('Notification non trouvée', 404, 'NOTIFICATION_NOT_FOUND');
        }

        notification.statut = StatutNotification.LUE;
        notification.lueAt = new Date();

        await this.notificationRepository.save(notification);
        return notification;
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    async markAllAsRead(utilisateurId: string): Promise<number> {
        const result = await this.notificationRepository.update(
            { destinataireId: utilisateurId, statut: StatutNotification.ENVOYEE },
            { statut: StatutNotification.LUE, lueAt: new Date() }
        );

        logger.info(`${result.affected} notifications marquées comme lues pour ${utilisateurId}`);
        return result.affected || 0;
    }

    /**
     * Supprimer une notification
     */
    async remove(id: string, utilisateurId: string): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: { id, destinataireId: utilisateurId },
        });

        if (!notification) {
            throw new AppError('Notification non trouvée', 404, 'NOTIFICATION_NOT_FOUND');
        }

        await this.notificationRepository.remove(notification);
    }

    /**
     * Compter les notifications non lues
     */
    async countUnread(utilisateurId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { destinataireId: utilisateurId, statut: StatutNotification.ENVOYEE },
        });
    }

    /**
     * Envoyer une notification selon le type et la configuration
     */
    private async envoyerNotification(notification: Notification): Promise<void> {
        const params = await this.getNotificationsParams();

        try {
            switch (notification.type) {
                case TypeNotification.EMAIL:
                    if (params.enableEmail) {
                        await this.sendEmail(notification);
                    }
                    break;
                case TypeNotification.PUSH:
                    if (params.enablePush) {
                        await this.sendPush(notification);
                    }
                    break;
                case TypeNotification.SMS:
                    if (params.enableSms) {
                        await this.sendSms(notification);
                    }
                    break;
                case TypeNotification.IN_APP:
                default:
                    // In-app: juste mettre à jour le statut
                    break;
            }

            notification.statut = StatutNotification.ENVOYEE;
            notification.envoyeeAt = new Date();
            await this.notificationRepository.save(notification);
        } catch (error) {
            notification.statut = StatutNotification.ECHEC;
            await this.notificationRepository.save(notification);
            logger.error(`Échec envoi notification ${notification.id}`, error);
        }
    }

    /**
     * Envoyer un email
     */
    private async sendEmail(notification: Notification): Promise<void> {
        // TODO: Implémenter avec Nodemailer ou autre service email
        logger.info(`Email envoyé: ${notification.titre} -> ${notification.destinataireId}`);
    }

    /**
     * Envoyer une notification push
     */
    private async sendPush(notification: Notification): Promise<void> {
        // TODO: Implémenter avec Firebase FCM ou autre service push
        logger.info(`Push envoyé: ${notification.titre} -> ${notification.destinataireId}`);
    }

    /**
     * Envoyer un SMS
     */
    private async sendSms(notification: Notification): Promise<void> {
        // TODO: Implémenter avec Twilio ou autre service SMS
        logger.info(`SMS envoyé: ${notification.titre} -> ${notification.destinataireId}`);
    }

    /**
     * Traiter les notifications programmées
     */
    async processScheduledNotifications(): Promise<number> {
        const now = new Date();
        const notifications = await this.notificationRepository.find({
            where: {
                statut: StatutNotification.EN_ATTENTE,
                programmeePour: now,
            },
        });

        for (const notification of notifications) {
            await this.envoyerNotification(notification);
        }

        return notifications.length;
    }
}

export const notificationsService = new NotificationsService();
export default NotificationsService;
