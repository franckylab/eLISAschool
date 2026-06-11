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
    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) {
        throw redirect({
            to: '/login',
            search: { redirect: typeof window !== 'undefined' ? window.location.pathname : undefined },
        });
    }
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
