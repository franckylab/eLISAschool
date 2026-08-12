/**
 * ==================================
 * eLISAschool - Composant WebAuthn Setup
 * ==================================
 * Durcissement v9 — Enregistrement de clés de sécurité (passkeys, YubiKey, etc.)
 *
 * Permet à l'utilisateur :
 * - D'enregistrer une nouvelle clé de sécurité
 * - De lister ses credentials existantes
 * - De révoquer une credential
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    KeyRound,
    Shield,
    Trash2,
    Loader2,
    Fingerprint,
    Smartphone,
    Usb,
    Plus,
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

interface WebAuthnCredential {
    id: string;
    label: string | null;
    estBackedUp: boolean;
    derniereUtilisation: string | null;
    authenticatorType: string | null;
    createdAt: string;
}

// ==================================
// Hook pour les credentials WebAuthn
// ==================================

function useWebAuthnCredentials() {
    return useQuery({
        queryKey: ['webauthn-credentials'],
        queryFn: () => apiClient.webauthnListCredentials(),
    });
}

// ==================================
// Icône selon le type d'authentificateur
// ==================================

function getAuthenticatorIcon(type: string | null) {
    switch (type) {
        case 'platform':
            return <Smartphone className="h-4 w-4" />;
        case 'cross-platform':
            return <Usb className="h-4 w-4" />;
        default:
            return <Fingerprint className="h-4 w-4" />;
    }
}

function getAuthenticatorLabel(type: string | null): string {
    switch (type) {
        case 'platform':
            return 'Passkey appareil';
        case 'cross-platform':
            return 'Clé externe';
        default:
            return 'Clé de sécurité';
    }
}

// ==================================
// Composant principal
// ==================================

export function WebAuthnSetup() {
    const queryClient = useQueryClient();
    const { data: credentials, isLoading } = useWebAuthnCredentials();
    const [labelInput, setLabelInput] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [credentialToDelete, setCredentialToDelete] = useState<WebAuthnCredential | null>(null);

    // Mutation : enregistrer une credential
    const registerMutation = useMutation({
        mutationFn: async ({ credential, label }: { credential: any; label: string }) => {
            return apiClient.webauthnRegister(credential, label);
        },
        onSuccess: () => {
            toast.success('Clé de sécurité enregistrée avec succès');
            queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] });
            setIsRegistering(false);
            setLabelInput('');
        },
        onError: (error: Error) => {
            toast.error(`Erreur : ${error.message}`);
            setIsRegistering(false);
        },
    });

    // Mutation : révoquer une credential
    const revokeMutation = useMutation({
        mutationFn: async (credentialId: string) => {
            return apiClient.webauthnRevokeCredential(credentialId);
        },
        onSuccess: () => {
            toast.success('Clé de sécurité révoquée');
            queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] });
            setCredentialToDelete(null);
        },
        onError: (error: Error) => {
            toast.error(`Erreur : ${error.message}`);
        },
    });

    // ==================================
    // Flow d'enregistrement WebAuthn
    // ==================================

    const handleRegister = async () => {
        try {
            setIsRegistering(true);

            // 1. Récupérer les options de création
            const options = await apiClient.webauthnRegisterOptions() as PublicKeyCredentialCreationOptions;

            // 2. Convertir les valeurs base64url en ArrayBuffer
            const publicKeyOptions: PublicKeyCredentialCreationOptions = {
                ...options,
                challenge: base64urlToBuffer(options.challenge as unknown as string),
                user: {
                    ...options.user,
                    id: base64urlToBuffer((options.user as unknown as { id: string }).id),
                },
                excludeCredentials: (options as unknown as { excludeCredentials?: { id: string; type: PublicKeyCredentialDescriptor['type'] }[] }).excludeCredentials?.map(c => ({
                    ...c,
                    id: base64urlToBuffer(c.id),
                })),
            };

            // 3. Créer la credential via le navigateur
            const credential = await navigator.credentials.create({
                publicKey: publicKeyOptions,
            });

            if (!credential) {
                throw new Error('Création de credential annulée');
            }

            // 4. Envoyer la credential au serveur
            const rawCredential = credential as PublicKeyCredential;
            const response = rawCredential.response as AuthenticatorAttestationResponse;

            registerMutation.mutate({
                credential: {
                    id: rawCredential.id,
                    rawId: bufferToBase64url(rawCredential.rawId),
                    type: rawCredential.type,
                    response: {
                        clientDataJSON: bufferToBase64url(response.clientDataJSON),
                        attestationObject: bufferToBase64url(response.attestationObject),
                    },
                    authenticatorAttachment: (rawCredential as unknown as { authenticatorAttachment?: string }).authenticatorAttachment,
                },
                label: labelInput || 'Ma clé de sécurité',
            });
        } catch (error) {
            setIsRegistering(false);
            if (error instanceof Error && error.name === 'NotAllowedError') {
                toast.info('Enregistrement annulé');
            } else {
                toast.error(`Erreur : ${error instanceof Error ? error.message : 'inconnue'}`);
            }
        }
    };

    // ==================================
    // Rendu
    // ==================================

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Clés de sécurité</h3>
            </div>

            <p className="text-sm text-muted-foreground">
                Ajoutez une clé de sécurité (YubiKey, passkey, Touch ID, Windows Hello) pour
                une authentification sans mot de passe.
            </p>

            {/* Bouton d'enregistrement */}
            <Dialog open={isRegistering} onOpenChange={(open) => { if (!open) setIsRegistering(false); }}>
                <Button
                    variant="outline"
                    onClick={() => setIsRegistering(true)}
                    disabled={registerMutation.isPending}
                    className="w-full sm:w-auto"
                >
                    {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    Ajouter une clé
                </Button>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enregistrer une clé de sécurité</DialogTitle>
                        <DialogDescription>
                            Donnez un nom à votre clé pour la retrouver facilement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="webauthn-label">Nom de la clé</Label>
                            <Input
                                id="webauthn-label"
                                placeholder="Ex: YubiKey Bureau, iPhone Passkey..."
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handleRegister}
                                disabled={registerMutation.isPending}
                            >
                                {registerMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Enregistrer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Liste des credentials */}
            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                </div>
            ) : !credentials || credentials.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    <KeyRound className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Aucune clé de sécurité enregistrée
                </div>
            ) : (
                <div className="space-y-2">
                    {credentials.map((cred) => (
                        <div
                            key={cred.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                    {getAuthenticatorIcon(cred.authenticatorType)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        {cred.label || 'Clé sans nom'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getAuthenticatorLabel(cred.authenticatorType)}
                                        {cred.derniereUtilisation && (
                                            <> — Dernière utilisation : {new Date(cred.derniereUtilisation).toLocaleDateString('fr-FR')}</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCredentialToDelete(cred)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialog de confirmation suppression */}
            <AlertDialog
                open={!!credentialToDelete}
                onOpenChange={(open) => { if (!open) setCredentialToDelete(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Révoquer cette clé ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La clé « {credentialToDelete?.label} » ne pourra plus être utilisée
                            pour vous connecter. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => credentialToDelete && revokeMutation.mutate(credentialToDelete.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {revokeMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Révoquer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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

export default WebAuthnSetup;
