/**
 * ==================================
 * eLISAschool - Hook useLanguage
 * ==================================
 * Hook pour la gestion de la langue avec sync backend
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/stores/language.store';
import { apiClient } from '@/lib/api-client';

export function useLanguage() {
    const { i18n } = useTranslation();
    const { langue, setLangue: setStoreLangue } = useLanguageStore();

    const changerLangue = useCallback(async (nouvelleLangue: string) => {
        // Changer la langue i18next immédiatement
        await i18n.changeLanguage(nouvelleLangue);
        setStoreLangue(nouvelleLangue);

        // Mettre à jour le HTML lang
        document.documentElement.lang = nouvelleLangue;

        // Synchroniser avec le backend (non-bloquant)
        try {
            await apiClient.post('/api/preferences/set', {
                cle: 'langue',
                valeur: nouvelleLangue,
            });
        } catch {
            // Non-bloquant
        }
    }, [i18n, setStoreLangue]);

    return {
        langue,
        changerLangue,
        isFR: langue === 'fr',
        isEN: langue === 'en',
    };
}
