import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { useRetirerMatiereProgramme, useModifierMatiereProgramme } from '../hooks/use-matieres';
import { ProgrammeMatiereModal } from '@/features/programmes/components/programme-matiere-modal';
import type { ProgrammeMatiere } from '@/features/programmes/types/programme.types';

interface TabProgrammeProps {
    programmesPedagogiques: ProgrammeMatiere[] | undefined;
    isLoadingPP: boolean;
    matiereId: string;
    matiereNom: string;
}

export function TabProgramme({
    programmesPedagogiques, isLoadingPP,
    matiereId, matiereNom,
}: TabProgrammeProps) {
    const { hasPermission } = usePermissions();
    const retirer = useRetirerMatiereProgramme();
    const modifier = useModifierMatiereProgramme();

    const [pmModalOpen, setPmModalOpen] = useState(false);
    const [editPmId, setEditPmId] = useState<string | null>(null);
    const [editCoeff, setEditCoeff] = useState<number | ''>('');
    const [editVol, setEditVol] = useState<number | ''>('');
    const [editOblig, setEditOblig] = useState(true);
    const [deletePmId, setDeletePmId] = useState<string | null>(null);

    const canWrite = hasPermission('programmes:config:write') || hasPermission('config:edit');

    const existingMatieres = programmesPedagogiques?.map(pm => ({
        matiereNiveauId: pm.matiereNiveauId,
        programmeId: pm.programmeId,
    })) || [];

    const programmeIds = [...new Set(programmesPedagogiques?.map(pm => pm.programmeId) || [])];

    const handleEdit = (pm: ProgrammeMatiere) => {
        setEditPmId(pm.id);
        setEditCoeff(pm.coefficient ?? '');
        setEditVol(pm.volumeHoraire ?? '');
        setEditOblig(pm.obligatoire);
    };

    const handleSaveEdit = async () => {
        if (!editPmId) return;
        await modifier.mutateAsync({
            id: editPmId,
            coefficient: editCoeff !== '' ? Number(editCoeff) : undefined,
            volumeHoraire: editVol !== '' ? Number(editVol) : undefined,
            obligatoire: editOblig,
        });
        setEditPmId(null);
    };

    const handleDelete = async () => {
        if (!deletePmId) return;
        await retirer.mutateAsync(deletePmId);
        setDeletePmId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-200">
                        Programmes pédagogiques qui incluent cette matière (avec surcharges éventuelles)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {programmesPedagogiques?.length || 0} programme(s)
                    </span>
                    {canWrite && (
                        <ElisaButton variant="primary" size="sm"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => setPmModalOpen(true)}
                        >
                            Ajouter
                        </ElisaButton>
                    )}
                </div>
            </div>

            {isLoadingPP ? (
                <LoadingState message="Chargement des programmes pédagogiques..." />
            ) : !programmesPedagogiques || programmesPedagogiques.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <BookMarked className="h-12 w-12 text-gray-400 dark:text-gray-100 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Aucun programme pédagogique</p>
                    <p className="text-sm text-gray-500 dark:text-gray-200">
                        Cette matière n'est incluse dans aucun programme pédagogique.
                        Utilisez le bouton "Ajouter" pour l'inclure.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {programmesPedagogiques.map((pm) => {
                        const niveau = pm.matiereNiveau?.niveau;
                        const isEditing = editPmId === pm.id;

                        return (
                            <div key={pm.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-sm transition-shadow"
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                                <BookMarked className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-200">
                                                        {pm.programme?.nom || pm.programmeId}
                                                    </h4>
                                                    <span className="text-xs font-mono text-gray-400 dark:text-gray-100">{pm.programme?.code}</span>
                                                    {pm.programme?.actif === false && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">Inactif</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-200 mt-0.5">
                                                    {niveau?.nom || ''} {pm.matiereNiveau?.groupe ? `- ${pm.matiereNiveau.groupe.nom}` : ''}
                                                    {pm.matiereNiveau?.filiere ? ` (${pm.matiereNiveau.filiere.nom})` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {canWrite && !isEditing && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEdit(pm)}
                                                    className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="Modifier les surcharges"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeletePmId(pm.id)}
                                                    className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Retirer du programme"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">
                                                Modifier les surcharges pour ce programme
                                            </h5>
                                            <div className="grid grid-cols-3 gap-4 mb-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-200 mb-1">
                                                        Coefficient
                                                    </label>
                                                    <input type="number" step="0.5" min="0"
                                                        value={editCoeff}
                                                        onChange={(e) => setEditCoeff(e.target.value ? Number(e.target.value) : '')}
                                                        placeholder="Hérité"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-200 mb-1">
                                                        Volume horaire
                                                    </label>
                                                    <input type="number" step="1" min="0"
                                                        value={editVol}
                                                        onChange={(e) => setEditVol(e.target.value ? Number(e.target.value) : '')}
                                                        placeholder="Hérité"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-end pb-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox"
                                                            checked={editOblig}
                                                            onChange={(e) => setEditOblig(e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Obligatoire</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <ElisaButton variant="outline" size="sm"
                                                    onClick={() => setEditPmId(null)}
                                                >
                                                    Annuler
                                                </ElisaButton>
                                                <ElisaButton variant="primary" size="sm"
                                                    isLoading={modifier.isPending}
                                                    onClick={handleSaveEdit}
                                                >
                                                    Enregistrer
                                                </ElisaButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="text-gray-500 dark:text-gray-200">Coeff:</span>
                                                <span className={`font-semibold ${pm.coefficient != null ? 'text-blue-600' : 'text-gray-400 dark:text-gray-100'}`}>
                                                    {pm.coefficient ?? 'Hérité'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="text-gray-500 dark:text-gray-200">Volume:</span>
                                                <span className={`font-semibold ${pm.volumeHoraire != null ? 'text-blue-600' : 'text-gray-400 dark:text-gray-100'}`}>
                                                    {pm.volumeHoraire ? `${pm.volumeHoraire}h` : 'Hérité'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="text-gray-500 dark:text-gray-200">Statut:</span>
                                                {pm.obligatoire ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle className="h-3 w-3" /> Obligatoire
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                                                        <XCircle className="h-3 w-3" /> Optionnel
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="text-gray-500 dark:text-gray-200">Ordre:</span>
                                                <span className="font-mono text-xs text-gray-600 dark:text-gray-300">#{pm.ordre}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ProgrammeMatiereModal
                open={pmModalOpen}
                onOpenChange={(v) => { if (!v) setPmModalOpen(false); }}
                matiereId={matiereId}
                matiereNom={matiereNom}
                programmeIds={programmeIds}
                existingMatieres={existingMatieres}
            />

            <ConfirmationModal
                isOpen={!!deletePmId}
                title="Retirer du programme"
                message="Êtes-vous sûr de vouloir retirer cette matière du programme pédagogique ?"
                details="La matière ne sera plus associée à ce programme. Les données de configuration existantes ne seront pas affectées."
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeletePmId(null)}
                isLoading={retirer.isPending}
            />
        </div>
    );
}
