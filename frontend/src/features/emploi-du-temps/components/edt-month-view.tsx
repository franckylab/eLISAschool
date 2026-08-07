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
import { Calendar, Star, CheckCircle2, Clock, Check, MapPin, User } from 'lucide-react';
import { formatDateInput } from '@/lib/date-utils';
import { paletteCreneau } from '@/lib/palette-creneau';
import type { CreneauHoraire, JourSemaine, JourFerie } from '../types/edt.types';
import { estJourFerieFromList } from '../hooks/use-jours-feries';

interface EDTMonthViewProps {
    creneaux: CreneauHoraire[];
    mois: Date;
    onCreneauClick?: (creneau: CreneauHoraire) => void;
    onDateClick?: (date: Date) => void;
    /** Clic sur le "+N" : ouvre la liste complète des créneaux du jour */
    onPlusNClick?: (creneaux: CreneauHoraire[], jourIndex: number) => void;
    /** Afficher tous les créneaux (pas de limite 3) */
    showAll?: boolean;
    /** Jours fériés à afficher */
    joursFeries?: JourFerie[];
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

export function EDTMonthView({ creneaux, mois, onCreneauClick, onDateClick, onPlusNClick, showAll = false, joursFeries = [] }: EDTMonthViewProps) {
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

    const cellClass = (jour: Date, jfEstFerie?: boolean) => {
        const estMoisCourant = jour.getMonth() === moisCourant;
        const estAujourdhui = toLocalDateStr(jour) === aujourdhui;
        const base = `min-h-[clamp(60px,10vw,90px)] border border-gray-300 dark:border-[var(--color-bordure)] p-[var(--space-xxs)] transition-colors`;
        if (estAujourdhui) return `${base} bg-[var(--color-dominant-50)] ring-2 ring-[var(--color-dominant-400)]/60`;
        if (!estMoisCourant) return `${base} bg-[var(--color-surface-alt)] opacity-50`;
        if (jfEstFerie) return `${base} bg-[var(--color-danger)]/5 hover:bg-[var(--color-danger)]/8`;
        return `${base} bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]`;
    };

    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            <div className="overflow-x-auto">
                <div style={{ minWidth: 'min(100%, 420px)' }}>
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
                    const jfInfo = estMoisCourant ? estJourFerieFromList(jour, joursFeries) : { estFerie: false };

                    return (
                        <div
                            key={idx}
                            className={cellClass(jour, jfInfo.estFerie)}
                            onClick={() => estMoisCourant && onDateClick?.(jour)}
                            role={estMoisCourant ? 'button' : undefined}
                            title={jfInfo.estFerie ? jfInfo.nom : undefined}
                        >
                            {/* Numéro du jour — cercle coloré si aujourd'hui */}
                            <div className="mb-[var(--space-xxs)] flex items-center gap-0.5">
                                {(() => {
                                    const estAujourdhui = toLocalDateStr(jour) === aujourdhui;
                                    if (estAujourdhui) {
                                        return (
                                            <span
                                                className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-600)] font-bold text-white"
                                                style={{
                                                    width: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.625rem)',
                                                    height: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.625rem)',
                                                    fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.75rem)',
                                                }}
                                            >
                                                {jour.getDate()}
                                            </span>
                                        );
                                    }
                                    return (
                                        <span
                                            className={`font-medium ${
                                                estMoisCourant ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                                            }`}
                                            style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.75rem)' }}
                                        >
                                            {jour.getDate()}
                                        </span>
                                    );
                                })()}
                                {/* Indicateur jour férié : étoile + nom abrégé */}
                                {jfInfo.estFerie && (
                                    <span className="flex items-center gap-0.5 shrink-0" title={jfInfo.nom}>
                                        <Star
                                            className="h-2.5 w-2.5 shrink-0 fill-current"
                                            style={{ color: jfInfo.couleur || 'var(--color-danger)' }}
                                        />
                                        <span
                                            className="truncate max-w-[3rem] hidden lg:inline"
                                            style={{
                                                fontSize: 'clamp(0.4375rem, 0.4rem + 0.12vw, 0.5625rem)',
                                                lineHeight: 1,
                                                color: jfInfo.couleur || 'var(--color-danger)',
                                            }}
                                        >
                                            {jfInfo.nom}
                                        </span>
                                    </span>
                                )}
                            </div>

                            {/* Créneaux (max 3 sauf si showAll) */}
                            {estMoisCourant && creneauxJour.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                    {(showAll ? creneauxJour : creneauxJour.slice(0, 3)).map((c) => {
                                        const couleur = c.affectationMatiere?.matiere?.couleur;
                                        const pal = couleur ? paletteCreneau(couleur) : null;
                                        const enseignantInitiales = c.affectationMatiere?.enseignant?.utilisateur?.profil
                                            ? `${c.affectationMatiere.enseignant.utilisateur.profil.prenom?.[0] ?? ''}${c.affectationMatiere.enseignant.utilisateur.profil.nom?.[0] ?? ''}`.toUpperCase()
                                            : '';
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCreneauClick?.(c);
                                                }}
                                                className={`rounded px-1 py-0.5 text-left transition-opacity hover:opacity-85 relative shadow-sm overflow-hidden ${
                                                    c.hasHeuresCours ? 'ring-1 ring-inset ring-white/20' : ''
                                                } ${c.statut === 'PLANIFIE' ? 'opacity-75' : ''}`}
                                                style={{
                                                    fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)',
                                                    backgroundColor: pal?.fondAssombri ?? 'var(--color-dominant-700)',
                                                    color: pal?.texteSurFond ?? '#ffffff',
                                                    borderLeft: c.statut === 'VALIDE' ? '2px solid var(--color-success)' : pal ? `2px solid ${pal.bordure}` : undefined,
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
                                                {/* L1 : horaire + matière tronquée + statut */}
                                                <div className="flex items-center gap-0.5 truncate">
                                                    <span className="font-semibold shrink-0">{c.heureDebut?.slice(0, 5)}</span>
                                                    <span className="truncate">{c.affectationMatiere?.matiere?.nom?.slice(0, 8) ?? '•'}</span>
                                                    {c.statut === 'VALIDE'
                                                        ? <Check className="shrink-0 inline-block h-2.5 w-2.5 ml-auto" strokeWidth={3} />
                                                        : <Clock className="shrink-0 inline-block h-2 w-2 ml-auto opacity-60" />
                                                    }
                                                </div>
                                                {/* L2 : initiales enseignant + salle (si disponibles, masqué sur très petits écrans) */}
                                                {(enseignantInitiales || c.salle?.nom) && (
                                                    <div className="hidden sm:flex items-center gap-1 mt-px opacity-80 truncate" style={{ fontSize: 'clamp(0.4375rem, 0.4rem + 0.1vw, 0.5rem)' }}>
                                                        {enseignantInitiales && (
                                                            <span className="flex items-center gap-px shrink-0">
                                                                <User className="h-1.5 w-1.5" />
                                                                {enseignantInitiales}
                                                            </span>
                                                        )}
                                                        {c.salle?.nom && (
                                                            <span className="flex items-center gap-px truncate">
                                                                <MapPin className="h-1.5 w-1.5 shrink-0" />
                                                                <span className="truncate">{c.salle.nom}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Pastille HC discrète */}
                                                {c.hasHeuresCours && (
                                                    <CheckCircle2 className="absolute bottom-0 right-0.5 h-1.5 w-1.5 opacity-70" />
                                                )}
                                            </button>
                                        );
                                    })}
                                    {!showAll && creneauxJour.length > 3 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlusNClick?.(creneauxJour, colIndex);
                                            }}
                                            className="font-medium text-[var(--color-dominant-600)] hover:underline cursor-pointer text-left"
                                            style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)' }}
                                        >
                                            +{creneauxJour.length - 3}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                    </div>
                </div>
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
