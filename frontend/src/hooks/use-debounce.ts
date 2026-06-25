/**
 * ==================================
 * eLISAschool - Hook useDebounce
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook personnalisé pour retarder l'exécution d'une valeur
 * jusqu'à ce qu'un certain délai se soit écoulé sans changement.
 * Utile pour optimiser les recherches, redimensionnements, etc.
 */

import { useState, useEffect } from 'react';

/**
 * Hook de debounce pour retarder les mises à jour de valeur
 * 
 * @param value - La valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 500ms)
 * @returns La valeur debounced
 * 
 * @example
 * ```tsx
 * const [recherche, setRecherche] = useState('');
 * const rechercheDebounce = useDebounce(recherche, 300);
 * 
 * useEffect(() => {
 *   // Ne se déclenche qu'après 300ms d'inactivité
 *   chercherAPI(rechercheDebounce);
 * }, [rechercheDebounce]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Créer un timer pour mettre à jour la valeur après le délai
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer si la valeur change avant la fin du délai
        // ou si le composant est démonté
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
