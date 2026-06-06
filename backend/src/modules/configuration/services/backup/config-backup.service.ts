/**
 * ==================================
 * eLISAschool - Service ConfigBackup
 * ==================================
 * Version: 1.0.0
 * 
 * Service de sauvegarde et restauration de configuration
 * avec versioning sémantique, backups différentiels,
 * et clonage inter-établissements.
 */

import { Repository, IsNull } from 'typeorm';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { AppDataSource } from '@database/data-source';
import {
    BackupRecord,
    BackupType,
    StorageProvider,
} from '../../entities/backup-record.entity';
import { ParametreVersion } from '../../entities/parametre-version.entity';
import { ConfigurationApp } from '../../entities/configuration-app.entity';
import { ConfigurationModule } from '../../entities/configuration-module.entity';
import { ParametreSysteme } from '../../entities/parametre-systeme.entity';
import { EtablissementConfig } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';
import { IBackupStorage, BackupMetadata } from '../storage/storage-provider.interface';
import { DatabaseStorageProvider } from '../storage/database-storage.provider';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Options de création de snapshot
 */
export interface SnapshotOptions {
    differential?: boolean;
    compress?: boolean;
    encrypt?: boolean;
    retentionDays?: number;
    metadata?: Record<string, any>;
}

/**
 * Options de clonage
 */
export interface CloneOptions {
    includeModules?: boolean;
    includeParametres?: boolean;
    includeQuotas?: boolean;
    conflictResolution?: 'skip' | 'overwrite' | 'merge';
    dryRun?: boolean;
}

/**
 * Résultat de clonage
 */
export interface CloneResult {
    success: boolean;
    etablissementId: string;
    itemsCloned: number;
    itemsSkipped: number;
    errors: string[];
}

/**
 * Service de backup de configuration
 */
export class ConfigBackupService {
    private backupRepo: Repository<BackupRecord>;
    private parametreVersionRepo: Repository<ParametreVersion>;
    private configAppRepo: Repository<ConfigurationApp>;
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;
    private etablissementConfigRepo: Repository<EtablissementConfig>;
    private storageProvider: IBackupStorage;

    constructor() {
        this.backupRepo = AppDataSource.getRepository(BackupRecord);
        this.parametreVersionRepo = AppDataSource.getRepository(ParametreVersion);
        this.configAppRepo = AppDataSource.getRepository(ConfigurationApp);
        this.configModuleRepo = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
        this.etablissementConfigRepo = AppDataSource.getRepository(EtablissementConfig);
        
        // Utiliser le provider de stockage par défaut (Database)
        this.storageProvider = new DatabaseStorageProvider();
    }

    // ============================================
    // CRÉATION DE SNAPSHOTS
    // ============================================

    /**
     * Crée un snapshot de configuration
     * 
     * @param etablissementId ID de l'établissement (null = global)
     * @param options Options de snapshot
     * @returns Enregistrement du backup créé
     */
    async createSnapshot(
        etablissementId?: string | null,
        options: SnapshotOptions = {}
    ): Promise<BackupRecord> {
        const {
            differential = false,
            compress = true,
            encrypt = false,
            retentionDays = 30,
            metadata = {},
        } = options;

        logger.info(`Création snapshot configuration${etablissementId ? ` [${etablissementId}]` : ' (global)'}`);

        // 1. Collecter les données de configuration
        const snapshot = await this.collectSnapshot(etablissementId);

        // 2. Calculer le différentiel si demandé
        let snapshotData = snapshot;
        if (differential) {
            const previousBackup = await this.getLatestBackup(etablissementId, BackupType.CONFIG);
            if (previousBackup) {
                const previousData = await this.loadBackupData(previousBackup);
                snapshotData = this.computeDiff(previousData, snapshot);
            }
        }

        // 3. Sérialiser les données
        const serialized = JSON.stringify(snapshotData);

        // 4. Compresser si demandé
        let data = Buffer.from(serialized, 'utf-8');
        let compressed = false;
        let encrypted = false;
        if (compress) {
            data = await gzipAsync(data);
            compressed = true;
        }

        // 5. Calculer le checksum
        const checksum = createHash('sha256').update(data).digest('hex');

        // 6. Calculer la version
        const version = this.calculateVersion(etablissementId);

        // 7. Calculer la date de rétention
        const retentionUntil = retentionDays
            ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
            : undefined;

        // 8. Sauvegarder via le storage provider
        const backupMetadata: BackupMetadata = {
            etablissementId: etablissementId || undefined,
            backupType: BackupType.CONFIG,
            version,
            checksum,
            encrypted,
            compressed,
            size: data.length,
            createdAt: new Date(),
            retentionUntil,
            metadata: {
                ...metadata,
                differential,
                etablissementId: etablissementId || 'global',
            },
        };

        const backupRecord = await this.storageProvider.save(data, backupMetadata) as BackupRecord;

        logger.info(`Snapshot créé: ${backupRecord.id} (version: ${version}, taille: ${(backupRecord as any).getFormattedSize()})`);

        return backupRecord;
    }

