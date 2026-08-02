/**
 * ==================================
 * eLISAschool - Onglet Emploi du Temps (Page Personnel)
 * ==================================
 * Vue grille/liste des créneaux d'un enseignant
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, List, Grid3X3, MapPin } from 'lucide-react';
import { useCreneaux } from '@/features/emploi-du-temps';
import { SchoolLoading } from '@/components/feedback';
import type { CreneauHoraire } from '@/features/emploi-du-temps';

const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOURS_MAP: Record<string, string> = {
    LUNDI: 'LUN', MARDI: 'MAR', MERCREDI: 'MER',
    JEUDI: 'JEU', VENDREDI: 'VEN', SAMEDI: 'SAM',
};

export function OngletEdt({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const [vue, setVue] = useState<'grille' | 'liste'>('grille');

    const { data: paginated, isLoading } = useCreneaux(
        isActive ? { enseignantId, limit: 100, inclureHeuresCours: true } : { limit: 0, enseignantId }
    );
    const creneaux = paginated?.items ?? [];

    const grouped = useMemo(() => {
        const map: Record<string, CreneauHoraire[]> = {};
        for (const c of creneaux) {
            const key = c.jour?.toUpperCase() || '';
            if (!map[key]) map[key] = [];
            map[key].push(c);
        }
        for (const k of Object.keys(map)) {
            map[k].sort((a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || ''));
        }
        return map;
    }, [creneaux]);

    const creneauxTrie = useMemo(() => {
        return Object.entries(grouped)
            .sort(([a], [b]) => JOURS.indexOf(JOURS_MAP[a] || '') - JOURS.indexOf(JOURS_MAP[b] || ''))
            .flatMap(([jour, items]) => {
                const idx = JOURS.indexOf(JOURS_MAP[jour] || '');
                return items.map(c => ({ ...c, _jour: JOURS_LONG[idx] || jour, _jourIdx: idx }));
            }) as (CreneauHoraire & { _jour: string; _jourIdx: number })[];
    }, [grouped]);

    if (isLoading && isActive) {
        return <SchoolLoading variant="compact" message={t('edt.chargement')} />;
    }

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Toolbar */}
            <div
                className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]"
            >
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
                    <span
                        className="font-medium text-[var(--color-text-primary)]"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {t('edt.titre')}
                    </span>
                    <span
                        className="text-[var(--color-text-muted)]"
                        style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.75rem)' }}
                    >
                        ({t('edt.creneauxCount', { count: creneaux.length })})
                    </span>
                </div>
                <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                    <button
                        onClick={() => setVue('grille')}
                        className={`p-[var(--space-xs)] transition-colors ${
                            vue === 'grille'
                                ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-600)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                        }`}
                    >
                        <Grid3X3 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                    </button>
                    <button
                        onClick={() => setVue('liste')}
                        className={`p-[var(--space-xs)] transition-colors ${
                            vue === 'liste'
                                ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-600)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                        }`}
                    >
                        <List className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] py-[var(--space-xl)]">
                    <Calendar className="mb-[var(--space-sm)] h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-text-muted)]" />
                    <p className="font-medium text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        {t('edt.aucunCours')}
                    </p>
                    <p className="mt-1 text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        {t('edt.aucunCreneauDesc')}
                    </p>
                </div>
            ) : (
                <>
                    {vue === 'grille' ? (
                        /* ─── Vue grille ──────────────────────── */
                        <div className="overflow-hidden rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                            <div className="grid grid-cols-7 border-b border-[var(--color-bordure)]">
                                {JOURS.map((j) => (
                                    <div
                                        key={j}
                                        className="border-r border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-xxs)] text-center font-semibold text-[var(--color-text-secondary)] last:border-r-0"
                                        style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.75rem)' }}
                                    >
                                        <span className="hidden sm:inline">{j}</span>
                                        <span className="sm:hidden">{j.slice(0, 2)}</span>
                                    </div>
                                ))}
                                {JOURS.map((j) => {
                                    const jourKey = Object.keys(JOURS_MAP).find(k => JOURS_MAP[k] === j) || j;
                                    const creneauxJour = grouped[jourKey] ?? [];
                                    return (
                                        <div
                                            key={`c-${j}`}
                                            className="min-h-[clamp(120px,20vw,200px)] border-r border-[var(--color-bordure)] p-[var(--space-xxs)] last:border-r-0"
                                        >
                                            {creneauxJour.length === 0 ? (
                                                <p className="mt-8 text-center text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)' }}>—</p>
                                            ) : (
                                                creneauxJour.map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className="mb-[var(--space-xxs)] rounded-lg border-l-[3px] border-[var(--color-dominant-400)] bg-[var(--color-dominant-50)] p-[var(--space-xxs)]"
                                                        style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)' }}
                                                    >
                                                        <p className="font-medium text-[var(--color-dominant-800)] truncate">
                                                            {c.affectationMatiere?.matiere?.nom || c.matiereId || '—'}
                                                        </p>
                                                        <p className="text-[var(--color-dominant-600)] truncate">
                                                            {c.affectationMatiere?.classeAnnee?.classe?.nom || '-'}
                                                        </p>
                                                        <p className="mt-0.5 text-[var(--color-dominant-500)]">
                                                            {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                                        </p>
                                                        {c.salle?.nom && (
                                                            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[var(--color-dominant-400)]">
                                                                <MapPin className="h-3 w-3" />{c.salle.nom}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* ─── Vue liste ───────────────────────── */
                        <div className="overflow-hidden rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                            {/* Desktop table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[var(--color-surface-alt)]">
                                        <tr>
                                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)]">{t('edt.colJour')}</th>
                                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)]">{t('edt.colMatiere')}</th>
                                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)]">{t('edt.colClasse')}</th>
                                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-medium text-[var(--color-text-secondary)]">{t('edt.colHoraire')}</th>
                                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-medium text-[var(--color-text-secondary)]">{t('edt.colSalle')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-bordure)]">
                                        {creneauxTrie.map((c) => (
                                            <tr key={c.id} className="hover:bg-[var(--color-surface-alt)]">
                                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] font-medium text-[var(--color-text-primary)]">{c._jour}</td>
                                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-primary)]">
                                                    <span className="font-medium">{c.affectationMatiere?.matiere?.nom || c.matiereId || '—'}</span>
                                                </td>
                                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-secondary)]">{c.affectationMatiere?.classeAnnee?.classe?.nom || '-'}</td>
                                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center text-[var(--color-text-primary)]">
                                                    {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                                </td>
                                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center text-[var(--color-text-secondary)]">{c.salle?.nom || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden flex flex-col gap-[var(--gap-sm)] p-[var(--space-md)]">
                                {creneauxTrie.map((c) => (
                                    <div key={c.id} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] p-[var(--space-md)]">
                                        <div className="flex items-center justify-between mb-[var(--gap-xs)]">
                                            <span className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {c.affectationMatiere?.matiere?.nom || c.matiereId || '—'}
                                            </span>
                                            <span className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.75rem)' }}>
                                                {c._jour}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-[var(--gap-xs)] text-center">
                                            <div>
                                                <div className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)' }}>{t('edt.colClasse')}</div>
                                                <div className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>{c.affectationMatiere?.classeAnnee?.classe?.nom || '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)' }}>{t('edt.colHoraire')}</div>
                                                <div className="font-mono text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                                    {c.heureDebut?.slice(0, 5)}-{c.heureFin?.slice(0, 5)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)' }}>{t('edt.colSalle')}</div>
                                                <div className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>{c.salle?.nom || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
