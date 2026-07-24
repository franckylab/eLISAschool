/**
 * ==================================
 * eLISAschool - Hook handleError partagé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { toast } from 'sonner';

/**
 * Helper partagé pour la gestion d'erreurs dans les hooks du module organisation.
 * Extrait le message d'erreur et affiche un toast.
 */
export function useHandleError() {
    return (e: unknown, messageFallback: string): void => {
        const message = e instanceof Error ? e.message : messageFallback;
        toast.error(message);
    };
}