    /**
     * Collecte toutes les données de configuration
     */
    private async collectSnapshot(etablissementId?: string | null): Promise<any> {
        const snapshot: any = {
            timestamp: new Date().toISOString(),
            etablissementId: etablissementId || 'global',
        };

        // Configuration de l'établissement
        if (etablissementId) {
            const etablissementConfig = await this.etablissementConfigRepo.findOne({
                where: { etablissementId },
            });
            snapshot.etablissementConfig = etablissementConfig;
        }

        // Paramètres système (globaux + scopés)
        const whereCondition: any = {};
        if (etablissementId) {
            whereCondition.etablissementId = etablissementId;
        } else {
            whereCondition.etablissementId = IsNull();
        }

        const parametres = await this.parametreRepo.find({ where: whereCondition });
        snapshot.parametres = parametres.map(p => ({
            cle: p.cle,
            valeur: p.valeur,
            typeValeur: p.typeValeur,
            categorie: p.categorie,
            module: p.module,
        }));

        // Configuration des modules
        if (etablissementId) {
            const modules = await this.configModuleRepo.find({
                where: { etablissementId },
            });
            snapshot.modules = modules;
        }

        return snapshot;
    }

    /**
     * Calcule le différentiel entre deux snapshots
     */
    private computeDiff(previous: any, current: any): any {
        // Implémentation simplifiée - en production, utiliser JSON Patch RFC 6902
        const diff: any = {
            type: 'differential',
            baseVersion: previous.version || previous.timestamp,
            changes: {},
        };

        // Comparer les paramètres
        if (previous.parametres && current.parametres) {
            const prevMap = new Map<string, any>(previous.parametres.map((p: any) => [p.cle, p]));
            const currMap = new Map<string, any>(current.parametres.map((p: any) => [p.cle, p]));

            // Paramètres ajoutés ou modifiés
            for (const [cle, curr] of currMap) {
                const prev = prevMap.get(cle);
                if (!prev || prev.valeur !== curr.valeur) {
                    diff.changes[cle] = {
                        action: prev ? 'modified' : 'added',
                        value: curr,
                    };
                }
            }

            // Paramètres supprimés
            for (const [cle, prev] of prevMap) {
                if (!currMap.has(cle)) {
                    diff.changes[cle] = {
                        action: 'deleted',
                        value: prev,
                    };
                }
            }
        }

        return diff;
    }

    // ============================================
    // RESTAURATION
    // ============================================

    /**
     * Restaure un backup de configuration
     * 
     * @param backupId ID du backup à restaurer
     * @param force Forcer la restauration même si validation échoue
     */
    async restoreBackup(backupId: string, force: boolean = false): Promise<void> {
        const backup = await this.backupRepo.findOne({
            where: { id: backupId },
        });

        if (!backup) {
            throw new AppError('Backup non trouvé', 404, 'BACKUP_NOT_FOUND');
        }

        if (backup.backupType !== BackupType.CONFIG) {
            throw new AppError('Ce backup n\'est pas un backup de configuration', 400, 'INVALID_BACKUP_TYPE');
        }

        // Charger les données
        const data = await this.loadBackupData(backup);

        // Valider l'intégrité
        if (!force) {
            this.validateBackupIntegrity(data, backup);
        }

        // Restaurer dans une transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (data.type === 'differential') {
                // Restaurer un différentiel
                await this.restoreDifferential(data, backup.etablissementId, queryRunner);
            } else {
                // Restaurer un snapshot complet
                await this.restoreFullSnapshot(data, backup.etablissementId, queryRunner);
            }

