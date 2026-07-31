import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Image as ImageIcon, Upload, X, Phone, Palette, Globe, Clock, Users, FileText } from 'lucide-react';
import { StepperModal, type StepperStep } from '@/components/modals/StepperModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useCreerEtablissement } from '../hooks/use-etablissements';
import { SousSysteme, TypeEtablissement } from '../types/etablissement.types';
import type { CreerEtablissementDto } from '../types/etablissement.types';

interface EtablissementFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const FORM_INIT: CreerEtablissementDto = {
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
};

const SOUS_SYSTEME_OPTIONS = Object.values(SousSysteme).map((v) => ({ value: v, label: `etablissement:sousSystemes.${v}` }));
const TYPE_OPTIONS = Object.values(TypeEtablissement).map((v) => ({ value: v, label: `etablissement:typesEtablissement.${v}` }));

export function EtablissementFormModal({ open, onOpenChange }: EtablissementFormModalProps) {
    const { t } = useTranslation('etablissement');
    const creer = useCreerEtablissement();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [_logoFile, setLogoFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<CreerEtablissementDto>(FORM_INIT);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) {
            setFormData(FORM_INIT);
            setLogoPreview('');
            setLogoFile(null);
            setErrors({});
        }
    }, [open]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setLogoPreview(result);
                handleChange('logoUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        handleChange('logoUrl', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nom.trim()) newErrors.nom = t('form.nomRequis');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        await creer.mutateAsync(formData);
        setFormData(FORM_INIT);
        onOpenChange(false);
    };

    // Définition des étapes pour StepperModal
    const steps: StepperStep[] = [
        {
            id: 'identite',
            label: t('form.etapeIdentite', { defaultValue: 'Identité' }),
            icon: Building2,
            content: renderEtapeIdentite(),
            validate,
            validateError: errors.nom,
        },
        {
            id: 'contact',
            label: t('form.etapeContact', { defaultValue: 'Contact & Communication' }),
            icon: Phone,
            content: renderEtapeContact(),
        },
        {
            id: 'configuration',
            label: t('form.etapeConfiguration', { defaultValue: 'Configuration' }),
            icon: Palette,
            content: renderEtapeConfiguration(),
        },
    ];

    // Rendu Étape 1 : Identité (Logo + Infos de base + Identification légale)
    function renderEtapeIdentite() {
        return (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Logo */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('logoEtablissement')}
                    </h3>
                    <SectionSeparator />
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-32 h-32 rounded-lg border-2 border-dashed border-[var(--color-bordure)] flex items-center justify-center bg-[var(--color-bg-tertiaire)] overflow-hidden relative">
                            {logoPreview ? (
                                <>
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        title={t('supprimerLogoTitle')}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : (
                                <ImageIcon className="h-12 w-12 text-[var(--color-texte-muted)]" />
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
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-dominante)] text-white hover:opacity-90 transition-opacity cursor-pointer text-sm font-medium"
                            >
                                <Upload className="h-4 w-4" />
                                {t('choisirFichier')}
                            </label>
                            <p className="text-xs text-[var(--color-texte-muted)]">
                                {t('formatsAcceptes')} {t('recommandationLogo')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Informations de base */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('informationsBase')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('nomRequis')}
                            value={formData.nom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nom', e.target.value)}
                            placeholder="Ex: Lycée Bilingue de Yaoundé"
                            required
                            error={errors.nom}
                        />
                        <ElisaInput
                            label={t('codeEtablissement')}
                            value={formData.codeEtablissement}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('codeEtablissement', e.target.value)}
                            placeholder="Ex: LYC-YAO-001"
                        />
                    </div>
                    <ElisaInput
                        label={t('slogan')}
                        value={formData.slogan}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('slogan', e.target.value)}
                        placeholder="Ex: Excellence et Bilinguisme"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaSelect
                            label={t('sousSysteme')}
                            value={formData.sousSysteme}
                            onValueChange={(value: string) => handleChange('sousSysteme', value)}
                            options={SOUS_SYSTEME_OPTIONS}
                        />
                        <ElisaSelect
                            label={t('typeEtablissement')}
                            value={formData.type}
                            onValueChange={(value: string) => handleChange('type', value)}
                            options={TYPE_OPTIONS}
                        />
                    </div>
                </div>

                {/* Identification légale */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('identifiantsLegaux')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label={t('numeroArrete')}
                            value={formData.numeroArrete}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroArrete', e.target.value)}
                            placeholder="Ex: AR-2024-001"
                        />
                        <ElisaInput
                            label={t('numeroContribuable')}
                            value={formData.numeroContribuable}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroContribuable', e.target.value)}
                            placeholder="Ex: M123456789P"
                        />
                        <ElisaInput
                            label={t('numeroCompteBancaire')}
                            value={formData.numeroCompteBancaire}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('numeroCompteBancaire', e.target.value)}
                            placeholder="Ex: BEPC..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Rendu Étape 2 : Contact & Communication
    function renderEtapeContact() {
        return (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Contact */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Phone className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('contactLocalisation')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('email')}
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactEmail', e.target.value)}
                            placeholder="contact@etablissement.cm"
                        />
                        <ElisaInput
                            label={t('telephone')}
                            value={formData.contactTelephone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('contactTelephone', e.target.value)}
                            placeholder="+237 222 00 00 00"
                        />
                    </div>
                    <ElisaInput
                        label={t('adresse')}
                        value={formData.adresse}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('adresse', e.target.value)}
                        placeholder="Quartier, Ville"
                    />
                </div>

                {/* Réseaux sociaux */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Globe className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('reseauxSociaux', { defaultValue: 'Réseaux sociaux' })}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label={t('siteWeb')}
                            value={formData.siteWeb}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('siteWeb', e.target.value)}
                            placeholder="https://etablissement.cm"
                        />
                        <ElisaInput
                            label={t('facebook')}
                            value={formData.facebook}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('facebook', e.target.value)}
                            placeholder="https://facebook.com/..."
                        />
                        <ElisaInput
                            label={t('twitter')}
                            value={formData.twitter}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('twitter', e.target.value)}
                            placeholder="https://twitter.com/..."
                        />
                    </div>
                </div>

                {/* Horaires et Capacité */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('horairesCapacite')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ElisaInput
                            label={t('heuresOuverture')}
                            value={formData.heuresOuverture}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('heuresOuverture', e.target.value)}
                            placeholder="07:30"
                        />
                        <ElisaInput
                            label={t('heuresFermeture')}
                            value={formData.heuresFermeture}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('heuresFermeture', e.target.value)}
                            placeholder="17:00"
                        />
                        <ElisaInput
                            label={t('effectifMaximum')}
                            type="number"
                            value={formData.effectifMax?.toString() || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('effectifMax', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="1500"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Rendu Étape 3 : Configuration (Couleurs + Direction)
    function renderEtapeConfiguration() {
        return (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Couleurs */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Palette className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('themePersonnalisation')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ColorPicker
                            label={t('couleurPrimaireLabel')}
                            value={formData.couleurPrimaire || '#28a745'}
                            onChange={(v) => handleChange('couleurPrimaire', v)}
                            hint={t('couleurPrimaireHint')}
                        />
                        <ColorPicker
                            label={t('couleurSecondaireLabel')}
                            value={formData.couleurSecondaire || '#ffc107'}
                            onChange={(v) => handleChange('couleurSecondaire', v)}
                            hint={t('couleurSecondaireHint')}
                        />
                    </div>
                </div>

                {/* Direction */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Users className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('direction')}
                    </h3>
                    <SectionSeparator />
                    <div className="bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20 border border-[var(--color-dominant-200)] dark:border-[var(--color-dominant-800)] rounded-lg p-4 mb-4">
                        <p className="text-sm text-[var(--color-dominant-800)] dark:text-[var(--color-dominant-200)]">
                            {t('infoDirection', { defaultValue: 'Rôle attribué via la gestion des utilisateurs.' })}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('directeur')}
                            value={formData.directeurNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('directeurNom', e.target.value)}
                            placeholder="Dr. Jean Mouangue"
                        />
                        <ElisaInput
                            label={t('directeurAdjoint')}
                            value={formData.directeurAdjointNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('directeurAdjointNom', e.target.value)}
                            placeholder="Mme. Marie Ngo Mbock"
                        />
                        <ElisaInput
                            label={t('censeur')}
                            value={formData.censeurNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('censeurNom', e.target.value)}
                            placeholder="M. Pierre Tchuente"
                        />
                        <ElisaInput
                            label={t('surveillantGeneral')}
                            value={formData.surveillantGeneralNom}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('surveillantGeneralNom', e.target.value)}
                            placeholder="M. Paul Atangana"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <StepperModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('form.titreCreer')}
            description={t('form.titreCreerDesc')}
            steps={steps}
            onSubmit={handleSubmit}
            size="3xl"
            isSubmitting={creer.isPending}
        />
    );
}
