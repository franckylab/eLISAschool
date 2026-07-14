import { useState } from 'react';
import { GraduationCap, Plus, Edit, Trash2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { usePermissions } from '@/hooks';
import { useAjouterMatiereNiveau, useModifierMatiereNiveau, useSupprimerMatiereNiveau } from '../hooks/use-matieres';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import type { MatiereNiveau } from '../types/matiere.types';

interface TabNiveauxProps {
    matiereNiveaux: MatiereNiveau[] | undefined;
    isLoading: boolean;
    matiereId: string;
    matiereNom: string;
}

export function TabNiveaux({ matiereNiveaux, isLoading, matiereId, matiereNom }: TabNiveauxProps) {
    const { hasPermission } = usePermissions();
    const { data: niveaux = [] } = useTousNiveaux();
    const { data: toutesFilieres = [] } = useToutesFilieres();
    const ajouter = useAjouterMatiereNiveau();
    const modifier = useModifierMatiereNiveau();
    const supprimer = useSupprimerMatiereNiveau();

    const canWrite = hasPermission('config:edit') || hasPermission('programmes:config:write');

    const [showAddForm, setShowAddForm] = useState(false);
    const [addNiveauId, setAddNiveauId] = useState('');
    const [addCoeff, setAddCoeff] = useState<number | ''>(1);
    const [addBareme, setAddBareme] = useState<number | ''>(20);
    const [addCredits, setAddCredits] = useState<number | ''>('');
    const [addVol, setAddVol] = useState<number | ''>('');
    const [addOblig, setAddOblig] = useState(true);
    const [addFiliereId, setAddFiliereId] = useState('');

    const [editId, setEditId] = useState<string | null>(null);
    const [editCoeff, setEditCoeff] = useState<number | ''>('');
    const [editBareme, setEditBareme] = useState<number | ''>('');
    const [editCredits, setEditCredits] = useState<number | ''>('');
    const [editVol, setEditVol] = useState<number | ''>('');
    const [editOblig, setEditOblig] = useState(true);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const existingNiveauIds = new Set(matiereNiveaux?.map(mn => mn.niveauId) || []);
    const niveauxDisponibles = niveaux.filter(n => !existingNiveauIds.has(n.id));

    const handleAdd = async () => {
        if (!addNiveauId) return;
        await ajouter.mutateAsync({
            matiereId,
            niveauId: addNiveauId,
            coefficient: addCoeff !== '' ? Number(addCoeff) : undefined,
            bareme: addBareme !== '' ? Number(addBareme) : undefined,
            credits: addCredits !== '' ? Number(addCredits) : undefined,
            volumeHoraire: addVol !== '' ? Number(addVol) : undefined,
            obligatoire: addOblig,
            filiereId: addFiliereId || undefined,
        });
        setShowAddForm(false);
        setAddNiveauId('');
        setAddCoeff(1);
        setAddBareme(20);
        setAddCredits('');
        setAddVol('');
        setAddOblig(true);
        setAddFiliereId('');
    };

    const handleStartEdit = (mn: MatiereNiveau) => {
        setEditId(mn.id);
        setEditCoeff(mn.coefficient ?? '');
        setEditBareme(mn.bareme ?? '');
        setEditCredits(mn.credits ?? '');
        setEditVol(mn.volumeHoraire ?? '');
        setEditOblig(mn.obligatoire);
    };

    const handleSaveEdit = async () => {
        if (!editId) return;
        await modifier.mutateAsync({
            id: editId,
            matiereId,
            coefficient: editCoeff !== '' ? Number(editCoeff) : undefined,
            bareme: editBareme !== '' ? Number(editBareme) : undefined,
            credits: editCredits !== '' ? Number(editCredits) : undefined,
            volumeHoraire: editVol !== '' ? Number(editVol) : undefined,
            obligatoire: editOblig,
        });
        setEditId(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await supprimer.mutateAsync({ id: deleteId, matiereId });
        setDeleteId(null);
    };

    const maxVolume = matiereNiveaux && matiereNiveaux.length > 0
        ? Math.max(...matiereNiveaux.map(p => p.volumeHoraire || 0)) : 0;

    if (isLoading) {
        return <div className="py-12"><LoadingState message="Chargement du programme matière-niveau..." /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-200">
                        Niveaux dans lesquels <strong>{matiereNom}</strong> est enseignée
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {matiereNiveaux?.length || 0} niveau(x)
                    </span>
                    {canWrite && !showAddForm && (
                        <ElisaButton variant="primary" size="sm"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => setShowAddForm(true)}
                        >
                            Ajouter
                        </ElisaButton>
                    )}
                </div>
            </div>

            {showAddForm && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-blue-800">Ajouter un niveau</h4>
                        <button onClick={() => setShowAddForm(false)}
                            className="rounded-lg p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <ElisaSelect
                            label="Niveau"
                            value={addNiveauId}
                            onValueChange={setAddNiveauId}
                            placeholder="Sélectionner..."
                            options={niveauxDisponibles.map(n => ({
                                value: n.id,
                                label: `${n.nom} ${n.filiere ? `(${n.filiere.nom})` : ''}`,
                            }))}
                        />
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Coefficient</label>
                            <input type="number" step="0.5" min="0" value={addCoeff}
                                onChange={e => setAddCoeff(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Barème</label>
                            <input type="number" min="1" value={addBareme}
                                onChange={e => setAddBareme(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Crédits</label>
                            <input type="number" min="0" step="1" value={addCredits}
                                onChange={e => setAddCredits(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Optionnel"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Vol. horaire (h)</label>
                            <input type="number" min="0" value={addVol}
                                onChange={e => setAddVol(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Optionnel"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <ElisaSelect
                            label="Filière"
                            value={addFiliereId}
                            onValueChange={setAddFiliereId}
                            placeholder="Optionnel"
                            options={toutesFilieres.map(f => ({
                                value: f.id,
                                label: `${f.nom} (${f.code})`,
                            }))}
                        />
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={addOblig}
                                    onChange={e => setAddOblig(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Obligatoire</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <ElisaButton variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton variant="primary" size="sm"
                            isLoading={ajouter.isPending}
                            disabled={!addNiveauId}
                            onClick={handleAdd}
                        >
                            <Save className="h-4 w-4 mr-1" /> Ajouter
                        </ElisaButton>
                    </div>
                </div>
            )}

            {!matiereNiveaux || matiereNiveaux.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <GraduationCap className="h-12 w-12 text-gray-400 dark:text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Aucun niveau associé</p>
                    <p className="text-sm text-gray-500 dark:text-gray-200">
                        Ajoutez cette matière au programme d'un niveau en cliquant sur "Ajouter".
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Niveau</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Coeff.</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Barème</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Credits</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Vol. horaire</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Oblig.</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                                    {canWrite && <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {matiereNiveaux.map(mn => {
                                    const isEditing = editId === mn.id;
                                    return (
                                        <tr key={mn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                {mn.niveau?.nom || mn.niveauId}
                                                {mn.filiere && <span className="text-gray-400 dark:text-gray-100 ml-1">({mn.filiere.nom})</span>}
                                                {mn.groupe && <span className="text-gray-400 dark:text-gray-100 ml-1">- {mn.groupe.nom}</span>}
                                            </td>
                                            {isEditing ? (
                                                <>
                                                    <td className="px-4 py-3 text-center">
                                                        <input type="number" step="0.5" min="0" value={editCoeff}
                                                            onChange={e => setEditCoeff(e.target.value ? Number(e.target.value) : '')}
                                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input type="number" min="1" value={editBareme}
                                                            onChange={e => setEditBareme(e.target.value ? Number(e.target.value) : '')}
                                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input type="number" min="0" value={editCredits}
                                                            onChange={e => setEditCredits(e.target.value ? Number(e.target.value) : '')}
                                                            placeholder="—"
                                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input type="number" min="0" value={editVol}
                                                            onChange={e => setEditVol(e.target.value ? Number(e.target.value) : '')}
                                                            placeholder="—"
                                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input type="checkbox" checked={editOblig}
                                                            onChange={e => setEditOblig(e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-center font-semibold">{mn.coefficient}</td>
                                                    <td className="px-4 py-3 text-center">/ {mn.bareme}</td>
                                                    <td className="px-4 py-3 text-center font-semibold">{mn.credits ?? '-'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {mn.volumeHoraire ? (
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 rounded-full transition-all"
                                                                        style={{ width: `${maxVolume > 0 ? (mn.volumeHoraire / maxVolume) * 100 : 0}%` }} />
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{mn.volumeHoraire}h</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {mn.obligatoire ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                                <CheckCircle className="h-3 w-3" /> Oblig.
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                                                                <XCircle className="h-3 w-3" /> Optionnel
                                                            </span>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    mn.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                                                    mn.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {mn.statut === 'ACTIF' ? 'Actif' : mn.statut === 'EN_ATTENTE_VALIDATION' ? 'En attente' : 'Inactif'}
                                                </span>
                                            </td>
                                            {canWrite && (
                                                <td className="px-4 py-3 text-center">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={handleSaveEdit}
                                                                className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                                                                title="Enregistrer"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => setEditId(null)}
                                                                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                                                                title="Annuler"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleStartEdit(mn)}
                                                                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                title="Modifier"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => setDeleteId(mn.id)}
                                                                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                title="Retirer ce niveau"
                message="Êtes-vous sûr de vouloir retirer cette matière de ce niveau ?"
                details="Cette action supprimera le programme matière-niveau. Les configurations et affectations liées aux classes de ce niveau ne seront pas affectées."
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
