/**
 * ==================================
 * eLISAschool - Route Guards
 * ==================================
 * Guards pour protéger les routes auth/public
 */

import { redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Garde pour les routes nécessitant une authentification
 * Redirige vers /login si non-authentifié
 */
export function authGuard() {
    const { isAuthenticated, accessToken, utilisateur } = useAuthStore.getState();
    
    console.log('[AuthGuard] Vérification:', {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        hasUser: !!utilisateur,
        role: utilisateur?.role,
        permissionsCount: utilisateur?.permissions?.length || 0,
    });
    
    if (!isAuthenticated || !accessToken) {
        console.warn('[AuthGuard] Accès refusé - non authentifié');
        throw redirect({
            to: '/login',
            search: { redirect: typeof window !== 'undefined' ? window.location.pathname : undefined },
        });
    }
    
    console.log('[AuthGuard] Accès autorisé');
}

/**
 * Garde pour les routes publiques uniquement
 * Redirige vers /dashboard si déjà authentifié
 */
export function publicOnlyGuard() {
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (isAuthenticated && accessToken) {
        throw redirect({ to: '/dashboard' });
    }
}
