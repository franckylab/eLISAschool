/**
 * ==================================
 * eLISAschool - Tab Notifications
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { BellIcon, Mail, Smartphone, Monitor, Save } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { cn } from '@/lib/cn';

interface CanalNotification {
    id: string;
    nom: string;
    description: string;
    icone: React.ElementType;
    actif: boolean;
}

export function NotificationsTab() {
    const [canaux, setCanaux] = useState<CanalNotification[]>([
        {
            id: 'email',
            nom: 'Email',
            description: 'Notifications par courrier électronique',
            icone: Mail,
            actif: true,
        },
        {
            id: 'sms',
            nom: 'SMS',
            description: 'Notifications par texto',
            icone: Smartphone,
            actif: false,
        },
        {
            id: 'push',
            nom: 'Push Web',
            description: 'Notifications dans le navigateur',
            icone: Monitor,
            actif: true,
        },
        {
            id: 'websocket',
            nom: 'Temps réel',
            description: 'Notifications instantanées via WebSocket',
            icone: BellIcon,
            actif: true,
        },
    ]);

    const [preferences, setPreferences] = useState({
        nouvellesInscriptions: true,
        notesAjoutees: true,
        bulletinsDisponibles: true,
        paiementsRecus: true,
        absencesSignalees: true,
        retardTransport: false,
        rappelsEcheances: true,
    });

    const toggleCanal = (id: string) => {
        setCanaux((prev) =>
            prev.map((canal) =>
                canal.id === id ? { ...canal, actif: !canal.actif } : canal
            )
        );
    };

    const togglePreference = (key: keyof typeof preferences) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = () => {
        // TODO: Appeler l'API pour sauvegarder
        console.log('Sauvegarde des préférences de notification:', { canaux, preferences });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    Notifications
                </h2>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    Configurez les canaux et préférences de notification
                </p>
            </div>

            {/* Canaux de notification */}
            <div>
                <h3 className="text-md font-semibold text-[var(--color-texte)] mb-3">
                    Canaux de notification
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {canaux.map((canal) => {
                        const Icon = canal.icone;
                        return (
                            <button
                                key={canal.id}
                                onClick={() => toggleCanal(canal.id)}
                                className={cn(
                                    'flex items-center gap-3 p-4 rounded-lg border transition-all',
                                    canal.actif
                                        ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                        : 'border-[var(--color-bordure)] hover:border-gray-300 dark:hover:border-gray-600'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-6 w-6',
                                        canal.actif
                                            ? 'text-[var(--color-dominante)]'
                                            : 'text-gray-400 dark:text-gray-500'
                                    )}
                                />
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-[var(--color-texte)]">
                                        {canal.nom}
                                    </p>
                                    <p className="text-xs text-[var(--color-texte-secondaire)]">
                                        {canal.description}
                                    </p>
                                </div>
                                <div
                                    className={cn(
                                        'w-12 h-6 rounded-full relative transition-colors',
                                        canal.actif
                                            ? 'bg-[var(--color-dominante)]'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                                            canal.actif ? 'translate-x-6' : 'translate-x-0.5'
                                        )}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Préférences de notification */}
            <div>
                <h3 className="text-md font-semibold text-[var(--color-texte)] mb-3">
                    Préférences par événement
                </h3>
                <div className="space-y-2">
                    {Object.entries({
                        nouvellesInscriptions: 'Nouvelles inscriptions',
                        notesAjoutees: 'Notes ajoutées',
                        bulletinsDisponibles: 'Bulletins disponibles',
                        paiementsRecus: 'Paiements reçus',
                        absencesSignalees: 'Absences signalées',
                        retardTransport: 'Retards de transport',
                        rappelsEcheances: 'Rappels d\'échéances',
                    }).map(([key, label]) => (
                        <label
                            key={key}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <span className="text-sm text-[var(--color-texte)]">{label}</span>
                            <input
                                type="checkbox"
                                checked={preferences[key as keyof typeof preferences]}
                                onChange={() => togglePreference(key as keyof typeof preferences)}
                                className="w-5 h-5 text-[var(--color-dominante)] border-gray-300 dark:border-gray-600 rounded focus:ring-[var(--color-dominante)]"
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Bouton sauvegarder */}
            <ElisaButton
                variant="primary"
                onClick={handleSave}
                icon={<Save className="h-4 w-4" />}
            >
                Enregistrer les préférences
            </ElisaButton>
        </div>
    );
}
