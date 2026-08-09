/**
 * ==================================
 * eLISAschool - Service Backup par Tenant
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase I.1 — Refonte SaaS v3
 * Export/Import des données d'un établissement spécifique.
 * Sauvegarde granulaire par tenant avec toutes les tables scopées.
 *
 * Fonctionnalités :
 * - Export complet d'un tenant (toutes tables filtrées par etablissementId)
 * - Restauration granulaire par tenant
 * - Planification automatique (cron quotidien)
 * - Stockage : local + S3 (via BackupProvider interface)
 * - API : POST /api/platform/backup/:etablissementId
 *         GET  /api/platform/backup/:etablissementId/history
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { BackupProvider, BackupResult } from './backup-provider.interface';
import { LocalBackupProvider } from './local-backup.provider';

/**
 * Tables multi-tenant à exporter (toutes scopées par etablissementId).
 */
const TENANT_TABLES = [
    'eleves', 'notes', 'bulletins', 'heures_cours', 'creneaux_horaires',
    'absences_personnel', 'paiements', 'factures', 'classes',
    'matieres', 'periodes', 'annees_scolaires', 'membres_personnel',
    'configurations_app', 'parametres_systeme',
    'sondages', 'annonces', 'messageries',
    'usage_meters', 'abonnements_clients', 'transactions_ledger',
] as const;

/**
 * Métadonnées d'un backup tenant.
 */
export interface TenantBackupMetadata {
    etablissementId: string;
    nomEtablissement?: string;
    tablesExportees: string[];
    nombreLignes: Record<string, number>;
    tailleTotale: number;
    createdAt: Date;
    provider: string;
    format: 'json' | 'csv';
}

/**
 * Historique des backups d'un tenant.
 */
export interface TenantBackupRecord {
    id: string;
    etablissementId: string;
    metadata: TenantBackupMetadata;
    path: string;
    size: number;
    statut: 'success' | 'failed' | 'in_progress';
    erreur?: string;
    createdAt: Date;
}

export class TenantBackupService {
    private provider: BackupProvider;
    private backupHistory: TenantBackupRecord[] = [];
    private readonly localProvider = new LocalBackupProvider();

    constructor(provider?: BackupProvider) {
        this.provider = provider || this.localProvider;
    }

    /**
     * Export complet des données d'un établissement.
     */
    async exportTenantData(
        etablissementId: string,
        format: 'json' | 'csv' = 'json'
    ): Promise<TenantBackupRecord> {
        const startTime = Date.now();
        const record: TenantBackupRecord = {
            id: `backup-${etablissementId}-${Date.now()}`,
            etablissementId,
            metadata: {
                etablissementId,
                tablesExportees: [],
                nombreLignes: {},
                tailleTotale: 0,
                createdAt: new Date(),
                provider: this.provider.name,
                format,
            },
            path: '',
            size: 0,
            statut: 'in_progress',
            createdAt: new Date(),
        };

        try {
            logger.info(`[TenantBackup] Démarrage export tenant ${etablissementId.substring(0, 8)}`);

            // Récupérer le nom de l'établissement
            try {
                const etabRepo = AppDataSource.getRepository('Etablissement');
                const etab = await etabRepo.findOne({
                    where: { id: etablissementId },
                    select: ['id', 'nom'],
                });
                record.metadata.nomEtablissement = (etab as any)?.nom || 'Inconnu';
            } catch {
                record.metadata.nomEtablissement = 'Inconnu';
            }

            // Exporter chaque table
            const exportData: Record<string, any[]> = {};
            let totalRows = 0;

            for (const table of TENANT_TABLES) {
                try {
                    const repo = AppDataSource.getRepository(table);
                    const rows = await repo.find({
                        where: { etablissementId } as any,
                    });
                    exportData[table] = rows;
                    record.metadata.nombreLignes[table] = rows.length;
                    record.metadata.tablesExportees.push(table);
                    totalRows += rows.length;
                } catch (error) {
                    // Table peut ne pas exister ou ne pas avoir etablissementId
                    logger.warn(`[TenantBackup] Table ${table} ignorée: ${(error as Error).message}`);
                }
            }

            // Sérialiser les données
            const jsonData = JSON.stringify(exportData, null, 2);
            const bufferSize = Buffer.byteLength(jsonData, 'utf-8');

            // Sauvegarder via le provider
            const fileName = `tenant-backup-${etablissementId}-${new Date().toISOString().split('T')[0]}.json`;
            const localPath = `/tmp/${fileName}`;

            // Écrire le fichier temporaire
            const fs = require('fs');
            fs.writeFileSync(localPath, jsonData);

            const result: BackupResult = await this.provider.upload(
                localPath,
                fileName,
                {}
            );

            record.statut = result.success ? 'success' : 'failed';
            record.path = result.path || localPath;
            record.size = bufferSize;
            record.metadata.tailleTotale = bufferSize;

            // Nettoyer le fichier temporaire
            try { fs.unlinkSync(localPath); } catch { /* ignore */ }

            // Ajouter à l'historique
            this.backupHistory.push(record);

            const duration = Date.now() - startTime;
            logger.info(
                `[TenantBackup] Export terminé — tenant=${etablissementId.substring(0, 8)}, ` +
                `tables=${record.metadata.tablesExportees.length}, ` +
                `lignes=${totalRows}, taille=${(bufferSize / 1024).toFixed(1)}KB, ` +
                `durée=${duration}ms`
            );

            return record;
        } catch (error) {
            record.statut = 'failed';
            record.erreur = (error as Error).message;
            this.backupHistory.push(record);

            logger.error(`[TenantBackup] Échec export tenant ${etablissementId.substring(0, 8)}`, error);
            return record;
        }
    }

