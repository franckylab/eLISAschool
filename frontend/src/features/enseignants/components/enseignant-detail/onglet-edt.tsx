import { useState, useMemo } from 'react';
import { Calendar, List, Grid3X3, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useEnseignantEdt } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import type { EdtCreneau, EdtEnseignant } from '../../types/enseignant.types';

interface CreneaAvecJour extends EdtCreneau {
    _jour: string;
    _jourIdx: number;
}

const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function getSemaine(semaine: Date, decalage: number): Date {
    const d = new Date(semaine);
    d.setDate(d.getDate() + decalage * 7);
    return d;
}

function lundiDeLaSemaine(date: Date): Date {
    const d = new Date(date);
    const jour = d.getDay();
    const diff = jour === 0 ? -6 : 1 - jour;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatSemaineLabel(date: Date): string {
    const debut = lundiDeLaSemaine(date);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${debut.toLocaleDateString('fr-FR', opts)} - ${fin.toLocaleDateString('fr-FR', opts)}`;
}

export function OngletEdt({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const [semaineRef, setSemaineRef] = useState(() => lundiDeLaSemaine(new Date()));
    const [vue, setVue] = useState<'grille' | 'liste'>('grille');
    const semaineStr = semaineRef.toISOString().split('T')[0];

    const { data, isLoading } = useEnseignantEdt(enseignantId, isActive ? semaineStr : undefined);
    const edt = (isActive ? data : undefined) as EdtEnseignant | undefined;

    const creneauxTrie: CreneaAvecJour[] = useMemo(() => {
        if (!edt?.jours) return [];
        return Object.entries(edt.jours)
            .sort(([a], [b]) => JOURS.indexOf(a.slice(0, 3).toUpperCase()) - JOURS.indexOf(b.slice(0, 3).toUpperCase()))
            .flatMap(([jour, creneaux]) => {
                const idx = JOURS.indexOf(jour.slice(0, 3).toUpperCase());
                return (creneaux as EdtCreneau[]).map(c => ({ ...c, _jour: JOURS_LONG[idx], _jourIdx: idx }));
            });
    }, [edt]);

    const semaines = [
        { decalage: -2, label: 'J-2' },
        { decalage: -1, label: 'Semaine dernière' },
        { decalage: 0, label: 'Cette semaine' },
        { decalage: 1, label: 'Semaine prochaine' },
        { decalage: 2, label: 'J+2' },
    ];

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message="Chargement de l'emploi du temps..." /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <select
                        value={semaineRef.toISOString().split('T')[0]}
                        onChange={(e) => setSemaineRef(new Date(e.target.value))}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                    >
                        {semaines.map((s) => (
                            <option key={s.decalage} value={getSemaine(semaineRef, s.decalage).toISOString().split('T')[0]}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm font-medium text-gray-700">{formatSemaineLabel(semaineRef)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setSemaineRef(getSemaine(semaineRef, -1))}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setSemaineRef(lundiDeLaSemaine(new Date()))}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
                        Aujourd'hui
                    </button>
                    <button onClick={() => setSemaineRef(getSemaine(semaineRef, 1))}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="ml-2 flex rounded-lg border border-gray-200">
                        <button onClick={() => setVue('grille')}
                            className={`rounded-l-lg p-2 ${vue === 'grille' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setVue('liste')}
                            className={`rounded-r-lg p-2 ${vue === 'liste' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {!edt?.jours || Object.keys(edt.jours).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                    <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">Aucun cours programmé</p>
                    <p className="mt-1 text-sm text-gray-500">Aucun créneau pour cette semaine.</p>
                </div>
            ) : (
                <>
                    {vue === 'grille' ? (
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="grid grid-cols-7 border-b border-gray-200">
                                {JOURS.map((j) => (
                                    <div key={j} className="border-r border-gray-200 bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600 last:border-r-0">
                                        {j}
                                    </div>
                                ))}
                                {JOURS.map((j) => {
                                    const creneauxJour = (edt.jours as Record<string, EdtCreneau[]>)[j.toLowerCase()] ?? [];
                                    return (
                                        <div key={`c-${j}`} className="min-h-[200px] border-r border-gray-200 p-1.5 last:border-r-0">
                                            {creneauxJour.length === 0 ? (
                                                <p className="mt-8 text-center text-xs text-gray-400">—</p>
                                            ) : (
                                                creneauxJour.map((c: EdtCreneau) => (
                                                    <div key={c.id}
                                                        className="mb-1.5 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-2 text-xs"
                                                    >
                                                        <p className="font-medium text-blue-800">{c.matiere?.nom || c.matiereId}</p>
                                                        <p className="text-blue-600">{c.classe?.nom || '-'}</p>
                                                        <p className="mt-0.5 text-blue-500">
                                                            {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                                        </p>
                                                        {c.salle?.nom && (
                                                            <p className="mt-0.5 inline-flex items-center gap-0.5 text-blue-400">
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
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Jour</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Matière</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600">Classe</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600">Horaire</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600">Salle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {creneauxTrie.map((c: CreneaAvecJour) => (
                                        <tr key={c.id} className="hover:bg-gray-50/80">
                                            <td className="px-4 py-3 font-medium text-gray-700">{c._jour}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{c.matiere?.nom || c.matiereId}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{c.classe?.nom || '-'}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">
                                                {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">{c.salle?.nom || '-'}</td>
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
