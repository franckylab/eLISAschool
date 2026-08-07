/**
 * ==================================
 * eLISAschool - Tooltip
 * ==================================
 * Infobulle moderne et accessible basée sur Radix UI Tooltip.
 *
 * Variantes :
 * - `info` (défaut) : fond surface, bordure dominante
 * - `success` : fond success/10, bordure success
 * - `warning` : fond warning/10, bordure warning
 * - `error` : fond danger/10, bordure danger
 *
 * Features :
 * - Animation entrée/sortie (fade + scale)
 * - Délai configurable (open/close)
 * - Flèche directionnelle
 * - Dark mode natif (variables CSS)
 * - Ultra-responsive (clamp, max-width adaptatif)
 * - Accessible (aria-describedby, focus trigger)
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ─── Types ─── */

type TooltipVariant = 'info' | 'success' | 'warning' | 'error';

interface TooltipProps {
    /** Contenu du tooltip (texte ou ReactNode) */
    content: React.ReactNode;
    /** Enfant qui déclenche le tooltip */
    children: React.ReactNode;
    /** Variante visuelle (défaut: info) */
    variant?: TooltipVariant;
    /** Côté d'affichage (défaut: top) */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Alignement (défaut: center) */
    align?: 'start' | 'center' | 'end';
    /** Délai avant ouverture en ms (défaut: 200) */
    delayDuration?: number;
    /** Décalage par rapport au trigger en px (défaut: 6) */
    sideOffset?: number;
    /** Largeur max (défaut: clamp(180px, 40vw, 280px)) */
    maxWidth?: string;
    /** Classe CSS supplémentaire sur le contenu */
    className?: string;
}

/* ─── Styles par variante ─── */

const variantStyles: Record<TooltipVariant, { border: string; icon: React.ReactNode; iconColor: string }> = {
    info: {
        border: 'border-[var(--color-dominant-500)]/30',
        icon: <Info className="h-3.5 w-3.5 shrink-0" />,
        iconColor: 'text-[var(--color-dominant-600)]',
    },
    success: {
        border: 'border-[var(--color-success)]/30',
        icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
        iconColor: 'text-[var(--color-success)]',
    },
    warning: {
        border: 'border-[var(--color-warning)]/30',
        icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
        iconColor: 'text-[var(--color-warning)]',
    },
    error: {
        border: 'border-[var(--color-danger)]/30',
        icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
        iconColor: 'text-[var(--color-danger)]',
    },
};

/* ─── Composant principal ─── */

export function Tooltip({
    content,
    children,
    variant = 'info',
    side = 'top',
    align = 'center',
    delayDuration = 200,
    sideOffset = 6,
    maxWidth = 'clamp(180px, 40vw, 280px)',
    className,
}: TooltipProps) {
    const [open, setOpen] = useState(false);
    const styles = variantStyles[variant];

    return (
        <TooltipPrimitive.Provider delayDuration={delayDuration}>
            <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        align={align}
                        sideOffset={sideOffset}
                        className={cn(
                            'z-50 overflow-hidden rounded-lg border shadow-lg',
                            'bg-[var(--color-surface)]',
                            styles.border,
                            'animate-in fade-in-0 zoom-in-95',
                            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                            'data-[side=top]:slide-in-from-bottom-1',
                            'data-[side=bottom]:slide-in-from-top-1',
                            'data-[side=left]:slide-in-from-right-1',
                            'data-[side=right]:slide-in-from-left-1',
                            className,
                        )}
                        style={{ maxWidth }}
                    >
                        {/* Contenu */}
                        <div className="flex items-start gap-[var(--gap-xs)] p-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)]">
                            <span className={cn('mt-0.5', styles.iconColor)}>
                                {styles.icon}
                            </span>
                            <div
                                className="text-[var(--color-text-secondary)] leading-relaxed"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                            >
                                {content}
                            </div>
                        </div>
                        {/* Flèche */}
                        <TooltipPrimitive.Arrow
                            className="fill-[var(--color-surface)]"
                            width={10}
                            height={5}
                        />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

/* ─── Variante compacte : icône info avec tooltip ─── */

interface InfoBulleProps {
    content: React.ReactNode;
    variant?: TooltipVariant;
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Taille de l'icône (défaut: 3.5 = 14px) */
    iconSize?: number;
    className?: string;
}

export function InfoBulle({
    content,
    variant = 'info',
    side = 'top',
    iconSize = 3.5,
    className,
}: InfoBulleProps) {
    const styles = variantStyles[variant];

    return (
        <Tooltip content={content} variant={variant} side={side} delayDuration={300}>
            <span
                className={cn(
                    'inline-flex items-center justify-center cursor-help',
                    styles.iconColor,
                    'opacity-60 hover:opacity-100 transition-opacity',
                    className,
                )}
                role="img"
                aria-label="Information"
            >
                <Info style={{ width: `${iconSize * 4}px`, height: `${iconSize * 4}px` }} />
            </span>
        </Tooltip>
    );
}
