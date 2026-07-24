import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { CreneauHoraire } from '../hooks/use-emploi-du-temps';
import { User, MapPin } from 'lucide-react';

interface EDTCalendarProps {
    creneaux: CreneauHoraire[];
}

const COULEURS_MATIERES: Record<string, string> = {
    'math': 'bg-[var(--color-dominant-100)] border-[var(--color-dominant-400)] text-[var(--color-dominant-700)]',
    'mathématique': 'bg-[var(--color-dominant-100)] border-[var(--color-dominant-400)] text-[var(--color-dominant-700)]',
    'français': 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 dark:border-amber-600 text-amber-900 dark:text-amber-200',
    'francais': 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 dark:border-amber-600 text-amber-900 dark:text-amber-200',
    'svt': 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200',
    'biologie': 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200',
    'physique': 'bg-pink-100 dark:bg-pink-900/30 border-pink-500 dark:border-pink-600 text-pink-900 dark:text-pink-200',
    'chimie': 'bg-pink-100 dark:bg-pink-900/30 border-pink-500 dark:border-pink-600 text-pink-900 dark:text-pink-200',
    'histoire': 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200',
    'géographie': 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200',
    'anglais': 'bg-teal-100 dark:bg-teal-900/30 border-teal-500 dark:border-teal-600 text-teal-900 dark:text-teal-200',
    'default': 'bg-[var(--color-surface-alt)] border-[var(--color-bordure)] text-[var(--color-text-primary)]',
};

export function EDTCalendar({ creneaux }: EDTCalendarProps) {
    const { t } = useTranslation('emplois');

    const JOURS = useMemo(() => [
        t('calendrier.lundi').toUpperCase(),
        t('calendrier.mardi').toUpperCase(),
        t('calendrier.mercredi').toUpperCase(),
        t('calendrier.jeudi').toUpperCase(),
        t('calendrier.vendredi').toUpperCase(),
        t('calendrier.samedi').toUpperCase(),
    ], [t]);

    const plan = useMemo(() => {
        const planByDay: Record<string, CreneauHoraire[]> = {};

        for (const creneau of creneaux) {
            if (!planByDay[creneau.jour]) {
                planByDay[creneau.jour] = [];
            }
            planByDay[creneau.jour].push(creneau);
        }

        for (const jour of Object.keys(planByDay)) {
            planByDay[jour].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        }

        return planByDay;
    }, [creneaux]);

    const heures = useMemo(() => {
        const heureSet = new Set<string>();
        for (const creneau of creneaux) {
            heureSet.add(creneau.heureDebut);
        }
        return Array.from(heureSet).sort();
    }, [creneaux]);

    const trouverCreneau = (jour: string, heure: string): CreneauHoraire | null => {
        const creneauxJour = plan[jour] || [];
        return creneauxJour.find(c => c.heureDebut === heure) || null;
    };

    const obtenirCouleur = (matiereNom?: string): string => {
        if (!matiereNom) return COULEURS_MATIERES.default;
        const nom = matiereNom.toLowerCase();
        for (const [key, couleur] of Object.entries(COULEURS_MATIERES)) {
            if (key !== 'default' && nom.includes(key)) {
                return couleur;
            }
        }
        return COULEURS_MATIERES.default;
    };

    const joursActifs = JOURS.filter(jour => plan[jour]);

    if (heures.length === 0) return null;

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-[var(--color-dominant-600)] text-white">
                        <th className="px-4 py-3 text-sm font-semibold border-r border-[var(--color-dominant-700)] w-24">
                            {t('calendrier.heure')}
                        </th>
                        {joursActifs.map(jour => (
                            <th key={jour} className="px-4 py-3 text-sm font-semibold border-r border-[var(--color-dominant-700)] last:border-r-0">
                                {jour.charAt(0) + jour.slice(1).toLowerCase()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {heures.map((heure, index) => (
                        <motion.tr
                            key={heure}
                            className={index % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-alt)]'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-bordure)] bg-[var(--color-surface-alt)]">
                                {heure}
                            </td>
                            {joursActifs.map(jour => {
                                const creneau = trouverCreneau(jour, heure);

                                if (!creneau) {
                                    return (
                                        <td key={jour} className="px-2 py-3 border-r border-[var(--color-bordure)] last:border-r-0 min-h-[80px]">
                                            <div className="h-full min-h-[60px]" />
                                        </td>
                                    );
                                }

                                const couleurClass = obtenirCouleur(creneau.affectationMatiere?.matiere?.nom);

                                return (
                                    <td key={jour} className="px-2 py-2 border-r border-[var(--color-bordure)] last:border-r-0">
                                        <motion.div
                                            className={`p-3 rounded-lg border-l-4 ${couleurClass} shadow-sm`}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <div className="font-semibold text-sm mb-1">
                                                {creneau.affectationMatiere?.matiere?.nom || t('matiereDefaut')}
                                            </div>

                                            {creneau.affectationMatiere?.enseignant && (
                                                <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                                                    <User className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">
                                                        {creneau.affectationMatiere.enseignant.prenom} {creneau.affectationMatiere.enseignant.nom}
                                                    </span>
                                                </div>
                                            )}

                                            {creneau.salleId && (
                                                <div className="flex items-center gap-1 text-xs opacity-70">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{t('salle')} {creneau.salleId.substring(0, 8)}</span>
                                                </div>
                                            )}

                                            <div className="text-xs opacity-60 mt-1">
                                                {creneau.heureDebut} - {creneau.heureFin}
                                            </div>
                                        </motion.div>
                                    </td>
                                );
                            })}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}