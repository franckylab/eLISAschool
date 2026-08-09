/**
 * ==================================
 * eLISAschool - Service Noisy Neighbor Detection
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase I.2 — Refonte SaaS v3
 * Détecte les tenants qui consomment disproportionnellement les ressources.
 * Alertes automatiques si un tenant dépasse 80% de son quota.
 *
 * Métriques surveillées :
 * - Requêtes/s par tenant
 * - Temps CPU par tenant
 * - Usage DB (connexions, requêtes lentes)
 * - Stockage (nombre d'entités par table)
 *
 * API : GET /api/platform/monitoring/tenants/usage
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

/**
 * Métriques d'utilisation d'un tenant.
 */
export interface TenantUsage {
    etablissementId: string;
    nomEtablissement?: string;
    /** Nombre de requêtes HTTP dans la dernière fenêtre */
    requetesCount: number;
    /** Temps de réponse moyen (ms) */
    tempsReponseMoyen: number;
    /** Temps de réponse p95 (ms) */
    tempsReponseP95: number;
    /** Nombre d'erreurs 5xx */
    erreurs5xx: number;
    /** Nombre d'élèves (indicateur volume) */
    nombreEleves: number;
    /** Nombre d'utilisateurs actifs */
    nombreUtilisateurs: number;
    /** Espace de stockage estimé (nombre total de lignes) */
    volumeDonnees: number;
    /** Score de charge global (0-100) */
    scoreCharge: number;
    /** Statut : normal, warning, critique */
    statut: 'normal' | 'warning' | 'critique';
    /** Timestamp de la dernière mesure */
    lastMeasuredAt: Date;
}

/**
 * Alerte noisy neighbor.
 */
export interface NoisyNeighborAlert {
    id: string;
    etablissementId: string;
    nomEtablissement?: string;
    type: 'requetes' | 'stockage' | 'erreurs' | 'latence' | 'global';
    severity: 'warning' | 'critical';
    message: string;
    valeurActuelle: number;
    seuil: number;
    createdAt: Date;
    resolved: boolean;
}

/**
 * Seuils de détection noisy neighbor.
 */
const THRESHOLDS = {
    /** Requêtes par minute au-dessus desquelles alerter */
    REQUETES_PAR_MINUTE_WARNING: 500,
    REQUETES_PAR_MINUTE_CRITICAL: 1000,
    /** Temps de réponse moyen (ms) */
    LATENCE_MOYENNE_WARNING: 2000,
    LATENCE_MOYENNE_CRITICAL: 5000,
    /** Taux d'erreur 5xx (%) */
    ERREUR_RATE_WARNING: 5,
    ERREUR_RATE_CRITICAL: 15,
    /** Nombre d'élèves (indicateur volume) */
    ELEVES_WARNING: 5000,
    ELEVES_CRITICAL: 10000,
    /** Score de charge global */
    SCORE_CHARGE_WARNING: 80,
    SCORE_CHARGE_CRITICAL: 95,
};

export class NoisyNeighborService {
    private alerts: NoisyNeighborAlert[] = [];
    private lastMeasurements: Map<string, TenantUsage> = new Map();
    private measurementInterval: NodeJS.Timeout | null = null;

    /**
     * Démarre la collecte périodique des métriques par tenant.
     */
    startMonitoring(intervalMs: number = 60_000): void {
        if (this.measurementInterval) return;

        logger.info('[NoisyNeighbor] Démarrage monitoring des tenants');
        this.measurementInterval = setInterval(async () => {
            try {
                await this.measureAllTenants();
            } catch (error) {
                logger.error('[NoisyNeighbor] Erreur mesure périodique', error);
            }
        }, intervalMs);

        // Première mesure immédiate
        this.measureAllTenants().catch(err =>
            logger.error('[NoisyNeighbor] Erreur première mesure', err)
        );
    }

    /**
     * Arrête le monitoring.
     */
    stopMonitoring(): void {
        if (this.measurementInterval) {
            clearInterval(this.measurementInterval);
            this.measurementInterval = null;
            logger.info('[NoisyNeighbor] Monitoring arrêté');
        }
    }

