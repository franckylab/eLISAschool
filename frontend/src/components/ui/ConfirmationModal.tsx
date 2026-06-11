/**
 * ==================================
 * eLISAschool - Composant Modal de Confirmation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { ElisaButton } from './ElisaButton';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
    onCancel: () => void;
    isLoading?: boolean;
    details?: string;
}

/**
 * Modal de confirmation professionnelle pour remplacer confirm()
 * 
 * @example
 * <ConfirmationModal
 *   isOpen={showDeleteModal}
 *   title="Supprimer cet élément"
 *   message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
 *   variant="danger"
 *   onConfirm={() => handleDelete()}
 *   onCancel={() => setShowDeleteModal(false)}
 * />
 */
export function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
    details,
}: ConfirmationModalProps) {
    // Fermer avec Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onCancel]);

    const variants = {
        danger: {
            icon: AlertTriangle,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            confirmVariant: 'danger' as const,
            borderColor: 'border-red-200',
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-yellow-600',
            iconBg: 'bg-yellow-100',
            confirmVariant: 'warning' as const,
            borderColor: 'border-yellow-200',
        },
        info: {
            icon: AlertTriangle,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
            confirmVariant: 'primary' as const,
            borderColor: 'border-blue-200',
        },
    };

    const variantConfig = variants[variant];
    const Icon = variantConfig.icon;

    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header avec icône */}
                            <div className={`p-6 border-b ${variantConfig.borderColor}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${variantConfig.iconBg}`}>
                                            <Icon className={`h-6 w-6 ${variantConfig.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {title}
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-600">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onCancel}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Fermer"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Details optionnels */}
                            {details && (
                                <div className="px-6 py-4 bg-gray-50">
                                    <p className="text-sm text-gray-700">{details}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                                <ElisaButton
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                >
                                    {cancelLabel}
                                </ElisaButton>
                                <ElisaButton
                                    variant={variantConfig.confirmVariant}
                                    onClick={handleConfirm}
                                    isLoading={isLoading}
                                    icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                                >
                                    {confirmLabel}
                                </ElisaButton>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook pour gérer facilement les modales de confirmation
 */
export function useConfirmation() {
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm?: () => Promise<void> | void;
        details?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        details: undefined,
    });

    const ask = (options: {
        title: string;
        message: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm: () => Promise<void> | void;
        details?: string;
    }) => {
        setConfirmation({
            isOpen: true,
            title: options.title,
            message: options.message,
            variant: options.variant || 'danger',
            onConfirm: options.onConfirm,
            details: options.details,
        });
    };

    const handleCancel = () => {
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = async () => {
        if (confirmation.onConfirm) {
            await confirmation.onConfirm();
        }
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
    };

    const ConfirmationModalComponent = (
        <ConfirmationModal
            isOpen={confirmation.isOpen}
            title={confirmation.title}
            message={confirmation.message}
            variant={confirmation.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            details={confirmation.details}
        />
    );

    return { ask, ConfirmationModal: ConfirmationModalComponent };
}
