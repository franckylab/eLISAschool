import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Loader2 } from 'lucide-react';

import type { TypePrime } from '../types/paie.types';

type PrimeFormData = Omit<TypePrime, 'id' | 'actif' | 'etablissementId' | 'createdAt' | 'updatedAt'>;

interface PrimeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: PrimeFormData) => Promise<void>;
    isLoading?: boolean;
    prime?: TypePrime | null;
}

const FORM_INIT: PrimeFormData = {
    code: '',
    nom: '',
    typeCalcul: 'FIXE',
    valeur: 0,
    description: '',
};

export function PrimeModal({ open, onOpenChange, onSave, isLoading, prime }: PrimeModalProps) {
    const { t } = useTranslation('paie');
    const [form, setForm] = useState(FORM_INIT);

    useEffect(() => {
        if (open) {
            if (prime) {
                setForm({
                    code: prime.code || '',
                    nom: prime.nom || '',
                    typeCalcul: prime.typeCalcul || 'FIXE',
                    valeur: prime.valeur || 0,
                    description: prime.description || '',
                });
            } else {
                setForm(FORM_INIT);
            }
        }
    }, [open, prime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={prime ? t('modifierTypePrime') : t('nouveauTypePrime')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('informationsPrime')}</h4>
                <SectionSeparator />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('code')}</label>
                        <input
                            type="text"
                            value={form.code}
                            onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg bg-input border-border"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('nom')}</label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={(e) => setForm(p => ({ ...p, nom: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg bg-input border-border"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('typeCalcul')}</label>
                    <select
                        value={form.typeCalcul}
                        onChange={(e) => setForm(p => ({ ...p, typeCalcul: e.target.value as PrimeFormData['typeCalcul'] }))}
                        className="w-full px-3 py-2 border rounded-lg bg-input border-border"
                    >
                        <option value="FIXE">{t('fixe')}</option>
                        <option value="POURCENTAGE">{t('pourcentage')}</option>
                        <option value="VARIABLE">{t('variable')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('valeur')}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.valeur}
                        onChange={(e) => setForm(p => ({ ...p, valeur: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded-lg bg-input border-border"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" isLoading={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {prime ? t('common:boutons.enregistrer') : t('common:boutons.creer')}
                    </ElisaButton>
                </div>
            </form>
        </CustomModal>
    );
}
