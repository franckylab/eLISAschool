/**
 * ==================================
 * eLISAschool - Hooks de Permissions RBAC Avancés
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Hooks avancés pour le contrôle d'accès aux modules, routes et éléments UI
 */

import { useMemo } from 'react';
import { usePermissions } from './use-permissions';

/**
 * Hook pour vérifier l'accès à un module complet
 * @param moduleName - Nom du module (ex: 'eleves', 'notes', 'finances')
 * @returns Objet avec méthodes de vérification
 */
export function useModulePermissions(moduleName: string) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    return useMemo(() => {
        // Permissions standard pour un module
        const viewPermission = `${moduleName}:view`;
        const managePermission = `${moduleName}:manage`;
        const createPermission = `${moduleName}:create`;
        const editPermission = `${moduleName}:edit`;
        const deletePermission = `${moduleName}:delete`;
        const exportPermission = `${moduleName}:export`;
        const importPermission = `${moduleName}:import`;

        return {
            // Accès global au module
            canAccess: hasAnyPermission([viewPermission, managePermission]),
            canView: hasPermission(viewPermission),
            canManage: hasPermission(managePermission),

            // Actions CRUD
            canCreate: hasPermission(createPermission),
            canEdit: hasPermission(editPermission),
            canDelete: hasPermission(deletePermission),

            // Actions avancées
            canExport: hasPermission(exportPermission),
            canImport: hasPermission(importPermission),

            // Vérification flexible
            hasAny: (actions: string[]) => hasAnyPermission(actions.map(a => `${moduleName}:${a}`)),
            hasAll: (actions: string[]) => hasAllPermissions(actions.map(a => `${moduleName}:${a}`)),

            // Métadonnées
            moduleName,
            permissions: {
                view: viewPermission,
                manage: managePermission,
                create: createPermission,
                edit: editPermission,
                delete: deletePermission,
                export: exportPermission,
                import: importPermission,
            },
        };
    }, [moduleName, hasPermission, hasAnyPermission, hasAllPermissions]);
}

/**
 * Hook pour vérifier l'accès à une route/page
 * @param moduleName - Nom du module associé à la route
 * @param fallbackAction - Action alternative si :view n'existe pas (par défaut: 'manage')
 * @returns boolean - true si l'utilisateur peut accéder à la route
 */
export function useCanAccess(moduleName: string, fallbackAction: string = 'manage'): boolean {
    const { hasAnyPermission } = usePermissions();

    return useMemo(() => {
        return hasAnyPermission([
            `${moduleName}:view`,
            `${moduleName}:${fallbackAction}`,
            `${moduleName}:manage`,
            `${moduleName}:list`,
        ]);
    }, [moduleName, fallbackAction, hasAnyPermission]);
}

/**
 * Hook pour vérifier l'accès à un widget dashboard
 * @param widgetName - Nom du widget (ex: 'finances-summary', 'eleves-stats')
 * @returns boolean
 */
export function useCanViewWidget(widgetName: string): boolean {
    const { hasAnyPermission } = usePermissions();

    return useMemo(() => {
        return hasAnyPermission([
            `dashboard:widget:${widgetName}:view`,
            `dashboard:widgets:view`,
            'dashboard:view',
        ]);
    }, [widgetName, hasAnyPermission]);
}

/**
 * Hook pour vérifier l'accès à un onglet spécifique
 * @param moduleName - Module parent
 * @param tabName - Nom de l'onglet (ex: 'medical', 'finances', 'documents')
 * @returns boolean
 */
export function useCanViewTab(moduleName: string, tabName: string): boolean {
    const { hasAnyPermission } = usePermissions();

    return useMemo(() => {
        return hasAnyPermission([
            `${moduleName}:tab:${tabName}:view`,
            `${moduleName}:tab:${tabName}`,
            `${moduleName}:view`,
            `${moduleName}:manage`,
        ]);
    }, [moduleName, tabName, hasAnyPermission]);
}

/**
 * Hook pour vérifier l'accès à un champ de formulaire
 * @param moduleName - Module parent
 * @param fieldName - Nom du champ (ex: 'remise', 'validation')
 * @param actionType - Type d'accès: 'read' ou 'write'
 * @returns boolean
 */
export function useCanAccessField(
    moduleName: string,
    fieldName: string,
    actionType: 'read' | 'write' = 'read'
): boolean {
    const { hasAnyPermission, hasPermission } = usePermissions();

    return useMemo(() => {
        // Permission spécifique au champ
        const fieldPermission = `${moduleName}:field:${fieldName}:${actionType}`;
        if (hasPermission(fieldPermission)) return true;

        // Fallback sur permission module global
        return hasAnyPermission([
            `${moduleName}:manage`,
            actionType === 'write' ? `${moduleName}:edit` : `${moduleName}:view`,
        ]);
    }, [moduleName, fieldName, actionType, hasPermission, hasAnyPermission]);
}

/**
 * Hook pour vérifier l'accès à une action en masse
 * @param moduleName - Module parent
 * @param action - Action en masse (ex: 'delete', 'import', 'export')
 * @returns boolean
 */
export function useCanBulkAction(moduleName: string, action: string): boolean {
    const { hasAnyPermission } = usePermissions();

    return useMemo(() => {
        return hasAnyPermission([
            `${moduleName}:bulk:${action}`,
            `${moduleName}:${action}`,
            `${moduleName}:manage`,
        ]);
    }, [moduleName, action, hasAnyPermission]);
}

/**
 * Hook pour vérifier l'accès à un rapport
 * @param reportName - Nom du rapport (ex: 'bulletins', 'finances', 'absences')
 * @returns boolean
 */
export function useCanGenerateReport(reportName: string): boolean {
    const { hasAnyPermission } = usePermissions();

    return useMemo(() => {
        return hasAnyPermission([
            `rapports:${reportName}:generate`,
            `rapports:${reportName}:export`,
            `rapports:generate`,
            'rapports:view',
        ]);
    }, [reportName, hasAnyPermission]);
}
