/**
 * ==================================
 * eLISAschool - Service Statistiques Messagerie
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Statistiques et analytics pour la messagerie
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Conversation, Message, ParticipantConversation, MessageReaction } from '../entities';
import { logger } from '@common/utils/logger.util';

export class MessagerieStatsService {
    private conversationRepo: Repository<Conversation>;
    private messageRepo: Repository<Message>;
    private participantRepo: Repository<ParticipantConversation>;
    private reactionRepo: Repository<MessageReaction>;

    constructor() {
        this.conversationRepo = AppDataSource.getRepository(Conversation);
        this.messageRepo = AppDataSource.getRepository(Message);
        this.participantRepo = AppDataSource.getRepository(ParticipantConversation);
        this.reactionRepo = AppDataSource.getRepository(MessageReaction);
    }

    /**
     * Statistiques globales pour un établissement
     */
    async getEtablissementStats(etablissementId: string): Promise<{
        totalConversations: number;
        totalMessages: number;
        messagesToday: number;
        messagesWeek: number;
        activeUsers: number;
        averageResponseTime: number;
        topConversations: Array<{ id: string; titre: string; messageCount: number }>;
    }> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total conversations
        const totalConversations = await this.conversationRepo.count({
            where: { etablissementId, actif: true },
        });

        // Total messages
        const totalMessages = await this.messageRepo.count({
            where: { etablissementId, supprime: false },
        });

        // Messages aujourd'hui
        const messagesToday = await this.messageRepo.count({
            where: { 
                etablissementId, 
                supprime: false,
                createdAt: today,
            },
        });

        // Messages cette semaine
        const messagesWeek = await this.messageRepo.count({
            where: { 
                etablissementId, 
                supprime: false,
                createdAt: weekAgo,
            },
        });

        // Utilisateurs actifs (ont envoyé un message cette semaine)
        const activeUsersResult = await this.messageRepo
            .createQueryBuilder('m')
            .select('COUNT(DISTINCT m.expediteurId)', 'count')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .andWhere('m.createdAt >= :weekAgo', { weekAgo })
            .getRawOne();
        const activeUsers = parseInt(activeUsersResult?.count || '0');

        // Top 5 conversations les plus actives
        const topConversations = await this.conversationRepo
            .createQueryBuilder('c')
            .select(['c.id', 'c.titre', 'c.countMessages'])
            .where('c.etablissementId = :etablissementId', { etablissementId })
            .orderBy('c.countMessages', 'DESC')
            .limit(5)
            .getMany();

        return {
            totalConversations,
            totalMessages,
            messagesToday,
            messagesWeek,
            activeUsers,
            averageResponseTime: 0, // TODO: Calculer le temps moyen de réponse
            topConversations: topConversations.map(c => ({
                id: c.id,
                titre: c.titre || 'Sans titre',
                messageCount: c.countMessages,
            })),
        };
    }

    /**
     * Statistiques pour un utilisateur
     */
    async getUserStats(utilisateurId: string, etablissementId: string): Promise<{
        totalConversations: number;
        totalMessagesSent: number;
        totalMessagesReceived: number;
        unreadMessages: number;
        favoriteContacts: Array<{ userId: string; messageCount: number }>;
        activityByHour: Array<{ hour: number; count: number }>;
    }> {
        // Total conversations
        const totalConversations = await this.participantRepo.count({
            where: { utilisateurId },
        });

        // Messages envoyés
        const totalMessagesSent = await this.messageRepo.count({
            where: { expediteurId: utilisateurId, supprime: false },
        });

        // Messages reçus (dans conversations où l'utilisateur est participant)
        const totalMessagesReceived = await this.messageRepo
            .createQueryBuilder('m')
            .innerJoin(ParticipantConversation, 'p', 'p.conversationId = m.conversationId')
            .where('p.utilisateurId = :utilisateurId', { utilisateurId })
            .andWhere('m.expediteurId != :utilisateurId', { utilisateurId })
            .andWhere('m.supprime = false')
            .getCount();

        // Messages non lus
        let unreadMessages = 0;
        const participations = await this.participantRepo.find({
            where: { utilisateurId },
        });

        for (const p of participations) {
            const qb = this.messageRepo
                .createQueryBuilder('m')
                .where('m.conversationId = :conversationId', { conversationId: p.conversationId })
                .andWhere('m.supprime = false')
                .andWhere('m.expediteurId != :utilisateurId', { utilisateurId });

            if (p.derniereLecture) {
                qb.andWhere('m.createdAt > :derniereLecture', { derniereLecture: p.derniereLecture });
            }

            const count = await qb.getCount();
            unreadMessages += count;
        }

        // Top 5 contacts favoris
        const favoriteContacts = await this.messageRepo
            .createQueryBuilder('m')
            .select('m.expediteurId', 'userId')
            .addSelect('COUNT(*)', 'messageCount')
            .where('m.expediteurId != :utilisateurId', { utilisateurId })
            .groupBy('m.expediteurId')
            .orderBy('messageCount', 'DESC')
            .limit(5)
            .getRawMany();

        // Activité par heure (7 derniers jours)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const activityByHourRaw = await this.messageRepo
            .createQueryBuilder('m')
            .select("EXTRACT(HOUR FROM m.createdAt)", 'hour')
            .addSelect('COUNT(*)', 'count')
            .where('m.expediteurId = :utilisateurId', { utilisateurId })
            .andWhere('m.createdAt >= :weekAgo', { weekAgo })
            .groupBy("EXTRACT(HOUR FROM m.createdAt)")
            .getRawMany();

        const activityByHour = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: 0,
        }));

        for (const row of activityByHourRaw) {
            const hour = parseInt(row.hour);
            activityByHour[hour].count = parseInt(row.count);
        }

        return {
            totalConversations,
            totalMessagesSent,
            totalMessagesReceived,
            unreadMessages,
            favoriteContacts: favoriteContacts.map((c: any) => ({
                userId: c.userId,
                messageCount: parseInt(c.messageCount),
            })),
            activityByHour,
        };
    }

    /**
     * Statistiques des réactions
     */
    async getReactionStats(etablissementId: string): Promise<{
        totalReactions: number;
        reactionsByEmoji: Map<string, number>;
        mostReactedMessages: Array<{ messageId: string; reactionCount: number }>;
    }> {
        const totalReactions = await this.reactionRepo
            .createQueryBuilder('r')
            .innerJoin(Message, 'm', 'm.id = r.messageId')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .getCount();

        const reactionsByEmojiRaw = await this.reactionRepo
            .createQueryBuilder('r')
            .innerJoin(Message, 'm', 'm.id = r.messageId')
            .select('r.emoji', 'emoji')
            .addSelect('COUNT(*)', 'count')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .groupBy('r.emoji')
            .getRawMany();

        const reactionsByEmoji = new Map<string, number>();
        for (const row of reactionsByEmojiRaw) {
            reactionsByEmoji.set(row.emoji, parseInt(row.count));
        }

        const mostReactedMessages = await this.reactionRepo
            .createQueryBuilder('r')
            .select('r.messageId', 'messageId')
            .addSelect('COUNT(*)', 'reactionCount')
            .innerJoin(Message, 'm', 'm.id = r.messageId')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .groupBy('r.messageId')
            .orderBy('reactionCount', 'DESC')
            .limit(10)
            .getRawMany();

        return {
            totalReactions,
            reactionsByEmoji,
            mostReactedMessages: mostReactedMessages.map((m: any) => ({
                messageId: m.messageId,
                reactionCount: parseInt(m.reactionCount),
            })),
        };
    }

    /**
     * Tendances d'utilisation (derniers 30 jours)
     */
    async getUsageTrends(etablissementId: string): Promise<{
        dailyMessages: Array<{ date: string; count: number }>;
        dailyActiveUsers: Array<{ date: string; count: number }>;
    }> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Messages par jour
        const dailyMessagesRaw = await this.messageRepo
            .createQueryBuilder('m')
            .select("DATE(m.createdAt)", 'date')
            .addSelect('COUNT(*)', 'count')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .andWhere('m.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .andWhere('m.supprime = false')
            .groupBy("DATE(m.createdAt)")
            .orderBy('date', 'ASC')
            .getRawMany();

        const dailyMessages = dailyMessagesRaw.map((row: any) => ({
            date: row.date,
            count: parseInt(row.count),
        }));

        // Utilisateurs actifs par jour
        const dailyActiveUsersRaw = await this.messageRepo
            .createQueryBuilder('m')
            .select("DATE(m.createdAt)", 'date')
            .addSelect('COUNT(DISTINCT m.expediteurId)', 'count')
            .where('m.etablissementId = :etablissementId', { etablissementId })
            .andWhere('m.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
            .groupBy("DATE(m.createdAt)")
            .orderBy('date', 'ASC')
            .getRawMany();

        const dailyActiveUsers = dailyActiveUsersRaw.map((row: any) => ({
            date: row.date,
            count: parseInt(row.count),
        }));

        return {
            dailyMessages,
            dailyActiveUsers,
        };
    }
}

export const messagerieStatsService = new MessagerieStatsService();
