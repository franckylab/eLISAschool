/**
 * ==================================
 * eLISAschool - Vue Mensuelle EDT
 * ==================================
 * Grille 7×N avec créneaux colorés par matière
 * Navigation déléguée au parent (architecture unifiée)
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { formatDateInput } from '@/lib/date-utils';
import type { CreneauHoraire, JourSemaine } from '../types/edt.types';

interface EDTMonthViewProps {
    creneaux: CreneauHoraire[];
    mois: Date;
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    onDateClick?: (date: Date) => void;
}

/** Clés i18n pour les abréviations de jours (lundi → samedi) */
const JOURS_SEMAINE_KEYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

const JOURS_INDEX: Record<JourSemaine, number> = {
    LUNDI: 0,
    MARDI: 1,
    MERCREDI: 2,
    JEUDI: 3,
    VENDREDI: 4,
    SAMEDI: 5,
};

export function EDTMonthView({ creneaux, mois, onCreneauClick, onDateClick }: EDTMonthViewProps) {
    const { t } = useTranslation('emplois');

    /** Calcule les jours de la grille (lundi → samedi) */
    const joursGrille = useMemo(() => {
        const annee = mois.getFullYear();
        const moisIdx = mois.getMonth();
        const premierJour = new Date(annee, moisIdx, 1);
        // Lundi = 0, Samedi = 5
        let jourSemaine = premierJour.getDay() - 1;
        if (jourSemaine < 0) jourSemaine = 6;

        const jours: Date[] = [];
        // Remplir les jours vides avant le 1er du mois
        for (let i = 0; i < jourSemaine; i++) {
            const d = new Date(annee, moisIdx, 1 - jourSemaine + i);
            jours.push(d);
        }
        // Tous les jours du mois
        const dernierJour = new Date(annee, moisIdx + 1, 0).getDate();
        for (let j = 1; j <= dernierJour; j++) {
            jours.push(new Date(annee, moisIdx, j));
        }
        // Compléter jusqu'à un multiple de 6 (6 lignes × 6 colonnes)
        while (jours.length % 6 !== 0) {
            const last = jours[jours.length - 1];
            jours.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
        }
        return jours;
    }, [mois]);

    /** Créneaux groupés par jour de semaine (créneaux hebdomadaires récurrents) */
    const creneauxParJour = useMemo(() => {
        const map = new Map<number, CreneauHoraire[]>();
        for (const c of creneaux) {
            const indexJour = JOURS_INDEX[c.jour];
            const arr = map.get(indexJour) ?? [];
            arr.push(c);
            map.set(indexJour, arr);
        }
        return map;
    }, [creneaux]);

    const moisCourant = mois.getMonth();
    const aujourdhui = formatDateInput(new Date());

    /** Formate une date de la grille en YYYY-MM-DD sans décalage UTC */
    const toLocalDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const cellClass = (jour: Date) => {
        const estMoisCourant = jour.getMonth() === moisCourant;
        const estAujourdhui = toLocalDateStr(jour) === aujourdhui;
        return `min-h-[clamp(60px,10vw,90px)] border border-[var(--color-bordure)] p-[var(--space-xxs)] transition-colors ${
            estAujourdhui
                ? 'bg-[var(--color-dominant-50)] ring-1 ring-[var(--color-dominant-400)]'
                : estMoisCourant
                    ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
                    : 'bg-[var(--color-surface-alt)] opacity-50'
        }`;
    };

    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {/* En-tête jours */}
            <div className="grid grid-cols-6 border-b border-[var(--color-bordure)]">
                {JOURS_SEMAINE_KEYS.map((key) => {
                    const full = t(`jours.${key}`);
                    // Abréviation : 3 premiers caractères (universel pour FR/EN)
                    const abbr = full.slice(0, 3);
                    return (
                        <div
                            key={key}
                            className="py-[var(--space-xs)] text-center font-semibold text-[var(--color-text-secondary)]"
                            style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.25vw, 0.8125rem)' }}
                        >
                            <span className="hidden sm:inline">{full}</span>
                            <span className="sm:hidden">{abbr}</span>
                        </div>
                    );
                })}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-6 gap-0">
                {joursGrille.map((jour, idx) => {
                    const colIndex = idx % 6;
                    const creneauxJour = creneauxParJour.get(colIndex) ?? [];
                    const estMoisCourant = jour.getMonth() === moisCourant;

                    return (
                        <div
                            key={idx}
                            className={cellClass(jour)}
                            onClick={() => estMoisCourant && onDateClick?.(jour)}
                            role={estMoisCourant ? 'button' : undefined}
                        >
                            {/* Numéro du jour */}
                            <div
                                className={`mb-[var(--space-xxs)] font-medium ${
                                    estMoisCourant ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                                }`}
                                style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.75rem)' }}
                            >
                                {jour.getDate()}
                            </div>

                            {/* Créneaux (max 3 + indicateur) */}
                            {estMoisCourant && creneauxJour.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                    {creneauxJour.slice(0, 3).map((c) => {
                                        const couleur = c.affectationMatiere?.matiere?.couleur;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCreneauClick?.(c);
                                                }}
                                                className="truncate rounded px-1 py-0.5 text-left text-white transition-opacity hover:opacity-80"
                                                style={{
                                                    fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)',
                                                    backgroundColor: couleur || 'var(--color-dominant-500)',
                                                }}
                                                title={`${c.affectationMatiere?.matiere?.nom ?? ''} ${c.heureDebut?.slice(0, 5) ?? ''}-${c.heureFin?.slice(0, 5) ?? ''}`}
                                            >
                                                <span className="font-medium">{c.heureDebut?.slice(0, 5)}</span>
                                                {' '}
                                                {c.affectationMatiere?.matiere?.nom?.slice(0, 6) ?? '•'}
                                            </button>
                                        );
                                    })}
                                    {creneauxJour.length > 3 && (
                                        <span
                                            className="font-medium text-[var(--color-dominant-600)]"
                                            style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)' }}
                                        >
                                            +{creneauxJour.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* État vide */}
            {creneaux.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] py-[var(--space-xl)]">
                    <Calendar className="mb-[var(--space-sm)] h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                        {t('mois.vide')}
                    </p>
                </div>
            )}
        </div>
    );
}
