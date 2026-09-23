/**
 * ==================================
 * eLISAschool — Platform Groupes · Formulaire
 * ==================================
 * CustomModal création + édition. Validation sobre, ElisaInput,
 * code normalisé UPPERCASE (cohérence backend).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import type { GroupeFormValues, GroupeSaaS } from './types';

interface GroupeFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupe?: GroupeSaaS | null;
    onSubmit: (values: GroupeFormValues) => void;
    isSubmitting?: boolean;
}

const CODE_PATTERN = /^[A-Z0-9_-]{2,20}$/;

export function GroupeFormModal({ open, onOpenChange, groupe, onSubmit, isSubmitting }: GroupeFormModalProps) {
    const { t } = useTranslation('admin');
    const isEdit = !!groupe;

    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [actif, setActif] = useState(true);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setNom(groupe?.nom ?? '');
            setCode(groupe?.code ?? '');
            setDescription(groupe?.description ?? '');
            setActif(groupe?.actif ?? true);
            setTouched(false);
        }
    }, [open, groupe]);

    const nomErreur = touched && nom.trim().length < 2 ? t('groupes.form.erreurNom') : undefined;
    const codeNormalise = code.trim().toUpperCase();
    const codeErreur =
        touched && !CODE_PATTERN.test(codeNormalise) ? t('groupes.form.erreurCode') : undefined;
    const valide = nom.trim().length >= 2 && CODE_PATTERN.test(codeNormalise);

    const handleSubmit = () => {
        setTouched(true);
        if (!valide) return;
        onSubmit({
            nom: nom.trim(),
            code: codeNormalise,
            description: description.trim() || undefined,
            actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('groupes.form.titreEdit') : t('groupes.form.titreCreate')}
            description={isEdit ? t('groupes.form.sousTitreEdit') : t('groupes.form.sousTitreCreate')}
            size="md"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {t('groupes.form.annuler')}
                    </ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={touched && !valide}>
                        {isEdit ? t('groupes.form.enregistrer') : t('groupes.form.creer')}
                    </ElisaButton>
                </>
            }
        >
            <form
                className="flex flex-col gap-[var(--gap-md)]"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <ElisaInput
                    label={t('groupes.form.nom')}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder={t('groupes.form.nomPlaceholder')}
                    error={nomErreur}
                    required
                    maxLength={100}
                />
                <ElisaInput
                    label={t('groupes.form.code')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t('groupes.form.codePlaceholder')}
                    error={codeErreur}
                    hint={t('groupes.form.codeAide')}
                    required
                    disabled={isEdit}
                    maxLength={20}
                    className="font-mono"
                />
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="groupe-description"
                        className="text-sm font-medium text-[var(--color-texte)]"
                    >
                        {t('groupes.form.description')}
                    </label>
                    <textarea
                        id="groupe-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder={t('groupes.form.descriptionPlaceholder')}
                        className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]"
                    />
                </div>
                {isEdit && (
                    <ElisaToggle
                        checked={actif}
                        onCheckedChange={setActif}
                        label={t('groupes.form.actif')}
                        description={t('groupes.form.actifAide')}
                    />
                )}
            </form>
        </CustomModal>
    );
}
