/**
 * ==================================
 * eLISAschool - Service Database Backup
 * ==================================
 * Version: 1.0.0
 * 
 * Service de sauvegarde database-level par établissement
 * utilisant l'export TypeORM pur (sans pg_dump).
 */

import { Repository } from 'typeorm';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { AppDataSource } from '@database/data-source';
import { BackupRecord, BackupType, StorageProvider } from '../../entities/backup-record.entity';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';
import { DatabaseStorageProvider } from '../storage/database-storage.provider';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Tables multi-tenant (avec colonne "etablissementId" camelCase TypeORM)
 * Seules les tables existantes ET scopées multi-tenant sont listées.
 */
const TENANT_TABLES = [
    'eleves',
    'classes',
    'annees_scolaires',
    'notes',
    'bulletins',
    'membres_personnel',
    'clubs',
    'materiels',
    'sondages',
    'annonces',
    'heures_cours',
    'factures',
    'paiements',
    'parametres_systeme',
    'abonnements_client',
    'usage_meters',
    'transactions_ledger',
];

/**
 * Service de backup database par établissement
 */
export class DatabaseBackupService {
    private backupRepo: Repository<BackupRecord>;
    private storageProvider: DatabaseStorageProvider;

    constructor() {
        this.backupRepo = AppDataSource.getRepository(BackupRecord);
        this.storageProvider = new DatabaseStorageProvider();
    }

    /**
     * Exporte les données d'un établissement
     */
    async exportEtablissementData(etablissementId: string): Promise<Record<string, any[]>> {
        const exportData: Record<string, any[]> = {};

        for (const table of TENANT_TABLES) {
            try {
                const rows = await AppDataSource.query(
                    `SELECT * FROM "${table}" WHERE "etablissementId" = $1`,
                    [etablissementId]
                );
                exportData[table] = rows;
                logger.debug(`Exporté ${rows.length} lignes de ${table}`);
            } catch (error) {
                logger.warn(`Échec export table ${table}: ${error}`);
                exportData[table] = [];
            }
        }

        return exportData;
    }

