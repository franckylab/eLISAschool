/**
 * ==================================
 * eLISAschool - Interceptor Audit Automatique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Interceptor Express pour capturer automatiquement les opérations CRUD
 * et générer des logs d'audit sans instrumentation manuelle
 */

import { Request, Response, NextFunction } from 'express';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Configuration de l'interceptor d'audit
 */
interface AuditInterceptorConfig {
    /** Nom du module (ex: 'eleves', 'utilisateurs') */
    module: string;
    /** Nom de l'entité (ex: 'Eleve', 'Utilisateur') */
    entityType: string;
    /** Routes à exclure de l'audit */
    excludeRoutes?: string[];
    /** Routes spécifiques avec actions custom */
    customActions?: {
        route: string;
        method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        action: AuditAction;
    }[];
}

/**
 * Mapping des méthodes HTTP vers les actions d'audit par défaut
 */
const DEFAULT_ACTION_MAP: Record<string, string> = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
};

/**
 * Crée un interceptor d'audit automatique pour un module
 * 
 * @param config - Configuration de l'interceptor
 * @returns Middleware Express
 * 
 * @example
 * // Dans un controller
 * import { createAuditInterceptor } from '@common/interceptors/audit.interceptor';
 * 
 * const auditInterceptor = createAuditInterceptor({
 *     module: 'eleves',
 *     entityType: 'Eleve',
 * });
 * 
 * router.post('/', authMiddleware, auditInterceptor, async (req, res) => {
 *     // L'audit sera automatiquement généré
 * });
 */
export function createAuditInterceptor(config: AuditInterceptorConfig) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Vérifier si la route doit être exclue
            if (config.excludeRoutes?.includes(req.path)) {
                return next();
            }

            // Vérifier si c'est une action custom
            const customAction = config.customActions?.find(
                c => c.route === req.path && c.method === req.method
            );

            // Déterminer l'action d'audit
            const actionSuffix = DEFAULT_ACTION_MAP[req.method];
            let auditAction: AuditAction;

            if (customAction) {
                auditAction = customAction.action;
            } else if (actionSuffix) {
                // Construire l'action dynamiquement: ELEVE_CREATE, etc.
                const actionKey = `${config.entityType.toUpperCase()}_${actionSuffix}`;
                auditAction = AuditAction[actionKey as keyof typeof AuditAction];
                
                // Fallback si l'action n'existe pas
                if (!auditAction) {
                    logger.warn(`[AUDIT INTERCEPTOR] Action non trouvée: ${actionKey}`);
                    return next();
                }
            } else {
                return next();
            }

            // Capturer les données AVANT la modification (pour UPDATE/DELETE)
            const anciennesValeurs = (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')
                ? { ...req.body } // Dans une implémentation avancée, on fetcherait l'entité
                : undefined;

            // Stocker les infos dans res.locals pour utilisation après la réponse
            res.locals.auditData = {
                action: auditAction,
                anciennesValeurs,
                nouvellesValeurs: req.method === 'POST' ? { ...req.body } : undefined,
            };

            // Ajouter un hook sur la fin de la réponse
            const originalJson = res.json.bind(res);
            res.json = function (body: any) {
                // Exécuter l'audit APRÈS que la réponse soit envoyée
                setImmediate(async () => {
                    try {
                        if (!req.utilisateur?.id) {
                            return;
                        }

                        // Si la requête a échoué, ne pas logger ou logger l'erreur
                        if (body?.success === false) {
                            await auditService.log({
                                utilisateurId: req.utilisateur!.id,
                                action: auditAction,
                                cible: config.entityType,
                                cibleId: body?.data?.id,
                                description: `Échec ${config.entityType.toLowerCase()} ${actionSuffix?.toLowerCase()}`,
                                estEchec: true,
                                erreur: body?.error || body?.message,
                                module: config.module,
                            }, req);
                            return;
                        }

                        // Succès - logger l'action
                        await auditService.log({
                            utilisateurId: req.utilisateur!.id,
                            action: auditAction,
                            cible: config.entityType,
                            cibleId: body?.data?.id,
                            description: `${config.entityType} ${actionSuffix?.toLowerCase()} réussi`,
                            anciennesValeurs: res.locals.auditData.anciennesValeurs,
                            nouvellesValeurs: body?.data || res.locals.auditData.nouvellesValeurs,
                            module: config.module,
                        }, req);
                    } catch (error) {
                        logger.error('[AUDIT INTERCEPTOR] Erreur lors de l\'audit:', error);
                    }
                });

                return originalJson(body);
            };

            next();
        } catch (error) {
            logger.error('[AUDIT INTERCEPTOR] Erreur dans l\'interceptor:', error);
            next(); // Ne pas bloquer la requête en cas d'erreur d'audit
        }
    };
}

/**
 * Middleware générique pour auditor toutes les mutations (POST, PUT, PATCH, DELETE)
 * Utilise des conventions de nommage pour déterminer l'action
 * 
 * @example
 * // Monter avant les routes d'un module
 * app.use('/api/eleves', genericAuditMiddleware('eleves', 'Eleve'));
 */
export function genericAuditMiddleware(module: string, entityType: string) {
    return createAuditInterceptor({
        module,
        entityType,
    });
}
