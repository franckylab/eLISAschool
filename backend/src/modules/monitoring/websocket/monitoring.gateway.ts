/**
 * ==================================
 * eLISAschool - Monitoring WebSocket Gateway
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase M.1 — Refonte SaaS v3
 * Broadcast temps réel pour le dashboard monitoring :
 * - Nouvelles alertes
 * - Changement santé établissement
 * - Paiements reçus
 * - Métriques Noisy Neighbor
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '@common/utils/logger.util';

// =============================================
// Types
// =============================================

export interface MonitoringEvent {
    type: 'alert' | 'health_change' | 'payment' | 'noisy_neighbor' | 'metrics';
    timestamp: string;
    data: Record<string, any>;
}

export interface AlertEvent extends MonitoringEvent {
    type: 'alert';
    data: {
        id: string;
        severity: 'info' | 'warning' | 'critical';
        message: string;
        rule: string;
        etablissementId?: string;
    };
}

export interface HealthChangeEvent extends MonitoringEvent {
    type: 'health_change';
    data: {
        etablissementId: string;
        nomEtablissement?: string;
        previousStatus: 'healthy' | 'degraded' | 'unhealthy';
        newStatus: 'healthy' | 'degraded' | 'unhealthy';
        reason?: string;
    };
}

export interface PaymentEvent extends MonitoringEvent {
    type: 'payment';
    data: {
        factureId: string;
        montant: number;
        devise: string;
        provider: string;
        etablissementId: string;
    };
}

export interface NoisyNeighborEvent extends MonitoringEvent {
    type: 'noisy_neighbor';
    data: {
        etablissementId: string;
        nomEtablissement?: string;
        scoreCharge: number;
        statut: 'normal' | 'warning' | 'critique';
        nombreEleves: number;
        volumeDonnees: number;
    };
}

export interface MetricsEvent extends MonitoringEvent {
    type: 'metrics';
    data: {
        platform: {
            totalEtablissements: number;
            totalUtilisateurs: number;
            totalEleves: number;
        };
        health: Array<{
            service: string;
            status: 'healthy' | 'degraded' | 'unhealthy';
            latency?: number;
        }>;
    };
}

// =============================================
// Gateway
// =============================================

/**
 * Monitoring WebSocket Gateway.
 * Gère les connexions et le broadcast d'événements monitoring.
 */
export class MonitoringGateway {
    private io: SocketIOServer | null = null;
    private connectedClients = new Map<string, Set<string>>(); // roomId → Set<socketId>

    /**
     * Initialise le serveur Socket.IO attaché au serveur HTTP.
     *
     * Best practice : le gateway doit être branché sur le HttpServer
     * retourné par `app.listen()` (voir `backend/src/index.ts`).
     * Sans cet appel, aucun serveur WebSocket n'écoute et le client
     * échoue avec `WebSocket connection to 'ws://.../monitoring/' failed`.
     */
    initialize(server: HttpServer): void {
        const isProduction = process.env.NODE_ENV === 'production';
        this.io = new SocketIOServer(server, {
            path: '/monitoring',
            cors: {
                // En production : restreindre à l'URL frontend.
                // En développement : accepter localhost + sous-réseaux privés.
                origin: isProduction
                    ? (process.env.FRONTEND_URL || true)
                    : true,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            // Best practice : polling d'abord, upgrade websocket ensuite.
            // Tenter le websocket en premier génère une erreur console
            // navigateur immédiate (`failed:`) quand le serveur est
            // indisponible, avant même le fallback polling.
            transports: ['polling', 'websocket'],
        });

        this.io.on('connection', (socket: Socket) => {
            this.handleConnection(socket);
        });

        logger.info('[MonitoringGateway] WebSocket gateway initialisé (path: /monitoring)');
    }

    /**
     * Gère une nouvelle connexion socket.
     *
     * NOTE sécurité : le rôle est fourni par le client (query param)
     * et n'est PAS vérifié ici. Ne jamais diffuser de données
     * sensibles sur ce canal sans vérification JWT préalable
     * (`socket.handshake.auth.token`). Le gateway ne diffuse que
     * des métriques/alertes agrégées non sensibles.
     */
    private handleConnection(socket: Socket): void {
        const userId = socket.handshake.query.userId as string | undefined;
        const role = socket.handshake.query.role as string | undefined;

        // Rejet des connexions anonymes ou sans rôle reconnu.
        if (!userId || !['SUPER_ADMIN', 'ADMIN'].includes(role ?? '')) {
            logger.warn(`[MonitoringGateway] Connexion rejetée: ${socket.id} (user: ${userId ?? '?'}, role: ${role ?? '?'})`);
            socket.disconnect(true);
            return;
        }

        logger.info(`[MonitoringGateway] Connexion: ${socket.id} (user: ${userId}, role: ${role})`);

        // Room plateforme (SUPER_ADMIN uniquement)
        if (role === 'SUPER_ADMIN') {
            socket.join('platform');
            this.addToRoom('platform', socket.id);
        }

        // Room établissement
        const etablissementId = socket.handshake.query.etablissementId as string;
        if (etablissementId) {
            socket.join(`etablissement:${etablissementId}`);
            this.addToRoom(`etablissement:${etablissementId}`, socket.id);
        }

        // Room monitoring (tous les admins)
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
            socket.join('monitoring');
            this.addToRoom('monitoring', socket.id);
        }

        socket.on('disconnect', () => {
            this.removeFromAllRooms(socket.id);
            logger.info(`[MonitoringGateway] Déconnexion: ${socket.id}`);
        });
    }

