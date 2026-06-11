/**
 * ==================================
 * eLISAschool - Hook pour Onglets Sensibles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour vérifier l'accès aux onglets sensibles (médical, finances, disciplinaire)
 */

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

/**
 * Configuration des onglets sensibles par module
 */
const SENSITIVE_TABS: Record<string, string[]> = {
    eleves: ['medical', 'financier', 'disciplinaire', 'documents-prives'],
    personnel: ['medical', 'financier', 'sanctions'],
    classes: ['finances', 'statistiques-detaillees'],
};

/**
 * Hook pour vérifier si l'utilisateur peut voir un onglet sensible
 *
 * @param module - Module parent (ex: 'eleves', 'personnel')
 * @param tabName - Nom de l'onglet (ex: 'medical', 'financier')
 *
 * @returns boolean - true si l'utilisateur a accès
 *
 * @example
 * const EleveDetailTabs = () => {
 *     const canViewMedical = useCanViewSensitiveTab('eleves', 'medical');
 *     const canViewFinancier = useCanViewSensitiveTab('eleves', 'financier');
 *
 *     return (
 *         <Tabs>
 *             <TabsList>
 *                 <TabsTrigger value="info">Informations</TabsTrigger>
 *                 {canViewMedical && <TabsTrigger value="medical">Médical</TabsTrigger>}
 *                 {canViewFinancier && <TabsTrigger value="finances">Finances</TabsTrigger>}
 *             </TabsList>
 *         </Tabs>
 *     );
 * };
 */
export function useCanViewSensitiveTab(module: string, tabName: string): boolean {
    const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

    return useMemo(() => {
        // SUPER_ADMIN et ADMIN voient tout
        if (isSuperAdmin || isAdmin) {
            return true;
        }

        // Vérifier si l'onglet est sensible
        const sensitiveTabs = SENSITIVE_TABS[module];
        if (!sensitiveTabs || !sensitiveTabs.includes(tabName)) {
            return true; // Onglet non sensible = accès libre
        }

        // Permission spécifique pour l'onglet sensible
        const permission = `${module}:${tabName}:view`;
        return hasPermission(permission);
    }, [module, tabName, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook pour vérifier si l'utilisateur peut modifier un onglet sensible
 *
 * @param module - Module parent
 * @param tabName - Nom de l'onglet
 *
 * @example
 * const canEditMedical = useCanEditSensitiveTab('eleves', 'medical');
 */
export function useCanEditSensitiveTab(module: string, tabName: string): boolean {
    const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

    return useMemo(() => {
        if (isSuperAdmin || isAdmin) {
            return true;
        }

        const sensitiveTabs = SENSITIVE_TABS[module];
        if (!sensitiveTabs || !sensitiveTabs.includes(tabName)) {
            return true;
        }

        const permission = `${module}:${tabName}:edit`;
        return hasPermission(permission);
    }, [module, tabName, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook pour vérifier si l'utilisateur peut exporter les données d'un onglet sensible
 *
 * @param module - Module parent
 * @param tabName - Nom de l'onglet
 *
 * @example
 * const canExportFinances = useCanExportSensitiveTab('eleves', 'financier');
 */
export function useCanExportSensitiveTab(module: string, tabName: string): boolean {
    const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

    return useMemo(() => {
        if (isSuperAdmin || isAdmin) {
            return true;
        }

        const sensitiveTabs = SENSITIVE_TABS[module];
        if (!sensitiveTabs || !sensitiveTabs.includes(tabName)) {
            return hasPermission(`${module}:export`);
        }

        const permission = `${module}:${tabName}:export`;
        return hasPermission(permission);
    }, [module, tabName, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook utilitaire pour obtenir tous les onglets visibles d'un module
 *
 * @param module - Module
 * @param allTabs - Liste de tous les onglets disponibles
 *
 * @example
 * const visibleTabs = useVisibleTabs('eleves', [
 *     { id: 'info', label: 'Informations' },
 *     { id: 'medical', label: 'Médical', sensitive: true },
 *     { id: 'finances', label: 'Finances', sensitive: true },
 * ]);
 */
export function useVisibleTabs(
    module: string,
    allTabs: Array<{ id: string; label: string; sensitive?: boolean }>
): Array<{ id: string; label: string }> {
    return useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.sensitive) {
                return true;
            }
            const canView = useCanViewSensitiveTab(module, tab.id);
            return canView;
        });
    }, [module, allTabs]);
}

export default useCanViewSensitiveTab;
