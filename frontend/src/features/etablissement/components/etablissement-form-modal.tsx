/**
 * ==================================
 * eLISAschool - Modal Formulaire Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useRef } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Save, Image as ImageIcon, Upload, X } from 'lucide-react';
import { useCreerEtablissement } from '../hooks/use-etablissements';
import { SousSysteme, TypeEtablissement } from '../types/etablissement.types';
import type { CreerEtablissementDto } from '../types/etablissement.types';

interface EtablissementFormModalProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function EtablissementFormModal({ onSuccess, onCancel }: EtablissementFormModalProps) {
    const creer = useCreerEtablissement();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [_logoFile, setLogoFile] = useState<File | null>(null);

    const modalTitle = 'Nouvel établissement';
    const modalDescription = 'Créez un nouvel établissement scolaire';

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

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner un fichier image');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert('Le fichier ne doit pas dépasser 2 Mo');
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                setFormData((prev) => ({ ...prev, logoUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setFormData((prev) => ({ ...prev, logoUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        await creer.mutateAsync(formData);
        onSuccess();
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={modalTitle}
            description={modalDescription}
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
                        isLoading={creer.isPending}
                    >
                        Enregistrer
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Logo */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Logo de l'établissement</h3>
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden relative">
                            {logoPreview ? (
                                <>
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        title="Supprimer le logo"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : (
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                                id="logo-upload"
                            />
                            <label
                                htmlFor="logo-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
                            >
                                <Upload className="h-4 w-4" />
                                Choisir un fichier
                            </label>
                            <p className="text-xs text-gray-500">
                                Formats acceptés : PNG, JPG, SVG, GIF. Taille max : 2 Mo. Taille recommandée : 200x200px.
                            </p>
                        </div>
                    </div>
                </div>

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
                </div>

                {/* Couleurs et personnalisation */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Couleurs et personnalisation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ColorPicker
                            label="Couleur principale (dominante 60%)"
                            value={formData.couleurPrimaire || '#28a745'}
                            onChange={(v) => handleChange('couleurPrimaire', v)}
                            hint="Couleur principale de l'établissement"
                        />
                        <ColorPicker
                            label="Couleur secondaire (accent 30%)"
                            value={formData.couleurSecondaire || '#ffc107'}
                            onChange={(v) => handleChange('couleurSecondaire', v)}
                            hint="Couleur d'accentuation"
                        />
                    </div>
                </div>

                {/* Contact - Réseaux sociaux */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Réseaux sociaux</h3>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Direction & Responsables</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong> Chef d'établissement :</strong> Rôle attribué via la gestion des utilisateurs. 
                            Pour assigner un chef, créez/modifiez un utilisateur avec le rôle "Chef d'établissement".
                        </p>
                    </div>
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
