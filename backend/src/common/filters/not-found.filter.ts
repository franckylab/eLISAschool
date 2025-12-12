/**
 * ==================================
 * eLISAschool - Gestionnaire 404 (Route non trouvée)
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Request, Response } from 'express';

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `La route ${req.method} ${req.path} n'existe pas`,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
    });
}

export default notFoundHandler;
