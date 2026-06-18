/**
 * ==================================
 * eLISAschool - Hook useModalWindow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook universel pour rendre les modales déplaçables,
 * redimensionnables, minimisables et maximisables.
 *
 * @example
 * const { state, position, size, handlers } = useModalWindow({
 *     initialWidth: 672,
 *     initialHeight: 600,
 *     minWidth: 300,
 *     minHeight: 200,
 * });
 */

import { useState, useCallback, useRef, useEffect, type RefObject } from 'react';

/** État visuel de la modale */
export type ModalWindowState = 'normal' | 'maximized' | 'minimized';

/** Direction de redimensionnement */
type ResizeDirection =
    | 'n' | 's' | 'e' | 'w'
    | 'ne' | 'nw' | 'se' | 'sw';

/** Point 2D */
interface Point {
    x: number;
    y: number;
}

/** Taille */
interface Size {
    width: number;
    height: number;
}

/** Position */
interface Position {
    x: number;
    y: number;
}

/** Configuration du hook */
export interface UseModalWindowOptions {
    /** Largeur initiale en px */
    initialWidth?: number;
    /** Hauteur initiale en px */
    initialHeight?: number;
    /** Largeur minimale en px */
    minWidth?: number;
    /** Hauteur minimale en px */
    minHeight?: number;
    /** Largeur maximale (défaut: window.innerWidth - 40) */
    maxWidth?: number;
    /** Hauteur maximale (défaut: window.innerHeight - 40) */
    maxHeight?: number;
    /** État initial */
    initialState?: ModalWindowState;
}

/** Valeurs précédentes (avant maximize/minimize) */
interface PreviousState {
    position: Position;
    size: Size;
}

/** Résultat du hook */
export interface UseModalWindowResult {
    /** État visuel courant */
    state: ModalWindowState;
    /** Position courante (coin haut-gauche) */
    position: Position;
    /** Taille courante */
    size: Size;
    /** Ref à attacher au conteneur de la modale */
    containerRef: RefObject<HTMLDivElement | null>;
    /** Handlers à brancher */
    handlers: {
        /** À mettre sur le header pour le drag */
        onHeaderMouseDown: (e: React.MouseEvent) => void;
        /** Double-clic sur header pour toggle maximize */
        onHeaderDoubleClick: () => void;
        /** À mettre sur chaque poignée de redimensionnement */
        onResizeMouseDown: (direction: ResizeDirection) => (e: React.MouseEvent) => void;
        /** Toggle maximize */
        toggleMaximize: () => void;
        /** Toggle minimize */
        toggleMinimize: () => void;
        /** Fermer (remet à zéro) */
        reset: () => void;
    };
    /** CSS inline à appliquer sur le conteneur */
    style: React.CSSProperties;
    /** Classes des poignées de redimensionnement */
    resizeHandleClasses: Record<ResizeDirection, string>;
}

/** Marge de bord de viewport — responsive */
const getViewportMargin = () => {
    if (typeof window === 'undefined') return 20;
    const vw = window.innerWidth;
    // Plus petit sur petits écrans
    if (vw < 480) return 8;
    if (vw < 768) return 12;
    if (vw < 1024) return 16;
    return 20;
};

/** Hauteur minimale quand minimisé (barre de titre seulement) */
const MINIMIZED_HEIGHT = 48;

