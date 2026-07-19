import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Loader2 } from 'lucide-react';

interface CotisationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => Promise<void>;
    isLoading?: boolean;
    cotisation?: any | null;
}

const FORM_INIT = {
    code: '',
    nom: '',
    type: 'SALARIALE' as string,
    tauxPatronal: 0,
    tauxSalarial: 0,
    plafond: undefined as number | undefined,
    description: '',
};

export function CotisationModal({ open, onOpenChange, onSave, isLoading, cotisation }: CotisationModalProps) {
    const { t } = useTranslation('paie');
    const [form, setForm] = useState(FORM_INIT);

    useEffect(() => {
        if (open) {
            if (cotisation) {
                setForm({
                    code: cotisation.code || '',
                    nom: cotisation.nom || '',
                    type: cotisation.type || 'SALARIALE',
                    tauxPatronal: cotisation.tauxPatronal || 0,
                    tauxSalarial: cotisation.tauxSalarial || 0,
                    plafond: cotisation.plafond,
                    description: cotisation.description || '',
                });
            } else {
                setForm(FORM_INIT);
            }
        }
    }, [open, cotisation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={cotisation ? t('modifierCotisation') : t('nouvelleCotisation')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsCotisation')}</h4>
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
                    <label className="block text-sm font-medium mb-1">{t('type')}</label>
                    <select
                        value={form.type}
                        onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    >
                        <option value="PATRONALE">Patronale</option>
                        <option value="SALARIALE">Salariale</option>
                        <option value="MIXTE">Mixte</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('tauxPatronal')} (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.tauxPatronal}
                            onChange={(e) => setForm(p => ({ ...p, tauxPatronal: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('tauxSalarial')} (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.tauxSalarial}
                            onChange={(e) => setForm(p => ({ ...p, tauxSalarial: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('plafond')}</label>
                    <input
                        type="number"
                        value={form.plafond || ''}
                        onChange={(e) => setForm(p => ({ ...p, plafond: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('commun:annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {cotisation ? t('commun:enregistrer') : t('commun:creer')}
                    </ElisaButton>
                </div>
            </form>
        </CustomModal>
    );
}
