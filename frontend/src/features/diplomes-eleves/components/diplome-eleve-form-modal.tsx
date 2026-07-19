import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Medal } from 'lucide-react';
import type { DiplomeEleve } from '../types/diplome-eleve.types';

const FORM_INIT = {
    eleveId: '',
    examenNationalId: '',
    numeroDiplome: '',
    dateObtention: '',
    noteObtenue: undefined as number | undefined,
    mention: '',
    dateDelivrance: '',
    observations: '',
    actif: true,
};

interface DiplomeEleveFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    diplome?: DiplomeEleve | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function DiplomeEleveFormModal({ open, onOpenChange, diplome, onSave, isLoading }: DiplomeEleveFormModalProps) {
    const { t } = useTranslation('diplomes-eleves');
    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const isEdit = !!diplome;

    useEffect(() => {
        if (!open) {
            setFormData(FORM_INIT);
            setErreurs({});
        }
    }, [open]);

    useEffect(() => {
        if (diplome && open) {
            setFormData({
                eleveId: diplome.eleveId,
                examenNationalId: diplome.examenNationalId,
                numeroDiplome: diplome.numeroDiplome || '',
                dateObtention: diplome.dateObtention ? new Date(diplome.dateObtention).toISOString().split('T')[0] : '',
                noteObtenue: diplome.noteObtenue,
                mention: diplome.mention || '',
                dateDelivrance: diplome.dateObtention ? new Date(diplome.dateObtention).toISOString().split('T')[0] : '',
                observations: diplome.observations || '',
                actif: true,
            });
        }
    }, [diplome, open]);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(formData) !== JSON.stringify(FORM_INIT), [formData]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErreurs(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!formData.eleveId.trim()) errs.eleveId = t('form.obligatoire');
        if (!formData.examenNationalId.trim()) errs.examenNationalId = t('form.obligatoire');
        if (Object.keys(errs).length > 0) { setErreurs(errs); return; }

        onSave({
            eleveId: formData.eleveId,
            examenNationalId: formData.examenNationalId,
            numeroDiplome: formData.numeroDiplome.trim() || undefined,
            dateObtention: formData.dateObtention || undefined,
            noteObtenue: formData.noteObtenue || undefined,
            mention: formData.mention.trim() || undefined,
            dateDelivrance: formData.dateDelivrance || undefined,
            observations: formData.observations.trim() || undefined,
            actif: formData.actif,
        });
    };

    const mentions = [
        { value: 'Passable', label: t('form.mentionPassable') },
        { value: 'Assez Bien', label: t('form.mentionAssezBien') },
        { value: 'Bien', label: t('form.mentionBien') },
        { value: 'Très Bien', label: t('form.mentionTresBien') },
        { value: 'Excellent', label: t('form.mentionExcellent') },
        { value: 'Très Honorable', label: t('form.mentionTresHonorable') },
    ];

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v && hasUnsavedChanges) return;
                onOpenChange(v);
            }}
            title={isEdit ? t('form.titreModifier') : t('form.titreCreer')}
            description={isEdit ? t('form.descriptionModifier') : t('form.descriptionCreer')}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('form.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        icon={<Medal className="h-4 w-4" />}
                    >
                        {isLoading ? t('form.enregistrement') : isEdit ? t('form.modifier') : t('form.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                    <Medal className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                    {t('detail.informations')}
                </h3>
                <SectionSeparator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {t('form.eleve')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.eleveId}
                            onChange={(e) => handleChange('eleveId', e.target.value)}
                            placeholder={t('form.elevePlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        />
                        {erreurs.eleveId && <p className="text-xs text-red-500 mt-1">{erreurs.eleveId}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {t('form.examen')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.examenNationalId}
                            onChange={(e) => handleChange('examenNationalId', e.target.value)}
                            placeholder={t('form.examenPlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        />
                        {erreurs.examenNationalId && <p className="text-xs text-red-500 mt-1">{erreurs.examenNationalId}</p>}
                    </div>
                </div>

                <SectionSeparator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.numeroDiplome')}</label>
                        <input
                            type="text"
                            value={formData.numeroDiplome}
                            onChange={(e) => handleChange('numeroDiplome', e.target.value)}
                            placeholder={t('form.numeroDiplomePlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.dateObtention')}</label>
                        <input
                            type="date"
                            value={formData.dateObtention}
                            onChange={(e) => handleChange('dateObtention', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.noteObtenue')}</label>
                        <input
                            type="number"
                            value={formData.noteObtenue || ''}
                            onChange={(e) => handleChange('noteObtenue', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder={t('form.noteObtenuePlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min="0"
                            max="20"
                            step="0.25"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.mention')}</label>
                        <select
                            value={formData.mention}
                            onChange={(e) => handleChange('mention', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">{t('form.aucuneMention')}</option>
                            {mentions.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <SectionSeparator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.dateDelivrance')}</label>
                        <input
                            type="date"
                            value={formData.dateDelivrance}
                            onChange={(e) => handleChange('dateDelivrance', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.resultat')}</label>
                        <select
                            value={formData.actif ? 'ADMIS' : 'REFUSE'}
                            onChange={(e) => handleChange('resultat', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="ADMIS">{t('resultat.ADMIS')}</option>
                            <option value="REFUSE">{t('resultat.REFUSE')}</option>
                            <option value="AJOURNE">{t('resultat.AJOURNE')}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">{t('form.observations')}</label>
                    <textarea
                        value={formData.observations}
                        onChange={(e) => handleChange('observations', e.target.value)}
                        placeholder={t('form.observationsPlaceholder')}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={3}
                        maxLength={500}
                    />
                </div>

                <SectionSeparator />
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="actif"
                        checked={formData.actif}
                        onChange={(e) => handleChange('actif', e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                    />
                    <label htmlFor="actif" className="text-sm font-medium text-foreground">
                        {t('form.actif')}
                    </label>
                </div>
            </form>
        </CustomModal>
    );
}
