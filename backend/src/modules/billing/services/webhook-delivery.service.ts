/**
 * ==================================
 * eLISAschool - Webhook Delivery Service
 * ==================================
 * Refonte SaaS — Fusion P7.1
 *
 * Gestion des webhooks pour les événements module lifecycle.
 * Permet aux systèmes externes de recevoir des notifications
 * quand un module est activé/désactivé/souscrit.
 *
 * Stockage en mémoire (configurable via Redis pour multi-instance).
 * Routes platform pour configurer les webhooks.
 */

import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';
import type { ModuleEvent } from './module-events.service';

// =============================================
// TYPES
// =============================================

export interface WebhookConfig {
    id: string;
    url: string;
    secret: string;
    events: string[]; // ['module.activated', 'module.deactivated', ...] ou ['*']
    actif: boolean;
    createdAt: string;
    description?: string;
}

export interface WebhookLogEntry {
    id: string;
    webhookId: string;
    eventType: string;
    url: string;
    statusCode: number;
    success: boolean;
    error?: string;
    timestamp: string;
    payload: any;
}

// =============================================
// CONSTANTES
// =============================================

const WEBHOOKS_KEY = 'webhooks:modules';
const WEBHOOK_LOGS_KEY = 'webhooks:modules:logs';
const MAX_LOG_ENTRIES = 500;

// =============================================
// SERVICE
// =============================================

export class WebhookDeliveryService {
    private redisAvailable = true;

    /**
     * Liste les webhooks configurés.
     */
    async listWebhooks(): Promise<WebhookConfig[]> {
        if (!this.redisAvailable) return [];
        try {
            const data = await redisService.getJSON<WebhookConfig[]>(WEBHOOKS_KEY);
            return data || [];
        } catch {
            this.redisAvailable = false;
            return [];
        }
    }

    /**
     * Ajoute un webhook.
     */
    async addWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt'>): Promise<WebhookConfig> {
        const webhooks = await this.listWebhooks();
        const newWebhook: WebhookConfig = {
            ...config,
            id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
        };
        webhooks.push(newWebhook);

        if (this.redisAvailable) {
            try {
                await redisService.setJSON(WEBHOOKS_KEY, webhooks);
            } catch { this.redisAvailable = false; }
        }

        logger.info(`[Webhooks] Webhook ajouté: ${newWebhook.id} → ${newWebhook.url}`);
        return newWebhook;
    }

    /**
     * Supprime un webhook.
     */
    async removeWebhook(id: string): Promise<boolean> {
        const webhooks = await this.listWebhooks();
        const filtered = webhooks.filter((w) => w.id !== id);
        if (filtered.length === webhooks.length) return false;

        if (this.redisAvailable) {
            try {
                await redisService.setJSON(WEBHOOKS_KEY, filtered);
            } catch { this.redisAvailable = false; }
        }

        logger.info(`[Webhooks] Webhook supprimé: ${id}`);
        return true;
    }

    /**
     * Dispatch un événement à tous les webhooks abonnés.
     */
    async dispatch(event: ModuleEvent): Promise<void> {
        const webhooks = await this.listWebhooks();
        const subscribed = webhooks.filter(
            (w) => w.actif && (w.events.includes('*') || w.events.includes(event.type))
        );

        for (const webhook of subscribed) {
            await this.deliver(webhook, event);
        }
    }

    /**
     * Délivre un événement à un webhook spécifique.
     */
    private async deliver(webhook: WebhookConfig, event: ModuleEvent): Promise<void> {
        const startTime = Date.now();
        let success = false;
        let statusCode = 0;
        let error: string | undefined;

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret,
                    'X-Webhook-Event': event.type,
                    'X-Webhook-Delivery': webhook.id,
                },
                body: JSON.stringify(event),
                signal: AbortSignal.timeout(10_000), // 10s timeout
            });

            statusCode = response.status;
            success = response.ok;

            if (!success) {
                error = `HTTP ${statusCode}: ${response.statusText}`;
            }
        } catch (err: any) {
            error = err.message || 'Delivery failed';
            statusCode = 0;
        }

        // Logger le résultat
        const logEntry: WebhookLogEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            webhookId: webhook.id,
            eventType: event.type,
            url: webhook.url,
            statusCode,
            success,
            error,
            timestamp: new Date().toISOString(),
            payload: event,
        };

        await this.addLog(logEntry);

        if (success) {
            logger.debug(
                `[Webhooks] Delivery OK — ${event.type} → ${webhook.url} (${Date.now() - startTime}ms)`
            );
        } else {
            logger.warn(
                `[Webhooks] Delivery FAILED — ${event.type} → ${webhook.url}: ${error}`
            );
        }
    }

    /**
     * Ajoute une entrée au log des deliveries.
     */
    private async addLog(entry: WebhookLogEntry): Promise<void> {
        if (!this.redisAvailable) return;
        try {
            const logs = (await redisService.getJSON<WebhookLogEntry[]>(WEBHOOK_LOGS_KEY)) || [];
            logs.unshift(entry);
            // Garder seulement les MAX_LOG_ENTRIES derniers
            if (logs.length > MAX_LOG_ENTRIES) logs.length = MAX_LOG_ENTRIES;
            await redisService.setJSON(WEBHOOK_LOGS_KEY, logs);
        } catch {
            this.redisAvailable = false;
        }
    }

    /**
     * Récupère les logs de delivery.
     */
    async getLogs(limit = 50): Promise<WebhookLogEntry[]> {
        if (!this.redisAvailable) return [];
        try {
            const logs = (await redisService.getJSON<WebhookLogEntry[]>(WEBHOOK_LOGS_KEY)) || [];
            return logs.slice(0, limit);
        } catch {
            this.redisAvailable = false;
            return [];
        }
    }
}

export const webhookDeliveryService = new WebhookDeliveryService();
