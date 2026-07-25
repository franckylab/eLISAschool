import { type ReactNode, type ComponentType, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';

interface BaseFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    icon: ComponentType<{ className?: string }>;
    color?: 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'amber' | 'red' | 'gray';
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    onSubmit: () => void;
    apiError?: string | null;
    children: ReactNode;
}

const colorMap: Record<string, { wrapper: string; iconColor: string }> = {
    blue: { wrapper: 'bg-primary/10', iconColor: 'text-primary' },
    indigo: { wrapper: 'bg-[var(--color-info)]/10', iconColor: 'text-[var(--color-info)]' },
    purple: { wrapper: 'bg-accent/10', iconColor: 'text-accent' },
    green: { wrapper: 'bg-[var(--color-success)]/10', iconColor: 'text-[var(--color-success)]' },
    orange: { wrapper: 'bg-[var(--color-warning)]/10', iconColor: 'text-[var(--color-warning)]' },
    amber: { wrapper: 'bg-[var(--color-warning)]/15', iconColor: 'text-[var(--color-warning)]' },
    red: { wrapper: 'bg-destructive/10', iconColor: 'text-destructive' },
    gray: { wrapper: 'bg-muted', iconColor: 'text-muted-foreground' },
};

export function BaseFormModal({
    open,
    onOpenChange,
    title,
    icon: Icon,
    color = 'blue',
    size = 'lg',
    submitLabel,
    cancelLabel,
    loading = false,
    disabled = false,
    onSubmit,
    apiError,
    children,
}: BaseFormModalProps) {
    const { t } = useTranslation('organisation');
    const c = colorMap[color] ?? colorMap.blue;
    const [errorDismissed, setErrorDismissed] = useState(false);

    useEffect(() => {
        setErrorDismissed(false);
    }, [apiError]);

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${c.wrapper} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${c.iconColor}`} />
                    </div>
                    <span className="text-lg font-semibold text-foreground">{title}</span>
                </div>
            }
            size={size}
            draggable
            resizable
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <ElisaButton variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                        {cancelLabel || t('annuler')}
                    </ElisaButton>
                    <ElisaButton variant="primary" onClick={onSubmit} loading={loading} disabled={disabled}>
                        {submitLabel || t('enregistrer')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="space-y-4">
                {apiError && !errorDismissed && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">{apiError}</p>
                        <button onClick={() => setErrorDismissed(true)} aria-label={t('fermer')} className="ml-auto text-destructive/60 hover:text-destructive" type="button">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                {loading && (
                    <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}
                {children}
            </div>
        </CustomModal>
    );
}
