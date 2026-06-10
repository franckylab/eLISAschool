/**
 * ==================================
 * eLISAschool - Service Réactions Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MessageReaction, EmojiReaction } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { messagerieSSEService } from './messagerie-sse.service';

export class MessageReactionService {
    private reactionRepo: Repository<MessageReaction>;

    constructor() {
        this.reactionRepo = AppDataSource.getRepository(MessageReaction);
    }

    /**
     * Ajouter ou retirer une réaction (toggle)
     */
    async addReaction(
        messageId: string,
        emoji: EmojiReaction,
        utilisateurId: string
    ): Promise<MessageReaction | null> {
        // Vérifier si la réaction existe déjà
        const existing = await this.reactionRepo.findOne({
            where: { messageId, utilisateurId, emoji },
        });

        if (existing) {
            // Toggle: supprimer si existe déjà
            await this.reactionRepo.remove(existing);
            logger.info(`Réaction retirée: ${emoji} sur message ${messageId}`);
            return null;
        }

        // Créer nouvelle réaction
        const reaction = this.reactionRepo.create({
            messageId,
            utilisateurId,
            emoji,
        });
        await this.reactionRepo.save(reaction);

        // SSE broadcast
        const message = await AppDataSource.getRepository('Message').findOne({
            where: { id: messageId },
            relations: ['conversation'],
        });
        if (message) {
            await messagerieSSEService.broadcastToConversation(
                (message as any).conversationId,
                'message:reaction',
                {
                    messageId,
                    emoji,
                    action: 'added',
                    utilisateurId,
                }
            );
        }

        logger.info(`Réaction ajoutée: ${emoji} sur message ${messageId}`);
        return reaction;
    }

    /**
     * Récupérer les réactions d'un message agrégées par emoji
     */
    async getReactions(messageId: string): Promise<Map<string, number>> {
        const reactions = await this.reactionRepo.find({
            where: { messageId },
        });

        const aggregated = new Map<string, number>();
        for (const reaction of reactions) {
            const count = aggregated.get(reaction.emoji) || 0;
            aggregated.set(reaction.emoji, count + 1);
        }

        return aggregated;
    }

    /**
     * Supprimer une réaction
     */
    async removeReaction(
        messageId: string,
        emoji: EmojiReaction,
        utilisateurId: string
    ): Promise<void> {
        const reaction = await this.reactionRepo.findOne({
            where: { messageId, utilisateurId, emoji },
        });
        if (!reaction) {
            throw new AppError('Réaction non trouvée', 404, 'NOT_FOUND');
        }

        await this.reactionRepo.remove(reaction);

        // SSE broadcast
        const message = await AppDataSource.getRepository('Message').findOne({
            where: { id: messageId },
            relations: ['conversation'],
        });
        if (message) {
            await messagerieSSEService.broadcastToConversation(
                (message as any).conversationId,
                'message:reaction',
                {
                    messageId,
                    emoji,
                    action: 'removed',
                    utilisateurId,
                }
            );
        }
    }
}

export const messageReactionService = new MessageReactionService();
