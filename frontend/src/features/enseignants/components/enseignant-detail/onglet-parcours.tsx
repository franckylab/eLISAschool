import { Route, Briefcase, BookOpen, Star, Ban, TrendingUp, FileText } from 'lucide-react';
import { useEnseignantParcours } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';

export function OngletParcours({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { data, isLoading } = useEnseignantParcours(enseignantId);
    const parcours = isActive ? data : undefined;

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message="Chargement du parcours..." /></div>;
    }

    if (!parcours) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
                <Route className="mb-3 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-600">Parcours non disponible</p>
                <p className="mt-1 text-sm text-gray-500">Les données de parcours complet ne sont pas encore disponibles.</p>
            </div>
        );
    }

    const anneesService = parcours.anciennete?.annees ?? 0;
    const nbContrats = parcours.contrats?.length ?? 0;
    const nbAffectations = parcours.affectations?.length ?? 0;
    const nbEvaluations = parcours.evaluations?.length ?? 0;
    const nbAbsences = parcours.statistiquesAbsences?.totalAbsences ?? 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <ParcoursCard icon={Briefcase} label="Années de service" value={`${anneesService} an${anneesService > 1 ? 's' : ''}`} color="blue" />
                <ParcoursCard icon={FileText} label="Contrats" value={nbContrats} color="purple" />
                <ParcoursCard icon={BookOpen} label="Affectations" value={nbAffectations} color="green" />
                <ParcoursCard icon={Star} label="Évaluations" value={nbEvaluations} color="yellow" />
                <ParcoursCard icon={Ban} label="Absences" value={nbAbsences} color="red" />
            </div>

            {parcours.evolutionSalariale && parcours.evolutionSalariale.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Évolution salariale
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Salaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parcours.evolutionSalariale.map((s: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">
                                            {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-900">
                                            {s.montant?.toLocaleString() ?? s.salaire?.toLocaleString() ?? '—'} FCFA
                                        </td>
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

function ParcoursCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
        purple: 'bg-purple-50 text-purple-800 border-purple-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        red: 'bg-red-50 text-red-800 border-red-200',
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
            <Icon className="mb-2 h-5 w-5" />
            <p className="text-xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs font-medium">{label}</p>
        </div>
    );
}
