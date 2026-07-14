import { useState, useMemo } from 'react';
import {
    BookOpen, CheckCircle, XCircle, Users, Clock, Plus,
    Edit, Trash2, Filter, LayoutList, Columns3, CalendarDays,
} from 'lucide-react';
import { useEnseignantAffectationsMatiere, useCreerAffectationEnseignant, useModifierAffectationEnseignant, useSupprimerAffectationEnseignant, useToggleActifAffectation } from '../../hooks/use-enseignants';
import { AffectationFormModal } from './affectation-form-modal';
import { OngletMatieresKanban } from './onglet-matieres-kanban';
import { OngletMatieresPlanning } from './onglet-matieres-planning';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Badge } from '@/components/ui/Badge';
import type { AffectationEnseignant, AffectationPayload } from '../../types/enseignant.types';

function formatAnnee(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
}

export function OngletMatieres({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { data, isLoading } = useEnseignantAffectationsMatiere(enseignantId);
    const affectations = isActive ? (data ?? []) : [];

    const creerAffectation = useCreerAffectationEnseignant();
    const modifierAffectation = useModifierAffectationEnseignant();
    const supprimerAffectation = useSupprimerAffectationEnseignant();
    const toggleActif = useToggleActifAffectation();

    const [mode, setMode] = useState<'table' | 'kanban' | 'planning'>('table');
    const [formOpen, setFormOpen] = useState(false);
    const [editingAffectation, setEditingAffectation] = useState<AffectationEnseignant | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AffectationEnseignant | null>(null);
    const [filterClasse, setFilterClasse] = useState<string>('');

    const filtered = useMemo(() => {
        if (!filterClasse) return affectations;
        return affectations.filter(a => a.classeAnnee?.classe?.nom === filterClasse);
    }, [affectations, filterClasse]);

    const classesUniques = useMemo(() => {
        const set = new Set<string>();
        affectations.forEach(a => { if (a.classeAnnee?.classe?.nom) set.add(a.classeAnnee.classe.nom); });
        return Array.from(set).sort();
    }, [affectations]);

    const totalEffectif = affectations.reduce((s, a) => s + (a.effectifActuel ?? 0), 0);
    const totalVolHoraire = affectations.reduce((s, a) => s + (a.volumeHoraireHebdo ?? 0), 0);
    const heuresMax = 24;
    const tauxCharge = heuresMax > 0 ? Math.min(totalVolHoraire / heuresMax, 1) : 0;

    const handleAdd = () => {
        setEditingAffectation(null);
        setFormOpen(true);
    };

    const handleEdit = (a: AffectationEnseignant) => {
        setEditingAffectation(a);
        setFormOpen(true);
    };

    const handleSave = async (payload: AffectationPayload) => {
        try {
            if (editingAffectation) {
                await modifierAffectation.mutateAsync({
                    id: editingAffectation.id,
                    enseignantId,
                    dateDebut: payload.dateDebut,
                    dateFin: payload.dateFin,
                    actif: payload.actif,
                    coefficient: payload.coefficient,
                });
            } else {
                await creerAffectation.mutateAsync(payload);
            }
            setFormOpen(false);
        } catch { /* handled by hooks */ }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await supprimerAffectation.mutateAsync({ id: deleteTarget.id, enseignantId });
            setDeleteTarget(null);
        } catch { /* handled by hooks */ }
    };

    const handleToggleActif = async (a: AffectationEnseignant) => {
        try {
            await toggleActif.mutateAsync({ id: a.id, actif: !a.actif, enseignantId });
        } catch { /* handled by hooks */ }
    };

    const isPending = creerAffectation.isPending || modifierAffectation.isPending || supprimerAffectation.isPending || toggleActif.isPending;

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message="Chargement des matières..." /></div>;
    }

    return (
        <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Matières" value={affectations.length} color="blue" />
                <MiniStat label="Classes" value={classesUniques.length} color="purple" />
                <MiniStat label="Effectif total" value={totalEffectif} color="green" />
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Charge horaire</p>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{totalVolHoraire}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {heuresMax}h</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                tauxCharge > 0.85 ? 'bg-red-500' : tauxCharge > 0.65 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${tauxCharge * 100}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {tauxCharge > 0.85 ? 'Charge élevée' : tauxCharge > 0.65 ? 'Charge modérée' : 'Charge normale'}
                    </p>
                </div>
            </div>

            {/* View toggle + Actions bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setMode('table')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'table' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <LayoutList className="h-4 w-4" /> Tableau
                        </button>
                        <button
                            onClick={() => setMode('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'kanban' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Columns3 className="h-4 w-4" /> Kanban
                        </button>
                        <button
                            onClick={() => setMode('planning')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'planning' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <CalendarDays className="h-4 w-4" /> Planning
                        </button>
                    </div>
                    {mode === 'table' && (
                        <>
                            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <select
                                value={filterClasse}
                                onChange={(e) => setFilterClasse(e.target.value)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="">Toutes les classes</option>
                                {classesUniques.map((nom) => (
                                    <option key={nom} value={nom}>{nom}</option>
                                ))}
                            </select>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {filtered.length} / {affectations.length} affectation{affectations.length !== 1 ? 's' : ''}
                            </span>
                        </>
                    )}
                </div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
                    Ajouter une matière
                </ElisaButton>
            </div>

            {mode === 'planning' ? (
                <OngletMatieresPlanning
                    enseignantId={enseignantId}
                    isActive={isActive}
                />
            ) : mode === 'table' ? (
                filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 dark:border-gray-600 dark:bg-gray-800">
                        <BookOpen className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium text-gray-600 dark:text-gray-400">
                            {affectations.length === 0 ? 'Aucune matière assignée' : 'Aucune affectation pour ce filtre'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                            {affectations.length === 0
                                ? 'Cliquez sur "Ajouter une matière" pour assigner un enseignement.'
                                : 'Essayez un autre filtre.'}
                        </p>
                        {affectations.length === 0 && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd} className="mt-4">
                                Ajouter une matière
                            </ElisaButton>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Matière</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Classe</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Année scolaire</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                                            <span className="inline-flex items-center gap-1">
                                                Coeff.
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Vol.
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="h-3 w-3" /> Eff.
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Période</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Statut</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filtered.map((a: AffectationEnseignant) => (
                                        <tr key={a.id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors ${!a.actif ? 'opacity-60' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: a.matiere?.couleur || '#6b7280' }}
                                                    />
                                                    <span className="font-medium">{a.matiere?.nom || a.matiereId.slice(0, 8)}</span>
                                                    {a.matiere?.code && (
                                                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">({a.matiere.code})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{a.classeAnnee?.classe?.nom || '-'}</td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{a.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                            <td className="px-4 py-3 text-center font-semibold">
                                                <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                    {a.coefficient ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-gray-700 dark:text-gray-300">{a.volumeHoraireHebdo ?? '—'}h</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{a.effectifActuel ?? '—'}</td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                                <span className="whitespace-nowrap">{a.dateDebut ? formatAnnee(a.dateDebut) : '-'}</span>
                                                {a.dateFin && (
                                                    <span className="whitespace-nowrap"> → {formatAnnee(a.dateFin)}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {a.actif ? (
                                                    <Badge variant="success" dot>Actif</Badge>
                                                ) : (
                                                    <Badge variant="secondary" dot>Inactif</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(a)}
                                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-gray-500 dark:hover:bg-blue-900/30"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActif(a)}
                                                        className={`rounded-lg p-1.5 transition-colors ${
                                                            a.actif
                                                                ? 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 dark:text-gray-500 dark:hover:bg-yellow-900/30'
                                                                : 'text-green-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30'
                                                        }`}
                                                        title={a.actif ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {a.actif ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(a)}
                                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors dark:text-gray-500 dark:hover:bg-red-900/30"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <OngletMatieresKanban
                    enseignantId={enseignantId}
                    isActive={isActive}
                    onRequestAdd={handleAdd}
                />
            )}

            {/* Form modal */}
            <AffectationFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                enseignantId={enseignantId}
                affectation={editingAffectation}
                onSave={handleSave}
                isLoading={isPending}
            />

            {/* Delete confirmation */}
            <ConfirmationModal
                isOpen={!!deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isLoading={supprimerAffectation.isPending}
                title="Supprimer l'affectation"
                message={
                    deleteTarget
                        ? `Retirer ${deleteTarget.matiere?.nom || 'cette matière'} pour la classe ${deleteTarget.classeAnnee?.classe?.nom || '?'} ?`
                        : ''
                }
                variant="danger"
                confirmLabel="Supprimer"
            />
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-800 border-blue-200',
        purple: 'bg-purple-50 text-purple-800 border-purple-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        orange: 'bg-orange-50 text-orange-800 border-orange-200',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}