import { Lock, CheckCircle, XCircle, AlertCircle, UserCog, LogOut, Settings } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
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

function ParametreItem({ titre, description, action }: { titre: string; description: string; action: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{titre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{description}</p>
            </div>
            <div className="flex-shrink-0">{action}</div>
        </div>
    );
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    Sécurité
                </h3>
                <div className="space-y-4">
                    <ParametreItem
                        titre="Réinitialiser le mot de passe"
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
                    <ParametreItem
                        titre="Authentification à deux facteurs"
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
                    <ParametreItem
                        titre="État du compte"
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
                    <ParametreItem
                        titre="Sessions actives"
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
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Zone dangereuse
                </h3>
                <div className="space-y-4">
                    <ParametreItem
                        titre="Supprimer le compte"
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
                </div>
            </div>
        </div>
    );
}
