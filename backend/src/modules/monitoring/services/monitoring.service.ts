/**
 * ==================================
 * eLISAschool - Service Monitoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { getParam, getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Métriques système
 */
export interface SystemMetrics {
    timestamp: Date;
    uptime: number;
    memory: {
        total: number;
        used: number;
        free: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    cpu: {
        cores: number;
        model: string;
        loadAvg: number[];
        usage?: number;
    };
    database: {
        connected: boolean;
        poolSize?: number;
        activeConnections?: number;
    };
    application: {
        version: string;
        nodeVersion: string;
        environment: string;
        pid: number;
    };
}

/**
 * Statistiques de l'application
 */
export interface AppStats {
    utilisateurs: {
        total: number;
        actifs: number;
        parRole: Record<string, number>;
    };
    modules: {
        actifs: number;
        total: number;
    };
    requetes: {
        enAttente: number;
        total: number;
    };
}

/**
 * Service de monitoring système
 */
export class MonitoringService {
    private startTime: Date;

    constructor() {
        this.startTime = new Date();
    }

    /**
     * Récupère les métriques système
     */
    async getSystemMetrics(): Promise<SystemMetrics> {
        const memoryUsage = process.memoryUsage();

        return {
            timestamp: new Date(),
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                used: os.totalmem() - os.freemem(),
                free: os.freemem(),
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                loadAvg: os.loadavg(),
            },
            database: await this.getDatabaseStatus(),
            application: {
                version: await getParam('app.version', { defaultValue: '1.0.0' }),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development',
                pid: process.pid,
            },
        };
    }

    /**
     * Statut de la base de données
     */
    private async getDatabaseStatus(): Promise<any> {
        try {
            const isConnected = AppDataSource.isInitialized;
            return {
                connected: isConnected,
                driver: AppDataSource.options.type,
            };
        } catch {
            return { connected: false };
        }
    }

    /**
     * Statistiques de l'application
     */
    async getAppStats(): Promise<AppStats> {
        // Ces requêtes nécessitent que les repositories soient disponibles
        try {
            // Statistiques utilisateurs
            const utilisateursTotal = await AppDataSource.getRepository('Utilisateur').count();
            const utilisateursActifs = await AppDataSource.getRepository('Utilisateur').count({
                where: { statut: 'ACTIF' },
            });

            // Statistiques requêtes
            const requetesEnAttente = await AppDataSource.getRepository('Requete')?.count({
                where: { statut: 'EN_ATTENTE' },
            }).catch(() => 0);
            const requetesTotal = await AppDataSource.getRepository('Requete')?.count().catch(() => 0);

            return {
                utilisateurs: {
                    total: utilisateursTotal,
                    actifs: utilisateursActifs,
                    parRole: {},
                },
                modules: {
                    actifs: 0,
                    total: 0,
                },
                requetes: {
                    enAttente: requetesEnAttente,
                    total: requetesTotal,
                },
            };
        } catch (error) {
            logger.warn('Erreur récupération stats app:', error);
            return {
                utilisateurs: { total: 0, actifs: 0, parRole: {} },
                modules: { actifs: 0, total: 0 },
                requetes: { enAttente: 0, total: 0 },
            };
        }
    }

