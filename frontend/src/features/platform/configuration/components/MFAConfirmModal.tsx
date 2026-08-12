/**
 * ==================================
 * eLISAschool - MFA Confirm Modal
 * ==================================
 * Modal de re-authentification MFA avant modification de paramètres critiques.
 * Demande le code TOTP à 6 chiffres et valide via l'API avant de permettre
 * la sauvegarde des changements critiques.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface MFAConfirmModalProps {
    /** Afficher le modal */
    open: boolean;
    /** Fermer le modal */
    onOpenChange: (open: boolean) => void;
    /** Callback quand la vérification MFA réussit */
    onVerified: () => void;
    /** Callback quand l'utilisateur annule */
    onCancel: () => void;
}

export function MFAConfirmModal({
    open,
    onOpenChange,
    onVerified,
    onCancel,
}: MFAConfirmModalProps) {
    const { t } = useTranslation('config-params');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Reset à l'ouverture
    useEffect(() => {
        if (open) {
            setCode('');
            setError('');
            setIsLoading(false);
            // Focus premier input après ouverture
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [open]);

    // Gestion de la saisie (6 chiffres)
    const handleDigitChange = useCallback((index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;

        const newCode = code.split('');
        newCode[index] = value;
        const joined = newCode.join('').substring(0, 6);
        setCode(joined);
        setError('');

        // Auto-focus suivant
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [code]);

    // Backspace → retour au champ précédent
    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [code]);

    // Vérifier le code MFA
    const handleVerify = useCallback(async () => {
        if (code.length !== 6) {
            setError(t('mfa.codeIncomplet', 'Veuillez entrer les 6 chiffres'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await apiClient.post('/api/auth/mfa/verify', { code });
            toast.success(t('mfa.succes', 'Authentification MFA vérifiée'));
            onVerified();
            onOpenChange(false);
        } catch {
            setError(t('mfa.codeInvalide', 'Code MFA invalide. Veuillez réessayer.'));
            setCode('');
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    }, [code, onVerified, onOpenChange, t]);

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v) onCancel();
                onOpenChange(v);
            }}
            title={t('mfa.titre', 'Vérification MFA requise')}
            description={t('mfa.description', 'Cette modification impacte des paramètres de sécurité critiques')}
            size="md"
            draggable={false}
            resizable={false}
            footer={
                <div className="flex gap-2">
                    <ElisaButton
                        variant="outline"
                        onClick={() => {
                            onCancel();
                            onOpenChange(false);
                        }}
                    >
                        {t('mfa.annuler', 'Annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleVerify}
                        chargement={isLoading}
                        disabled={code.length !== 6}
                    >
                        {t('mfa.verifier', 'Vérifier')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="space-y-4 py-4">
                {/* Alerte sécurité */}
                <div className="flex items-start gap-3 rounded-lg border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] p-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--color-warning-600)]" />
                    <div className="text-sm text-[var(--color-warning-800)]">
                        <p className="font-medium">{t('mfa.alerteTitre', 'Paramètres critiques')}</p>
                        <p className="mt-0.5 text-xs">
                            {t('mfa.alerteMessage', 'Les modifications en cours affectent des paramètres de sécurité sensibles. Une vérification MFA est requise pour continuer.')}
                        </p>
                    </div>
                </div>

                {/* Champs code MFA (6 chiffres) */}
                <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-alt)] p-3">
                        <Shield className="h-6 w-6 text-[var(--color-dominant-600)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {t('mfa.instruction', 'Entrez le code de votre application d\'authentification')}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={code[index] || ''}
                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="h-12 w-10 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-center text-lg font-bold text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                                disabled={isLoading}
                            />
                        ))}
                    </div>

                    {/* Erreur */}
                    {error && (
                        <p className="text-sm text-[var(--color-danger-600)]">{error}</p>
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('mfa.verification', 'Vérification en cours...')}
                        </div>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
