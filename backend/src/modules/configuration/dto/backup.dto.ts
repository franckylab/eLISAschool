/**
 * ==================================
 * eLISAschool - DTOs Backup & Storage
 * ==================================
 * Version: 1.0.0
 * 
 * DTOs pour la gestion des backups et configuration storage
 */

import { z } from 'zod';

/**
 * Schéma pour créer un backup
 */
export const createBackupSchema = z.object({
    etablissementId: z.string().uuid().optional().nullable(),
    backupType: z.enum(['config', 'database', 'full']).default('config'),
    version: z.string().max(100).optional(),
    retentionDays: z.number().int().min(1).max(3650).default(30),
    compress: z.boolean().default(true),
    encrypt: z.boolean().default(true),
    metadata: z.record(z.any()).optional(),
});

/**
 * Schéma pour restaurer un backup
 */
export const restoreBackupSchema = z.object({
    force: z.boolean().default(false),
    skipValidation: z.boolean().default(false),
});

/**
 * Schéma pour configurer le storage provider
 */
export const storageConfigSchema = z.object({
    provider: z.enum(['database', 's3', 'filesystem']),
    config: z.object({
        // Configuration S3
        bucket: z.string().min(3).max(255).optional(),
        region: z.string().max(50).optional(),
        endpoint: z.string().url().optional(),
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        
        // Configuration FileSystem
        basePath: z.string().optional(),
        
        // Options générales
        encryptionKey: z.string().min(32).optional(),
        compressionLevel: z.number().int().min(0).max(9).default(6),
    }).passthrough(),
});

/**
 * Schéma pour filtrer les backups
 */
export const filterBackupsSchema = z.object({
    etablissementId: z.string().uuid().optional().nullable(),
    backupType: z.enum(['config', 'database', 'full']).optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
});

/**
 * Schéma pour créer une planification de backup
 */
export const createScheduleSchema = z.object({
    etablissementId: z.string().uuid().optional().nullable(),
    backupType: z.enum(['config', 'database', 'full']),
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'custom']),
    cronExpression: z.string().max(100).optional(),
    retentionDays: z.number().int().min(1).max(3650).default(30),
    actif: z.boolean().default(true),
});

/**
 * Schéma pour mettre à jour une planification
 */
export const updateScheduleSchema = z.object({
    frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'custom']).optional(),
    cronExpression: z.string().max(100).optional(),
    retentionDays: z.number().int().min(1).max(3650).optional(),
    actif: z.boolean().optional(),
});

/**
 * Schéma pour cloner une configuration entre établissements
 */
export const cloneConfigSchema = z.object({
    sourceEtablissementId: z.string().uuid(),
    targetEtablissementIds: z.array(z.string().uuid()).min(1),
    options: z.object({
        includeModules: z.boolean().default(true),
        includeParametres: z.boolean().default(true),
        includeQuotas: z.boolean().default(true),
        conflictResolution: z.enum(['skip', 'overwrite', 'merge']).default('merge'),
        dryRun: z.boolean().default(false),
    }).default({}),
});

/**
 * Schéma pour importer une configuration
 */
export const importBackupConfigSchema = z.object({
    data: z.any(),
    etablissementId: z.string().uuid().optional().nullable(),
    options: z.object({
        conflictResolution: z.enum(['skip', 'overwrite', 'merge']).default('merge'),
        dryRun: z.boolean().default(false),
    }).default({}),
});

/**
 * Schéma pour propager un paramètre
 */
export const propagateParametreSchema = z.object({
    cle: z.string().max(255),
    valeur: z.any(),
    targetEtablissements: z.array(z.string().uuid()).optional(),
    options: z.object({
        mode: z.enum(['skipIfExists', 'overwrite', 'onlyIfNull']).default('skipIfExists'),
        dryRun: z.boolean().default(false),
    }).default({}),
});

// Types inférés
export type CreateBackupDto = z.infer<typeof createBackupSchema>;
export type RestoreBackupDto = z.infer<typeof restoreBackupSchema>;
export type StorageConfigDto = z.infer<typeof storageConfigSchema>;
export type FilterBackupsDto = z.infer<typeof filterBackupsSchema>;
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;
export type CloneConfigDto = z.infer<typeof cloneConfigSchema>;
export type ImportBackupConfigDto = z.infer<typeof importBackupConfigSchema>;
export type PropagateParametreDto = z.infer<typeof propagateParametreSchema>;

export default {
    createBackupSchema,
    restoreBackupSchema,
    storageConfigSchema,
    filterBackupsSchema,
    createScheduleSchema,
    updateScheduleSchema,
    cloneConfigSchema,
    importBackupConfigSchema,
    propagateParametreSchema,
};
