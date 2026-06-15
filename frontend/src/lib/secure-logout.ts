/**
 * ==================================
 * eLISAschool - Service de déconnexion sécurisée
 * ==================================
 * Service centralisé pour une déconnexion complète et sécurisée
 * suivant les meilleures pratiques OWASP
 */

import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

/**
 * Effectue une déconnexion COMPLÈTE et SÉCURISÉE
 * 
 * Ordre des opérations (CRITIQUE) :
 * 1. Invalider le refresh token côté serveur (si possible)
 * 2. Nettoyer les tokens côté client (api-client)
 * 3. Réinitialiser le store Zustand (avec force purge localStorage)
 * 4. Invalider le cache React Query
 * 5. Dispatch événement de déconnexion
 * 6. Rediriger vers login
 * 
 * @param options.redirect - Rediriger automatiquement (défaut: true)
 * @param options.preserveLanguage - Préserver la langue (défaut: false)
 */
export async function secureLogout(options: {
    redirect?: boolean;
    preserveLanguage?: boolean;
} = {}): Promise<void> {
    const { redirect = true, preserveLanguage = false } = options;

    try {
        // ÉTAPE 1: Invalider le refresh token côté serveur
        // (Même si ça échoue, on continue le nettoyage client)
        try {
            await apiClient.logout();
        } catch (error) {
            console.warn('[Logout] Échec invalidation serveur (non bloquant):', error);
        }

        // ÉTAPE 2: Nettoyage tokens api-client
        apiClient.clearTokens();

        // ÉTAPE 3: Nettoyage COMPLET du store Zustand
        // Utilisation de set() avec replace pour forcer la persistance immédiate
        const authStore = useAuthStore.getState();
        
        // Préserver la langue si demandé
        const currentLang = preserveLanguage 
            ? authStore.utilisateur?.langue 
            : undefined;

        // Reset complet avec initialState
        authStore.reset();

        // ÉTAPE 4: Purge MANUELLE du localStorage Zustand
        // (Le middleware persist peut être asynchrone, on force la suppression)
        try {
            localStorage.removeItem('elisaschool-auth');
        } catch (error) {
            console.error('[Logout] Erreur purge localStorage:', error);
        }

        // ÉTAPE 5: Invalider tout le cache React Query
        // (Évite de montrer des données de l'ancien utilisateur)
        try {
            // Import dynamique pour éviter les dépendances circulaires
            const { queryClient } = await import('@/lib/query-client');
            queryClient.clear();
        } catch (error) {
            console.warn('[Logout] Échec nettoyage cache React Query:', error);
        }

        // ÉTAPE 6: Nettoyage session storage (si utilisé)
        try {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key?.startsWith('elisaschool-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (error) {
            console.warn('[Logout] Échec nettoyage sessionStorage:', error);
        }

        // ÉTAPE 7: Dispatch événement de déconnexion
        // (Pour les hooks et composants qui écoutent)
        window.dispatchEvent(new CustomEvent('auth:logout'));

        // ÉTAPE 8: Nettoyage cookies (si utilisés pour auth)
        try {
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name.includes('auth') || name.includes('token') || name.includes('session')) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                }
            });
        } catch (error) {
            console.warn('[Logout] Échec nettoyage cookies:', error);
        }

        // ÉTAPE 9: Redirection vers login
        if (redirect) {
            // Utiliser window.location.href pour un rechargement COMPLET
            // (Plus sûr que navigate() après un logout - évite les états résiduels)
            window.location.href = '/auth/login';
        }

        console.log('[Logout] Déconnexion sécurisée complétée avec succès');
    } catch (error) {
        console.error('[Logout] Erreur critique lors de la déconnexion:', error);
        
        // En cas d'erreur, FORCER le nettoyage et la redirection
        apiClient.clearTokens();
        localStorage.removeItem('elisaschool-auth');
        window.location.href = '/auth/login';
    }
}

/**
 * Vérifie si une déconnexion est en cours
 * (Pour éviter les double-déconnexions)
 */
let isLoggingOut = false;

export function isLogoutInProgress(): boolean {
    return isLoggingOut;
}

/**
 * Wrapper sécurisé pour secureLogout avec protection anti double-clic
 */
export async function handleLogout(options?: { redirect?: boolean }): Promise<void> {
    if (isLoggingOut) {
        console.warn('[Logout] Déconnexion déjà en cours, ignorée');
        return;
    }

    try {
        isLoggingOut = true;
        await secureLogout(options);
    } finally {
        // Reset uniquement si pas de redirection
        if (!options?.redirect) {
            isLoggingOut = false;
        }
        // Si redirect=true, la page va être rechargée donc pas besoin de reset
    }
}
