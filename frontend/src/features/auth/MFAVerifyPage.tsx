/**
 * ==================================
 * eLISAschool - Page de vérification MFA
 * ==================================
 * Affiche un formulaire pour entrer le code TOTP (6 chiffres)
 * ou un code de secours après le login.
 *
 * Phase P1 — Refonte SaaS v6
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function MFAVerifyPage() {
    const navigate = useNavigate();
    const { verifyMFA, isLoading, mfaToken, reset } = useAuthStore();

    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleCodeChange = useCallback((index: number, value: string) => {
        if (useBackupCode) return;

        // Un seul chiffre par case
        const digit = value.replace(/\D/g, '').slice(-1);
        const newCode = code.split('');
        newCode[index] = digit;
        const joined = newCode.join('').slice(0, 6);
        setCode(joined);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    }, [code, useBackupCode]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (useBackupCode) return;

        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [code, useBackupCode]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (useBackupCode) return;

        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        setCode(pasted);

        // Focus la dernière case remplie ou la suivante
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
    }, [useBackupCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const codeToVerify = useBackupCode ? code.trim() : code;
        if (!codeToVerify) {
            setError(useBackupCode ? 'Veuillez entrer votre code de secours' : 'Veuillez entrer le code à 6 chiffres');
            return;
        }

        try {
            await verifyMFA(codeToVerify);
            toast.success('Connexion MFA vérifiée avec succès');
            navigate({ to: '/dashboard' });
        } catch (err: any) {
            const message = err?.message || 'Code MFA invalide. Veuillez réessayer.';
            setError(message);
            setCode('');
            // Reset les inputs
            inputRefs.current[0]?.focus();
        }
    };

    const handleBackToLogin = () => {
        reset();
        window.location.href = '/login';
    };

    // Si pas de token MFA, rediriger vers login
    if (!mfaToken) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-bold">Session MFA expirée</h2>
                    <p className="text-muted-foreground">Veuillez vous reconnecter.</p>
                    <Button onClick={handleBackToLogin}>Retour à la connexion</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                {/* En-tête */}
                <div className="text-center space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Vérification en deux étapes
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {useBackupCode
                            ? 'Entrez un de vos codes de secours pour vous connecter.'
                            : 'Entrez le code à 6 chiffres affiché dans votre application d\'authentification.'}
                    </p>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {useBackupCode ? (
                        /* Input code de secours */
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="backup-code">
                                <KeyRound className="mr-2 inline h-4 w-4" />
                                Code de secours
                            </label>
                            <Input
                                id="backup-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="XXXX-XXXX"
                                className="font-mono text-center text-lg tracking-widest"
                                autoFocus
                            />
                        </div>
                    ) : (
                        /* 6 inputs pour le code TOTP */
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Code TOTP
                            </label>
                            <div className="flex justify-center gap-2" onPaste={handlePaste}>
                                {Array.from({ length: 6 }, (_, i) => (
                                    <Input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={code[i] || ''}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="h-14 w-12 text-center text-xl font-mono"
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !code}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Vérification...
                            </>
                        ) : (
                            'Vérifier'
                        )}
                    </Button>

                    {/* Actions secondaires */}
                    <div className="flex flex-col items-center gap-2 text-center">
                        <button
                            type="button"
                            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setCode('');
                                setError(null);
                            }}
                        >
                            {useBackupCode
                                ? 'Utiliser le code TOTP à la place'
                                : 'Utiliser un code de secours'}
                        </button>

                        <button
                            type="button"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                            onClick={handleBackToLogin}
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Retour à la connexion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
