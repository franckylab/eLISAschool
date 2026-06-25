/**
 * ==================================
 * eLISAschool - Export des middlewares Auth
 * ==================================
 */

export { authMiddleware, optionalAuthMiddleware, UtilisateurAuth } from './auth.middleware';
// ⚠️  requireRoles, adminOnly, managerOnly, staffOnly sont SUPPRIMÉS (voir role.middleware.ts)
// Utiliser requirePermission() à la place
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
