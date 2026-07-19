/**
 * ==================================
 * eLISAschool - Modal Formulaire Filière
 * ==================================
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { Split } from 'lucide-react';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import type { Filiere } from '../types/filiere.types';

interface FiliereFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filiere?: Filiere | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

const FORM_INIT = {
    nom: '',
    code: '',
    description: '',
    cycleId: '',
    sousSysteme: 'FRANCOPHONE' as 'FRANCOPHONE' | 'ANGLOPHONE',
    actif: true,
};

export function FiliereFormModal({ open, onOpenChange, filiere, onSave, isLoading }: FiliereFormModalProps) {
    const { t } = useTranslation('filieres');
    const { data: cycles } = useTousCycles();

    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && filiere) {
            setFormData({
                nom: filiere.nom || '',
                code: filiere.code || '',
                description: filiere.description || '',
                cycleId: filiere.cycleId || '',
                sousSysteme: (filiere.sousSysteme as any) || 'FRANCOPHONE',
                actif: filiere.actif ?? true,
            });
        } else if (!open) {
            setFormData(FORM_INIT);
            setErreurs({});
        }
    }, [filiere, open]);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    const valider = (): boolean => {
        const nouvelles: Record<string, string> = {};
        if (!formData.nom.trim()) nouvelles.nom = t('form.nomRequis');
        if (!formData.code.trim()) nouvelles.code = t('form.codeRequis');
        if (!formData.cycleId) nouvelles.cycleId = t('form.cycleRequis');
        setErreurs(nouvelles);
        return Object.keys(nouvelles).length === 0;
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => { const next = { ...prev }; delete next[field]; return next; });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!valider()) return;
        onSave({
            nom: formData.nom.trim(),
            code: formData.code.trim().toUpperCase(),
            description: formData.description.trim() || undefined,
            cycleId: formData.cycleId,
            sousSysteme: formData.sousSysteme,
            actif: formData.actif,
        });
    };

    const titre = filiere ? t('form.titreModifier') : t('form.titreCreer');
    const description = filiere ? t('form.titreModifier') : t('form.titreCreer');

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v && hasUnsavedChanges) return;
                onOpenChange(v);
            }}
            title={titre}
            description={description}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        icon={<Split className="h-4 w-4" />}
                    >
                        {filiere ? t('boutons.enregistrer') : t('boutons.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Split className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionIdentification')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <ElisaInput
                                label={t('form.code')}
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                placeholder={t('form.codePlaceholder')}
                                error={erreurs.code}
                                required
                                maxLength={50}
                                autoFocus
                            />
                            <ElisaInput
                                label={t('form.nom')}
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                placeholder={t('form.nomPlaceholder')}
                                error={erreurs.nom}
                                required
                                maxLength={100}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Split className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionConfiguration')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-[var(--color-texte)] mb-2 block">{t('form.cycle')} <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.cycleId}
                                    onChange={(e) => handleChange('cycleId', e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                    required
                                >
                                    <option value="">Sélectionner un cycle</option>
                                    {(cycles || []).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.nom}</option>
                                    ))}
                                </select>
                                {erreurs.cycleId && <p className="text-xs text-red-500 mt-1">{erreurs.cycleId}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[var(--color-texte)] mb-2 block">{t('form.sousSysteme')}</label>
                                <select
                                    value={formData.sousSysteme}
                                    onChange={(e) => handleChange('sousSysteme', e.target.value as any)}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                >
                                    <option value="FRANCOPHONE">{t('sousSysteme.FRANCOPHONE')}</option>
                                    <option value="ANGLOPHONE">{t('sousSysteme.ANGLOPHONE')}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-texte)] mb-2 block">{t('form.description')}</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder={t('form.descriptionPlaceholder')}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                                rows={3}
                                maxLength={500}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="actif"
                                checked={formData.actif}
                                onChange={(e) => handleChange('actif', e.target.checked)}
                                className="w-4 h-4 rounded border-input"
                            />
                            <label htmlFor="actif" className="text-sm font-medium text-[var(--color-texte)]">
                                {t('form.actif')}
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
