/**
 * ==================================
 * eLISAschool - Hook useBreakpoint
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook avancé pour détecter le breakpoint actuel selon les 10 niveaux définis.
 * Retourne le nom du breakpoint courant et des booléens pratiques.
 *
 * @example
 * const breakpoint = useBreakpoint();
 * if (breakpoint.isMobile) { ... }
 * if (breakpoint.current === 'sm') { ... }
 */

import { useMemo } from 'react';
import { useMediaQuery } from './use-media-query';

export type BreakpointName = 'xxs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

export interface BreakpointResult {
    /** Nom du breakpoint actuel */
    current: BreakpointName;
    /** Largeur actuelle du viewport */
    width: number;
    /** Est un très petit écran (< 200px) */
    isXXS: boolean;
    /** Est un écran ultra-compact (< 320px) */
    is2XS: boolean;
    /** Est un petit téléphone (< 480px) */
    isXS: boolean;
    /** Est mobile (< 768px) */
    isMobile: boolean;
    /** Est tablette (768px - 1023px) */
    isTablet: boolean;
    /** Est laptop (1024px - 1279px) */
    isLaptop: boolean;
    /** Est desktop (1280px - 1919px) */
    isDesktop: boolean;
    /** Est grand écran (1920px - 2559px) */
    isLargeScreen: boolean;
    /** Est écran 4K+ (2560px+) */
    is4K: boolean;
    /** Est au moins ce breakpoint */
    isAtLeast: (breakpoint: BreakpointName) => boolean;
    /** Est au maximum ce breakpoint */
    isAtMost: (breakpoint: BreakpointName) => boolean;
}

const BREAKPOINTS: { name: BreakpointName; width: number }[] = [
    { name: 'xxs', width: 100 },
    { name: '2xs', width: 200 },
    { name: 'xs', width: 320 },
    { name: 'sm', width: 480 },
    { name: 'md', width: 640 },
    { name: 'lg', width: 768 },
    { name: 'xl', width: 1024 },
    { name: '2xl', width: 1280 },
    { name: '3xl', width: 1536 },
    { name: '4xl', width: 1920 },
    { name: '5xl', width: 2560 },
];

export function useBreakpoint(): BreakpointResult {
    // Détecter chaque breakpoint
    const isXXS = useMediaQuery('(min-width: 100px)');
    const is2XS = useMediaQuery('(min-width: 200px)');
    const isXS = useMediaQuery('(min-width: 320px)');
    const isSM = useMediaQuery('(min-width: 480px)');
    const isMD = useMediaQuery('(min-width: 640px)');
    const isLG = useMediaQuery('(min-width: 768px)');
    const isXL = useMediaQuery('(min-width: 1024px)');
    const is2XL = useMediaQuery('(min-width: 1280px)');
    const is3XL = useMediaQuery('(min-width: 1536px)');
    const is4XL = useMediaQuery('(min-width: 1920px)');
    const is5XL = useMediaQuery('(min-width: 2560px)');

    // Obtenir la largeur actuelle
    const width = useViewportWidth();

    const result = useMemo<BreakpointResult>(() => {
        // Déterminer le breakpoint actuel
        let current: BreakpointName = 'xxs';
        if (is5XL) current = '5xl';
        else if (is4XL) current = '4xl';
        else if (is3XL) current = '3xl';
        else if (is2XL) current = '2xl';
        else if (isXL) current = 'xl';
        else if (isLG) current = 'lg';
        else if (isMD) current = 'md';
        else if (isSM) current = 'sm';
        else if (isXS) current = 'xs';
        else if (is2XS) current = '2xs';

        return {
            current,
            width,
            isXXS: width < 200,
            is2XS: width >= 200 && width < 320,
            isXS: width >= 320 && width < 480,
            isMobile: width < 768,
            isTablet: width >= 768 && width < 1024,
            isLaptop: width >= 1024 && width < 1280,
            isDesktop: width >= 1280 && width < 1920,
            isLargeScreen: width >= 1920 && width < 2560,
            is4K: width >= 2560,
            isAtLeast: (bp: BreakpointName) => {
                const idx = BREAKPOINTS.findIndex(b => b.name === bp);
                const currentIdx = BREAKPOINTS.findIndex(b => b.name === current);
                return currentIdx >= idx;
            },
            isAtMost: (bp: BreakpointName) => {
                const idx = BREAKPOINTS.findIndex(b => b.name === bp);
                const currentIdx = BREAKPOINTS.findIndex(b => b.name === current);
                return currentIdx <= idx;
            },
        };
    }, [isXXS, is2XS, isXS, isSM, isMD, isLG, isXL, is2XL, is3XL, is4XL, is5XL, width]);

    return result;
}

/**
 * Hook interne pour obtenir la largeur du viewport
 * avec mise à jour en temps réel et throttling
 */
function useViewportWidth(): number {
    const [width, setWidth] = useMediaQueryWidth();
    return width;
}

/**
 * Hook optimisé pour suivre la largeur avec throttling
 */
function useMediaQueryWidth(): [number, (w: number) => void] {
    const [width, setWidth] = React.useState(() => {
        if (typeof window === 'undefined') return 1024;
        return window.innerWidth;
    });

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        let timeoutId: NodeJS.Timeout;
        
        const handleResize = () => {
            // Throttling 100ms pour performance
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                setWidth(window.innerWidth);
                timeoutId = 0;
            }, 100);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return [width, setWidth];
}

// Import React pour le hook interne
import React from 'react';
