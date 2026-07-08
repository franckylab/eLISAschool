import { useMemo } from 'react';
import { Route, Briefcase, BookOpen, Star, Ban, TrendingUp, FileText, Calendar } from 'lucide-react';
import { useEnseignantParcours } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';

function formatDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

export function OngletParcours({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { data, isLoading } = useEnseignantParcours(enseignantId);
    const parcours = isActive ? data : undefined;

    const timeline = useMemo(() => {
        if (!parcours) return [];
        const events: Array<{ date: string; type: string; title: string; description: string; icon: any; color: string }> = [];

        (parcours.contrats || []).forEach((c: any) => {
            events.push({
                date: c.dateDebut,
                type: 'contrat',
                title: `Contrat ${c.typeContrat || ''}`,
                description: `Salaire: ${c.salaireBase?.toLocaleString() || '—'} FCFA`,
                icon: FileText,
                color: 'blue',
            });
        });

        (parcours.affectations || []).forEach((a: any) => {
            events.push({
                date: a.dateDebut,
                type: 'affectation',
                title: `Affectation: ${a.matiere?.nom || 'Matière'}`,
                description: a.classe?.nom ? `Classe: ${a.classe.nom}` : '',
                icon: BookOpen,
                color: 'green',
            });
        });

        (parcours.evaluations || []).forEach((e: any) => {
            events.push({
                date: e.dateEvaluation,
                type: 'evaluation',
                title: `Évaluation: ${e.note?.toFixed(1) || '—'}/20`,
                description: e.categorie || '',
                icon: Star,
                color: 'purple',
            });
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [parcours]);

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
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <ParcoursCard icon={Briefcase} label="Années de service" value={`${anneesService} an${anneesService > 1 ? 's' : ''}`} color="blue" />
                <ParcoursCard icon={FileText} label="Contrats" value={nbContrats} color="purple" />
                <ParcoursCard icon={BookOpen} label="Affectations" value={nbAffectations} color="green" />
                <ParcoursCard icon={Star} label="Évaluations" value={nbEvaluations} color="yellow" />
                <ParcoursCard icon={Ban} label="Absences" value={nbAbsences} color="red" />
            </div>

            {/* Timeline */}
            {timeline.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Chronologie du parcours
                    </h3>
                    <div className="relative space-y-0">
                        {timeline.slice(0, 20).map((event, i) => {
                            const Icon = event.icon;
                            const colorMap: Record<string, string> = {
                                blue: 'border-blue-400 bg-blue-100 text-blue-600',
                                green: 'border-green-400 bg-green-100 text-green-600',
                                purple: 'border-purple-400 bg-purple-100 text-purple-600',
                                yellow: 'border-yellow-400 bg-yellow-100 text-yellow-600',
                                red: 'border-red-400 bg-red-100 text-red-600',
                            };
                            const borderColor = `border-l-${event.color}-400`;
                            return (
                                <div key={i} className="relative flex gap-4 pb-6 pl-8 last:pb-0">
                                    {/* Ligne verticale */}
                                    {i < timeline.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
                                    )}
                                    {/* Cercle icône */}
                                    <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${colorMap[event.color] || colorMap.blue}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {/* Contenu */}
                                    <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                            <span className="shrink-0 text-xs text-gray-500">{formatDate(event.date)}</span>
                                        </div>
                                        {event.description && (
                                            <p className="mt-0.5 text-xs text-gray-600">{event.description}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {timeline.length > 20 && (
                            <p className="pt-2 text-center text-xs text-gray-500">
                                +{timeline.length - 20} événement{timeline.length - 20 > 1 ? 's' : ''} supplémentaires
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Salary evolution */}
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
        blue: 'border-blue-200 bg-blue-50 text-blue-800',
        purple: 'border-purple-200 bg-purple-50 text-purple-800',
        green: 'border-green-200 bg-green-50 text-green-800',
        yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
        red: 'border-red-200 bg-red-50 text-red-800',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
            <Icon className="mb-2 h-5 w-5 opacity-70" />
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
    );
}
