/**
 * ==================================
 * eLISAschool - Modal Formulaire Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save } from 'lucide-react';
import { useCreerEtablissement, useModifierEtablissement } from '../hooks/use-etablissements';
import { SousSysteme, TypeEtablissement } from '../types/etablissement.types';
import type { Etablissement, CreerEtablissementDto } from '../types/etablissement.types';

interface EtablissementFormModalProps {
    mode: 'creation' | 'edition';
    etablissement?: Etablissement | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function EtablissementFormModal({ mode, etablissement, onSuccess, onCancel }: EtablissementFormModalProps) {
    const creer = useCreerEtablissement();
    const modifier = useModifierEtablissement();

    const [formData, setFormData] = useState<CreerEtablissementDto>({
        nom: '',
        codeEtablissement: '',
        slogan: '',
        logoUrl: '',
        sousSysteme: SousSysteme.FRANCOPHONE,
        type: TypeEtablissement.LAIC,
        numeroArrete: '',
        numeroContribuable: '',
        numeroCompteBancaire: '',
        contactEmail: '',
        contactTelephone: '',
        adresse: '',
        siteWeb: '',
        facebook: '',
        twitter: '',
        heuresOuverture: '',
        heuresFermeture: '',
        effectifMax: undefined,
        directeurNom: '',
        directeurAdjointNom: '',
        censeurNom: '',
        surveillantGeneralNom: '',
    });

    useEffect(() => {
        if (mode === 'edition' && etablissement) {
            setFormData({
                nom: etablissement.nom || '',
                codeEtablissement: etablissement.codeEtablissement || '',
                slogan: etablissement.slogan || '',
                logoUrl: etablissement.logoUrl || '',
                sousSysteme: etablissement.sousSysteme,
                type: etablissement.type,
                numeroArrete: etablissement.numeroArrete || '',
                numeroContribuable: etablissement.numeroContribuable || '',
                numeroCompteBancaire: etablissement.numeroCompteBancaire || '',
                contactEmail: etablissement.contactEmail || '',
                contactTelephone: etablissement.contactTelephone || '',
                adresse: etablissement.adresse || '',
                siteWeb: etablissement.siteWeb || '',
                facebook: etablissement.facebook || '',
                twitter: etablissement.twitter || '',
                heuresOuverture: etablissement.heuresOuverture || '',
                heuresFermeture: etablissement.heuresFermeture || '',
                effectifMax: etablissement.effectifMax,
                directeurNom: etablissement.directeurNom || '',
                directeurAdjointNom: etablissement.directeurAdjointNom || '',
                censeurNom: etablissement.censeurNom || '',
                surveillantGeneralNom: etablissement.surveillantGeneralNom || '',
            });
        }
    }, [mode, etablissement]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (mode === 'creation') {
            await creer.mutateAsync(formData);
        } else if (etablissement) {
            await modifier.mutateAsync({ id: etablissement.id, ...formData });
        }
        onSuccess();
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={mode === 'creation' ? 'Nouvel établissement' : 'Modifier l\'établissement'}
            description="Remplissez les informations ci-dessous"
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        icon={<Save className="h-4 w-4" />}
                        isLoading={creer.isPending || modifier.isPending}
                    >
                        Enregistrer
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Informations de base */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informations de base</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label="Nom de l'établissement *"
                            value={formData.nom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nom', e.target.value)}
                            placeholder="Ex: Lycée Bilingue de Yaoundé"
                            required
                        />
                        <ElisaInput
                            label="Code établissement"
                            value={formData.codeEtablissement}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('codeEtablissement', e.target.value)}
                            placeholder="Ex: LYC-YAO-001"
                        />
                    </div>
                    <ElisaInput
                        label="Slogan"
                        value={formData.slogan}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('slogan', e.target.value)}
                        placeholder="Ex: Excellence et Bilinguisme"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaSelect
                            label="Sous-système"
                            value={formData.sousSysteme}
                            onValueChange={(value: string) => handleChange('sousSysteme', value)}
                            options={[
                                { value: SousSysteme.FRANCOPHONE, label: 'Francophone' },
                                { value: SousSysteme.ANGLOPHONE, label: 'Anglophone' },
                                { value: SousSysteme.BICULTUREL, label: 'Biculturel' },
                            ]}
                        />
                        <ElisaSelect
                            label="Type d'établissement"
                            value={formData.type}
                            onValueChange={(value: string) => handleChange('type', value)}
                            options={[
                                { value: TypeEtablissement.LAIC, label: 'Laïc' },
                                { value: TypeEtablissement.CONFESSIONNEL_CATHOLIQUE, label: 'Catholique' },
                                { value: TypeEtablissement.CONFESSIONNEL_PROTESTANT, label: 'Protestant' },
                                { value: TypeEtablissement.CONFESSIONNEL_ISLAMIQUE, label: 'Islamique' },
                                { value: TypeEtablissement.AUTRE, label: 'Autre' },
                            ]}
                        />
                    </div>
                </div>

                {/* Identification légale */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Identification légale</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label="N° Arrêté"
                            value={formData.numeroArrete}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroArrete', e.target.value)}
                            placeholder="Ex: AR-2024-001"
                        />
                        <ElisaInput
                            label="N° Contribuable"
                            value={formData.numeroContribuable}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroContribuable', e.target.value)}
                            placeholder="Ex: M123456789P"
                        />
                        <ElisaInput
                            label="N° Compte Bancaire"
                            value={formData.numeroCompteBancaire}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroCompteBancaire', e.target.value)}
                            placeholder="Ex: BEPC..."
                        />
                    </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label="Email"
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactEmail', e.target.value)}
                            placeholder="contact@etablissement.cm"
                        />
                        <ElisaInput
                            label="Téléphone"
                            value={formData.contactTelephone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactTelephone', e.target.value)}
                            placeholder="+237 222 00 00 00"
                        />
                    </div>
                    <ElisaInput
                        label="Adresse"
                        value={formData.adresse}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('adresse', e.target.value)}
                        placeholder="Quartier, Ville"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label="Site Web"
                            value={formData.siteWeb}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('siteWeb', e.target.value)}
                            placeholder="https://etablissement.cm"
                        />
                        <ElisaInput
                            label="Facebook"
                            value={formData.facebook}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('facebook', e.target.value)}
                            placeholder="https://facebook.com/..."
                        />
                        <ElisaInput
                            label="Twitter"
                            value={formData.twitter}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('twitter', e.target.value)}
                            placeholder="https://twitter.com/..."
                        />
                    </div>
                </div>

                {/* Horaires et Capacité */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Horaires et Capacité</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label="Heure d'ouverture"
                            value={formData.heuresOuverture}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('heuresOuverture', e.target.value)}
                            placeholder="07:30"
                        />
                        <ElisaInput
                            label="Heure de fermeture"
                            value={formData.heuresFermeture}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('heuresFermeture', e.target.value)}
                            placeholder="17:00"
                        />
                        <ElisaInput
                            label="Effectif maximum"
                            type="number"
                            value={formData.effectifMax?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('effectifMax', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="1500"
                        />
                    </div>
                </div>

                {/* Direction */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Direction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label="Directeur(trice)"
                            value={formData.directeurNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('directeurNom', e.target.value)}
                            placeholder="Dr. Jean Mouangue"
                        />
                        <ElisaInput
                            label="Directeur(trice) Adjoint(e)"
                            value={formData.directeurAdjointNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('directeurAdjointNom', e.target.value)}
                            placeholder="Mme. Marie Ngo Mbock"
                        />
                        <ElisaInput
                            label="Censeur(e)"
                            value={formData.censeurNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('censeurNom', e.target.value)}
                            placeholder="M. Pierre Tchuente"
                        />
                        <ElisaInput
                            label="Surveillant(e) Général(e)"
                            value={formData.surveillantGeneralNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('surveillantGeneralNom', e.target.value)}
                            placeholder="M. Paul Atangana"
                        />
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
