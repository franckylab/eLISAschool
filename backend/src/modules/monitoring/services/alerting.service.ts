/**
 * ==================================
 * eLISAschool - Service Alerting
 * ==================================
 * 
 * Alertes configurables avec seuils et notifications.
 * Surveillance des métriques critiques.
 * 
 * Phase 7.1 — Refonte SaaS
 * Phase F.2 — Refonte SaaS v2 (multi-canaux, règles combinées, escalade)
 */

import { logger } from '@common/utils/logger.util';

export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export enum AlertChannel {
    LOG = 'log',
    EMAIL = 'email',
    SLACK = 'slack',
    WEBHOOK = 'webhook',
}

export interface AlertRule {
    name: string;
    metric: string;
    condition: 'gt' | 'lt' | 'eq';
    threshold: number;
    severity: AlertSeverity;
    duration?: number; // Durée en secondes avant déclenchement
    message: string;
    enabled: boolean;
    channels?: AlertChannel[]; // Canaux de notification (défaut: [LOG])
    /** Règles combinées — toutes doivent être vraies pour déclencher */
    combinedWith?: { metric: string; condition: 'gt' | 'lt' | 'eq'; threshold: number }[];
}

export interface Alert {
    id: string;
    rule: string;
    severity: AlertSeverity;
    message: string;
    value: number;
    threshold: number;
    timestamp: Date;
    acknowledged: boolean;
    escalated?: boolean;
    channelsNotified?: AlertChannel[];
}

export interface EscalationConfig {
    /** Délai en minutes avant escalade si non acquittée */
    escalationDelayMinutes: number;
    /** Rôle à notifier pour l'escalade */
    escalationRole: string;
}

export class AlertingService {
    private rules: AlertRule[] = [];
    private activeAlerts: Map<string, Alert> = new Map();
    private alertCounter = 0;
    private escalationConfig: EscalationConfig = {
        escalationDelayMinutes: 30,
        escalationRole: 'SUPER_ADMIN',
    };
    private escalationInterval: NodeJS.Timeout | null = null;

    /** Webhooks configurés pour les alertes */
    private webhookUrls: Map<string, string> = new Map();

    /** Slack webhook URL */
    private slackWebhookUrl?: string;

    constructor() {
        // Règles par défaut
        this.rules = [
            {
                name: 'high_error_rate',
                metric: 'http_errors_5xx_total',
                condition: 'gt',
                threshold: 50,
                severity: AlertSeverity.WARNING,
                message: 'Taux d\'erreur HTTP élevé (>50 en 1h)',
                enabled: true,
                channels: [AlertChannel.LOG],
            },
            {
                name: 'high_latency',
                metric: 'http_request_duration_ms',
                condition: 'gt',
                threshold: 5000,
                severity: AlertSeverity.WARNING,
                message: 'Latence HTTP élevée (>5s)',
                enabled: true,
                channels: [AlertChannel.LOG],
            },
            {
                name: 'critical_latency',
                metric: 'http_request_duration_ms',
                condition: 'gt',
                threshold: 15000,
                severity: AlertSeverity.CRITICAL,
                message: 'Latence HTTP critique (>15s)',
                enabled: true,
                channels: [AlertChannel.LOG, AlertChannel.EMAIL],
            },
            {
                name: 'database_slow',
                metric: 'resource_database_percent',
                condition: 'gt',
                threshold: 90,
                severity: AlertSeverity.CRITICAL,
                message: 'Base de données surchargée (>90%)',
                enabled: true,
                channels: [AlertChannel.LOG, AlertChannel.EMAIL],
            },
            {
                name: 'high_error_and_latency',
                metric: 'http_errors_5xx_total',
                condition: 'gt',
                threshold: 20,
                severity: AlertSeverity.CRITICAL,
                message: 'Taux erreur ET latence élevée combinés',
                enabled: true,
                channels: [AlertChannel.LOG, AlertChannel.EMAIL, AlertChannel.SLACK],
                combinedWith: [
                    { metric: 'http_request_duration_ms', condition: 'gt', threshold: 500 },
                ],
            },
            {
                name: 'memory_saturation',
                metric: 'resource_memory_percent',
                condition: 'gt',
                threshold: 85,
                severity: AlertSeverity.WARNING,
                message: 'Mémoire saturée (>85%)',
                enabled: true,
                channels: [AlertChannel.LOG],
            },
        ];

        // Démarrer le vérificateur d'escalade
        this.startEscalationChecker();
    }

