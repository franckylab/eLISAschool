/**
 * ==================================
 * eLISAschool - Verify Email Page
 * ==================================
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearch } from '@tanstack/react-router';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { apiClient } from '@/lib/api-client';

export function VerifyEmailPage() {
    const { t } = useTranslation('auth');
    const search = useSearch({ from: '/verify-email' }) as { token: string };
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const token = (search as any).token;
        if (token) {
            apiClient
                .post('/api/auth/verify-email', { token })
                .then(() => setStatus('success'))
                .catch(() => setStatus('error'));
        } else {
            setStatus('error');
        }
    }, [search]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-fond)] px-4">
            <div className="w-full max-w-md text-center">
                <Link to="/"  className="text-2xl font-bold text-[var(--color-dominante)]">
                    elisa<span className="text-[var(--color-accent)]">°</span>school
                </Link>

                <div className="mt-8 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-8 shadow-sm">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="mx-auto h-16 w-16 animate-spin text-[var(--color-dominante)]" />
                            <h2 className="mt-4 text-xl font-semibold text-[var(--color-texte)]">
                                {t('verifyEmail.sousTitre')}
                            </h2>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--color-dominante)]" />
                            <h2 className="mt-4 text-xl font-semibold text-[var(--color-texte)]">
                                {t('verifyEmail.succes')}
                            </h2>
                            <Link to="/login"  className="mt-6 inline-block">
                                <ElisaButton variant="primary">{t('verifyEmail.retourConnexion')}</ElisaButton>
                            </Link>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XCircle className="mx-auto h-16 w-16 text-[var(--color-error)]" />
                            <h2 className="mt-4 text-xl font-semibold text-[var(--color-texte)]">
                                {t('verifyEmail.echec')}
                            </h2>
                            <Link to="/login"  className="mt-6 inline-block">
                                <ElisaButton variant="outline">{t('verifyEmail.retourConnexion')}</ElisaButton>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
