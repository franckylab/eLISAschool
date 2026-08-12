/**
 * ==================================
 * eLISAschool - Composant WebAuthn Login
 * ==================================
 * Durcissement v9 — Connexion passwordless par clé de sécurité.
 *
 * Utilise l'API WebAuthn du navigateur pour une authentification
 * sans mot de passe (YubiKey, Touch ID, Windows Hello, Passkeys).
 *
 * Intégration : bouton "Se connecter avec une clé de sécurité"
 * dans LoginPage.tsx.
 */

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Fingerprint,
    Loader2,
    KeyRound,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface WebAuthnLoginProps {
    /** Callback appelé après connexion réussie */
    onLoginSuccess: (data: {
        accessToken: string;
        refreshToken: string;
        utilisateur: {
            id: string;
            email: string;
            matricule: string;
            role: string;
            pseudonyme?: string;
        };
    }) => void;
    /** Email pré-rempli (optionnel, pour filtrer les credentials) */
    email?: string;
}

export function WebAuthnLogin({ onLoginSuccess, email: initialEmail }: WebAuthnLoginProps) {
    const [email, setEmail] = useState(initialEmail || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEmailInput] = useState(!initialEmail);

    // ==================================
    // Flow de connexion WebAuthn
    // ==================================

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 1. Récupérer les options d'authentification
            const options = await apiClient.webauthnLoginOptions(email || undefined);

            // 2. Convertir les valeurs base64url en ArrayBuffer
            const publicKeyOptions: PublicKeyCredentialRequestOptions = {
                challenge: base64urlToBuffer(options.challenge),
                timeout: options.timeout,
                rpId: options.rpId,
                userVerification: options.userVerification as UserVerificationRequirement,
                allowCredentials: options.allowCredentials?.map((c: { id: string; type: string; transports?: string[] }) => ({
                    ...c,
                    id: base64urlToBuffer(c.id),
                })),
            };

            // 3. Demander au navigateur de récupérer la credential
            const assertion = await navigator.credentials.get({
                publicKey: publicKeyOptions,
            }) as PublicKeyCredential | null;

            if (!assertion) {
                throw new Error('Authentification annulée');
            }

            const response = assertion.response as AuthenticatorAssertionResponse;

            // 4. Envoyer la réponse au serveur pour vérification
            const loginData = await apiClient.webauthnLogin({
                id: assertion.id,
                rawId: bufferToBase64url(assertion.rawId),
                type: assertion.type,
                response: {
                    clientDataJSON: bufferToBase64url(response.clientDataJSON),
                    authenticatorData: bufferToBase64url(response.authenticatorData),
                    signature: bufferToBase64url(response.signature),
                    userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : undefined,
                },
            });

            // 5. Connexion réussie
            onLoginSuccess(loginData);
            toast.success('Connexion par clé de sécurité réussie');
        } catch (err) {
            setIsLoading(false);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Authentification annulée. Veuillez réessayer.');
                } else if (err.name === 'SecurityError') {
                    setError('Connexion non sécurisée. WebAuthn nécessite HTTPS.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Erreur inconnue lors de l\'authentification');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ==================================
    // Vérifier le support WebAuthn
    // ==================================

    if (!window.PublicKeyCredential) {
        return null; // WebAuthn non supporté par le navigateur
    }

    // ==================================
    // Rendu
    // ==================================

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Ou continuer avec
                    </span>
                </div>
            </div>

            {showEmailInput && !initialEmail && (
                <div className="space-y-2">
                    <Label htmlFor="webauthn-email" className="sr-only">
                        Email (optionnel)
                    </Label>
                    <Input
                        id="webauthn-email"
                        type="email"
                        placeholder="Email (optionnel)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <Button
                variant="outline"
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vérification...
                    </>
                ) : (
                    <>
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Se connecter avec une clé de sécurité
                    </>
                )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                <KeyRound className="mr-1 inline h-3 w-3" />
                YubiKey, Touch ID, Windows Hello, Passkeys
            </p>
        </div>
    );
}

// ==================================
// Utilitaires base64url ↔ ArrayBuffer
// ==================================

function base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default WebAuthnLogin;
