/**
 * ==================================
 * eLISAschool - Service Recherche Messagerie
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Recherche full-text PostgreSQL dans messages et conversations
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Message, Conversation } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class MessagerieSearchService {
    private messageRepo: Repository<Message>;
    private conversationRepo: Repository<Conversation>;

    constructor() {
        this.messageRepo = AppDataSource.getRepository(Message);
        this.conversationRepo = AppDataSource.getRepository(Conversation);
    }

    /**
     * Rechercher des messages avec full-text search
     */
    async searchMessages(
        query: string,
        utilisateurId: string,
        etablissementId: string,
        options?: {
            conversationId?: string;
            dateDebut?: Date;
            dateFin?: Date;
            typeContenu?: string;
            expediteurId?: string;
            page?: number;
            limit?: number;
        }
    ) {
        const {
            conversationId,
            dateDebut,
            dateFin,
            typeContenu,
            expediteurId,
            page = 1,
            limit = 50,
        } = options || {};

        // Vérifier que l'utilisateur a accès aux conversations
        const participantRepo = AppDataSource.getRepository('ParticipantConversation');
        const userConversations = await participantRepo.find({
            where: { utilisateurId },
            select: ['conversationId'],
        });
        const conversationIds = userConversations.map((p: any) => p.conversationId);

        if (conversationIds.length === 0) {
            return { items: [], total: 0 };
        }

        // Requête full-text search PostgreSQL
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.expediteur', 'expediteur')
            .leftJoinAndSelect('m.conversation', 'conversation')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .andWhere('m.supprime = false')
            .andWhere('m.conversationId IN (:...conversationIds)', { conversationIds })
            .andWhere(
                `(m.contenu ILIKE :query OR m.search_vector @@ to_tsquery('french', :query))`,
                { query: `%${query}%` }
            );

        // Filtres optionnels
        if (conversationId) {
            qb.andWhere('m.conversationId = :conversationId', { conversationId });
        }
        if (dateDebut) {
            qb.andWhere('m.createdAt >= :dateDebut', { dateDebut });
        }
        if (dateFin) {
            qb.andWhere('m.createdAt <= :dateFin', { dateFin });
        }
        if (typeContenu) {
            qb.andWhere('m.typeContenu = :typeContenu', { typeContenu });
        }
        if (expediteurId) {
            qb.andWhere('m.expediteurId = :expediteurId', { expediteurId });
        }

        qb.orderBy('m.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Rechercher des conversations
     */
    async searchConversations(
        query: string,
        utilisateurId: string,
        etablissementId: string,
        options?: {
            type?: string;
            page?: number;
            limit?: number;
        }
    ) {
        const { type, page = 1, limit = 50 } = options || {};

        const participantRepo = AppDataSource.getRepository('ParticipantConversation');

        const qb = participantRepo
            .createQueryBuilder('p')
            .innerJoinAndSelect('p.conversation', 'c')
            .where('p.utilisateurId = :utilisateurId', { utilisateurId })
            .andWhere('c.etablissementId = :etablissementId', { etablissementId })
            .andWhere('c.archive = false')
            .andWhere('c.titre ILIKE :query', { query: `%${query}%` });

        if (type) {
            qb.andWhere('c.type = :type', { type });
        }

        qb.orderBy('c.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const result = await qb.getManyAndCount();
        const items = result[0].map((p: any) => p.conversation);

        return {
            items,
            total: result[1],
            page,
            limit,
            totalPages: Math.ceil(result[1] / limit),
        };
    }
}

export const messagerieSearchService = new MessagerieSearchService();
