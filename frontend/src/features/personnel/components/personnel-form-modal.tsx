/**
 * ==================================
 * eLISAschool - Formulaire Personnel
 * ==================================
 * Version: 3.0.0
 *
 * NOTE: Poste, Fonction, Type de contrat et rémunération sont gérés
 * via l'interface contrat (ContratWizardModal). Les informations
 * d'identité et de contact sont gérées via le profil utilisateur.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, User } from 'lucide-react';
import { useCreerPersonnel, useModifierPersonnel, useMembrePersonnel, useLinkPersonnelUtilisateur, useUnlinkPersonnelUtilisateur } from '../hooks/use-personnel';
import { useUtilisateursDisponibles } from '@/features/utilisateurs/hooks/use-utilisateurs';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { LoadingState } from '@/components/feedback';
import type { MembrePersonnel, CreerPersonnelDto } from '../types/personnel.types';

interface PersonnelFormModalProps {
    mode: 'creation' | 'edition';
    membre?: MembrePersonnel;
    onSuccess: () => void;
    onCancel: () => void;
}

const formNormalizer = {
    statut: (v?: string): string => {
        if (!v) return 'ACTIF';
        const map: Record<string, string> = { ACTIF: 'ACTIF', INACTIF: 'INACTIF', CONGE: 'CONGE', DEMISSION: 'INACTIF' };
        return map[v] || v;
    },
    specialites: (m?: MembrePersonnel) => m?.specialites?.length ? m.specialites : m?.specialitePrincipale ? [m.specialitePrincipale] : [] as string[],
    diplomes: (m?: MembrePersonnel) => m?.diplomes || '',
    dateEmbauche: (m?: MembrePersonnel) => m?.dateEmbauche?.split('T')[0] || new Date().toISOString().split('T')[0],
};

function buildFormData<M extends MembrePersonnel | undefined>(m: M): Record<string, any> {
    return {
        dateEmbauche: formNormalizer.dateEmbauche(m),
        statut: formNormalizer.statut(m?.statut),
        specialites: formNormalizer.specialites(m),
        diplomes: formNormalizer.diplomes(m),
    };
}

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

    const [formData, setFormData] = useState<Record<string, any>>(buildFormData(source));

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(buildFormData(source));
    }, [source, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.dateEmbauche) {
            nouvellesErreurs.dateEmbauche = t('form.dateEntreeRequise');
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                const payload = { ...formData } as Record<string, any>;
                if (payload._linkUserId) {
                    payload.utilisateurId = payload._linkUserId;
                }
                delete payload._linkUserId;
                await creerPersonnel.mutateAsync(payload as CreerPersonnelDto);
            } else if (source) {
                const payload = { ...formData };
                delete payload._linkUserId;
                await modifierPersonnel.mutateAsync({
                    id: source.id,
                    ...payload,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire personnel:', error);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
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
                    >
                        {mode === 'creation' ? t('form.ajouter') : t('form.enregistrer')}
                    </ElisaButton>
                </>
            }
        >
            {isFetching ? (
                <div className="py-12"><LoadingState message={t('form.chargement')} /></div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Utilisateur lié */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('form.compteUtilisateur')}
                    </h4>
                    {source?.utilisateur ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{source.utilisateur.profil?.prenom} {source.utilisateur.profil?.nom}</span>
                                <span className="text-gray-500 dark:text-gray-400">({source.utilisateur.email})</span>
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
                                value={formData._linkUserId || ''}
                                onValueChange={(value: string) => handleChange('_linkUserId', value)}
                                options={(utilisateursData?.items || []).map((u: any) => ({
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
                                    if (formData._linkUserId) {
                                        linkUser.mutate({ membreId: source!.id, utilisateurId: formData._linkUserId });
                                        handleChange('_linkUserId', '');
                                    }
                                }}
                                disabled={!formData._linkUserId || linkUser.isPending}
                            >
                                {t('form.lier')}
                            </ElisaButton>
                        </div>
                    ) : (
                        <ElisaSelect
                            label=""
                            value={formData._linkUserId || ''}
                            onValueChange={(value: string) => handleChange('_linkUserId', value)}
                            options={(utilisateursData?.items || []).map((u: any) => ({
                                value: u.id,
                                label: `${u.nom || ''} ${u.prenom || ''} - ${u.email}`,
                            }))}
                            placeholder={t('form.lierUtilisateurOptionnel')}
                        />
                    )}
                </div>

                {/* Statut et Date d'entrée */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaSelect
                        label={t('statut')}
                        value={formData.statut || 'ACTIF'}
                        onValueChange={(value: string) => handleChange('statut', value)}
                        options={[
                            { value: 'ACTIF', label: t('statuts.actif') },
                            { value: 'INACTIF', label: t('statuts.inactif') },
                            { value: 'CONGE', label: t('statuts.en_conge') },
                        ]}
                    />
                    <ElisaInput
                        label={t('dateEntree')}
                        type="date"
                        value={formData.dateEmbauche || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dateEmbauche', e.target.value)}
                        error={erreurs.dateEmbauche}
                        required
                    />
                </div>

                {/* Qualification et Spécialité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label={t('qualification')}
                        value={formData.diplomes || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('diplomes', e.target.value)}
                        placeholder={t('form.placeholderQualification')}
                    />
                    <ElisaInput
                        label={t('specialite')}
                        value={(formData.specialites as string[])?.[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('specialites', [e.target.value])}
                        placeholder={t('form.placeholderSpecialite')}
                    />
                </div>
            </form>
            )}
        </CustomModal>
    );
}
