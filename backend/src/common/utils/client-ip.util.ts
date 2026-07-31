/**
 * ==================================
 * eLISAschool - Extraction de l'IP client réelle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Extrait l'adresse IP réelle du client derrière un proxy (nginx, Docker bridge).
 * Lit les headers dans l'ordre : X-Forwarded-For → X-Real-IP → req.ip → socket.
 *
 * Prérequis : app.set('trust proxy', true) dans Express pour que req.ip
 *             reflète correctement X-Forwarded-For quand un proxy est présent.
 */

import type { Request } from 'express';

/**
 * Extrait l'adresse IP réelle du client depuis une requête Express.
 *
 * Ordre de résolution :
 * 1. `X-Forwarded-For` (injecté par nginx, load balancers)
 * 2. `X-Real-IP` (injecté par nginx)
 * 3. `req.ip` (résolu par Express via trust proxy)
 * 4. `req.socket.remoteAddress` (connexion directe)
 * 5. `'unknown'` (fallback)
 *
 * Pour `X-Forwarded-For`, la première IP de la liste est retenue
 * (c'est l'IP du client original, les suivantes sont les proxies intermédiaires).
 */
export function getClientIP(req: Request): string {
    // 1. X-Forwarded-For (standard de facto, injecté par nginx/proxies)
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        // Format : "client_ip, proxy1_ip, proxy2_ip"
        const clientIP = forwarded.split(',')[0].trim();
        if (clientIP && clientIP !== 'unknown') {
            return clientIP;
        }
    }

    // 2. X-Real-IP (header nginx spécifique)
    const realIP = req.headers['x-real-ip'];
    if (typeof realIP === 'string' && realIP.length > 0 && realIP !== 'unknown') {
        return realIP;
    }

    // 3. req.ip (résolu par Express — nécessite trust proxy)
    if (req.ip && req.ip !== 'unknown') {
        return req.ip;
    }

    // 4. Socket remote address (connexion directe sans proxy)
    const socketIP = req.socket?.remoteAddress;
    if (socketIP && socketIP !== 'unknown') {
        return socketIP;
    }

    // 5. Fallback
    return 'unknown';
}
