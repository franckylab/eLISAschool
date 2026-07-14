/**
 * ==================================
 * eLISAschool - Composant Modal de Confirmation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal de confirmation professionnelle basée sur CustomModal.
 * Hérite automatiquement du drag, resize, minimize, maximize.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
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
        confirmVariant: 'accent' as const,
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

    const variantConfig = variants[variant];
    const Icon = variantConfig.icon;

    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={title}
            size="md"
            showClose={true}
            closeOnOverlayClick={!isLoading}
            draggable={true}
            resizable={true}
            minimizable={false}
            maximizable={false}
            footer={
                <>
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
                        icon={isLoading ? <Loader2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] animate-spin" /> : undefined}
                    >
                        {confirmLabel}
                    </ElisaButton>
                </>
            }
        >
            <div className="flex gap-[var(--gap-md)]">
                <div className={`flex shrink-0 items-center justify-center rounded-full ${variantConfig.iconBg}`} style={{ width: 'clamp(2.5rem, 2rem + 1vw, 3.5rem)', height: 'clamp(2.5rem, 2rem + 1vw, 3.5rem)' }}>
                    <Icon className={variantConfig.iconColor} style={{ width: 'clamp(1.25rem, 1rem + 0.5vw, 1.5rem)', height: 'clamp(1.25rem, 1rem + 0.5vw, 1.5rem)' }} />
                </div>
                <div className="flex-1">
                    <p className="text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>{message}</p>
                    {details && (
                        <p className="mt-3 text-[var(--color-texte-secondaire)] bg-gray-50 dark:bg-gray-800/60 rounded-lg" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)', padding: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>{details}</p>
                    )}
                </div>
            </div>
        </CustomModal>
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
