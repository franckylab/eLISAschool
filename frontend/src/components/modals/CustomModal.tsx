/**
 * ==================================
 * eLISAschool - CustomModal
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Modale avancée : déplaçable, redimensionnable, minimisable, maximisable.
 * Basée sur @radix-ui/react-dialog (focus trap, accessibilité).
 * Toutes les capacités sont activées par défaut.
 */

import { type ReactNode, useCallback, useRef, useMemo, useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useModalWindow } from '@/hooks/use-modal-window';

interface CustomModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    showClose?: boolean;
    closeOnOverlayClick?: boolean;
    footer?: ReactNode;
    maxHeight?: string;
    /** Activer le déplacement (défaut: true) */
    draggable?: boolean;
    /** Activer le redimensionnement (défaut: true) */
    resizable?: boolean;
    /** Activer le bouton minimiser (défaut: true) */
    minimizable?: boolean;
    /** Activer le bouton maximiser (défaut: true) */
    maximizable?: boolean;
    /** Largeur initiale en px (défaut selon size) */
    initialWidth?: number;
    /** Hauteur initiale en px (défaut: auto) */
    initialHeight?: number;
}

/** Mapping taille → largeur px */
const sizeToWidth: Record<string, number> = {
    sm: 384,
    md: 448,
    lg: 512,
    xl: 576,
    '2xl': 672,
    '3xl': 768,
    full: typeof window !== 'undefined' ? window.innerWidth - 40 : 1200,
};

/** Mapping taille → min-width px */
const sizeToMinWidth: Record<string, number> = {
    sm: 280,
    md: 320,
    lg: 360,
    xl: 400,
    '2xl': 400,
    '3xl': 400,
    full: 400,
};

