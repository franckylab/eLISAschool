import { CheckCircle, XCircle } from 'lucide-react';
import { useEnseignantAbsences, useEnseignantAssiduite } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import type { AbsenceEnseignant } from '../../types/enseignant.types';

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR');
}

export function OngletAbsences({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const absences = useEnseignantAbsences(enseignantId);
    const assiduite = useEnseignantAssiduite(enseignantId);

    if ((absences.isLoading || assiduite.isLoading) && isActive) {
        return <div className="py-12"><LoadingState message="Chargement des absences..." /></div>;
    }

    const items = isActive ? (absences.data?.items ?? []) : [];
    const assiduiteData = isActive ? assiduite.data : undefined;
    const total = absences.data?.total ?? 0;

    return (
        <div className="space-y-5">
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
                    <MiniCard label="Justifiées" value={items.filter((a: AbsenceEnseignant) => a.statutJustification === 'JUSTIFIE').length} color="green" />
                    <MiniCard label="Non justifiées" value={items.filter((a: AbsenceEnseignant) => a.statutJustification !== 'JUSTIFIE').length} color="yellow" />
                </div>
            ) : null}

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-300 bg-green-50 py-16">
                    <CheckCircle className="mb-3 h-12 w-12 text-green-400" />
                    <p className="font-medium text-green-800">Aucune absence enregistrée</p>
                    <p className="mt-1 text-sm text-green-600">Cet enseignant a un excellent taux de présence.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">Liste des absences ({total})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Motif</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Justifiée</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Horaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((a: AbsenceEnseignant) => (
                                    <tr key={a.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-700">{formatDate(a.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{a.type}</span>
                                        </td>
                                        <td className="px-4 py-3">{a.motif || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {a.statutJustification === 'JUSTIFIE' || a.statutJustification === 'EN_COURS' ? (
                                                <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="mx-auto h-4 w-4 text-red-500" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600 text-xs">
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
        red: 'bg-red-50 text-red-800 border-red-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        orange: 'bg-orange-50 text-orange-800 border-orange-200',
    };
    return (
        <div className={`rounded-lg border p-4 ${colors[color] || colors.red}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs font-medium">{label}</p>
        </div>
    );
}

function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        red: 'bg-red-50 text-red-800 border-red-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    };
    return (
        <div className={`rounded-lg border p-3 text-center ${colors[color] || colors.red}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs font-medium">{label}</p>
        </div>
    );
}
