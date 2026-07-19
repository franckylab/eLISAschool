import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Tag } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import type { Niveau } from '../types/niveau.types';

interface NiveauFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    niveau?: Niveau | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

const FORM_INIT = {
    nom: '',
    code: '',
    cycleId: '',
    ordre: 1,
    actif: true,
};

export function NiveauFormModal({ open, onOpenChange, niveau, onSave, isLoading }: NiveauFormModalProps) {
    const { t } = useTranslation('niveaux');
    const { data: cyclesData } = useCycles({ page: 1, limit: 50, actif: true });
    const cycles = cyclesData?.items || [];

    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const isEditMode = !!niveau;
    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );
    const cycleOptions = useMemo(() => cycles.map((c: any) => ({ value: c.id, label: `${c.nom} (${c.code})` })), [cycles]);

    useEffect(() => {
        if (niveau) {
            setFormData({
                nom: niveau.nom,
                code: niveau.code || '',
                cycleId: niveau.cycleId,
                ordre: niveau.ordre,
                actif: niveau.actif,
            });
        } else {
            setFormData(FORM_INIT);
        }
        setErreurs({});
    }, [niveau, open]);

    useEffect(() => {
        if (!isEditMode && formData.nom && !formData.code) {
            const generatedCode = formData.nom
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            setFormData((prev) => ({ ...prev, code: generatedCode }));
        }
    }, [formData.nom, formData.code, isEditMode]);

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
        if (!formData.cycleId) e.cycleId = t('form.erreurCycleRequis');
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!valider()) return;
        onSave({
            nom: formData.nom.trim(),
            code: formData.code.trim(),
            cycleId: formData.cycleId,
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
                        disabled={isLoading}
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
                            {t('form.champNom')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => handleChange('nom', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${erreurs.nom ? 'border-red-500' : 'border-[var(--color-bordure)]'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]`}
                            placeholder={t('form.placeholderNom')}
                            autoFocus
                        />
                        {erreurs.nom && <p className="text-red-600 text-xs mt-1">{erreurs.nom}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            {t('form.champCode')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            className={`w-full px-4 py-2 rounded-lg border ${erreurs.code ? 'border-red-500' : 'border-[var(--color-bordure)]'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]`}
                            placeholder={t('form.placeholderCode')}
                        />
                        {erreurs.code && <p className="text-red-600 text-xs mt-1">{erreurs.code}</p>}
                    </div>
                </div>

                {/* Section Configuration */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Hash className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionConfiguration')}
                    </h3>
                    <SectionSeparator />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            {t('form.champCycle')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.cycleId}
                            onChange={(e) => handleChange('cycleId', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${erreurs.cycleId ? 'border-red-500' : 'border-[var(--color-bordure)]'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]`}
                        >
                            <option value="">{t('form.placeholderCycle')}</option>
                            {cycleOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {erreurs.cycleId && <p className="text-red-600 text-xs mt-1">{erreurs.cycleId}</p>}
                    </div>

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
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                                {t('statut')}
                            </label>
                            <select
                                value={formData.actif ? 'actif' : 'inactif'}
                                onChange={(e) => handleChange('actif', e.target.value === 'actif')}
                                className="w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-texte)]"
                            >
                                <option value="actif">{t('form.champActif')}</option>
                                <option value="inactif">{t('form.champInactif')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
