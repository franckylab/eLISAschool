/**
 * ==================================
 * eLISAschool - Vue Liste EDT (DataTable)
 * ==================================
 * Tableau structuré avec colonnes triables, responsive cartes mobile
 * Colonnes : Jour | Horaire | Matière | Enseignant | Classe | Salle | Type | Statut
 * Version: 2.0.0
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CreneauHoraire, JourSemaine } from '../types/edt.types';

interface EDTListeViewProps {
    creneaux: CreneauHoraire[];
    onCreneauClick?: (creneau: CreneauHoraire) => void;
}

type ColonneTri = 'jour' | 'horaire' | 'matiere' | 'enseignant' | 'classe' | 'salle' | 'type' | 'statut';
type OrdreTri = 'asc' | 'desc';

const JOURS_ORDRE: Record<JourSemaine, number> = {
    LUNDI: 0, MARDI: 1, MERCREDI: 2, JEUDI: 3, VENDREDI: 4, SAMEDI: 5,
};

export function EDTListeView({ creneaux, onCreneauClick }: EDTListeViewProps) {
    const { t } = useTranslation('emplois');
    const [colonneTri, setColonneTri] = useState<ColonneTri>('jour');
    const [ordreTri, setOrdreTri] = useState<OrdreTri>('asc');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const toggleTri = (col: ColonneTri) => {
        if (colonneTri === col) {
            setOrdreTri(o => o === 'asc' ? 'desc' : 'asc');
        } else {
            setColonneTri(col);
            setOrdreTri('asc');
        }
    };

    const creneauxTries = useMemo(() => {
        const sorted = [...creneaux].sort((a, b) => {
            let cmp = 0;
            switch (colonneTri) {
                case 'jour':
                    cmp = (JOURS_ORDRE[a.jour] ?? 0) - (JOURS_ORDRE[b.jour] ?? 0);
                    break;
                case 'horaire':
                    cmp = a.heureDebut.localeCompare(b.heureDebut);
                    break;
                case 'matiere':
                    cmp = (a.affectationMatiere?.matiere?.nom ?? '').localeCompare(b.affectationMatiere?.matiere?.nom ?? '');
                    break;
                case 'enseignant': {
                    const ea = a.affectationMatiere?.enseignant;
                    const eb = b.affectationMatiere?.enseignant;
                    cmp = (`${ea?.prenom ?? ''} ${ea?.nom ?? ''}`).localeCompare(`${eb?.prenom ?? ''} ${eb?.nom ?? ''}`);
                    break;
                }
                case 'classe':
                    cmp = (a.affectationMatiere?.classeAnnee?.classe?.nom ?? '').localeCompare(
                        b.affectationMatiere?.classeAnnee?.classe?.nom ?? ''
                    );
                    break;
                case 'salle':
                    cmp = (a.salle?.nom ?? '').localeCompare(b.salle?.nom ?? '');
                    break;
                case 'type':
                    cmp = a.typeCreneau.localeCompare(b.typeCreneau);
                    break;
                case 'statut':
                    cmp = a.statut.localeCompare(b.statut);
                    break;
            }
            return ordreTri === 'asc' ? cmp : -cmp;
        });
        return sorted;
    }, [creneaux, colonneTri, ordreTri]);

    // Reset page 1 quand les données ou le tri changent
    const totalPages = Math.max(1, Math.ceil(creneauxTries.length / ITEMS_PER_PAGE));
    const creneauxPagines = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return creneauxTries.slice(start, start + ITEMS_PER_PAGE);
    }, [creneauxTries, page]);

    // Reset page si hors limites
    if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
    }

    const TriIcon = ({ col }: { col: ColonneTri }) => {
        if (colonneTri !== col) return <ArrowUpDown className="h-3 w-3 text-[var(--color-text-muted)]" />;
        return ordreTri === 'asc'
            ? <ArrowUp className="h-3 w-3 text-[var(--color-dominant-600)]" />
            : <ArrowDown className="h-3 w-3 text-[var(--color-dominant-600)]" />;
    };

    const thClass =
        'px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors select-none';
    const thStyle = { fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' };

    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {/* ─── Desktop Table ────────────────────── */}
            <div className="hidden sm:block rounded-xl border border-[var(--color-bordure)] overflow-hidden">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-[var(--color-surface-alt)]">
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('jour')}>
                                <span className="flex items-center gap-1">{t('jour')} <TriIcon col="jour" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('horaire')}>
                                <span className="flex items-center gap-1">{t('horaire')} <TriIcon col="horaire" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('matiere')}>
                                <span className="flex items-center gap-1">{t('matiere')} <TriIcon col="matiere" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('enseignant')}>
                                <span className="flex items-center gap-1">{t('enseignant')} <TriIcon col="enseignant" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('classe')}>
                                <span className="flex items-center gap-1">{t('classe')} <TriIcon col="classe" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('salle')}>
                                <span className="flex items-center gap-1">{t('salle')} <TriIcon col="salle" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('type')}>
                                <span className="flex items-center gap-1">Type <TriIcon col="type" /></span>
                            </th>
                            <th className={thClass} style={thStyle} onClick={() => toggleTri('statut')}>
                                <span className="flex items-center gap-1">Statut <TriIcon col="statut" /></span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {creneauxPagines.map((c, i) => (
                            <tr
                                key={c.id}
                                className={`${i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-alt)]'} ${
                                    onCreneauClick ? 'cursor-pointer hover:bg-[var(--color-surface-hover)]' : ''
                                } transition-colors`}
                                onClick={() => onCreneauClick?.(c)}
                            >
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] font-medium text-[var(--color-text-primary)]">
                                    {t(`jours.${c.jour.toLowerCase()}`)}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] font-mono text-[var(--color-text-primary)]">
                                    {c.heureDebut}–{c.heureFin}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)]">
                                    <div className="flex items-center gap-[var(--gap-xs)]">
                                        {c.couleur && (
                                            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.couleur }} />
                                        )}
                                        <span className="text-[var(--color-text-primary)] truncate max-w-[120px]">
                                            {c.affectationMatiere?.matiere?.nom ?? '—'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-secondary)] truncate max-w-[120px]">
                                    {c.affectationMatiere?.enseignant
                                        ? `${c.affectationMatiere.enseignant.prenom} ${c.affectationMatiere.enseignant.nom}`
                                        : '—'}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-secondary)] truncate max-w-[100px]">
                                    {c.affectationMatiere?.classeAnnee?.classe?.nom ?? '—'}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-secondary)]">
                                    {c.salle?.nom ?? '—'}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)]">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                                        {t(`creneau.types.${c.typeCreneau.toLowerCase()}`)}
                                    </span>
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)]">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                        c.statut === 'VALIDE'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                        {c.statut === 'VALIDE' ? t('heureCours.modal.statuts.effectue') : t('heureCours.modal.statuts.planifie')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Mobile Cards ─────────────────────── */}
            <div className="sm:hidden flex flex-col gap-[var(--gap-sm)]">
                {creneauxPagines.map(c => (
                    <button
                        key={c.id}
                        onClick={() => onCreneauClick?.(c)}
                        className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                    >
                        <div className="flex items-center justify-between mb-[var(--gap-xs)]">
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                {c.couleur && (
                                    <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.couleur }} />
                                )}
                                <span className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                    {c.affectationMatiere?.matiere?.nom ?? '—'}
                                </span>
                            </div>
                            <span className="font-mono text-xs text-[var(--color-text-muted)]">
                                {c.heureDebut}–{c.heureFin}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-[var(--gap-sm)] gap-y-1 text-xs text-[var(--color-text-secondary)]">
                            <span className="font-medium text-[var(--color-dominant-700)]">{t(`jours.${c.jour.toLowerCase()}`)}</span>
                            {c.affectationMatiere?.enseignant && (
                                <span className="flex items-center gap-0.5">
                                    <User className="h-3 w-3" />
                                    {c.affectationMatiere.enseignant.prenom} {c.affectationMatiere.enseignant.nom}
                                </span>
                            )}
                            {c.salle && (
                                <span className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {c.salle.nom}
                                </span>
                            )}
                            <span className="ml-auto">
                                {t(`creneau.types.${c.typeCreneau.toLowerCase()}`)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-[var(--space-sm)] py-[var(--space-xs)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                    <span
                        className="text-[var(--color-text-muted)]"
                        style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                    >
                        {t('liste.pagination', { page, totalPages, total: creneauxTries.length })}
                    </span>
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-xxs)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={t('navigation.precedent')}
                        >
                            <ChevronLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        </button>
                        {/* Numéros de page */}
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`min-w-[clamp(1.5rem,1.25rem+1vw,2rem)] h-[clamp(1.5rem,1.25rem+1vw,2rem)] rounded-lg text-xs font-medium transition-colors ${
                                            pageNum === page
                                                ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-xxs)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label={t('navigation.suivant')}
                        >
                            <ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
