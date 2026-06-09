/**
 * ==================================
 * eLISAschool - Middleware Guard Accès Parent-Élève
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Middleware pour vérifier si un parent connecté a le droit
 * d'accéder aux données d'un élève spécifique.
 */

import { Request, Response, NextFunction } from 'express';
import { parentsService } from '@modules/responsables-eleves/services';
import { AppError } from '@common/filters/error.filter';

/**
 * Middleware pour vérifier l'accès parent-élève
 * 
 * Utilisation:
 * router.get('/notes/:eleveId', 
 *     authMiddleware, 
 *     requireParentAccess('eleveId'),
 *     async (req, res) => { ... }
 * );
 * 
 * @param paramName - Nom du paramètre dans req.params contenant l'ID de l'élève (utilisateurId)
 */
export function requireParentAccess(paramName: string = 'eleveId') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Vérifier que l'utilisateur est authentifié
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            // Récupérer l'ID de l'élève depuis les params ou query
            const eleveUtilisateurId = req.params[paramName] || req.query[paramName] as string;

            if (!eleveUtilisateurId) {
                throw new AppError(`Paramètre '${paramName}' manquant`, 400, 'MISSING_PARAMETER');
            }

            // Vérifier l'accès
            const peutAcceder = await parentsService.peutAccederEleve(
                req.utilisateur.id,
                eleveUtilisateurId
            );

            if (!peutAcceder) {
                throw new AppError(
                    'Accès non autorisé: vous n\'êtes pas responsable de cet élève',
                    403,
                    'PARENT_ACCESS_DENIED'
                );
            }

            // Ajouter l'info au request pour usage dans le handler
            req.parentAccessVerified = true;
            req.eleveUtilisateurId = eleveUtilisateurId;

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour vérifier si le parent peut effectuer des paiements
 * 
 * @param paramName - Nom du paramètre contenant l'ID de l'élève
 */
export function requireParentPaymentAccess(paramName: string = 'eleveId') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.utilisateur?.id) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            const eleveUtilisateurId = req.params[paramName] || req.query[paramName] as string;

            if (!eleveUtilisateurId) {
                throw new AppError(`Paramètre '${paramName}' manquant`, 400, 'MISSING_PARAMETER');
            }

            const peutPayer = await parentsService.peutPayerPourEleve(
                req.utilisateur.id,
                eleveUtilisateurId
            );

            if (!peutPayer) {
                throw new AppError(
                    'Accès non autorisé: vous ne pouvez pas effectuer de paiements pour cet élève',
                    403,
                    'PARENT_PAYMENT_DENIED'
                );
            }

            req.parentPaymentVerified = true;
            req.eleveUtilisateurId = eleveUtilisateurId;

            next();
        } catch (error) {
            next(error);
        }
    };
}

// Déclaration des extensions de type pour Request
declare global {
    namespace Express {
        interface Request {
            parentAccessVerified?: boolean;
            parentPaymentVerified?: boolean;
            eleveUtilisateurId?: string;
        }
    }
}
