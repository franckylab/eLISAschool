import { type ReactNode, type ComponentType } from 'react';
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
    indigo: { wrapper: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    purple: { wrapper: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
    green: { wrapper: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    orange: { wrapper: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    amber: { wrapper: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
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
                {apiError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive">{apiError}</p>
                        <button onClick={() => {}} className="ml-auto text-destructive/60 hover:text-destructive" type="button">
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