export function useModalWindow(options: UseModalWindowOptions = {}): UseModalWindowResult {
    const {
        initialWidth = 672,
        initialHeight = 600,
        minWidth = 300,
        minHeight = 200,
        initialState = 'normal',
    } = options;

    // ─── Centrage initial ──────────────────────────────────────
    const computeInitialPosition = useCallback((): Position => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = getViewportMargin();
        // Sur petits écrans, modal occupe presque tout l'écran
        const adaptedWidth = vw < 480 ? vw - margin * 2 : initialWidth;
        const adaptedHeight = vw < 480 ? Math.min(vh - margin * 2, initialHeight) : initialHeight;
        return {
            x: Math.max(margin, (vw - adaptedWidth) / 2),
            y: Math.max(margin, (vh - adaptedHeight) / 2),
        };
    }, [initialWidth, initialHeight]);

    const [state, setState] = useState<ModalWindowState>(initialState);
    const [position, setPosition] = useState<Position>(computeInitialPosition);
    const initialWidthAdapted = typeof window !== 'undefined' && window.innerWidth < 480
        ? window.innerWidth - getViewportMargin() * 2
        : initialWidth;
    const [size, setSize] = useState<Size>({ width: initialWidthAdapted, height: initialHeight });

    // Sauvegarde avant maximize/minimize
    const previousRef = useRef<PreviousState | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // ─── Drag state (refs pour la performance) ──────────────────
    const isDragging = useRef(false);
    const dragStart = useRef<Point>({ x: 0, y: 0 });
    const posStart = useRef<Position>({ x: 0, y: 0 });

    // ─── Resize state ──────────────────────────────────────────
    const isResizing = useRef(false);
    const resizeDirection = useRef<ResizeDirection | null>(null);
    const resizeStart = useRef<Point>({ x: 0, y: 0 });
    const sizeStart = useRef<Size>({ width: 0, height: 0 });
    const posResizeStart = useRef<Position>({ x: 0, y: 0 });

    // ─── Constraints ───────────────────────────────────────────
    const getMaxWidth = useCallback(() => {
        const margin = getViewportMargin();
        return options.maxWidth ?? window.innerWidth - margin * 2;
    }, [options.maxWidth]);
    const getMaxHeight = useCallback(() => {
        const margin = getViewportMargin();
        return options.maxHeight ?? window.innerHeight - margin * 2;
    }, [options.maxHeight]);

    // ─── Clamp position dans le viewport ───────────────────────
    const clampPosition = useCallback((pos: Position, sz: Size): Position => {
        const margin = getViewportMargin();
        return {
            x: Math.max(margin, Math.min(pos.x, window.innerWidth - sz.width - margin)),
            y: Math.max(margin, Math.min(pos.y, window.innerHeight - sz.height - margin)),
        };
    }, []);

    // ─── DRAG : handlers ───────────────────────────────────────
    const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
        // Pas de drag si maximisé ou minimisé
        if (state !== 'normal') return;
        e.preventDefault();
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        posStart.current = { ...position };
    }, [state, position]);

    // ─── RESIZE : handlers ─────────────────────────────────────
    const onResizeMouseDown = useCallback((direction: ResizeDirection) => (e: React.MouseEvent) => {
        if (state !== 'normal') return;
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        resizeDirection.current = direction;
        resizeStart.current = { x: e.clientX, y: e.clientY };
        sizeStart.current = { ...size };
        posResizeStart.current = { ...position };
    }, [state, size, position]);

    // ─── Toggle maximize ────────────────────────────────────────
    const toggleMaximize = useCallback(() => {
        if (state === 'minimized') return;
        const margin = getViewportMargin();
        if (state === 'maximized') {
            // Restaurer
            if (previousRef.current) {
                setPosition(previousRef.current.position);
                setSize(previousRef.current.size);
            }
            setState('normal');
        } else {
            // Sauvegarder et maximiser
            previousRef.current = { position: { ...position }, size: { ...size } };
            setPosition({ x: margin, y: margin });
            setSize({
                width: window.innerWidth - margin * 2,
                height: window.innerHeight - margin * 2,
            });
            setState('maximized');
        }
    }, [state, position, size]);

    // ─── Toggle minimize ────────────────────────────────────────
    const toggleMinimize = useCallback(() => {
        if (state === 'minimized') {
            // Restaurer
            if (previousRef.current) {
                setPosition(previousRef.current.position);
                setSize(previousRef.current.size);
            }
            setState('normal');
        } else {
            previousRef.current = { position: { ...position }, size: { ...size } };
            const margin = getViewportMargin();
            // Garder la position X, mais coller en bas et réduire la hauteur
            setSize(prev => ({ ...prev, height: MINIMIZED_HEIGHT }));
            setPosition(prev => ({
                ...prev,
                y: window.innerHeight - MINIMIZED_HEIGHT - margin,
            }));
            setState('minimized');
        }
    }, [state, position, size]);

    // ─── Reset ──────────────────────────────────────────────────
    const reset = useCallback(() => {
        setState('normal');
        setPosition(computeInitialPosition());
        setSize({ width: initialWidth, height: initialHeight });
        previousRef.current = null;
    }, [computeInitialPosition, initialWidth, initialHeight]);

    // ─── Header double-click ────────────────────────────────────
    const onHeaderDoubleClick = useCallback(() => {
        toggleMaximize();
    }, [toggleMaximize]);

    // ─── Global mouse listeners (mousemove / mouseup) ──────────
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current && !isResizing.current) return;

            if (isDragging.current) {
                const dx = e.clientX - dragStart.current.x;
                const dy = e.clientY - dragStart.current.y;
                const newPos = clampPosition(
                    { x: posStart.current.x + dx, y: posStart.current.y + dy },
                    size
                );
                setPosition(newPos);
            }
            if (isResizing.current && resizeDirection.current) {
                const dx = e.clientX - resizeStart.current.x;
                const dy = e.clientY - resizeStart.current.y;
                const dir = resizeDirection.current;

                let newWidth = sizeStart.current.width;
                let newHeight = sizeStart.current.height;
                let newX = posResizeStart.current.x;
                let newY = posResizeStart.current.y;

                // Horizontal
                if (dir.includes('e')) {
                    newWidth = Math.min(Math.max(sizeStart.current.width + dx, minWidth), getMaxWidth());
                }
                if (dir.includes('w')) {
                    const delta = Math.min(dx, sizeStart.current.width - minWidth);
                    newWidth = Math.max(sizeStart.current.width - delta, minWidth);
                    newWidth = Math.min(newWidth, getMaxWidth());
                    newX = posResizeStart.current.x + delta;
                }

                // Vertical
                if (dir.includes('s')) {
                    newHeight = Math.min(Math.max(sizeStart.current.height + dy, minHeight), getMaxHeight());
                }
                if (dir.includes('n')) {
                    const delta = Math.min(dy, sizeStart.current.height - minHeight);
                    newHeight = Math.max(sizeStart.current.height - delta, minHeight);
                    newHeight = Math.min(newHeight, getMaxHeight());
                    newY = posResizeStart.current.y + delta;
                }

                // Clamp position
                const clampedPos = clampPosition({ x: newX, y: newY }, { width: newWidth, height: newHeight });

                setSize({ width: newWidth, height: newHeight });
                setPosition(clampedPos);
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            isResizing.current = false;
            resizeDirection.current = null;
        };

        // Utilisation de listeners passifs pour améliorer les performances
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [size, minWidth, minHeight, getMaxWidth, getMaxHeight, clampPosition]);

    // ─── CSS inline à appliquer ─────────────────────────────────
    const style: React.CSSProperties = {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: state === 'minimized' ? `${MINIMIZED_HEIGHT}px` : `${size.height}px`,
        zIndex: 1000,
    };

    // ─── Classes des poignées ────────────────────────────────────
    // Invisible mais zone de capture 8px sur chaque bord/coin
    const resizeHandleClasses: Record<ResizeDirection, string> = {
        n:  'absolute top-0 left-2 right-2 h-2 cursor-n-resize',
        s:  'absolute bottom-0 left-2 right-2 h-2 cursor-s-resize',
        e:  'absolute top-2 right-0 bottom-2 w-2 cursor-e-resize',
        w:  'absolute top-2 left-0 bottom-2 w-2 cursor-w-resize',
        ne: 'absolute top-0 right-0 w-4 h-4 cursor-ne-resize',
        nw: 'absolute top-0 left-0 w-4 h-4 cursor-nw-resize',
        se: 'absolute bottom-0 right-0 w-4 h-4 cursor-se-resize',
        sw: 'absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize',
    };

    return {
        state,
        position,
        size,
        containerRef,
        handlers: {
            onHeaderMouseDown,
            onHeaderDoubleClick,
            onResizeMouseDown,
            toggleMaximize,
            toggleMinimize,
            reset,
        },
        style,
        resizeHandleClasses,
    };
}
