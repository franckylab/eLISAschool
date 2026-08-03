/**
 * ==================================
 * eLISAschool - Controller Messagerie Complet v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * 40+ endpoints REST + SSE pour messagerie complète
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
    messagerieService,
    messageReactionService,
    messageReadService,
    messageMentionService,
    templateMessageService,
    messagerieSearchService,
    messagerieSSEService,
    messagerieOnlineStatusService,
    messagerieCacheService,
    messagerieStatsService,
    messageForwardService,
    messageDraftService,
    pinnedMessageService,
} from '../services';
import {
    createConversationSchema,
    sendMessageSchema,
    queryConversationsSchema,
    queryMessagesSchema,
    updateConversationSchema,
    addReactionSchema,
    createTemplateSchema,
    updateTemplateSchema,
    renderTemplateSchema,
    searchMessagesSchema,
    searchConversationsSchema,
    addParticipantSchema,
    editMessageSchema,
    forwardMessageSchema,
    saveDraftSchema,
} from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { Role } from '@modules/auth/entities';
import { EmojiReaction, CategorieTemplate, TypeConversation } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// ==================================
// CONVERSATIONS
// ==================================

// Lister mes conversations
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryConversationsSchema, req.query);
        const result = await messagerieService.getConversations(
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            query
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Créer une conversation
router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createConversationSchema, req.body);
        const conversation = await messagerieService.createConversation(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.status(201).json({ success: true, data: conversation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Détail d'une conversation
router.get('/conversations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const conversation = await messagerieService.getConversation(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: conversation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Modifier une conversation
router.patch('/conversations/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateConversationSchema, req.body);
        const conversation = await messagerieService.updateConversation(
            req.params.id,
            dto,
            req.utilisateur!.id
        );
        res.json({ success: true, data: conversation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Ajouter un participant
router.post('/conversations/:id/participants', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(addParticipantSchema, req.body);
        await messagerieService.addParticipant(req.params.id, dto, req.utilisateur!.id);
        res.json({ success: true, message: 'Participant ajouté', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Retirer un participant
router.delete('/conversations/:id/participants/:userId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.removeParticipant(req.params.id, req.params.userId, req.utilisateur!.id);
        res.json({ success: true, message: 'Participant retiré', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Épingler une conversation
router.post('/conversations/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.pinConversation(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Conversation épinglée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Désépingler
router.delete('/conversations/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.unpinConversation(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Conversation désépinglée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Archiver
router.post('/conversations/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.archiveConversation(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Conversation archivée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Mute/Unmute
router.post('/conversations/:id/mute', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.muteConversation(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Notification conversation mise à jour', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Marquer tout comme lu
router.post('/conversations/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unreadCount = await messagerieService.markConversationAsRead(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: { unreadCount }, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Compteur non-lus global
router.get('/conversations/unread-count', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unreadCount = await messagerieService.countAllUnread(
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: { unreadCount }, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// MESSAGES
// ==================================

// Messages d'une conversation
router.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryMessagesSchema, req.query);
        const result = await messagerieService.getMessages(req.params.id, req.utilisateur!.id, query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Envoyer un message
router.post('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(sendMessageSchema, req.body);
        const message = await messagerieService.sendMessage(
            req.params.id,
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.status(201).json({ success: true, data: message, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Modifier un message
router.patch('/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(editMessageSchema, req.body);
        const message = await messagerieService.editMessage(req.params.id, dto.contenu, req.utilisateur!.id);
        res.json({ success: true, data: message, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Supprimer un message
router.delete('/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estChefEtablissement = req.utilisateur!.roles?.includes(Role.CHEF_ETABLISSEMENT) || false;
        await messagerieService.deleteMessage(req.params.id, req.utilisateur!.id, estChefEtablissement);
        res.json({ success: true, message: 'Message supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// RÉACTIONS
// ==================================

// Ajouter/toggle réaction
router.post('/messages/:id/reactions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(addReactionSchema, req.body);
        const reaction = await messageReactionService.addReaction(
            req.params.id,
            dto.emoji as EmojiReaction,
            req.utilisateur!.id
        );
        res.json({ success: true, data: reaction, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Supprimer réaction
router.delete('/messages/:id/reactions/:emoji', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messageReactionService.removeReaction(
            req.params.id,
            req.params.emoji as EmojiReaction,
            req.utilisateur!.id
        );
        res.json({ success: true, message: 'Réaction supprimée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Lister réactions
router.get('/messages/:id/reactions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reactions = await messageReactionService.getReactions(req.params.id);
        res.json({ success: true, data: reactions, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// READ STATUS
// ==================================

// Marquer message comme lu
router.post('/messages/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const readStatus = await messageReadService.markAsRead(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: readStatus, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Qui a lu le message
router.get('/messages/:id/read-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statuses = await messageReadService.getReadStatuses(req.params.id);
        res.json({ success: true, data: statuses, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// MENTIONS
// ==================================

// Mentions non lues
router.get('/mentions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const mentions = await messageMentionService.getUnreadMentions(
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: mentions, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Marquer mention comme lue
router.post('/mentions/:id/read', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messageMentionService.markMentionAsRead(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Mention marquée comme lue', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// TEMPLATES
// ==================================

// Lister templates
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.query.categorie as CategorieTemplate | undefined;
        const actif = req.query.actif === 'true';
        const templates = await templateMessageService.getTemplates(
            req.utilisateur!.etablissementId!,
            categorie,
            actif
        );
        res.json({ success: true, data: templates, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Créer template
router.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTemplateSchema, req.body);
        const template = await templateMessageService.createTemplate(
            dto.code,
            dto.titre,
            dto.contenu,
            dto.categorie as CategorieTemplate,
            req.utilisateur!.etablissementId!
        );
        res.status(201).json({ success: true, data: template, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Modifier template
router.patch('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTemplateSchema, req.body);
        const template = await templateMessageService.updateTemplate(
            req.params.id,
            dto,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: template, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Supprimer template
router.delete('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await templateMessageService.deleteTemplate(req.params.id, req.utilisateur!.etablissementId!);
        res.json({ success: true, message: 'Template supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Rendre template
router.post('/templates/:id/render', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(renderTemplateSchema, req.body);
        const templateRepo = (await import('@database/data-source')).AppDataSource.getRepository('TemplateMessage');
        const template = await templateRepo.findOne({
            where: { id: req.params.id, etablissementId: req.utilisateur!.etablissementId! },
        });
        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }
        const contenu = templateMessageService.renderTemplate(template, dto.variables);
        res.json({ success: true, data: { contenu }, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// RECHERCHE
// ==================================

// Rechercher messages
router.get('/search/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(searchMessagesSchema, req.query);
        const result = await messagerieSearchService.searchMessages(
            dto.q,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            {
                conversationId: dto.conversationId,
                dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
                dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
                typeContenu: dto.typeContenu,
                expediteurId: dto.expediteurId,
                page: dto.page,
                limit: dto.limit,
            }
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Rechercher conversations
router.get('/search/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(searchConversationsSchema, req.query);
        const result = await messagerieSearchService.searchConversations(
            dto.q,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            {
                type: dto.type,
                page: dto.page,
                limit: dto.limit,
            }
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// SSE STREAM
// ==================================

// Connexion SSE avec support reconnexion
router.get('/stream', async (req: Request, res: Response) => {
    try {
        const lastEventId = req.headers['last-event-id'] as string | undefined;
        const clientId = messagerieSSEService.addClient(req.utilisateur!.id, res, lastEventId);
        
        // Marquer en ligne
        await messagerieOnlineStatusService.setOnline(req.utilisateur!.id);
        
        logger.info(`SSE stream ouvert pour utilisateur ${req.utilisateur!.id}${lastEventId ? ' (reconnexion)' : ''}`);
    } catch (error) {
        logger.error('Erreur SSE stream:', error);
        res.status(500).json({ success: false, error: 'Échec connexion SSE' });
    }
});

// Heartbeat
router.post('/online/heartbeat', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieOnlineStatusService.refreshHeartbeat(req.utilisateur!.id);
        res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Statut en ligne des utilisateurs
router.get('/online/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userIds = (req.query.ids as string)?.split(',').filter(Boolean) || [];
        const onlineUsers = await messagerieOnlineStatusService.getOnlineUsers(userIds);
        res.json({ success: true, data: { onlineUsers }, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// FONCTIONNALITÉS AVANCÉES
// ==================================

// Transférer un message
router.post('/messages/:id/forward', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(forwardMessageSchema, req.body);
        const result = await messageForwardService.forwardMessage(
            req.params.id,
            dto.conversationIds,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            dto.commentaire
        );
        res.json({ 
            success: true, 
            data: {
                forwardCount: result.forwardCount,
                forwardedMessages: result.forwardedMessages,
            },
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Historique de transfert
router.get('/messages/:id/forward-history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const history = await messageForwardService.getForwardHistory(req.params.id);
        res.json({ success: true, data: history, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// BROUILLONS
// ==================================

// Sauvegarder un brouillon
router.post('/drafts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(saveDraftSchema, req.body);
        const draft = await messageDraftService.saveDraft(
            dto.conversationId,
            req.utilisateur!.id,
            dto.contenu,
            dto.piecesJointes
        );
        res.json({ success: true, data: draft, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Récupérer un brouillon
router.get('/drafts/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const draft = await messageDraftService.getDraft(
            req.params.conversationId,
            req.utilisateur!.id
        );
        res.json({ success: true, data: draft, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Supprimer un brouillon
router.delete('/drafts/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messageDraftService.deleteDraft(req.params.conversationId, req.utilisateur!.id);
        res.json({ success: true, message: 'Brouillon supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Tous les brouillons d'un utilisateur
router.get('/drafts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const drafts = await messageDraftService.getUserDrafts(req.utilisateur!.id);
        res.json({ success: true, data: drafts, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Stats brouillons
router.get('/drafts/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await messageDraftService.getStats(req.utilisateur!.id);
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// MESSAGES ÉPINGLÉS
// ==================================

// Épingler un message
router.post('/messages/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pinnedMessageService.pinMessage(
            req.params.id,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Détacher un message
router.delete('/messages/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await pinnedMessageService.unpinMessage(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Message détaché', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Messages épinglés d'une conversation
router.get('/conversations/:id/pinned', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pinned = await pinnedMessageService.getPinnedMessages(req.params.id);
        res.json({ success: true, data: pinned, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// STATISTIQUES ET ANALYTICS
// ==================================

// Statistiques globales établissement (Admin/Chef)
router.get('/stats/etablissement', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estAdmin = req.utilisateur!.roles?.includes(Role.ADMIN) || 
                        req.utilisateur!.roles?.includes(Role.SUPER_ADMIN) ||
                        req.utilisateur!.roles?.includes(Role.CHEF_ETABLISSEMENT);
        
        if (!estAdmin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        const stats = await messagerieStatsService.getEtablissementStats(
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Statistiques utilisateur
router.get('/stats/user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await messagerieStatsService.getUserStats(
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Statistiques des réactions
router.get('/stats/reactions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estAdmin = req.utilisateur!.roles?.includes(Role.ADMIN) || 
                        req.utilisateur!.roles?.includes(Role.SUPER_ADMIN);
        
        if (!estAdmin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        const stats = await messagerieStatsService.getReactionStats(
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Tendances d'utilisation
router.get('/stats/trends', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estAdmin = req.utilisateur!.roles?.includes(Role.ADMIN) || 
                        req.utilisateur!.roles?.includes(Role.SUPER_ADMIN);
        
        if (!estAdmin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        const trends = await messagerieStatsService.getUsageTrends(
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: trends, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// GESTION DU CACHE
// ==================================

// Statistiques du cache (Admin)
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estAdmin = req.utilisateur!.roles?.includes(Role.ADMIN) || 
                        req.utilisateur!.roles?.includes(Role.SUPER_ADMIN);
        
        if (!estAdmin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        const stats = await messagerieCacheService.getStats();
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Vider le cache utilisateur
router.post('/cache/clear/user', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieCacheService.invalidateUser(req.utilisateur!.id);
        res.json({ success: true, message: 'Cache utilisateur vidé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Vider tout le cache (Admin)
router.post('/cache/clear/all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const estAdmin = req.utilisateur!.roles?.includes(Role.ADMIN) || 
                        req.utilisateur!.roles?.includes(Role.SUPER_ADMIN);
        
        if (!estAdmin) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        await messagerieCacheService.clearAll();
        res.json({ success: true, message: 'Cache entièrement vidé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// MODÉRATION (Chef Établissement)
// ==================================

// Voir toutes conversations (modération)
router.get('/admin/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérification du rôle dans le handler
        if (!req.utilisateur!.roles?.includes(Role.CHEF_ETABLISSEMENT)) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        
        const conversationRepo = (await import('@database/data-source')).AppDataSource.getRepository('Conversation');
        const conversations = await conversationRepo.find({
            where: { etablissementId: req.utilisateur!.etablissementId! },
            order: { updatedAt: 'DESC' },
            take: 100,
        });
        res.json({ success: true, data: conversations, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// Supprimer message (modération)
router.delete('/admin/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.utilisateur!.roles?.includes(Role.CHEF_ETABLISSEMENT)) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        await messagerieService.deleteMessage(req.params.id, req.utilisateur!.id, true);
        res.json({ success: true, message: 'Message supprimé (modération)', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const messagerieController = router;
export default router;
