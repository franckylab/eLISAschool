/**
 * ==================================
 * eLISAschool - Hook useRotationControle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hook utilitaire pour contrôler manuellement la rotation des fonds d'écran.
 */

import { useState, useCallback } from 'react';

export function useRotationControle(totalFonds: number = 36) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const precedent = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalFonds) % totalFonds);
    }, [totalFonds]);

    const suivant = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalFonds);
    }, [totalFonds]);

    const allerA = useCallback((index: number) => {
        setCurrentIndex(index % totalFonds);
    }, [totalFonds]);

    return { currentIndex, precedent, suivant, allerA };
}
