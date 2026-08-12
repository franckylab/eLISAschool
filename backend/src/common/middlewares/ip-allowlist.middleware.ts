/**
 * ==================================
 * eLISAschool - Middleware IP Allowlist
 * ==================================
 * Version: 1.1.0
 * Durcissement v9 — Restriction d'accès aux routes plateforme par IP.
 *
 * Audit sécurité v10 — v1.1 :
 * - GAP 2 : Fail-closed en production. Si Redis/DB échoue → 403.
 * - Cache local en fallback (TTL 5 min) pour éviter blocage total.
 *
 * Appliqué uniquement sur /api/platform/*.
 * Si la liste est vide → pas de restriction (backward compat).
 * Si la liste contient des IPs → rejeter les IPs non autorisées (403).
 */

import { Request, Response, NextFunction } from 'express';
import { ipAllowlistService } from '@modules/platform-auth/services/ip-allowlist.service';
import { logger } from '@common/utils/logger.util';
import { getClientIP } from '@common/utils/client-ip.util';

/**
 * Cache local pour les IPs autorisées (fallback si Redis indisponible).
 * TTL 5 minutes. Évite un blocage total en cas de panne Redis.
 */
const localCache = new Map<string, { autorisee: boolean; timestamp: number }>();
const LOCAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function ipAllowlistMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const ip = getClientIP(req);
        if (!ip) {
            // Audit sécurité v10 — GAP 2 : en production, rejeter si IP non détectable
            if (process.env.NODE_ENV === 'production') {
                logger.warn(`[IP Allowlist] IP non détectable en production — accès refusé`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'IP_NOT_DETECTED',
                        message: 'Adresse IP non détectable',
                    },
                });
                return;
            }
            next();
            return;
        }

        const autorisee = await ipAllowlistService.verifierIp(ip);

        // Mettre en cache local en cas de succès (fallback)
        localCache.set(ip, { autorisee, timestamp: Date.now() });

        if (!autorisee) {
            logger.warn(
                `[IP Allowlist] Accès refusé — IP: ${ip}, ` +
                `Path: ${req.path}, User: ${req.utilisateur?.id || 'non authentifié'}`
            );

            res.status(403).json({
                success: false,
                error: {
                    code: 'IP_NOT_ALLOWED',
                    message: 'Adresse IP non autorisée à accéder à la plateforme',
                },
            });
            return;
        }

        next();
    } catch (error) {
        // Audit sécurité v10 — GAP 2 : fail-closed en production
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            // Tenter le cache local en fallback
            const ip = getClientIP(req);
            if (ip) {
                const cached = localCache.get(ip);
                if (cached && (Date.now() - cached.timestamp) < LOCAL_CACHE_TTL) {
                    logger.warn(
                        `[IP Allowlist] Erreur DB/Redis — fallback cache local pour IP: ${ip}`
                    );
                    if (cached.autorisee) {
                        next();
                        return;
                    }
                }
            }

            // Pas de cache valide → rejeter
            logger.error(
                '[IP Allowlist] Erreur vérification IP en production — accès refusé (fail-closed)',
                error,
            );
            res.status(403).json({
                success: false,
                error: {
                    code: 'IP_VERIFICATION_ERROR',
                    message: 'Impossible de vérifier l\'adresse IP. Accès temporairement refusé.',
                },
            });
            return;
        }

        // Développement : laisser passer (ne pas bloquer le dev)
        logger.error('[IP Allowlist] Erreur vérification IP (dev — laisser passer)', error);
        next();
    }
}

export default ipAllowlistMiddleware;