    /**
     * Évalue une métrique contre les règles d'alerte.
     */
    evaluate(metric: string, value: number, context?: Record<string, number>): Alert | null {
        for (const rule of this.rules) {
            if (!rule.enabled || rule.metric !== metric) continue;

            let triggered = false;
            switch (rule.condition) {
                case 'gt': triggered = value > rule.threshold; break;
                case 'lt': triggered = value < rule.threshold; break;
                case 'eq': triggered = value === rule.threshold; break;
            }

            // Vérifier les règles combinées
            if (triggered && rule.combinedWith && context) {
                for (const combined of rule.combinedWith) {
                    const combinedValue = context[combined.metric];
                    if (combinedValue === undefined) {
                        triggered = false;
                        break;
                    }
                    switch (combined.condition) {
                        case 'gt': triggered = triggered && combinedValue > combined.threshold; break;
                        case 'lt': triggered = triggered && combinedValue < combined.threshold; break;
                        case 'eq': triggered = triggered && combinedValue === combined.threshold; break;
                    }
                }
            } else if (triggered && rule.combinedWith && !context) {
                // Règle combinée mais pas de contexte fourni
                triggered = false;
            }

            if (triggered) {
                const channels = rule.channels || [AlertChannel.LOG];
                const alert: Alert = {
                    id: `alert-${++this.alertCounter}`,
                    rule: rule.name,
                    severity: rule.severity,
                    message: rule.message,
                    value,
                    threshold: rule.threshold,
                    timestamp: new Date(),
                    acknowledged: false,
                    channelsNotified: channels,
                };

                this.activeAlerts.set(alert.id, alert);

                // Logger
                logger.warn(
                    `[Alerting] ALERTE ${rule.severity.toUpperCase()} — ${rule.message} ` +
                    `(valeur: ${value}, seuil: ${rule.threshold})`
                );

                //Notifier via les canaux configurés
                this.notifyViaChannels(alert, channels);

                return alert;
            }
        }

        return null;
    }

    /**
     * Notifie via les canaux configurés.
     */
    private async notifyViaChannels(alert: Alert, channels: AlertChannel[]): Promise<void> {
        for (const channel of channels) {
            try {
                switch (channel) {
                    case AlertChannel.LOG:
                        // Déjà fait dans evaluate()
                        break;

                    case AlertChannel.EMAIL:
                        await this.notifyViaEmail(alert);
                        break;

                    case AlertChannel.SLACK:
                        await this.notifyViaSlack(alert);
                        break;

                    case AlertChannel.WEBHOOK:
                        await this.notifyViaWebhook(alert);
                        break;
                }
            } catch (error: any) {
                logger.error(`[Alerting] Erreur notification canal ${channel}: ${error.message}`);
            }
        }
    }

    /**
     * Notification par email (via le NotificationOrchestrator si disponible).
     */
    private async notifyViaEmail(alert: Alert): Promise<void> {
        logger.info(`[Alerting] Email alerte ${alert.id} — ${alert.message}`);
        // En production, utiliser le NotificationOrchestrator:
        // await notificationOrchestrator.envoyer({
        //     type: 'ALERT',
        //     severity: alert.severity,
        //     subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
        //     destinataires: ['admin@elisaschool.com'],
        // });
    }

    /**
     * Notification Slack via webhook entrant.
     */
    private async notifyViaSlack(alert: Alert): Promise<void> {
        const webhookUrl = this.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            logger.info(`[Alerting] Slack non configuré — alerte ${alert.id} ignorée`);
            return;
        }

