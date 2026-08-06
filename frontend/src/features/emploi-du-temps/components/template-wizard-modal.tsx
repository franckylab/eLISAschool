/**
 * ==================================
 * eLISAschool - Template Wizard Modal
 * ==================================
 * Wizard multi-étapes pour créer / modifier un template EDT
 * 4 étapes (StepperModal) :
 *  1. Identité (nom, description, partage)
 *  2. Calendrier (jours travaillés, plage horaire, durée créneau)
 *  3. Contraintes (max créneaux, max matière, max consécutifs)
 *  4. Preview (résumé visuel + validation)
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileText, Calendar, Shield, Eye,
    Clock, AlertTriangle, Users, Share2,
} from 'lucide-react';
import { StepperModal } from '@/components/modals/StepperModal';
import { useCreerTemplateEDT, useModifierTemplateEDT } from '../hooks/use-emploi-du-temps';
import type { TemplateEDT, TemplateEDTConfiguration } from '../types/edt.types';

/* ─── Types ─── */

interface TemplateWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: TemplateEDT | null;
}

const JOURS_SEMAINE = [
    { value: 'LUNDI', label: 'L' },
    { value: 'MARDI', label: 'Ma' },
    { value: 'MERCREDI', label: 'Me' },
    { value: 'JEUDI', label: 'J' },
    { value: 'VENDREDI', label: 'V' },
    { value: 'SAMEDI', label: 'S' },
] as const;

interface FormData {
    nom: string;
    description: string;
    estPartage: boolean;
    configuration: Required<Pick<TemplateEDTConfiguration,
        'joursTravailles' | 'heureDebutCours' | 'heureFinCours' | 'dureeCreneauStandard'
    >> & Pick<TemplateEDTConfiguration,
        'maxCreneauxParJour' | 'maxCreneauxMatiereParJour' | 'maxCreneauxConsecutifs'
    >;
}

const DEFAULT_FORM: FormData = {
    nom: '',
    description: '',
    estPartage: false,
    configuration: {
        joursTravailles: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'],
        heureDebutCours: '07:30',
        heureFinCours: '17:30',
        dureeCreneauStandard: 55,
        maxCreneauxParJour: 8,
        maxCreneauxMatiereParJour: 2,
        maxCreneauxConsecutifs: 2,
    },
};

/* ─── Composant principal ─── */

