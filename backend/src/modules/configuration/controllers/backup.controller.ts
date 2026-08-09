/**
 * ==================================
 * eLISAschool - Controller Backup API
 * ==================================
 * Version: 1.0.0
 * 
 * Endpoints REST pour la gestion des backups,
 * planifications, clonage et monitoring.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { configBackupService } from '../services/backup/config-backup.service';
import { databaseBackupService } from '../services/backup/database-backup.service';
import { backupScheduler } from '../services/backup/backup-scheduler.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils';
import {
    createBackupSchema,
    restoreBackupSchema,
    filterBackupsSchema,
    cloneConfigSchema,
    importBackupConfigSchema,
    createDatabaseBackupSchema,
    createFullBackupSchema,
} from '../dto';
import { BackupType } from '../entities/backup-record.entity';

const router = Router();

// ============================================
// BACKUP MANAGEMENT
// ============================================

/**
 * POST /api/backups/config
 * Créer un backup de configuration
 */
router.post('/config', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createBackupSchema, req.body);
        
        // Vérifier les permissions multi-tenant
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? dto.etablissementId
            : req.etablissementId;

        const backup = await configBackupService.createSnapshot(etablissementId, {
            differential: false,
            compress: dto.compress,
            encrypt: dto.encrypt,
            retentionDays: dto.retentionDays,
            metadata: dto.metadata,
        });

        res.status(201).json({
            success: true,
            data: {
                id: backup.id,
                version: backup.version,
                size: (backup as any).getFormattedSize(),
                createdAt: backup.createdAt,
            },
            message: 'Backup de configuration créé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/database/:etablissementId
 * Créer un backup database d'un établissement
 */
router.post('/database/:etablissementId', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createDatabaseBackupSchema, req.body);

        const backup = await databaseBackupService.backupEtablissement(req.params.etablissementId, {
            compress: dto.compress,
            encrypt: dto.encrypt,
            retentionDays: dto.retentionDays,
        });

        res.status(201).json({
            success: true,
            data: {
                id: backup.id,
                version: backup.version,
                size: (backup as any).getFormattedSize(),
                createdAt: backup.createdAt,
                tables: backup.metadata?.tables || 0,
            },
            message: 'Backup database créé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/full/:etablissementId
 * Créer un backup complet (config + database)
 */
router.post('/full/:etablissementId', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createFullBackupSchema, req.body);

        // Backup config
        const configBackup = await configBackupService.createSnapshot(req.params.etablissementId, {
            compress: true,
            encrypt: true,
            retentionDays: dto.retentionDays,
        });

        // Backup database
        const dbBackup = await databaseBackupService.backupEtablissement(req.params.etablissementId, {
            compress: true,
            encrypt: true,
            retentionDays: dto.retentionDays,
        });

        res.status(201).json({
            success: true,
            data: {
                configBackup: {
                    id: configBackup.id,
                    size: (configBackup as any).getFormattedSize(),
                },
                databaseBackup: {
                    id: dbBackup.id,
                    size: (dbBackup as any).getFormattedSize(),
                },
            },
            message: 'Backup complet créé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backups
 * Lister les backups avec filtres
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(filterBackupsSchema, req.query);

        // Scopage multi-tenant
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? dto.etablissementId
            : req.etablissementId;

        const backups = await configBackupService['storageProvider'].list({
            etablissementId,
            backupType: dto.backupType,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            limit: dto.limit,
            offset: dto.offset,
        });

        res.json({
            success: true,
            data: backups.map(b => ({
                id: b.id,
                backupType: b.backupType,
                version: b.version,
                size: (b as any).getFormattedSize(),
                compressed: b.compressed,
                encrypted: b.encrypted,
                createdAt: b.createdAt,
                retentionUntil: b.retentionUntil,
            })),
            total: backups.length,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backups/:id
 * Détails d'un backup
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const backups = await configBackupService['storageProvider'].list();
        const backup = backups.find(b => b.id === req.params.id);

        if (!backup) {
            throw new AppError('Backup non trouvé', 404, 'BACKUP_NOT_FOUND');
        }

        res.json({
            success: true,
            data: {
                id: backup.id,
                etablissementId: backup.etablissementId,
                backupType: backup.backupType,
                version: backup.version,
                checksum: backup.checksum,
                storageProvider: backup.storageProvider,
                size: (backup as any).getFormattedSize(),
                compressed: backup.compressed,
                encrypted: backup.encrypted,
                metadata: backup.metadata,
                retentionUntil: backup.retentionUntil,
                createdAt: backup.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/:id/restore
 * Restaurer un backup
 */
router.post('/:id/restore', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(restoreBackupSchema, req.body);
        const { force = false } = dto;

        // Déterminer le type de backup à restaurer
        const backups = await configBackupService['storageProvider'].list();
        const backup = backups.find(b => b.id === req.params.id);

        if (!backup) {
            throw new AppError('Backup non trouvé', 404, 'BACKUP_NOT_FOUND');
        }

        if (backup.backupType === BackupType.CONFIG) {
            await configBackupService.restoreBackup(req.params.id, force);
        } else if (backup.backupType === BackupType.DATABASE) {
            await databaseBackupService.restoreBackup(req.params.id, force);
        } else {
            throw new AppError('Type de backup non supporté pour restauration', 400, 'UNSUPPORTED_BACKUP_TYPE');
        }

        res.json({
            success: true,
            message: 'Backup restauré avec succès',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/:id/verify
 * Vérifier l'intégrité d'un backup
 */
router.post('/:id/verify', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const integrity = await databaseBackupService.verifyBackupIntegrity(req.params.id);

        res.json({
            success: integrity.valid,
            data: {
                valid: integrity.valid,
                error: integrity.error || null,
            },
            message: integrity.valid ? 'Intégrité vérifiée' : `Échec: ${integrity.error}`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/backups/:id
 * Supprimer un backup
 */
router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await configBackupService['storageProvider'].delete(req.params.id);

        res.json({
            success: true,
            message: 'Backup supprimé avec succès',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// CONFIGURATION CLONING
// ============================================

/**
 * POST /api/configuration/clone
 * Cloner la configuration entre établissements
 */
router.post('/clone', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(cloneConfigSchema, req.body);

        const results = await configBackupService.cloneConfiguration(
            dto.sourceEtablissementId,
            dto.targetEtablissementIds,
            dto.options
        );

        const successCount = results.filter(r => r.success).length;
        const totalItems = results.reduce((sum, r) => sum + r.itemsCloned, 0);

        res.json({
            success: successCount > 0,
            data: {
                results,
                summary: {
                    total: results.length,
                    success: successCount,
                    failed: results.length - successCount,
                    totalItemsCloned: totalItems,
                },
            },
            message: `${successCount}/${results.length} établissements clonés avec succès`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/configuration/import
 * Importer une configuration
 */
router.post('/import', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(importBackupConfigSchema, req.body);
        const { dryRun = false } = dto.options;

        // TODO: Implémenter l'import complet
        res.json({
            success: true,
            data: {
                dryRun,
                message: dryRun ? 'Mode dry-run: aucune modification' : 'Configuration importée',
            },
            message: 'Import de configuration effectué',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/configuration/export
 * Exporter une configuration
 */
router.post('/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.role === Role.SUPER_ADMIN
            ? (req.query.etablissementId as string)
            : req.etablissementId;

        const snapshot = await configBackupService['collectSnapshot'](etablissementId);

        res.json({
            success: true,
            data: snapshot,
            message: 'Configuration exportée',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================
// MONITORING
// ============================================

/**
 * GET /api/backups/metrics/summary
 * Métriques globales des backups
 */
router.get('/metrics/summary', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usage = await configBackupService['storageProvider'].getStorageUsage();

        res.json({
            success: true,
            data: {
                totalBackups: usage.backupCount,
                totalSize: `${(usage.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
                byType: usage.byType,
                byEtablissement: usage.byEtablissement,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backups/metrics/:etablissementId
 * Métriques par établissement
 */
router.get('/metrics/:etablissementId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const backups = await configBackupService['storageProvider'].list({
            etablissementId: req.params.etablissementId,
        });

        const totalSize = backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);

        res.json({
            success: true,
            data: {
                etablissementId: req.params.etablissementId,
                totalBackups: backups.length,
                totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
                byType: {
                    config: backups.filter(b => b.backupType === BackupType.CONFIG).length,
                    database: backups.filter(b => b.backupType === BackupType.DATABASE).length,
                    full: backups.filter(b => b.backupType === BackupType.FULL).length,
                },
                latestBackup: backups.length > 0 ? backups[0].createdAt : null,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backups/storage-usage
 * Usage du stockage
 */
router.get('/storage-usage', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usage = await configBackupService['storageProvider'].getStorageUsage();

        res.json({
            success: true,
            data: {
                totalBytes: usage.totalBytes,
                totalFormatted: `${(usage.totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                backupCount: usage.backupCount,
                byType: usage.byType,
                byEtablissement: usage.byEtablissement,
            },
        });
    } catch (error) {
        next(error);
    }
});

export const backupController = router;

// ============================================
// SCHEDULE MANAGEMENT — Phase P2 v6
// ============================================

/**
 * GET /api/backups/schedule
 * Récupérer la planification des backups pour l'établissement courant
 */
router.get('/schedule', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT_ID');
        }

        const schedule = backupScheduler.getSchedule(etablissementId);

        res.json({
            success: true,
            data: schedule || null,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/schedule
 * Créer ou mettre à jour la planification des backups
 */
router.post('/schedule', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT_ID');
        }

        const schedule = {
            ...req.body,
            etablissementId,
        };

        await backupScheduler.setSchedule(schedule);

        res.status(200).json({
            success: true,
            message: 'Planification des backups enregistrée',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backups/trigger
 * Déclencher un backup immédiat
 */
router.post('/trigger', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'MISSING_ETABLISSEMENT_ID');
        }

        const { type = 'complet' } = req.body;

        const result = await backupScheduler.executerBackup(etablissementId, type);

        res.status(200).json({
            success: result.succes,
            data: result,
            message: result.succes ? 'Backup déclenché avec succès' : 'Échec du backup',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
