/**
 * ==================================
 * eLISAschool - Service Messages Épinglés
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Permet d'épingler des messages importants en haut d'une conversation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Message, ParticipantConversation } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';
import { messagerieSSEService } from './messagerie-sse.service';

export class PinnedMessageService {
    private messageRepo: Repository<Message>;
    private participantRepo: Repository<ParticipantConversation>;
    private readonly PINNED_TTL = 30 * 24 * 60 * 60; // 30 jours

    constructor() {
        this.messageRepo = AppDataSource.getRepository(Message);
        this.participantRepo = AppDataSource.getRepository(ParticipantConversation);
    }

    /**
     * Épingler un message
     */
    async pinMessage(
        messageId: string,
        userId: string,
        etablissementId: string
    ): Promise<{
        messageId: string;
        conversationId: string;
        pinnedAt: string;
        pinnedBy: string;
    }> {
        // Récupérer le message
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['expediteur'],
        });

        if (!message) {
            throw new AppError('Message non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier que l'utilisateur est participant
        const participant = await this.participantRepo.findOne({
            where: {
                conversationId: message.conversationId,
                utilisateurId: userId,
            },
        });

        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        // Vérifier que le message n'est pas supprimé
        if (message.supprime) {
            throw new AppError('Impossible d\'épingler un message supprimé', 400, 'MESSAGE_DELETED');
        }

        // Vérifier les limites (max 10 messages épinglés par conversation)
        const pinnedCount = await this.getPinnedMessagesCount(message.conversationId);
        if (pinnedCount >= 10) {
            throw new AppError(
                'Maximum 10 messages épinglés par conversation',
                400,
                'MAX_PINNED_REACHED'
            );
        }

        // Épingler dans Redis
        const key = this.getPinnedKey(message.conversationId, messageId);
        const pinnedData = {
            messageId,
            conversationId: message.conversationId,
            userId,
            pinnedAt: new Date().toISOString(),
            ttl: this.PINNED_TTL,
        };

        await redisService.setJSON(key, pinnedData, this.PINNED_TTL);

        // SSE broadcast
        try {
            await messagerieSSEService.broadcastToConversation(
                message.conversationId,
                'message:pinned',
                {
                    messageId,
                    userId,
                    pinnedAt: pinnedData.pinnedAt,
                }
            );
        } catch (error) {
            logger.warn(`[Pinned] Échec SSE broadcast`, error);
        }

        logger.info(`Message ${messageId} épinglé par ${userId}`);

        return pinnedData;
    }

    /**
     * Détacher un message épinglé
     */
    async unpinMessage(
        messageId: string,
        userId: string
    ): Promise<void> {
        // Récupérer le message
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new AppError('Message non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier que l'utilisateur est participant
        const participant = await this.participantRepo.findOne({
            where: {
                conversationId: message.conversationId,
                utilisateurId: userId,
            },
        });

        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        // Supprimer de Redis
        const key = this.getPinnedKey(message.conversationId, messageId);
        await redisService.del(key);

        // SSE broadcast
        try {
            await messagerieSSEService.broadcastToConversation(
                message.conversationId,
                'message:unpinned',
                {
                    messageId,
                    userId,
                }
            );
        } catch (error) {
            logger.warn(`[Pinned] Échec SSE broadcast`, error);
        }

        logger.info(`Message ${messageId} détaché par ${userId}`);
    }

    /**
     * Récupérer tous les messages épinglés d'une conversation
     */
    async getPinnedMessages(conversationId: string): Promise<Array<{
        messageId: string;
        message: Message;
        pinnedAt: string;
        pinnedBy: string;
    }>> {
        try {
            const pattern = `messagerie:pinned:${conversationId}:*`;
            const keys = await redisService.keys(pattern);

            const pinnedMessages = [];

            for (const key of keys) {
                const pinnedData = await redisService.getJSON<{
                    messageId: string;
                    conversationId: string;
                    userId: string;
                    pinnedAt: string;
                }>(key);

                if (pinnedData) {
                    const message = await this.messageRepo.findOne({
                        where: { id: pinnedData.messageId },
                        relations: ['expediteur'],
                    });

                    if (message && !message.supprime) {
                        pinnedMessages.push({
                            messageId: pinnedData.messageId,
                            message,
                            pinnedAt: pinnedData.pinnedAt,
                            pinnedBy: pinnedData.userId,
                        });
                    }
                }
            }

            // Trier par date d'épinglage
            pinnedMessages.sort((a, b) => 
                new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
            );

            return pinnedMessages;
        } catch (error) {
            logger.warn(`[Pinned] Échec récupération messages épinglés`, error);
            return [];
        }
    }

    /**
     * Vérifier si un message est épinglé
     */
    async isPinned(messageId: string, conversationId: string): Promise<boolean> {
        const key = this.getPinnedKey(conversationId, messageId);
        return await redisService.exists(key);
    }

    /**
     * Compter les messages épinglés d'une conversation
     */
    async getPinnedMessagesCount(conversationId: string): Promise<number> {
        try {
            const pattern = `messagerie:pinned:${conversationId}:*`;
            const keys = await redisService.keys(pattern);
            return keys.length;
        } catch {
            return 0;
        }
    }

    /**
     * Nettoyer les messages épinglés expirés
     */
    async cleanupExpiredPinned(): Promise<number> {
        try {
            const pattern = 'messagerie:pinned:*';
            const keys = await redisService.keys(pattern);

            let cleaned = 0;

            for (const key of keys) {
                const ttl = await redisService.ttl(key);
                
                // Si TTL < 0 (jamais expiré) ou très faible, supprimer
                if (ttl < 86400 * 7) { // Moins d'1 semaine restant
                    await redisService.del(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                logger.info(`[Pinned] ${cleaned} messages épinglés expirés nettoyés`);
            }

            return cleaned;
        } catch (error) {
            logger.warn(`[Pinned] Échec cleanup`, error);
            return 0;
        }
    }

    /**
     * Générer la clé Redis pour un message épinglé
     */
    private getPinnedKey(conversationId: string, messageId: string): string {
        return `messagerie:pinned:${conversationId}:${messageId}`;
    }
}

export const pinnedMessageService = new PinnedMessageService();
