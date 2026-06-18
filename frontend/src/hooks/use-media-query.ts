/**
 * ==================================
 * eLISAschool - Hook useMediaQuery
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour détecter les media queries en temps réel.
 * Utilise matchMedia avec listeners pour performance optimale.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 479px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        // Listener avec gestion moderne (Chrome 86+) et fallback
        const handler = (event: MediaQueryListEvent | MediaQueryList) => {
            setMatches(event.matches);
        };

        // Méthode moderne
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler as any);
            return () => mediaQuery.removeEventListener('change', handler as any);
        }

        // Fallback ancien
        mediaQuery.addListener(handler as any);
        return () => mediaQuery.removeListener(handler as any);
    }, [query]);

    return matches;
}
