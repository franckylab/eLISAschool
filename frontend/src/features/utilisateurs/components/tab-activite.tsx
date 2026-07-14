import { motion } from 'framer-motion';
import { Activity, Key, Unlock, Shield } from 'lucide-react';
import type { Utilisateur } from '../types/utilisateur.types';

function ActiviteItem({ icone, titre, description, couleur }: { icone: React.ReactNode; titre: string; description: string; couleur: string }) {
    const couleurs: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        gray: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className={`p-2 rounded-full ${couleurs[couleur]}`}>
                {icone}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{titre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
            </div>
        </div>
    );
}

export function TabActivite({ utilisateur }: { utilisateur: Utilisateur }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
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
                    description={utilisateur.derniereConnexion
                        ? 'Dernier changement inconnu — consulter la sécurité'
                        : 'Jamais connecté'}
                    couleur="gray"
                />
                <ActiviteItem
                    icone={<Shield className="h-4 w-4" />}
                    titre="Authentification 2FA"
                    description={utilisateur.deuxFacteursActif ? 'Activée' : 'Non activée'}
                    couleur={utilisateur.deuxFacteursActif ? 'green' : 'gray'}
                />
            </div>
        </motion.div>
    );
}
