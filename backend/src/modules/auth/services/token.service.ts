/**
 * ==================================
 * eLISAschool - Service de gestion des tokens JWT
 * ==================================
 * Version: 2.1.0
 * Auteur: franck arlos chendjou
 *
 * Durcissement v9 — Refresh Token Rotation (family-based)
 * - generateRefreshToken() : assigne familleId (nouveau si premier, hérité sinon)
 * - validateRefreshToken() : marque l'ancien comme révoqué, génère un nouveau dans la famille
 * - Détection compromission : si token révoqué réutilisé → révocation de toute la famille
 *
 * Audit sécurité v10 — v2.1 : GAP 8 — JWT avec claim `plane`
 * - generateAccessToken() : paramètre `plane` optionnel ('platform' | 'tenant')
 * - verifyAccessToken() : rotation de secret — essaie secret principal, puis fallback
 * - Le claim `plane` est préservé dans le JwtPayload retourné (ADR-005)
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Repository, IsNull } from 'typeorm';
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
     * Génère un access token JWT.
     * Audit sécurité v10 — GAP 8 : le paramètre `plane` sélectionne le secret JWT.
     * - 'platform' → secretPlatform (tokens plateforme)
     * - 'tenant'   → secretTenant (tokens établissement)
     * - undefined   → secret (legacy, fallback)
     */
    generateAccessToken(payload: JwtPayload, expiresIn?: string | number): string {
        const secret = payload.plane === 'platform'
            ? envConfig.jwt.secretPlatform
            : payload.plane === 'tenant'
                ? envConfig.jwt.secretTenant
                : envConfig.jwt.secret;

        return jwt.sign(payload, secret, {
            expiresIn: expiresIn || (envConfig.jwt.expiresIn as any),
            issuer: 'eLISAschool',
            audience: 'elisaschool-api',
        });
    }

    /**
     * Génère un refresh token et le stocke en base.
     * Durcissement v9 : assigne un familleId pour la rotation.
     * 
     * @param utilisateurId - ID de l'utilisateur
     * @param adresseIp - Adresse IP du client
     * @param userAgent - User-Agent du client
     * @param familleIdExistante - familleId hérité (si rotation)
     * @param tokenPrecedentId - ID du token précédent dans la chaîne
     * @param plane - ADR-005 (v11) : discriminateur de plan ('tenant' | 'platform')
     */
    async generateRefreshToken(
        utilisateurId: string,
        adresseIp?: string,
        userAgent?: string,
        familleIdExistante?: string,
        tokenPrecedentId?: string,
        plane?: 'tenant' | 'platform',
    ): Promise<string> {
        const token = crypto.randomBytes(64).toString('hex');

        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 30); // 30 jours

        // Famille : héritée si rotation, sinon nouvelle famille
        const familleId = familleIdExistante || crypto.randomUUID();

        const refreshToken = this.refreshTokenRepository.create({
            utilisateurId,
            token,
            adresseIp,
            userAgent,
            expireAt,
            familleId,
            tokenPrecedentId: tokenPrecedentId || null,
            plane: plane || 'tenant', // ADR-005: défaut tenant
        });

        await this.refreshTokenRepository.save(refreshToken);

        logger.debug(`Refresh token créé pour l'utilisateur ${utilisateurId} (famille: ${familleId.substring(0, 8)}...)`);

        return token;
    }

    /**
     * Vérifie et décode un access token.
     * Audit sécurité v10 — GAP 8 : rotation de secrets.
     * Essaie les 3 secrets (platform, tenant, legacy) jusqu'à ce que l'un fonctionne.
     * Permet la transition progressive vers des secrets dédiés par plane.
     */
    verifyAccessToken(token: string): JwtPayload | null {
        // Collecter les secrets uniques à essayer (ordre : platform, tenant, legacy)
        const secrets = [...new Set([
            envConfig.jwt.secretPlatform,
            envConfig.jwt.secretTenant,
            envConfig.jwt.secret,
        ])];

        for (const secret of secrets) {
            try {
                const decoded = jwt.verify(token, secret, {
                    issuer: 'eLISAschool',
                    audience: 'elisaschool-api',
                }) as JwtPayload;

                return decoded;
            } catch {
                // Essayer le secret suivant
            }
        }

        // Aucun secret n'a fonctionné → token invalide
        logger.warn('Token JWT invalide — tous les secrets ont échoué', {
            tokenPrefix: token.substring(0, 20) + '...',
            tokenLength: token.length,
            hasThreeParts: token.split('.').length === 3,
        });

        return null;
    }

    /**
     * Valide un refresh token avec rotation (Durcissement v9).
     * 
     * Algorithme :
     * 1. Chercher le token en base
     * 2. Si révoqué → DÉTECTION COMPROMISSION → révoquer toute la famille
     * 3. Si valide → marquer comme révoqué, retourner les infos pour rotation
     * 
     * @returns Token entity + données pour la rotation, ou null
     */
    async validateRefreshToken(token: string): Promise<{
        refreshToken: RefreshToken;
        rotationData: { familleId: string; tokenPrecedentId: string };
    } | null> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { token },
            relations: ['utilisateur'],
        });

        if (!refreshToken) {
            logger.warn('Refresh token non trouvé');
            return null;
        }

        // =============================================
        // DÉTECTION COMPROMISSION — Token révoqué réutilisé
        // =============================================
        if (refreshToken.revoque) {
            logger.error(
                `[Sécurité] COMPROMISSION DÉTECTÉE — Refresh token révoqué réutilisé : ` +
                `user=${refreshToken.utilisateurId}, famille=${refreshToken.familleId?.substring(0, 8)}, ` +
                `IP=${refreshToken.adresseIp}`
            );

            // Révoquer TOUTE la famille
            if (refreshToken.familleId) {
                await this.revokeTokenFamily(refreshToken.familleId, 'COMPROMISSION_DETECTED');
            }

            return null;
        }

        // Token expiré
        if (refreshToken.estExpire()) {
            logger.warn('Refresh token expiré');
            return null;
        }

        // =============================================
        // ROTATION — Marquer comme révoqué, retourner les données
        // =============================================
        const rotationData = {
            familleId: refreshToken.familleId || crypto.randomUUID(),
            tokenPrecedentId: refreshToken.id,
        };

        // Marquer l'ancien token comme révoqué
        refreshToken.revoque = true;
        refreshToken.revoqueAt = new Date();
        await this.refreshTokenRepository.save(refreshToken);

        return { refreshToken, rotationData };
    }

    /**
     * Révoque tous les tokens d'une famille (compromission détectée).
     */
    private async revokeTokenFamily(familleId: string, raison: string): Promise<void> {
        const result = await this.refreshTokenRepository.update(
            { familleId, revoque: false },
            { revoque: true, revoqueAt: new Date() }
        );

        logger.error(
            `[Sécurité] Famille de tokens révoquée — familleId=${familleId}, ` +
            `raison=${raison}, ${result.affected} tokens révoqués`
        );
    }

    /**
     * Révoque un refresh token (legacy — utilisé par logout)
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
