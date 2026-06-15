/**
 * ==================================
 * eLISAschool - Hook Session Expired
 * ==================================
 * Hook global pour écouter les événements d'expiration de session
 * et rediriger automatiquement vers la page de connexion
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

/**
 * Hook à utiliser dans le layout principal (_auth.tsx)
 * Écoute les événements :
 * - auth:session-expired → Session expirée (refresh token invalide)
 * - auth:logout → Déconnexion volontaire
 * 
 * Redirige vers /auth/login et affiche un toast informatif
 */
export function useSessionExpired() {
    const navigate = useNavigate();
    const hasShownToast = useRef(false);

    useEffect(() => {
        const handleSessionExpired = () => {
            // Nettoyage du store
            useAuthStore.getState().reset();

            // Toast informatif (une seule fois par session)
            if (!hasShownToast.current) {
                toast.error('Session expirée', {
                    description: 'Votre session a expiré. Veuillez vous reconnecter.',
                    duration: 5000,
                });
                hasShownToast.current = true;

                // Reset après 10s pour permettre un nouveau toast si reconnecté
                setTimeout(() => {
                    hasShownToast.current = false;
                }, 10000);
            }

            // Redirection vers login
            navigate({
                to: '/auth/login',
                replace: true, // Empêche le retour en arrière
            });
        };

        const handleLogout = () => {
            // Utiliser le service de déconnexion sécurisée
            // Mais sans redirection car elle est déjà gérée ici
            import('@/lib/secure-logout').then(({ secureLogout }) => {
                secureLogout({ redirect: false });
            });

            // Toast de confirmation
            toast.info('Déconnexion réussie', {
                description: 'Vous avez été déconnecté avec succès.',
                duration: 3000,
            });

            // Redirection vers login
            navigate({
                to: '/auth/login',
                replace: true,
            });
        };

        // Écouter les événements
        window.addEventListener('auth:session-expired', handleSessionExpired);
        window.addEventListener('auth:logout', handleLogout);

        // Nettoyage
        return () => {
            window.removeEventListener('auth:session-expired', handleSessionExpired);
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [navigate]);
}
