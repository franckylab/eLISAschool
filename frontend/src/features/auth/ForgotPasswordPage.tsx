/**
 * ==================================
 * eLISAschool - Forgot Password Page
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { apiClient } from '@/lib/api-client';

interface ForgotForm {
    email: string;
}

export function ForgotPasswordPage() {
    const { t } = useTranslation('auth');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [emailSent, setEmailSent] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();

    const onSubmit = async (data: ForgotForm) => {
        setIsSubmitting(true);
        try {
            await apiClient.post('/api/auth/forgot-password', { email: data.email });
            setSent(true);
            setEmailSent(data.email);
            toast.success(t('forgotPassword.succes', { email: data.email }));
        } catch {
            toast.error(t('erreurs.sessionExpiree'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-fond)] px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link to="/" className="text-2xl font-bold text-[var(--color-dominante)]">
                        elisa<span className="text-[var(--color-accent)]">°</span>school
                    </Link>
                </div>

                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-[var(--color-texte)]">{t('forgotPassword.titre')}</h1>
                    <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">{t('forgotPassword.sousTitre')}</p>

                    {sent ? (
                        <div className="mt-6 space-y-4">
                            <div className="rounded-lg bg-[var(--color-dominante)]/10 px-4 py-4 text-sm text-[var(--color-dominante)]">
                                {t('forgotPassword.succes', { email: emailSent })}
                            </div>
                            <p className="text-sm text-[var(--color-texte-secondaire)]">{t('forgotPassword.verifierSpam')}</p>
                            <Link to="/login">
                                <ElisaButton variant="outline" fullWidth icon={<ArrowLeft className="h-4 w-4" />}>
                                    {t('forgotPassword.retourConnexion')}
                                </ElisaButton>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                            <ElisaInput
                                label={t('forgotPassword.email')}
                                type="email"
                                icon={<Mail className="h-4 w-4" />}
                                error={errors.email?.message}
                                autoComplete="email"
                                {...register('email', {
                                    required: t('validation.requis', { ns: 'common' }),
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: t('validation.emailInvalide', { ns: 'common' }),
                                    },
                                })}
                            />
                            <ElisaButton
                                type="submit"
                                fullWidth
                                isLoading={isSubmitting}
                                loadingText={t('forgotPassword.envoiEnCours')}
                                icon={<Mail className="h-4 w-4" />}
                            >
                                {t('forgotPassword.boutonEnvoyer')}
                            </ElisaButton>
                            <Link to="/login">
                                <ElisaButton variant="ghost" fullWidth icon={<ArrowLeft className="h-4 w-4" />}>
                                    {t('forgotPassword.retourConnexion')}
                                </ElisaButton>
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
