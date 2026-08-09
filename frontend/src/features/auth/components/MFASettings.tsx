/**
 * ==================================
 * eLISAschool - Composant Configuration MFA
 * ==================================
 * Permet à l'utilisateur d'activer/désactiver le MFA (TOTP)
 * depuis ses paramètres de sécurité.
 *
 * Phase P1 — Refonte SaaS v6
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Shield,
    ShieldCheck,
    ShieldOff,
    Loader2,
    Copy,
    Check,
    AlertTriangle,
    KeyRound,
    QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ==================================
// Hook pour le statut MFA
// ==================================
function useMFAStatus() {
    return useQuery({
        queryKey: ['mfa-status'],
        queryFn: () => apiClient.getMFAStatus(),
        staleTime: 30_000,
    });
}

// ==================================
// Composant principal
// ==================================
export function MFASettings() {
    const { data: status, isLoading, refetch } = useMFAStatus();
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
        );
    }

    const isMFAEnabled = status?.enabled ?? false;

    return (
        <div className="space-y-4">
            {/* Statut actuel */}
            <div className={`flex items-center gap-3 rounded-lg border p-4 ${
                isMFAEnabled
                    ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20'
            }`}>
                {isMFAEnabled ? (
                    <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                    <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                )}
                <div className="flex-1">
                    <h4 className="font-medium">
                        {isMFAEnabled ? 'MFA activé' : 'MFA désactivé'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {isMFAEnabled
                            ? 'Votre compte est protégé par une vérification en deux étapes.'
                            : 'Ajoutez une couche de sécurité supplémentaire à votre compte.'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                {!isMFAEnabled ? (
                    <Button onClick={() => setShowSetupDialog(true)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Activer le MFA
                    </Button>
                ) : (
                    <Button variant="destructive" onClick={() => setShowDisableDialog(true)}>
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Désactiver le MFA
                    </Button>
                )}
            </div>

            {/* Dialog Setup */}
            {showSetupDialog && (
                <MFASetupDialog
                    open={showSetupDialog}
                    onClose={() => setShowSetupDialog(false)}
                    onComplete={() => {
                        setShowSetupDialog(false);
                        refetch();
                    }}
                />
            )}

            {/* Dialog Disable */}
            {showDisableDialog && (
                <MFADisableDialog
                    open={showDisableDialog}
                    onClose={() => setShowDisableDialog(false)}
                    onComplete={() => {
                        setShowDisableDialog(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

// ==================================
// Dialog de setup MFA (multi-étapes)
// ==================================
function MFASetupDialog({
    open,
    onClose,
    onComplete,
}: {
    open: boolean;
    onClose: () => void;
    onComplete: () => void;
}) {
    const [step, setStep] = useState<'setup' | 'verify'>('setup');
    const [setupData, setSetupData] = useState<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    } | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [codesCopied, setCodesCopied] = useState(false);
    const queryClient = useQueryClient();

    // Étape 1 : Setup (générer secret + QR)
    const setupMutation = useMutation({
        mutationFn: () => apiClient.setupMFA(),
        onSuccess: (data) => {
            setSetupData(data);
            setStep('verify');
        },
        onError: () => {
            toast.error('Erreur lors de la configuration MFA');
        },
    });

    // Étape 2 : Activer (vérifier le premier code)
    const activateMutation = useMutation({
        mutationFn: (code: string) => apiClient.activateMFA(code),
        onSuccess: () => {
            toast.success('MFA activé avec succès !');
            queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
            onComplete();
        },
        onError: (err: any) => {
            setError(err?.message || 'Code invalide. Veuillez réessayer.');
        },
    });

    const handleCopySecret = async () => {
        if (setupData) {
            await navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyBackupCodes = async () => {
        if (setupData) {
            await navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
            setCodesCopied(true);
            setTimeout(() => setCodesCopied(false), 2000);
        }
    };

    const handleActivate = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (code.length !== 6) {
            setError('Le code doit contenir 6 chiffres.');
            return;
        }
        activateMutation.mutate(code);
    };

    return (
        <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                {step === 'setup' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5" />
                                Configurer l'authentification à deux facteurs
                            </DialogTitle>
                            <DialogDescription>
                                Cliquez sur "Commencer" pour générer un secret TOTP.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted/50 p-4 text-sm">
                                <p className="font-medium mb-2">Comment ça marche :</p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                    <li>Un QR code sera généré</li>
                                    <li>Scannez-le avec Google Authenticator, Authy ou Microsoft Authenticator</li>
                                    <li>Entrez le code à 6 chiffres affiché dans l'application</li>
                                    <li>Conservez les codes de secours en lieu sûr</li>
                                </ol>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button
                                onClick={() => setupMutation.mutate()}
                                disabled={setupMutation.isPending}
                            >
                                {setupMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Commencer
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5" />
                                Vérifiez le code TOTP
                            </DialogTitle>
                            <DialogDescription>
                                Scannez le QR code puis entrez le code affiché.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* QR Code (URL) */}
                            {setupData && (
                                <div className="space-y-3">
                                    <div className="flex justify-center">
                                        <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(setupData.qrCodeUrl)}&size=200x200`}
                                                alt="QR Code MFA"
                                                className="h-48 w-48"
                                            />
                                        </div>
                                    </div>

                                    {/* Secret (copiable) */}
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                                            {setupData.secret}
                                        </code>
                                        <Button variant="outline" size="icon" onClick={handleCopySecret}>
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>

                                    {/* Backup codes */}
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                                Codes de secours
                                            </p>
                                            <Button variant="ghost" size="sm" onClick={handleCopyBackupCodes}>
                                                {codesCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                                            {setupData.backupCodes.map((c, i) => (
                                                <span key={i} className="rounded bg-white/50 px-2 py-1 dark:bg-black/20">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                            Conservez ces codes en lieu sûr. Chaque code n'est utilisable qu'une seule fois.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Input code */}
                            <form onSubmit={handleActivate} className="space-y-2">
                                <Label htmlFor="mfa-code">Code TOTP (6 chiffres)</Label>
                                <Input
                                    id="mfa-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="font-mono text-center text-lg tracking-[0.5em]"
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-sm text-destructive">{error}</p>
                                )}
                            </form>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleActivate}
                                disabled={activateMutation.isPending || code.length !== 6}
                            >
                                {activateMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Activer le MFA
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ==================================
// Dialog de désactivation MFA
// ==================================
function MFADisableDialog({
    open,
    onClose,
    onComplete,
}: {
    open: boolean;
    onClose: () => void;
    onComplete: () => void;
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const disableMutation = useMutation({
        mutationFn: (code: string) => apiClient.disableMFA(code),
        onSuccess: () => {
            toast.success('MFA désactivé avec succès.');
            queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
            onComplete();
        },
        onError: (err: any) => {
            setError(err?.message || 'Code invalide.');
        },
    });

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        disableMutation.mutate(code);
    };

    return (
        <AlertDialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Désactiver le MFA
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action réduit la sécurité de votre compte.
                        Entrez votre code TOTP actuel pour confirmer.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form onSubmit={handleDisable} className="space-y-3 py-2">
                    <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Code TOTP (6 chiffres)"
                        className="font-mono text-center text-lg tracking-[0.5em]"
                        autoFocus
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </form>

                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDisable as any}
                        disabled={disableMutation.isPending || code.length !== 6}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {disableMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Désactiver
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
