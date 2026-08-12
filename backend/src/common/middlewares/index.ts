/**
 * ==================================
 * eLISAschool - Export des middlewares communs
 * ==================================
 */

export { tenantMiddleware, optionalTenantMiddleware } from './tenant.middleware';
export { scopeDiscriminationMiddleware } from './scope-discrimination.middleware';
export { platformAuthMiddleware } from './platform-auth.middleware';
