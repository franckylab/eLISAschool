/**
 * ==================================
 * eLISAschool - Tab Modules
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Blocks, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
    useConfigModules,
    useToggleModule,
} from '../hooks/use-configuration';

// Données des modules (à récupérer du backend)
const MODULES_INFO: Record<string, { nom: string; description: string; icone: string }> = {
    notes: { nom: 'Notes', description: 'Gestion des notes et évaluations', icone: '📝' },
    bulletins: { nom: 'Bulletins', description: 'Génération des bulletins', icone: '📄' },
    cantine: { nom: 'Cantine', description: 'Gestion de la cantine scolaire', icone: '🍽️' },
    transport: { nom: 'Transport', description: 'Gestion du transport scolaire', icone: '🚌' },
    bibliotheque: { nom: 'Bibliothèque', description: 'Gestion de la bibliothèque', icone: '📚' },
    messagerie: { nom: 'Messagerie', description: 'Communication interne', icone: '💬' },
    finances: { nom: 'Finances', description: 'Gestion financière', icone: '💰' },
    rh: { nom: 'Ressources Humaines', description: 'Gestion du personnel', icone: '👥' },
};

export function ModulesTab() {
    const { data: modulesResponse, isLoading } = useConfigModules();
    const toggleModule = useToggleModule();

    const [modulesActifs, setModulesActifs] = useState<Set<string>>(new Set());

    // Initialiser les modules actifs
    useEffect(() => {
        if (modulesResponse?.data) {
            const actifs = new Set<string>();
            modulesResponse.data
                .filter((m) => m.actif)
                .forEach((m) => actifs.add(m.moduleNom));
            setModulesActifs(actifs);
        }
    }, [modulesResponse]);

    const handleToggle = async (moduleNom: string, actif: boolean) => {
        try {
            await toggleModule.mutateAsync({ moduleNom, actif });
            
            // Mettre à jour l'état local
            setModulesActifs((prev) => {
                const next = new Set(prev);
                if (actif) {
                    next.add(moduleNom);
                } else {
                    next.delete(moduleNom);
                }
                return next;
            });
        } catch (error) {
            console.error(`Erreur lors du toggle du module ${moduleNom}:`, error);
        }
    };

    if (isLoading) {
        return <div className="py-8 text-center">Chargement des modules...</div>;
    }

    const modules = modulesResponse?.data || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    Modules de l'Application
                </h2>
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    Activez ou désactivez les modules selon vos besoins
                </p>
            </div>

            {/* Alerte */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-medium">Attention</p>
                    <p>La désactivation d'un module peut affecter d'autres fonctionnalités dépendantes.</p>
                </div>
            </div>

            {/* Liste des modules */}
            <div className="grid gap-4">
                {Object.entries(MODULES_INFO).map(([moduleNom, info]) => {
                    const estActif = modulesActifs.has(moduleNom);

                    return (
                        <div
                            key={moduleNom}
                            className={cn(
                                'flex items-center justify-between p-4 rounded-lg border transition-colors',
                                estActif
                                    ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                    : 'border-[var(--color-bordure)] bg-[var(--color-surface)]'
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{info.icone}</span>
                                <div>
                                    <h3 className="font-semibold text-[var(--color-texte)]">
                                        {info.nom}
                                    </h3>
                                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                                        {info.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'px-3 py-1 rounded-full text-xs font-medium',
                                        estActif
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                    )}
                                >
                                    {estActif ? 'Actif' : 'Inactif'}
                                </span>

                                <button
                                    onClick={() => handleToggle(moduleNom, !estActif)}
                                    disabled={toggleModule.isPending}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {estActif ? (
                                        <ToggleRight className="h-8 w-8 text-green-600" />
                                    ) : (
                                        <ToggleLeft className="h-8 w-8 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <Blocks className="h-5 w-5 text-[var(--color-dominante)]" />
                    <span className="text-sm font-medium">
                        {modulesActifs.size} / {Object.keys(MODULES_INFO).length} modules actifs
                    </span>
                </div>
                {toggleModule.isPending && (
                    <span className="text-sm text-[var(--color-texte-secondaire)]">
                        Mise à jour en cours...
                    </span>
                )}
            </div>
        </div>
    );
}
