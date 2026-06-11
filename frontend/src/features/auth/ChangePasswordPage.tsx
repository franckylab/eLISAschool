/**
 * ==================================
 * eLISAschool - Change Password Page
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiClient } from '@/lib/api-client';

interface ChangePasswordForm {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
    confirmer: string;
}

export function ChangePasswordPage() {
    const { t } = useTranslation('auth');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ChangePasswordForm>();

    const onSubmit = async (data: ChangePasswordForm) => {
        setIsSubmitting(true);
        try {
            await apiClient.post('/api/auth/change-password', {
                ancienMotDePasse: data.ancienMotDePasse,
                motDePasse: data.nouveauMotDePasse,
                confirmerMotDePasse: data.confirmer,
            });
            toast.success(t('changePassword.succes'));
            reset();
        } catch (err: any) {
            toast.error(err?.message || t('erreurs.ancienIncorrect'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title={t('changePassword.titre')}
                description={t('changePassword.sousTitre')}
            />

            <div className="mx-auto max-w-lg rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <ElisaInput
                        label={t('changePassword.ancienMotDePasse')}
                        type="password"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.ancienMotDePasse?.message}
                        autoComplete="current-password"
                        {...register('ancienMotDePasse', {
                            required: t('validation.requis', { ns: 'common' }),
                        })}
                    />
                    <ElisaInput
                        label={t('changePassword.nouveauMotDePasse')}
                        type="password"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.nouveauMotDePasse?.message}
                        autoComplete="new-password"
                        {...register('nouveauMotDePasse', {
                            required: t('validation.requis', { ns: 'common' }),
                            minLength: { value: 8, message: t('resetPassword.regles.minCaracteres') },
                        })}
                    />
                    <ElisaInput
                        label={t('changePassword.confirmerMotDePasse')}
                        type="password"
                        icon={<Lock className="h-4 w-4" />}
                        error={errors.confirmer?.message}
                        autoComplete="new-password"
                        {...register('confirmer', {
                            required: t('validation.requis', { ns: 'common' }),
                            validate: (val) =>
                                val === watch('nouveauMotDePasse') || t('validation.confirmationInvalide', { ns: 'common' }),
                        })}
                    />
                    <ElisaButton
                        type="submit"
                        isLoading={isSubmitting}
                        loadingText={t('changePassword.changementEnCours')}
                    >
                        {t('changePassword.boutonChanger')}
                    </ElisaButton>
                </form>
            </div>
        </div>
    );
}
