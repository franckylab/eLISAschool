/**
 * ==================================
 * eLISAschool - Page Gestion des Préférences EDT
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, Calendar, Layers, BarChart3, Loader2, Check } from 'lucide-react';
import { usePreferencesEDT, useUpdatePreferencesEDT } from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ListLoading } from '@/components/feedback/ListLoading';
import { toast } from 'sonner';

const JOURS_SEMAINE = [
    { value: 'LUNDI', label: 'Lundi' },
    { value: 'MARDI', label: 'Mardi' },
    { value: 'MERCREDI', label: 'Mercredi' },
    { value: 'JEUDI', label: 'Jeudi' },
    { value: 'VENDREDI', label: 'Vendredi' },
    { value: 'SAMEDI', label: 'Samedi' },
];

export function EDTPreferencesPage() {
    const { data: preferences, isLoading } = usePreferencesEDT();
    const updatePreferences = useUpdatePreferencesEDT();

    const [formData, setFormData] = useState({
        joursOuvrables: [] as string[],
        heureDebutCours: '07:30',
        heureFinCours: '17:30',
        dureeCreneauStandard: 55,
        dureeRecreation: 15,
        maxCreneauxParJour: 8,
        maxCreneauxMatiereParJour: 2,
        maxCreneauxConsecutifs: 2,
        repartitionEquilibree: true,
    });

    useEffect(() => {
        if (preferences) {
            setFormData({
                joursOuvrables: preferences.joursOuvrables || [],
                heureDebutCours: preferences.heureDebutCours || '07:30',
                heureFinCours: preferences.heureFinCours || '17:30',
                dureeCreneauStandard: preferences.dureeCreneauStandard || 55,
                dureeRecreation: preferences.dureeRecreation || 15,
                maxCreneauxParJour: preferences.maxCreneauxParJour || 8,
                maxCreneauxMatiereParJour: preferences.maxCreneauxMatiereParJour || 2,
                maxCreneauxConsecutifs: preferences.maxCreneauxConsecutifs || 2,
                repartitionEquilibree: preferences.repartitionEquilibree ?? true,
            });
        }
    }, [preferences]);

    const handleToggleJour = (jour: string) => {
        setFormData(prev => ({
            ...prev,
            joursOuvrables: prev.joursOuvrables.includes(jour)
                ? prev.joursOuvrables.filter(j => j !== jour)
                : [...prev.joursOuvrables, jour],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.joursOuvrables.length === 0) {
            toast.error('Veuillez sélectionner au moins un jour travaillé');
            return;
        }

        await updatePreferences.mutateAsync({
            joursOuvrables: formData.joursOuvrables,
            heureDebutCours: formData.heureDebutCours,
            heureFinCours: formData.heureFinCours,
            dureeCreneauStandard: formData.dureeCreneauStandard,
            dureeRecreation: formData.dureeRecreation,
            maxCreneauxParJour: formData.maxCreneauxParJour,
            maxCreneauxMatiereParJour: formData.maxCreneauxMatiereParJour,
            maxCreneauxConsecutifs: formData.maxCreneauxConsecutifs,
            repartitionEquilibree: formData.repartitionEquilibree,
        });
    };

    if (isLoading) {
        return <ListLoading />;
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl">
            {/* En-tête */}
            <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Settings className="h-8 w-8 text-[var(--color-dominant-600)]" />
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        Préférences - Emploi du Temps
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Configurez les paramètres par défaut pour la génération des emplois du temps
                    </p>
                </div>
            </motion.div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Jours travaillés */}
                <motion.div
                    className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm dark:bg-gray-800 dark:border-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold">Jours travaillés</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {JOURS_SEMAINE.map(jour => (
                            <button
                                key={jour.value}
                                type="button"
                                onClick={() => handleToggleJour(jour.value)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    formData.joursOuvrables.includes(jour.value)
                                        ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)]'
                                        : 'border-[var(--color-border)] hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{jour.label}</span>
                                    {formData.joursOuvrables.includes(jour.value) && (
                                        <Check className="h-4 w-4 text-[var(--color-dominant-600)]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Horaires */}
                <motion.div
                    className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm dark:bg-gray-800 dark:border-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold">Horaires de cours</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Heure de début</label>
                            <input
                                type="time"
                                value={formData.heureDebutCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureDebutCours: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Heure de fin</label>
                            <input
                                type="time"
                                value={formData.heureFinCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureFinCours: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Durée créneau (min)</label>
                            <input
                                type="number"
                                value={formData.dureeCreneauStandard}
                                onChange={(e) => setFormData(prev => ({ ...prev, dureeCreneauStandard: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                min="30" max="120" required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Durée récréation (min)</label>
                            <input
                                type="number"
                                value={formData.dureeRecreation}
                                onChange={(e) => setFormData(prev => ({ ...prev, dureeRecreation: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                min="5" max="30" required
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.repartitionEquilibree}
                                    onChange={(e) => setFormData(prev => ({ ...prev, repartitionEquilibree: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium">Répartition équilibrée des matières</span>
                            </label>
                        </div>
                    </div>
                </motion.div>

                {/* Contraintes */}
                <motion.div
                    className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm dark:bg-gray-800 dark:border-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold">Contraintes de planification</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Max créneaux / jour</label>
                            <input
                                type="number"
                                value={formData.maxCreneauxParJour}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxParJour: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                min="4" max="12" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max mêmes matière / jour</label>
                            <input
                                type="number"
                                value={formData.maxCreneauxMatiereParJour}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxMatiereParJour: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                min="1" max="4" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max consécutifs même matière</label>
                            <input
                                type="number"
                                value={formData.maxCreneauxConsecutifs}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxConsecutifs: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                min="1" max="3" required
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    className="flex justify-end gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <ElisaButton
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            if (preferences) {
                                setFormData({
                                    joursOuvrables: preferences.joursOuvrables || [],
                                    heureDebutCours: preferences.heureDebutCours || '07:30',
                                    heureFinCours: preferences.heureFinCours || '17:30',
                                    dureeCreneauStandard: preferences.dureeCreneauStandard || 55,
                                    dureeRecreation: preferences.dureeRecreation || 15,
                                    maxCreneauxParJour: preferences.maxCreneauxParJour || 8,
                                    maxCreneauxMatiereParJour: preferences.maxCreneauxMatiereParJour || 2,
                                    maxCreneauxConsecutifs: preferences.maxCreneauxConsecutifs || 2,
                                    repartitionEquilibree: preferences.repartitionEquilibree ?? true,
                                });
                            }
                        }}
                    >
                        Réinitialiser
                    </ElisaButton>

                    <ElisaButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        icon={updatePreferences.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        disabled={updatePreferences.isPending}
                    >
                        {updatePreferences.isPending ? 'Enregistrement...' : 'Enregistrer les préférences'}
                    </ElisaButton>
                </motion.div>
            </form>
        </div>
    );
}
