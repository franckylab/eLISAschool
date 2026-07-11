/**
 * ==================================
 * eLISAschool - Page Détail Utilisateur
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page de détail d'un utilisateur avec onglets multiples
 */

import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, User, Mail, Phone, Shield, Calendar, MapPin, 
    Activity, Key, Settings, Edit, Trash2, Lock, Unlock,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { useUtilisateur, useSupprimerUtilisateur } from '../hooks/use-utilisateurs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';

type Onglet = 'informations' | 'permissions' | 'activite' | 'parametres';

export function UtilisateurDetailPage() {
    const { id } = useParams({ from: '/_auth/utilisateurs/$id' });
    const { hasPermission } = usePermissions();
    
    const [ongletActif, setOngletActif] = useState<Onglet>('informations');
    const [utilisateurToDelete, setUtilisateurToDelete] = useState(false);

    const { data: utilisateur, isLoading, error, refetch } = useUtilisateur(id);
    const supprimer = useSupprimerUtilisateur();

    const onglets: { id: Onglet; label: string; icone: React.ReactNode }[] = [
        { id: 'informations', label: 'Informations', icone: <User className="h-4 w-4" /> },
        { id: 'permissions', label: 'Permissions', icone: <Shield className="h-4 w-4" /> },
        { id: 'activite', label: 'Activité', icone: <Activity className="h-4 w-4" /> },
        { id: 'parametres', label: 'Paramètres', icone: <Settings className="h-4 w-4" /> },
    ];

    // Affichage skeleton
    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    // Affichage erreur
    if (error || !utilisateur) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title="Utilisateur non trouvé"
                    message={error?.message || "Impossible de charger les détails de l'utilisateur"}
                    onRetry={() => refetch()}
                    retryLabel="Réessayer"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header avec navigation */}
            <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        icon={<ArrowLeft className="h-4 w-4" />}
                        onClick={() => { window.location.href = '/utilisateurs'; }}
                    >
                        Retour
                    </ElisaButton>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {utilisateur.prenom} {utilisateur.nom}
                        </h1>
                        <p className="text-sm text-gray-600">{utilisateur.email}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission('utilisateurs:edit') && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                        >
                            Modifier
                        </ElisaButton>
                    )}
                    {hasPermission('utilisateurs:delete') && (
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => setUtilisateurToDelete(true)}
                        >
                            Supprimer
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Badge statut et rôle */}
            <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    utilisateur.statut === 'ACTIF' ? 'bg-green-100 text-green-800' :
                    utilisateur.statut === 'SUSPENDU' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {utilisateur.statut === 'ACTIF' ? <CheckCircle className="h-4 w-4" /> :
                     utilisateur.statut === 'SUSPENDU' ? <XCircle className="h-4 w-4" /> :
                     <AlertCircle className="h-4 w-4" />}
                    {utilisateur.statut === 'ACTIF' ? 'Actif' :
                     utilisateur.statut === 'SUSPENDU' ? 'Suspendu' : 'Inactif'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-dominant-100)] px-4 py-2 text-sm font-medium text-[var(--color-dominant-800)]">
                    <Shield className="h-4 w-4" />
                    {utilisateur.role}
                </span>
                {utilisateur.deuxFacteursActif && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                        <Lock className="h-4 w-4" />
                        2FA activé
                    </span>
                )}
            </motion.div>

            {/* Onglets */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-b border-gray-200"
            >
                <nav className="-mb-px flex gap-6">
                    {onglets.map((onglet) => (
                        <button
                            key={onglet.id}
                            onClick={() => setOngletActif(onglet.id)}
                            className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                                ongletActif === onglet.id
                                    ? 'border-[var(--color-dominant-500)] text-[var(--color-dominant-600)]'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {onglet.icone}
                            {onglet.label}
                        </button>
                    ))}
                </nav>
            </motion.div>

            {/* Contenu des onglets */}
            <motion.div
                key={ongletActif}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                {ongletActif === 'informations' && <OngletInformations utilisateur={utilisateur} />}
                {ongletActif === 'permissions' && <OngletPermissions utilisateur={utilisateur} />}
                {ongletActif === 'activite' && <OngletActivite utilisateur={utilisateur} />}
                {ongletActif === 'parametres' && <OngletParametres utilisateur={utilisateur} />}
            </motion.div>

            {/* Modal Confirmation Suppression */}
            <ConfirmationModal
                isOpen={utilisateurToDelete}
                title="Supprimer cet utilisateur"
                message={`Êtes-vous sûr de vouloir supprimer ${utilisateur.prenom} ${utilisateur.nom} ?`}
                details="Cette action est irréversible et désactivera tous les accès associés."
                variant="danger"
                onConfirm={async () => {
                    await supprimer.mutateAsync(utilisateur.id);
                    window.location.href = '/utilisateurs';
                }}
                onCancel={() => setUtilisateurToDelete(false)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

// ==================== ONGLET INFORMATIONS ====================

function OngletInformations({ utilisateur }: { utilisateur: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    Informations personnelles
                </h3>
                <div className="space-y-4">
                    <InfoField label="Prénom" value={utilisateur.prenom} />
                    <InfoField label="Nom" value={utilisateur.nom} />
                    <InfoField label="Email" value={utilisateur.email} icon={<Mail className="h-4 w-4" />} />
                    <InfoField label="Téléphone" value={utilisateur.telephone || 'Non renseigné'} icon={<Phone className="h-4 w-4" />} />
                    <InfoField 
                        label="Date de naissance" 
                        value={utilisateur.profil?.dateNaissance 
                            ? new Date(utilisateur.profil.dateNaissance).toLocaleDateString('fr-FR')
                            : 'Non renseignée'} 
                        icon={<Calendar className="h-4 w-4" />} 
                    />
                    <InfoField label="Adresse" value={utilisateur.profil?.adresse || 'Non renseignée'} icon={<MapPin className="h-4 w-4" />} />
                </div>
            </motion.div>

            {/* Informations système */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    Informations système
                </h3>
                <div className="space-y-4">
                    <InfoField label="Rôle" value={utilisateur.role} />
                    <InfoField label="Statut" value={utilisateur.statut} />
                    <InfoField 
                        label="Dernière connexion" 
                        value={utilisateur.derniereConnexion 
                            ? new Date(utilisateur.derniereConnexion).toLocaleString('fr-FR')
                            : 'Jamais connecté'} 
                    />
                    <InfoField 
                        label="Date de création" 
                        value={new Date(utilisateur.createdAt).toLocaleDateString('fr-FR')} 
                    />
                    <InfoField 
                        label="Dernière modification" 
                        value={new Date(utilisateur.updatedAt).toLocaleDateString('fr-FR')} 
                    />
                    <InfoField label="Établissement ID" value={utilisateur.etablissementId} />
                </div>
            </motion.div>
        </div>
    );
}

// ==================== ONGLET PERMISSIONS ====================

function OngletPermissions({ utilisateur }: { utilisateur: any }) {
    const permissions = utilisateur.permissions || [];
    const permissionsGroupedByModule = permissions.reduce((acc: any, perm: string) => {
        const [module] = perm.split(':');
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                Permissions effectives ({permissions.length})
            </h3>
            <div className="space-y-6">
                {Object.entries(permissionsGroupedByModule).map(([module, perms]) => (
                    <div key={module}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                            {module.replace(/-/g, ' ')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(perms as string[]).map((perm) => (
                                <div key={perm} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{perm}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {permissions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune permission attribuée</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== ONGLET ACTIVITÉ ====================

function OngletActivite({ utilisateur }: { utilisateur: any }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-dominant-600)]" />
                Historique d'activité
            </h3>
            <div className="space-y-4">
                <ActiviteItem
                    icone={<Key className="h-4 w-4" />}
                    titre="Dernière connexion"
                    description={utilisateur.derniereConnexion 
                        ? new Date(utilisateur.derniereConnexion).toLocaleString('fr-FR')
                        : 'Jamais connecté'}
                    couleur="blue"
                />
                <ActiviteItem
                    icone={<Unlock className="h-4 w-4" />}
                    titre="Mot de passe"
                    description={utilisateur.motDePasseExpire ? 'Expiré - nécessite changement' : 'Valide'}
                    couleur={utilisateur.motDePasseExpire ? 'red' : 'green'}
                />
                <ActiviteItem
                    icone={<Shield className="h-4 w-4" />}
                    titre="Authentification 2FA"
                    description={utilisateur.deuxFacteursActif ? 'Activée' : 'Non activée'}
                    couleur={utilisateur.deuxFacteursActif ? 'green' : 'gray'}
                />
            </div>
        </div>
    );
}

// ==================== ONGLET PARAMÈTRES ====================

function OngletParametres({ utilisateur }: { utilisateur: any }) {
    return (
        <div className="space-y-6">
            {/* Sécurité */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    Sécurité
                </h3>
                <div className="space-y-4">
                    <ParametreItem
                        titre="Changer le mot de passe"
                        description="Forcer l'utilisateur à changer son mot de passe"
                        action={<ElisaButton variant="outline" size="sm">Réinitialiser</ElisaButton>}
                    />
                    <ParametreItem
                        titre="Authentification à deux facteurs"
                        description={utilisateur.deuxFacteursActif ? 'Actuellement activée' : 'Actuellement désactivée'}
                        action={
                            <ElisaButton 
                                variant={utilisateur.deuxFacteursActif ? 'danger' : 'primary'} 
                                size="sm"
                            >
                                {utilisateur.deuxFacteursActif ? 'Désactiver' : 'Activer'}
                            </ElisaButton>
                        }
                    />
                    <ParametreItem
                        titre="Suspendre le compte"
                        description={utilisateur.statut === 'SUSPENDU' ? 'Compte actuellement suspendu' : 'Compte actuellement actif'}
                        action={
                            <ElisaButton 
                                variant={utilisateur.statut === 'SUSPENDU' ? 'primary' : 'warning'} 
                                size="sm"
                            >
                                {utilisateur.statut === 'SUSPENDU' ? 'Réactiver' : 'Suspendre'}
                            </ElisaButton>
                        }
                    />
                </div>
            </div>

            {/* Zone dangereuse */}
            <div className="bg-white rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Zone dangereuse
                </h3>
                <div className="space-y-4">
                    <ParametreItem
                        titre="Supprimer le compte"
                        description="Cette action est irréversible. Toutes les données associées seront perdues."
                        action={<ElisaButton variant="danger" size="sm">Supprimer définitivement</ElisaButton>}
                    />
                </div>
            </div>
        </div>
    );
}

// ==================== COMPOSANTS UTILITAIRES ====================

function InfoField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-gray-400">{icon}</div>}
            <div className="flex-1">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function ActiviteItem({ icone, titre, description, couleur }: any) {
    const couleurs: any = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        gray: 'bg-gray-100 text-gray-600',
    };
    
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
            <div className={`p-2 rounded-full ${couleurs[couleur]}`}>
                {icone}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{titre}</p>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}

function ParametreItem({ titre, description, action }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{titre}</p>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div>{action}</div>
        </div>
    );
}
