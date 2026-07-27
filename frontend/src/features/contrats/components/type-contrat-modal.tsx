import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCreerTypeContrat, useModifierTypeContrat, useTypesContrat } from '../hooks/use-contrats';
import type { ModeRemuneration } from '../types/contrat.types';

interface TypeContratModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    typeContratId?: string;
}

const FORM_INIT = {
    code: '',
    nom: '',
    description: '',
    categorie: '',
    modeRemuneration: 'MENSUEL' as ModeRemuneration,
    ordre: 0,
    renouvellementAutoDefaut: false,
    dureeMaxMois: undefined as number | undefined,
};

export function TypeContratModal({ open, onOpenChange, typeContratId }: TypeContratModalProps) {
    const { t } = useTranslation('contrats');
    const [form, setForm] = useState({ ...FORM_INIT });
    const [, setHasUnsavedChanges] = useState(false);

    const { data: types } = useTypesContrat();
    const creer = useCreerTypeContrat();
    const modifier = useModifierTypeContrat();

    const typeExistant = typeContratId ? types?.find((tc) => tc.id === typeContratId) : undefined;

    useEffect(() => {
        if (typeExistant) {
            setForm({
                code: typeExistant.code,
                nom: typeExistant.nom,
                description: typeExistant.description || '',
                categorie: typeExistant.categorie,
                modeRemuneration: typeExistant.modeRemuneration,
                ordre: typeExistant.ordre,
                renouvellementAutoDefaut: typeExistant.renouvellementAutoDefaut,
                dureeMaxMois: typeExistant.dureeMaxMois,
            });
        } else {
            setForm({ ...FORM_INIT });
        }
        setHasUnsavedChanges(false);
    }, [typeExistant, open]);

    useEffect(() => {
        if (!open) {
            setForm({ ...FORM_INIT });
            setHasUnsavedChanges(false);
        }
    }, [open]);

    const handleChange = (field: string, value: string | number | boolean | undefined) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = async () => {
        if (typeExistant) {
            await modifier.mutateAsync({ id: typeExistant.id, ...form });
        } else {
            await creer.mutateAsync(form);
        }
        onOpenChange(false);
    };

    const isPending = creer.isPending || modifier.isPending;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={typeContratId ? t('typeContrat.modifier') : t('typeContrat.creer')}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton variant="primary" size="sm" onClick={handleSubmit} disabled={isPending || !form.code || !form.nom}>
                        {isPending ? t('traitementEnCours') : (typeContratId ? t('enregistrer') : t('creer'))}
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.code')}</label>
                        <input
                            value={form.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.nom')}</label>
                        <input
                            value={form.nom}
                            onChange={(e) => handleChange('nom', e.target.value)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('typeContrat.description')}</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.categorie')}</label>
                        <input
                            value={form.categorie}
                            onChange={(e) => handleChange('categorie', e.target.value)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.modeRemuneration')}</label>
                        <select
                            value={form.modeRemuneration}
                            onChange={(e) => handleChange('modeRemuneration', e.target.value)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        >
                            <option value="MENSUEL">MENSUEL</option>
                            <option value="HORAIRE">HORAIRE</option>
                            <option value="MIXTE">MIXTE</option>
                            <option value="HEBDOMADAIRE">HEBDOMADAIRE</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.ordre')}</label>
                        <input
                            type="number"
                            value={form.ordre}
                            onChange={(e) => handleChange('ordre', parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('typeContrat.dureeMaxMois')}</label>
                        <input
                            type="number"
                            value={form.dureeMaxMois ?? ''}
                            onChange={(e) => handleChange('dureeMaxMois', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="renouvellementAutoDefaut"
                        checked={form.renouvellementAutoDefaut}
                        onChange={(e) => handleChange('renouvellementAutoDefaut', e.target.checked)}
                        className="rounded border-border"
                    />
                    <label htmlFor="renouvellementAutoDefaut" className="text-sm font-medium">
                        {t('typeContrat.renouvellementAutoDefaut')}
                    </label>
                </div>
                <input
                    type="hidden"
                    value={form.renouvellementAutoDefaut ? 'true' : 'false'}
                />
            </div>
        </CustomModal>
    );
}
