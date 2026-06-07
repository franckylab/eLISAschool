/**
 * ==================================
 * eLISAschool - DTOs Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Schémas Zod pour la validation des providers de notifications
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

/**
 * Schéma de création d'un provider
 */
export const createNotificationProviderSchema = z.object({
    nom: z.string().min(2).max(100),
    type: z.enum(['PUSH', 'EMAIL', 'IN_APP', 'SMS']),
    service: z.enum([
        'nodemailer', 'sendgrid', 'mailgun', 'aws-ses',
        'twilio', 'vonage', 'africas-talking', 'ovh-sms',
        'firebase-fcm', 'onesignal',
        'in-app'
    ]),
    actif: z.boolean().default(true),
    estDefaut: z.boolean().default(false),
    configuration: z.record(z.any()),
    quotaJournalier: z.number().int().min(0).default(0),
    priorite: z.number().int().min(1).default(1),
    etablissementId: z.string().uuid().optional(),
    description: z.string().max(500).optional(),
});

/**
 * Schéma de mise à jour d'un provider
 */
export const updateNotificationProviderSchema = createNotificationProviderSchema
    .partial()
    .omit({ type: true, service: true }); // Type et service immuables

/**
 * Schéma pour tester un provider
 */
export const testNotificationProviderSchema = z.object({
    configuration: z.record(z.any()),
});

/**
 * Schéma pour définir un provider par défaut
 */
export const setDefaultProviderSchema = z.object({
    providerId: z.string().uuid(),
});

/**
 * Schéma de filtrage des providers
 */
export const queryNotificationProvidersSchema = paginationSchema.extend({
    type: z.enum(['PUSH', 'EMAIL', 'IN_APP', 'SMS']).optional(),
    service: z.string().optional(),
    actif: z.string().transform((v) => v === 'true').optional(),
    etablissementId: z.string().uuid().optional(),
});

// Types inférés
export type CreateNotificationProviderDto = z.infer<typeof createNotificationProviderSchema>;
export type UpdateNotificationProviderDto = z.infer<typeof updateNotificationProviderSchema>;
export type TestNotificationProviderDto = z.infer<typeof testNotificationProviderSchema>;
export type QueryNotificationProvidersDto = z.infer<typeof queryNotificationProvidersSchema>;

export default {
    createNotificationProviderSchema,
    updateNotificationProviderSchema,
    testNotificationProviderSchema,
    setDefaultProviderSchema,
    queryNotificationProvidersSchema,
};
