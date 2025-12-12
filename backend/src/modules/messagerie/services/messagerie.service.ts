/**
 * ==================================
 * eLISAschool - Service Messagerie
 * ==================================
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Conversation, ParticipantConversation, Message, TypeConversation } from '../entities';
import { CreateConversationDto, SendMessageDto, QueryConversationsDto, QueryMessagesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class MessagerieService {
    private conversationRepo: Repository<Conversation>;
    private participantRepo: Repository<ParticipantConversation>;
    private messageRepo: Repository<Message>;

    constructor() {
        this.conversationRepo = AppDataSource.getRepository(Conversation);
        this.participantRepo = AppDataSource.getRepository(ParticipantConversation);
        this.messageRepo = AppDataSource.getRepository(Message);
    }

    async createConversation(dto: CreateConversationDto, createurId: string): Promise<Conversation> {
        const conversation = this.conversationRepo.create({
            titre: dto.titre,
            type: dto.type as TypeConversation,
            createurId,
        });
        await this.conversationRepo.save(conversation);

        // Ajouter les participants
        const allParticipants = [...new Set([createurId, ...dto.participantsIds])];
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

    async sendMessage(conversationId: string, dto: SendMessageDto, expediteurId: string): Promise<Message> {
        // Vérifier que l'utilisateur est participant
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId: expediteurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
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
    }
}

export const messagerieService = new MessagerieService();
