/**
 * ==================================
 * eLISAschool - Permission Route Guards
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Guards TanStack Router pour la protection par permissions
 * À utiliser dans beforeLoad des routes
 *
 * [G.1] v3.0 — Bypass magique SUPER_ADMIN SUPPRIMÉ
 * SUPER_ADMIN obtient toutes ses permissions via DEFAULT_ROLE_PERMISSIONS
 * (Object.values(Permission) dans roles.enum.ts).
 * L'évaluation est maintenant réelle pour TOUS les rôles sans exception.
 * Seul le tenant sentinel RLS (00000000-...) conserve un traitement spécial.
 * Rapport audit SaaS v3 — 2026
 */

import { redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * [G.1] Évaluation réelle des permissions — sans bypass.
 * SUPER_ADMIN a toutes les permissions attribuées via DEFAULT_ROLE_PERMISSIONS,
 * donc permissions.includes(permission) sera true naturellement.
 */
function hasPermissionOrRole(permissions: string[], permission: string): boolean {
    return permissions.includes(permission);
}

function hasAnyPermissionOrRole(permissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(p => permissions.includes(p));
}

function hasAllPermissionsOrRole(permissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(p => permissions.includes(p));
}

function hasModuleAccessOrRole(permissions: string[], module: string, fallbackAction: string): boolean {
    return permissions.some(p => {
        const parts = p.split(':');
        const moduleName = parts[0];
        const action = parts[parts.length - 1];
        return (
            moduleName === module &&
            (action === 'view' || action === 'read' || action === fallbackAction || action === 'manage' || action === 'list')
        );
    });
}

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

    const permissions = utilisateur.permissions || [];

    // [G.1] Évaluation réelle — tous les rôles évalués uniformément
    const hasAccess = hasModuleAccessOrRole(permissions, module, fallbackAction);

    if (!hasAccess) {
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

    const permissions = utilisateur.permissions || [];

    // [G.1] Évaluation réelle — tous les rôles évalués uniformément
    if (!hasPermissionOrRole(permissions, permission)) {
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

    // [G.1] Évaluation réelle — tous les rôles évalués uniformément
    const userPermissions = utilisateur.permissions || [];
    if (!hasAllPermissionsOrRole(userPermissions, permissions)) {
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

    // [G.1] Évaluation réelle — tous les rôles évalués uniformément
    const userPermissions = utilisateur.permissions || [];
    if (!hasAnyPermissionOrRole(userPermissions, permissions)) {
        throw redirect({
            to: '/dashboard' as any,
        });
    }
}
