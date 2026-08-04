/**
 * ==================================
 * eLISAschool - StepperModal — Modal Multi-Étapes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal à étapes avec :
 * - Indicateur de progression (barre + dots)
 * - Navigation prev/next
 * - Validation par étape (optionnelle)
 * - Responsive : étapes scrollables sur mobile
 * - Basé sur CustomModal
 */

import { type ReactNode, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';

/* ─── Types ─── */

export interface StepperStep {
    /** Identifiant unique de l'étape */
    id: string;
    /** Label affiché dans l'indicateur */
    label: string;
    /** Icône optionnelle pour l'étape */
    icon?: LucideIcon;
    /** Contenu de l'étape (formulaire, etc.) */
    content: ReactNode;
    /** Fonction de validation optionnelle — retourne true si l'étape est valide */
    validate?: () => boolean | Promise<boolean>;
    /** Message d'erreur si la validation échoue */
    validateError?: string;
}

export interface StepperModalProps {
    /** Ouverture du modal */
    open: boolean;
    /** Callback de fermeture */
    onOpenChange: (open: boolean) => void;
    /** Titre du modal */
    title: string;
    /** Description optionnelle */
    description?: string;
    /** Étapes du formulaire */
    steps: StepperStep[];
    /** Étape initiale (défaut: 0) */
    initialStep?: number;
    /** Callback appelé à la soumission finale */
    onSubmit: () => void | Promise<void>;
    /** Callback appelé à l'annulation */
    onCancel?: () => void;
    /** Label du bouton Annuler (défaut: i18n) */
    cancelLabel?: string;
    /** Label du bouton Suivant (défaut: i18n) */
    nextLabel?: string;
    /** Label du bouton Précédent (défaut: i18n) */
    prevLabel?: string;
    /** Label du bouton Enregistrer (défaut: i18n) */
    submitLabel?: string;
    /** Taille du modal (défaut: '2xl') */
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    /** Désactiver le bouton Suivant si l'étape est invalide */
    disableNextOnInvalid?: boolean;
    /** Classe CSS additionnelle */
    className?: string;
    /** État de chargement pour le bouton submit */
    isSubmitting?: boolean;
}

/* ─── Composant ─── */

export function StepperModal({
    open,
    onOpenChange,
    title,
    description,
    steps,
    initialStep = 0,
    onSubmit,
    onCancel,
    cancelLabel,
    nextLabel,
    prevLabel,
    submitLabel,
    size = '2xl',
    disableNextOnInvalid = true,
    isSubmitting = false,
}: StepperModalProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    const totalSteps = steps.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    // Labels par défaut (i18n)
    const labels = {
        cancel: cancelLabel || t('common:boutons.annuler', 'Annuler'),
        next: nextLabel || t('common:boutons.suivant', 'Suivant'),
        prev: prevLabel || t('common:boutons.precedent', 'Précédent'),
        submit: submitLabel || t('common:boutons.enregistrer', 'Enregistrer'),
    };

    // Navigation vers l'étape suivante
    const handleNext = useCallback(async () => {
        const step = steps[currentStep];

        // Validation de l'étape courante
        if (step.validate) {
            const isValid = await step.validate();
            if (!isValid) {
                setValidationError(step.validateError || t('common:validation.etapeInvalide', 'Veuillez corriger les erreurs avant de continuer.'));
                return;
            }
        }

        setValidationError(null);
        setCompletedSteps(prev => new Set([...prev, currentStep]));

        if (isLastStep) {
            await onSubmit();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, isLastStep, steps, onSubmit, t]);

    // Navigation vers l'étape précédente
    const handlePrev = useCallback(() => {
        if (!isFirstStep) {
            setValidationError(null);
            setCurrentStep(prev => prev - 1);
        }
    }, [isFirstStep]);

    // Navigation vers une étape spécifique (via l'indicateur)
    const handleStepClick = useCallback((index: number) => {
        // Autoriser uniquement les étapes déjà complétées ou la suivante
        if (index <= currentStep || completedSteps.has(index - 1)) {
            setValidationError(null);
            setCurrentStep(index);
        }
    }, [currentStep, completedSteps]);

    // Fermeture du modal
    const handleClose = useCallback(() => {
        setCurrentStep(initialStep);
        setCompletedSteps(new Set());
        setValidationError(null);
        onCancel?.();
        onOpenChange(false);
    }, [initialStep, onCancel, onOpenChange]);

    // Animation des étapes
    const stepVariants = {
        enter: { opacity: 0, x: 20 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={handleClose}
            title={title}
            description={description}
            size={size}
            footer={
                <div className="flex items-center justify-between gap-[var(--gap-sm)] w-full">
                    {/* Bouton Annuler (à gauche) */}
                    <ElisaButton
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        {labels.cancel}
                    </ElisaButton>

                    {/* Navigation (à droite) */}
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        {!isFirstStep && (
                            <ElisaButton
                                variant="outline"
                                onClick={handlePrev}
                                icon={<ChevronLeft className="h-4 w-4" />}
                                disabled={isSubmitting}
                            >
                                {labels.prev}
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant={isLastStep ? 'primary' : 'outline'}
                            onClick={handleNext}
                            icon={!isLastStep ? <ChevronRight className="h-4 w-4" /> : undefined}
                            loading={isSubmitting}
                            disabled={disableNextOnInvalid && !isStepValid(steps[currentStep])}
                        >
                            {isLastStep ? labels.submit : labels.next}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* ─── Indicateur de progression ─── */}
                <StepperIndicator
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    progress={progress}
                    onStepClick={handleStepClick}
                />

                {/* ─── Message d'erreur de validation ─── */}
                <AnimatePresence>
                    {validationError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-[var(--radius-md)] bg-danger/10 border border-danger/20 px-[var(--space-md)] py-[var(--space-sm)]"
                        >
                            <p className="text-[var(--text-sm)] text-danger font-medium">
                                {validationError}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Contenu de l'étape courante ─── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {steps[currentStep].content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </CustomModal>
    );
}

/* ─── Indicateur d'étapes ─── */

interface StepperIndicatorProps {
    steps: StepperStep[];
    currentStep: number;
    completedSteps: Set<number>;
    progress: number;
    onStepClick: (index: number) => void;
}

function StepperIndicator({
    steps,
    currentStep,
    completedSteps,
    progress,
    onStepClick,
}: StepperIndicatorProps) {
    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {/* Barre de progression */}
            <div className="relative h-1 rounded-full bg-[var(--color-bordure)] overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-dominante)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
            </div>

            {/* Dots + Labels */}
            <div className="flex items-center justify-between overflow-x-auto scrollbar-none -mx-1 px-1">
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.has(index);
                    const isCurrent = index === currentStep;
                    const isClickable = index <= currentStep || completedSteps.has(index - 1);
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.id}
                            type="button"
                            onClick={() => onStepClick(index)}
                            disabled={!isClickable}
                            className={cn(
                                'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors min-w-[clamp(3rem,15vw,5rem)]',
                                isClickable && 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
                                !isClickable && 'cursor-default opacity-60',
                            )}
                            aria-current={isCurrent ? 'step' : undefined}
                            aria-label={`${step.label} (${index + 1}/${steps.length})`}
                        >
                            {/* Dot / Icône */}
                            <div
                                className={cn(
                                    'flex items-center justify-center rounded-full transition-all duration-200',
                                    'h-[clamp(1.5rem,4vw,2rem)] w-[clamp(1.5rem,4vw,2rem)]',
                                    isCurrent && 'bg-[var(--color-dominante)] text-white shadow-sm',
                                    isCompleted && !isCurrent && 'bg-[var(--color-dominante)]/20 text-[var(--color-dominante)]',
                                    !isCompleted && !isCurrent && 'bg-[var(--color-bordure)] text-[var(--color-texte-muted)]',
                                )}
                            >
                                {isCompleted && !isCurrent ? (
                                    <Check className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" />
                                ) : Icon ? (
                                    <Icon className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" />
                                ) : (
                                    <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] font-bold">
                                        {index + 1}
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    'text-[clamp(0.5625rem,1.25vw,0.6875rem)] font-medium text-center leading-tight truncate max-w-full',
                                    isCurrent && 'text-[var(--color-dominante)] font-semibold',
                                    isCompleted && !isCurrent && 'text-[var(--color-texte)]',
                                    !isCompleted && !isCurrent && 'text-[var(--color-texte-muted)]',
                                )}
                            >
                                {step.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Helpers ─── */

function isStepValid(step: StepperStep): boolean {
    if (!step.validate) return true;
    // Synchronous check only for button disabled state
    const result = step.validate();
    return typeof result === 'boolean' ? result : true;
}
