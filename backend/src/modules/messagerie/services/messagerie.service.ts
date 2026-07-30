/**
 * ==================================
 * eLISAschool - Service Messagerie v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service complet de messagerie avec:
 * - Multi-tenant strict (etablissementId)
 * - Conversations automatiques (classes, familles)
 * - Pagination optimisée (cursor pour messages)
 * - Intégrations notifications, gamification, SSE
 */

import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    Conversation,
    ParticipantConversation,
    Message,
    TypeConversation,
    PrioriteMessage,
    TypeContenuMessage,
} from '../entities';
import {
    CreateConversationDto,
    SendMessageDto,
    QueryConversationsDto,
    QueryMessagesDto,
    UpdateConversationDto,
    AddParticipantDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { redisService } from '@common/services/redis.service';

// Services externes (importés dynamiquement pour éviter les dépendances circulaires)
import { notificationTemplates } from '@modules/notifications/services/notification-templates.service';
import { messagerieSSEService } from './messagerie-sse.service';
import { messageMentionService } from './message-mention.service';
import { auditService, AuditAction } from '@modules/auth';

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
            maxParticipants: await getParamNumber('messagerie.max_participants', 100),
            allowAttachments: await getParamBoolean('messagerie.allow_attachments', true),
            maxAttachmentSize: await getParamNumber('messagerie.max_attachment_size', 10),
            urgentSmsNotification: await getParamBoolean('messagerie.urgent_sms_notification', true),
        };
    }

    /**
     * Créer une conversation manuelle
     */
    async createConversation(
        dto: CreateConversationDto,
        createurId: string,
        etablissementId: string
    ): Promise<Conversation> {
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

        // Pour les conversations individuelles, vérifier si elle existe déjà
        if (dto.type === TypeConversation.INDIVIDUELLE && allParticipants.length === 2) {
            const existing = await this.findExistingDirectConversation(
                allParticipants[0],
                allParticipants[1],
                etablissementId
            );
            if (existing) {
                return existing;
            }
        }

        const conversation = this.conversationRepo.create({
            titre: dto.titre,
            type: dto.type as TypeConversation,
            createurId,
            etablissementId,
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

        logger.info(`Conversation créée: ${conversation.id} par ${createurId}`);

        await auditService.log({
            utilisateurId: createurId,
            action: AuditAction.CONVERSATION_CREATE,
            cible: 'Conversation',
            cibleId: conversation.id,
            description: `Création de la conversation "${conversation.titre}" (${conversation.type})`,
            module: 'messagerie',
            etablissementId,
            metadata: { entiteLabel: conversation.titre || conversation.id },
        });

        return conversation;
    }

    /**
     * Trouver une conversation directe existante entre 2 utilisateurs
     */
    private async findExistingDirectConversation(
        user1Id: string,
        user2Id: string,
        etablissementId: string
    ): Promise<Conversation | null> {
        const convs = await this.conversationRepo
            .createQueryBuilder('c')
            .innerJoinAndSelect(
                'participants',
                'p1',
                'p1.conversationId = c.id AND p1.utilisateurId = :user1Id',
                { user1Id }
            )
            .innerJoinAndSelect(
                'participants',
                'p2',
                'p2.conversationId = c.id AND p2.utilisateurId = :user2Id',
                { user2Id }
            )
            .where('c.type = :type', { type: TypeConversation.INDIVIDUELLE })
            .andWhere('c.etablissementId = :etablissementId', { etablissementId })
            .getOne();

        return convs;
    }

    /**
     * Créer une conversation automatique pour une classe
     */
    async createAutoConversationClasse(
        classeId: string,
        etablissementId: string
    ): Promise<Conversation> {
        // Vérifier si la conversation existe déjà
        const existing = await this.conversationRepo.findOne({
            where: {
                entiteLieeType: 'classe',
                entiteLieeId: classeId,
                etablissementId,
            },
        });

        if (existing) {
            return existing;
        }

        // Créer la conversation
        const conversation = this.conversationRepo.create({
            titre: `Classe ${classeId.substring(0, 8)}`,
            type: TypeConversation.CLASSE,
            etablissementId,
            entiteLieeType: 'classe',
            entiteLieeId: classeId,
        });
        await this.conversationRepo.save(conversation);

        logger.info(`Conversation automatique créée pour classe: ${classeId}`);
        return conversation;
    }

    /**
     * Créer une conversation automatique famille (élève + parents)
     */
    async createAutoConversationFamille(
        eleveId: string,
        etablissementId: string
    ): Promise<Conversation> {
        const existing = await this.conversationRepo.findOne({
            where: {
                entiteLieeType: 'eleve',
                entiteLieeId: eleveId,
                etablissementId,
            },
        });

        if (existing) {
            return existing;
        }

        const conversation = this.conversationRepo.create({
            titre: `Famille élève ${eleveId.substring(0, 8)}`,
            type: TypeConversation.FAMILLE,
            etablissementId,
            entiteLieeType: 'eleve',
            entiteLieeId: eleveId,
        });
        await this.conversationRepo.save(conversation);

        logger.info(`Conversation automatique créée pour famille: ${eleveId}`);
        return conversation;
    }

    /**
     * Récupérer les conversations d'un utilisateur avec pagination
     * OPTIMISÉ: Cache Redis + requête batch pour unread counts
     */
    async getConversations(
        utilisateurId: string,
        etablissementId: string,
        query: QueryConversationsDto
    ) {
        const { page, limit, type, archive, search } = query;

        // Vérifier cache Redis
        const cacheKey = `messagerie:conversations:${utilisateurId}:${page}:${limit}:${type || 'all'}:${archive || false}`;
        try {
            const cached = await redisService.getJSON(cacheKey);
            if (cached && Date.now() - cached.timestamp < 30000) { // 30s TTL
                return cached.data;
            }
        } catch (error) {
            // Ignorer erreur cache
        }

        const qb = this.participantRepo
            .createQueryBuilder('p')
            .innerJoinAndSelect('p.conversation', 'c')
            .leftJoinAndSelect('c.dernierMessage', 'dm')
            .leftJoinAndSelect('dm.expediteur', 'expediteur')
            .where('p.utilisateurId = :utilisateurId', { utilisateurId })
            .andWhere('c.etablissementId = :etablissementId', { etablissementId })
            .andWhere('c.archive = :archive', { archive: archive || false })
            .andWhere('p.archivePerso = false')
            .orderBy('c.updatedAt', 'DESC');

        if (type) {
            qb.andWhere('c.type = :type', { type });
        }

        if (search) {
            qb.andWhere('c.titre ILIKE :search', { search: `%${search}%` });
        }

        const { paginateWithQueryBuilder } = await import('@common/utils/pagination.util');
        const result = await paginateWithQueryBuilder(qb, page, limit, false);

        // OPTIMISÉ: Compter les non-lus en batch au lieu de N+1
        const conversations = result.items.map((p: any) => p.conversation);
        const conversationIds = conversations.map((c: any) => c.id);

        // Requête batch pour tous les unread counts
        const unreadCounts = conversationIds.length > 0
            ? await this.getUnreadCountsBatch(conversationIds, utilisateurId)
            : new Map<string, number>();

        const conversationsWithUnread = conversations.map((conv: any) => ({
            ...conv,
            unreadCount: unreadCounts.get(conv.id) || 0,
        }));

        const responseData = {
            items: conversationsWithUnread,
            total: result.meta.totalItems,
        };

        // Mettre en cache
        try {
            await redisService.setJSON(cacheKey, {
                data: responseData,
                timestamp: Date.now(),
            }, 30); // 30 secondes
        } catch (error) {
            // Ignorer erreur cache
        }

        return responseData;
    }

    /**
     * Compter les non-lus pour plusieurs conversations en une seule requête
     */
    private async getUnreadCountsBatch(
        conversationIds: string[],
        utilisateurId: string
    ): Promise<Map<string, number>> {
        const counts = new Map<string, number>();

        // Récupérer tous les messages non lus pour ces conversations
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .select('m.conversationId', 'conversationId')
            .addSelect('COUNT(*)', 'count')
            .where('m.conversationId IN (:...conversationIds)', { conversationIds })
            .andWhere('m.supprime = false')
            .andWhere('m.expediteurId != :utilisateurId', { utilisateurId })
            .groupBy('m.conversationId');

        // Filtrer par dernière lecture
        const participantRepo = AppDataSource.getRepository(ParticipantConversation);
        const participants = await participantRepo.find({
            where: { 
                conversationId: conversationIds.length > 0 ? conversationIds : undefined,
                utilisateurId 
            },
        });

        const derniereLectureMap = new Map<string, Date>();
        for (const p of participants) {
            if (p.derniereLecture) {
                derniereLectureMap.set(p.conversationId, p.derniereLecture);
            }
        }

        if (derniereLectureMap.size > 0) {
            const conditions: string[] = [];
            const params: any = { conversationIds, utilisateurId };
            
            for (const [convId, date] of derniereLectureMap.entries()) {
                conditions.push(`(m.conversationId = '${convId}' AND m.createdAt > '${date.toISOString()}')`);
            }
            
            if (conditions.length > 0) {
                qb.andWhere(`(${conditions.join(' OR ')})`);
            }
        }

        const results = await qb.getRawMany();

        for (const row of results) {
            counts.set(row.conversationId, parseInt(row.count));
        }

        // Ajouter les conversations sans messages non lus
        for (const convId of conversationIds) {
            if (!counts.has(convId)) {
                counts.set(convId, 0);
            }
        }

        return counts;
    }

    /**
     * Récupérer une conversation spécifique
     */
    async getConversation(id: string, utilisateurId: string): Promise<Conversation> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId: id, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const conversation = await this.conversationRepo.findOne({
            where: { id },
            relations: ['participants', 'participants.utilisateur', 'dernierMessage', 'dernierMessage.expediteur'],
        });
        if (!conversation) {
            throw new AppError('Conversation non trouvée', 404, 'NOT_FOUND');
        }

        return conversation;
    }

    /**
     * Envoyer un message dans une conversation
     */
    async sendMessage(
        conversationId: string,
        dto: SendMessageDto,
        expediteurId: string,
        etablissementId: string
    ): Promise<Message> {
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

        // Vérifier si c'est une réponse à un message
        if (dto.reponseA) {
            const parentMessage = await this.messageRepo.findOne({
                where: { id: dto.reponseA, conversationId },
            });
            if (!parentMessage) {
                throw new AppError('Message parent non trouvé', 404, 'NOT_FOUND');
            }
        }

        const message = this.messageRepo.create({
            conversationId,
            expediteurId,
            contenu: dto.contenu,
            typeContenu: (dto.typeContenu as TypeContenuMessage) || TypeContenuMessage.TEXTE,
            priorite: (dto.priorite as PrioriteMessage) || PrioriteMessage.NORMAL,
            piecesJointes: dto.piecesJointes,
            reponseAId: dto.reponseA,
            mentions: dto.mentions,
            etablissementId,
        });
        await this.messageRepo.save(message);

        // Mettre à jour la conversation
        await this.conversationRepo.update(conversationId, {
            updatedAt: new Date(),
            dernierMessageId: message.id,
            countMessages: () => '"countMessages" + 1',
        });

        // Traiter les mentions
        if (dto.mentions && dto.mentions.length > 0) {
            await messageMentionService.processMentions(message, dto.mentions);
        }

        // Notifications NON-BLOQUANTES
        try {
            await this.sendNotifications(conversationId, message, expediteurId, params);
        } catch (error) {
            logger.warn(`[Messagerie] Échec notification (non bloquant)`, error);
        }

        // SSE broadcast
        try {
            await messagerieSSEService.notifyNewMessage(message, conversationId);
        } catch (error) {
            logger.warn(`[Messagerie] Échec SSE broadcast (non bloquant)`, error);
        }

        logger.info(`Message envoyé: ${message.id} dans conversation ${conversationId}`);

        await auditService.log({
            utilisateurId: expediteurId,
            action: AuditAction.MESSAGE_SEND,
            cible: 'Message',
            cibleId: message.id,
            description: `Envoi d'un message dans la conversation ${conversationId}`,
            module: 'messagerie',
            etablissementId,
            metadata: {
                entiteLabel: `Message dans ${conversationId}`,
                parentCible: 'Conversation',
                parentCibleId: conversationId,
            },
        });

        return message;
    }

    /**
     * Envoyer des notifications aux participants
     */
    private async sendNotifications(
        conversationId: string,
        message: Message,
        expediteurId: string,
        params: any
    ): Promise<void> {
        // Récupérer tous les participants sauf l'expéditeur
        const participants = await this.participantRepo.find({
            where: { conversationId },
        });

        for (const participant of participants) {
            if (participant.utilisateurId === expediteurId) continue;
            if (participant.muet) continue;

            // Notification In-App
            try {
                await notificationTemplates.nouveauMessage(
                    {
                        destinataireId: participant.utilisateurId,
                        etablissementId: message.etablissementId,
                        metadata: {
                            messageId: message.id,
                            conversationId,
                            expediteurId,
                        },
                    },
                    {
                        expediteurNom: message.expediteur?.prenom || 'Un contact',
                        message: message.contenu.substring(0, 100),
                        conversation: message.conversation?.titre || 'Conversation',
                    }
                );
            } catch (error) {
                logger.warn(`[Messagerie] Échec notif In-App`, error);
            }

            // SMS si message urgent
            if (message.priorite === PrioriteMessage.URGENT && params.urgentSmsNotification) {
                try {
                    await notificationTemplates.messageUrgent(
                        {
                            destinataireId: participant.utilisateurId,
                            etablissementId: message.etablissementId,
                            metadata: { messageId: message.id, conversationId },
                        },
                        {
                            expediteurNom: message.expediteur?.prenom || 'Un contact',
                            message: message.contenu.substring(0, 100),
                        }
                    );
                } catch (error) {
                    logger.warn(`[Messagerie] Échec notif SMS urgent`, error);
                }
            }
        }
    }

    /**
     * Récupérer les messages d'une conversation avec cursor pagination
     */
    async getMessages(
        conversationId: string,
        utilisateurId: string,
        query: QueryMessagesDto
    ) {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const { limit = 50, cursor, direction = 'after' } = query;

        const qb = this.messageRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.expediteur', 'expediteur')
            .leftJoinAndSelect('m.reponses', 'reponses')
            .leftJoinAndSelect('m.fichiers', 'fichiers')
            .where('m.conversationId = :conversationId', { conversationId })
            .andWhere('m.supprime = false')
            .orderBy('m.createdAt', 'DESC')
            .limit(limit);

        // Cursor pagination
        if (cursor) {
            const cursorMessage = await this.messageRepo.findOne({ where: { id: cursor } });
            if (cursorMessage) {
                if (direction === 'after') {
                    qb.andWhere('m.createdAt < :cursorDate', { cursorDate: cursorMessage.createdAt });
                } else {
                    qb.andWhere('m.createdAt > :cursorDate', { cursorDate: cursorMessage.createdAt });
                }
            }
        }

        const items = await qb.getMany();

        // Marquer comme lu
        participant.derniereLecture = new Date();
        participant.dernierMessageLuId = items[0]?.id;
        await this.participantRepo.save(participant);

        return { items: items.reverse(), hasMore: items.length === limit };
    }

    /**
     * Modifier un message
     */
    async editMessage(
        messageId: string,
        nouveauContenu: string,
        utilisateurId: string
    ): Promise<Message> {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message || message.expediteurId !== utilisateurId) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        // Vérifier délai d'édition (15 min par défaut)
        const delaiEdition = await getParamNumber('messagerie.delai_edition', 15);
        const delaiMs = delaiEdition * 60 * 1000;
        if (Date.now() - message.createdAt.getTime() > delaiMs) {
            throw new AppError('Délai d\'édition expiré', 400, 'EDIT_EXPIRED');
        }

        message.contenu = nouveauContenu;
        message.modifie = true;
        await this.messageRepo.save(message);

        // SSE broadcast
        await messagerieSSEService.broadcastToConversation(message.conversationId, 'message:edited', {
            messageId: message.id,
            contenu: message.contenu,
            modifie: true,
        });

        await auditService.log({
            utilisateurId,
            action: AuditAction.MESSAGE_EDIT,
            cible: 'Message',
            cibleId: message.id,
            description: `Modification du message ${message.id}`,
            module: 'messagerie',
            etablissementId: message.etablissementId,
            metadata: { entiteLabel: `Message ${message.id}` },
        });

        return message;
    }

    /**
     * Supprimer un message (soft delete)
     */
    async deleteMessage(
        messageId: string,
        utilisateurId: string,
        estChefEtablissement: boolean = false
    ): Promise<void> {
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['conversation'],
        });
        if (!message) {
            throw new AppError('Message non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier permissions
        if (!estChefEtablissement && message.expediteurId !== utilisateurId) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        message.supprime = true;
        message.contenu = '[Message supprimé]';
        await this.messageRepo.save(message);

        // SSE broadcast
        await messagerieSSEService.broadcastToConversation(message.conversationId, 'message:deleted', {
            messageId: message.id,
        });

        logger.info(`Message supprimé: ${messageId}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.MESSAGE_DELETE,
            cible: 'Message',
            cibleId: message.id,
            description: `Suppression du message ${message.id}`,
            module: 'messagerie',
            etablissementId: message.etablissementId,
            metadata: { entiteLabel: `Message ${message.id}` },
        });
    }

    /**
     * Ajouter un participant à une conversation
     */
    async addParticipant(
        conversationId: string,
        dto: AddParticipantDto,
        adminId: string
    ): Promise<void> {
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

        // Vérifier si déjà participant
        const existing = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId: dto.utilisateurId },
        });
        if (existing) {
            throw new AppError('Utilisateur déjà participant', 409, 'ALREADY_PARTICIPANT');
        }

        const participant = this.participantRepo.create({
            conversationId,
            utilisateurId: dto.utilisateurId,
            estAdmin: dto.estAdmin || false,
        });
        await this.participantRepo.save(participant);

        // SSE broadcast
        await messagerieSSEService.broadcastToConversation(conversationId, 'conversation:participant_added', {
            conversationId,
            utilisateurId: dto.utilisateurId,
        });
    }

    /**
     * Retirer un participant d'une conversation
     */
    async removeParticipant(
        conversationId: string,
        utilisateurId: string,
        adminId: string
    ): Promise<void> {
        // Vérifier que l'admin est bien admin
        const admin = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId: adminId, estAdmin: true },
        });
        if (!admin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }

        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Participant non trouvé', 404, 'NOT_FOUND');
        }

        await this.participantRepo.remove(participant);

        // SSE broadcast
        await messagerieSSEService.broadcastToConversation(conversationId, 'conversation:participant_removed', {
            conversationId,
            utilisateurId,
        });

        logger.info(`Utilisateur ${utilisateurId} retiré de conversation ${conversationId}`);
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

        // Empêcher le créateur de quitter s'il est le seul admin
        const admins = await this.participantRepo.count({
            where: { conversationId, estAdmin: true },
        });
        if (participant.estAdmin && admins <= 1) {
            throw new AppError('Impossible de quitter, vous êtes le seul administrateur', 400, 'LAST_ADMIN');
        }

        await this.participantRepo.remove(participant);
        logger.info(`Utilisateur ${utilisateurId} a quitté conversation ${conversationId}`);
    }

    /**
     * Épingler une conversation
     */
    async pinConversation(conversationId: string, utilisateurId: string): Promise<void> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        participant.epingle = true;
        await this.participantRepo.save(participant);
    }

    /**
     * Désépingler une conversation
     */
    async unpinConversation(conversationId: string, utilisateurId: string): Promise<void> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        participant.epingle = false;
        await this.participantRepo.save(participant);
    }

    /**
     * Archiver une conversation
     */
    async archiveConversation(conversationId: string, utilisateurId: string): Promise<void> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        participant.archivePerso = true;
        await this.participantRepo.save(participant);
    }

    /**
     * Mettre en sourdine une conversation
     */
    async muteConversation(conversationId: string, utilisateurId: string): Promise<void> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        participant.muet = !participant.muet; // Toggle
        await this.participantRepo.save(participant);
    }

    /**
     * Marquer tous les messages d'une conversation comme lus
     */
    async markConversationAsRead(conversationId: string, utilisateurId: string): Promise<number> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) {
            throw new AppError('Non participant', 404, 'NOT_FOUND');
        }

        // Compter les non-lus
        const unreadCount = await this.getUnreadCount(conversationId, utilisateurId);

        // Récupérer le dernier message
        const dernierMessage = await this.messageRepo.findOne({
            where: { conversationId },
            order: { createdAt: 'DESC' },
        });

        participant.derniereLecture = new Date();
        participant.dernierMessageLuId = dernierMessage?.id;
        await this.participantRepo.save(participant);

        return unreadCount;
    }

    /**
     * Compter les messages non lus d'une conversation
     */
    async getUnreadCount(conversationId: string, utilisateurId: string): Promise<number> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, utilisateurId },
        });
        if (!participant) return 0;

        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversationId = :conversationId', { conversationId })
            .andWhere('m.supprime = false')
            .andWhere('m.expediteurId != :utilisateurId', { utilisateurId });

        if (participant.derniereLecture) {
            qb.andWhere('m.createdAt > :derniereLecture', { derniereLecture: participant.derniereLecture });
        }

        return await qb.getCount();
    }

    /**
     * Compter tous les messages non lus d'un utilisateur
     */
    async countAllUnread(utilisateurId: string, etablissementId: string): Promise<number> {
        const participations = await this.participantRepo.find({
            where: { utilisateurId },
        });

        let totalUnread = 0;
        for (const p of participations) {
            const count = await this.getUnreadCount(p.conversationId, utilisateurId);
            totalUnread += count;
        }

        // Cache Redis
        await redisService.setJSON(`messagerie:unread:${utilisateurId}`, {
            total: totalUnread,
            timestamp: Date.now(),
        }, 30);

        return totalUnread;
    }

    /**
     * Mettre à jour une conversation
     */
    async updateConversation(
        id: string,
        dto: UpdateConversationDto,
        utilisateurId: string
    ): Promise<Conversation> {
        const participant = await this.participantRepo.findOne({
            where: { conversationId: id, utilisateurId, estAdmin: true },
        });
        if (!participant) {
            throw new AppError('Non autorisé (admin requis)', 403, 'FORBIDDEN');
        }

        const conversation = await this.conversationRepo.findOne({ where: { id } });
        if (!conversation) {
            throw new AppError('Conversation non trouvée', 404, 'NOT_FOUND');
        }

        if (dto.titre) conversation.titre = dto.titre;
        if (dto.metadata) conversation.metadata = dto.metadata;

        await this.conversationRepo.save(conversation);

        // SSE broadcast
        await messagerieSSEService.broadcastToConversation(id, 'conversation:updated', {
            conversationId: id,
            titre: conversation.titre,
        });

        await auditService.log({
            utilisateurId,
            action: AuditAction.CONVERSATION_UPDATE,
            cible: 'Conversation',
            cibleId: conversation.id,
            description: `Mise à jour de la conversation "${conversation.titre}"`,
            module: 'messagerie',
            etablissementId: conversation.etablissementId,
            metadata: { entiteLabel: conversation.titre || conversation.id },
        });

        return conversation;
    }
}

export const messagerieService = new MessagerieService();
