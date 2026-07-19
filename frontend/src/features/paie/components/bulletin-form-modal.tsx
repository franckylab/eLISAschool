import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Loader2 } from 'lucide-react';

interface BulletinFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => Promise<void>;
    isLoading?: boolean;
    bulletin?: any | null;
}

const FORM_INIT = {
    membrePersonnelId: '',
    contratId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    salaireBase: 0,
    primes: 0,
    deductions: 0,
};

export function BulletinFormModal({ open, onOpenChange, onSave, isLoading, bulletin }: BulletinFormModalProps) {
    const { t } = useTranslation('paie');
    const [form, setForm] = useState(FORM_INIT);
    const [, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (open) {
            if (bulletin) {
                setForm({
                    membrePersonnelId: bulletin.membrePersonnelId || '',
                    contratId: bulletin.contratId || '',
                    mois: bulletin.mois || new Date().getMonth() + 1,
                    annee: bulletin.annee || new Date().getFullYear(),
                    salaireBase: bulletin.salaireBase || 0,
                    primes: bulletin.primes || 0,
                    deductions: bulletin.deductions || 0,
                });
            } else {
                setForm(FORM_INIT);
            }
            setHasUnsavedChanges(false);
        }
    }, [open, bulletin]);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={bulletin ? t('modifierBulletin') : t('nouveauBulletin')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsBulletin')}</h4>
                <SectionSeparator />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('mois')}</label>
                        <input
                            type="number"
                            min={1}
                            max={12}
                            value={form.mois}
                            onChange={(e) => handleChange('mois', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('annee')}</label>
                        <input
                            type="number"
                            value={form.annee}
                            onChange={(e) => handleChange('annee', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('salaireBase')}</label>
                    <input
                        type="number"
                        value={form.salaireBase}
                        onChange={(e) => handleChange('salaireBase', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('primes')}</label>
                        <input
                            type="number"
                            value={form.primes}
                            onChange={(e) => handleChange('primes', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('deductions')}</label>
                        <input
                            type="number"
                            value={form.deductions}
                            onChange={(e) => handleChange('deductions', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('commun:annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {bulletin ? t('commun:enregistrer') : t('commun:creer')}
                    </ElisaButton>
                </div>
            </form>
        </CustomModal>
    );
}