    /**
     * Crée un backup database d'un établissement
     */
    async backupEtablissement(
        etablissementId: string,
        options: { compress?: boolean; encrypt?: boolean; retentionDays?: number } = {}
    ): Promise<BackupRecord> {
        const { compress = true, encrypt = false, retentionDays = 90 } = options;

        logger.info(`Backup database établissement: ${etablissementId}`);

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Exporter les données
            const data = await this.exportEtablissementData(etablissementId);

            // 2. Sérialiser
            const serialized = JSON.stringify({
                timestamp: new Date().toISOString(),
                etablissementId,
                tables: Object.keys(data).length,
                data,
            });

            // 3. Compresser
            let buffer = Buffer.from(serialized, 'utf-8');
            let compressed = false;
            if (compress) {
                buffer = await gzipAsync(buffer);
                compressed = true;
            }

            // 4. Chiffrer si demandé
            let encrypted = false;
            if (encrypt) {
                const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
                if (!encryptionKey || encryptionKey.length < 32) {
                    throw new AppError('Clé de chiffrement invalide ou manquante', 500, 'INVALID_ENCRYPTION_KEY');
                }

                const iv = randomBytes(16);
                const key = Buffer.from(encryptionKey.substring(0, 32), 'utf-8');
                const cipher = createCipheriv('aes-256-gcm', key, iv);
                
                let encryptedData = cipher.update(buffer);
                encryptedData = Buffer.concat([encryptedData, cipher.final()]);
                
                const authTag = cipher.getAuthTag();
                buffer = Buffer.concat([iv, authTag, encryptedData]);
                encrypted = true;
            }

            // 5. Calculer checksum
            const checksum = createHash('sha256').update(buffer).digest('hex');

            // 6. Calculer rétention
            const retentionUntil = retentionDays
                ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
                : undefined;

            // 7. Sauvegarder
            const backupRecord = await this.storageProvider.save(buffer, {
                etablissementId,
                backupType: BackupType.DATABASE,
                version: new Date().toISOString(),
                checksum,
                encrypted,
                compressed,
                size: buffer.length,
                createdAt: new Date(),
                retentionUntil,
                metadata: {
                    etablissementId,
                    tables: Object.keys(data).length,
                },
            }) as BackupRecord;

            await queryRunner.commitTransaction();

            logger.info(`Backup database créé: ${backupRecord.id} (${(backupRecord as any).getFormattedSize()})`);

            return backupRecord;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Restaure un backup database
     */
    async restoreBackup(backupId: string, force: boolean = false): Promise<void> {
        const backup = await this.backupRepo.findOne({
            where: { id: backupId, backupType: BackupType.DATABASE },
        });

        if (!backup) {
            throw new AppError('Backup database non trouvé', 404, 'BACKUP_NOT_FOUND');
        }

        if (!backup.etablissementId) {
            throw new AppError('Backup database doit être scopé à un établissement', 400, 'INVALID_BACKUP_SCOPE');
        }

        // Charger et déchiffrer
        const data = await this.loadAndDecryptBackup(backup);

        // Restaurer dans une transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await this.restoreDataToDatabase(data, backup.etablissementId!, queryRunner, force);
            await queryRunner.commitTransaction();
            logger.info(`Backup restauré: ${backupId} pour établissement ${backup.etablissementId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Charge et déchiffre un backup
     */
    private async loadAndDecryptBackup(backup: BackupRecord): Promise<any> {
        const buffer = await this.storageProvider.load(backup.id);

        let data = buffer;

        // Déchiffrer si nécessaire
        if (backup.encrypted) {
            const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
            if (!encryptionKey || encryptionKey.length < 32) {
                throw new AppError('Clé de chiffrement invalide ou manquante', 500, 'INVALID_ENCRYPTION_KEY');
            }

            const iv = buffer.subarray(0, 16);
            const authTag = buffer.subarray(16, 32);
            const encryptedData = buffer.subarray(32);

            const key = Buffer.from(encryptionKey.substring(0, 32), 'utf-8');
            const decipher = createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            data = decrypted;
        }

        // Décompresser si nécessaire
        if (backup.compressed) {
            data = await gunzipAsync(data);
        }

        return JSON.parse(data.toString('utf-8'));
    }

    /**
     * Restaure les données dans la base
     */
    private async restoreDataToDatabase(
        data: any,
        etablissementId: string,
        queryRunner: any,
        force: boolean
    ): Promise<void> {
        if (!data.data) {
            throw new AppError('Données de backup invalides', 400, 'INVALID_BACKUP_DATA');
        }

        for (const [table, rows] of Object.entries(data.data)) {
            if (!Array.isArray(rows) || rows.length === 0) continue;

            try {
                // Supprimer les données existantes si force
                if (force) {
                    await queryRunner.query(
                        `DELETE FROM "${table}" WHERE "etablissementId" = $1`,
                        [etablissementId]
                    );
                }

                // Insérer les nouvelles données
                for (const row of rows) {
                    const columns = Object.keys(row).filter(k => k !== 'id');
                    const values = columns.map((k, i) => `$${i + 1}`).join(', ');
                    const columnNames = columns.map(c => `"${c}"`).join(', ');
                    const columnValues = columns.map(k => row[k]);

                    await queryRunner.query(
                        `INSERT INTO "${table}" (${columnNames}, "etablissementId") VALUES (${values}, $${columns.length + 1})`,
                        [...columnValues, etablissementId]
                    );
                }

                logger.debug(`Restauré ${rows.length} lignes dans ${table}`);
            } catch (error) {
                logger.error(`Échec restauration table ${table}: ${error}`);
                if (!force) {
                    throw error;
                }
            }
        }
    }

    /**
     * Vérifie l'intégrité d'un backup
     */
    async verifyBackupIntegrity(backupId: string): Promise<{ valid: boolean; error?: string }> {
        try {
            const backup = await this.backupRepo.findOne({ where: { id: backupId } });
            if (!backup) {
                return { valid: false, error: 'Backup non trouvé' };
            }

            const buffer = await this.storageProvider.load(backupId);
            const checksum = createHash('sha256').update(buffer).digest('hex');

            if (checksum !== backup.checksum) {
                return { valid: false, error: 'Checksum ne correspond pas' };
            }

            return { valid: true };
        } catch (error: any) {
            return { valid: false, error: error.message };
        }
    }
}

export const databaseBackupService = new DatabaseBackupService();
export default DatabaseBackupService;
