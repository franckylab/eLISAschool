/**
 * ==================================
 * eLISAschool - Hook de Gestion Établissement Requis
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hook pour écouter l'événement 'auth:etablissement-required'
 * et afficher automatiquement le modal de sélection d'établissement.
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';

export function useEtablissementRequired() {
    const router = useRouter();
    const {
        preLoginData,
        showEtablissementModal,
        completeLogin,
        setShowEtablissementModal,
        logout,
    } = useAuthStore();

    /**
     * Gestionnaire de l'événement 'auth:etablissement-required'
     */
    const handleEtablissementRequired = useCallback(() => {
        console.log('[EtablissementRequired] Événement reçu');
        
        const state = useAuthStore.getState();
        
        // Vérification 1: Pas authentifié → redirection login
        if (!state.accessToken) {
            router.navigate({ to: '/login', search: { redirect: undefined } });
            return;
        }

        // Vérification 2: Utilisateur a DÉJÀ un établissement actif → IGNORER
        if (state.etablissementId) {
            console.log('[EtablissementRequired] Établissement déjà sélectionné, modal ignoré');
            return;
        }

        // Vérification 3: Modal déjà ouvert → IGNORER (éviter boucle infinie)
        if (state.showEtablissementModal) {
            console.log('[EtablissementRequired] Modal déjà ouvert, événement ignoré');
            return;
        }

        // Vérification 4: Pas de données de pré-login → Charger les établissements
        if (!state.preLoginData?.etablissements || state.preLoginData.etablissements.length === 0) {
            console.warn('[EtablissementRequired] Aucun établissement disponible dans preLoginData');
            toast.error('Impossible de charger la liste des établissements. Veuillez vous reconnecter.');
            
            // Déconnexion car token incomplet sans établissements
            setTimeout(() => {
                logout();
                router.navigate({ to: '/login', search: { redirect: undefined } });
            }, 2000);
            return;
        }

        // Toutes les vérifications passées → Afficher le modal
        setShowEtablissementModal(true);
        toast.info('Veuillez sélectionner votre établissement pour continuer');
    }, [router, setShowEtablissementModal, logout]);

    /**
     * Gérer la sélection d'un établissement
     */
    const handleSelectEtablissement = useCallback(async (etablissementId: string) => {
        try {
            await completeLogin(etablissementId);
            
            toast.success('Établissement sélectionné avec succès');
            setShowEtablissementModal(false);

            // Invalider le cache React Query pour forcer le rechargement des données
            // avec les nouvelles permissions
            try {
                const { queryClient } = await import('@/lib/query-client');
                queryClient.clear();
                console.log('[EtablissementRequired] Cache React Query invalidé');
            } catch (error) {
                console.warn('[EtablissementRequired] Échec invalidation cache:', error);
            }

            // Recharger la page pour appliquer le nouveau contexte
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } catch (error: any) {
            const message = error?.message || 'Erreur lors de la sélection';
            toast.error(message);
            
            // Si erreur, déconnecter l'utilisateur
            if (message.includes('Accès non autorisé')) {
                await logout();
                router.navigate({ to: '/login', search: { redirect: undefined } });
            }
        }
    }, [completeLogin, setShowEtablissementModal, logout, router]);

    /**
     * Écouter l'événement 'auth:etablissement-required'
     */
    useEffect(() => {
        window.addEventListener('auth:etablissement-required', handleEtablissementRequired);
        
        return () => {
            window.removeEventListener('auth:etablissement-required', handleEtablissementRequired);
        };
    }, [handleEtablissementRequired]);

    return {
        showEtablissementModal,
        etablissements: preLoginData?.etablissements || [],
        expiresIn: preLoginData?.expiresIn || 0,
        handleSelectEtablissement,
        handleCloseModal: () => setShowEtablissementModal(false),
    };
}

export default useEtablissementRequired;
