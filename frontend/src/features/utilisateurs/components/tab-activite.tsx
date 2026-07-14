import { Activity, Key, Unlock, Shield } from 'lucide-react';
import { CardSection, ActivityItem } from '@/components/ui';
import type { Utilisateur } from '../types/utilisateur.types';

export function TabActivite({ utilisateur }: { utilisateur: Utilisateur }) {
    return (
        <CardSection
            icon={<Activity className="h-5 w-5" />}
            title="Historique d'activité"
        >
            <div className="space-y-4">
                <ActivityItem
                    icon={<Key className="h-4 w-4" />}
                    title="Dernière connexion"
                    description={utilisateur.derniereConnexion
                        ? new Date(utilisateur.derniereConnexion).toLocaleString('fr-FR')
                        : 'Jamais connecté'}
                    color="blue"
                />
                <ActivityItem
                    icon={<Unlock className="h-4 w-4" />}
                    title="Mot de passe"
                    description={utilisateur.derniereConnexion
                        ? 'Dernier changement inconnu — consulter la sécurité'
                        : 'Jamais connecté'}
                    color="gray"
                />
                <ActivityItem
                    icon={<Shield className="h-4 w-4" />}
                    title="Authentification 2FA"
                    description={utilisateur.deuxFacteursActif ? 'Activée' : 'Non activée'}
                    color={utilisateur.deuxFacteursActif ? 'green' : 'gray'}
                />
            </div>
        </CardSection>
    );
}
