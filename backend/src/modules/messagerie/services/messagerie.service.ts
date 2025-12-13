/**
 * ==================================
 * eLISAschool - Service Messagerie v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Conversation, ParticipantConversation, Message, TypeConversation } from '../entities';
import { CreateConversationDto, SendMessageDto, QueryConversationsDto, QueryMessagesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service de messagerie avec configuration centralisée
 */
export class MessagerieService {
    private conversationRepo: Repository<Conversation>;
    private participantRepo: Repository<ParticipantConversation>;
    private messageRepo: Repository<Message>;

    constructor() {
        this.conversationRepo = AppDataSource.getRepository(Conversation);
        this.participantRepo = AppDataSource.getRepository(ParticipantConversation);
        this.messageRepo = AppDataSource.getRepository(Message);
    }

    /**
     * Récupère les paramètres messagerie depuis la configuration
     */
    private async getMessagerieParams() {
        return {
            maxMessageLength: await getParamNumber('messagerie.max_message_length', 5000),
            maxParticipants: await getParamNumber('messagerie.max_participants', 50),
            allowAttachments: await getParamBoolean('messagerie.allow_attachments', true),
            maxAttachmentSize: await getParamNumber('messagerie.max_attachment_size', 10), // MB
        };
    }

    async createConversation(dto: CreateConversationDto, createurId: string): Promise<Conversation> {
        const params = await this.getMessagerieParams();
        const allParticipants = [...new Set([createurId, ...dto.participantsIds])];

        // Vérifier limite de participants
        if (allParticipants.length > params.maxParticipants) {
            throw new AppError(
                `Maximum ${params.maxParticipants} participants autorisés`,
                400,
                'TOO_MANY_PARTICIPANTS'
            );
        }

        const conversation = this.conversationRepo.create({
            titre: dto.titre,
            type: dto.type as TypeConversation,
            createurId,
        });
        await this.conversationRepo.save(conversation);

        // Ajouter les participants
        for (const userId of allParticipants) {
            const participant = this.participantRepo.create({
                conversationId: conversation.id,
                utilisateurId: userId,
                estAdmin: userId === createurId,
            });
            await this.participantRepo.save(participant);
        }

        logger.info(`Conversation créée: ${conversation.id}`);
        return conversation;
    }

    async getConversations(utilisateurId: string, query: QueryConversationsDto) {
        const { page, limit, type } = query;

        const participations = await this.participantRepo.find({
            where: { utilisateurId },
            relations: ['conversation'],
        });

        let conversations = participations.map(p => p.conversation);
        if (type) {
            conversations = conversations.filter(c => c.type === type);
        }

        const total = conversations.length;
        const items = conversations.slice((page - 1) * limit, page * limit);

        return { items, total };
    }

    async getConversation(id: string, utilisateurId: string): Promise<Conversation> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId: id, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const conversation = await this.conversationRepo.findOne({
            where: { id },
            relations: ['participants', 'participants.utilisateur'],
        });
        if (!conversation) {
            throw new AppError('Conversation non trouvée', 404, 'NOT_FOUND');
        }

        return conversation;
    }

    async sendMessage(conversationId: string, dto: SendMessageDto, expediteurId: string): Promise<Message> {
        const params = await this.getMessagerieParams();

        // Vérifier que l'utilisateur est participant
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId: expediteurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        // Vérifier longueur message
        if (dto.contenu.length > params.maxMessageLength) {
            throw new AppError(
                `Message trop long (max ${params.maxMessageLength} caractères)`,
                400,
                'MESSAGE_TOO_LONG'
            );
        }

        // Vérifier pièces jointes
        if (dto.piecesJointes && dto.piecesJointes.length > 0) {
            if (!params.allowAttachments) {
                throw new AppError('Les pièces jointes sont désactivées', 400, 'ATTACHMENTS_DISABLED');
            }
        }

        const message = this.messageRepo.create({
            conversationId,
            expediteurId,
            contenu: dto.contenu,
            typeContenu: dto.typeContenu,
            piecesJointes: dto.piecesJointes,
        });
        await this.messageRepo.save(message);

        // Mettre à jour la conversation
        await this.conversationRepo.update(conversationId, { updatedAt: new Date() });

        logger.info(`Message envoyé: ${message.id} dans conversation ${conversationId}`);
        return message;
    }

    async getMessages(conversationId: string, utilisateurId: string, query: QueryMessagesDto) {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const { page, limit } = query;
        const [items, total] = await this.messageRepo.findAndCount({
            where: { conversationId, supprime: false },
            relations: ['expediteur'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Marquer comme lu
        participant.derniereLecture = new Date();
        await this.participantRepo.save(participant);

        return { items: items.reverse(), total };
    }

    async deleteMessage(messageId: string, utilisateurId: string): Promise<void> {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message || message.expediteurId !== utilisateurId) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        message.supprime = true;
        message.contenu = '[Message supprimé]';
        await this.messageRepo.save(message);
        logger.info(`Message supprimé: ${messageId}`);
    }

    /**
     * Ajouter un participant à une conversation
     */
    async addParticipant(conversationId: string, utilisateurId: string, adminId: string): Promise<void> {
        const params = await this.getMessagerieParams();

        // Vérifier que l'admin est bien admin
        const admin = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId: adminId, estAdmin: true },
        });
        if (!admin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        // Vérifier limite participants
        const count = await this.participantRepo.count({ where: { conversationId } });
        if (count >= params.maxParticipants) {
            throw new AppError(`Maximum ${params.maxParticipants} participants atteint`, 400, 'MAX_PARTICIPANTS');
        }

        const participant = this.participantRepo.create({
            conversationId,
            utilisateurId,
            estAdmin: false,
        });
        await this.participantRepo.save(participant);
    }

    /**
     * Quitter une conversation
     */
    async leaveConversation(conversationId: string, utilisateurId: string): Promise<void> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        await this.participantRepo.remove(participant);
        logger.info(`Utilisateur ${utilisateurId} a quitté conversation ${conversationId}`);
    }

    /**
     * Compter les messages non lus
     */
    async countUnread(utilisateurId: string): Promise<number> {
        const participations = await this.participantRepo.find({
            where: { utilisateurId },
        });

        let unread = 0;
        for (const p of participations) {
            const count = await this.messageRepo.count({
                where: {
                    conversationId: p.conversationId,
                    supprime: false,
                },
            });
            // Comparer avec dernière lecture
            if (p.derniereLecture) {
                const since = await this.messageRepo.count({
                    where: {
                        conversationId: p.conversationId,
                        supprime: false,
                    },
                });
                unread += since;
            } else {
                unread += count;
            }
        }

        return unread;
    }
}

export const messagerieService = new MessagerieService();
