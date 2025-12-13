/**
 * ==================================
 * eLISAschool - Service Monitoring
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import os from 'os';
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
                version: await getParam('app.version', '1.0.0'),
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
        return getParamBoolean('system.maintenance_mode', false);
    }

    async setMaintenanceMode(enabled: boolean): Promise<void> {
        // TODO: Mettre à jour via configurationService.setParametre
        logger.info(`Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
    }
}

export const monitoringService = new MonitoringService();