export function CustomModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    size = 'md',
    showClose = true,
    closeOnOverlayClick = true,
    footer,
    maxHeight: _maxHeight,
    draggable = true,
    resizable = true,
    minimizable = true,
    maximizable = true,
    initialWidth,
    initialHeight,
}: CustomModalProps) {
    // ── Viewport tracking pour responsive size ──────────────────
    const [viewportWidth, setViewportWidth] = useState(0);
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        onResize();
        window.addEventListener('resize', onResize, { passive: true });
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Downscale automatique du size selon viewport ────────────
    // Ne jamais agrandir au-dessus du size demandé, mais réduire
    // si l'écran ne peut pas contenir le size demandé.
    const effectiveSize = useMemo(() => {
        if (size === 'full') return 'full';
        if (viewportWidth === 0 || viewportWidth >= 1024) return size;

        const SIZE_RANK: Record<string, number> = {
            sm: 1, md: 2, lg: 3, xl: 4, '2xl': 5, '3xl': 6, full: 7,
        };
        const requestedRank = SIZE_RANK[size] ?? 7;

        // Calculer le rank maximum que le viewport peut contenir
        const margin = viewportWidth < 480 ? 16 : viewportWidth < 768 ? 24 : 32;
        let maxRank = 1;
        for (const [s, w] of Object.entries(sizeToWidth)) {
            if (s === 'full') continue; // full suit son propre dimensionnement
            if (w + margin <= viewportWidth) {
                maxRank = Math.max(maxRank, SIZE_RANK[s] ?? 1);
            }
        }

        const rank = Math.min(requestedRank, maxRank);
        const entry = Object.entries(SIZE_RANK).find(([_, r]) => r === rank);
        return (entry?.[0] ?? 'sm') as typeof size;
    }, [size, viewportWidth]);

    const resolvedWidth = initialWidth ?? sizeToWidth[effectiveSize] ?? 448;
    const resolvedMinWidth = sizeToMinWidth[effectiveSize] ?? 280;

    const {
        state,
        containerRef,
        handlers,
        style,
        resizeHandleClasses,
    } = useModalWindow({
        initialWidth: resolvedWidth,
        initialHeight: initialHeight ?? 500,
        minWidth: resolvedMinWidth,
        minHeight: 200,
    });

    const isMinimized = state === 'minimized';
    const isMaximized = state === 'maximized';

    // ── Détection des clics sur l'overlay vs contenu du modal ──
    // On utilise un ref pour savoir si le pointerdown a eu lieu sur l'overlay.
    // Cela évite de fermer le modal quand on clique dans le contenu (y compris les portails Radix Select).
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        // Ne fermer que si le clic cible directement l'overlay (pas un enfant)
        if (e.target === overlayRef.current && closeOnOverlayClick) {
            onOpenChange(false);
        }
    }, [closeOnOverlayClick, onOpenChange]);

    return (
        <AnimatePresence>
            {open && (
                <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
                    <DialogPrimitive.Portal>
                        {/* Overlay — cliquer sur l'overlay (pas sur le contenu) ferme le modal */}
                        <DialogPrimitive.Overlay asChild>
                            <motion.div
                                ref={overlayRef}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={handleOverlayClick}
                            />
                        </DialogPrimitive.Overlay>

                        {/* Content — modal={false} évite le conflit avec les portails Radix (Select, Dropdown) */}
                        <DialogPrimitive.Content
                            className="focus:outline-none"
                            onPointerDownOutside={(e) => {
                                // Avec modal={false}, empêcher Radix de fermer automatiquement
                                e.preventDefault();
                            }}
                            onFocusOutside={(e) => {
                                // Empêcher la fermeture quand le focus se déplace à l'extérieur
                                // (ex: restauration du focus du dropdown trigger après fermeture)
                                e.preventDefault();
                            }}
                            onEscapeKeyDown={(e) => {
                                // Permettre la fermeture via Échap
                                if (closeOnOverlayClick) {
                                    onOpenChange(false);
                                } else {
                                    e.preventDefault();
                                }
                            }}
                            asChild
                        >
                            <div
                                ref={containerRef}
                                style={style}
                                className={cn(
                                    'flex flex-col border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-2xl',
                                    'transition-[border-radius] duration-200',
                                    'rounded-[var(--radius-xl)]',
                                    isMaximized && 'rounded-none',
                                    isMinimized && 'overflow-hidden',
                                    resizable && !isMaximized && !isMinimized && 'modal-resizable',
                                )}
                            >
                                {/* ─── Poignées de redimensionnement ─────────────────── */}
                                {resizable && state === 'normal' && (
                                    <>
                                        {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((dir) => (
                                            <div
                                                key={dir}
                                                className={cn(
                                                    'z-50 select-none',
                                                    resizeHandleClasses[dir],
                                                    // Zone invisible avec hover
                                                    'hover:bg-[var(--color-dominante)]/20 transition-colors',
                                                )}
                                                onMouseDown={handlers.onResizeMouseDown(dir)}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* ─── Header (zone de drag) ────────────────────────── */}
                                {(title || showClose || true) && (
                                    <div
                                        className={cn(
                                            'flex items-center justify-between border-b border-[var(--color-bordure)] select-none',
                                            'px-[var(--padding-modal-header)] py-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)]',
                                            draggable && state === 'normal' && 'cursor-grab active:cursor-grabbing',
                                            isMinimized && 'border-b-0',
                                        )}
                                        onMouseDown={draggable ? handlers.onHeaderMouseDown : undefined}
                                        onDoubleClick={draggable ? handlers.onHeaderDoubleClick : undefined}
                                    >
                                        <div className="flex-1 min-w-0">
                                            {title ? (
                                                <>
                                                    <DialogPrimitive.Title className="font-semibold text-[var(--color-texte)] truncate" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}>
                                                        {title}
                                                    </DialogPrimitive.Title>
                                                    {description && !isMinimized && (
                                                        <DialogPrimitive.Description className="mt-0.5 text-[var(--color-texte-secondaire)] truncate" style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}>
                                                            {description}
                                                        </DialogPrimitive.Description>
                                                    )}
                                                </>
                                            ) : (
                                                // Titre caché mais accessible pour les lecteurs d'écran
                                                <VisuallyHidden>
                                                    <DialogPrimitive.Title>Modal</DialogPrimitive.Title>
                                                    <DialogPrimitive.Description>Modal dialog</DialogPrimitive.Description>
                                                </VisuallyHidden>
                                            )}
                                        </div>

                                        {/* ─── Boutons de contrôle ─────────────────── */}
                                        <div className="flex items-center gap-[var(--gap-xs)] ml-2 shrink-0">
                                            {minimizable && (
                                                <button
                                                    className="rounded-[var(--radius-sm)] p-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                                    onClick={(e) => { e.stopPropagation(); handlers.toggleMinimize(); }}
                                                    title={isMinimized ? 'Restaurer' : 'Réduire'}
                                                    aria-label={isMinimized ? 'Restaurer' : 'Réduire'}
                                                >
                                                    <Minus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                </button>
                                            )}
                                            {maximizable && (
                                                <button
                                                    className="rounded-[var(--radius-sm)] p-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                                    onClick={(e) => { e.stopPropagation(); handlers.toggleMaximize(); }}
                                                    title={isMaximized ? 'Restaurer' : 'Agrandir'}
                                                    aria-label={isMaximized ? 'Restaurer' : 'Agrandir'}
                                                >
                                                    {isMaximized
                                                        ? <Minimize2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                        : <Maximize2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                    }
                                                </button>
                                            )}
                                            {showClose && (
                                                <DialogPrimitive.Close asChild>
                                                    <button
                                                        className="rounded-[var(--radius-sm)] p-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] text-[var(--color-texte-secondaire)] transition-colors hover:bg-red-100 hover:text-red-600"
                                                        aria-label="Fermer"
                                                    >
                                                        <X className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                    </button>
                                                </DialogPrimitive.Close>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ─── Body ─────────────────────────────────────────── */}
                                {!isMinimized && (
                                    <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: 'var(--padding-modal-body)' }}>
                                        {children}
                                    </div>
                                )}

                                {/* ─── Footer ───────────────────────────────────────── */}
                                {footer && !isMinimized && (
                                    <div className="flex items-center justify-end gap-[var(--gap-md)] border-t border-[var(--color-bordure)] shrink-0" style={{ padding: 'var(--padding-modal-footer)' }}>
                                        {footer}
                                    </div>
                                )}
                            </div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                </DialogPrimitive.Root>
            )}
        </AnimatePresence>
    );
}
