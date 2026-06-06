/**
 * ==================================
 * eLISAschool - Database Storage Provider
 * ==================================
 * Version: 1.0.0
 * 
 * Implémentation du stockage de backups dans la base de données
 * via une table dédiée backup_data.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    IBackupStorage,
    BackupMetadata,
    BackupRecord,
    BackupFilter,
    StorageUsage,
    BackupType,
} from './storage-provider.interface';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';

/**
 * Entité pour stocker les données de backup en base
 */
interface BackupDataEntity {
    id: string;
    backupRecordId: string;
    data: Buffer;
    createdAt: Date;
}

/**
 * Provider de stockage utilisant la base de données
 */
export class DatabaseStorageProvider implements IBackupStorage {
    readonly name = 'database';
    
    private backupDataRepo: Repository<any>;

    constructor() {
        // Note: La table backup_data sera créée par migration
        this.backupDataRepo = AppDataSource.getRepository('backup_data');
    }

    /**
     * Sauvegarde les données dans la base
     */
    async save(data: Buffer, metadata: BackupMetadata): Promise<BackupRecord> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Créer l'enregistrement de backup
            const backupRecordRepo = queryRunner.manager.getRepository('backup_records');
            
            const backupRecord = await backupRecordRepo.create({
                etablissementId: metadata.etablissementId || null,
                backupType: metadata.backupType,
                version: metadata.version,
                checksum: metadata.checksum,
                storageProvider: 'database',
                storageKey: `db://${metadata.backupType}/${metadata.version}`,
                encrypted: metadata.encrypted,
                compressed: metadata.compressed,
                sizeBytes: metadata.size,
                metadata: metadata.metadata,
                retentionUntil: metadata.retentionUntil,
                createdAt: metadata.createdAt,
            });

            const savedRecord = await backupRecordRepo.save(backupRecord);

            // 2. Stocker les données du backup
            const backupData = this.backupDataRepo.create({
                backupRecordId: savedRecord.id,
                data: data,
                createdAt: new Date(),
            });

            await this.backupDataRepo.save(backupData);

            await queryRunner.commitTransaction();

            logger.debug(`Backup sauvegardé en DB: ${savedRecord.id} (${metadata.size} bytes)`);

            return savedRecord as unknown as BackupRecord;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Charge les données d'un backup
     */
    async load(recordId: string): Promise<Buffer> {
        const backupData = await this.backupDataRepo.findOne({
            where: { backupRecordId: recordId },
        });

        if (!backupData) {
            throw new AppError('Données de backup non trouvées', 404, 'BACKUP_DATA_NOT_FOUND');
        }

        return backupData.data as Buffer;
    }

    /**
     * Supprime un backup et ses données
     */
    async delete(recordId: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Supprimer les données
            await this.backupDataRepo.delete({ backupRecordId: recordId });

            // Supprimer l'enregistrement (soft delete)
            const backupRecordRepo = queryRunner.manager.getRepository('backup_records');
            await backupRecordRepo.softDelete({ id: recordId });

            await queryRunner.commitTransaction();
            logger.debug(`Backup supprimé: ${recordId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Liste les backups avec filtres
     */
    async list(filter?: BackupFilter): Promise<BackupRecord[]> {
        const backupRecordRepo = AppDataSource.getRepository('backup_records');
        const qb = backupRecordRepo.createQueryBuilder('b')
            .where('b.deletedAt IS NULL')
            .orderBy('b.createdAt', 'DESC');

        if (filter?.etablissementId !== undefined) {
            if (filter.etablissementId === null) {
                qb.andWhere('b.etablissementId IS NULL');
            } else {
                qb.andWhere('b.etablissementId = :etablissementId', {
                    etablissementId: filter.etablissementId,
                });
            }
        }

        if (filter?.backupType) {
            qb.andWhere('b.backupType = :backupType', { backupType: filter.backupType });
        }

        if (filter?.dateDebut) {
            qb.andWhere('b.createdAt >= :dateDebut', { dateDebut: filter.dateDebut });
        }

        if (filter?.dateFin) {
            qb.andWhere('b.createdAt <= :dateFin', { dateFin: filter.dateFin });
        }

        if (filter?.limit) {
            qb.limit(filter.limit);
        }

        if (filter?.offset) {
            qb.offset(filter.offset);
        }

        return qb.getMany() as unknown as BackupRecord[];
    }

    /**
     * Retourne l'utilisation du stockage
     */
    async getStorageUsage(): Promise<StorageUsage> {
        const backupRecordRepo = AppDataSource.getRepository('backup_records');
        
        // Statistiques globales
        const stats = await backupRecordRepo
            .createQueryBuilder('b')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(b.sizeBytes), 0)', 'totalBytes')
            .where('b.deletedAt IS NULL')
            .getRawOne();

        // Par type
        const byTypeRaw = await backupRecordRepo
            .createQueryBuilder('b')
            .select('b.backupType', 'type')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(b.sizeBytes), 0)', 'bytes')
            .where('b.deletedAt IS NULL')
            .groupBy('b.backupType')
            .getRawMany();

        // Par établissement
        const byEtablissementRaw = await backupRecordRepo
            .createQueryBuilder('b')
            .select('COALESCE(b.etablissementId, \'global\')', 'etablissementId')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(b.sizeBytes), 0)', 'bytes')
            .where('b.deletedAt IS NULL')
            .groupBy('b.etablissementId')
            .getRawMany();

        const byType: Record<BackupType, { bytes: number; count: number }> = {
            config: { bytes: 0, count: 0 },
            database: { bytes: 0, count: 0 },
            full: { bytes: 0, count: 0 },
        };

        for (const row of byTypeRaw) {
            byType[row.type as BackupType] = {
                bytes: parseInt(row.bytes),
                count: parseInt(row.count),
            };
        }

        const byEtablissement: Record<string, { bytes: number; count: number }> = {};
        for (const row of byEtablissementRaw) {
            byEtablissement[row.etablissementId] = {
                bytes: parseInt(row.bytes),
                count: parseInt(row.count),
            };
        }

        return {
            totalBytes: parseInt(stats.totalBytes),
            backupCount: parseInt(stats.count),
            byType,
            byEtablissement,
        };
    }

    /**
     * Teste la connectivité
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.backupDataRepo.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Nettoie les backups expirés
     */
    async cleanupExpiredBackups(): Promise<number> {
        const backupRecordRepo = AppDataSource.getRepository('backup_records');
        
        const expiredBackups = await backupRecordRepo
            .createQueryBuilder('b')
            .where('b.retentionUntil IS NOT NULL')
            .andWhere('b.retentionUntil < NOW()')
            .andWhere('b.deletedAt IS NULL')
            .getMany();

        let cleaned = 0;

        for (const backup of expiredBackups) {
            try {
                await this.delete(backup.id);
                cleaned++;
            } catch (error) {
                logger.warn(`Échec suppression backup expiré ${backup.id}: ${error}`);
            }
        }

        logger.info(`Nettoyage backups expirés: ${cleaned} supprimés`);
        return cleaned;
    }
}
