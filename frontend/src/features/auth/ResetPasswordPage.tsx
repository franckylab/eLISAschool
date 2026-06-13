/**
 * ==================================
 * eLISAschool - Reset Password Page
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { apiClient } from '@/lib/api-client';

interface ResetForm {
    motDePasse: string;
    confirmer: string;
}

export function ResetPasswordPage() {
    const { t } = useTranslation('auth');
    const search = useSearch({ from: '/reset-password' }) as { token: string };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetForm>();

    const onSubmit = async (data: ResetForm) => {
        setIsSubmitting(true);
        try {
            await apiClient.post('/api/auth/reset-password', {
                token: (search as any).token,
                motDePasse: data.motDePasse,
                confirmerMotDePasse: data.confirmer,
            });
            setSuccess(true);
            toast.success(t('resetPassword.succes'));
        } catch {
            toast.error(t('erreurs.tokenInvalide'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--color-fond)] px-4">
                <div className="w-full max-w-md text-center">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--color-dominante)]" />
                    <h1 className="mt-4 text-2xl font-bold text-[var(--color-texte)]">{t('resetPassword.succes')}</h1>
                    <Link to="/login"  className="mt-6 inline-block">
                        <ElisaButton variant="primary">{t('forgotPassword.retourConnexion')}</ElisaButton>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-fond)] px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <Link to="/"  className="text-2xl font-bold text-[var(--color-dominante)]">
                        elisa<span className="text-[var(--color-accent)]">°</span>school
                    </Link>
                </div>
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-[var(--color-texte)]">{t('resetPassword.titre')}</h1>
                    <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">{t('resetPassword.sousTitre')}</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        <ElisaInput
                            label={t('resetPassword.nouveauMotDePasse')}
                            type="password"
                            icon={<Lock className="h-4 w-4" />}
                            error={errors.motDePasse?.message}
                            {...register('motDePasse', {
                                required: t('validation.requis', { ns: 'common' }),
                                minLength: { value: 8, message: t('resetPassword.regles.minCaracteres') },
                            })}
                        />
                        <ElisaInput
                            label={t('resetPassword.confirmerMotDePasse')}
                            type="password"
                            icon={<Lock className="h-4 w-4" />}
                            error={errors.confirmer?.message}
                            {...register('confirmer', {
                                required: t('validation.requis', { ns: 'common' }),
                                validate: (val) =>
                                    val === watch('motDePasse') || t('validation.confirmationInvalide', { ns: 'common' }),
                            })}
                        />

                        {/* Password rules */}
                        <div className="space-y-1 text-xs text-[var(--color-texte-secondaire)]">
                            <p>{t('resetPassword.regles.minCaracteres')}</p>
                            <p>{t('resetPassword.regles.majuscule')}</p>
                            <p>{t('resetPassword.regles.chiffre')}</p>
                            <p>{t('resetPassword.regles.caractereSpecial')}</p>
                        </div>

                        <ElisaButton
                            type="submit"
                            fullWidth
                            isLoading={isSubmitting}
                            loadingText={t('resetPassword.reinitialisationEnCours')}
                        >
                            {t('resetPassword.boutonReinitialiser')}
                        </ElisaButton>
                        <Link to="/login" >
                            <ElisaButton variant="ghost" fullWidth icon={<ArrowLeft className="h-4 w-4" />}>
                                {t('forgotPassword.retourConnexion')}
                            </ElisaButton>
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
