/**
 * ==================================
 * eLISAschool - Code Promo Input
 * ==================================
 * Champ de saisie de code promo avec validation API.
 * Animation de succès/erreur.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ElisaButton } from '@/components/ui';

// =============================================
// Types
// =============================================

interface CodePromoInputProps {
    /** Callback quand un code valide est appliqué */
    onCodeApplique?: (code: string, remise: { type: string; valeur: number }) => void;
    /** Classe CSS personnalisée */
    className?: string;
}

interface VerificationResult {
    valide: boolean;
    code?: string;
    nom?: string;
    typeRemise?: string;
    valeur?: number;
    message?: string;
}

// =============================================
// Hook — Vérification code promo
// =============================================

function useVerifierCoupon(code: string | null) {
    return useQuery<{ valide: boolean; nom?: string; typeRemise?: string; valeur?: number; message?: string }>({
        queryKey: ['verifier-coupon', code],
        queryFn: async () => {
            if (!code) return { valide: false, message: 'Aucun code' };
            const res = await apiClient.get<{ success: boolean; data: VerificationResult }>(
                `/api/billing/remises/verify?code=${encodeURIComponent(code)}`
            );
            return res.data?.data ?? { valide: false, message: 'Code invalide' };
        },
        enabled: !!code,
        retry: false,
    });
}

// =============================================
// Composant
// =============================================

export function CodePromoInput({ onCodeApplique, className }: CodePromoInputProps) {
    const { t } = useTranslation('billing');
    const [codeSaisi, setCodeSaisi] = useState('');
    const [codeActif, setCodeActif] = useState<string | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);
    const [enCours, setEnCours] = useState(false);

    const verifier = useCallback(async () => {
        if (!codeSaisi.trim()) return;

        setEnCours(true);
        setErreur(null);

        try {
            const res = await apiClient.get<{ success: boolean; data: VerificationResult }>(
                `/api/billing/remises/verify?code=${encodeURIComponent(codeSaisi.trim())}`
            );
            const data = res.data?.data;

            if (data?.valide) {
                setCodeActif(codeSaisi.trim());
                onCodeApplique?.(codeSaisi.trim(), {
                    type: data.typeRemise ?? 'POURCENTAGE',
                    valeur: data.valeur ?? 0,
                });
            } else {
                setErreur(data?.message ?? t('promo.codeInvalide', 'Code promo invalide ou expiré'));
                setCodeActif(null);
            }
        } catch {
            setErreur(t('promo.erreurVerification', 'Erreur lors de la vérification'));
        } finally {
            setEnCours(false);
        }
    }, [codeSaisi, onCodeApplique, t]);

    const retirer = () => {
        setCodeActif(null);
        setCodeSaisi('');
        setErreur(null);
    };

    return (
        <div className={cn('space-y-2', className)}>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-texte)]">
                <Tag className="h-4 w-4 text-[var(--color-dominante)]" />
                {t('promo.titre', 'Code promo')}
            </label>

            {codeActif ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success-600)]/30 bg-[var(--color-success-600)]/5 px-4 py-2.5">
                    <Check className="h-4 w-4 text-[var(--color-success-600)]" />
                    <span className="flex-1 text-sm font-medium text-[var(--color-success-600)]">
                        {codeActif}
                    </span>
                    <button
                        onClick={retirer}
                        className="rounded p-1 text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={codeSaisi}
                        onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && verifier()}
                        placeholder={t('promo.placeholder', 'Entrez votre code')}
                        className={cn(
                            'flex-1 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                            'border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-texte)]',
                            'placeholder:text-[var(--color-texte-muted)]',
                            'focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20',
                            erreur && 'border-[var(--color-error-600)]',
                        )}
                    />
                    <ElisaButton
                        onClick={verifier}
                        disabled={!codeSaisi.trim() || enCours}
                        isLoading={enCours}
                        size="sm"
                    >
                        {t('promo.appliquer', 'Appliquer')}
                    </ElisaButton>
                </div>
            )}

            {erreur && (
                <p className="animate-in fade-in text-xs text-[var(--color-error-600)]">
                    {erreur}
                </p>
            )}
        </div>
    );
}

export default CodePromoInput;
