import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Building2, Hash, FileText, Check, X } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { GroupeEtablissement, CreerGroupeEtablissementDto } from '../types/groupe-etablissement.types';

interface EtablissementOption {
    id: string;
    nom: string;
    code: string;
}

interface GroupeEtablissementFormModalProps {
    open: boolean;
    groupe: GroupeEtablissement | null;
    onOpenChange: (open: boolean) => void;
    onSubmit: (dto: CreerGroupeEtablissementDto) => Promise<void>;
    etablissementsDisponibles?: EtablissementOption[];
}

const FORM_INIT = {
    nom: '',
    description: '',
    code: '',
    selectedEtabIds: [] as string[],
};

export function GroupeEtablissementFormModal({
    open,
    groupe,
    onOpenChange,
    onSubmit,
    etablissementsDisponibles = [],
}: GroupeEtablissementFormModalProps) {
    const { t } = useTranslation('groupes-etablissements');
    const isEditMode = !!groupe;

    const [formData, setFormData] = useState(FORM_INIT);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (groupe) {
            setFormData({
                nom: groupe.nom || '',
                description: groupe.description || '',
                code: groupe.code || '',
                selectedEtabIds: [],
            });
        } else {
            setFormData(FORM_INIT);
        }
        setErrors({});
    }, [groupe]);

    useEffect(() => {
        if (!isEditMode && formData.nom && !formData.code) {
            const generatedCode = formData.nom
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            setFormData((prev) => ({ ...prev, code: generatedCode }));
        }
    }, [formData.nom, formData.code, isEditMode]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nom.trim()) newErrors.nom = t('form.erreurNomRequis');
        if (!formData.code.trim()) newErrors.code = t('form.erreurCodeRequis');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        const dto: CreerGroupeEtablissementDto = {
            nom: formData.nom,
            description: formData.description || undefined,
            code: formData.code || undefined,
            etablissementIds: formData.selectedEtabIds.length > 0 ? formData.selectedEtabIds : undefined,
        };

        try {
            await onSubmit(dto);
            onOpenChange(false);
        } catch {
            // Handled by the hooks
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditMode ? t('form.titreModifier') : t('form.titreCreer')}
            description={t('form.description')}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        {t('form.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        icon={<Save className="h-4 w-4" />}
                    >
                        {isEditMode ? t('form.enregistrer') : t('form.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {/* Section Identité */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Hash className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('champs.nom')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div data-field="nom">
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('form.nomLabel')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent outline-none ${
                                    errors.nom ? 'border-red-500' : 'border-[var(--color-bordure)]'
                                }`}
                                placeholder={t('form.nomPlaceholder')}
                                autoFocus
                            />
                            {errors.nom && (
                                <p role="alert" className="text-red-500 text-xs mt-1">{errors.nom}</p>
                            )}
                        </div>
                        <div data-field="code">
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('form.codeLabel')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent outline-none font-mono ${
                                    errors.code ? 'border-red-500' : 'border-[var(--color-bordure)]'
                                }`}
                                placeholder={t('form.codePlaceholder')}
                            />
                            {errors.code && (
                                <p role="alert" className="text-red-500 text-xs mt-1">{errors.code}</p>
                            )}
                            {!isEditMode && (
                                <p className="text-xs text-[var(--color-texte-secondaire)] mt-1">{t('form.codeHelper')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Description */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('champs.description')}
                    </h3>
                    <SectionSeparator />
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-bordure)] focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent outline-none"
                        placeholder={t('form.descriptionPlaceholder')}
                    />
                </div>

                {/* Section Établissements (création uniquement) */}
                {!isEditMode && etablissementsDisponibles.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.etablissementsLabel')}
                        </h3>
                        <SectionSeparator />
                        <div className="border border-[var(--color-bordure)] rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                            {etablissementsDisponibles.map((etab) => {
                                const isSelected = formData.selectedEtabIds.includes(etab.id);
                                return (
                                    <button
                                        key={etab.id}
                                        type="button"
                                        onClick={() => {
                                            handleChange(
                                                'selectedEtabIds',
                                                isSelected
                                                    ? formData.selectedEtabIds.filter((id: string) => id !== etab.id)
                                                    : [...formData.selectedEtabIds, etab.id]
                                            );
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                                : 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-300)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-[var(--color-texte)]">{etab.nom}</p>
                                                <code className="text-xs text-[var(--color-texte-muted)] font-mono">{etab.code}</code>
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <Check className="h-4 w-4 text-[var(--color-dominante)]" />
                                        ) : (
                                            <X className="h-4 w-4 text-[var(--color-texte-muted)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {formData.selectedEtabIds.length > 0 && (
                            <p className="text-xs text-[var(--color-texte-secondaire)]">
                                {t('form.nbSelectionnes', { count: formData.selectedEtabIds.length })}
                            </p>
                        )}
                    </div>
                )}
            </form>
        </CustomModal>
    );
}
