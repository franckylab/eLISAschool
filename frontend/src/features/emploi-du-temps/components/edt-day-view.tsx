/**
 * ==================================
 * eLISAschool - Vue Journalière EDT
 * ==================================
 * Timeline verticale avec créneaux positionnés
 * Navigation déléguée au parent (architecture unifiée)
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, User, BookOpen, FileText } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import type { CreneauHoraire, JourSemaine } from '../types/edt.types';

interface EDTDayViewProps {
    creneaux: CreneauHoraire[];
    date: Date;
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    heureDebut?: number;
    heureFin?: number;
}

const JOUR_MAP: Record<number, JourSemaine> = {
    1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI',
    4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI',
};

/** Convertit "HH:MM" en minutes depuis minuit */
function heureToMinutes(heure: string): number {
    const [h, m] = heure.split(':').map(Number);
    return h * 60 + (m || 0);
}

/** Convertit des minutes en "HH:MM" */
function minutesToHeure(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function EDTDayView({
    creneaux,
    date,
    onCreneauClick,
    heureDebut = 7,
    heureFin = 18,
}: EDTDayViewProps) {
    const { t } = useTranslation('emplois');

    const jourSemaine = JOUR_MAP[date.getDay()];

    /** Filtrer les créneaux du jour */
    const creneauxJour = useMemo(() => {
        return creneaux
            .filter((c) => c.jour === jourSemaine)
            .sort((a, b) => (a.heureDebut ?? '').localeCompare(b.heureDebut ?? ''));
    }, [creneaux, jourSemaine]);

    const debutMin = heureDebut * 60;
    const finMin = heureFin * 60;
    const dureeTotal = finMin - debutMin;

    /** Lignes horaires */
    const lignesHoraires = useMemo(() => {
        const lignes: number[] = [];
        for (let h = heureDebut; h <= heureFin; h++) {
            lignes.push(h * 60);
        }
        return lignes;
    }, [heureDebut, heureFin]);

    /** Positionner un créneau sur la timeline */
    const positionner = (heureDebut: string, heureFin: string) => {
        const debut = heureToMinutes(heureDebut);
        const fin = heureToMinutes(heureFin);
        const top = ((debut - debutMin) / dureeTotal) * 100;
        const height = ((fin - debut) / dureeTotal) * 100;
        return {
            top: `${Math.max(0, top)}%`,
            height: `${Math.max(2, height)}%`,
        };
    };

    /** Heure actuelle (indicateur temps réel) */
    const maintenant = new Date();
    const estAujourdhui = maintenant.toDateString() === date.toDateString();
    const minutesActuelles = maintenant.getHours() * 60 + maintenant.getMinutes();
    const positionActuelle = estAujourdhui
        ? ((minutesActuelles - debutMin) / dureeTotal) * 100
        : -1;

    const nomJour = jourSemaine ? t(`jours.${jourSemaine.toLowerCase()}`) : t('jour.vide');
    const dateStr = formatDate(date, 'EEEE d MMMM');

    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {/* En-tête */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)]">
                <div>
                    <h3
                        className="font-semibold text-[var(--color-text-primary)] capitalize"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}
                    >
                        {nomJour}
                    </h3>
                    <p
                        className="text-[var(--color-text-muted)] capitalize"
                        style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                    >
                        {dateStr}
                    </p>
                </div>
                <div className="flex items-center gap-[var(--gap-xs)] text-[var(--color-text-secondary)]">
                    <Clock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                    <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        {creneauxJour.length} {t('jour.creneaux', { count: creneauxJour.length })}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            {creneauxJour.length > 0 ? (
                <div className="relative rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-hidden">
                    <div className="relative" style={{ height: 'clamp(400px, 60vh, 700px)' }}>
                        {/* Lignes horaires */}
                        {lignesHoraires.map((min) => {
                            const top = ((min - debutMin) / dureeTotal) * 100;
                            return (
                                <div
                                    key={min}
                                    className="absolute left-0 right-0 border-t border-[var(--color-bordure)]"
                                    style={{ top: `${top}%` }}
                                >
                                    <span
                                        className="absolute left-[var(--space-xs)] -translate-y-1/2 text-[var(--color-text-muted)]"
                                        style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}
                                    >
                                        {minutesToHeure(min)}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Indicateur temps réel */}
                        {positionActuelle >= 0 && positionActuelle <= 100 && (
                            <div
                                className="absolute left-0 right-0 z-10 flex items-center"
                                style={{ top: `${positionActuelle}%` }}
                            >
                                <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)] ml-[clamp(2.5rem,8vw,4rem)]" />
                                <div className="flex-1 h-[2px] bg-[var(--color-danger)]/60" />
                            </div>
                        )}

                        {/* Créneaux */}
                        <div className="absolute inset-0 ml-[clamp(2.5rem,8vw,4rem)] mr-[var(--space-sm)]">
                            {creneauxJour.map((c) => {
                                const pos = positionner(c.heureDebut ?? '08:00', c.heureFin ?? '09:00');
                                const couleur = c.affectationMatiere?.matiere?.couleur;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => onCreneauClick?.(c)}
                                        className="absolute left-0 right-0 rounded-lg border-l-[3px] px-[var(--space-xs)] py-[var(--space-xxs)] text-left transition-all hover:shadow-md hover:brightness-95 overflow-hidden"
                                        style={{
                                            top: pos.top,
                                            height: pos.height,
                                            minHeight: 'clamp(24px, 4vh, 40px)',
                                            borderColor: couleur || 'var(--color-dominant-500)',
                                            backgroundColor: couleur ? `${couleur}15` : 'var(--color-dominant-50)',
                                        }}
                                    >
                                        {/* Matière + classe */}
                                        <div className="flex items-center gap-1">
                                            <p
                                                className="font-medium text-[var(--color-dominant-800)] truncate"
                                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                                            >
                                                {c.affectationMatiere?.matiere?.nom ?? '—'}
                                            </p>
                                            {c.affectationMatiere?.classeAnnee?.classe?.nom && (
                                                <span
                                                    className="shrink-0 rounded bg-[var(--color-dominant-200)] px-1 text-[var(--color-dominant-700)]"
                                                    style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.1vw, 0.625rem)' }}
                                                >
                                                    {c.affectationMatiere.classeAnnee.classe.nom}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-[var(--gap-xs)] gap-y-0">
                                            {c.affectationMatiere?.enseignant && (
                                                <span className="flex items-center gap-0.5 text-[var(--color-dominant-600)] truncate">
                                                    <User className="h-3 w-3 shrink-0" />
                                                    <span style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                                        {c.affectationMatiere?.enseignant?.utilisateur?.profil?.prenom} {c.affectationMatiere?.enseignant?.utilisateur?.profil?.nom}
                                                    </span>
                                                </span>
                                            )}
                                            {c.salle && (
                                                <span className="flex items-center gap-0.5 text-[var(--color-dominant-500)]">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                                        {c.salle.nom}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        {/* Horaire + type + statut */}
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="text-[var(--color-dominant-500)]"
                                                style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)' }}
                                            >
                                                {c.heureDebut?.slice(0, 5)} — {c.heureFin?.slice(0, 5)}
                                            </span>
                                            {c.typeCreneau && c.typeCreneau !== 'COURS' && (
                                                <span
                                                    className="rounded bg-[var(--color-accent-100)] px-1 text-[var(--color-accent-700)]"
                                                    style={{ fontSize: 'clamp(0.4375rem, 0.4rem + 0.1vw, 0.5625rem)' }}
                                                >
                                                    {t(`creneau.types.${c.typeCreneau.toLowerCase()}`)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Notes */}
                                        {c.notes && (
                                            <span
                                                className="flex items-center gap-0.5 text-[var(--color-text-muted)] italic truncate"
                                                style={{ fontSize: 'clamp(0.4375rem, 0.4rem + 0.1vw, 0.5625rem)' }}
                                            >
                                                <FileText className="h-2.5 w-2.5 shrink-0" />
                                                {c.notes}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] py-[var(--space-xl)]">
                    <BookOpen className="mb-[var(--space-sm)] h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                        {t('jour.vide')}
                    </p>
                </div>
            )}
        </div>
    );
}
