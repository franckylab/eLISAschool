import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import type { LucideIcon } from 'lucide-react';

interface FieldConfig {
    key: string;
    labelKey: string;
    type?: 'text' | 'number';
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    span?: string;
}

interface Props<T> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: T | null;
    onSave: (values: Record<string, any>) => Promise<void>;
    fields: FieldConfig[];
    titleKey: string;
    icon: LucideIcon;
}

export function NomenclatureFormModal<T extends Record<string, any>>({
    open, onOpenChange, initialData, onSave, fields, titleKey,
}: Props<T>) {
    const { t } = useTranslation('organisation');
    const [error, setError] = useState('');

    const schema = z.object(
        Object.fromEntries(
            fields.map(f => [
                f.key,
                f.type === 'number'
                    ? z.coerce.number({ invalid_type_error: `${t(f.labelKey)} invalide` })
                    : f.required
                        ? z.string().min(f.minLength || 2, `${t(f.labelKey)} : ${t('minimumCaracteres')}`)
                        : z.string().optional(),
            ])
        )
    );

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: initialData ? Object.fromEntries(fields.map(f => [f.key, initialData[f.key] ?? ''])) : {},
    });

    const doSave = async (values: Record<string, any>) => {
        setError('');
        try {
            const clean = Object.fromEntries(
                Object.entries(values).map(([k, v]) => [k, v === '' ? undefined : v])
            );
            await onSave(clean);
            onOpenChange(false);
        } catch (e: any) {
            setError(e?.message || 'Erreur');
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t(titleKey)}
        >
            <form onSubmit={handleSubmit(doSave)} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                    {fields.map(f => (
                        <div key={f.key} className={f.span || 'col-span-2'}>
                            <label className="block text-sm font-medium mb-1 text-foreground">
                                {t(f.labelKey)}{f.required && ' *'}
                            </label>
                            <input
                                type={f.type || 'text'}
                                {...register(f.key)}
                                placeholder={f.placeholder || t(f.labelKey)}
                                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
                            />
                            {errors[f.key] && (
                                <p className="text-xs text-red-500 mt-1">{errors[f.key]?.message as string}</p>
                            )}
                        </div>
                    ))}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => onOpenChange(false)}
                        className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent transition-colors">
                        {t('annuler')}
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-1">
                        <Save className="h-4 w-4" /> {t('enregistrer')}
                    </button>
                </div>
            </form>
        </CustomModal>
    );
}
