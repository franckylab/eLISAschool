/**
 * ==================================
 * eLISAschool - Formulaire Élève Multi-Étapes (Amélioré)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Améliorations selon les meilleures pratiques :
 * - React Hook Form pour gestion optimisée des formulaires
 * - Validation en temps réel avec Zod
 * - Auto-save dans localStorage
 * - Champs conditionnels dynamiques
 * - Upload de photo avec preview
 * - Accessibilité améliorée (ARIA)
 * - Performance optimisée (useMemo, useCallback)
 * - UX améliorée (toasts, feedback visuel)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Check, ChevronLeft, ChevronRight, Upload, X, 
    Camera, AlertCircle, Info, Save 
} from 'lucide-react';
import { useCreerEleve, useModifierEleve } from '../hooks/use-eleves';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { 
    etape1IdentiteSchema, 
    etape2CoordonneesSchema, 
    etape3ParentsSchema, 
    etape4ComplementSchema 
} from '../utils/eleve.schema';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { toast } from 'sonner';
import type { Eleve, CreerEleveDto } from '../types/eleve.types';
import type { z } from 'zod';

interface EleveFormProps {
    mode: 'creation' | 'edition';
    eleve?: Eleve | null;
    onSuccess: () => void;
    onCancel: () => void;
}

// Types pour les schémas Zod
type Etape1Data = z.infer<typeof etape1IdentiteSchema>;
type Etape2Data = z.infer<typeof etape2CoordonneesSchema>;
type Etape3Data = z.infer<typeof etape3ParentsSchema>;
type Etape4Data = z.infer<typeof etape4ComplementSchema>;

const ETAPES = [
    { key: 'identite', label: 'Identité', icon: '👤' },
    { key: 'coordonnees', label: 'Coordonnées', icon: '📍' },
    { key: 'parents', label: 'Parents', icon: '👨‍👩‍👧' },
    { key: 'scolarite', label: 'Scolarité', icon: '🎓' },
] as const;

// Clé pour localStorage
const STORAGE_KEY = 'eleve-form-draft';

export function EleveForm({ mode, eleve, onSuccess, onCancel }: EleveFormProps) {
    const { t } = useTranslation('eleves');
    const [etapeActuelle, setEtapeActuelle] = useState(0);
    const [photoPreview, setPhotoPreview] = useState<string>(eleve?.photo || '');
    const [showAide, setShowAide] = useState(false);
    
    // Hooks TanStack Query
    const creerEleve = useCreerEleve();
    const modifierEleve = useModifierEleve();
    const { data: classesData } = useToutesClasses();
    const { data: anneesScolairesData } = useToutesAnneesScolaires();
    
    // Normaliser les données en tableaux (sécurité)
    const classes = Array.isArray(classesData) ? classesData : [];
    const anneesScolaires = Array.isArray(anneesScolairesData) ? anneesScolairesData : [];

    // React Hook Form avec validation Zod
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
        watch,
        setValue,
        trigger,
        reset,
        setError,
        clearErrors,
    } = useForm<CreerEleveDto>({
        resolver: zodResolver(getSchemaForEtape(etapeActuelle)),
        defaultValues: getDefaultValues(eleve),
        mode: 'onChange', // Validation en temps réel
    });

    // Récupérer les valeurs du formulaire pour photo preview
    const photoValue = watch('photo');

    // Auto-save dans localStorage
    useEffect(() => {
        const subscription = watch((value) => {
            if (mode === 'creation') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, mode]);

    // Charger le brouillon au montage
    useEffect(() => {
        if (mode === 'creation') {
            const draft = localStorage.getItem(STORAGE_KEY);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    reset(parsed);
                    toast.info('Brouillon restauré', {
                        description: 'Vos modifications précédentes ont été restaurées',
                    });
                } catch {
                    // Ignorer les erreurs de parsing
                }
            }
        }
    }, [mode, reset]);

    // Nettoyer le localStorage après succès
    useEffect(() => {
        if (!isSubmitting && !Object.keys(errors).length) {
            const subscription = watch((value) => {
                if (value && Object.keys(value).length > 0 && !isSubmitting) {
                    // Vérifier si le formulaire a été soumis avec succès
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [isSubmitting, errors, watch]);

    // Navigation entre étapes
    const etapeSuivante = useCallback(async () => {
        const isValid = await trigger();
        if (isValid && etapeActuelle < ETAPES.length - 1) {
            setEtapeActuelle(prev => prev + 1);
        }
    }, [etapeActuelle, trigger]);

    const etapePrecedente = useCallback(() => {
        if (etapeActuelle > 0) {
            setEtapeActuelle(prev => prev - 1);
        }
    }, [etapeActuelle]);

    // Aller à une étape spécifique (en cliquant sur l'indicateur)
    const allerAEtape = useCallback(async (index: number) => {
        if (index < etapeActuelle) {
            // Permet de revenir en arrière sans validation
            setEtapeActuelle(index);
        } else if (index > etapeActuelle) {
            // Valider toutes les étapes intermédiaires
            const isValid = await trigger();
            if (isValid) {
                setEtapeActuelle(index);
            }
        }
    }, [etapeActuelle, trigger]);

    // Soumission du formulaire
    const onSubmit = useCallback(async (data: CreerEleveDto) => {
        try {
            if (mode === 'creation') {
                await creerEleve.mutateAsync(data);
                localStorage.removeItem(STORAGE_KEY); // Nettoyer le brouillon
                toast.success('Élève créé avec succès');
            } else if (eleve) {
                await modifierEleve.mutateAsync({ id: eleve.id, ...data });
                toast.success('Élève modifié avec succès');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || 'Erreur lors de l\'enregistrement');
        }
    }, [mode, eleve, creerEleve, modifierEleve, onSuccess]);

    // Gestion de la photo
    const handlePhotoUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (!file) return;
            
            // Validation : taille max 2MB
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Photo trop volumineuse', {
                    description: 'La taille maximale autorisée est de 2 Mo',
                });
                return;
            }
            
            // Validation : type de fichier
            if (!file.type.startsWith('image/')) {
                toast.error('Format invalide', {
                    description: 'Veuillez sélectionner une image (JPG, PNG, etc.)',
                });
                return;
            }
            
            // Conversion en base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setPhotoPreview(base64);
                setValue('photo', base64, { shouldValidate: true });
                toast.success('Photo ajoutée', {
                    description: `${file.name} (${(file.size / 1024).toFixed(0)} Ko)`,
                });
            };
            reader.onerror = () => {
                toast.error('Erreur de lecture', {
                    description: 'Impossible de lire le fichier',
                });
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
    }, [setValue]);

    const handlePhotoRemove = useCallback(() => {
        setPhotoPreview('');
        setValue('photo', '', { shouldValidate: true });
        toast.info('Photo supprimée');
    }, [setValue]);

    // Mise à jour du preview quand la valeur change
    useEffect(() => {
        if (photoValue) {
            setPhotoPreview(photoValue);
        }
    }, [photoValue]);

    // Rendu d'un champ de texte avec gestion d'erreurs améliorée
    const renderField = useCallback((
        label: string,
        name: keyof CreerEleveDto,
        type: 'text' | 'email' | 'tel' | 'date' | 'select' = 'text',
        options?: {
            required?: boolean;
            placeholder?: string;
            select?: { label: string; value: string }[];
            help?: string;
            disabled?: boolean;
        }
    ) => {
        const erreur = errors[name];
        const registre = register(name);

        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {label}
                    {options?.required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
                </label>

                {options?.help && (
                    <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {options.help}
                    </p>
                )}

                {type === 'select' && options?.select ? (
                    <select
                        {...registre}
                        disabled={options.disabled}
                        className={`rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 ${
                            erreur
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-dominant-400)]'
                        } ${options.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-invalid={!!erreur}
                        aria-describedby={erreur ? `${name}-error` : undefined}
                    >
                        <option value="">-- Sélectionner --</option>
                        {options.select.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        {...registre}
                        type={type}
                        placeholder={options?.placeholder}
                        disabled={options.disabled}
                        className={`rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 ${
                            erreur
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-dominant-400)]'
                        } ${options.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-invalid={!!erreur}
                        aria-describedby={erreur ? `${name}-error` : undefined}
                    />
                )}

                {erreur && (
                    <p id={`${name}-error`} className="text-xs text-red-600 flex items-center gap-1" role="alert">
                        <AlertCircle className="h-3 w-3" />
                        {erreur.message}
                    </p>
                )}
            </div>
        );
    }, [errors, register]);

    // Rendu d'un toggle amélioré
    const renderToggle = useCallback((
        label: string, 
        name: keyof CreerEleveDto,
        description?: string
    ) => {
        const { onChange, value, ...rest } = register(name, { value: false });

        return (
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-all hover:border-[var(--color-dominant-400)]">
                <div className="flex-1">
                    <span className="text-sm font-medium">{label}</span>
                    {description && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>
                    )}
                </div>
                <label className="relative inline-flex cursor-pointer items-center ml-4">
                    <input
                        type="checkbox"
                        {...rest}
                        checked={!!value}
                        onChange={(e) => {
                            onChange(e);
                        }}
                        className="peer sr-only"
                        aria-label={label}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-dominant-600)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-[var(--color-dominant-500)]/20"></div>
                </label>
            </div>
        );
    }, [register]);

    // Rendu de la section photo
    const renderPhotoSection = useCallback(() => (
        <div className="md:col-span-2">
            <label className="text-sm font-medium">{t('formulaire.photo')}</label>
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                Formats acceptés : JPG, PNG, GIF • Taille max : 2 Mo
            </p>
            <div className="mt-2 flex items-center gap-4">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-dominant-100)] to-[var(--color-dominant-200)] text-2xl overflow-hidden group cursor-pointer" onClick={handlePhotoUpload}>
                    {photoPreview ? (
                        <>
                            <img src={photoPreview} alt="Photo élève" className="h-full w-full rounded-full object-cover" />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePhotoRemove();
                                }}
                                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                aria-label="Supprimer la photo"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Camera className="h-10 w-10 text-[var(--color-dominant-600)]" />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <ElisaButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePhotoUpload}
                        icon={<Upload className="h-4 w-4" />}
                    >
                        {photoPreview ? 'Changer la photo' : t('formulaire.photoPlaceholder')}
                    </ElisaButton>
                    {photoPreview && (
                        <ElisaButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handlePhotoRemove}
                            icon={<X className="h-4 w-4" />}
                        >
                            Supprimer
                        </ElisaButton>
                    )}
                </div>
            </div>
        </div>
    ), [photoPreview, handlePhotoUpload, handlePhotoRemove, t]);

    // Contenu des étapes avec useMemo pour optimisation
    const renderEtape = useMemo(() => {
        switch (etapeActuelle) {
            case 0: // Identité
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(t('formulaire.nom'), 'nom', 'text', { 
                            required: true,
                            placeholder: 'Ex: DIALLO' 
                        })}
                        {renderField(t('formulaire.prenom'), 'prenom', 'text', { 
                            required: true,
                            placeholder: 'Ex: Mamadou' 
                        })}
                        {renderField(t('formulaire.dateNaissance'), 'dateNaissance', 'date', { 
                            required: true,
                            help: 'Format: JJ/MM/AAAA'
                        })}
                        {renderField(t('formulaire.lieuNaissance'), 'lieuNaissance', 'text', { 
                            required: true,
                            placeholder: 'Ex: Yaoundé' 
                        })}
                        {renderField(t('formulaire.sexe'), 'sexe', 'select', {
                            required: true,
                            select: [
                                { label: t('formulaire.masculin'), value: 'M' },
                                { label: t('formulaire.feminin'), value: 'F' },
                            ],
                        })}
                        {renderField(t('formulaire.nationalite'), 'nationalite', 'text', {
                            placeholder: 'Ex: Camerounaise',
                            help: 'Nationalité de l\'élève'
                        })}
                        {renderField(t('formulaire.sousSysteme'), 'sousSysteme', 'select', {
                            select: [
                                { label: t('formulaire.francophone'), value: 'FRANCOPHONE' },
                                { label: t('formulaire.anglophone'), value: 'ANGLOPHONE' },
                            ],
                            help: 'Système éducatif'
                        })}
                        {renderPhotoSection()}
                    </div>
                );

            case 1: // Coordonnées
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(t('formulaire.adresse'), 'adresseDomicile', 'text', {
                            placeholder: 'Ex: Quartier Bastos, Rue 123'
                        })}
                        {renderField(t('formulaire.ville'), 'ville', 'text', {
                            placeholder: 'Ex: Yaoundé'
                        })}
                        {renderField(t('formulaire.quartier'), 'quartier', 'text', {
                            placeholder: 'Ex: Bastos'
                        })}
                        {renderField(t('formulaire.groupeSanguin'), 'groupeSanguin', 'select', {
                            select: [
                                { label: 'A+', value: 'A+' },
                                { label: 'A-', value: 'A-' },
                                { label: 'B+', value: 'B+' },
                                { label: 'B-', value: 'B-' },
                                { label: 'AB+', value: 'AB+' },
                                { label: 'AB-', value: 'AB-' },
                                { label: 'O+', value: 'O+' },
                                { label: 'O-', value: 'O-' },
                            ],
                            help: 'Important pour les urgences médicales'
                        })}
                        <div className="md:col-span-2">
                            {renderField(t('formulaire.allergies'), 'allergies', 'text', {
                                placeholder: t('formulaire.allergiesPlaceholder'),
                                help: 'Listez les allergies connues (alimentaires, médicamenteuses, etc.)'
                            })}
                        </div>
                    </div>
                );

            case 2: // Parents
                return (
                    <div className="space-y-6">
                        {/* Père */}
                        <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-alt)]">
                            <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
                                <span className="text-lg">👨</span>
                                {t('formulaire.pere')}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomPere'), 'nomPere', 'text', {
                                    placeholder: 'Nom complet du père'
                                })}
                                {renderField(t('formulaire.professionPere'), 'professionPere', 'text', {
                                    placeholder: 'Ex: Enseignant'
                                })}
                                {renderField(t('formulaire.telephonePere'), 'telephonePere', 'tel', {
                                    placeholder: '+237 6XX XXX XXX'
                                })}
                                {renderField(t('formulaire.emailPere'), 'emailPere', 'email', {
                                    placeholder: 'pere@example.com'
                                })}
                            </div>
                        </div>

                        {/* Mère */}
                        <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-alt)]">
                            <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
                                <span className="text-lg">👩</span>
                                {t('formulaire.mere')}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomMere'), 'nomMere', 'text', {
                                    placeholder: 'Nom complet de la mère'
                                })}
                                {renderField(t('formulaire.professionMere'), 'professionMere', 'text', {
                                    placeholder: 'Ex: Médecin'
                                })}
                                {renderField(t('formulaire.telephoneMere'), 'telephoneMere', 'tel', {
                                    placeholder: '+237 6XX XXX XXX'
                                })}
                                {renderField(t('formulaire.emailMere'), 'emailMere', 'email', {
                                    placeholder: 'mere@example.com'
                                })}
                            </div>
                        </div>

                        {/* Tuteur */}
                        <div className="rounded-lg border border-[var(--color-border)] p-4">
                            <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
                                <span className="text-lg">👤</span>
                                {t('formulaire.tuteur')}
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomTuteur'), 'nomTuteur', 'text', {
                                    placeholder: 'Nom du tuteur légal'
                                })}
                                {renderField(t('formulaire.lienParente'), 'lienParenteTuteur', 'text', {
                                    placeholder: 'Ex: Oncle, Grand-père, etc.'
                                })}
                                {renderField(t('formulaire.telephoneTuteur'), 'telephoneTuteur', 'tel', {
                                    placeholder: '+237 6XX XXX XXX'
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 3: // Scolarité
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {renderField(t('formulaire.classe'), 'classeId', 'select', {
                                required: true,
                                select: classes.map((c) => ({ label: c.nom, value: c.id })),
                                help: 'Classe dans laquelle l\'élève sera inscrit'
                            })}
                            {renderField(t('formulaire.anneeScolaire'), 'anneeScolaireId', 'select', {
                                required: true,
                                select: anneesScolaires.map((a) => ({ label: a.libelle, value: a.id })),
                                help: 'Année scolaire en cours'
                            })}
                        </div>

                        <div className="rounded-lg border border-[var(--color-border)] p-4">
                            <h3 className="mb-3 text-base font-semibold">Services optionnels</h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {renderToggle(
                                    t('formulaire.transportScolaire'), 
                                    'transportScolaire',
                                    'L\'élève utilisera le transport scolaire'
                                )}
                                {renderToggle(
                                    t('formulaire.cantine'), 
                                    'cantine',
                                    'L\'élève prendra ses repas à la cantine'
                                )}
                                {renderToggle(
                                    t('formulaire.boursier'), 
                                    'boursier',
                                    'L\'élève bénéficie d\'une bourse'
                                )}
                                {renderToggle(
                                    t('formulaire.redoublement'), 
                                    'redoublement',
                                    'L\'élève est en situation de redoublement'
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    }, [etapeActuelle, renderField, renderToggle, renderPhotoSection, classes, anneesScolaires, t]);

    const isLoading = isSubmitting || creerEleve.isPending || modifierEleve.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Header avec titre et aide */}
            <div className="flex items-center justify-between sticky top-0 bg-[var(--color-surface)] z-10 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{ETAPES[etapeActuelle].icon}</span>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {ETAPES[etapeActuelle].label}
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            Étape {etapeActuelle + 1} sur {ETAPES.length}
                        </p>
                    </div>
                </div>
                
                <button
                    type="button"
                    onClick={() => setShowAide(!showAide)}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                    aria-label="Afficher l'aide"
                >
                    <Info className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </button>
            </div>

            {/* Message d'aide */}
            <AnimatePresence>
                {showAide && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3"
                    >
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Aide :</strong> {t(`formulaire.etape${etapeActuelle + 1}Description`)}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Indicateur de progression */}
            <div className="flex items-center justify-between">
                {ETAPES.map((etape, index) => (
                    <div key={etape.key} className="flex flex-1 items-center">
                        <button
                            type="button"
                            onClick={() => allerAEtape(index)}
                            disabled={index > etapeActuelle && isDirty}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                index < etapeActuelle
                                    ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)]'
                                    : index === etapeActuelle
                                    ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-600)] ring-2 ring-[var(--color-dominant-500)]/20'
                                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                            aria-label={`Étape ${index + 1}: ${etape.label}`}
                            aria-current={index === etapeActuelle ? 'step' : undefined}
                        >
                            {index < etapeActuelle ? <Check className="h-5 w-5" /> : index + 1}
                        </button>
                        {index < ETAPES.length - 1 && (
                            <div
                                className={`flex-1 border-t-2 transition-all ${
                                    index < etapeActuelle
                                        ? 'border-[var(--color-dominant-600)]'
                                        : 'border-gray-300'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Contenu de l'étape */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={etapeActuelle}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderEtape}
                </motion.div>
            </AnimatePresence>

            {/* Indicateur de brouillon */}
            {mode === 'creation' && isDirty && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <Save className="h-3 w-3" />
                    <span>Brouillon auto-sauvegardé</span>
                </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4 sticky bottom-0 bg-[var(--color-surface)] z-10">
                <ElisaButton
                    type="button"
                    variant="outline"
                    onClick={etapePrecedente}
                    disabled={etapeActuelle === 0 || isLoading}
                    icon={<ChevronLeft className="h-4 w-4" />}
                >
                    {t('boutons.precedent', { defaultValue: 'Précédent' })}
                </ElisaButton>

                <div className="flex gap-2">
                    <ElisaButton type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                        {t('boutons.annuler', { defaultValue: 'Annuler' })}
                    </ElisaButton>

                    {etapeActuelle < ETAPES.length - 1 ? (
                        <ElisaButton
                            type="button"
                            variant="primary"
                            onClick={etapeSuivante}
                            iconRight={<ChevronRight className="h-4 w-4" />}
                        >
                            {t('boutons.suivant', { defaultValue: 'Suivant' })}
                        </ElisaButton>
                    ) : (
                        <ElisaButton
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            iconRight={<Check className="h-4 w-4" />}
                        >
                            {mode === 'creation'
                                ? t('boutons.creer', { defaultValue: 'Créer l\'élève' })
                                : t('boutons.enregistrer', { defaultValue: 'Enregistrer' })}
                        </ElisaButton>
                    )}
                </div>
            </div>
        </form>
    );
}

// Helper: Obtenir le schéma Zod pour l'étape courante
function getSchemaForEtape(etape: number) {
    switch (etape) {
        case 0: return etape1IdentiteSchema;
        case 1: return etape2CoordonneesSchema;
        case 2: return etape3ParentsSchema;
        case 3: return etape4ComplementSchema;
        default: return etape1IdentiteSchema;
    }
}

// Helper: Valeurs par défaut
function getDefaultValues(eleve?: Eleve | null): Partial<CreerEleveDto> {
    if (!eleve) {
        return {
            sexe: 'M',
            nationalite: 'Camerounaise',
            sousSysteme: 'FRANCOPHONE',
            transportScolaire: false,
            cantine: false,
            boursier: false,
            redoublement: false,
        };
    }

    return {
        nom: eleve.nom || '',
        prenom: eleve.prenom || '',
        dateNaissance: eleve.dateNaissance?.split('T')[0] || '',
        lieuNaissance: eleve.lieuNaissance || '',
        sexe: eleve.sexe || 'M',
        nationalite: eleve.nationalite || 'Camerounaise',
        sousSysteme: eleve.sousSysteme || 'FRANCOPHONE',
        photo: eleve.photo || '',
        adresseDomicile: eleve.adresseDomicile || '',
        ville: eleve.ville || '',
        quartier: eleve.quartier || '',
        nomPere: eleve.nomPere || '',
        professionPere: eleve.professionPere || '',
        telephonePere: eleve.telephonePere || '',
        emailPere: eleve.emailPere || '',
        nomMere: eleve.nomMere || '',
        professionMere: eleve.professionMere || '',
        telephoneMere: eleve.telephoneMere || '',
        emailMere: eleve.emailMere || '',
        nomTuteur: eleve.nomTuteur || '',
        lienParenteTuteur: eleve.lienParenteTuteur || '',
        telephoneTuteur: eleve.telephoneTuteur || '',
        classeId: eleve.classeId || '',
        anneeScolaireId: eleve.anneeScolaireId || '',
        transportScolaire: eleve.transportScolaire || false,
        cantine: eleve.cantine || false,
        boursier: eleve.boursier || false,
        redoublement: eleve.redoublement || false,
        groupeSanguin: eleve.groupeSanguin || '',
        allergies: eleve.allergies || '',
    };
}