    /**
     * Restaure les données d'un tenant depuis un backup.
     */
    async restoreTenantData(
        etablissementId: string,
        backupPath: string
    ): Promise<{ success: boolean; message: string; tablesRestored: number }> {
        try {
            logger.info(`[TenantBackup] Démarrage restauration tenant ${etablissementId.substring(0, 8)}`);

            // Télécharger le fichier
            const localPath = `/tmp/restore-${etablissementId}-${Date.now()}.json`;
            await this.provider.download(backupPath, localPath, {});

            // Lire les données
            const fs = require('fs');
            const jsonData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));

            let tablesRestored = 0;

            // Restaurer table par table dans une transaction
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                for (const [table, rows] of Object.entries(jsonData)) {
                    if (!Array.isArray(rows) || rows.length === 0) continue;

                    try {
                        // Supprimer les données existantes du tenant pour cette table
                        await queryRunner.query(
                            `DELETE FROM "${table}" WHERE "etablissementId" = $1`,
                            [etablissementId]
                        );

                        // Insérer les données restaurées
                        for (const row of rows) {
                            const columns = Object.keys(row);
                            const values = Object.values(row);
                            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                            await queryRunner.query(
                                `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                                values
                            );
                        }
                        tablesRestored++;
                    } catch (error) {
                        logger.warn(`[TenantBackup] Table ${table} ignorée lors de la restauration: ${(error as Error).message}`);
                    }
                }

                await queryRunner.commitTransaction();
            } catch (error) {
                await queryRunner.rollbackTransaction();
                throw error;
            } finally {
                await queryRunner.release();
            }

            // Nettoyer
            try { fs.unlinkSync(localPath); } catch { /* ignore */ }

            logger.info(`[TenantBackup] Restauration terminée — ${tablesRestored} tables restaurées`);

            return {
                success: true,
                message: `${tablesRestored} tables restaurées avec succès`,
                tablesRestored,
            };
        } catch (error) {
            logger.error(`[TenantBackup] Échec restauration tenant ${etablissementId.substring(0, 8)}`, error);
            return {
                success: false,
                message: `Échec: ${(error as Error).message}`,
                tablesRestored: 0,
            };
        }
    }

    /**
     * Historique des backups pour un tenant.
     */
    getBackupHistory(etablissementId: string): TenantBackupRecord[] {
        return this.backupHistory
            .filter(r => r.etablissementId === etablissementId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Tous les backups (pour le dashboard plateforme).
     */
    getAllBackups(): TenantBackupRecord[] {
        return [...this.backupHistory].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}

export const tenantBackupService = new TenantBackupService();
