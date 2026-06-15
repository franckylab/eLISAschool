/**
 * ==================================
 * eLISAschool - Hook de sélection d'établissement
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hook personnalisé pour gérer la sélection d'établissement.
 * Fournit les états et actions nécessaires au flux de sélection.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { useRouter } from '@tanstack/react-router';

export function useEtablissementSelection() {
    const router = useRouter();
    const {
        preLoginData,
        showEtablissementModal,
        completeLogin,
        setShowEtablissementModal,
    } = useAuthStore();

    /**
     * Gère la sélection d'un établissement
     * Appelle l'API complete-login et met à jour le store
     */
    const handleSelectEtablissement = useCallback(async (etablissementId: string) => {
        try {
            await completeLogin(etablissementId);
            
            toast.success('Établissement sélectionné avec succès');
            
            // Fermer le modal
            setShowEtablissementModal(false);

            // Invalider le cache React Query pour forcer le rechargement des données
            // avec les nouvelles permissions
            try {
                const { queryClient } = await import('@/lib/query-client');
                queryClient.clear();
                console.log('[EtablissementSelection] Cache React Query invalidé');
            } catch (error) {
                console.warn('[EtablissementSelection] Échec invalidation cache:', error);
            }

            // Rediriger vers le dashboard
            setTimeout(() => {
                router.navigate({ to: '/dashboard' });
            }, 300);
        } catch (error: any) {
            const message = error?.message || 'Erreur lors de la sélection';
            toast.error(message);
            throw error;
        }
    }, [completeLogin, setShowEtablissementModal, router]);

    /**
     * Ferme le modal de sélection
     */
    const handleCloseModal = useCallback(() => {
        setShowEtablissementModal(false);
    }, [setShowEtablissementModal]);

    /**
     * Ouvre le modal de sélection
     */
    const handleOpenModal = useCallback(() => {
        setShowEtablissementModal(true);
    }, [setShowEtablissementModal]);

    /**
     * Vérifie si l'utilisateur doit sélectionner un établissement
     */
    const requiresSelection = useCallback(() => {
        return preLoginData?.requiereSelection === true;
    }, [preLoginData]);

    /**
     * Récupère le nombre d'établissements disponibles
     */
    const getEtablissementsCount = useCallback(() => {
        return preLoginData?.etablissements?.length || 0;
    }, [preLoginData]);

    /**
     * Récupère le temps restant avant expiration
     */
    const getTimeRemaining = useCallback(() => {
        if (!preLoginData?.expiresIn) return 0;
        return Math.max(0, Math.floor(preLoginData.expiresIn / 1000));
    }, [preLoginData]);

    return {
        // États
        preLoginData,
        showEtablissementModal,
        
        // Actions
        handleSelectEtablissement,
        handleCloseModal,
        handleOpenModal,
        requiresSelection,
        getEtablissementsCount,
        getTimeRemaining,
    };
}

export default useEtablissementSelection;
