/**
 * ==================================
 * eLISAschool - Formulaire Élève Multi-Étapes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useCreerEleve, useModifierEleve } from '../hooks/use-eleves';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { etape1IdentiteSchema, etape2CoordonneesSchema, etape3ParentsSchema, etape4ComplementSchema } from '../utils/eleve.schema';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Eleve, CreerEleveDto } from '../types/eleve.types';

interface EleveFormProps {
    mode: 'creation' | 'edition';
    eleve?: Eleve;
    onSuccess: () => void;
    onCancel: () => void;
}

const ETAPES = ['etape1', 'etape2', 'etape3', 'etape4'] as const;

export function EleveForm({ mode, eleve, onSuccess, onCancel }: EleveFormProps) {
    const { t } = useTranslation('eleves');
    const [etapeActuelle, setEtapeActuelle] = useState(0);
    const creerEleve = useCreerEleve();
    const modifierEleve = useModifierEleve();

    const { data: classes } = useToutesClasses();
    const { data: anneesScolaires } = useToutesAnneesScolaires();

    // Données du formulaire
    const [formData, setFormData] = useState<Partial<CreerEleveDto>>({
        nom: eleve?.nom || '',
        prenom: eleve?.prenom || '',
        dateNaissance: eleve?.dateNaissance?.split('T')[0] || '',
        lieuNaissance: eleve?.lieuNaissance || '',
        sexe: eleve?.sexe || 'M',
        nationalite: eleve?.nationalite || 'Camerounaise',
        sousSysteme: eleve?.sousSysteme || 'FRANCOPHONE',
        photo: eleve?.photo || '',
        adresseDomicile: eleve?.adresseDomicile || '',
        ville: eleve?.ville || '',
        quartier: eleve?.quartier || '',
        nomPere: eleve?.nomPere || '',
        professionPere: eleve?.professionPere || '',
        telephonePere: eleve?.telephonePere || '',
        emailPere: eleve?.emailPere || '',
        nomMere: eleve?.nomMere || '',
        professionMere: eleve?.professionMere || '',
        telephoneMere: eleve?.telephoneMere || '',
        emailMere: eleve?.emailMere || '',
        nomTuteur: eleve?.nomTuteur || '',
        lienParenteTuteur: eleve?.lienParenteTuteur || '',
        telephoneTuteur: eleve?.telephoneTuteur || '',
        classeId: eleve?.classeId || '',
        anneeScolaireId: eleve?.anneeScolaireId || '',
        transportScolaire: eleve?.transportScolaire || false,
        cantine: eleve?.cantine || false,
        boursier: eleve?.boursier || false,
        redoublement: eleve?.redoublement || false,
        groupeSanguin: eleve?.groupeSanguin || '',
        allergies: eleve?.allergies || '',
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    // Validation de l'étape courante
    const validerEtape = (): boolean => {
        setErreurs({});
        let schema: any;

        switch (etapeActuelle) {
            case 0:
                schema = etape1IdentiteSchema;
                break;
            case 1:
                schema = etape2CoordonneesSchema;
                break;
            case 2:
                schema = etape3ParentsSchema;
                break;
            case 3:
                schema = etape4ComplementSchema;
                break;
            default:
                return true;
        }

        const result = schema.safeParse(formData);
        if (!result.success) {
            const erreursFormat: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                if (err.path[0]) {
                    erreursFormat[err.path[0].toString()] = err.message;
                }
            });
            setErreurs(erreursFormat);
            return false;
        }

        return true;
    };

    // Navigation
    const etapePrecedente = () => {
        if (etapeActuelle > 0) {
            setEtapeActuelle(etapeActuelle - 1);
        }
    };

    const etapeSuivante = () => {
        if (validerEtape()) {
            if (etapeActuelle < ETAPES.length - 1) {
                setEtapeActuelle(etapeActuelle + 1);
            }
        }
    };

    // Soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validerEtape()) return;

        try {
            if (mode === 'creation') {
                await creerEleve.mutateAsync(formData as CreerEleveDto);
            } else if (eleve) {
                await modifierEleve.mutateAsync({ id: eleve.id, ...formData });
            }
            onSuccess();
        } catch (error) {
            // Erreur déjà gérée par le hook (toast)
        }
    };

    const isLoading = creerEleve.isPending || modifierEleve.isPending;

    // Rendu des champs avec gestion d'erreurs
    const renderField = (
        label: string,
        name: string,
        type: string = 'text',
        options?: { required?: boolean; placeholder?: string; select?: { label: string; value: string }[] }
    ) => {
        const erreur = erreurs[name];
        const value = (formData as any)[name] || '';

        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {label}
                    {options?.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {options?.select ? (
                    <select
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, [name]: e.target.value })}
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 ${
                            erreur
                                ? 'border-red-500 bg-red-50'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
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
                        type={type}
                        value={value}
                        placeholder={options?.placeholder}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [name]: e.target.value })}
                        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 ${
                            erreur
                                ? 'border-red-500 bg-red-50'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                    />
                )}

                {erreur && <p className="text-xs text-red-600">{erreur}</p>}
            </div>
        );
    };

    const renderToggle = (label: string, name: string) => (
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <span className="text-sm font-medium">{label}</span>
            <label className="relative inline-flex cursor-pointer items-center">
                <input
                    type="checkbox"
                    checked={(formData as any)[name] || false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [name]: e.target.checked })}
                    className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 dark:after:border-gray-600 after:bg-white dark:after:bg-gray-800 after:transition-all after:content-[''] peer-checked:bg-[var(--color-dominant-600)] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
        </div>
    );

    // Contenu des étapes
    const renderEtape = () => {
        switch (etapeActuelle) {
            case 0: // Identité
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(t('formulaire.nom'), 'nom', 'text', { required: true })}
                        {renderField(t('formulaire.prenom'), 'prenom', 'text', { required: true })}
                        {renderField(t('formulaire.dateNaissance'), 'dateNaissance', 'date', { required: true })}
                        {renderField(t('formulaire.lieuNaissance'), 'lieuNaissance', 'text', { required: true })}
                        {renderField(t('formulaire.sexe'), 'sexe', 'select', {
                            required: true,
                            select: [
                                { label: t('formulaire.masculin'), value: 'M' },
                                { label: t('formulaire.feminin'), value: 'F' },
                            ],
                        })}
                        {renderField(t('formulaire.nationalite'), 'nationalite')}
                        {renderField(t('formulaire.sousSysteme'), 'sousSysteme', 'select', {
                            select: [
                                { label: t('formulaire.francophone'), value: 'FRANCOPHONE' },
                                { label: t('formulaire.anglophone'), value: 'ANGLOPHONE' },
                            ],
                        })}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">{t('formulaire.photo')}</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-dominant-100)] text-2xl">
                                    {formData.photo ? (
                                        <img src={formData.photo} alt="Photo" className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        <Upload className="h-8 w-8 text-[var(--color-dominant-600)]" />
                                    )}
                                </div>
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // TODO: Implémenter upload photo
                                    }}
                                >
                                    {t('formulaire.photoPlaceholder')}
                                </ElisaButton>
                            </div>
                        </div>
                    </div>
                );

            case 1: // Coordonnées
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(t('formulaire.adresse'), 'adresseDomicile')}
                        {renderField(t('formulaire.ville'), 'ville')}
                        {renderField(t('formulaire.quartier'), 'quartier')}
                        {renderField(t('formulaire.telephone'), 'telephone', 'tel')}
                        {renderField(t('formulaire.email'), 'email', 'email')}
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
                        })}
                        <div className="md:col-span-2">
                            {renderField(t('formulaire.allergies'), 'allergies', 'text', {
                                placeholder: t('formulaire.allergiesPlaceholder'),
                            })}
                        </div>
                    </div>
                );

            case 2: // Parents
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">{t('formulaire.nomPere').replace('Nom du ', '')}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomPere'), 'nomPere')}
                                {renderField(t('formulaire.professionPere'), 'professionPere')}
                                {renderField(t('formulaire.telephonePere'), 'telephonePere', 'tel')}
                                {renderField(t('formulaire.emailPere'), 'emailPere', 'email')}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-lg font-semibold">{t('formulaire.nomMere').replace('Nom de la ', '')}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomMere'), 'nomMere')}
                                {renderField(t('formulaire.professionMere'), 'professionMere')}
                                {renderField(t('formulaire.telephoneMere'), 'telephoneMere', 'tel')}
                                {renderField(t('formulaire.emailMere'), 'emailMere', 'email')}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-lg font-semibold">{t('formulaire.nomTuteur').replace('Nom du ', '')}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {renderField(t('formulaire.nomTuteur'), 'nomTuteur')}
                                {renderField(t('formulaire.lienParente'), 'lienParenteTuteur')}
                                {renderField(t('formulaire.telephoneTuteur'), 'telephoneTuteur', 'tel')}
                            </div>
                        </div>
                    </div>
                );

            case 3: // Complément
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {renderField(t('formulaire.classe'), 'classeId', 'select', {
                                required: true,
                                select: classes?.map((c) => ({ label: c.nom, value: c.id })) || [],
                            })}
                            {renderField(t('formulaire.anneeScolaire'), 'anneeScolaireId', 'select', {
                                required: true,
                                select: anneesScolaires?.map((a) => ({ label: a.libelle, value: a.id })) || [],
                            })}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {renderToggle(t('formulaire.transportScolaire'), 'transportScolaire')}
                            {renderToggle(t('formulaire.cantine'), 'cantine')}
                            {renderToggle(t('formulaire.boursier'), 'boursier')}
                            {renderToggle(t('formulaire.redoublement'), 'redoublement')}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Indicateur de progression */}
            <div className="flex items-center justify-between">
                {ETAPES.map((_, index) => (
                    <div key={index} className="flex flex-1 items-center">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                index < etapeActuelle
                                    ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-600)] text-white'
                                    : index === etapeActuelle
                                    ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-600)]'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-300'
                            }`}
                        >
                            {index < etapeActuelle ? <Check className="h-5 w-5" /> : index + 1}
                        </div>
                        {index < ETAPES.length - 1 && (
                            <div
                                className={`flex-1 border-t-2 transition-all ${
                                    index < etapeActuelle
                                        ? 'border-[var(--color-dominant-600)]'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Labels des étapes */}
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                <span>{t('formulaire.etape1')}</span>
                <span>{t('formulaire.etape2')}</span>
                <span>{t('formulaire.etape3')}</span>
                <span>{t('formulaire.etape4')}</span>
            </div>

            {/* Contenu de l'étape */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={etapeActuelle}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[400px]"
                >
                    <h3 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                        {t(`formulaire.etape${etapeActuelle + 1}`)}
                    </h3>
                    <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
                        {t(`formulaire.etape${etapeActuelle + 1}Description`)}
                    </p>
                    {renderEtape()}
                </motion.div>
            </AnimatePresence>

            {/* Boutons de navigation */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <ElisaButton
                    type="button"
                    variant="outline"
                    onClick={etapePrecedente}
                    disabled={etapeActuelle === 0}
                    icon={<ChevronLeft className="h-4 w-4" />}
                >
                    {t('boutons.precedent', { defaultValue: 'Précédent' })}
                </ElisaButton>

                <div className="flex gap-2">
                    <ElisaButton type="button" variant="ghost" onClick={onCancel}>
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
                                ? t('boutons.creer', { defaultValue: 'Créer' })
                                : t('boutons.enregistrer', { defaultValue: 'Enregistrer' })}
                        </ElisaButton>
                    )}
                </div>
            </div>
        </form>
    );
}
