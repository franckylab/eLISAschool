/**
 * ==================================
 * eLISAschool - CASL Middleware
 * ==================================
 * Version: 5.1.0
 * 
 * Injecte req.ability (instance CASL PureAbility) sur chaque requête.
 * Utilise le contexte utilisateur (JWT) pour définir les capacités.
 * 
 * Phase 2.1 — Refonte SaaS
 */

import { Request, Response, NextFunction } from 'express';
import { defineAbility, AppAbility, AbilityContext } from '@shared/casl/abilities';

// Extension du type Request pour inclure ability
declare global {
    namespace Express {
        interface Request {
            ability?: AppAbility;
        }
    }
}

/**
 * Middleware CASL — résout les abilities de l'utilisateur et les injecte dans req.
 * 
 * Doit être placé APRÈS authMiddleware (qui remplit req.utilisateur).
 * 
 * @example
 * router.get('/eleves', authMiddleware, caslMiddleware, (req, res) => {
 *     if (req.ability!.can('read', 'Eleve')) { ... }
 * });
 */
export function caslMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
        if (!req.utilisateur) {
            next();
            return;
        }

        const ctx: AbilityContext = {
            id: req.utilisateur.id,
            role: req.utilisateur.role,
            etablissementId: req.utilisateur.etablissementId || req.etablissementId,
            permissions: (req.utilisateur as any).permissions || [],
            etablissements: (req.utilisateur as any).etablissements || [],
        };

        req.ability = defineAbility(ctx);
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Middleware guard CASL — vérifie une permission spécifique.
 * Retourne 403 si la capacité n'est pas autorisée.
 * 
 * @param action - Action CASL (read, create, update, delete, manage)
 * @param subject - Sujet CASL (Eleve, Note, Finances, etc.)
 * 
 * @example
 * router.get('/eleves', authMiddleware, caslMiddleware, requireCasl('read', 'Eleve'), handler);
 */
export function requireCasl(action: string, subject: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.ability) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'NO_ABILITY', message: 'Capacités non résolues' },
                });
            }

            if (!req.ability.can(action as any, subject as any)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_ABILITY',
                        message: `Action "${action}" non autorisée sur "${subject}"`,
                    },
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default caslMiddleware;
