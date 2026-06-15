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
import { Settings, Clock, Calendar, Loader2, Check } from 'lucide-react';
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
        joursTravailles: [] as string[],
        heureDebutCours: '07:30',
        heureFinCours: '17:30',
        dureeCreneauDefaut: 55,
    });

    useEffect(() => {
        if (preferences?.data) {
            setFormData({
                joursTravailles: preferences.data.joursTravailles || [],
                heureDebutCours: preferences.data.heureDebutCours || '07:30',
                heureFinCours: preferences.data.heureFinCours || '17:30',
                dureeCreneauDefaut: preferences.data.dureeCreneauDefaut || 55,
            });
        }
    }, [preferences]);

    const handleToggleJour = (jour: string) => {
        setFormData(prev => ({
            ...prev,
            joursTravailles: prev.joursTravailles.includes(jour)
                ? prev.joursTravailles.filter(j => j !== jour)
                : [...prev.joursTravailles, jour],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.joursTravailles.length === 0) {
            toast.error('Veuillez sélectionner au moins un jour travaillé');
            return;
        }

        await updatePreferences.mutateAsync({
            joursTravailles: formData.joursTravailles,
            heureDebutCours: formData.heureDebutCours,
            heureFinCours: formData.heureFinCours,
            dureeCreneauDefaut: formData.dureeCreneauDefaut,
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
                    className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm"
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
                                    formData.joursTravailles.includes(jour.value)
                                        ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)]'
                                        : 'border-[var(--color-border)] hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{jour.label}</span>
                                    {formData.joursTravailles.includes(jour.value) && (
                                        <Check className="h-4 w-4 text-[var(--color-dominant-600)]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Horaires */}
                <motion.div
                    className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold">Horaires de cours</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Heure de début */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Heure de début
                            </label>
                            <input
                                type="time"
                                value={formData.heureDebutCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureDebutCours: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Heure de fin */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Heure de fin
                            </label>
                            <input
                                type="time"
                                value={formData.heureFinCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureFinCours: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Durée créneau */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Durée par créneau (minutes)
                            </label>
                            <input
                                type="number"
                                value={formData.dureeCreneauDefaut}
                                onChange={(e) => setFormData(prev => ({ ...prev, dureeCreneauDefaut: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent"
                                min="30"
                                max="120"
                                required
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
                                    joursTravailles: preferences.joursTravailles || [],
                                    heureDebutCours: preferences.heureDebutCours || '07:30',
                                    heureFinCours: preferences.heureFinCours || '17:30',
                                    dureeCreneauDefaut: preferences.dureeCreneauDefaut || 55,
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