    /**
     * Mesure les métriques de tous les établissements actifs.
     */
    async measureAllTenants(): Promise<TenantUsage[]> {
        const results: TenantUsage[] = [];

        try {
            // Récupérer tous les établissements actifs
            const etablissements = await AppDataSource.query(`
                SELECT e.id, e.nom, e."estActif"
                FROM etablissements e
                WHERE e."estActif" = true
                ORDER BY e.nom
            `);

            for (const etab of etablissements) {
                const usage = await this.measureTenantUsage(etab.id, etab.nom);
                results.push(usage);
                this.lastMeasurements.set(etab.id, usage);

                // Vérifier les seuils et créer des alertes
                this.checkThresholds(usage);
            }

            logger.info(`[NoisyNeighbor] Mesure terminée — ${results.length} tenants analysés`);
        } catch (error) {
            logger.error('[NoisyNeighbor] Erreur measureAllTenants', error);
        }

        return results;
    }

    /**
     * Mesure l'utilisation d'un tenant spécifique.
     */
    async measureTenantUsage(etablissementId: string, nomEtablissement?: string): Promise<TenantUsage> {
        // Compter les entités par table
        let nombreEleves = 0;
        let volumeDonnees = 0;

        try {
            const countResult = await AppDataSource.query(`
                SELECT
                    (SELECT COUNT(*) FROM eleves WHERE "etablissementId" = $1) as eleves,
                    (SELECT COUNT(*) FROM notes WHERE "etablissementId" = $1) as notes,
                    (SELECT COUNT(*) FROM bulletins WHERE "etablissementId" = $1) as bulletins,
                    (SELECT COUNT(*) FROM paiements WHERE "etablissementId" = $1) as paiements,
                    (SELECT COUNT(*) FROM classes WHERE "etablissementId" = $1) as classes
            `, [etablissementId]);

            const counts = countResult[0] || {};
            nombreEleves = parseInt(counts.eleves) || 0;
            volumeDonnees = (parseInt(counts.eleves) || 0)
                + (parseInt(counts.notes) || 0)
                + (parseInt(counts.bulletins) || 0)
                + (parseInt(counts.paiements) || 0)
                + (parseInt(counts.classes) || 0);
        } catch (error) {
            logger.warn(`[NoisyNeighbor] Erreur comptage tenant ${etablissementId.substring(0, 8)}`);
        }

        // Compter les utilisateurs actifs
        let nombreUtilisateurs = 0;
        try {
            const userResult = await AppDataSource.query(`
                SELECT COUNT(*) as count FROM utilisateurs
                WHERE "etablissementId" = $1 AND "estActif" = true
            `, [etablissementId]);
            nombreUtilisateurs = parseInt(userResult[0]?.count) || 0;
        } catch { /* ignore */ }

        // Calculer le score de charge (0-100)
        const scoreCharge = this.calculateChargeScore(nombreEleves, volumeDonnees, nombreUtilisateurs);

        // Déterminer le statut
        let statut: 'normal' | 'warning' | 'critique' = 'normal';
        if (scoreCharge >= THRESHOLDS.SCORE_CHARGE_CRITICAL) {
            statut = 'critique';
        } else if (scoreCharge >= THRESHOLDS.SCORE_CHARGE_WARNING) {
            statut = 'warning';
        }

        return {
            etablissementId,
            nomEtablissement,
            requetesCount: 0, // Sera rempli par le metrics collector
            tempsReponseMoyen: 0,
            tempsReponseP95: 0,
            erreurs5xx: 0,
            nombreEleves,
            nombreUtilisateurs,
            volumeDonnees,
            scoreCharge,
            statut,
            lastMeasuredAt: new Date(),
        };
    }

    /**
     * Calcule un score de charge global (0-100).
     */
    private calculateChargeScore(eleves: number, volume: number, utilisateurs: number): number {
        // Formule pondérée :
        // - Élèves : 40% du score (max 10000 → 40 points)
        // - Volume total : 35% du score (max 100000 → 35 points)
        // - Utilisateurs : 25% du score (max 5000 → 25 points)
        const scoreEleves = Math.min((eleves / 10000) * 40, 40);
        const scoreVolume = Math.min((volume / 100000) * 35, 35);
        const scoreUsers = Math.min((utilisateurs / 5000) * 25, 25);

        return Math.round(scoreEleves + scoreVolume + scoreUsers);
    }