    // =============================================
    // Broadcast methods
    // =============================================

    /**
     * Broadcast une nouvelle alerte aux SUPER_ADMIN.
     */
    broadcastAlert(event: AlertEvent): void {
        this.emit('monitoring:alert', event, 'platform');
    }

    /**
     * Broadcast un changement de santé établissement.
     */
    broadcastHealthChange(event: HealthChangeEvent): void {
        // À la plateforme + à l'établissement concerné
        this.emit('monitoring:health', event, 'platform');
        if (event.data.etablissementId) {
            this.emit('monitoring:health', event, `etablissement:${event.data.etablissementId}`);
        }
    }

    /**
     * Broadcast un paiement reçu.
     */
    broadcastPayment(event: PaymentEvent): void {
        this.emit('monitoring:payment', event, 'platform');
        this.emit('monitoring:payment', event, `etablissement:${event.data.etablissementId}`);
    }

    /**
     * Broadcast un événement noisy neighbor.
     */
    broadcastNoisyNeighbor(event: NoisyNeighborEvent): void {
        this.emit('monitoring:noisy-neighbor', event, 'platform');
    }

    /**
     * Broadcast des métriques agrégées (périodique).
     */
    broadcastMetrics(event: MetricsEvent): void {
        this.emit('monitoring:metrics', event, 'monitoring');
    }

    // =============================================
    // Internal
    // =============================================

    private emit(event: string, data: MonitoringEvent, room: string): void {
        if (!this.io) {
            logger.warn('[MonitoringGateway] IO non initialisé, événement ignoré');
            return;
        }

        this.io.to(room).emit(event, data);
    }

    private addToRoom(room: string, socketId: string): void {
        if (!this.connectedClients.has(room)) {
            this.connectedClients.set(room, new Set());
        }
        this.connectedClients.get(room)!.add(socketId);
    }

    private removeFromAllRooms(socketId: string): void {
        for (const [, sockets] of this.connectedClients) {
            sockets.delete(socketId);
        }
    }

    /**
     * Nombre de clients connectés par room.
     */
    getRoomStats(): Record<string, number> {
        const stats: Record<string, number> = {};
        for (const [room, sockets] of this.connectedClients) {
            stats[room] = sockets.size;
        }
        return stats;
    }

    /**
     * Détruit le serveur Socket.IO.
     */
    destroy(): void {
        if (this.io) {
            this.io.close();
            this.io = null;
        }
        this.connectedClients.clear();
    }
}

// Singleton
export const monitoringGateway = new MonitoringGateway();
