/**
 * ==================================
 * eLISAschool - Onboarding Wizard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase J.2 — Refonte SaaS v3
 * Guide pas-à-pas pour nouveau SUPER_ADMIN.
 * 5 étapes avec progress bar et validation.
 * Détecte la première connexion et affiche automatiquement.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import {
    Building2,
    UserPlus,
    Puzzle,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    X,
    Sparkles,
    Loader2,
} from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: typeof Building2;
    action: () => void;
    completed: boolean;
    optional?: boolean;
}

interface OnboardingWizardProps {
    open: boolean;
    onClose: () => void;
}

const ONBOARDING_STORAGE_KEY = 'elisaschool_onboarding_completed';

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
    const { t } = useTranslation('admin');
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [loading] = useState(false);
    const navigate = useNavigate();

    // Détecter si c'est la première connexion
    useEffect(() => {
        if (!open) return;
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (completed) {
            onClose();
            return;
        }

        // Initialiser les étapes
        setSteps([
            {
                id: 'platform-config',
                title: t('onboarding.steps.configPlatform.titre'),
                description: t('onboarding.steps.configPlatform.desc'),
                icon: Building2,
                action: () => navigate({ to: '/platform/configuration' }),
                completed: false,
            },
            {
                id: 'create-etablissement',
                title: t('onboarding.steps.createEtab.titre'),
                description: t('onboarding.steps.createEtab.desc'),
                icon: Building2,
                action: () => navigate({ to: '/platform/etablissements' }),
                completed: false,
            },
            {
                id: 'invite-admin',
                title: t('onboarding.steps.inviteAdmin.titre'),
                description: t('onboarding.steps.inviteAdmin.desc'),
                icon: UserPlus,
                action: () => navigate({ to: '/platform/etablissements' }),
                completed: false,
            },
            {
                id: 'activate-modules',
                title: t('onboarding.steps.activateModules.titre'),
                description: t('onboarding.steps.activateModules.desc'),
                icon: Puzzle,
                action: () => navigate({ to: '/platform/modules' }),
                completed: false,
                optional: true,
            },
            {
                id: 'configure-billing',
                title: t('onboarding.steps.configBilling.titre'),
                description: t('onboarding.steps.configBilling.desc'),
                icon: CreditCard,
                action: () => navigate({ to: '/platform/facturation' }),
                completed: false,
                optional: true,
            },
        ]);
    }, [open, navigate, onClose]);

    const handleNext = useCallback(() => {
        setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, completed: true } : s));
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, steps.length]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const handleComplete = useCallback(() => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        onClose();
    }, [onClose]);

    const handleSkip = useCallback(() => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        onClose();
    }, [onClose]);

    const handleStepAction = useCallback(() => {
        const step = steps[currentStep];
        if (step) {
            step.action();
            setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, completed: true } : s));
        }
    }, [currentStep, steps]);

    if (!open || steps.length === 0) return null;

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;
    const completedCount = steps.filter(s => s.completed).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-2xl"
                style={{ padding: 'clamp(1rem, 0.8rem + 0.5vw, 2rem)' }}
            >
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                    aria-label={t('onboarding.fermer')}
                >
                    <X className="h-5 w-5 text-[var(--color-text-muted)]" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-dominant-100)] mb-3">
                        <Sparkles className="h-6 w-6 text-[var(--color-dominant-600)]" />
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.125rem, 1rem + 0.4vw, 1.5rem)' }} className="font-bold text-[var(--color-texte)]">
                        {t('onboarding.titre')}
                    </h2>
                    <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }} className="text-[var(--color-texte-secondaire)] mt-1">
                        {t('onboarding.sousTitre')}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--color-texte-secondaire)]">
                            {t('onboarding.etape', { current: currentStep + 1, total: steps.length })}
                        </span>
                        <span className="text-xs text-[var(--color-texte-secondaire)]">
                            {t('onboarding.completees', { count: completedCount, total: steps.length })}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-dominant-500)] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step content */}
                <div className="mb-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-dominant-50)] flex items-center justify-center">
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-dominant-600)]" />
                            ) : (
                                <step.icon className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 style={{ fontSize: 'clamp(1rem, 0.9rem + 0.3vw, 1.125rem)' }} className="font-semibold text-[var(--color-texte)]">
                                {step.title}
                                {step.optional && (
                                    <span className="ml-2 text-xs font-normal text-[var(--color-texte-secondaire)]">{t('onboarding.optionnel')}</span>
                                )}
                            </h3>
                            <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }} className="text-[var(--color-texte-secondaire)] mt-1">
                                {step.description}
                            </p>
                        </div>
                        {step.completed && (
                            <CheckCircle2 className="h-5 w-5 text-[var(--color-success-500)] flex-shrink-0" />
                        )}
                    </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {steps.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStep(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                i === currentStep
                                    ? 'bg-[var(--color-dominant-500)] scale-125'
                                    : s.completed
                                    ? 'bg-[var(--color-success-400)]'
                                    : 'bg-[var(--color-text-muted)]'
                            }`}
                            aria-label={`${t('onboarding.etape', { current: i + 1, total: steps.length })}: ${s.title}`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('onboarding.precedent')}
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep === steps.length - 1 ? (
                            <button
                                onClick={handleComplete}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-700)] transition-colors"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {t('onboarding.terminer')}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleStepAction}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-50)] transition-colors"
                                >
                                    {t('onboarding.allerPage')}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-700)] transition-colors"
                                >
                                    {t('onboarding.suivant')}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Skip link */}
                {currentStep < steps.length - 1 && (
                    <button
                        onClick={handleSkip}
                        className="w-full mt-4 text-center text-xs text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)] transition-colors"
                    >
                        {t('onboarding.passer')}
                    </button>
                )}
            </div>
        </div>
    );
}

export default OnboardingWizard;
