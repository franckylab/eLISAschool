/**
 * ==================================
 * eLISAschool - Service SSE Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Server-Sent Events pour mise à jour temps réel du dashboard
 */

import { Response, Request } from 'express';
import { logger } from '@common/utils/logger.util';

interface SSEClient {
    id: string;
    userId: string;
    response: Response;
    createdAt: Date;
    lastHeartbeat: Date;
}

export class DashboardSSEService {
    private clients: Map<string, SSEClient> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Nettoyage périodique des clients inactifs
        this.startHeartbeat();
    }

    /**
     * Ajoute un client SSE
     */
    addClient(userId: string, res: Response): string {
        const clientId = `${userId}_${Date.now()}`;
        
        // Configurer les headers SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        const client: SSEClient = {
            id: clientId,
            userId,
            response: res,
            createdAt: new Date(),
            lastHeartbeat: new Date(),
        };

        this.clients.set(clientId, client);
        logger.info(`[DashboardSSE] Client connecté: ${clientId} (total: ${this.clients.size})`);

        // Envoyer événement de connexion
        this.sendEvent(res, 'connected', {
            clientId,
            timestamp: new Date().toISOString(),
            message: 'Connexion SSE établie',
        });

        // Gérer la déconnexion via le response
        res.on('close', () => {
            this.removeClient(clientId);
        });

        return clientId;
    }

    /**
     * Supprime un client
     */
    removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            client.response.end();
            this.clients.delete(clientId);
            logger.info(`[DashboardSSE] Client déconnecté: ${clientId} (total: ${this.clients.size})`);
        }
    }

    /**
     * Envoie un événement à un client spécifique
     */
    sendToClient(clientId: string, event: string, data: any): boolean {
        const client = this.clients.get(clientId);
        if (!client) {
            logger.warn(`[DashboardSSE] Client non trouvé: ${clientId}`);
            return false;
        }

        return this.sendEvent(client.response, event, data);
    }

    /**
     * Envoie un événement à tous les clients d'un utilisateur
     */
    sendToUser(userId: string, event: string, data: any): number {
        let count = 0;
        
        for (const [clientId, client] of this.clients.entries()) {
            if (client.userId === userId) {
                if (this.sendEvent(client.response, event, data)) {
                    count++;
                }
            }
        }

        if (count > 0) {
            logger.debug(`[DashboardSSE] Événement "${event}" envoyé à ${count} client(s) de user ${userId}`);
        }

        return count;
    }

    /**
     * Envoie un événement à TOUS les clients
     */
    broadcast(event: string, data: any): number {
        let count = 0;
        
        for (const [clientId, client] of this.clients.entries()) {
            if (this.sendEvent(client.response, event, data)) {
                count++;
            }
        }

        if (count > 0) {
            logger.debug(`[DashboardSSE] Broadcast "${event}" à ${count} client(s)`);
        }

        return count;
    }

    /**
     * Envoie un événement spécifique au type de widget
     */
    notifyWidgetUpdate(widgetId: string, data: any, userId?: string): void {
        const event = 'widget:update';
        const payload = {
            widgetId,
            data,
            timestamp: new Date().toISOString(),
        };

        if (userId) {
            this.sendToUser(userId, event, payload);
        } else {
            this.broadcast(event, payload);
        }
    }

    /**
     * Envoie un événement de rafraîchissement complet
     */
    notifyDashboardRefresh(userId: string): void {
        this.sendToUser(userId, 'dashboard:refresh', {
            message: 'Rafraîchissement du dashboard',
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Envoie un heartbeat à tous les clients
     */
    private sendHeartbeat(): void {
        let activeClients = 0;
        
        for (const [clientId, client] of this.clients.entries()) {
            const alive = this.sendEvent(client.response, 'heartbeat', {
                timestamp: new Date().toISOString(),
                serverTime: Date.now(),
            });

            if (alive) {
                activeClients++;
                client.lastHeartbeat = new Date();
            }
        }

        if (activeClients !== this.clients.size) {
            logger.debug(`[DashboardSSE] Heartbeat: ${activeClients}/${this.clients.size} clients actifs`);
        }
    }

    /**
     * Envoie un événement SSE formaté
     */
    private sendEvent(res: Response, event: string, data: any): boolean {
        try {
            const eventData = JSON.stringify(data);
            const message = `event: ${event}\ndata: ${eventData}\n\n`;
            
            return res.write(message);
        } catch (error) {
            logger.error(`[DashboardSSE] Erreur envoi événement:`, error);
            return false;
        }
    }

    /**
     * Heartbeat périodique (toutes les 30s)
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
            this.cleanupInactiveClients();
        }, 30000); // 30 secondes

        logger.info('[DashboardSSE] Heartbeat activé (intervalle: 30s)');
    }

    /**
     * Nettoyage des clients inactifs (> 2 min sans heartbeat)
     */
    private cleanupInactiveClients(): void {
        const now = Date.now();
        const maxInactiveTime = 2 * 60 * 1000; // 2 minutes
        let cleaned = 0;

        for (const [clientId, client] of this.clients.entries()) {
            const lastActivity = client.lastHeartbeat.getTime();
            
            if (now - lastActivity > maxInactiveTime) {
                this.removeClient(clientId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`[DashboardSSE] Nettoyage: ${cleaned} client(s) inactif(s) supprimé(s)`);
        }
    }

    /**
     * Statistiques SSE
     */
    getStats(): {
        totalClients: number;
        uniqueUsers: number;
        clientsByUser: Record<string, number>;
        uptime: number;
    } {
        const uniqueUsers = new Set<string>();
        const clientsByUser: Record<string, number> = {};

        for (const client of this.clients.values()) {
            uniqueUsers.add(client.userId);
            clientsByUser[client.userId] = (clientsByUser[client.userId] || 0) + 1;
        }

        return {
            totalClients: this.clients.size,
            uniqueUsers: uniqueUsers.size,
            clientsByUser,
            uptime: process.uptime(),
        };
    }

    /**
     * Arrêt propre du service
     */
    shutdown(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Déconnecter tous les clients
        for (const clientId of this.clients.keys()) {
            this.removeClient(clientId);
        }

        logger.info('[DashboardSSE] Service arrêté');
    }
}

export const dashboardSSEService = new DashboardSSEService();