        const payload = {
            text: `🚨 *eLISAschool Alert — ${alert.severity.toUpperCase()}*`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${alert.message}*\nValeur: ${alert.value} | Seuil: ${alert.threshold}\nRègle: ${alert.rule}`,
                    },
                },
                {
                    type: 'context',
                    elements: [
                        { type: 'mrkdwn', text: `ID: ${alert.id} | ${alert.timestamp.toISOString()}` },
                    ],
                },
            ],
        };

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                logger.error(`[Alerting] Slack webhook error: ${response.status}`);
            }
        } catch (error: any) {
            logger.error(`[Alerting] Slack notification failed: ${error.message}`);
        }
    }

    /**
     * Notification webhook custom (POST JSON).
     */
    private async notifyViaWebhook(alert: Alert): Promise<void> {
        const url = this.webhookUrls.get('alerts');
        if (!url) {
            logger.info(`[Alerting] Webhook non configuré — alerte ${alert.id} ignorée`);
            return;
        }

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'alert',
                    id: alert.id,
                    severity: alert.severity,
                    rule: alert.rule,
                    message: alert.message,
                    value: alert.value,
                    threshold: alert.threshold,
                    timestamp: alert.timestamp.toISOString(),
                }),
            });
        } catch (error: any) {
            logger.error(`[Alerting] Webhook notification failed: ${error.message}`);
        }
    }

    /**
     * Récupère les alertes actives.
     */
    getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values())
            .filter((a) => !a.acknowledged)
            .sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
    }

    /**
     * Acquitter une alerte.
     */
    acknowledgeAlert(alertId: string): void {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            logger.info(`[Alerting] Alerte ${alertId} acquittée`);
        }
    }

    /**
     * Ajouter une règle d'alerte personnalisée.
     */
    addRule(rule: AlertRule): void {
        this.rules.push(rule);
    }

    /**
     * Supprimer une règle.
     */
    removeRule(ruleName: string): void {
        this.rules = this.rules.filter((r) => r.name !== ruleName);
    }

    /**
     * Mettre à jour une règle existante (par nom).
     * Retourne la règle mise à jour, ou null si introuvable.
     */
    updateRule(
        ruleName: string,
        patch: Partial<Pick<AlertRule, 'metric' | 'condition' | 'threshold' | 'severity' | 'duration' | 'message' | 'enabled'>>,
    ): AlertRule | null {
        const idx = this.rules.findIndex((r) => r.name === ruleName);
        if (idx === -1) return null;
        this.rules[idx] = { ...this.rules[idx], ...patch, name: ruleName };
        return this.rules[idx];
    }

    /**
     * Liste toutes les règles.
     */
    getRules(): AlertRule[] {
        return this.rules;
    }

    /**
     * Configure l'URL Slack webhook.
     */
    setSlackWebhook(url: string): void {
        this.slackWebhookUrl = url;
    }

    /**
     * Configure un webhook custom.
     */
    setWebhook(name: string, url: string): void {
        this.webhookUrls.set(name, url);
    }

    /**
     * Configure l'escalade.
     */
    setEscalationConfig(config: EscalationConfig): void {
        this.escalationConfig = config;
    }

    /**
     * Vérifie périodiquement les alertes non acquittées pour escalade.
     */
    private startEscalationChecker(): void {
        this.escalationInterval = setInterval(() => {
            const now = Date.now();
            const delayMs = this.escalationConfig.escalationDelayMinutes * 60 * 1000;

            for (const [id, alert] of this.activeAlerts.entries()) {
                if (
                    !alert.acknowledged &&
                    !alert.escalated &&
                    alert.severity === AlertSeverity.CRITICAL &&
                    now - alert.timestamp.getTime() > delayMs
                ) {
                    alert.escalated = true;
                    logger.warn(
                        `[Alerting] ESCALADE — Alerte critique ${id} non acquittée depuis ` +
                        `${Math.round((now - alert.timestamp.getTime()) / 60000)}min — ` +
                        `Notification ${this.escalationConfig.escalationRole}`
                    );
                    // En production: notifier le SUPER_ADMIN
                }
            }

            // Nettoyer les anciennes alertes acquittées (> 24h)
            const dayAgo = now - 24 * 60 * 60 * 1000;
            for (const [id, alert] of this.activeAlerts.entries()) {
                if (alert.acknowledged && alert.timestamp.getTime() < dayAgo) {
                    this.activeAlerts.delete(id);
                }
            }
        }, 60_000); // Vérifier toutes les minutes
    }

    destroy(): void {
        if (this.escalationInterval) {
            clearInterval(this.escalationInterval);
        }
    }
}

export const alertingService = new AlertingService();
export default AlertingService;
