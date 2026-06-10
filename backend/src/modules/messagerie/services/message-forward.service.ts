/**
 * ==================================
 * eLISAschool - Service Transfert Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Permet de transférer un message vers une ou plusieurs conversations
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Message, ParticipantConversation, TypeContenuMessage, PrioriteMessage } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { messagerieSSEService } from './messagerie-sse.service';
import { notificationTemplates } from '@modules/notifications/services/notification-templates.service';

export class MessageForwardService {
    private messageRepo: Repository<Message>;
    private participantRepo: Repository<ParticipantConversation>;

    constructor() {
        this.messageRepo = AppDataSource.getRepository(Message);
        this.participantRepo = AppDataSource.getRepository(ParticipantConversation);
    }

    /**
     * Transférer un message vers une ou plusieurs conversations
     */
    async forwardMessage(
        messageId: string,
        conversationIds: string[],
        expediteurId: string,
        etablissementId: string,
        commentaire?: string
    ): Promise<{
        forwardCount: number;
        forwardedMessages: Message[];
    }> {
        // Limiter à 10 conversations maximum
        if (conversationIds.length > 10) {
            throw new AppError(
                'Maximum 10 conversations autorisées pour le transfert',
                400,
                'TOO_MANY_CONVERSATIONS'
            );
        }

        // Récupérer le message source
        const sourceMessage = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['expediteur'],
        });

        if (!sourceMessage) {
            throw new AppError('Message source non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier que le message n'est pas supprimé
        if (sourceMessage.supprime) {
            throw new AppError('Impossible de transférer un message supprimé', 400, 'MESSAGE_DELETED');
        }

        // Vérifier que l'utilisateur est participant de la conversation source
        const isParticipant = await this.participantRepo.findOne({
            where: {
                conversationId: sourceMessage.conversationId,
                utilisateurId: expediteurId,
            },
        });

        if (!isParticipant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const forwardedMessages: Message[] = [];

        // Transférer vers chaque conversation
        for (const conversationId of conversationIds) {
            // Vérifier que l'utilisateur est participant de la conversation cible
            const targetParticipant = await this.participantRepo.findOne({
                where: {
                    conversationId,
                    utilisateurId: expediteurId,
                },
            });

            if (!targetParticipant) {
                logger.warn(`[Forward] Utilisateur ${expediteurId} non participant de ${conversationId}`);
                continue;
            }

            // Construire le contenu du message transféré
            let forwardedContent = '';
            
            if (commentaire) {
                forwardedContent += `${commentaire}\n\n`;
            }

            forwardedContent += `━━━ Message transféré ━━━\n`;
            forwardedContent += `De: ${sourceMessage.expediteur?.prenom || 'Utilisateur'} ${sourceMessage.expediteur?.nom || ''}\n`;
            forwardedContent += `Date: ${sourceMessage.createdAt.toLocaleString('fr-FR')}\n`;
            forwardedContent += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            forwardedContent += sourceMessage.contenu;

            // Créer le message transféré
            const forwardedMessage = this.messageRepo.create({
                conversationId,
                expediteurId,
                contenu: forwardedContent,
                typeContenu: TypeContenuMessage.SYSTEME,
                priorite: PrioriteMessage.NORMAL,
                piecesJointes: sourceMessage.piecesJointes,
                etablissementId,
                metadata: {
                    forwardedFrom: messageId,
                    originalExpediteurId: sourceMessage.expediteurId,
                    forwardedAt: new Date().toISOString(),
                },
            });

            await this.messageRepo.save(forwardedMessage);
            forwardedMessages.push(forwardedMessage);

            // Mettre à jour la conversation cible
            await AppDataSource.getRepository('Conversation').update(conversationId, {
                updatedAt: new Date(),
                dernierMessageId: forwardedMessage.id,
                countMessages: () => '"countMessages" + 1',
            });

            // SSE broadcast
            try {
                await messagerieSSEService.broadcastToConversation(
                    conversationId,
                    'message:new',
                    {
                        messageId: forwardedMessage.id,
                        conversationId,
                        expediteurId,
                        contenu: forwardedContent.substring(0, 200),
                        priorite: PrioriteMessage.NORMAL,
                        timestamp: forwardedMessage.createdAt,
                        isForwarded: true,
                    }
                );
            } catch (error) {
                logger.warn(`[Forward] Échec SSE broadcast`, error);
            }

            // Notification NON-BLOQUANTE
            try {
                await this.notifyParticipants(conversationId, forwardedMessage, expediteurId, etablissementId);
            } catch (error) {
                logger.warn(`[Forward] Échec notification`, error);
            }
        }

        logger.info(`Message ${messageId} transféré vers ${forwardedMessages.length} conversations`);

        return {
            forwardCount: forwardedMessages.length,
            forwardedMessages,
        };
    }

    /**
     * Envoyer des notifications aux participants de la conversation cible
     */
    private async notifyParticipants(
        conversationId: string,
        message: Message,
        expediteurId: string,
        etablissementId: string
    ): Promise<void> {
        const participants = await this.participantRepo.find({
            where: { conversationId },
        });

        for (const participant of participants) {
            if (participant.utilisateurId === expediteurId) continue;
            if (participant.muet) continue;

            try {
                await notificationTemplates.nouveauMessage(
                    {
                        destinataireId: participant.utilisateurId,
                        etablissementId,
                        metadata: {
                            messageId: message.id,
                            conversationId,
                            expediteurId,
                            isForwarded: true,
                        },
                    },
                    {
                        expediteurNom: 'Message transféré',
                        message: message.contenu.substring(0, 100),
                        conversation: 'Conversation',
                    }
                );
            } catch (error) {
                logger.warn(`[Forward] Échec notif In-App`, error);
            }
        }
    }

    /**
     * Récupérer l'historique de transfert d'un message
     */
    async getForwardHistory(messageId: string): Promise<{
        originalMessage: Message;
        forwardCount: number;
        forwards: Array<{
            messageId: string;
            conversationId: string;
            expediteurId: string;
            forwardedAt: string;
        }>;
    }> {
        const originalMessage = await this.messageRepo.findOne({
            where: { id: messageId },
        });

        if (!originalMessage) {
            throw new AppError('Message non trouvé', 404, 'NOT_FOUND');
        }

        // Trouver tous les messages transférés depuis celui-ci
        const forwards = await this.messageRepo.find({
            where: {
                metadata: { forwardedFrom: messageId },
            },
            select: ['id', 'conversationId', 'expediteurId', 'createdAt', 'metadata'],
            order: { createdAt: 'DESC' },
        });

        return {
            originalMessage,
            forwardCount: forwards.length,
            forwards: forwards.map(f => ({
                messageId: f.id,
                conversationId: f.conversationId,
                expediteurId: f.expediteurId,
                forwardedAt: f.createdAt.toISOString(),
            })),
        };
    }
}

export const messageForwardService = new MessageForwardService();
