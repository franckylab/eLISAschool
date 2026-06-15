/**
 * ==================================
 * eLISAschool - Hook d'Authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour accéder à l'état d'authentification et aux actions
 */

import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from '@tanstack/react-router';

/**
 * Hook useAuth - Accès à l'état d'authentification
 * 
 * @example
 * const { isAuthenticated, utilisateur, logout } = useAuth();
 */
export function useAuth() {
    const navigate = useNavigate();
    const {
        isAuthenticated,
        utilisateur,
        isLoading,
        etablissementId,
        etablissements,
        login,
        logout,
        verifierSession,
        reset,
    } = useAuthStore();

    return {
        isAuthenticated,
        utilisateur,
        isLoading,
        etablissementId,
        etablissements,
        login,
        logout: async () => {
            await logout();
            navigate({ to: '/login', search: { redirect: undefined } });
        },
        verifierSession,
        reset,
    };
}

/**
 * Hook useRequireAuth - Redirige vers /login si non authentifié
 * 
 * @example
 * const { utilisateur } = useRequireAuth();
 */
export function useRequireAuth() {
    const { isAuthenticated, utilisateur, isLoading } = useAuth();

    if (!isLoading && !isAuthenticated) {
        // La redirection sera gérée par le guard de route
        throw new Error('Non authentifié');
    }

    return { isAuthenticated, utilisateur, isLoading };
}
