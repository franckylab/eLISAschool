/**
 * ==================================
 * eLISAschool - Service Sessions Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Gestion des sessions plateforme : CRUD, révocation, limite 3 LRU.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { SessionPlateforme } from '../entities/session-plateforme.entity';
import { logger } from '@common/utils/logger.util';

const MAX_SESSIONS_PER_USER = 3;

export class PlatformSessionsService {
    private sessionRepo: Repository<SessionPlateforme>;

    constructor() {
        this.sessionRepo = AppDataSource.getRepository(SessionPlateforme);
    }

    /**
     * Liste les sessions actives d'un utilisateur plateforme.
     */
    async getActiveSessions(utilisateurPlateformeId: string) {
        return this.sessionRepo.find({
            where: {
                utilisateurPlateformeId,
                expiresAt: new Date(),
            },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Liste TOUTES les sessions actives (admin view).
     */
    async getAllActiveSessions() {
        return this.sessionRepo.find({
            where: { expiresAt: new Date() },
            order: { createdAt: 'DESC' },
            relations: ['utilisateurPlateforme'],
        });
    }

    /**
     * Crée une session et applique la limite LRU (max 3).
     */
    async createSession(
        utilisateurPlateformeId: string,
        token: string,
        ip?: string,
        userAgent?: string,
        expiresInMinutes = 1440, // 24h par défaut
    ): Promise<SessionPlateforme> {
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        const session = this.sessionRepo.create({
            utilisateurPlateformeId,
            token,
            ip: ip || null,
            userAgent: userAgent || null,
            expiresAt,
        });

        await this.sessionRepo.save(session);

        // Appliquer la limite LRU : supprimer les sessions les plus anciennes
        await this.enforceSessionLimit(utilisateurPlateformeId);

        return session;
    }

    /**
     * Révoque une session spécifique.
     */
    async revokeSession(sessionId: string): Promise<void> {
        const result = await this.sessionRepo.delete(sessionId);
        if (result.affected === 0) {
            throw new Error('Session introuvable');
        }
        logger.info(`Session ${sessionId} révoquée`);
    }

    /**
     * Révoque toutes les sessions d'un utilisateur.
     */
    async revokeAllSessions(utilisateurPlateformeId: string): Promise<number> {
        const result = await this.sessionRepo.delete({ utilisateurPlateformeId });
        logger.info(`Toutes les sessions de ${utilisateurPlateformeId} révoquées (${result.affected || 0})`);
        return result.affected || 0;
    }

    /**
     * Nettoie les sessions expirées (cron).
     */
    async cleanupExpiredSessions(): Promise<number> {
        const result = await this.sessionRepo.delete({
            expiresAt: LessThan(new Date()),
        });
        return result.affected || 0;
    }

    /**
     * Applique la limite de sessions LRU.
     */
    private async enforceSessionLimit(utilisateurPlateformeId: string): Promise<void> {
        const sessions = await this.sessionRepo.find({
            where: { utilisateurPlateformeId },
            order: { createdAt: 'DESC' },
        });

        if (sessions.length > MAX_SESSIONS_PER_USER) {
            const toDelete = sessions.slice(MAX_SESSIONS_PER_USER);
            const ids = toDelete.map(s => s.id);
            await this.sessionRepo.delete(ids);
            logger.info(`${ids.length} session(s) LRU supprimée(s) pour ${utilisateurPlateformeId}`);
        }
    }
}

export const platformSessionsService = new PlatformSessionsService();
