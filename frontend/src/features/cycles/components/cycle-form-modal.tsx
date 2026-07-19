import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Hash, Award, Tag } from 'lucide-react';
import type { Cycle } from '../types/cycle.types';

interface CycleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cycle?: Cycle | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

const FORM_INIT = {
    nom: '',
    code: '',
    description: '',
    dureeAnnees: 0,
    diplomeSanctionnant: '',
    ordre: 1,
    actif: true,
};

export function CycleFormModal({ open, onOpenChange, cycle, onSave, isLoading }: CycleFormModalProps) {
    const { t } = useTranslation('cycles');
    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const isEditMode = !!cycle;

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    useEffect(() => {
        if (cycle) {
            setFormData({
                nom: cycle.nom,
                code: cycle.code,
                description: cycle.description || '',
                dureeAnnees: cycle.dureeAnnees || 0,
                diplomeSanctionnant: cycle.diplomeSanctionnant || '',
                ordre: cycle.ordre,
                actif: cycle.actif,
            });
        } else {
            setFormData(FORM_INIT);
        }
        setErreurs({});
    }, [cycle, open]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const valider = (): boolean => {
        const e: Record<string, string> = {};
        if (!formData.nom.trim()) e.nom = t('form.erreurNomRequis');
        if (!formData.code.trim()) e.code = t('form.erreurCodeRequis');
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!valider()) return;
        onSave({
            nom: formData.nom.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || undefined,
            dureeAnnees: formData.dureeAnnees || 0,
            diplomeSanctionnant: formData.diplomeSanctionnant.trim() || undefined,
            ordre: formData.ordre,
            actif: formData.actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v && hasUnsavedChanges) return;
                onOpenChange(v);
            }}
            title={isEditMode ? t('form.titreEdition') : t('form.titreCreation')}
            description={isEditMode ? t('form.descriptionEdition') : t('form.descriptionCreation')}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!formData.nom.trim() || !formData.code.trim() || isLoading}
                    >
                        {isLoading ? t('enregistrement') : (isEditMode ? t('enregistrer') : t('creer'))}
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6">
                {/* Section Identité */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Tag className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionIdentite')}
                    </h3>
                    <SectionSeparator />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            {t('form.champCode')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                            className={`w-full px-4 py-2 rounded-lg border ${erreurs.code ? 'border-red-500' : 'border-[var(--color-bordure)]'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]`}
                            placeholder={t('form.placeholderCode')}
                            autoFocus
                            maxLength={50}
                        />
                        {erreurs.code && <p className="text-red-600 text-xs mt-1">{erreurs.code}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            {t('form.champNom')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => handleChange('nom', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${erreurs.nom ? 'border-red-500' : 'border-[var(--color-bordure)]'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]`}
                            placeholder={t('form.placeholderNom')}
                            maxLength={100}
                        />
                        {erreurs.nom && <p className="text-red-600 text-xs mt-1">{erreurs.nom}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            {t('form.champDescription')}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)] resize-none"
                            placeholder={t('form.placeholderDescription')}
                            rows={2}
                            maxLength={500}
                        />
                    </div>
                </div>

                {/* Section Diplôme et durée */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Award className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionDiplome')}
                    </h3>
                    <SectionSeparator />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('form.champDuree')}
                            </label>
                            <input
                                type="number"
                                value={formData.dureeAnnees}
                                onChange={(e) => handleChange('dureeAnnees', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                                placeholder="6"
                                min={0}
                                max={10}
                            />
                            <p className="text-xs text-[var(--color-texte-secondaire)] mt-1">
                                Ex: 3 (Maternelle), 6 (Primaire), 4 (Secondaire 1), 3 (Secondaire 2)
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('form.champDiplome')}
                            </label>
                            <input
                                type="text"
                                value={formData.diplomeSanctionnant}
                                onChange={(e) => handleChange('diplomeSanctionnant', e.target.value.toUpperCase())}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                                placeholder="Ex: CEP, BEPC, BACCALAUREAT"
                                maxLength={50}
                            />
                        </div>
                    </div>
                </div>

                {/* Section Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Hash className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionConfiguration')}
                    </h3>
                    <SectionSeparator />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('form.champOrdre')}
                            </label>
                            <input
                                type="number"
                                value={formData.ordre}
                                onChange={(e) => handleChange('ordre', parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                                min={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">{t('statut')}</label>
                            <select
                                value={formData.actif ? 'actif' : 'inactif'}
                                onChange={(e) => handleChange('actif', e.target.value === 'actif')}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                            >
                                <option value="actif">{t('form.champActif')}</option>
                                <option value="inactif">{t('inactif')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
