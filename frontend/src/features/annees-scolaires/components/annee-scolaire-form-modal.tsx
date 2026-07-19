/**
 * ==================================
 * eLISAschool - Formulaire Année Scolaire
 * ==================================
 * Version: 2.1.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Calendar } from 'lucide-react';
import { useCreerAnneeScolaire, useModifierAnneeScolaire } from '../hooks/use-annees-scolaires';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import type { AnneeScolaire, CreerAnneeScolaireDto } from '../types/annee-scolaire.types';

interface AnneeScolaireFormModalProps {
    open: boolean;
    mode: 'creation' | 'edition';
    annee?: AnneeScolaire;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
}

const FORM_INIT: Partial<CreerAnneeScolaireDto> = {
    libelle: '',
    code: '',
    dateDebut: '',
    dateFin: '',
};

export function AnneeScolaireFormModal({ open, mode, annee, onSuccess, onOpenChange }: AnneeScolaireFormModalProps) {
    const { t } = useTranslation('annees-scolaires');
    const creerAnnee = useCreerAnneeScolaire();
    const modifierAnnee = useModifierAnneeScolaire();
    const isLoading = creerAnnee.isPending || modifierAnnee.isPending;

    const [formData, setFormData] = useState<Partial<CreerAnneeScolaireDto>>(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && annee && mode === 'edition') {
            setFormData({
                libelle: annee.libelle || '',
                code: annee.code || '',
                dateDebut: annee.dateDebut?.split('T')[0] || '',
                dateFin: annee.dateFin?.split('T')[0] || '',
            });
        } else if (!open) {
            setFormData(FORM_INIT);
            setErreurs({});
        }
    }, [open, annee, mode]);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.libelle?.trim()) {
            nouvellesErreurs.libelle = t('form.libelleRequis');
        }
        if (!formData.code?.trim()) {
            nouvellesErreurs.code = t('form.codeRequis');
        }
        if (!formData.dateDebut) {
            nouvellesErreurs.dateDebut = t('form.dateDebutRequise');
        }
        if (!formData.dateFin) {
            nouvellesErreurs.dateFin = t('form.dateFinRequise');
        }
        if (formData.dateDebut && formData.dateFin) {
            if (new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
                nouvellesErreurs.dateFin = t('form.dateFinApresDebut');
            }
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerAnnee.mutateAsync(formData as CreerAnneeScolaireDto);
            } else if (annee) {
                await modifierAnnee.mutateAsync({ id: annee.id, ...formData });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire année scolaire:', error);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleDateChange = (field: string, value: string) => {
        handleChange(field, value);

        if (field === 'dateDebut' || field === 'dateFin') {
            const newData = { ...formData, [field]: value };
            if (newData.dateDebut && newData.dateFin && !formData.libelle) {
                const anneeDebut = newData.dateDebut.split('-')[0];
                const anneeFin = newData.dateFin.split('-')[0];
                handleChange('libelle', `${t('form.libelleAuto')} ${anneeDebut}-${anneeFin}`);
                handleChange('code', `${anneeDebut}-${anneeFin}`);
            }
        }
    };

    const titre = mode === 'creation' ? t('form.titreCreer') : t('form.titreModifier');

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v && hasUnsavedChanges) return;
                onOpenChange(v);
            }}
            title={titre}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                    >
                        {mode === 'creation' ? t('boutons.creer') : t('boutons.enregistrer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section identification */}
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionIdentification')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <ElisaInput
                                label={t('form.libelle')}
                                value={formData.libelle || ''}
                                onChange={(e) => handleChange('libelle', e.target.value)}
                                error={erreurs.libelle}
                                placeholder={t('form.libellePlaceholder')}
                                required
                                autoFocus
                            />
                            <ElisaInput
                                label={t('form.code')}
                                value={formData.code || ''}
                                onChange={(e) => handleChange('code', e.target.value)}
                                error={erreurs.code}
                                placeholder={t('form.codePlaceholder')}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Section dates */}
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.sectionPeriode')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <ElisaInput
                                label={t('form.dateDebut')}
                                type="date"
                                value={formData.dateDebut || ''}
                                onChange={(e) => handleDateChange('dateDebut', e.target.value)}
                                error={erreurs.dateDebut}
                                required
                            />
                            <ElisaInput
                                label={t('form.dateFin')}
                                type="date"
                                value={formData.dateFin || ''}
                                onChange={(e) => handleDateChange('dateFin', e.target.value)}
                                error={erreurs.dateFin}
                                required
                            />
                        </div>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
