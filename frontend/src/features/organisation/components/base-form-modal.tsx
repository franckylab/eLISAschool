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

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', iconBg: 'from-blue-500 to-blue-600' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'from-indigo-500 to-indigo-600' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', iconBg: 'from-purple-500 to-purple-600' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', iconBg: 'from-green-500 to-green-600' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', iconBg: 'from-orange-500 to-orange-600' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', iconBg: 'from-amber-500 to-amber-600' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', iconBg: 'from-red-500 to-red-600' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', iconBg: 'from-gray-500 to-gray-600' },
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
                    <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${c.text}`} />
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</span>
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
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
                        <button onClick={() => {}} className="ml-auto text-red-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                {loading && (
                    <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                )}
                {children}
            </div>
        </CustomModal>
    );
}
