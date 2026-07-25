/**
 * ==================================
 * eLISAschool - Modal formulaire relation hiérarchique
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Création / édition d'une relation hiérarchique avec sélecteur de mode :
 * Personne → Personne (recherche personnel) ou Poste → Poste (selects postes).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link2 } from 'lucide-react';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { useAuthStore } from '@/stores/auth.store';
import { useTousPostes } from '@/features/postes/hooks/use-postes';
import { useCreerHierarchie, useModifierHierarchie } from '../hooks/use-organisation';
import { createHierarchieSchema, type CreateHierarchieFormData } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import { PersonnelSearchField, type PersonnelSearchResult } from './personnel-search-field';
import { estRelationPoste } from './hierarchie-libelles';
import type { HierarchiePersonnel } from '../types/organisation.types';

type ModeRelation = 'personne' | 'poste';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hierarchie?: HierarchiePersonnel | null;
}

const versDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');
const versIso = (date?: string) => (date ? new Date(`${date}T00:00:00.000Z`).toISOString() : undefined);

export function HierarchieFormModal({ open, onOpenChange, hierarchie }: Props) {
    const { t } = useTranslation('organisation');
    const isEdit = !!hierarchie;
    const creer = useCreerHierarchie();
    const modifier = useModifierHierarchie();
    const etablissementId = useAuthStore((s) => s.etablissementId);
    const { data: postes } = useTousPostes();

    const [apiError, setApiError] = useState<string | null>(null);
    const [mode, setMode] = useState<ModeRelation>(hierarchie && estRelationPoste(hierarchie) ? 'poste' : 'personne');

    const nomComplet = (p?: HierarchiePersonnel['personnel']) => {
        const profil = p?.utilisateur?.profil;
        return [profil?.prenom, profil?.nom].filter(Boolean).join(' ');
    };
    const initPersonne = (p?: HierarchiePersonnel['personnel']): PersonnelSearchResult | null =>
        p ? { id: p.id, nom: p.utilisateur?.profil?.nom || nomComplet(p), prenom: p.utilisateur?.profil?.prenom || '', matricule: p.matricule } : null;

    const [subordonne, setSubordonne] = useState<PersonnelSearchResult | null>(initPersonne(hierarchie?.personnel));
    const [superieur, setSuperieur] = useState<PersonnelSearchResult | null>(initPersonne(hierarchie?.superieur));

    const { handleSubmit, control, register, setValue, formState: { errors, isSubmitting } } = useForm<CreateHierarchieFormData>({
        resolver: zodResolver(createHierarchieSchema),
        defaultValues: {
            personnelId: hierarchie?.personnelId || '',
            superieurId: hierarchie?.superieurId || '',
            posteId: hierarchie?.posteId || '',
            superieurPosteId: hierarchie?.superieurPosteId || '',
            typeRelation: hierarchie?.typeRelation || 'DIRECT',
            statut: hierarchie?.statut || 'ACTIVE',
            dateDebut: versDateInput(hierarchie?.dateDebut),
            dateFin: versDateInput(hierarchie?.dateFin),
            commentaire: hierarchie?.commentaire || '',
        },
    });

    const TYPES_RELATION_OPTIONS = [
        { value: 'DIRECT', label: t('typeRelation_DIRECT') },
        { value: 'FONCTIONNEL', label: t('typeRelation_FONCTIONNEL') },
    ];
    const POSTES_OPTIONS = (postes || []).map((p) => ({
        value: p.id,
        label: p.uniteOrganisationnelle?.nom ? `${p.intitule} — ${p.uniteOrganisationnelle.nom}` : p.intitule,
    }));

    const onSubmit = async (data: CreateHierarchieFormData) => {
        setApiError(null);
        try {
            const commun = {
                typeRelation: data.typeRelation,
                statut: data.statut,
                dateDebut: versIso(data.dateDebut),
                dateFin: versIso(data.dateFin),
                commentaire: data.commentaire || undefined,
                etablissementId,
            };
            const payload = mode === 'personne'
                ? { ...commun, personnelId: subordonne?.id, superieurId: superieur?.id }
                : { ...commun, posteId: data.posteId || undefined, superieurPosteId: data.superieurPosteId || undefined };
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

    const choisirSubordonne = (p: PersonnelSearchResult | null) => {
        setSubordonne(p);
        setValue('personnelId', p?.id || '');
    };
    const choisirSuperieur = (p: PersonnelSearchResult | null) => {
        setSuperieur(p);
        setValue('superieurId', p?.id || '');
    };
    const changerMode = (m: ModeRelation) => {
        setMode(m);
        if (m === 'personne') {
            setValue('posteId', '');
            setValue('superieurPosteId', '');
        } else {
            setValue('personnelId', '');
            setValue('superieurId', '');
        }
    };

    const valide = mode === 'personne' ? !!(subordonne && superieur) : true;

    const soumettre = handleSubmit(onSubmit, () => setApiError(t('relationIncomplete')));

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('modifierHierarchie') : t('nouvelleHierarchie')}
            icon={Link2}
            color="amber"
            size="md"
            submitLabel={isEdit ? t('enregistrer') : t('creer')}
            loading={isSubmitting}
            disabled={!valide}
            onSubmit={soumettre}
            apiError={apiError}
        >
            <div role="group" aria-label={t('colTypeRelation')} className="grid grid-cols-2 rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                {(['personne', 'poste'] as ModeRelation[]).map((m) => (
                    <button
                        key={m}
                        type="button"
                        aria-pressed={mode === m}
                        onClick={() => changerMode(m)}
                        className={`text-sm font-medium transition-colors min-h-[44px] ${mode === m
                            ? 'bg-[var(--color-dominant-600)] text-white'
                            : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-dominant-50)]'}`}
                    >
                        {m === 'personne' ? t('modePersonne') : t('modePoste')}
                    </button>
                ))}
            </div>

            {mode === 'personne' ? (
                <>
                    <PersonnelSearchField value={subordonne} onChange={choisirSubordonne} label={t('subordonne') + ' *'} />
                    <PersonnelSearchField value={superieur} onChange={choisirSuperieur} label={t('superieur') + ' *'} />
                </>
            ) : (
                <>
                    <Controller name="posteId" control={control} render={({ field }) => (
                        <ElisaSelect label={t('posteSubordonne') + ' *'} value={field.value || ''} onValueChange={field.onChange}
                            options={POSTES_OPTIONS} placeholder={t('selectionner')} error={errors.posteId?.message} />
                    )} />
                    <Controller name="superieurPosteId" control={control} render={({ field }) => (
                        <ElisaSelect label={t('posteSuperieur') + ' *'} value={field.value || ''} onValueChange={field.onChange}
                            options={POSTES_OPTIONS} placeholder={t('selectionner')} error={errors.superieurPosteId?.message} />
                    )} />
                </>
            )}

            <Controller name="typeRelation" control={control} render={({ field }) => (
                <ElisaSelect label={t('typeRelation')} value={field.value} onValueChange={field.onChange}
                    options={TYPES_RELATION_OPTIONS} error={errors.typeRelation?.message} />
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'var(--gap-md)' }}>
                <ElisaInput label={t('dateDebut')} type="date" {...register('dateDebut')} error={errors.dateDebut?.message} />
                <ElisaInput label={t('dateFin')} type="date" {...register('dateFin')} error={errors.dateFin?.message} />
            </div>

            <ElisaInput label={t('commentaire')} {...register('commentaire')} error={errors.commentaire?.message} />
        </BaseFormModal>
    );
}