    /**
     * Vérification de santé
     */
    async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'down'; details: Record<string, any> }> {
        const checks: Record<string, any> = {
            database: false,
            memory: false,
            uptime: true,
        };

        // Check database
        try {
            checks.database = AppDataSource.isInitialized;
            if (checks.database) {
                await AppDataSource.query('SELECT 1');
            }
        } catch {
            checks.database = false;
        }

        // Check memory (alerte si < 100MB libre)
        const freeMemory = os.freemem();
        checks.memory = freeMemory > 100 * 1024 * 1024;
        checks.freeMemoryMB = Math.round(freeMemory / 1024 / 1024);

        // Déterminer le statut global
        const allOk = Object.values(checks).every(v => v === true || typeof v === 'number');
        const anyDown = !checks.database;

        return {
            status: anyDown ? 'down' : (allOk ? 'ok' : 'degraded'),
            details: checks,
        };
    }

    /**
     * Statut des backups
     */
    async getBackupStatus(): Promise<any> {
        try {
            const backupDir = path.resolve(process.cwd(), '..', 'docker', 'backups');
            
            if (!fs.existsSync(backupDir)) {
                return {
                    configured: false,
                    message: 'Répertoire de backup non configuré',
                    daily: 0,
                    weekly: 0,
                    monthly: 0,
                    manual: 0,
                    lastBackup: null,
                };
            }

            const countFiles = (dir: string) => {
                const fullPath = path.join(backupDir, dir);
                if (!fs.existsSync(fullPath)) return 0;
                return fs.readdirSync(fullPath).filter(f => f.endsWith('.sql.gz')).length;
            };

            const getLastBackup = (): string | null => {
                const dirs = ['daily', 'weekly', 'monthly', 'manual'];
                let latestFile: string | null = null;
                let latestTime = 0;

                for (const dir of dirs) {
                    const fullPath = path.join(backupDir, dir);
                    if (!fs.existsSync(fullPath)) continue;

                    const files = fs.readdirSync(fullPath)
                        .filter(f => f.endsWith('.sql.gz'))
                        .map(f => ({
                            name: f,
                            path: path.join(fullPath, f),
                            time: fs.statSync(path.join(fullPath, f)).mtimeMs,
                        }));

                    for (const file of files) {
                        if (file.time > latestTime) {
                            latestTime = file.time;
                            latestFile = file.path;
                        }
                    }
                }

                return latestFile;
            };

            return {
                configured: true,
                directory: backupDir,
                daily: countFiles('daily'),
                weekly: countFiles('weekly'),
                monthly: countFiles('monthly'),
                manual: countFiles('manual'),
                lastBackup: getLastBackup(),
                lastBackupDate: getLastBackup() ? new Date(fs.statSync(getLastBackup()!).mtimeMs).toISOString() : null,
            };
        } catch (error) {
            logger.warn('Erreur récupération statut backups:', error);
            return { configured: false, error: 'Erreur lecture répertoire backups' };
        }
    }

    /**
     * Informations sur les mises à jour
     */
    async getUpdateInfo(): Promise<any> {
        try {
            // Version actuelle
            const versionFile = path.resolve(process.cwd(), '..', 'VERSION');
            const currentVersion = fs.existsSync(versionFile) 
                ? fs.readFileSync(versionFile, 'utf-8').trim() 
                : '1.0.0';

            // Historique des mises à jour
            const updateHistoryFile = path.resolve(process.cwd(), '..', 'docker', 'scripts', 'update-history.json');
            const updateHistory = fs.existsSync(updateHistoryFile)
                ? JSON.parse(fs.readFileSync(updateHistoryFile, 'utf-8'))
                : [];

            return {
                version: currentVersion,
                lastUpdate: updateHistory.length > 0 ? updateHistory[0] : null,
                totalUpdates: updateHistory.length,
                recentUpdates: updateHistory.slice(0, 5),
            };
        } catch (error) {
            logger.warn('Erreur récupération infos mises à jour:', error);
            return { version: '1.0.0', error: 'Erreur lecture historique' };
        }
    }

    /**
     * Logs récents
     */
    async getRecentLogs(limit: number = 100): Promise<any[]> {
        // TODO: Implémenter la lecture des logs depuis fichier ou DB
        return [];
    }

    /**
     * Mode maintenance
     */
    async isMaintenanceMode(): Promise<boolean> {
        return getParamBoolean('system.maintenance_mode', { defaultValue: false });
    }

    async setMaintenanceMode(enabled: boolean): Promise<void> {
        // TODO: Mettre à jour via configurationService.setParametre
        logger.info(`Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
    }
}

export const monitoringService = new MonitoringService();
