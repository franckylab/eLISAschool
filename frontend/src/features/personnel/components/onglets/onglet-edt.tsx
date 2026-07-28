import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, List, Grid3X3, MapPin } from 'lucide-react';
import { useCreneaux } from '@/features/emploi-du-temps';
import { LoadingState } from '@/components/feedback';
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
        return <div className="py-12"><LoadingState message={t('edt.chargement')} /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t('edt.titre')}</span>
                    <span className="text-xs text-muted-foreground">({t('edt.creneauxCount', { count: creneaux.length })})</span>
                </div>
                <div className="flex rounded-lg border border-border">
                    <button onClick={() => setVue('grille')}
                        className={`rounded-l-lg p-2 ${vue === 'grille' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                        <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setVue('liste')}
                        className={`rounded-r-lg p-2 ${vue === 'liste' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                    <Calendar className="mb-3 h-12 w-12 text-muted-foreground" />
                    <p className="font-medium text-secondary">{t('edt.aucunCours')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('edt.aucunCreneauDesc')}</p>
                </div>
            ) : (
                <>
                    {vue === 'grille' ? (
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <div className="grid grid-cols-7 border-b border-border">
                                {JOURS.map((j) => (
                                    <div key={j} className="border-r border-border bg-muted p-2 text-center text-xs font-semibold text-muted-foreground last:border-r-0">
                                        {j}
                                    </div>
                                ))}
                                {JOURS.map((j) => {
                                    const jourKey = Object.keys(JOURS_MAP).find(k => JOURS_MAP[k] === j) || j;
                                    const creneauxJour = grouped[jourKey] ?? [];
                                    return (
                                        <div key={`c-${j}`} className="min-h-[200px] border-r border-border p-1.5 last:border-r-0">
                                            {creneauxJour.length === 0 ? (
                                                <p className="mt-8 text-center text-xs text-muted-foreground">—</p>
                                            ) : (
                                                creneauxJour.map((c) => (
                                                    <div key={c.id}
                                                        className="mb-1.5 rounded-lg border-l-4 border-[var(--color-dominant-400)] bg-[var(--color-dominant-50)] p-2 text-xs"
                                                    >
                                                        <p className="font-medium text-[var(--color-dominant-800)]">{c.affectationMatiere?.matiere?.nom || c.matiereId || '—'}</p>
                                                        <p className="text-[var(--color-dominant-600)]">{c.affectationMatiere?.classeAnnee?.classe?.nom || '-'}</p>
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
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('edt.colJour')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('edt.colMatiere')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('edt.colClasse')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('edt.colHoraire')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('edt.colSalle')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {creneauxTrie.map((c) => (
                                        <tr key={c.id} className="hover:bg-muted">
                                            <td className="px-4 py-3 font-medium text-foreground">{c._jour}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{c.affectationMatiere?.matiere?.nom || c.matiereId || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.affectationMatiere?.classeAnnee?.classe?.nom || '-'}</td>
                                            <td className="px-4 py-3 text-center text-foreground">
                                                {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{c.salle?.nom || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
