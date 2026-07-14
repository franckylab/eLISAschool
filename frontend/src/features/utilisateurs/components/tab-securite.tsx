import { Lock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { CardSection, SettingsRow } from '@/components/ui';
import type { Utilisateur } from '../types/utilisateur.types';

interface TabSecuriteProps {
    utilisateur: Utilisateur;
    hasPermission: (perm: string) => boolean;
    onForcePasswordReset: () => void;
    onToggle2FA: (actif: boolean) => void;
    onToggleSuspension: () => void;
    onRevokeSessions: () => void;
    isLoading: {
        forceReset: boolean;
        toggle2FA: boolean;
        toggleSuspension: boolean;
        revokeSessions: boolean;
    };
}

export function TabSecurite({
    utilisateur,
    hasPermission,
    onForcePasswordReset,
    onToggle2FA,
    onToggleSuspension,
    onRevokeSessions,
    isLoading,
}: TabSecuriteProps) {
    const peutGererSecurite = hasPermission('utilisateurs:security:update');

    return (
        <div className="space-y-6">
            <CardSection
                icon={<Lock className="h-5 w-5" />}
                title="Sécurité"
            >
                <div className="space-y-4">
                    <SettingsRow
                        title="Réinitialiser le mot de passe"
                        description="Forcer l'utilisateur à changer son mot de passe. Révoque les sessions actives."
                        action={
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                isLoading={isLoading.forceReset}
                                disabled={!peutGererSecurite}
                                onClick={onForcePasswordReset}
                            >
                                Réinitialiser
                            </ElisaButton>
                        }
                    />
                    <SettingsRow
                        title="Authentification à deux facteurs"
                        description={utilisateur.deuxFacteursActif ? 'Actuellement activée' : 'Actuellement désactivée'}
                        action={
                            <ElisaToggle
                                checked={utilisateur.deuxFacteursActif || false}
                                onCheckedChange={onToggle2FA}
                                disabled={!peutGererSecurite || isLoading.toggle2FA}
                                size="sm"
                            />
                        }
                    />
                    <SettingsRow
                        title="État du compte"
                        description={utilisateur.statut === 'SUSPENDU'
                            ? 'Compte suspendu'
                            : utilisateur.statut === 'ACTIF'
                                ? 'Compte actif'
                                : `Compte ${utilisateur.statut?.toLowerCase() || 'inconnu'}`}
                        action={
                            <ElisaButton
                                variant={utilisateur.statut === 'SUSPENDU' ? 'primary' : 'danger'}
                                size="sm"
                                isLoading={isLoading.toggleSuspension}
                                disabled={!peutGererSecurite}
                                onClick={onToggleSuspension}
                                icon={utilisateur.statut === 'SUSPENDU'
                                    ? <CheckCircle className="h-4 w-4" />
                                    : <XCircle className="h-4 w-4" />}
                            >
                                {utilisateur.statut === 'SUSPENDU' ? 'Réactiver' : 'Suspendre'}
                            </ElisaButton>
                        }
                    />
                    <SettingsRow
                        title="Sessions actives"
                        description="Déconnecter l'utilisateur de tous ses appareils"
                        action={
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                isLoading={isLoading.revokeSessions}
                                disabled={!peutGererSecurite}
                                onClick={onRevokeSessions}
                                icon={<LogOut className="h-4 w-4" />}
                            >
                                Déconnecter
                            </ElisaButton>
                        }
                    />
                </div>
            </CardSection>

            <CardSection
                icon={<AlertCircle className="h-5 w-5 text-red-500" />}
                title={<span className="text-red-600 dark:text-red-400">Zone dangereuse</span>}
                className="border-red-200 dark:border-red-800"
            >
                <SettingsRow
                    title="Supprimer le compte"
                    description="Cette action est irréversible. Toutes les données associées seront perdues."
                    action={
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            disabled={!hasPermission('utilisateurs:delete')}
                        >
                            Supprimer définitivement
                        </ElisaButton>
                    }
                />
            </CardSection>
        </div>
    );
}
