/**
 * ==================================
 * eLISAschool - Service de gestion des tokens JWT
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { RefreshToken } from '../entities';
import { JwtPayload } from '../dto';
import { envConfig } from '@config/env.config';
import { logger } from '@common/utils/logger.util';

/**
 * Service de gestion des tokens JWT
 */
export class TokenService {
    private refreshTokenRepository: Repository<RefreshToken>;

    constructor() {
        this.refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    }

    /**
     * Génère un access token JWT
     * @param payload - Données à inclure dans le token
     */
    generateAccessToken(payload: JwtPayload): string {
        return jwt.sign(payload, envConfig.jwt.secret, {
            expiresIn: envConfig.jwt.expiresIn as any,
            issuer: 'eLISAschool',
            audience: 'elisaschool-api',
        });
    }

    /**
     * Génère un refresh token et le stocke en base
     * @param utilisateurId - ID de l'utilisateur
     * @param adresseIp - Adresse IP du client
     * @param userAgent - User-Agent du client
     */
    async generateRefreshToken(
        utilisateurId: string,
        adresseIp?: string,
        userAgent?: string
    ): Promise<string> {
        // Génère un token aléatoire sécurisé
        const token = crypto.randomBytes(64).toString('hex');

        // Calcule la date d'expiration
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 30); // 30 jours

        // Crée l'entrée en base
        const refreshToken = this.refreshTokenRepository.create({
            utilisateurId,
            token,
            adresseIp,
            userAgent,
            expireAt,
        });

        await this.refreshTokenRepository.save(refreshToken);

        logger.debug(`Refresh token créé pour l'utilisateur ${utilisateurId}`);

        return token;
    }

    /**
     * Vérifie et décode un access token
     * @param token - Token à vérifier
     */
    verifyAccessToken(token: string): JwtPayload | null {
        try {
            const decoded = jwt.verify(token, envConfig.jwt.secret, {
                issuer: 'eLISAschool',
                audience: 'elisaschool-api',
            }) as JwtPayload;

            return decoded;
        } catch (error) {
            logger.warn('Échec de vérification du token JWT', { error });
            return null;
        }
    }

    /**
     * Valide un refresh token et retourne le token entity
     * @param token - Refresh token à valider
     */
    async validateRefreshToken(token: string): Promise<RefreshToken | null> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token },
            relations: ['utilisateur'],
        });

        if (!refreshToken) {
            logger.warn('Refresh token non trouvé');
            return null;
        }

        if (!refreshToken.estValide()) {
            logger.warn('Refresh token invalide ou expiré');
            return null;
        }

        return refreshToken;
    }

    /**
     * Révoque un refresh token
     * @param token - Token à révoquer
     */
    async revokeRefreshToken(token: string): Promise<boolean> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token },
        });

        if (!refreshToken) {
            return false;
        }

        refreshToken.revoque = true;
        refreshToken.revoqueAt = new Date();

        await this.refreshTokenRepository.save(refreshToken);

        logger.info(`Refresh token révoqué pour l'utilisateur ${refreshToken.utilisateurId}`);

        return true;
    }

    /**
     * Révoque tous les refresh tokens d'un utilisateur
     * @param utilisateurId - ID de l'utilisateur
     */
    async revokeAllUserTokens(utilisateurId: string): Promise<number> {
        const result = await this.refreshTokenRepository.update(
            { utilisateurId, revoque: false },
            { revoque: true, revoqueAt: new Date() }
        );

        logger.info(`${result.affected} refresh tokens révoqués pour l'utilisateur ${utilisateurId}`);

        return result.affected || 0;
    }

    /**
     * Nettoie les tokens expirés (à appeler périodiquement)
     */
    async cleanupExpiredTokens(): Promise<number> {
        const result = await this.refreshTokenRepository
            .createQueryBuilder()
            .delete()
            .where('expireAt < :now', { now: new Date() })
            .orWhere('revoque = :revoque', { revoque: true })
            .execute();

        logger.info(`${result.affected} tokens expirés/révoqués supprimés`);

        return result.affected || 0;
    }

    /**
     * Génère un token de vérification email ou réinitialisation
     */
    generateSecureToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

// Instance singleton
export const tokenService = new TokenService();

export default TokenService;
