/**
 * ==================================
 * eLISAschool - CustomModal
 * ==================================
 * Modale basée sur @radix-ui/react-dialog avec focus trap et tailles
 */

import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

interface CustomModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showClose?: boolean;
    closeOnOverlayClick?: boolean;
    footer?: ReactNode;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
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
}: CustomModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
                    <DialogPrimitive.Portal>
                        <DialogPrimitive.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
                            />
                        </DialogPrimitive.Overlay>
                        <DialogPrimitive.Content
                            className={cn(
                                'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
                                'rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-xl',
                                'focus:outline-none',
                                sizeClasses[size],
                            )}
                            onPointerDownOutside={(e) => {
                                if (!closeOnOverlayClick) e.preventDefault();
                            }}
                            asChild
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                {/* Header */}
                                {(title || showClose) && (
                                    <div className="flex items-start justify-between border-b border-[var(--color-bordure)] px-6 py-4">
                                        <div>
                                            {title && (
                                                <DialogPrimitive.Title className="text-lg font-semibold text-[var(--color-texte)]">
                                                    {title}
                                                </DialogPrimitive.Title>
                                            )}
                                            {description && (
                                                <DialogPrimitive.Description className="mt-1 text-sm text-[var(--color-texte-secondaire)]">
                                                    {description}
                                                </DialogPrimitive.Description>
                                            )}
                                        </div>
                                        {showClose && (
                                            <DialogPrimitive.Close asChild>
                                                <button
                                                    className="rounded-md p-1 text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                                    aria-label="Fermer"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </DialogPrimitive.Close>
                                        )}
                                    </div>
                                )}

                                {/* Body */}
                                <div className="px-6 py-4">{children}</div>

                                {/* Footer */}
                                {footer && (
                                    <div className="flex items-center justify-end gap-3 border-t border-[var(--color-bordure)] px-6 py-4">
                                        {footer}
                                    </div>
                                )}
                            </motion.div>
                        </DialogPrimitive.Content>
                    </DialogPrimitive.Portal>
                </DialogPrimitive.Root>
            )}
        </AnimatePresence>
    );
}
