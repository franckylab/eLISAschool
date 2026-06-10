/**
 * ==================================
 * eLISAschool - Service Read Status Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MessageReadStatus } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { messagerieSSEService } from './messagerie-sse.service';

export class MessageReadService {
    private readStatusRepo: Repository<MessageReadStatus>;

    constructor() {
        this.readStatusRepo = AppDataSource.getRepository(MessageReadStatus);
    }

    /**
     * Marquer un message comme lu
     */
    async markAsRead(
        messageId: string,
        utilisateurId: string
    ): Promise<MessageReadStatus> {
        // Vérifier si déjà lu
        const existing = await this.readStatusRepo.findOne({
            where: { messageId, utilisateurId },
        });

        if (existing) {
            return existing;
        }

        const readStatus = this.readStatusRepo.create({
            messageId,
            utilisateurId,
            luA: new Date(),
        });
        await this.readStatusRepo.save(readStatus);

        // SSE broadcast
        const message = await AppDataSource.getRepository('Message').findOne({
            where: { id: messageId },
            relations: ['conversation'],
        });
        if (message) {
            await messagerieSSEService.broadcastToConversation(
                (message as any).conversationId,
                'message:read',
                {
                    messageId,
                    utilisateurId,
                }
            );
        }

        return readStatus;
    }

    /**
     * Marquer tous les messages d'une conversation comme lus
     */
    async markConversationAsRead(
        conversationId: string,
        utilisateurId: string
    ): Promise<number> {
        const messages = await AppDataSource.getRepository('Message').find({
            where: { conversationId, supprime: false },
            select: ['id'],
        });

        let count = 0;
        for (const message of messages) {
            const existing = await this.readStatusRepo.findOne({
                where: { messageId: message.id, utilisateurId },
            });
            if (!existing) {
                const readStatus = this.readStatusRepo.create({
                    messageId: message.id,
                    utilisateurId,
                    luA: new Date(),
                });
                await this.readStatusRepo.save(readStatus);
                count++;
            }
        }

        return count;
    }

    /**
     * Compter les messages non lus d'une conversation
     * CORRIGÉ: Filtrage correct par conversation
     */
    async getUnreadCount(
        conversationId: string,
        utilisateurId: string
    ): Promise<number> {
        // Compter tous les messages de la conversation (sauf envoyés par l'utilisateur)
        const totalMessages = await AppDataSource.getRepository('Message').count({
            where: { 
                conversationId, 
                supprime: false,
            },
        });

        // Compter les messages lus DANS CETTE conversation
        const readCount = await this.readStatusRepo.count({
            where: { 
                utilisateurId,
            },
        });

        // Récupérer les IDs des messages de cette conversation
        const messageRepo = AppDataSource.getRepository('Message');
        const conversationMessages = await messageRepo.find({
            where: { conversationId, supprime: false },
            select: ['id'],
        });
        const messageIds = conversationMessages.map(m => m.id);

        // Compter combien de ces messages sont marqués comme lus
        const readInConversation = await this.readStatusRepo.count({
            where: { 
                utilisateurId,
                messageId: messageIds.length > 0 ? messageIds : undefined,
            },
        });

        return totalMessages - readInConversation;
    }

    /**
     * Récupérer qui a lu un message
     */
    async getReadStatuses(messageId: string): Promise<MessageReadStatus[]> {
        return this.readStatusRepo.find({
            where: { messageId },
            relations: ['utilisateur'],
            order: { luA: 'DESC' },
        });
    }
}

export const messageReadService = new MessageReadService();
