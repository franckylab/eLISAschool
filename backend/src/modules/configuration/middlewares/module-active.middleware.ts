/**
 * ==================================
 * eLISAschool - Middleware Module Actif
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Middleware de vérification qu'un module est activé avant d'accéder à ses endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { configurationService } from '../services/configuration.service';
import { auditService } from '@modules/auth';

// Modules critiques toujours accessibles
const MODULES_CRITIQUES = ['auth', 'utilisateurs', 'configuration', 'notifications'];

/**
 * Middleware qui vérifie si un module est activé
 * @param moduleNom Nom du module à vérifier
 */
export function requireModuleActive(moduleNom: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Modules critiques toujours accessibles
            if (MODULES_CRITIQUES.includes(moduleNom)) {
                next();
                return;
            }

            const etablissementId = req.utilisateur?.etablissementId;
            const estActif = await configurationService.isModuleActive(moduleNom, etablissementId);

            if (!estActif) {
                await auditService.logAccessDenied(
                    req.utilisateur?.id || 'anonymous',
                    `Tentative d'accès au module désactivé: ${moduleNom}`,
                    req
                );

                throw new AppError(
                    `Le module "${moduleNom}" est désactivé. Contactez un administrateur.`,
                    403,
                    'MODULE_INACTIVE'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default { requireModuleActive };
