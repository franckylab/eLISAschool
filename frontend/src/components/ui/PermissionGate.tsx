/**
 * ==================================
 * eLISAschool - Composant PermissionGate
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant de protection conditionnelle basé sur les permissions RBAC
 * Permet de masquer/afficher des éléments UI selon les permissions de l'utilisateur
 */

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { useModulePermissions } from '@/hooks/use-permissions-advanced';

interface PermissionGateProps {
    /** Permission requise (ex: 'utilisateurs:create') */
    permission?: string;
    /** Liste de permissions (au moins une requise) */
    permissions?: string[];
    /** Toutes ces permissions sont requises */
    allPermissions?: string[];
    /** Module pour vérification avancée */
    module?: string;
    /** Action requise sur le module (view, create, edit, delete, etc.) */
    action?: string;
    /** Fonction de fallback personnalisée */
    fallback?: ReactNode;
    /** Enfants à rendre si la permission est accordée */
    children: ReactNode;
    /** Afficher un message au lieu de masquer complètement */
    showMessage?: boolean;
    /** Message personnalisé */
    message?: string;
}

/**
 * Composant Gate pour protéger l'accès à des éléments UI
 * 
 * @example
 * // Protection simple
 * <PermissionGate permission="utilisateurs:create">
 *   <Button>Créer</Button>
 * </PermissionGate>
 * 
 * @example
 * // Plusieurs permissions (au moins une)
 * <PermissionGate permissions={['utilisateurs:edit', 'utilisateurs:manage']}>
 *   <Button>Modifier</Button>
 * </PermissionGate>
 * 
 * @example
 * // Toutes les permissions requises
 * <PermissionGate allPermissions={['utilisateurs:view', 'utilisateurs:export']}>
 *   <Button>Exporter</Button>
 * </PermissionGate>
 * 
 * @example
 * // Avec module avancé
 * <PermissionGate module="eleves" action="create">
 *   <Button>Nouvel élève</Button>
 * </PermissionGate>
 * 
 * @example
 * // Avec fallback personnalisé
 * <PermissionGate 
 *   permission="rapports:generate"
 *   fallback={<Tooltip>Permission requise</Tooltip>}
 * >
 *   <Button>Générer rapport</Button>
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    permissions,
    allPermissions,
    module,
    action,
    fallback = null,
    children,
    showMessage = false,
    message = 'Vous n\'avez pas la permission nécessaire',
}: PermissionGateProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
    // [FE-5] Hook appelé inconditionnellement (règles des hooks de React)
    // Rapport audit SaaS 2026-08-07 — hook déplacé avant tout conditionnel
    const modulePerms = useModulePermissions(module ?? '');
    
    let hasAccess = false;

    // Vérification permission simple
    if (permission) {
        hasAccess = hasPermission(permission);
    }
    // Vérification liste de permissions (au moins une)
    else if (permissions && permissions.length > 0) {
        hasAccess = hasAnyPermission(permissions);
    }
    // Vérification toutes permissions requises
    else if (allPermissions && allPermissions.length > 0) {
        hasAccess = hasAllPermissions(allPermissions);
    }
    // Vérification via module avancé (hook maintenant appelé inconditionnellement)
    else if (module && action) {
        const actionMap: Record<string, keyof ReturnType<typeof useModulePermissions>> = {
            view: 'canView',
            create: 'canCreate',
            edit: 'canEdit',
            delete: 'canDelete',
            manage: 'canManage',
            export: 'canExport',
            import: 'canImport',
        };
        hasAccess = modulePerms[actionMap[action] || 'canAccess'] === true;
    }

    if (!hasAccess) {
        if (showMessage) {
            return (
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-100 border border-gray-200">
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
            );
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Hook pour vérification programmatique de permissions
 * 
 * @example
 * const { checkPermission, canAccessModule } = usePermissionChecker();
 * 
 * if (checkPermission('utilisateurs:create')) {
 *   // Afficher bouton créer
 * }
 */
export function usePermissionChecker() {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isRole, isAdmin, isSuperAdmin } = usePermissions();

    return {
        /** Vérifier une permission simple */
        checkPermission: hasPermission,
        /** Vérifier au moins une permission */
        checkAnyPermission: hasAnyPermission,
        /** Vérifier toutes les permissions */
        checkAllPermissions: hasAllPermissions,
        /** Vérifier si l'utilisateur a un rôle spécifique */
        isRole,
        /** Vérifier si admin */
        isAdmin,
        /** Vérifier si super admin */
        isSuperAdmin,
        /** Vérifier l'accès à un module */
        canAccessModule: (module: string, action?: string) => {
            const modulePerms = useModulePermissions(module);
            if (!action) return modulePerms.canAccess;
            const actionMap: Record<string, keyof ReturnType<typeof useModulePermissions>> = {
                view: 'canView',
                create: 'canCreate',
                edit: 'canEdit',
                delete: 'canDelete',
                manage: 'canManage',
                export: 'canExport',
                import: 'canImport',
            };
            return modulePerms[actionMap[action] || 'canAccess'] === true;
        },
    };
}

/**
 * Composant pour afficher différents contenus selon le rôle
 * 
 * @example
 * <RoleGate roles={['ADMIN', 'SUPER_ADMIN']}>
 *   <AdminPanel />
 * </RoleGate>
 */
export function RoleGate({ 
    roles, 
    fallback = null, 
    children 
}: { 
    roles: string[]; 
    fallback?: ReactNode; 
    children: ReactNode;
}) {
    const { isRole, isSuperAdmin } = usePermissions();

    const hasRole = roles.some(role => {
        if (role === 'SUPER_ADMIN') return isSuperAdmin;
        return isRole(role);
    });

    if (!hasRole) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Composant pour protection de routes/sous-routes
 * Redirige ou affiche un message d'accès refusé
 * 
 * @example
 * <RouteGuard permission="finances:view">
 *   <FinancesDashboard />
 * </RouteGuard>
 */
export function RouteGuard({ 
    permission, 
    children 
}: { 
    permission: string; 
    children: ReactNode;
}) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
                    <p className="text-gray-600">
                        Vous n'avez pas la permission nécessaire pour accéder à cette page.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Permission requise : <code className="bg-gray-100 px-2 py-1 rounded">{permission}</code>
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
