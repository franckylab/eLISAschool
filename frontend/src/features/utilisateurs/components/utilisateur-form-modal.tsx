/**
 * ==================================
 * eLISAschool - Formulaire Modal Utilisateur
 * ==================================
 * Version: 3.1.0
 * Auteur: franck arlos chendjou
 *
 * Modal de création/édition d'utilisateur avec validation
 * Sections séparées visuellement par border-b, i18n, dark mode
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Shield, Calendar, MapPin, KeyRound } from 'lucide-react';
import { useCreerUtilisateur, useModifierUtilisateur } from '../hooks/use-utilisateurs';
import { useTousRoles } from '../hooks/use-roles-permissions';
import { StepperModal, type StepperStep } from '@/components/modals/StepperModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaInput, ElisaSelect, SectionSeparator } from '@/components/ui';
import type { Utilisateur, CreerUtilisateurDto } from '../types/utilisateur.types';

const FORM_INIT: CreerUtilisateurDto = {
    email: '',
    nom: '',
    prenom: '',
    telephone: '',
    role: '',
    motDePasse: '',
    profil: {
        adresse: '',
        dateNaissance: '',
        genre: 'M',
    },
};

interface UtilisateurFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'creation' | 'edition';
    utilisateur?: Utilisateur;
}

export function UtilisateurFormModal({ 
    open, 
    onOpenChange, 
    mode, 
    utilisateur 
}: UtilisateurFormModalProps) {
    const { t } = useTranslation('utilisateurs');
    const creer = useCreerUtilisateur();
    const modifier = useModifierUtilisateur();
    const { data: roles } = useTousRoles();

    const roleOptions = useMemo(
        () => roles?.map((role) => ({ value: role.code, label: role.libelle })) ?? [],
        [roles],
    );

    const [formData, setFormData] = useState<CreerUtilisateurDto>(FORM_INIT);

    const [erreurs, setErreurs] = useState<Record<string, string>>({});
    const [showConfirm, setShowConfirm] = useState(false);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    const handleReset = () => {
        setFormData(FORM_INIT);
        setErreurs({});
    };

    useEffect(() => {
        if (!open) {
            handleReset();
            return;
        }
        if (mode === 'edition' && utilisateur) {
            setFormData({
                email: utilisateur.email,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                telephone: utilisateur.telephone || '',
                role: utilisateur.role,
                motDePasse: '',
                profil: {
                    adresse: utilisateur.profil?.adresse || '',
                    dateNaissance: utilisateur.profil?.dateNaissance || '',
                    genre: (utilisateur.profil?.genre as 'M' | 'F' | 'A') || 'M',
                },
            });
        }
    }, [mode, utilisateur, open]);

    const validerFormulaire = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.email) {
            nouvellesErreurs.email = t('validation.emailRequis');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            nouvellesErreurs.email = t('validation.emailInvalide');
        }

        if (!formData.nom) nouvellesErreurs.nom = t('validation.nomRequis');
        if (!formData.prenom) nouvellesErreurs.prenom = t('validation.prenomRequis');
        if (!formData.role) nouvellesErreurs.role = t('validation.roleRequis');

        if (mode === 'creation' && !formData.motDePasse) {
            nouvellesErreurs.motDePasse = t('validation.motDePasseRequis');
        } else if (formData.motDePasse && formData.motDePasse.length < 8) {
            nouvellesErreurs.motDePasse = t('validation.motDePasseTropCourt');
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validerFormulaire()) return;

        try {
            if (mode === 'creation') {
                await creer.mutateAsync(formData);
            } else if (utilisateur) {
                await modifier.mutateAsync({ id: utilisateur.id, ...formData });
            }
            onOpenChange(false);
        } catch {
            // L'erreur est exposée via creer.error / modifier.error
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.') as [keyof CreerUtilisateurDto, string];
                return {
                    ...prev,
                    [parent]: {
                        ...(prev[parent] as Record<string, unknown>),
                        [child]: value,
                    },
                };
            }
            return { ...prev, [field]: value };
        });
        if (erreurs[field]) {
            setErreurs(prev => {
                const newErreurs = { ...prev };
                delete newErreurs[field];
                return newErreurs;
            });
        }
    };

    const isLoading = creer.isPending || modifier.isPending;
    const apiError = creer.error || modifier.error;

    const titre = mode === 'creation' ? t('form.titreCreation') : t('form.titreEdition');
    const description = mode === 'creation' ? t('form.descriptionCreation') : t('form.descriptionEdition');

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowConfirm(true);
        } else {
            onOpenChange(false);
        }
    };

    // Définition des étapes pour StepperModal
    const steps: StepperStep[] = [
        {
            id: 'identite-contact',
            label: t('form.etapeIdentite', { defaultValue: 'Identité & Contact' }),
            icon: User,
            content: renderEtapeIdentiteContact(),
        },
        {
            id: 'role-acces',
            label: t('form.etapeRole', { defaultValue: 'Rôle & Accès' }),
            icon: Shield,
            content: renderEtapeRoleAcces(),
            validate: validerFormulaire,
            validateError: erreurs.role || erreurs.email || erreurs.motDePasse,
        },
        {
            id: 'profil',
            label: t('form.etapeProfil', { defaultValue: 'Profil' }),
            icon: MapPin,
            content: renderEtapeProfil(),
        },
    ];

    // Rendu Étape 1 : Identité & Contact
    function renderEtapeIdentiteContact() {
        return (
            <div className="space-y-6">
                {apiError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
                        {apiError instanceof Error ? apiError.message : t('form.erreurSauvegarde')}
                    </div>
                )}
                {/* Identité */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <User className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.informationsPersonnelles')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('form.prenom')}
                            value={formData.prenom}
                            onChange={(e) => handleChange('prenom', e.target.value)}
                            error={erreurs.prenom}
                            placeholder={t('form.placeholderPrenom')}
                            autoFocus
                            required
                        />
                        <ElisaInput
                            label={t('form.nom')}
                            value={formData.nom}
                            onChange={(e) => handleChange('nom', e.target.value)}
                            error={erreurs.nom}
                            placeholder={t('form.placeholderNom')}
                            required
                        />
                    </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Mail className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.contact')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('form.email')}
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={erreurs.email}
                            placeholder={t('form.placeholderEmail')}
                            icon={<Mail className="h-4 w-4" />}
                            required
                        />
                        <ElisaInput
                            label={t('form.telephone')}
                            type="tel"
                            value={formData.telephone || ''}
                            onChange={(e) => handleChange('telephone', e.target.value)}
                            placeholder={t('form.placeholderTelephone')}
                            icon={<Phone className="h-4 w-4" />}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Rendu Étape 2 : Rôle & Accès
    function renderEtapeRoleAcces() {
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.securiteRole')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaSelect
                            label={t('form.role')}
                            value={formData.role}
                            onValueChange={(value) => handleChange('role', value)}
                            placeholder={t('form.placeholderRole')}
                            options={roleOptions}
                            error={erreurs.role}
                            required
                        />

                        {mode === 'creation' && (
                            <ElisaInput
                                label={t('form.motDePasse')}
                                type="password"
                                value={formData.motDePasse}
                                onChange={(e) => handleChange('motDePasse', e.target.value)}
                                error={erreurs.motDePasse}
                                placeholder={t('form.placeholderMotDePasse')}
                                icon={<KeyRound className="h-4 w-4" />}
                                required
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Rendu Étape 3 : Profil
    function renderEtapeProfil() {
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('form.profilOptionnel')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ElisaInput
                            label={t('form.dateNaissance')}
                            type="date"
                            value={formData.profil?.dateNaissance || ''}
                            onChange={(e) => handleChange('profil.dateNaissance', e.target.value)}
                            icon={<Calendar className="h-4 w-4" />}
                        />
                        <ElisaSelect
                            label={t('form.genre')}
                            value={formData.profil?.genre || 'M'}
                            onValueChange={(value) => handleChange('profil.genre', value)}
                            options={[
                                { value: 'M', label: t('masculin') },
                                { value: 'F', label: t('feminin') },
                                { value: 'A', label: t('autreGenre') },
                            ]}
                        />
                        <div className="md:col-span-2">
                            <ElisaInput
                                label={t('form.adresse')}
                                value={formData.profil?.adresse || ''}
                                onChange={(e) => handleChange('profil.adresse', e.target.value)}
                                placeholder={t('form.placeholderAdresse')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <StepperModal
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen && hasUnsavedChanges) {
                        setShowConfirm(true);
                        return;
                    }
                    onOpenChange(nextOpen);
                }}
                title={titre}
                description={description}
                steps={steps}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                size="2xl"
                isSubmitting={isLoading}
            />

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                variant="warning"
                title={t('form.confirmAnnulerTitre')}
                description={t('form.confirmAnnulerDescription')}
                confirmText={t('form.confirmAnnulerConfirmer')}
                cancelText={t('form.confirmAnnulerRetour')}
                onConfirm={() => {
                    setShowConfirm(false);
                    onOpenChange(false);
                }}
            />
        </>
    );
}
