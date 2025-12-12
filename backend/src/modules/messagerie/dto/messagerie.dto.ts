/**
 * ==================================
 * eLISAschool - DTOs Messagerie
 * ==================================
 */

import { z } from 'zod';

export const createConversationSchema = z.object({
    titre: z.string().max(255).optional(),
    type: z.enum(['INDIVIDUELLE', 'GROUPE', 'ANNONCE']).default('INDIVIDUELLE'),
    participantsIds: z.array(z.string().uuid()).min(1),
});

export const sendMessageSchema = z.object({
    contenu: z.string().min(1),
    typeContenu: z.enum(['text', 'image', 'file', 'audio']).default('text'),
    piecesJointes: z.array(z.object({
        nom: z.string(),
        url: z.string().url(),
        type: z.string(),
        taille: z.number(),
    })).optional(),
});

export const queryConversationsSchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    type: z.enum(['INDIVIDUELLE', 'GROUPE', 'ANNONCE']).optional(),
});

export const queryMessagesSchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
    avant: z.string().datetime().optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type QueryConversationsDto = z.infer<typeof queryConversationsSchema>;
export type QueryMessagesDto = z.infer<typeof queryMessagesSchema>;