    /**
     * Vérifie les seuils et crée des alertes.
     */
    private checkThresholds(usage: TenantUsage): void {
        // Score de charge
        if (usage.scoreCharge >= THRESHOLDS.SCORE_CHARGE_CRITICAL) {
            this.createAlert(usage, 'global', 'critical',
                `Charge critique: ${usage.scoreCharge}% (seuil: ${THRESHOLDS.SCORE_CHARGE_CRITICAL}%)`,
                usage.scoreCharge, THRESHOLDS.SCORE_CHARGE_CRITICAL);
        } else if (usage.scoreCharge >= THRESHOLDS.SCORE_CHARGE_WARNING) {
            this.createAlert(usage, 'global', 'warning',
                `Charge élevée: ${usage.scoreCharge}% (seuil: ${THRESHOLDS.SCORE_CHARGE_WARNING}%)`,
                usage.scoreCharge, THRESHOLDS.SCORE_CHARGE_WARNING);
        }

        // Nombre d'élèves
        if (usage.nombreEleves >= THRESHOLDS.ELEVES_CRITICAL) {
            this.createAlert(usage, 'stockage', 'critical',
                `Volume élevé: ${usage.nombreEleves} élèves (seuil: ${THRESHOLDS.ELEVES_CRITICAL})`,
                usage.nombreEleves, THRESHOLDS.ELEVES_CRITICAL);
        } else if (usage.nombreEleves >= THRESHOLDS.ELEVES_WARNING) {
            this.createAlert(usage, 'stockage', 'warning',
                `Volume modéré: ${usage.nombreEleves} élèves (seuil: ${THRESHOLDS.ELEVES_WARNING})`,
                usage.nombreEleves, THRESHOLDS.ELEVES_WARNING);
        }
    }

    /**
     * Crée une alerte si une alerte similaire n'existe pas déjà (non résolue).
     */
    private createAlert(
        usage: TenantUsage,
        type: NoisyNeighborAlert['type'],
        severity: NoisyNeighborAlert['severity'],
        message: string,
        valeur: number,
        seuil: number
    ): void {
        // Vérifier si une alerte non résolue du même type existe déjà
        const existingAlert = this.alerts.find(
            a => a.etablissementId === usage.etablissementId
                && a.type === type
                && !a.resolved
        );

        if (existingAlert) {
            // Mettre à jour la valeur si elle a changé
            existingAlert.valeurActuelle = valeur;
            return;
        }

        this.alerts.push({
            id: `alert-${usage.etablissementId}-${type}-${Date.now()}`,
            etablissementId: usage.etablissementId,
            nomEtablissement: usage.nomEtablissement,
            type,
            severity,
            message,
            valeurActuelle: valeur,
            seuil,
            createdAt: new Date(),
            resolved: false,
        });

        logger.warn(`[NoisyNeighbor] ALERTE ${severity.toUpperCase()} — ${usage.nomEtablissement || usage.etablissementId.substring(0, 8)}: ${message}`);
    }

    /**
     * Récupère l'utilisation de tous les tenants (pour le dashboard).
     */
    getAllTenantUsage(): TenantUsage[] {
        return Array.from(this.lastMeasurements.values())
            .sort((a, b) => b.scoreCharge - a.scoreCharge);
    }

    /**
     * Top N tenants par consommation.
     */
    getTopTenants(limit: number = 10): TenantUsage[] {
        return this.getAllTenantUsage().slice(0, limit);
    }

    /**
     * Récupère les alertes actives (non résolues).
     */
    getActiveAlerts(): NoisyNeighborAlert[] {
        return this.alerts.filter(a => !a.resolved);
    }

    /**
     * Récupère tout l'historique des alertes.
     */
    getAllAlerts(): NoisyNeighborAlert[] {
        return [...this.alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Résout une alerte.
     */
    resolveAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            return true;
        }
        return false;
    }

    /**
     * Met à jour les métriques HTTP d'un tenant (appelé par le metrics collector).
     */
    updateHttpMetrics(etablissementId: string, requetesCount: number, tempsMoyen: number, tempsP95: number, erreurs5xx: number): void {
        const usage = this.lastMeasurements.get(etablissementId);
        if (usage) {
            usage.requetesCount = requetesCount;
            usage.tempsReponseMoyen = tempsMoyen;
            usage.tempsReponseP95 = tempsP95;
            usage.erreurs5xx = erreurs5xx;
        }
    }
}

export const noisyNeighborService = new NoisyNeighborService();
