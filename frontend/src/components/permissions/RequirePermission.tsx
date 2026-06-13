/**
 * ==================================
 * eLISAschool - Composant RequirePermission (Route Guard)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de protection de routes basé sur les permissions
 * Redirige vers /unauthorized ou /dashboard si l'utilisateur n'a pas les permissions requises
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { usePermissions } from '@/hooks/use-permissions';
import { useCanAccess } from '@/hooks/use-permissions-advanced';

interface RequirePermissionProps {
    /** Permission requise pour accéder à la route */
    permission?: string;
    
    /** Permissions alternatives (au moins une requise) */
    permissions?: string[];
    
    /** Nom du module (vérifie automatiquement ${module}:view ou ${module}:manage) */
    module?: string;
    
    /** Route de redirection si accès refusé */
    redirectTo?: string;
    
    /** Contenu à afficher pendant la vérification */
    loadingFallback?: React.ReactNode;
    
    /** Enfants (routes protégées) */
    children: React.ReactNode;
    
    /** Mode de vérification : 'any' (au moins une) ou 'all' (toutes) */
    mode?: 'any' | 'all';
}

/**
 * Composant de protection de route par permissions
 * 
 * @example Protection simple par permission
 * <RequirePermission permission="eleves:create">
 *     <ElevesCreatePage />
 * </RequirePermission>
 * 
 * @example Protection par module
 * <RequirePermission module="eleves">
 *     <ElevesListPage />
 * </RequirePermission>
 * 
 * @example Protection avec plusieurs permissions
 * <RequirePermission 
 *     permissions={['finances:view', 'finances:manage']}
 *     mode="any"
 * >
 *     <FinancesDashboard />
 * </RequirePermission>
 * 
 * @example Redirection personnalisée
 * <RequirePermission 
 *     permission="rapports:avances"
 *     redirectTo="/contact-admin"
 * >
 *     <RapportsAvances />
 * </RequirePermission>
 */
export function RequirePermission({
    permission,
    permissions,
    module,
    redirectTo = '/unauthorized',
    loadingFallback = null,
    children,
    mode = 'any',
}: RequirePermissionProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isAdmin } = usePermissions();
    
    // Si un module est spécifié, utiliser useCanAccess
    const canAccessModule = module ? useCanAccess(module) : true;

    useEffect(() => {
        // Super Admin et Admin ont accès à tout
        if (isSuperAdmin || isAdmin) {
            return;
        }

        let hasAccess = false;

        // Vérification par module
        if (module) {
            hasAccess = canAccessModule;
        }
        // Vérification par permissions multiples
        else if (permissions && permissions.length > 0) {
            hasAccess = mode === 'all' 
                ? hasAllPermissions(permissions)
                : hasAnyPermission(permissions);
        }
        // Vérification par permission unique
        else if (permission) {
            hasAccess = hasPermission(permission);
        }
        // Si aucune permission spécifiée, accès autorisé
        else {
            hasAccess = true;
        }

        // Redirection si pas d'accès
        if (!hasAccess) {
            console.warn(
                `[RequirePermission] Accès refusé à ${location.pathname} - Permission requise: ${permission || module || permissions?.join(', ')}`
            );
            
            navigate({ 
                to: redirectTo, 
                replace: true 
            });
        }
    }, [
        permission, 
        permissions, 
        module, 
        redirectTo, 
        navigate, 
        location.pathname,
        hasPermission, 
        hasAnyPermission, 
        hasAllPermissions,
        isSuperAdmin,
        isAdmin,
        canAccessModule,
        mode,
    ]);

    // Afficher le fallback pendant la vérification (optionnel)
    // En pratique, la vérification est instantanée (permissions en mémoire)
    return <>{children}</>;
}

/**
 * Hook pour protéger une route de manière programmatique
 * 
 * @example
 * function MaPage() {
 *     useRequirePermission('eleves:create');
 *     return <div>...</div>;
 * }
 */
export function useRequirePermission(
    permission?: string,
    permissions?: string[],
    module?: string,
    redirectTo: string = '/unauthorized'
) {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isAdmin } = usePermissions();
    const canAccessModule = module ? useCanAccess(module) : true;

    useEffect(() => {
        // Super Admin et Admin ont accès à tout
        if (isSuperAdmin || isAdmin) {
            return;
        }

        let hasAccess = false;

        if (module) {
            hasAccess = canAccessModule;
        } else if (permissions && permissions.length > 0) {
            hasAccess = hasAnyPermission(permissions);
        } else if (permission) {
            hasAccess = hasPermission(permission);
        } else {
            hasAccess = true;
        }

        if (!hasAccess) {
            console.warn(
                `[useRequirePermission] Accès refusé à ${location.pathname}`
            );
            
            navigate({ 
                to: redirectTo, 
                replace: true 
            });
        }
    }, [permission, permissions, module, redirectTo, navigate, location.pathname, hasPermission, hasAnyPermission, isSuperAdmin, isAdmin, canAccessModule]);
}

/**
 * Composant de protection de route par rôle
 * 
 * @example
 * <RequireRole roles={['ADMIN', 'SUPER_ADMIN']}>
 *     <AdminDashboard />
 * </RequireRole>
 */
interface RequireRoleProps {
    /** Rôles autorisés */
    roles: string[];
    
    /** Route de redirection */
    redirectTo?: string;
    
    /** Enfants */
    children: React.ReactNode;
}

export function RequireRole({
    roles,
    redirectTo = '/unauthorized',
    children,
}: RequireRoleProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isRole, isSuperAdmin } = usePermissions();

    useEffect(() => {
        // Super Admin a toujours accès
        if (isSuperAdmin) {
            return;
        }

        // Vérifier si l'utilisateur a un des rôles requis
        const hasRequiredRole = roles.some(role => isRole(role));

        if (!hasRequiredRole) {
            console.warn(
                `[RequireRole] Accès refusé à ${location.pathname} - Rôles requis: ${roles.join(', ')}`
            );
            
            navigate({ 
                to: redirectTo, 
                replace: true 
            });
        }
    }, [roles, redirectTo, navigate, location.pathname, isRole, isSuperAdmin]);

    return <>{children}</>;
}

export default RequirePermission;
