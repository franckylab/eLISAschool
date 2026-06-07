/**
 * ==================================
 * eLISAschool - DTOs Monitoring
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';

/**
 * Schéma pour activer/désactiver le mode maintenance
 */
export const maintenanceSchema = z.object({
    enabled: z.boolean({
        required_error: 'Le paramètre "enabled" est requis et doit être un booléen',
        invalid_type_error: 'Le paramètre "enabled" doit être un booléen',
    }),
});

/**
 * Schéma pour la requête de logs
 */
export const queryLogsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export type MaintenanceDto = z.infer<typeof maintenanceSchema>;
export type QueryLogsDto = z.infer<typeof queryLogsSchema>;
