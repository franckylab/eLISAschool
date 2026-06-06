/**
 * ==================================
 * eLISAschool - DTOs Messagerie
 * ==================================
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

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

export const queryConversationsSchema = paginationSchema.extend({
    type: z.enum(['INDIVIDUELLE', 'GROUPE', 'ANNONCE']).optional(),
});

export const queryMessagesSchema = paginationSchema.extend({
    avant: z.string().datetime().optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type QueryConversationsDto = z.infer<typeof queryConversationsSchema>;
export type QueryMessagesDto = z.infer<typeof queryMessagesSchema>;