            await queryRunner.commitTransaction();
            logger.info(`Backup restauré: ${backupId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Restaure un snapshot complet
     */
    private async restoreFullSnapshot(
        data: any,
        etablissementId: string | undefined,
        queryRunner: any
    ): Promise<void> {
        // Restaurer les paramètres
        if (data.parametres) {
            for (const paramData of data.parametres) {
                let param = await this.parametreRepo.findOne({
                    where: {
                        cle: paramData.cle,
                        etablissementId: etablissementId || undefined,
                    },
                });

                if (param) {
                    param.valeur = paramData.valeur;
                } else {
                    param = this.parametreRepo.create({
                        cle: paramData.cle,
                        valeur: paramData.valeur,
                        typeValeur: paramData.typeValeur,
                        categorie: paramData.categorie,
                        module: paramData.module,
                        etablissementId: etablissementId || undefined,
                    });
                }

                await queryRunner.manager.save(param);
            }
        }

        // Restaurer la configuration de l'établissement
        if (data.etablissementConfig && etablissementId) {
            const configData = data.etablissementConfig as any;
            let config = await this.etablissementConfigRepo.findOne({
                where: { etablissementId },
            });

            if (config) {
                Object.assign(config, configData);
            } else {
                config = this.etablissementConfigRepo.create({
                    ...configData,
                    etablissementId,
                }) as unknown as EtablissementConfig;
            }

            await queryRunner.manager.save(config);
        }
    }

    /**
     * Restaure un backup différentiel
     */
    private async restoreDifferential(
        diff: any,
        etablissementId: string | undefined,
        queryRunner: any
    ): Promise<void> {
        if (!diff.changes) return;

        for (const [cle, change] of Object.entries(diff.changes)) {
            const changeData = change as any;

            if (changeData.action === 'deleted') {
                // Supprimer le paramètre
                const param = await this.parametreRepo.findOne({
                    where: {
                        cle,
                        etablissementId: etablissementId || undefined,
                    },
                });
                if (param) {
                    await queryRunner.manager.remove(param);
                }
            } else {
                // Ajouter ou modifier
                let param = await this.parametreRepo.findOne({
                    where: {
                        cle,
                        etablissementId: etablissementId || undefined,
                    },
                });

                if (param) {
                    param.valeur = changeData.value.valeur;
                } else {
                    param = this.parametreRepo.create({
                        cle,
                        valeur: changeData.value.valeur,
                        typeValeur: changeData.value.typeValeur,
                        categorie: changeData.value.categorie,
                        module: changeData.value.module,
                        etablissementId: etablissementId || undefined,
                    });
                }

                await queryRunner.manager.save(param);
            }
        }
    }

    // ============================================
    // CLONAGE INTER-ÉTABLISSEMENTS
    // ============================================

    /**
     * Clone la configuration d'un établissement vers d'autres
     * 
     * @param sourceEtablissementId Établissement source
     * @param targetEtablissementIds Établissements cibles
     * @param options Options de clonage
     * @returns Résultats du clonage
     */
    async cloneConfiguration(
        sourceEtablissementId: string,
        targetEtablissementIds: string[],
        options: CloneOptions = {}
    ): Promise<CloneResult[]> {
        const {
            includeModules = true,
            includeParametres = true,
            includeQuotas = true,
            conflictResolution = 'merge',
            dryRun = false,
        } = options;

        const results: CloneResult[] = [];

        // Collecter la configuration source
        const sourceConfig = await this.collectSnapshot(sourceEtablissementId);

        for (const targetId of targetEtablissementIds) {
            const result: CloneResult = {
                success: false,
                etablissementId: targetId,
                itemsCloned: 0,
                itemsSkipped: 0,
                errors: [],
            };

            try {
                if (dryRun) {
                    // Mode dry-run : compter sans appliquer
                    result.itemsCloned = sourceConfig.parametres?.length || 0;
                    result.success = true;
                } else {
                    // Appliquer le clonage
                    const queryRunner = AppDataSource.createQueryRunner();
                    await queryRunner.connect();
                    await queryRunner.startTransaction();

                    try {
                        let cloned = 0;
                        let skipped = 0;

                        // Cloner les paramètres
                        if (includeParametres && sourceConfig.parametres) {
                            for (const paramData of sourceConfig.parametres) {
                                const existing = await this.parametreRepo.findOne({
                                    where: {
                                        cle: paramData.cle,
                                        etablissementId: targetId,
                                    },
                                });

                                if (existing) {
                                    if (conflictResolution === 'skip') {
                                        skipped++;
                                        continue;
                                    } else if (conflictResolution === 'overwrite') {
                                        existing.valeur = paramData.valeur;
                                        await queryRunner.manager.save(existing);
                                        cloned++;
                                    } else if (conflictResolution === 'merge') {
                                        // Merge: ne modifier que si la valeur cible est null
                                        if (!existing.valeur) {
                                            existing.valeur = paramData.valeur;
                                            await queryRunner.manager.save(existing);
                                            cloned++;
                                        } else {
                                            skipped++;
                                        }
                                    }
                                } else {
                                    const param = this.parametreRepo.create({
                                        ...paramData,
                                        etablissementId: targetId,
                                    });
                                    await queryRunner.manager.save(param);
                                    cloned++;
                                }
                            }
                        }

                        result.itemsCloned = cloned;
                        result.itemsSkipped = skipped;
                        result.success = true;

                        await queryRunner.commitTransaction();
                    } catch (error) {
                        await queryRunner.rollbackTransaction();
                        throw error;
                    } finally {
                        await queryRunner.release();
                    }
                }

                results.push(result);
            } catch (error: any) {
                result.errors.push(error.message || 'Erreur inconnue');
                results.push(result);
            }
        }

        return results;
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Calcule la version sémantique du backup
     */
    private calculateVersion(etablissementId?: string | null): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const prefix = etablissementId ? `v1.0.0` : `v1.0.0`;
        const suffix = etablissementId ? `-${etablissementId.substring(0, 8)}` : '-global';
        return `${prefix}${suffix}-${timestamp}`;
    }

    /**
     * Charge et décompresse les données d'un backup
     */
    private async loadBackupData(backup: BackupRecord): Promise<any> {
        const data = await this.storageProvider.load(backup.id);

        let decompressed = data;
        if (backup.compressed) {
            decompressed = await gunzipAsync(data);
        }

        return JSON.parse(decompressed.toString('utf-8'));
    }

    /**
     * Valide l'intégrité d'un backup
     */
    private validateBackupIntegrity(data: any, backup: BackupRecord): void {
        // Vérifier le checksum
        const serialized = JSON.stringify(data);
        const buffer = Buffer.from(serialized, 'utf-8');
        const checksum = createHash('sha256').update(buffer).digest('hex');

        if (checksum !== backup.checksum) {
            throw new AppError(
                'Intégrité du backup compromise - checksum ne correspond pas',
                400,
                'BACKUP_INTEGRITY_ERROR'
            );
        }
    }

    /**
     * Récupère le backup le plus récent pour un établissement
     */
    private async getLatestBackup(
        etablissementId: string | null | undefined,
        backupType: BackupType
    ): Promise<BackupRecord | null> {
        return this.backupRepo.findOne({
            where: {
                etablissementId: etablissementId || undefined,
                backupType,
            },
            order: { createdAt: 'DESC' },
        });
    }
}

export const configBackupService = new ConfigBackupService();
export default ConfigBackupService;
