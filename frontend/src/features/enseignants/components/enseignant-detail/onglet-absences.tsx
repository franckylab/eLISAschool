import { useMemo } from 'react';
import { CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEnseignantAbsences, useEnseignantAssiduite } from '../../hooks/use-enseignants';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { MiniPieChart } from '@/components/charts/MiniPieChart';
import { LoadingState } from '@/components/feedback';
import type { AbsenceEnseignant } from '../../types/enseignant.types';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR');
}

export function OngletAbsences({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const absences = useEnseignantAbsences(enseignantId);
    const assiduite = useEnseignantAssiduite(enseignantId);

    const items = isActive ? (absences.data?.items ?? []) : [];
    const assiduiteData = isActive ? assiduite.data : undefined;
    const total = absences.data?.total ?? 0;

    const absencesParMois = useMemo(() => {
        const grouped: Record<string, number> = {};
        items.forEach((a: AbsenceEnseignant) => {
            const d = new Date(a.date);
            const key = MOIS[d.getMonth()];
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped).map(([label, value]) => ({ label, value }));
    }, [items]);

    const justifiees = items.filter((a: AbsenceEnseignant) => a.statutJustification === 'JUSTIFIE').length;
    const nonJustifiees = items.length - justifiees;

    const pieData = [
        { label: 'Justifiées', value: justifiees, color: '#10B981' },
        { label: 'Non justifiées', value: nonJustifiees, color: '#EF4444' },
    ];

    if ((absences.isLoading || assiduite.isLoading) && isActive) {
        return <div className="py-12"><LoadingState message="Chargement des absences..." /></div>;
    }

    return (
        <div className="space-y-5">
            {/* Stats cards */}
            {assiduiteData ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <AssiduiteCard label="Total absences" value={assiduiteData.totalAbsences} color="red" />
                    <AssiduiteCard label="Justifiées" value={assiduiteData.justifiees} color="green" />
                    <AssiduiteCard label="Non justifiées" value={assiduiteData.nonJustifiees} color="yellow" />
                    <AssiduiteCard label="Taux d'absentéisme" value={`${(assiduiteData.tauxAbsenteisme * 100).toFixed(1)}%`} color="orange" />
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    <MiniCard label="Total" value={items.length} color="red" />
                    <MiniCard label="Justifiées" value={justifiees} color="green" />
                    <MiniCard label="Non justifiées" value={nonJustifiees} color="yellow" />
                </div>
            ) : null}

            {items.length > 0 && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {absencesParMois.length > 1 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                Tendance des absences
                            </h4>
                            <MiniBarChart data={absencesParMois} height={160} />
                        </div>
                    )}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Répartition justifiées / non justifiées
                        </h4>
                        <div className="flex justify-center">
                            <MiniPieChart data={pieData} size={140} innerRadius={30} showLegend />
                        </div>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-300 bg-green-50 py-16">
                    <CheckCircle className="mb-3 h-12 w-12 text-green-400" />
                    <p className="font-medium text-green-800">Aucune absence enregistrée</p>
                    <p className="mt-1 text-sm text-green-600">Cet enseignant a un excellent taux de présence.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Liste des absences ({total})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Motif</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Justifiée</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Horaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {items.map((a: AbsenceEnseignant) => (
                                    <tr key={a.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(a.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">{a.type}</span>
                                        </td>
                                        <td className="px-4 py-3">{a.motif || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {a.statutJustification === 'JUSTIFIE' || a.statutJustification === 'EN_COURS' ? (
                                                <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="mx-auto h-4 w-4 text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 text-xs dark:text-gray-400">
                                            {a.heureDebut ? `${a.heureDebut.slice(0, 5)}-${a.heureFin?.slice(0, 5) || ''}` : '—'}
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

function AssiduiteCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        red: 'from-red-50 to-red-100 border-red-200 text-red-800',
        green: 'from-green-50 to-green-100 border-green-200 text-green-800',
        yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800',
        orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
    };
    return (
        <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color] || colors.orange}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function MiniCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        red: 'bg-red-50 text-red-800 border-red-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}
