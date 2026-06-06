/**
 * ==================================
 * eLISAschool - DTOs Notifications
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

/**
 * Schéma de création de notification
 */
export const createNotificationSchema = z.object({
    destinataireId: z.string().uuid(),
    titre: z.string().min(1).max(255),
    contenu: z.string().min(1),
    type: z.enum(['PUSH', 'EMAIL', 'IN_APP', 'SMS']).default('IN_APP'),
    priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
    categorie: z.string().max(100).optional(),
    lienAction: z.string().max(500).optional(),
    metadata: z.record(z.any()).optional(),
    programmeePour: z.string().datetime().optional(),
});

/**
 * Schéma de notification de masse
 */
export const createBulkNotificationSchema = z.object({
    destinatairesIds: z.array(z.string().uuid()).min(1),
    titre: z.string().min(1).max(255),
    contenu: z.string().min(1),
    type: z.enum(['PUSH', 'EMAIL', 'IN_APP', 'SMS']).default('IN_APP'),
    priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
    categorie: z.string().max(100).optional(),
});

/**
 * Schéma de filtrage des notifications
 */
export const queryNotificationsSchema = paginationSchema.extend({
    statut: z.enum(['EN_ATTENTE', 'ENVOYEE', 'LUE', 'ECHEC']).optional(),
    type: z.enum(['PUSH', 'EMAIL', 'IN_APP', 'SMS']).optional(),
    categorie: z.string().optional(),
    nonLues: z.string().transform((v) => v === 'true').optional(),
});

// Types inférés
export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type CreateBulkNotificationDto = z.infer<typeof createBulkNotificationSchema>;
export type QueryNotificationsDto = z.infer<typeof queryNotificationsSchema>;

export default {
    createNotificationSchema,
    createBulkNotificationSchema,
    queryNotificationsSchema,
};