export function TemplateWizardModal({ open, onOpenChange, template }: TemplateWizardModalProps) {
    const { t } = useTranslation('emplois');
    const creerTemplate = useCreerTemplateEDT();
    const modifierTemplate = useModifierTemplateEDT();
    const isEditing = !!template;

    const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM });

    // Initialisation depuis le template (mode édition)
    useEffect(() => {
        if (template) {
            setForm({
                nom: template.nom ?? '',
                description: template.description ?? '',
                estPartage: template.estPartage ?? false,
                configuration: {
                    joursTravailles: template.configuration?.joursTravailles ?? DEFAULT_FORM.configuration.joursTravailles,
                    heureDebutCours: template.configuration?.heureDebutCours ?? DEFAULT_FORM.configuration.heureDebutCours,
                    heureFinCours: template.configuration?.heureFinCours ?? DEFAULT_FORM.configuration.heureFinCours,
                    dureeCreneauStandard: template.configuration?.dureeCreneauStandard ?? DEFAULT_FORM.configuration.dureeCreneauStandard,
                    maxCreneauxParJour: template.configuration?.maxCreneauxParJour ?? DEFAULT_FORM.configuration.maxCreneauxParJour,
                    maxCreneauxMatiereParJour: template.configuration?.maxCreneauxMatiereParJour ?? DEFAULT_FORM.configuration.maxCreneauxMatiereParJour,
                    maxCreneauxConsecutifs: template.configuration?.maxCreneauxConsecutifs ?? DEFAULT_FORM.configuration.maxCreneauxConsecutifs,
                },
            });
        } else {
            setForm({ ...DEFAULT_FORM });
        }
    }, [template, open]);

    // ─── Handlers ───
    const toggleJour = (jour: string) => {
        setForm(prev => ({
            ...prev,
            configuration: {
                ...prev.configuration,
                joursTravailles: prev.configuration.joursTravailles.includes(jour)
                    ? prev.configuration.joursTravailles.filter(j => j !== jour)
                    : [...prev.configuration.joursTravailles, jour],
            },
        }));
    };

    const updateConfig = <K extends keyof FormData['configuration']>(key: K, value: FormData['configuration'][K]) => {
        setForm(prev => ({
            ...prev,
            configuration: { ...prev.configuration, [key]: value },
        }));
    };

    // ─── Validators ───
    const validateIdentite = useCallback((): boolean => {
        return form.nom.trim().length >= 2;
    }, [form.nom]);

    const validateCalendrier = useCallback((): boolean => {
        return form.configuration.joursTravailles.length > 0
            && form.configuration.heureDebutCours < form.configuration.heureFinCours;
    }, [form.configuration.joursTravailles, form.configuration.heureDebutCours, form.configuration.heureFinCours]);

    const validateContraintes = useCallback((): boolean => {
        return (form.configuration.maxCreneauxParJour ?? 0) > 0
            && (form.configuration.maxCreneauxMatiereParJour ?? 0) > 0
            && (form.configuration.maxCreneauxConsecutifs ?? 0) > 0;
    }, [form.configuration.maxCreneauxParJour, form.configuration.maxCreneauxMatiereParJour, form.configuration.maxCreneauxConsecutifs]);

    // ─── Submit ───
    const handleSubmit = useCallback(async () => {
        const dto = {
            nom: form.nom.trim(),
            description: form.description.trim() || undefined,
            estPartage: form.estPartage,
            configuration: { ...form.configuration },
        };

        if (isEditing && template) {
            await modifierTemplate.mutateAsync({ id: template.id, ...dto });
        } else {
            await creerTemplate.mutateAsync(dto);
        }
    }, [form, isEditing, template, creerTemplate, modifierTemplate]);

    const isSubmitting = creerTemplate.isPending || modifierTemplate.isPending;

    // ─── ÉTAPE 1 : Identité ────────────────────────────
    const etapeIdentite = (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Nom */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.nom')} <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder={t('templates.wizard.nomPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent transition-colors"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    autoFocus
                />
                {form.nom.length > 0 && form.nom.trim().length < 2 && (
                    <span className="text-xs text-[var(--color-danger)]">{t('templates.wizard.nomMin')}</span>
                )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.description')}
                </label>
                <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('templates.wizard.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent transition-colors resize-none"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                />
            </div>

            {/* Partage */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
                <input
                    type="checkbox"
                    checked={form.estPartage}
                    onChange={(e) => setForm(prev => ({ ...prev, estPartage: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                />
                <div>
                    <div className="flex items-center gap-1.5 font-medium text-sm text-[var(--color-text-primary)]">
                        <Share2 className="h-3.5 w-3.5" />
                        {t('templates.wizard.partage')}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {t('templates.wizard.partageDesc')}
                    </div>
                </div>
            </label>
        </div>
    );

    // ─── ÉTAPE 2 : Calendrier ──────────────────────────
    const etapeCalendrier = (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Jours travaillés */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.joursTravailles')} <span className="text-[var(--color-danger)]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {JOURS_SEMAINE.map(({ value, label }) => {
                        const actif = form.configuration.joursTravailles.includes(value);
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => toggleJour(value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    actif
                                        ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                                aria-pressed={actif}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                {form.configuration.joursTravailles.length === 0 && (
                    <span className="text-xs text-[var(--color-danger)]">{t('templates.wizard.joursObligatoire')}</span>
                )}
            </div>

            {/* Plage horaire */}
            <div className="grid grid-cols-2 gap-[var(--gap-sm)]">
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    <label className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {t('templates.wizard.heureDebut')}
                    </label>
                    <input
                        type="time"
                        value={form.configuration.heureDebutCours}
                        onChange={(e) => updateConfig('heureDebutCours', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-colors"
                    />
                </div>
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    <label className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {t('templates.wizard.heureFin')}
                    </label>
                    <input
                        type="time"
                        value={form.configuration.heureFinCours}
                        onChange={(e) => updateConfig('heureFinCours', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-colors"
                    />
                </div>
            </div>
            {form.configuration.heureDebutCours >= form.configuration.heureFinCours && (
                <span className="text-xs text-[var(--color-danger)] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t('templates.wizard.heureInvalide')}
                </span>
            )}

            {/* Durée créneau */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.dureeCreneau')} (min)
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={15}
                        max={120}
                        step={5}
                        value={form.configuration.dureeCreneauStandard}
                        onChange={(e) => updateConfig('dureeCreneauStandard', Number(e.target.value))}
                        className="flex-1 accent-[var(--color-dominant-600)]"
                    />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] min-w-[3rem] text-center tabular-nums">
                        {form.configuration.dureeCreneauStandard} min
                    </span>
                </div>
            </div>
        </div>
    );

    // ─── ÉTAPE 3 : Contraintes ─────────────────────────
    const etapeContraintes = (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div className="flex items-center gap-2 mb-[var(--space-xs)]">
                <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {t('templates.wizard.contraintesTitre')}
                </h3>
            </div>

            {/* Max créneaux / jour */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.maxCreneauxJour')}
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.configuration.maxCreneauxParJour}
                        onChange={(e) => updateConfig('maxCreneauxParJour', Number(e.target.value))}
                        className="w-24 px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-colors text-center tabular-nums"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">{t('templates.wizard.maxCreneauxJourAide')}</span>
                </div>
            </div>

            {/* Max même matière / jour */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.maxMemeMatiereJour')}
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.configuration.maxCreneauxMatiereParJour}
                        onChange={(e) => updateConfig('maxCreneauxMatiereParJour', Number(e.target.value))}
                        className="w-24 px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-colors text-center tabular-nums"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">{t('templates.wizard.maxMemeMatiereJourAide')}</span>
                </div>
            </div>

            {/* Max consécutifs */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
                <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('templates.wizard.maxConsecutifs')}
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min={1}
                        max={8}
                        value={form.configuration.maxCreneauxConsecutifs}
                        onChange={(e) => updateConfig('maxCreneauxConsecutifs', Number(e.target.value))}
                        className="w-24 px-3 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-colors text-center tabular-nums"
                    />
                    <span className="text-xs text-[var(--color-text-secondary)]">{t('templates.wizard.maxConsecutifsAide')}</span>
                </div>
            </div>
        </div>
    );

    // ─── ÉTAPE 4 : Preview ─────────────────────────────
    const nbJours = form.configuration.joursTravailles.length;
    const [hDebut, mDebut] = form.configuration.heureDebutCours.split(':').map(Number);
    const [hFin, mFin] = form.configuration.heureFinCours.split(':').map(Number);
    const totalMinutes = (hFin * 60 + mFin) - (hDebut * 60 + mDebut);
    const nbCreneauxEstimes = nbJours > 0 && form.configuration.dureeCreneauStandard > 0
        ? Math.floor(totalMinutes / form.configuration.dureeCreneauStandard) * nbJours
        : 0;

    const etapePreview = (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div className="flex items-center gap-2 mb-[var(--space-xs)]">
                <Eye className="h-5 w-5 text-[var(--color-dominant-600)]" />
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {t('templates.wizard.previewTitre')}
                </h3>
            </div>

            {/* Résumé stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <PreviewStat
                    icon={<Calendar className="h-4 w-4" />}
                    label={t('templates.wizard.previewJours')}
                    value={`${nbJours}`}
                    color="dominant"
                />
                <PreviewStat
                    icon={<Clock className="h-4 w-4" />}
                    label={t('templates.wizard.previewCreneaux')}
                    value={`~${nbCreneauxEstimes}`}
                    color="accent"
                />
                <PreviewStat
                    icon={<Clock className="h-4 w-4" />}
                    label={t('templates.wizard.previewDuree')}
                    value={`${form.configuration.dureeCreneauStandard} min`}
                    color="success"
                />
                <PreviewStat
                    icon={<Shield className="h-4 w-4" />}
                    label={t('templates.wizard.previewContraintes')}
                    value={`${form.configuration.maxCreneauxParJour}/${form.configuration.maxCreneauxMatiereParJour}/${form.configuration.maxCreneauxConsecutifs}`}
                    color="warning"
                />
            </div>

            {/* Détails */}
            <div className="rounded-lg border border-[var(--color-bordure)] divide-y divide-[var(--color-bordure)]">
                {/* Identité */}
                <div className="px-4 py-3">
                    <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                        {t('templates.wizard.previewIdentiteSection')}
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">{form.nom || '—'}</div>
                    {form.description && (
                        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{form.description}</div>
                    )}
                    {form.estPartage && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium rounded-full">
                            <Users className="h-3 w-3" />
                            {t('templates.wizard.previewPartage')}
                        </span>
                    )}
                </div>

                {/* Jours + horaires */}
                <div className="px-4 py-3">
                    <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
                        {t('templates.wizard.previewCalendrierSection')}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {JOURS_SEMAINE.map(({ value, label }) => {
                            const actif = form.configuration.joursTravailles.includes(value);
                            return (
                                <span
                                    key={value}
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                                        actif
                                            ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] line-through'
                                    }`}
                                >
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                        {form.configuration.heureDebutCours} – {form.configuration.heureFinCours}
                        <span className="mx-1">·</span>
                        {t('templates.wizard.previewTotalHeures', {
                            heures: Math.floor(totalMinutes / 60),
                            minutes: totalMinutes % 60,
                        })}
                    </div>
                </div>

                {/* Contraintes */}
                <div className="px-4 py-3">
                    <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                        {t('templates.wizard.previewContraintesSection')}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-[var(--color-text-secondary)]">
                        <div>
                            <span className="font-semibold text-[var(--color-text-primary)]">{form.configuration.maxCreneauxParJour}</span>
                            {' '}{t('templates.wizard.maxCreneauxJourShort')}
                        </div>
                        <div>
                            <span className="font-semibold text-[var(--color-text-primary)]">{form.configuration.maxCreneauxMatiereParJour}</span>
                            {' '}{t('templates.wizard.maxMatiereJourShort')}
                        </div>
                        <div>
                            <span className="font-semibold text-[var(--color-text-primary)]">{form.configuration.maxCreneauxConsecutifs}</span>
                            {' '}{t('templates.wizard.maxConsecutifsShort')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Steps ───
    const steps = [
        {
            id: 'identite',
            label: t('templates.wizard.etapeIdentite'),
            icon: FileText,
            content: etapeIdentite,
            validate: validateIdentite,
            validateError: t('templates.wizard.erreurIdentite'),
        },
        {
            id: 'calendrier',
            label: t('templates.wizard.etapeCalendrier'),
            icon: Calendar,
            content: etapeCalendrier,
            validate: validateCalendrier,
            validateError: t('templates.wizard.erreurCalendrier'),
        },
        {
            id: 'contraintes',
            label: t('templates.wizard.etapeContraintes'),
            icon: Shield,
            content: etapeContraintes,
            validate: validateContraintes,
            validateError: t('templates.wizard.erreurContraintes'),
        },
        {
            id: 'preview',
            label: t('templates.wizard.etapePreview'),
            icon: Eye,
            content: etapePreview,
        },
    ];

    const nextLabels = [
        t('templates.wizard.suivant'),
        t('templates.wizard.suivant'),
        t('templates.wizard.previsualiser'),
        t('templates.wizard.creer'),
    ];

    return (
        <StepperModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('templates.wizard.titreModifier') : t('templates.wizard.titreCreer')}
            description={isEditing ? t('templates.wizard.descModifier') : t('templates.wizard.descCreer')}
            size="xl"
            steps={steps}
            nextLabels={nextLabels}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
        />
    );
}

/* ─── Composants utilitaires ─── */

function PreviewStat({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'dominant' | 'accent' | 'success' | 'warning';
}) {
    const colorMap = {
        dominant: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
        accent: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
    };

    return (
        <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
                {icon}
                <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-lg font-bold">{value}</div>
        </div>
    );
}
