/**
 * ==================================
 * eLISAschool - Hook pour Permissions Widgets Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour vérifier l'accès aux widgets du dashboard
 * Permet de contrôler quels widgets sont visibles selon le rôle
 */

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

/**
 * Configuration des widgets dashboard par défaut
 * Chaque widget a des permissions requises pour être visible
 */
const DASHBOARD_WIDGETS = {
    // Widgets généraux
    'dashboard-stats': {
        label: 'Statistiques Générales',
        requiredPermission: 'dashboard:view',
        category: 'general',
    },
    'dashboard-notes': {
        label: 'Aperçu des Notes',
        requiredPermission: 'notes:view',
        category: 'pedagogie',
    },
    'dashboard-bulletins': {
        label: 'Derniers Bulletins',
        requiredPermission: 'bulletins:view',
        category: 'pedagogie',
    },
    'dashboard-absences': {
        label: 'Absences Récentes',
        requiredPermission: 'absences:view',
        category: 'vie-scolaire',
    },
    'dashboard-discipline': {
        label: 'Sanctions Disciplinaires',
        requiredPermission: 'discipline:view',
        category: 'vie-scolaire',
    },

    // Widgets finances
    'dashboard-paiements': {
        label: 'Paiements Récents',
        requiredPermission: 'finances:view',
        category: 'finances',
    },
    'dashboard-impayes': {
        label: 'Impayés',
        requiredPermission: 'finances:impayes:view',
        category: 'finances',
    },
    'dashboard-statistiques-financieres': {
        label: 'Statistiques Financières',
        requiredPermission: 'finances:stats:view',
        category: 'finances',
    },

    // Widgets RH
    'dashboard-personnel': {
        label: 'Effectif Personnel',
        requiredPermission: 'personnel:view',
        category: 'rh',
    },
    'dashboard-conges': {
        label: 'Congés en Cours',
        requiredPermission: 'conges:view',
        category: 'rh',
    },
    'dashboard-pointages': {
        label: 'Pointages du Jour',
        requiredPermission: 'pointages:view',
        category: 'rh',
    },

    // Widgets cantine/transport
    'dashboard-cantine': {
        label: 'Cantine - Inscriptions',
        requiredPermission: 'cantine:view',
        category: 'logistique',
    },
    'dashboard-transport': {
        label: 'Transport - Présences',
        requiredPermission: 'transport:view',
        category: 'logistique',
    },

    // Widgets communication
    'dashboard-messagerie': {
        label: 'Messages Non Lus',
        requiredPermission: 'messagerie:view',
        category: 'communication',
    },
    'dashboard-annonces': {
        label: 'Dernières Annonces',
        requiredPermission: 'annonces:view',
        category: 'communication',
    },
    'dashboard-sondages': {
        label: 'Sondages Actifs',
        requiredPermission: 'sondages:view',
        category: 'communication',
    },

    // Widgets admin
    'dashboard-utilisateurs': {
        label: 'Statistiques Utilisateurs',
        requiredPermission: 'utilisateurs:stats:view',
        category: 'admin',
    },
    'dashboard-config': {
        label: 'Configuration Système',
        requiredPermission: 'config:view',
        category: 'admin',
    },
    'dashboard-audit': {
        label: 'Journal d\'Audit',
        requiredPermission: 'audit:view',
        category: 'admin',
    },
} as const;

type WidgetKey = keyof typeof DASHBOARD_WIDGETS;

/**
 * Hook pour vérifier si l'utilisateur peut voir un widget dashboard
 *
 * @param widgetKey - Clé du widget (ex: 'dashboard-notes', 'dashboard-paiements')
 *
 * @returns boolean - true si l'utilisateur a accès
 *
 * @example
 * const Dashboard = () => {
 *     const canViewNotes = useCanViewDashboardWidget('dashboard-notes');
 *     const canViewFinances = useCanViewDashboardWidget('dashboard-paiements');
 *
 *     return (
 *         <div>
 *             {canViewNotes && <NotesWidget />}
 *             {canViewFinances && <FinancesWidget />}
 *         </div>
 *     );
 * };
 */
export function useCanViewDashboardWidget(widgetKey: WidgetKey): boolean {
    const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

    return useMemo(() => {
        // SUPER_ADMIN et ADMIN voient tout
        if (isSuperAdmin || isAdmin) {
            return true;
        }

        const widget = DASHBOARD_WIDGETS[widgetKey];
        if (!widget) {
            return false;
        }

        return hasPermission(widget.requiredPermission);
    }, [widgetKey, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook pour obtenir tous les widgets visibles de l'utilisateur
 *
 * @param category - Filtrer par catégorie (optionnel)
 *
 * @returns Array de widgets accessibles
 *
 * @example
 * const visibleWidgets = useVisibleDashboardWidgets('pedagogie');
 * // Returns: ['dashboard-notes', 'dashboard-bulletins']
 */
export function useVisibleDashboardWidgets(category?: string): WidgetKey[] {
    const { isSuperAdmin, isAdmin, hasPermission } = usePermissions();

    return useMemo(() => {
        return (Object.keys(DASHBOARD_WIDGETS) as WidgetKey[]).filter(key => {
            const widget = DASHBOARD_WIDGETS[key];

            // Filtrer par catégorie si spécifiée
            if (category && widget.category !== category) {
                return false;
            }

            // SUPER_ADMIN et ADMIN voient tout
            if (isSuperAdmin || isAdmin) {
                return true;
            }

            return hasPermission(widget.requiredPermission);
        });
    }, [category, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook pour obtenir les catégories de widgets disponibles
 *
 * @returns Array de catégories avec count
 *
 * @example
 * const categories = useDashboardWidgetCategories();
 * // Returns: [{ name: 'pedagogie', count: 2 }, ...]
 */
export function useDashboardWidgetCategories() {
    const visibleWidgets = useVisibleDashboardWidgets();

    return useMemo(() => {
        const categoryMap = new Map<string, number>();

        visibleWidgets.forEach(key => {
            const widget = DASHBOARD_WIDGETS[key];
            const current = categoryMap.get(widget.category) || 0;
            categoryMap.set(widget.category, current + 1);
        });

        return Array.from(categoryMap.entries()).map(([name, count]) => ({
            name,
            count,
            label: getCategoryLabel(name),
        }));
    }, [visibleWidgets]);
}

/**
 * Hook utilitaire pour vérifier si l'utilisateur peut épingler un widget
 *
 * @param widgetKey - Clé du widget
 *
 * @returns boolean
 */
export function useCanPinDashboardWidget(widgetKey: WidgetKey): boolean {
    const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

    return useMemo(() => {
        if (isSuperAdmin || isAdmin) {
            return true;
        }

        // Permission spécifique pour personnaliser le dashboard
        return hasPermission('dashboard:customize');
    }, [widgetKey, hasPermission, isSuperAdmin, isAdmin]);
}

/**
 * Hook pour obtenir la configuration d'un widget
 *
 * @param widgetKey - Clé du widget
 *
 * @returns Configuration du widget ou null
 */
export function useDashboardWidgetConfig(widgetKey: WidgetKey) {
    return useMemo(() => {
        return DASHBOARD_WIDGETS[widgetKey] || null;
    }, [widgetKey]);
}

// ==================================
// HELPERS
// ==================================

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        general: 'Général',
        pedagogie: 'Pédagogie',
        'vie-scolaire': 'Vie Scolaire',
        finances: 'Finances',
        rh: 'Ressources Humaines',
        logistique: 'Logistique',
        communication: 'Communication',
        admin: 'Administration',
    };
    return labels[category] || category;
}

export default useCanViewDashboardWidget;
