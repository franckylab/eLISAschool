/**
 * ==================================
 * eLISAschool - Calendrier Visuel Emploi du Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Affiche l'emploi du temps sous forme de tableau hebdomadaire
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Creneau } from '../hooks/use-emploi-du-temps';
import { User, MapPin } from 'lucide-react';

interface EDTCalendarProps {
    creneaux: Creneau[];
}

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

// Couleurs par matière
const COULEURS_MATIERES: Record<string, string> = {
    'math': 'bg-blue-100 border-blue-500 text-blue-900',
    'mathématique': 'bg-blue-100 border-blue-500 text-blue-900',
    'français': 'bg-amber-100 border-amber-500 text-amber-900',
    'francais': 'bg-amber-100 border-amber-500 text-amber-900',
    'svt': 'bg-emerald-100 border-emerald-500 text-emerald-900',
    'biologie': 'bg-emerald-100 border-emerald-500 text-emerald-900',
    'physique': 'bg-pink-100 border-pink-500 text-pink-900',
    'chimie': 'bg-pink-100 border-pink-500 text-pink-900',
    'histoire': 'bg-indigo-100 border-indigo-500 text-indigo-900',
    'géographie': 'bg-indigo-100 border-indigo-500 text-indigo-900',
    'anglais': 'bg-teal-100 border-teal-500 text-teal-900',
    'default': 'bg-gray-100 border-gray-500 text-gray-900',
};

export function EDTCalendar({ creneaux }: EDTCalendarProps) {
    // Organiser les créneaux par jour et heure
    const plan = useMemo(() => {
        const planByDay: Record<string, Creneau[]> = {};
        
        for (const creneau of creneaux) {
            if (!planByDay[creneau.jour]) {
                planByDay[creneau.jour] = [];
            }
            planByDay[creneau.jour].push(creneau);
        }

        // Trier chaque jour par heure de début
        for (const jour of Object.keys(planByDay)) {
            planByDay[jour].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        }

        return planByDay;
    }, [creneaux]);

    // Extraire toutes les heures uniques
    const heures = useMemo(() => {
        const heureSet = new Set<string>();
        for (const creneau of creneaux) {
            heureSet.add(creneau.heureDebut);
        }
        return Array.from(heureSet).sort();
    }, [creneaux]);

    // Trouver un créneau pour un jour et une heure
    const trouverCreneau = (jour: string, heure: string): Creneau | null => {
        const creneauxJour = plan[jour] || [];
        return creneauxJour.find(c => c.heureDebut === heure) || null;
    };

    // Obtenir la classe CSS pour la couleur
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

    if (heures.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-[var(--color-dominant-600)] text-white">
                        <th className="px-4 py-3 text-sm font-semibold border-r border-[var(--color-dominant-700)] w-24">
                            Heure
                        </th>
                        {joursActifs.map(jour => (
                            <th key={jour} className="px-4 py-3 text-sm font-semibold border-r border-[var(--color-dominant-700) last:border-r-0">
                                {formaterJour(jour)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {heures.map((heure, index) => (
                        <motion.tr
                            key={heure}
                            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-700 border-r border-gray-200 bg-gray-100">
                                {heure}
                            </td>
                            {joursActifs.map(jour => {
                                const creneau = trouverCreneau(jour, heure);
                                
                                if (!creneau) {
                                    return (
                                        <td key={jour} className="px-2 py-3 border-r border-gray-200 last:border-r-0 min-h-[80px]">
                                            <div className="h-full min-h-[60px]" />
                                        </td>
                                    );
                                }

                                const couleurClass = obtenirCouleur(creneau.matiere?.nom);

                                return (
                                    <td key={jour} className="px-2 py-2 border-r border-gray-200 last:border-r-0">
                                        <motion.div
                                            className={`p-3 rounded-lg border-l-4 ${couleurClass} shadow-sm`}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <div className="font-semibold text-sm mb-1">
                                                {creneau.matiere?.nom || 'Matière'}
                                            </div>
                                            
                                            {creneau.enseignant && (
                                                <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                                                    <User className="h-3 w-3" />
                                                    <span>
                                                        {creneau.enseignant.prenom} {creneau.enseignant.nom}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {creneau.salleId && (
                                                <div className="flex items-center gap-1 text-xs opacity-70">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Salle {creneau.salleId.substring(0, 8)}</span>
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

function formaterJour(jour: string): string {
    const joursMap: Record<string, string> = {
        'LUNDI': 'Lundi',
        'MARDI': 'Mardi',
        'MERCREDI': 'Mercredi',
        'JEUDI': 'Jeudi',
        'VENDREDI': 'Vendredi',
        'SAMEDI': 'Samedi',
    };
    return joursMap[jour] || jour;
}
