/**
 * ==================================
 * eLISAschool - Service WebSocket pour Sondages
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Gestion des événements en temps réel pour les sondages
 */

import { logger } from '@common/utils/logger.util';

// Socket.IO sera initialisé dynamiquement si disponible
interface SocketIOServer {
    to: (room: string) => { emit: (event: string, data: any) => void };
}

interface SondageSocket {
    join: (room: string) => void;
    leave: (room: string) => void;
}

interface SondageEventData {
    sondageId: string;
    utilisateurId?: string;
    optionId?: string;
    nombreVotes?: number;
    timestamp: Date;
}

/**
 * Service WebSocket pour les sondages
 */
class SondageWebSocketService {
    private io: SocketIOServer | null = null;

    /**
     * Initialiser le service avec l'instance Socket.IO
     */
    initialize(io: SocketIOServer): void {
        this.io = io;
        logger.info('🔌 Service WebSocket sondages initialisé');
    }

    /**
     * Notifier d'un nouveau vote sur un sondage
     */
    broadcastNouveauVote(data: SondageEventData): void {
        if (!this.io) return;

        this.io.to(`sondage:${data.sondageId}`).emit('sondage:nouveau_vote', {
            type: 'VOTE',
            data,
        });

        logger.debug(`[WebSocket] Vote broadcasté pour sondage ${data.sondageId}`);
    }

    /**
     * Notifier de la fermeture d'un sondage
     */
    broadcastSondageFerme(sondageId: string, statistiques: any): void {
        if (!this.io) return;

        this.io.to(`sondage:${sondageId}`).emit('sondage:ferme', {
            type: 'FERMETURE',
            data: {
                sondageId,
                statistiques,
                timestamp: new Date(),
            },
        });

        logger.info(`[WebSocket] Sondage ${sondageId} fermé broadcasté`);
    }

    /**
     * Notifier d'un sondage programmé activé
     */
    broadcastSondageActive(sondageId: string, destinataireIds: string[]): void {
        if (!this.io) return;

        // Notifier tous les destinataires
        destinataireIds.forEach((userId) => {
            if (this.io) {
                this.io.to(`user:${userId}`).emit('sondage:active', {
                    type: 'ACTIVATION',
                    data: {
                        sondageId,
                        timestamp: new Date(),
                    },
                });
            }
        });

        logger.info(`[WebSocket] Sondage ${sondageId} activé pour ${destinataireIds.length} utilisateurs`);
    }

    /**
     * Rejoindre une room de sondage
     */
    joinSondageRoom(socket: SondageSocket, sondageId: string): void {
        socket.join(`sondage:${sondageId}`);
        logger.debug(`[WebSocket] Client rejoint sondage:${sondageId}`);
    }

    /**
     * Quitter une room de sondage
     */
    leaveSondageRoom(socket: SondageSocket, sondageId: string): void {
        socket.leave(`sondage:${sondageId}`);
        logger.debug(`[WebSocket] Client quitté sondage:${sondageId}`);
    }
}

export const sondageWebSocketService = new SondageWebSocketService();
