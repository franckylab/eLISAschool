/**
 * ==================================
 * eLISAschool - Middleware Validation Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Middleware pour vérifier les permissions de validation selon le niveau
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { StatutWorkflow } from '@modules/validation-workflow/entities';
import { getParam } from '@modules/configuration/utils/config.helper';
import { logger } from '@common/utils/logger.util';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';

/**
 * Middleware pour vérifier si l'utilisateur peut valider au niveau spécifié
 * 
 * Usage:
 * router.post('/:id/valider', 
 *   requireValidationLevel('notes', 2),
 *   handler
 * );
 */
export function requireValidationLevel(module: string, niveau: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const utilisateur = req.utilisateur;
            
            if (!utilisateur) {
                throw new AppError('Utilisateur non authentifié', 401, 'UNAUTHORIZED');
            }

            // SUPER_ADMIN peut toujours valider
            if (utilisateur.role === 'SUPER_ADMIN') {
                return next();
            }

            // 1. Construire le code de permission pour ce niveau
            const permissionCode = `validation:${module}:level${niveau}`;

            // 2. Résoudre les permissions effectives de l'utilisateur (avec cache)
            const permissions = await permissionResolverService.resolvePermissions(utilisateur.id);

            // 3. Vérifier si la permission est présente dans les permissions effectives
            if (permissions.has(permissionCode)) {
                logger.debug(`[ValidationMiddleware] Permission ${permissionCode} accordée pour utilisateur ${utilisateur.id}`);
                return next(); // Permission accordée (même sans le rôle exact)
            }

            // 4. Fallback : vérifier la configuration des rôles pour ce module
            const configStr = await getParam<string>(`${module}.validation_roles`, '{}');
            let configRoles: Record<string, string> = {};
            
            try {
                configRoles = JSON.parse(configStr);
            } catch {
                // Utiliser les rôles par défaut
                configRoles = getDefaultRoles(module);
            }

            // Vérifier le rôle requis pour ce niveau
            const roleRequis = configRoles[String(niveau)];

            if (!roleRequis) {
                // Pas de rôle configuré pour ce niveau, on autorise
                logger.warn(`[ValidationMiddleware] Aucun rôle configuré pour ${module} niveau ${niveau}`);
                return next();
            }

            // Vérifier si l'utilisateur a le rôle requis
            if (utilisateur.role !== roleRequis) {
                throw new AppError(
                    `Permission requise: ${permissionCode} ou rôle: ${roleRequis}. Votre rôle: ${utilisateur.role}`,
                    403,
                    'VALIDATION_PERMISSION_DENIED'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware pour vérifier si un workflow existe et est en cours
 */
export function requireActiveWorkflow(module: string, entiteIdParam: string = 'id') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entiteId = req.params[entiteIdParam];
            
            if (!entiteId) {
                throw new AppError('ID de l\'entité non fourni', 400, 'MISSING_ENTITY_ID');
            }

            const workflow = await validationWorkflowService.findByModuleAndEntite(
                module,
                entiteId,
                req.etablissementId
            );

            if (!workflow) {
                throw new AppError('Aucun workflow de validation trouvé pour cette entité', 404, 'WORKFLOW_NOT_FOUND');
            }

            if (workflow.statut !== StatutWorkflow.EN_COURS) {
                throw new AppError(
                    `Workflow ${workflow.statut.toLowerCase()}, ne peut plus être validé`,
                    400,
                    'WORKFLOW_NOT_ACTIVE'
                );
            }

            // Attacher le workflow à la requête pour le handler
            req.workflow = workflow;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Rôles par défaut selon le module
 */
function getDefaultRoles(module: string): Record<string, string> {
    const defaults: Record<string, Record<string, string>> = {
        notes: {
            '1': 'ENSEIGNANT',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        bulletins: {
            '1': 'ENSEIGNANT',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        cantine: {
            '1': 'PERSONNEL',
            '2': 'RESPONSABLE_CANTINE',
            '3': 'ADMIN',
        },
        transport: {
            '1': 'PERSONNEL',
            '2': 'RESPONSABLE_TRANSPORT',
            '3': 'ADMIN',
        },
        requetes: {
            '1': 'CHEF_ETABLISSEMENT',
            '2': 'ADMIN',
        },
        classes: {
            '1': 'ENSEIGNANT',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        matieres: {
            '1': 'ENSEIGNANT',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        periodes: {
            '1': 'CHEF_ETABLISSEMENT',
            '2': 'ADMIN',
        },
        eleves: {
            '1': 'PERSONNEL',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        personnel: {
            '1': 'CHEF_ETABLISSEMENT',
            '2': 'ADMIN',
        },
        clubs: {
            '1': 'COORDINATEUR_CLUBS',
            '2': 'CHEF_ETABLISSEMENT',
            '3': 'ADMIN',
        },
        materiel: {
            '1': 'GESTIONNAIRE',
            '2': 'ADMIN',
        },
        cartes: {
            '1': 'CHEF_ETABLISSEMENT',
            '2': 'ADMIN',
        },
        annees_scolaires: {
            '1': 'CHEF_ETABLISSEMENT',
            '2': 'ADMIN',
        },
        etablissement: {
            '1': 'ADMIN',
            '2': 'SUPER_ADMIN',
        },
    };

    return defaults[module] || { '1': 'ADMIN' };
}
