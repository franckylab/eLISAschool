import { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useEnseignantEdt } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { EdtCreneau } from '../../types/enseignant.types';

const JOURS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_LABEL: Record<string, string> = {
    LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi',
    JEUDI: 'Jeudi', VENDREDI: 'Vendredi', SAMEDI: 'Samedi',
};

interface Props {
    enseignantId: string;
    isActive: boolean;
}

export function OngletMatieresPlanning({ enseignantId, isActive }: Props) {
    const now = new Date();
    const semaine = now.toISOString().split('T')[0];
    const { data, isLoading, refetch } = useEnseignantEdt(enseignantId, semaine);

    const jours = useMemo(() => {
        if (!data?.jours) return [];
        return JOURS_ORDER
            .filter(j => data.jours[j] && data.jours[j].length > 0)
            .map(j => ({
                id: j,
                nom: JOURS_LABEL[j] || j,
                creneaux: (data.jours[j] || []).sort(
                    (a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || '')
                ),
            }));
    }, [data]);

    const totalCreneaux = Object.values(data?.jours ?? {}).flat().length;

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message="Chargement du planning..." /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Planning hebdomadaire</span>
                    <span className="text-xs text-gray-400">
                        Semaine du {new Date(semaine).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-xs text-gray-400">· {totalCreneaux} créneau{totalCreneaux > 1 ? 'x' : ''}</span>
                </div>
                <ElisaButton variant="ghost" size="sm" onClick={() => refetch()}>
                    Actualiser
                </ElisaButton>
            </div>

            {jours.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                    <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">Aucun cours cette semaine</p>
                    <p className="mt-1 text-sm text-gray-500">Le planning hebdomadaire est vide.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="grid auto-cols-fr grid-flow-col border-b border-gray-200">
                        {jours.map(j => (
                            <div
                                key={j.id}
                                className="border-r border-gray-200 bg-gray-50 p-3 text-center last:border-r-0"
                            >
                                <p className="text-sm font-semibold text-gray-700">{j.nom}</p>
                                <p className="text-xs text-gray-400">{j.creneaux.length} cours</p>
                            </div>
                        ))}
                        <div className="border-r border-gray-200 bg-gray-50 p-3 text-center last:border-r-0">
                            <p className="text-sm font-semibold text-gray-700">Résumé</p>
                            <p className="text-xs text-gray-400">{totalCreneaux} total</p>
                        </div>
                    </div>

                    {jours.map(j => (
                        <div key={j.id} className="border-b border-gray-100 last:border-b-0">
                            <div className="space-y-1 p-3">
                                {j.creneaux.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-gray-400">—</p>
                                ) : (
                                    j.creneaux.map(c => (
                                        <CreneauCard key={c.id} creneau={c} />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CreneauCard({ creneau }: { creneau: EdtCreneau }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: '#3b82f6' }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                        {creneau.matiere?.nom || creneau.matiereId.slice(0, 8)}
                    </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {creneau.heureDebut?.slice(0, 5)} - {creneau.heureFin?.slice(0, 5)}
                </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {creneau.classe?.nom && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                        {creneau.classe.nom}
                    </span>
                )}
                {creneau.salle?.nom && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {creneau.salle.nom}
                    </span>
                )}
            </div>
        </div>
    );
}
