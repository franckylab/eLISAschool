/**
 * ==================================
 * eLISAschool - DTOs Messagerie Complets
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Schémas Zod pour validation de toutes les requêtes du module messagerie
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

// ==================================
// ENUMS
// ==================================

export const typeConversationSchema = z.enum(['INDIVIDUELLE', 'GROUPE', 'CLASSE', 'FAMILLE']);
export const prioriteMessageSchema = z.enum(['normal', 'important', 'urgent']);
export const typeContenuMessageSchema = z.enum(['text', 'image', 'document', 'systeme']);
export const emojiReactionSchema = z.enum(['like', 'love', 'rire', 'triste', 'colere', 'pouce_haut']);
export const categorieTemplateSchema = z.enum(['absence', 'retard', 'discipline', 'info_generale', 'convocation']);

// ==================================
// CONVERSATIONS
// ==================================

export const createConversationSchema = z.object({
    titre: z.string().max(255).optional(),
    type: typeConversationSchema.default('INDIVIDUELLE'),
    participantsIds: z.array(z.string().uuid()).min(1, 'Au moins un participant requis'),
});

export const updateConversationSchema = z.object({
    titre: z.string().max(255).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export const queryConversationsSchema = paginationSchema.extend({
    type: typeConversationSchema.optional(),
    archive: z.string().transform(val => val === 'true').optional(),
    search: z.string().max(200).optional(),
});

export const addParticipantSchema = z.object({
    utilisateurId: z.string().uuid(),
    estAdmin: z.boolean().default(false),
});

// ==================================
// MESSAGES
// ==================================

export const pieceJointeSchema = z.object({
    nom: z.string().max(255),
    url: z.string().url(),
    type: z.string().max(100),
    taille: z.number().int().positive(),
});

export const mentionSchema = z.object({
    userId: z.string().uuid(),
    position: z.number().int().nonnegative(),
});

export const sendMessageSchema = z.object({
    contenu: z.string().min(1, 'Le message ne peut pas être vide').max(5000, 'Message trop long (max 5000 caractères)'),
    typeContenu: typeContenuMessageSchema.default('text'),
    priorite: prioriteMessageSchema.default('normal'),
    piecesJointes: z.array(pieceJointeSchema).optional(),
    reponseA: z.string().uuid().optional(),
    mentions: z.array(mentionSchema).optional(),
});

export const editMessageSchema = z.object({
    contenu: z.string().min(1, 'Le message ne peut pas être vide').max(5000, 'Message trop long (max 5000 caractères)'),
});

export const queryMessagesSchema = paginationSchema.extend({
    cursor: z.string().uuid().optional(),
    direction: z.enum(['before', 'after']).default('after'),
    avant: z.string().datetime().optional(),
});

// ==================================
// RÉACTIONS
// ==================================

export const addReactionSchema = z.object({
    emoji: emojiReactionSchema,
});

// ==================================
// TEMPLATES
// ==================================

export const createTemplateSchema = z.object({
    code: z.string().min(2).max(50),
    titre: z.string().min(2).max(200),
    contenu: z.string().min(10),
    categorie: categorieTemplateSchema,
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const renderTemplateSchema = z.object({
    variables: z.record(z.string(), z.string()),
});

export const queryTemplatesSchema = paginationSchema.extend({
    categorie: categorieTemplateSchema.optional(),
    actif: z.string().transform(val => val === 'true').optional(),
});

// ==================================
// RECHERCHE
// ==================================

export const searchMessagesSchema = paginationSchema.extend({
    q: z.string().min(1).max(200),
    conversationId: z.string().uuid().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    typeContenu: typeContenuMessageSchema.optional(),
    expediteurId: z.string().uuid().optional(),
});

export const searchConversationsSchema = paginationSchema.extend({
    q: z.string().min(1).max(200),
    type: typeConversationSchema.optional(),
});

// ==================================
// FICHIERS
// ==================================

export const validateFileSchema = z.object({
    taille: z.number().int().positive(),
    typeMime: z.string().max(100),
    nomFichier: z.string().max(255),
});

// ==================================
// FONCTIONNALITÉS AVANCÉES
// ==================================

export const forwardMessageSchema = z.object({
    messageId: z.string().uuid(),
    conversationIds: z.array(z.string().uuid()).min(1, 'Au moins une conversation requise').max(10, 'Maximum 10 conversations'),
    commentaire: z.string().max(500).optional(),
});

export const saveDraftSchema = z.object({
    conversationId: z.string().uuid(),
    contenu: z.string().min(1).max(5000),
    piecesJointes: z.array(pieceJointeSchema).optional(),
});

export const pinMessageSchema = z.object({
    messageId: z.string().uuid(),
});

export const markMultipleReadSchema = z.object({
    messageIds: z.array(z.string().uuid()).min(1).max(100),
});

// ==================================
// TYPES INFÉRÉS
// ==================================

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;
export type QueryConversationsDto = z.infer<typeof queryConversationsSchema>;
export type AddParticipantDto = z.infer<typeof addParticipantSchema>;

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type EditMessageDto = z.infer<typeof editMessageSchema>;
export type QueryMessagesDto = z.infer<typeof queryMessagesSchema>;
export type PieceJointeDto = z.infer<typeof pieceJointeSchema>;
export type MentionDto = z.infer<typeof mentionSchema>;

export type AddReactionDto = z.infer<typeof addReactionSchema>;

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateDto = z.infer<typeof renderTemplateSchema>;
export type QueryTemplatesDto = z.infer<typeof queryTemplatesSchema>;

export type SearchMessagesDto = z.infer<typeof searchMessagesSchema>;
export type SearchConversationsDto = z.infer<typeof searchConversationsSchema>;

export type ValidateFileDto = z.infer<typeof validateFileSchema>;

export type ForwardMessageDto = z.infer<typeof forwardMessageSchema>;
export type SaveDraftDto = z.infer<typeof saveDraftSchema>;
export type PinMessageDto = z.infer<typeof pinMessageSchema>;
export type MarkMultipleReadDto = z.infer<typeof markMultipleReadSchema>;
