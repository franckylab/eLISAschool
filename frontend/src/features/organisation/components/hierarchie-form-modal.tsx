import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitBranch } from 'lucide-react';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useAuthStore } from '@/stores/auth.store';
import { useCreerHierarchie, useModifierHierarchie } from '../hooks/use-organisation';
import { createHierarchieSchema, updateHierarchieSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import { PersonnelSearchField } from './personnel-search-field';
import type { HierarchiePersonnel } from '../types/organisation.types';
import type { Poste } from '@/features/postes/types/poste.types';

interface PersonnelSearchResult {
    id: string;
    nom: string;
    prenom: string;
    matricule?: string;
    email?: string;
    poste?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postes: Poste[];
    hierarchie?: HierarchiePersonnel | null;
}

const TYPES_RELATION_OPTIONS = [
    { value: 'DIRECT', label: 'Directe' },
    { value: 'FONCTIONNEL', label: 'Fonctionnelle' },
];

export function HierarchieFormModal({ open, onOpenChange, postes, hierarchie }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!hierarchie;
    const creer = useCreerHierarchie();
    const modifier = useModifierHierarchie();
    const etablissementId = useAuthStore((s) => s.etablissementId);
    const [apiError, setApiError] = useState<string | null>(null);

    const initSubordonne: PersonnelSearchResult | null = hierarchie
        ? { id: hierarchie.personnelId || '', nom: '', prenom: '' }
        : null;
    const initSuperieur: PersonnelSearchResult | null = hierarchie
        ? { id: hierarchie.superieurId || '', nom: '', prenom: '' }
        : null;
    const [subordonne, setSubordonne] = useState<PersonnelSearchResult | null>(initSubordonne);
    const [superieur, setSuperieur] = useState<PersonnelSearchResult | null>(initSuperieur);

    const schema = isEdit ? updateHierarchieSchema : createHierarchieSchema;

    const { handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            typeRelation: hierarchie?.typeRelation || 'DIRECT',
            posteId: hierarchie?.posteId || '',
            commentaire: hierarchie?.commentaire || '',
        },
    });

    const onSubmit = async (data: Record<string, string | undefined>) => {
        setApiError(null);
        try {
            if (!subordonne || !superieur) return;
            const payload = {
                ...data,
                personnelId: subordonne.id,
                superieurId: superieur.id,
                etablissementId,
            };
            if (isEdit && hierarchie) {
                await modifier.mutateAsync({ id: hierarchie.id, ...payload });
            } else {
                await creer.mutateAsync(payload);
            }
            onOpenChange(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setApiError(e?.response?.data?.message || e?.message || t('erreurGenerique'));
        }
    };

    const valide = subordonne && superieur;

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('modifierHierarchie') : t('nouvelleHierarchie')}
            icon={GitBranch}
            color="amber"
            size="md"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting}
            disabled={!valide}
            onSubmit={handleSubmit(onSubmit)}
            apiError={apiError}
        >
            <PersonnelSearchField
                value={subordonne}
                onChange={setSubordonne}
                label={t('subordonne') + ' *'}
            />

            <PersonnelSearchField
                value={superieur}
                onChange={setSuperieur}
                label={t('superieur') + ' *'}
            />

            <Controller
                name="typeRelation"
                control={control}
                render={({ field }) => (
                    <ElisaSelect label={t('typeRelation')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TYPES_RELATION_OPTIONS}
                        error={errors.typeRelation?.message as string}
                    />
                )}
            />

            <Controller
                name="posteId"
                control={control}
                render={({ field }) => (
                    <ElisaSelect label={t('posteAssocie')}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={postes.map((p) => ({ value: p.id, label: p.intitule }))}
                        placeholder={t('aucun')}
                        error={errors.posteId?.message as string}
                    />
                )}
            />
        </BaseFormModal>
    );
}
