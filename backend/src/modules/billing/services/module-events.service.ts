/**
 * ==================================
 * eLISAschool - Module Events Service
 * ==================================
 * Refonte SaaS — Fusion P7.1
 *
 * Émet des événements lifecycle pour les modules :
 *   - module.activated
 *   - module.deactivated
 *   - module.subscribed
 *   - module.unsubscribed
 *
 * Les événements sont dispatchés au webhook delivery service
 * pour notification aux systèmes externes configurés.
 */

import { logger } from '@common/utils/logger.util';
import { webhookDeliveryService } from './webhook-delivery.service';

// =============================================
// TYPES
// =============================================

export type ModuleEventType =
    | 'module.activated'
    | 'module.deactivated'
    | 'module.subscribed'
    | 'module.unsubscribed';

export interface ModuleEvent {
    type: ModuleEventType;
    timestamp: string;
    data: {
        moduleCode: string;
        moduleName: string;
        etablissementId: string;
        source?: string;
        planActuel?: string;
        raison?: string;
    };
}

// =============================================
// SERVICE
// =============================================

export class ModuleEventsService {
    /**
     * Émet un événement module et le dispatche aux webhooks.
     */
    async emit(event: ModuleEvent): Promise<void> {
        logger.info(
            `[ModuleEvents] ${event.type} — Module: ${event.data.moduleCode} — ` +
            `Établissement: ${event.data.etablissementId}`
        );

        // Dispatch au webhook delivery (fire-and-forget)
        try {
            await webhookDeliveryService.dispatch(event);
        } catch (err) {
            logger.warn(`[ModuleEvents] Webhook dispatch échoué pour ${event.type}`);
        }
    }

    async moduleActivated(moduleCode: string, moduleName: string, etablissementId: string, source?: string): Promise<void> {
        await this.emit({
            type: 'module.activated',
            timestamp: new Date().toISOString(),
            data: { moduleCode, moduleName, etablissementId, source },
        });
    }

    async moduleDeactivated(moduleCode: string, moduleName: string, etablissementId: string, raison?: string): Promise<void> {
        await this.emit({
            type: 'module.deactivated',
            timestamp: new Date().toISOString(),
            data: { moduleCode, moduleName, etablissementId, raison },
        });
    }

    async moduleSubscribed(moduleCode: string, moduleName: string, etablissementId: string, planActuel?: string): Promise<void> {
        await this.emit({
            type: 'module.subscribed',
            timestamp: new Date().toISOString(),
            data: { moduleCode, moduleName, etablissementId, planActuel },
        });
    }

    async moduleUnsubscribed(moduleCode: string, moduleName: string, etablissementId: string): Promise<void> {
        await this.emit({
            type: 'module.unsubscribed',
            timestamp: new Date().toISOString(),
            data: { moduleCode, moduleName, etablissementId },
        });
    }
}

export const moduleEventsService = new ModuleEventsService();
