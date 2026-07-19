import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { FileBadge2 } from 'lucide-react';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import type { ExamenNational } from '../types/examen-national.types';

const FORM_INIT = {
    code: '',
    nom: '',
    type: 'NATIONAL' as 'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL',
    niveauId: '',
    diplomeDelivre: '',
    sousSysteme: 'FRANCOPHONE' as 'FRANCOPHONE' | 'ANGLOPHONE',
    estObligatoire: true,
    coefficient: undefined as number | undefined,
    description: '',
    actif: true,
};

interface ExamenNationalFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examen?: ExamenNational | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function ExamenNationalFormModal({ open, onOpenChange, examen, onSave, isLoading }: ExamenNationalFormModalProps) {
    const { t } = useTranslation('examens-nationaux');
    const { data: niveaux } = useTousNiveaux();
    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const isEdit = !!examen;

    useEffect(() => {
        if (!open) {
            setFormData(FORM_INIT);
            setErreurs({});
        }
    }, [open]);

    useEffect(() => {
        if (examen && open) {
            setFormData({
                code: examen.code,
                nom: examen.nom,
                type: examen.type as any,
                niveauId: examen.niveauId,
                diplomeDelivre: examen.diplomeDelivre || '',
                sousSysteme: examen.sousSysteme as any,
                estObligatoire: examen.estObligatoire,
                coefficient: examen.coefficient,
                description: examen.description || '',
                actif: examen.actif,
            });
        }
    }, [examen, open]);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(formData) !== JSON.stringify(FORM_INIT), [formData]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErreurs(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!formData.nom.trim()) errs.nom = t('form.obligatoire');
        if (!formData.code.trim()) errs.code = t('form.obligatoire');
        if (!formData.niveauId) errs.niveauId = t('form.obligatoire');
        if (Object.keys(errs).length > 0) { setErreurs(errs); return; }

        onSave({
            ...formData,
            code: formData.code.trim().toUpperCase(),
            nom: formData.nom.trim(),
            diplomeDelivre: formData.diplomeDelivre.trim() || undefined,
            coefficient: formData.coefficient || undefined,
            description: formData.description.trim() || undefined,
        });
    };

    const niveauxFiltres = niveaux?.filter((n: any) => n.sousSysteme === formData.sousSysteme) || [];

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
                        icon={<FileBadge2 className="h-4 w-4" />}
                    >
                        {isLoading ? t('form.enregistrement') : isEdit ? t('form.modifier') : t('form.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                    <FileBadge2 className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                    {t('detail.informations')}
                </h3>
                <SectionSeparator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {t('form.code')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                            placeholder={t('form.codePlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={50}
                        />
                        {erreurs.code && <p className="text-xs text-red-500 mt-1">{erreurs.code}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.type')}</label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            {Object.entries(t('form.types', { returnObjects: true }) as Record<string, string>).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        {t('form.nom')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => handleChange('nom', e.target.value)}
                        placeholder={t('form.nomPlaceholder')}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        maxLength={100}
                    />
                    {erreurs.nom && <p className="text-xs text-red-500 mt-1">{erreurs.nom}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {t('form.niveau')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.niveauId}
                            onChange={(e) => handleChange('niveauId', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">{t('form.selectionnerNiveau')}</option>
                            {niveauxFiltres.map((niveau: any) => (
                                <option key={niveau.id} value={niveau.id}>
                                    {niveau.nom} ({niveau.code})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">{t('form.niveauxFiltreInfo')}</p>
                        {erreurs.niveauId && <p className="text-xs text-red-500 mt-1">{erreurs.niveauId}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.diplomeDelivre')}</label>
                        <input
                            type="text"
                            value={formData.diplomeDelivre}
                            onChange={(e) => handleChange('diplomeDelivre', e.target.value.toUpperCase())}
                            placeholder={t('form.diplomePlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={100}
                        />
                    </div>
                </div>

                <SectionSeparator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.sousSysteme')}</label>
                        <select
                            value={formData.sousSysteme}
                            onChange={(e) => handleChange('sousSysteme', e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            {Object.entries(t('form.sousSystemes', { returnObjects: true }) as Record<string, string>).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">{t('form.coefficient')}</label>
                        <input
                            type="number"
                            value={formData.coefficient || ''}
                            onChange={(e) => handleChange('coefficient', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder={t('form.coefficient')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min="0"
                            step="0.5"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">{t('form.description')}</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder={t('form.descriptionPlaceholder')}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <SectionSeparator />
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="estObligatoire"
                            checked={formData.estObligatoire}
                            onChange={(e) => handleChange('estObligatoire', e.target.checked)}
                            className="w-4 h-4 rounded border-input"
                        />
                        <label htmlFor="estObligatoire" className="text-sm font-medium text-foreground">
                            {t('form.estObligatoire')}
                        </label>
                    </div>
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
                </div>
            </form>
        </CustomModal>
    );
}
