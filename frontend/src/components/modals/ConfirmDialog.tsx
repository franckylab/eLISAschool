/**
 * ==================================
 * eLISAschool - ConfirmDialog
 * ==================================
 * Dialogue de confirmation réutilisable
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { CustomModal } from './CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const iconMap = {
    danger: Trash2,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    danger: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]',
};

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    variant = 'warning',
    isLoading = false,
}: ConfirmDialogProps) {
    const { t } = useTranslation('common');
    const Icon = iconMap[variant];

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            size="sm"
            showClose={false}
            closeOnOverlayClick={!isLoading}
            footer={
                <>
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelText || t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        size="sm"
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText || t('boutons.confirmer')}
                    </ElisaButton>
                </>
            }
        >
            <div className="flex gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorMap[variant]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-texte)]">{title}</h3>
                    {description && (
                        <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
