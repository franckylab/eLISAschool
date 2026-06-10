/**
 * ==================================
 * eLISAschool - Service Mentions Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Message, MessageMention } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { notificationTemplates } from '@modules/notifications/services/notification-templates.service';
import { messagerieSSEService } from './messagerie-sse.service';

export class MessageMentionService {
    private mentionRepo: Repository<MessageMention>;

    constructor() {
        this.mentionRepo = AppDataSource.getRepository(MessageMention);
    }

    /**
     * Traiter les mentions d'un message
     */
    async processMentions(
        message: Message,
        mentions: Array<{ userId: string; position: number }>
    ): Promise<MessageMention[]> {
        const created: MessageMention[] = [];

        for (const mention of mentions) {
            // Vérifier si la mention existe déjà
            const existing = await this.mentionRepo.findOne({
                where: { messageId: message.id, mentionneId: mention.userId },
            });

            if (!existing) {
                const mentionEntity = this.mentionRepo.create({
                    messageId: message.id,
                    mentionneId: mention.userId,
                    lu: false,
                });
                await this.mentionRepo.save(mentionEntity);
                created.push(mentionEntity);

                // Notification In-App NON-BLOQUANTE
                try {
                    await notificationTemplates.mentionMessage(
                        {
                            destinataireId: mention.userId,
                            etablissementId: message.etablissementId,
                            metadata: {
                                messageId: message.id,
                                conversationId: message.conversationId,
                                expediteurId: message.expediteurId,
                            },
                        },
                        {
                            expediteurNom: 'Un contact',
                            message: message.contenu.substring(0, 100),
                            conversation: 'Conversation',
                        }
                    );
                } catch (error) {
                    logger.warn(`[Mentions] Échec notification`, error);
                }

                // SSE broadcast
                await messagerieSSEService.sendToUser(mention.userId, 'mention:new', {
                    messageId: message.id,
                    conversationId: message.conversationId,
                });
            }
        }

        logger.info(`${created.length} mentions traitées pour message ${message.id}`);
        return created;
    }

    /**
     * Récupérer les mentions non lues d'un utilisateur
     */
    async getUnreadMentions(
        utilisateurId: string,
        etablissementId: string
    ): Promise<MessageMention[]> {
        return this.mentionRepo.find({
            where: { mentionneId: utilisateurId, lu: false },
            relations: ['message', 'message.expediteur', 'message.conversation'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Marquer une mention comme lue
     */
    async markMentionAsRead(
        mentionId: string,
        utilisateurId: string
    ): Promise<void> {
        const mention = await this.mentionRepo.findOne({
            where: { id: mentionId, mentionneId: utilisateurId },
        });
        if (!mention) {
            throw new AppError('Mention non trouvée', 404, 'NOT_FOUND');
        }

        mention.lu = true;
        await this.mentionRepo.save(mention);
    }
}

export const messageMentionService = new MessageMentionService();
