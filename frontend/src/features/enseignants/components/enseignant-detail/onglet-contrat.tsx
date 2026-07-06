import { Briefcase, FileText } from 'lucide-react';
import { useEnseignantContrats, useEnseignantBulletins } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import type { ContratEnseignant, BulletinPaie } from '../../types/enseignant.types';

function formatDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
}

const LABELS_CONTRAT: Record<string, string> = {
    cdi: 'CDI', cdd: 'CDD', CDI: 'CDI', CDD: 'CDD',
    vacataire: 'Vacataire', stage: 'Stage',
};

const COULEURS_CONTRAT: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800',
    EXPIRE: 'bg-gray-100 text-gray-600',
    ROMPU: 'bg-red-100 text-red-800',
    RENEGOCIE: 'bg-blue-100 text-blue-800',
};

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function OngletContrat({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const contrats = useEnseignantContrats(enseignantId);
    const bulletins = useEnseignantBulletins(enseignantId);

    if ((contrats.isLoading || bulletins.isLoading) && isActive) {
        return <div className="py-12"><LoadingState message="Chargement des contrats et salaires..." /></div>;
    }

    const contratsData = isActive ? (contrats.data ?? []) : [];
    const bulletinsData = isActive ? (bulletins.data ?? []) : [];

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Contrats
                </h3>
                {contratsData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">Aucun contrat enregistré.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Début</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Fin</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Salaire</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contratsData.map((c: ContratEnseignant) => (
                                    <tr key={c.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium">
                                            {LABELS_CONTRAT[c.typeContrat] || c.typeContrat}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700">{formatDate(c.dateDebut)}</td>
                                        <td className="px-4 py-3 text-center text-gray-700">{c.dateFin ? formatDate(c.dateFin) : '—'}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-900">
                                            {c.salaireBase != null ? `${c.salaireBase.toLocaleString()} FCFA` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS_CONTRAT[c.statut] || 'bg-gray-100 text-gray-700'}`}>
                                                {c.statut === 'ACTIF' ? 'Actif' : c.statut === 'EXPIRE' ? 'Expiré' : c.statut === 'ROMPU' ? 'Rompue' : c.statut === 'RENEGOCIE' ? 'Renégocié' : c.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <FileText className="h-5 w-5 text-green-600" />
                    Bulletins de paie
                </h3>
                {bulletinsData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">Aucun bulletin de paie émis.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Période</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Salaire base</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Primes</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Retenues</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Net à payer</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bulletinsData.map((b: BulletinPaie) => (
                                    <tr key={b.id} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {MOIS[b.mois - 1]} {b.annee}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-700">{b.salaireBase.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center text-green-600 font-medium">+{b.primes.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center text-red-500 font-medium">-{b.deductions.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{b.salaireNet.toLocaleString()} FCFA</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.statut === 'paye' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {b.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
