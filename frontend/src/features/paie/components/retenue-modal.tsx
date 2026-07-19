import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Loader2 } from 'lucide-react';

interface RetenueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => Promise<void>;
    isLoading?: boolean;
    retenue?: any | null;
}

const FORM_INIT = {
    code: '',
    nom: '',
    frequence: 'PONCTUELLE' as string,
    montantMax: undefined as number | undefined,
    description: '',
};

export function RetenueModal({ open, onOpenChange, onSave, isLoading, retenue }: RetenueModalProps) {
    const { t } = useTranslation('paie');
    const [form, setForm] = useState(FORM_INIT);

    useEffect(() => {
        if (open) {
            if (retenue) {
                setForm({
                    code: retenue.code || '',
                    nom: retenue.nom || '',
                    frequence: retenue.frequence || 'PONCTUELLE',
                    montantMax: retenue.montantMax,
                    description: retenue.description || '',
                });
            } else {
                setForm(FORM_INIT);
            }
        }
    }, [open, retenue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={retenue ? t('modifierTypeRetenue') : t('nouveauTypeRetenue')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsRetenue')}</h4>
                <SectionSeparator />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('code')}</label>
                        <input
                            type="text"
                            value={form.code}
                            onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nom')}</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => setForm(p => ({ ...p, nom: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('frequence')}</label>
                    <select
                        value={form.frequence}
                        onChange={(e) => setForm(p => ({ ...p, frequence: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    >
                        <option value="PONCTUELLE">{t('ponctuelle')}</option>
                        <option value="RECURRENTE">{t('recurrente')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('montantMax')}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.montantMax || ''}
                        onChange={(e) => setForm(p => ({ ...p, montantMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('commun:annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {retenue ? t('commun:enregistrer') : t('commun:creer')}
                    </ElisaButton>
                </div>
            </form>
        </CustomModal>
    );
}
