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
import { Clock, MapPin, User, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { paletteCreneau, useModeTheme, melangeCouleur } from '@/lib/palette-creneau';
import type { CreneauHoraire, JourSemaine, JourFerie } from '../types/edt.types';
import { EDTLegend } from './edt-legend';

interface EDTDayViewProps {
    creneaux: CreneauHoraire[];
    date: Date;
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    heureDebut?: number;
    heureFin?: number;
    joursFeries?: JourFerie[];
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
    joursFeries,
}: EDTDayViewProps) {
    const { t } = useTranslation('emplois');
    const mode = useModeTheme();

    const jourSemaine = JOUR_MAP[date.getDay()];

    /** Filtrer les créneaux du jour */
    const creneauxJour = useMemo(() => {
        return creneaux
            .filter((c) => c.jour === jourSemaine)
            .sort((a, b) => (a.heureDebut ?? '').localeCompare(b.heureDebut ?? ''));
    }, [creneaux, jourSemaine]);

    const debutMin = heureDebut * 60;
    const finMin = heureFin * 60;
    const dureeTotal = Math.max(finMin - debutMin, 1); // min 1 minute pour éviter division par zéro

    /** Hauteur de la timeline : ~50px/heure, min/max contraints */
    const hauteurTimeline = Math.max(400, Math.min(dureeTotal * 0.83, 900));

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
        const rawTop = ((debut - debutMin) / dureeTotal) * 100;
        const rawHeight = ((fin - debut) / dureeTotal) * 100;
        return {
            top: `${Math.max(0, Number.isFinite(rawTop) ? rawTop : 0)}%`,
            height: `${Math.max(2, Number.isFinite(rawHeight) ? rawHeight : 2)}%`,
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
    const dateStr = formatDate(date, 'd MMMM');

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
                        {t('jour.creneaux', { count: creneauxJour.length })}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            {creneauxJour.length > 0 ? (
                <div className="relative rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] overflow-y-auto" style={{ maxHeight: 'clamp(400px, 70vh, 800px)' }}>
                    <div className="relative" style={{ height: `${hauteurTimeline}px` }}>
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
                                const couleurHex = c.couleur || c.affectationMatiere?.matiere?.couleur;
                                const pal = couleurHex ? paletteCreneau(couleurHex, undefined, mode) : null;
                                const texteCouleur = pal?.texteSurTeinte ?? 'var(--color-text-primary)';
                                const texteSecondaire = pal ? melangeCouleur(pal.texteSurTeinte, 70, mode === 'dark' ? '#94a3b8' : '#6b7280') : 'var(--color-text-secondary)';
                                const ombreSecondaire = `0 0 3px ${pal?.fondTeinte ?? 'var(--color-surface)'}, 0 0 6px ${pal?.fondTeinte ?? 'var(--color-surface)'}`;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => onCreneauClick?.(c)}
                                        className={`absolute left-0 right-0 rounded-lg border-l-[3px] px-[var(--space-xs)] py-[var(--space-xxs)] text-left transition-all hover:shadow-md hover:brightness-95 overflow-hidden ${
                                            c.statut === 'PLANIFIE' ? 'opacity-80' : ''
                                        }`}
                                        style={{
                                            top: pos.top,
                                            height: pos.height,
                                            minHeight: 'clamp(24px, 4vh, 40px)',
                                            borderLeftColor: c.statut === 'VALIDE' ? 'var(--color-success)' : (pal?.bordure ?? 'var(--color-dominant-500)'),
                                            backgroundColor: pal?.fondTeinte ?? 'var(--color-dominant-100)',
                                        }}
                                        title={[
                                            c.affectationMatiere?.matiere?.nom ?? '',
                                            c.affectationMatiere?.classeAnnee?.classe?.nom ? `🎓 ${c.affectationMatiere.classeAnnee.classe.nom}` : '',
                                            c.affectationMatiere?.enseignant?.utilisateur?.profil ? `👤 ${c.affectationMatiere.enseignant.utilisateur.profil?.prenom} ${c.affectationMatiere.enseignant.utilisateur.profil?.nom}` : '',
                                            c.salle?.nom ? `📍 ${c.salle.nom}` : '',
                                            `${c.heureDebut?.slice(0, 5) ?? ''}–${c.heureFin?.slice(0, 5) ?? ''}`,
                                            c.statut === 'VALIDE' ? '✓ Validé' : '⏳ En attente',
                                        ].filter(Boolean).join('\n')}
                                    >
                                        {/* Badges : HC généré (top-left) + statut en attente uniquement (top-right) */}
                                        {c.hasHeuresCours && (
                                            <span
                                                className="absolute top-1 left-1 inline-flex items-center justify-center rounded-full bg-[var(--color-success)] text-white"
                                                style={{ width: 'clamp(0.875rem, 0.75rem + 0.3vw, 1rem)', height: 'clamp(0.875rem, 0.75rem + 0.3vw, 1rem)' }}
                                                title={t('legende.heuresCoursGenerees')}
                                            >
                                                <CheckCircle2 className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                        {c.statut !== 'VALIDE' && (
                                            <span
                                                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-[var(--color-text-muted)] text-white"
                                                style={{ width: 'clamp(0.875rem, 0.75rem + 0.3vw, 1rem)', height: 'clamp(0.875rem, 0.75rem + 0.3vw, 1rem)' }}
                                                title={t('legende.creneauAttente')}
                                            >
                                                <Clock className="h-2 w-2" />
                                            </span>
                                        )}
                                        {/* Matière + badge classe */}
                                        <div className="flex items-center gap-1">
                                            <p
                                                className="font-semibold truncate"
                                                style={{
                                                    fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)',
                                                    color: texteCouleur,
                                                    textShadow: `0 1px 2px rgba(0,0,0,0.15), 0 0 4px ${pal?.fondTeinte ?? 'transparent'}`,
                                                }}
                                            >
                                                {c.affectationMatiere?.matiere?.nom ?? '—'}
                                            </p>
                                            {c.affectationMatiere?.classeAnnee?.classe?.nom && (
                                                <span
                                                    className="shrink-0 rounded-md px-1 font-medium"
                                                    style={{
                                                        fontSize: 'clamp(0.5rem, 0.45rem + 0.1vw, 0.625rem)',
                                                        backgroundColor: pal?.fondTeinte ?? 'var(--color-dominant-100)',
                                                        color: pal?.texteSurTeinte ?? 'var(--color-dominant-700)',
                                                        border: `1px solid ${pal?.bordure ?? 'var(--color-dominant-300)'}`,
                                                    }}
                                                >
                                                    {c.affectationMatiere.classeAnnee.classe.nom}
                                                </span>
                                            )}
                                        </div>
                                        {/* Enseignant + salle — icônes compactes */}
                                        <div className="flex flex-wrap items-center gap-x-[var(--gap-xs)] gap-y-0">
                                            {c.affectationMatiere?.enseignant && (
                                                <span className="flex items-center gap-0.5 truncate" style={{ color: texteSecondaire, textShadow: ombreSecondaire }}>
                                                    <User className="h-3 w-3 shrink-0" />
                                                    <span style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                                        {c.affectationMatiere?.enseignant?.utilisateur?.profil?.prenom} {c.affectationMatiere?.enseignant?.utilisateur?.profil?.nom}
                                                    </span>
                                                </span>
                                            )}
                                            {c.salle && (
                                                <span className="flex items-center gap-0.5" style={{ color: texteSecondaire, textShadow: ombreSecondaire }}>
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                                        {c.salle.nom}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        {/* Horaire + type */}
                                        <div className="flex items-center gap-1">
                                            <span
                                                style={{
                                                    fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)',
                                                    color: texteSecondaire,
                                                    textShadow: ombreSecondaire,
                                                }}
                                            >
                                                {c.heureDebut?.slice(0, 5)} — {c.heureFin?.slice(0, 5)}
                                            </span>
                                            {c.typeCreneau && c.typeCreneau !== 'COURS' && (
                                                <span
                                                    className="rounded px-1"
                                                    style={{
                                                        fontSize: 'clamp(0.4375rem, 0.4rem + 0.1vw, 0.5625rem)',
                                                        backgroundColor: 'var(--color-accent-100)',
                                                        color: 'var(--color-accent-700)',
                                                    }}
                                                >
                                                    {t(`creneau.types.${c.typeCreneau.toLowerCase()}`)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Notes */}
                                        {c.notes && (
                                            <span
                                                className="flex items-center gap-0.5 italic truncate"
                                                style={{
                                                    fontSize: 'clamp(0.4375rem, 0.4rem + 0.1vw, 0.5625rem)',
                                                    color: texteSecondaire,
                                                    textShadow: ombreSecondaire,
                                                }}
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

            {/* Légende */}
            {creneauxJour.length > 0 && <EDTLegend joursFeries={joursFeries} />}
        </div>
    );
}
