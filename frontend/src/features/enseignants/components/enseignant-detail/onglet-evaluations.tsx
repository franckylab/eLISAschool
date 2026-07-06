import { Star } from 'lucide-react';
import { useEnseignantEvaluations, useEnseignantMoyenneEvaluations } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import type { EvaluationEnseignant } from '../../types/enseignant.types';

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR');
}

export function OngletEvaluations({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { data: evaluations, isLoading: evLoading } = useEnseignantEvaluations(enseignantId);
    const { data: moyenne, isLoading: moyLoading } = useEnseignantMoyenneEvaluations(enseignantId);
    const evals = isActive ? (evaluations ?? []) : [];
    const moy = isActive ? moyenne : undefined;

    if ((evLoading || moyLoading) && isActive) {
        return <div className="py-12"><LoadingState message="Chargement des évaluations..." /></div>;
    }

    return (
        <div className="space-y-5">
            {moy && moy.total > 0 && (
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-purple-200 p-3">
                            <Star className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-700">Moyenne des évaluations</p>
                            <p className="text-3xl font-bold text-purple-800">
                                {moy.moyenne.toFixed(1)} <span className="text-base font-normal">/ 5</span>
                            </p>
                            <p className="text-xs text-purple-600">{moy.total} évaluation(s)</p>
                        </div>
                    </div>
                </div>
            )}

            {evals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                    <Star className="mb-3 h-12 w-12 text-gray-300" />
                    <p className="font-medium text-gray-600">Aucune évaluation</p>
                    <p className="mt-1 text-sm text-gray-500">Les évaluations pédagogiques apparaîtront ici une fois soumises.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Catégorie</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Note</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Évaluateur</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Commentaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {evals.map((e: EvaluationEnseignant) => (
                                    <tr key={e.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-600">{formatDate(e.dateEvaluation)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                {e.categorie}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-semibold ${
                                                e.note >= 4 ? 'text-green-600' : e.note >= 3 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {e.note.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{e.evaluateur ? `${e.evaluateur.prenom} ${e.evaluateur.nom}` : '-'}</td>
                                        <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{e.commentaire || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
