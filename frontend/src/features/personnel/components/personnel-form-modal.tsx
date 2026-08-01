/**
 * ==================================
 * eLISAschool - Formulaire Personnel
 * ==================================
 * Version: 4.0.0
 *
 * NOTE: Poste, Fonction, Type de contrat et rémunération sont gérés
 * via l'interface contrat (ContratWizardModal). Les informations
 * d'identité et de contact sont gérées via le profil utilisateur.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useCreerPersonnel, useModifierPersonnel, useMembrePersonnel, useLinkPersonnelUtilisateur, useUnlinkPersonnelUtilisateur } from '../hooks/use-personnel';
import { useUtilisateursDisponibles } from '@/features/utilisateurs/hooks/use-utilisateurs';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { InlineSpinner } from '@/components/feedback';
import type { MembrePersonnel, ModifierPersonnelDto } from '../types/personnel.types';
import { fromFormToCreateDto } from '../types/personnel.types';
import type { Utilisateur } from '@/features/utilisateurs/types/utilisateur.types';

interface PersonnelFormModalProps {
    mode: 'creation' | 'edition';
    membre?: MembrePersonnel;
    onSuccess: () => void;
    onCancel: () => void;
}

interface FormValues {
    dateEmbauche: string;
    statut: string;
    specialites: string[];
    diplomes: string;
}

const normaliserStatut = (v?: string): string => {
    if (!v) return 'ACTIF';
    const map: Record<string, string> = { ACTIF: 'ACTIF', INACTIF: 'INACTIF', CONGE: 'CONGE', DEMISSION: 'INACTIF' };
    return map[v] || v;
};

const getDefaultValues = (m?: MembrePersonnel): FormValues => ({
    dateEmbauche: m?.dateEmbauche?.split('T')[0] || new Date().toISOString().split('T')[0],
    statut: normaliserStatut(m?.statut),
    specialites: m?.specialites?.length ? m.specialites : m?.specialitePrincipale ? [m.specialitePrincipale] : [],
    diplomes: m?.diplomes || '',
});

export function PersonnelFormModal({ mode, membre, onSuccess, onCancel }: PersonnelFormModalProps) {
    const { t } = useTranslation('personnel');
    const creerPersonnel = useCreerPersonnel();
    const modifierPersonnel = useModifierPersonnel();
    const linkUser = useLinkPersonnelUtilisateur();
    const unlinkUser = useUnlinkPersonnelUtilisateur();
    const isMutating = creerPersonnel.isPending || modifierPersonnel.isPending || linkUser.isPending || unlinkUser.isPending;
    const { data: utilisateursData } = useUtilisateursDisponibles();

    const editId = mode === 'edition' ? membre?.id ?? '' : '';
    const { data: apiData, isLoading: isFetching } = useMembrePersonnel(editId);
    const source = mode === 'edition' && apiData ? apiData : membre;

    const schema = useMemo(() => z.object({
        dateEmbauche: z.string().min(1, t('form.dateEntreeRequise')),
        statut: z.string().min(1),
        specialites: z.array(z.string()).default([]),
        diplomes: z.string().optional(),
    }), [t]);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: getDefaultValues(source),
    });

    const [linkUserId, setLinkUserId] = useState('');

    useEffect(() => {
        reset(getDefaultValues(source));
        setLinkUserId('');
    }, [source, mode, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            const formForDto = {
                dateEmbauche: data.dateEmbauche,
                statut: data.statut,
                specialites: data.specialites,
                diplomes: data.diplomes || '',
            };
            const dto = fromFormToCreateDto(formForDto);

            if (mode === 'creation') {
                if (linkUserId) {
                    dto.utilisateurId = linkUserId;
                }
                await creerPersonnel.mutateAsync(dto);
            } else if (source) {
                const patch: ModifierPersonnelDto = {
                    id: source.id,
                    ...dto,
                };
                await modifierPersonnel.mutateAsync(patch);
            }
            onSuccess();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('common:messages.erreurServeur'));
        }
    };

    const titre = mode === 'creation' ? t('form.titreCreation') : t('form.titreEdition');

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description={t('form.description')}
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel} type="button">
                        {t('form.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isMutating}
                        icon={<Save className="h-4 w-4" />}
                        form="personnel-form"
                    >
                        {mode === 'creation' ? t('form.ajouter') : t('form.enregistrer')}
                    </ElisaButton>
                </>
            }
        >
            {isFetching ? (
                <div className="py-12 flex justify-center"><InlineSpinner label={t('form.chargement')} /></div>
            ) : (
            <form id="personnel-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Utilisateur lié */}
                <div className="bg-muted rounded-lg border border-border p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-secondary flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('form.compteUtilisateur')}
                    </h4>
                    {source?.utilisateur ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{source.utilisateur.profil?.prenom} {source.utilisateur.profil?.nom}</span>
                                <span className="text-muted-foreground">({source.utilisateur.email})</span>
                            </div>
                            <ElisaButton
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => unlinkUser.mutate(source.id)}
                                disabled={unlinkUser.isPending}
                            >
                                {t('form.delier')}
                            </ElisaButton>
                        </div>
                    ) : mode === 'edition' ? (
                        <div className="flex items-center gap-2">
                            <ElisaSelect
                                label=""
                                value={linkUserId}
                                onValueChange={setLinkUserId}
                                options={(utilisateursData?.items || []).map((u: Utilisateur) => ({
                                    value: u.id,
                                    label: `${u.nom || ''} ${u.prenom || ''} - ${u.email}`,
                                }))}
                                placeholder={t('form.lierUtilisateur')}
                            />
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => {
                                    if (linkUserId) {
                                        linkUser.mutate({ membreId: source!.id, utilisateurId: linkUserId });
                                        setLinkUserId('');
                                    }
                                }}
                                disabled={!linkUserId || linkUser.isPending}
                            >
                                {t('form.lier')}
                            </ElisaButton>
                        </div>
                    ) : (
                        <ElisaSelect
                            label=""
                            value={linkUserId}
                            onValueChange={setLinkUserId}
                            options={(utilisateursData?.items || []).map((u: Utilisateur) => ({
                                value: u.id,
                                label: `${u.nom || ''} ${u.prenom || ''} - ${u.email}`,
                            }))}
                            placeholder={t('form.lierUtilisateurOptionnel')}
                        />
                    )}
                </div>

                {/* Statut et Date d'entrée */}
                <div className="grid grid-cols-2 gap-4">
                    <Controller name="statut" control={control} render={({ field }) => (
                        <ElisaSelect
                            label={t('statut')}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={[
                                { value: 'ACTIF', label: t('statuts.actif') },
                                { value: 'INACTIF', label: t('statuts.inactif') },
                                { value: 'CONGE', label: t('statuts.en_conge') },
                            ]}
                        />
                    )} />
                    <ElisaInput
                        label={t('dateEntree')}
                        type="date"
                        {...register('dateEmbauche')}
                        error={errors.dateEmbauche?.message}
                        required
                    />
                </div>

                {/* Qualification et Spécialité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('qualification')}
                        {...register('diplomes')}
                        placeholder={t('form.placeholderQualification')}
                        error={errors.diplomes?.message}
                    />
                    <Controller name="specialites" control={control} render={({ field }) => (
                        <ElisaInput
                            label={t('specialite')}
                            value={field.value?.[0] || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange([e.target.value])}
                            placeholder={t('form.placeholderSpecialite')}
                        />
                    )} />
                </div>
            </form>
            )}
        </CustomModal>
    );
}
