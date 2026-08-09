/**
 * ==================================
 * eLISAschool - Export des middlewares Auth
 * ==================================
 */

export { authMiddleware, optionalAuthMiddleware, UtilisateurAuth } from './auth.middleware';
export { requireRole } from './role.middleware';
export {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    checkPermission,
    requirePermissionWithContext,
} from './permission.middleware';
export { requirePermissions } from '../guards/permission.guard';
export { 
    filterByEtablissement, 
    validateResourceOwnership,
    getEtablissementId,
    getEtablissementIdOptional,
} from './etablissement.middleware';
