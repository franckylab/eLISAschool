import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, Calendar, BarChart3, Loader2, Check, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { usePreferencesEDT, useUpdatePreferencesEDT } from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { toast } from 'sonner';

const JOURS_SEMAINE = [
    { value: 'LUNDI', labelKey: 'calendrier.lundi' },
    { value: 'MARDI', labelKey: 'calendrier.mardi' },
    { value: 'MERCREDI', labelKey: 'calendrier.mercredi' },
    { value: 'JEUDI', labelKey: 'calendrier.jeudi' },
    { value: 'VENDREDI', labelKey: 'calendrier.vendredi' },
    { value: 'SAMEDI', labelKey: 'calendrier.samedi' },
] as const;

/** Q7 — Défaut backend : samedi 21:00 + mercredi 21:00 */
const DEFAULT_MATERIALISATION_AUTO = {
    actif: true,
    horaires: [
        { jour: 'SAMEDI', heure: '21:00' },
        { jour: 'MERCREDI', heure: '21:00' },
    ],
};

export function EDTPreferencesPage() {
    const { t } = useTranslation('emplois');
    const { data: preferences, isLoading, error, refetch } = usePreferencesEDT();
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
        materialisationAuto: DEFAULT_MATERIALISATION_AUTO,
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
                materialisationAuto: preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO,
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
            toast.error(t('preferences.erreurJoursOuvrables'));
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
            materialisationAuto: formData.materialisationAuto,
        });
    };

    const majHoraire = (index: number, champ: 'jour' | 'heure', valeur: string) => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: prev.materialisationAuto.horaires.map((h, i) =>
                    i === index ? { ...h, [champ]: valeur } : h,
                ),
            },
        }));
    };

    const ajouterHoraire = () => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: [...prev.materialisationAuto.horaires, { jour: 'SAMEDI', heure: '21:00' }],
            },
        }));
    };

    const supprimerHoraire = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: prev.materialisationAuto.horaires.filter((_, i) => i !== index),
            },
        }));
    };

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable={false} />;

    const inputClass = "w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent transition-colors";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                    className="p-6 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t('preferences.joursTravaille')}</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {JOURS_SEMAINE.map(jour => {
                            const isSelected = formData.joursOuvrables.includes(jour.value);
                            return (
                                <button
                                    key={jour.value}
                                    type="button"
                                    onClick={() => handleToggleJour(jour.value)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        isSelected
                                            ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)]'
                                            : 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-300)]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`font-medium ${isSelected ? 'text-[var(--color-dominant-700)]' : 'text-[var(--color-text-primary)]'}`}>
                                            {t(jour.labelKey)}
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 text-[var(--color-dominant-600)]" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    className="p-6 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t('preferences.horairesCours')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.heureDebut')}</label>
                            <input type="time" value={formData.heureDebutCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureDebutCours: e.target.value }))}
                                className={inputClass} required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.heureFin')}</label>
                            <input type="time" value={formData.heureFinCours}
                                onChange={(e) => setFormData(prev => ({ ...prev, heureFinCours: e.target.value }))}
                                className={inputClass} required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.dureeCreneau')}</label>
                            <input type="number" value={formData.dureeCreneauStandard}
                                onChange={(e) => setFormData(prev => ({ ...prev, dureeCreneauStandard: parseInt(e.target.value) }))}
                                className={inputClass} min="30" max="120" required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.dureeRecreation')}</label>
                            <input type="number" value={formData.dureeRecreation}
                                onChange={(e) => setFormData(prev => ({ ...prev, dureeRecreation: parseInt(e.target.value) }))}
                                className={inputClass} min="5" max="30" required
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={formData.repartitionEquilibree}
                                    onChange={(e) => setFormData(prev => ({ ...prev, repartitionEquilibree: e.target.checked }))}
                                    className="w-5 h-5 rounded border-[var(--color-bordure)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                />
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('preferences.repartitionEquilibree')}</span>
                            </label>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="p-6 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t('preferences.contraintes')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxCreneauxJour')}</label>
                            <input type="number" value={formData.maxCreneauxParJour}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxParJour: parseInt(e.target.value) }))}
                                className={inputClass} min="4" max="12" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxMemeMatiereJour')}</label>
                            <input type="number" value={formData.maxCreneauxMatiereParJour}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxMatiereParJour: parseInt(e.target.value) }))}
                                className={inputClass} min="1" max="4" required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxConsecutifsMatiere')}</label>
                            <input type="number" value={formData.maxCreneauxConsecutifs}
                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxConsecutifs: parseInt(e.target.value) }))}
                                className={inputClass} min="1" max="3" required
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="p-6 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <RefreshCw className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{t('preferences.materialisationAuto')}</h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        {t('preferences.materialisationAutoAide')}
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                        <input type="checkbox" checked={formData.materialisationAuto.actif}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                materialisationAuto: { ...prev.materialisationAuto, actif: e.target.checked },
                            }))}
                            className="w-5 h-5 rounded border-[var(--color-bordure)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                        />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('preferences.materialisationActive')}</span>
                    </div>

                    <div className="space-y-3">
                        {formData.materialisationAuto.horaires.map((horaire, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <select
                                    value={horaire.jour}
                                    onChange={(e) => majHoraire(index, 'jour', e.target.value)}
                                    className={`${inputClass} flex-1`}
                                    disabled={!formData.materialisationAuto.actif}
                                >
                                    {JOURS_SEMAINE.map(j => (
                                        <option key={j.value} value={j.value}>{t(j.labelKey)}</option>
                                    ))}
                                </select>
                                <input type="time" value={horaire.heure}
                                    onChange={(e) => majHoraire(index, 'heure', e.target.value)}
                                    className={`${inputClass} flex-1`} required
                                    disabled={!formData.materialisationAuto.actif}
                                />
                                <button
                                    type="button"
                                    onClick={() => supprimerHoraire(index)}
                                    disabled={!formData.materialisationAuto.actif || formData.materialisationAuto.horaires.length <= 1}
                                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors disabled:opacity-40"
                                    aria-label={t('preferences.supprimerHoraire')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <ElisaButton type="button" variant="outline" size="sm" onClick={ajouterHoraire}
                        icon={<Plus className="h-4 w-4" />}
                        disabled={!formData.materialisationAuto.actif || formData.materialisationAuto.horaires.length >= 14}
                        className="mt-4"
                    >
                        {t('preferences.ajouterHoraire')}
                    </ElisaButton>
                </motion.div>

                <motion.div className="flex justify-end gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <ElisaButton type="button" variant="outline" size="lg" onClick={() => {
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
                                materialisationAuto: preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO,
                            });
                        }
                    }}>
                        {t('preferences.reinitialiser')}
                    </ElisaButton>
                    <ElisaButton type="submit" variant="primary" size="lg"
                        icon={updatePreferences.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        disabled={updatePreferences.isPending}
                    >
                        {updatePreferences.isPending ? t('preferences.enregistrement') : t('preferences.enregistrer')}
                    </ElisaButton>
                </motion.div>
            </form>
    );
}