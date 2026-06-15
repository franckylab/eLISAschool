/**
 * ==================================
 * eLISAschool - Permission Route Guards
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Guards TanStack Router pour la protection par permissions
 * À utiliser dans beforeLoad des routes
 */

import { redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Vérifie si l'utilisateur a accès à un module
 * Redirige vers /unauthorized si non autorisé
 *
 * @param module - Nom du module (ex: 'eleves', 'notes', 'finances')
 * @param fallbackAction - Action fallback (default: 'manage')
 *
 * @example
 * // Dans une route TanStack
 * export const Route = createFileRoute('/_auth/eleves')({
 *     beforeLoad: () => requireModulePermission('eleves'),
 *     component: ElevesPage,
 * });
 */
export function requireModulePermission(module: string, fallbackAction: string = 'manage') {
    const { utilisateur } = useAuthStore.getState();

    if (!utilisateur) {
        throw redirect({ to: '/login' as any });
    }

    // SUPER_ADMIN et ADMIN ont toujours accès
    if (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') {
        return;
    }

    const permissions = utilisateur.permissions || [];

    // Vérifier les permissions du module
    const hasAccess = permissions.some(p => {
        const parts = p.split(':');
        const moduleName = parts[0];
        const action = parts[parts.length - 1];

        return (
            moduleName === module &&
            (action === 'view' || action === fallbackAction || action === 'manage' || action === 'list')
        );
    });

    if (!hasAccess) {
        // ✅ Rediriger vers dashboard au lieu de / avec message d'erreur
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}

/**
 * Vérifie si l'utilisateur a une permission spécifique
 * Redirige vers /unauthorized si non autorisé
 *
 * @param permission - Permission requise (ex: 'eleves:create', 'notes:bulk:import')
 *
 * @example
 * export const Route = createFileRoute('/_auth/eleves/new')({
 *     beforeLoad: () => requirePermission('eleves:create'),
 *     component: NewElevePage,
 * });
 */
export function requirePermission(permission: string) {
    const { utilisateur } = useAuthStore.getState();

    if (!utilisateur) {
        throw redirect({ to: '/login' as any });
    }

    // SUPER_ADMIN et ADMIN ont toujours accès
    if (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') {
        return;
    }

    const permissions = utilisateur.permissions || [];

    if (!permissions.includes(permission)) {
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}

/**
 * Vérifie si l'utilisateur a l'un des rôles requis
 * Redirige vers /unauthorized si non autorisé
 *
 * @param roles - Rôles autorisés (ex: ['ADMIN', 'SUPER_ADMIN'])
 *
 * @example
 * export const Route = createFileRoute('/_auth/admin/settings')({
 *     beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
 *     component: AdminSettingsPage,
 * });
 */
export function requireRole(roles: string[]) {
    const { utilisateur } = useAuthStore.getState();

    if (!utilisateur) {
        throw redirect({ to: '/login' as any });
    }

    if (!roles.includes(utilisateur.role)) {
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}

/**
 * Vérifie si l'utilisateur a TOUTES les permissions requises
 *
 * @param permissions - Liste des permissions requises
 *
 * @example
 * export const Route = createFileRoute('/_auth/finances')({
 *     beforeLoad: () => requireAllPermissions(['finances:view', 'finances:manage']),
 *     component: FinancesPage,
 * });
 */
export function requireAllPermissions(permissions: string[]) {
    const { utilisateur } = useAuthStore.getState();

    if (!utilisateur) {
        throw redirect({ to: '/login' as any });
    }

    // SUPER_ADMIN et ADMIN ont toujours accès
    if (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') {
        return;
    }

    const userPermissions = utilisateur.permissions || [];
    const hasAll = permissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}

/**
 * Vérifie si l'utilisateur a AU MOINS UNE des permissions requises
 *
 * @param permissions - Liste des permissions (au moins une requise)
 *
 * @example
 * export const Route = createFileRoute('/_auth/rapports')({
 *     beforeLoad: () => requireAnyPermission(['rapports:finances:generate', 'rapports:bulletins:generate']),
 *     component: RapportsPage,
 * });
 */
export function requireAnyPermission(permissions: string[]) {
    const { utilisateur } = useAuthStore.getState();

    if (!utilisateur) {
        throw redirect({ to: '/login' as any });
    }

    // SUPER_ADMIN et ADMIN ont toujours accès
    if (utilisateur.role === 'SUPER_ADMIN' || utilisateur.role === 'ADMIN') {
        return;
    }

    const userPermissions = utilisateur.permissions || [];
    const hasAny = permissions.some(p => userPermissions.includes(p));

    if (!hasAny) {
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}
