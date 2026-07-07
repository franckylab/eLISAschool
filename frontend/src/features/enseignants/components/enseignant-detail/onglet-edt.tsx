import { useState, useMemo } from 'react';
import { Calendar, List, Grid3X3, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useCreneaux } from '@/features/emploi-du-temps';
import { LoadingState } from '@/components/feedback';
import type { Creneau } from '@/features/emploi-du-temps';

const JOURS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const JOURS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOURS_MAP: Record<string, string> = {
    LUNDI: 'LUN', MARDI: 'MAR', MERCREDI: 'MER',
    JEUDI: 'JEU', VENDREDI: 'VEN', SAMEDI: 'SAM',
};

export function OngletEdt({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const [vue, setVue] = useState<'grille' | 'liste'>('grille');

    const { data: paginated, isLoading } = useCreneaux(
        isActive ? { enseignantId, limit: 100, inclureHeuresCours: true } : { limit: 0, enseignantId }
    );
    const creneaux = paginated?.items ?? [];

    const grouped = useMemo(() => {
        const map: Record<string, Creneau[]> = {};
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
            }) as (Creneau & { _jour: string; _jourIdx: number })[];
    }, [grouped]);

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message="Chargement de l'emploi du temps..." /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Emploi du temps hebdomadaire</span>
                    <span className="text-xs text-gray-400">({creneaux.length} créneau{creneaux.length > 1 ? 'x' : ''})</span>
                </div>
                <div className="flex rounded-lg border border-gray-200">
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

            {Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                    <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">Aucun cours programmé</p>
                    <p className="mt-1 text-sm text-gray-500">Aucun créneau pour cet enseignant.</p>
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
                                    const jourKey = Object.keys(JOURS_MAP).find(k => JOURS_MAP[k] === j) || j;
                                    const creneauxJour = grouped[jourKey] ?? [];
                                    return (
                                        <div key={`c-${j}`} className="min-h-[200px] border-r border-gray-200 p-1.5 last:border-r-0">
                                            {creneauxJour.length === 0 ? (
                                                <p className="mt-8 text-center text-xs text-gray-400">—</p>
                                            ) : (
                                                creneauxJour.map((c) => (
                                                    <div key={c.id}
                                                        className="mb-1.5 rounded-lg border-l-4 border-blue-400 bg-blue-50 p-2 text-xs"
                                                    >
                                                        <p className="font-medium text-blue-800">{c.matiere?.nom || c.matiereId}</p>
                                                        <p className="text-blue-600">{c.classeAnnee?.classe?.nom || '-'}</p>
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
                                    {creneauxTrie.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/80">
                                            <td className="px-4 py-3 font-medium text-gray-700">{c._jour}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{c.matiere?.nom || c.matiereId}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{c.classeAnnee?.classe?.nom || '-'}</td>
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
